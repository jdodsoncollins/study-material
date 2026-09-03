#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LESSONS = path.join(ROOT, "lessons");

function walkMd(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join("/");
    if (entry.isDirectory()) {
      if (entry.name === "viz") continue;
      out.push(...walkMd(full));
    } else if (entry.name.endsWith(".md")) {
      if (rel.includes("/viz/")) continue;
      out.push(full);
    }
  }
  return out;
}

function parseFrontmatter(text, file) {
  if (!text.startsWith("---\n")) throw new Error(`No frontmatter: ${file}`);
  const end = text.indexOf("\n---\n", 4);
  if (end < 0) throw new Error(`Unclosed frontmatter: ${file}`);
  const yaml = text.slice(4, end);
  const body = text.slice(end + 5);
  const data = {};
  let key = null;
  let list = null;
  let objList = null;
  let obj = null;
  for (const rawLine of yaml.split("\n")) {
    const line = rawLine.replace(/\t/g, "  ");
    if (!line.trim()) continue;
    const indent = line.match(/^ */)[0].length;
    if (indent === 0 && line.includes(":") && !line.startsWith("- ")) {
      objList = null;
      obj = null;
      const idx = line.indexOf(":");
      key = line.slice(0, idx);
      const rest = line.slice(idx + 1).trim();
      if (rest === "") {
        list = [];
        data[key] = list;
      } else if (rest === "[]") {
        data[key] = [];
        list = null;
      } else {
        data[key] = coerce(rest);
        list = null;
      }
    } else if (line.trim().startsWith("- ") && indent === 2 && list) {
      const item = line.trim().slice(2);
      if (item.includes(":") && !item.startsWith('"') && key === "company_signal") {
        obj = {};
        objList = list;
        const idx = item.indexOf(":");
        obj[item.slice(0, idx).trim()] = coerce(item.slice(idx + 1).trim());
        list.push(obj);
      } else {
        list.push(coerce(item));
      }
    } else if (indent >= 4 && obj && line.includes(":")) {
      const trimmed = line.trim();
      const idx = trimmed.indexOf(":");
      obj[trimmed.slice(0, idx).trim()] = coerce(trimmed.slice(idx + 1).trim());
    }
  }
  return { data, body };
}

function coerce(value) {
  if (value === "[]") return [];
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

function nestTags(tags) {
  const tree = {};
  for (const tag of tags) {
    const parts = String(tag).split("/");
    let node = tree;
    for (const part of parts) {
      node[part] ??= { children: {} };
      node = node[part].children;
    }
  }
  return tree;
}

function expectedId(file) {
  const base = path.basename(file);
  if (base === "lesson.md") return path.basename(path.dirname(file));
  return path.basename(file, ".md");
}

function lessonDir(file) {
  const base = path.basename(file);
  if (base === "lesson.md") return path.dirname(file);
  return null;
}

function collectWidgets(dirAbs, relDir) {
  const vizDir = path.join(dirAbs, "viz");
  if (!fs.existsSync(vizDir)) return { widgets: [], files: [] };
  const names = fs.readdirSync(vizDir);
  const md = names.filter((n) => n.endsWith(".md"));
  const widgets = md.map((n) => {
    const stem = n.replace(/\.md$/, "");
    const stepsName = `${stem}.steps.yaml`;
    const widget = {
      id: stem,
      kind: "mermaid",
      file: `${relDir}/viz/${n}`,
    };
    if (names.includes(stepsName)) widget.steps = `${relDir}/viz/${stepsName}`;
    return widget;
  });
  return { widgets, files: names.map((n) => `${relDir}/viz/${n}`) };
}

function vizRefs(body) {
  const ids = new Set();
  const mustache = /\{\{viz:\s*([a-z0-9-]+)\}\}/gi;
  let m;
  while ((m = mustache.exec(body))) ids.add(m[1]);
  const link = /\]\(viz\/([a-z0-9-]+)\.md\)/gi;
  while ((m = link.exec(body))) ids.add(m[1]);
  return ids;
}

const files = walkMd(LESSONS);
const lessons = [];
const errors = [];
const ids = new Set();
const allWidgetFiles = new Set();
const referenced = new Set();

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  try {
    const text = fs.readFileSync(file, "utf8");
    const { data, body } = parseFrontmatter(text, rel);
    const want = expectedId(file);
    if (data.id !== want) errors.push(`${rel}: id ${data.id} != ${want}`);
    if (ids.has(data.id)) errors.push(`${rel}: duplicate id ${data.id}`);
    ids.add(data.id);
    if (!body.includes("## Cross-links")) errors.push(`${rel}: missing ## Cross-links`);

    const dirAbs = lessonDir(file);
    const relDir = dirAbs ? path.relative(ROOT, dirAbs).split(path.sep).join("/") : null;
    const { widgets, files: wfiles } = dirAbs
      ? collectWidgets(dirAbs, relDir)
      : { widgets: [], files: [] };
    for (const f of wfiles) allWidgetFiles.add(f);
    const refs = vizRefs(body);
    for (const r of refs) referenced.add(`${relDir}/viz/${r}.md`);
    const widgetIds = new Set(widgets.map((w) => w.id));
    for (const r of refs) {
      if (!widgetIds.has(r)) errors.push(`${rel}: missing viz/${r}.md`);
    }

    lessons.push({
      id: data.id,
      title: data.title,
      slug: data.slug,
      kind: data.kind,
      track: data.track,
      difficulty: data.difficulty,
      estimated_minutes: data.estimated_minutes,
      summary: data.summary,
      tags: data.tags ?? [],
      prerequisites: data.prerequisites ?? [],
      related: data.related ?? [],
      path: rel,
      dir: relDir,
      widgets,
      company_signal: data.company_signal ?? [],
      updated: data.updated,
    });
  } catch (err) {
    errors.push(`${rel}: ${err.message}`);
  }
}

lessons.sort((a, b) => a.id.localeCompare(b.id));
const allTags = [...new Set(lessons.flatMap((l) => l.tags))].sort();

const curriculumPath = path.join(ROOT, "curriculum.json");
let curriculum = null;
try {
  curriculum = JSON.parse(fs.readFileSync(curriculumPath, "utf8"));
} catch (err) {
  errors.push(`curriculum.json: ${err.message}`);
}

if (curriculum) {
  const seen = new Set();
  const stages = curriculum.stages;
  if (!Array.isArray(stages) || stages.length === 0) {
    errors.push("curriculum.json: stages must be a non-empty array");
  } else {
    for (const stage of stages) {
      if (!stage?.id || !stage.label || !Array.isArray(stage.units)) {
        errors.push(`curriculum stage ${stage?.id ?? "?"}: missing id, label, or units`);
        continue;
      }
      for (const unit of stage.units) {
        if (!unit?.id || !unit.title || !unit.track || !Array.isArray(unit.lessons)) {
          errors.push(`curriculum unit ${unit?.id ?? "?"}: missing id, title, track, or lessons`);
          continue;
        }
        if (unit.lessons.length === 0) errors.push(`curriculum unit ${unit.id}: empty lessons`);
        for (const id of unit.lessons) {
          if (!ids.has(id)) errors.push(`curriculum.json: unknown lesson ${id} in ${unit.id}`);
          if (seen.has(id)) errors.push(`curriculum.json: lesson ${id} listed twice`);
          seen.add(id);
        }
      }
    }
    for (const id of ids) {
      if (!seen.has(id)) errors.push(`curriculum.json: lesson ${id} is not on the path`);
    }
  }
}

for (const lesson of lessons) {
  for (const id of [...lesson.related, ...lesson.prerequisites]) {
    if (!ids.has(id)) errors.push(`${lesson.path}: dangling ref ${id}`);
  }
}

for (const f of allWidgetFiles) {
  if (f.endsWith(".md") && !referenced.has(f)) {
    errors.push(`${f}: viz file never referenced`);
  }
}

const catalog = {
  version: 3,
  generated: new Date().toISOString().slice(0, 10),
  lesson_count: lessons.length,
  tags: allTags,
  tag_tree: nestTags(allTags),
  curriculum,
  lessons,
};

fs.writeFileSync(path.join(ROOT, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
if (errors.length) {
  console.error(`catalog.json wrote ${lessons.length} lessons with ${errors.length} issues:`);
  for (const e of errors) console.error(" -", e);
  process.exitCode = 1;
} else {
  console.log(`catalog.json wrote ${lessons.length} lessons, 0 issues`);
}
