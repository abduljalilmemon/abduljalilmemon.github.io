#!/usr/bin/env node
// Writes the no-JS fallback into index.html from js/data.js, using the same
// render functions the browser runs. Optional dev helper: the site itself has
// no build step. Run after editing js/data.js:
//
//   node scripts/sync-fallback.mjs          # rewrite index.html
//   node scripts/sync-fallback.mjs --check  # exit 1 if index.html is stale
//
// It also lists any UPPER_SNAKE placeholders still present in data.js.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { data } from '../js/data.js';
import { blocks, isPlaceholder } from '../js/render.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'index.html');
const src = readFileSync(file, 'utf8');

// Replace the inner HTML of each element carrying data-render="key".
// Walks same-name tags to find the matching close tag (handles nesting).
function fill(html, key, inner) {
  const open = new RegExp(`<([a-z0-9]+)\\b[^>]*\\bdata-render="${key}"[^>]*>`, 'i');
  const m = open.exec(html);
  if (!m) throw new Error(`index.html has no data-render="${key}" element`);
  const tag = m[1];
  const start = m.index + m[0].length;
  const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'gi');
  re.lastIndex = start;
  let depth = 1, t;
  while ((t = re.exec(html))) {
    depth += t[0][1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(0, start) + inner + html.slice(t.index);
  }
  throw new Error(`unclosed <${tag}> for data-render="${key}"`);
}

const keys = [...src.matchAll(/data-render="([a-zA-Z]+)"/g)].map((m) => m[1]);
let out = src;
for (const key of keys) {
  if (!blocks[key]) throw new Error(`no render block named "${key}"`);
  out = fill(out, key, blocks[key](data));
}

const placeholders = new Set();
(function walk(v) {
  if (isPlaceholder(v)) placeholders.add(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
})(data);

if (process.argv.includes('--check')) {
  if (out !== src) { console.error('index.html fallback is out of date: run node scripts/sync-fallback.mjs'); process.exit(1); }
  console.log(`fallback in sync (${keys.length} blocks)`);
} else {
  writeFileSync(file, out);
  console.log(`synced ${keys.length} blocks: ${keys.join(', ')}`);
}
if (placeholders.size) console.log(`placeholders still open: ${[...placeholders].join(', ')}`);
