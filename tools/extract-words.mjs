#!/usr/bin/env node
// 抽取零散短标签（表格列名、徽章、字段名）等单行文案。
// 用法：node tools/extract-words.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.env.SCION_SRC || (process.env.HOME || '') + '/src/scion/web/src';
const requireFromWeb = createRequire(path.resolve(SRC, '..', 'package.json'));
const ts = requireFromWeb('typescript');
const DICT = JSON.parse(fs.readFileSync(path.join(HERE, '../patch/zh-CN.json'), 'utf8'));

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['node_modules', '__fixtures__', 'fixtures', 'e2e'].includes(ent.name)) continue;
      walk(p, out);
    } else if (ent.name.endsWith('.ts') && !ent.name.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

const found = new Map();
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file);
  if (!/^(components|client|shared|utils)\//.test(rel)) continue;
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  (function visit(n) {
    if (ts.isTemplateExpression(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
      let text = n.head ? n.head.text : n.text || '';
      if (n.templateSpans) for (const span of n.templateSpans) text += ' ' + span.literal.text;
      let m;
      const re = />([^<>]*)</g;
      while ((m = re.exec(text))) {
        const t = m[1].replace(/\s+/g, ' ').trim();
        if (!/^[A-Za-z][A-Za-z0-9 .:!?'’()-]{1,60}$/.test(t) || !/[A-Za-z]{2,}/.test(t)) continue;
        if (DICT[t] !== undefined) continue;
        if (!found.has(t)) found.set(t, new Set());
        found.get(t).add(`${rel}:${line}`);
      }
      const attrRe = /\b(?:placeholder|title|aria-label|aria-description|alt|label|heading)\s*=\s*("([^"]*)"|'([^']*)')/g;
      while ((m = attrRe.exec(text))) {
        const v = (m[2] ?? m[3] ?? '').replace(/\s+/g, ' ').trim();
        if (!v || !/[A-Za-z]{2,}/.test(v) || DICT[v] !== undefined) continue;
        if (!found.has(v)) found.set(v, new Set());
        found.get(v).add(`${rel}:${line}`);
      }
    }
    ts.forEachChild(n, visit);
  })(sf);
}

const out = [...found.entries()].map(([s, l]) => ({ s, locs: [...l].slice(0, 2) })).sort((a, b) => a.s.localeCompare(b.s));
fs.writeFileSync(path.join(HERE, '..', 'candidates-words.json'), JSON.stringify(out, null, 1));
console.log('label candidates not in dictionary:', out.length);
out.slice(0, 20).forEach((r) => console.log(JSON.stringify(r.s), '<-', r.locs[0]));
