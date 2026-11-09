#!/usr/bin/env node
// 从 Scion 前端源码的 html`` 模板里抽取候选文案（已在词典里的会跳过）。
// 用法：node tools/extract-ast.mjs  或用 SCION_SRC 指定 web/src 路径
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

const ATTRS = ['placeholder', 'title', 'aria-label', 'aria-description', 'alt', 'label'];
const found = new Map();
function add(s, loc) {
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (!t || t.length < 2 || t.length > 300) return;
  if (!/[A-Za-z]/.test(t) || DICT[t] !== undefined) return;
  if (/^&[a-z]+;$/i.test(t) || /^https?:|^\/|^[a-z_]+:[a-z_*]+$/i.test(t)) return;
  if (!found.has(t)) found.set(t, new Set());
  found.get(t).add(loc);
}

for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file);
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  (function visit(node) {
    if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      const loc = `${rel}:${line}`;
      let text = node.head ? node.head.text : node.text || '';
      if (node.templateSpans) for (const span of node.templateSpans) text += ' ' + span.literal.text;
      let m;
      const re = />([^<>]*)</g;
      while ((m = re.exec(text))) add(m[1], loc);
      const attrRe = new RegExp(`\\b(?:${ATTRS.join('|')})\\s*=\\s*("([^"]*)"|'([^']*)')`, 'g');
      while ((m = attrRe.exec(text))) add(m[2] ?? m[3] ?? '', loc);
    }
    ts.forEachChild(node, visit);
  })(sf);
}

const out = [...found.entries()].map(([s, l]) => ({ s, locs: [...l].slice(0, 2) }));
fs.writeFileSync(path.join(HERE, '..', 'candidates-ast.json'), JSON.stringify(out, null, 1));
console.log('candidates not in dictionary:', out.length);
out.slice(0, 20).forEach((r) => console.log(JSON.stringify(r.s)));
