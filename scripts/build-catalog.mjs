#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LESSONS = path.join(ROOT, "lessons");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".md")) out.push(full);
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
      if (objList && obj) objList.push(obj);
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

const files = walk(LESSONS);
const lessons = [];
const errors = [];
const ids = new Set();

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  try {
    const text = fs.readFileSync(file, "utf8");
    const { data, body } = parseFrontmatter(text, rel);
    if (data.id !== path.basename(file, ".md")) {
      errors.push(`${rel}: id ${data.id} != filename`);
    }
    if (ids.has(data.id)) errors.push(`${rel}: duplicate id ${data.id}`);
    ids.add(data.id);
    if (!body.includes("## Cross-links")) errors.push(`${rel}: missing ## Cross-links`);
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
      company_signal: data.company_signal ?? [],
      updated: data.updated,
    });
  } catch (err) {
    errors.push(`${rel}: ${err.message}`);
  }
}

lessons.sort((a, b) => a.id.localeCompare(b.id));
const allTags = [...new Set(lessons.flatMap((l) => l.tags))].sort();

for (const lesson of lessons) {
  for (const id of [...lesson.related, ...lesson.prerequisites]) {
    if (!ids.has(id)) errors.push(`${lesson.path}: dangling ref ${id}`);
  }
}

const catalog = {
  version: 1,
  generated: new Date().toISOString().slice(0, 10),
  lesson_count: lessons.length,
  tags: allTags,
  tag_tree: nestTags(allTags),
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
