#!/usr/bin/env node
// Runs each practice companion's reference solution against its own test cases, so a test the
// app shows a learner can never disagree with the lesson. The starter must parse and must not pass.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'practice');
const failures = [];
let files = 0, cases = 0;

function canon(v) {
  if (v instanceof Map) return [...v.entries()].map(canon);
  if (v instanceof Set) return [...v].map(canon);
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])]));
  if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
  return v === undefined ? null : v;
}
const key = v => JSON.stringify(canon(v));
function sortDeep(v, depth) {
  if (!Array.isArray(v)) return v;
  const inner = depth > 1 ? v.map(x => sortDeep(x, depth - 1)) : v;
  return [...inner].sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
}
function passes(p, args, got, expected) {
  if (p.compare === 'validator') return vm.runInNewContext(`(${p.validator})`)(structuredClone(args), got, structuredClone(expected)) === true;
  if (p.compare === 'unordered') return key(sortDeep(got, 1)) === key(sortDeep(expected, 1));
  if (p.compare === 'nested-unordered') return key(sortDeep(got, 2)) === key(sortDeep(expected, 2));
  return key(got) === key(expected);
}
function load(source, entry, label) {
  const js = stripTypeScriptTypes(source, { mode: 'strip' });
  const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} } });
  return new vm.Script(`${js}\n;${entry}`, { filename: label }).runInContext(ctx, { timeout: 2000 });
}

for (const name of fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => n.endsWith('.json')).sort() : []) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  if (!p.cases) continue;
  files++;
  try {
    const solve = load(p.solution, p.entry, `${name}#solution`);
    for (const [i, c] of p.cases.entries()) {
      cases++;
      const got = solve(...structuredClone(c.args));
      if (!passes(p, c.args, got, c.expected)) failures.push(`${name} case ${i + 1} (${c.name ?? ''}): solution returned ${JSON.stringify(got)}, expected ${JSON.stringify(c.expected)}`);
    }
  } catch (error) { failures.push(`${name} solution: ${error.message}`); }
  try {
    const starter = load(p.starter, p.entry, `${name}#starter`);
    let all = true;
    for (const c of p.cases) {
      try { if (!passes(p, c.args, starter(...structuredClone(c.args)), c.expected)) { all = false; break; } } catch { all = false; break; }
    }
    if (all) failures.push(`${name} starter already passes every case`);
  } catch (error) { failures.push(`${name} starter does not load: ${error.message}`); }
}

if (failures.length) {
  console.error(`${failures.length} practice failures:`);
  for (const f of failures) console.error(' -', f);
  process.exitCode = 1;
} else console.log(`practice: ${files} companions, ${cases} cases, 0 failures`);
