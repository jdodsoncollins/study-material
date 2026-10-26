import fs from 'node:fs';
import path from 'node:path';

const fields = ['id', 'title', 'slug', 'kind', 'track', 'difficulty', 'estimated_minutes', 'summary', 'tags', 'prerequisites', 'related', 'company_signal', 'sources_consulted', 'updated', 'status'];
const kinds = ['pattern', 'problem', 'concept', 'case-study', 'strategy', 'glossary'];

export function validateLesson(data, body, rel) {
  const errors = [];
  const fail = message => errors.push(`${rel}: ${message}`);
  for (const key of fields) if (!(key in data)) fail(`missing ${key}`);
  for (const key of Object.keys(data)) if (!fields.includes(key)) fail(`unknown field ${key}`);
  for (const key of ['id', 'title', 'slug', 'summary']) if (typeof data[key] !== 'string' || !data[key].trim()) fail(`${key} must be a nonempty string`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id)) fail('invalid stable id');
  if (data.slug !== data.id) fail('slug must equal id');
  if (!kinds.includes(data.kind)) fail('invalid kind');
  if (!['algorithms', 'cs', 'system-design', 'ai-agents'].includes(data.track)) fail('invalid track');
  if (!['intro', 'core', 'deep'].includes(data.difficulty)) fail('invalid difficulty');
  if (!Number.isInteger(data.estimated_minutes) || data.estimated_minutes < 8 || data.estimated_minutes > 25) fail('estimated_minutes must be 8–25');
  if (data.status !== 'canonical') fail('status must be canonical');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) fail('updated must be an ISO date');
  for (const key of ['tags', 'prerequisites', 'related', 'sources_consulted']) {
    if (!Array.isArray(data[key]) || data[key].some(x => typeof x !== 'string')) fail(`${key} must be a string array`);
  }
  if (!Array.isArray(data.company_signal)) fail('company_signal must be an array');
  else for (const signal of data.company_signal) {
    if (!signal?.name || !signal.evidence || !Number.isInteger(signal.year) || !['low', 'medium', 'high'].includes(signal.confidence)) fail('invalid company_signal entry');
  }
  if (Array.isArray(data.related) && data.related.length < 2) fail('related must contain at least two IDs');
  for (const tag of Array.isArray(data.tags) ? data.tags : []) {
    const pieces = tag.split('/');
    for (let i = 1; i < pieces.length; i++) if (!data.tags.includes(pieces.slice(0, i).join('/'))) fail(`tag ${tag} is missing a parent`);
  }
  const prose = body.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  const titles = [...prose.matchAll(/^# (.+)$/gm)].map(m => m[1]);
  if (titles.length !== 1 || titles[0] !== data.title) fail('body H1 must match title exactly');
  const headings = [...prose.matchAll(/^## (.+)$/gm)].map(m => m[1]);
  const pattern = ['pattern', 'problem'].includes(data.kind);
  const expected = pattern
    ? ['Snapshot', 'Prompt', 'Recognition signals', 'Worked approach', 'Complexity', 'Walkthrough', 'Pitfalls', 'Interview moves', 'Cross-links']
    : data.kind === 'case-study'
      ? ['Snapshot', 'What this round is actually scoring', 'Company signal', 'Requirements', 'Back-of-envelope', 'Design', 'Tradeoffs', 'Failure modes', 'Follow-ups an interviewer may ask', 'Cross-links']
      : ['Snapshot', 'Why it shows up in interviews', 'Core idea', headings.includes('Worked example') ? 'Worked example' : 'Comparison', 'Common mistakes', 'How to talk about it', 'Cross-links'];
  if (JSON.stringify(headings) !== JSON.stringify(expected)) fail(`H2 headings/order must be ${expected.join(' → ')}`);
  const section = name => prose.split(`## ${name}\n`)[1]?.split('\n## ')[0] ?? '';
  if (pattern) {
    for (const [name, ladder] of [['Worked approach', ['ELI5', 'Syntax', 'Then the details']], ['Walkthrough', ['Easy', 'Medium', 'Hard']]]) {
      const actual = [...section(name).matchAll(/^### (.+)$/gm)].map(m => m[1]);
      if (JSON.stringify(actual) !== JSON.stringify(ladder)) fail(`${name} must use the teaching ladder ${ladder.join(' → ')}`);
    }
  }
  if (headings.includes('Comparison') && !/^\|.+\|$/m.test(section('Comparison'))) fail('Comparison needs a table');
  for (const sample of body.matchAll(/^```ts\n([\s\S]*?)^```/gm)) {
    if (/\b(function|class)\b/.test(sample[1]) && !sample[1].includes('console.log')) fail('executable example needs a visible console.log call');
  }
  return errors;
}

export function validateLinksAndSteps(lessons, root) {
  const errors = [];
  const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
  for (const lesson of lessons) {
    const full = path.join(root, lesson.path);
    const source = fs.readFileSync(full, 'utf8');
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+\.md)\)\s*\(id: ([a-z0-9-]+)\)/g)) {
      const target = byId.get(match[2]);
      if (!target || path.resolve(path.dirname(full), match[1]) !== path.join(root, target.path)) errors.push(`${lesson.path}: link ${match[1]} does not match id ${match[2]}`);
    }
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+\.md)\)/g)) {
      if (/^https?:/.test(match[1])) continue;
      if (!fs.existsSync(path.resolve(path.dirname(full), match[1]))) errors.push(`${lesson.path}: missing linked file ${match[1]}`);
    }
    for (const widget of lesson.widgets) {
      const diagram = fs.readFileSync(path.join(root, widget.file), 'utf8');
      if (!/^```mermaid\n/m.test(diagram)) errors.push(`${widget.file}: missing mermaid fence`);
      if (!widget.steps) continue;
      const nodes = new Set([...diagram.matchAll(/(?:^|\s)([A-Za-z][\w-]*)\s*(?:\[|\{|\()/gm)].map(m => m[1]));
      const steps = fs.readFileSync(path.join(root, widget.steps), 'utf8');
      for (const match of steps.matchAll(/^\s+nodes: \[([^\]]*)\]/gm)) {
        for (const node of match[1].split(',').map(x => x.trim()).filter(Boolean)) if (!nodes.has(node)) errors.push(`${widget.steps}: highlight references missing node ${node}`);
      }
    }
  }
  return errors;
}
