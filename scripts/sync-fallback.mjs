#!/usr/bin/env node
// Writes the no-JS fallback into index.html from js/data.js, using the same
// render functions the browser runs. Optional dev helper: the site itself has
// no build step. Run after editing js/data.js:
//
//   node scripts/sync-fallback.mjs          # rewrite index.html
//   node scripts/sync-fallback.mjs --check  # exit 1 if index.html is stale
//
// It also stamps cache-busting versions: every css/js reference (in index.html
// and in JS import specifiers) gets ?v=<content hash>, so a deploy can never
// pair new HTML with stale cached CSS/JS. Hashes cascade: changing data.js
// changes main.js's import line, so main.js gets a new version too.
//
// It also lists any UPPER_SNAKE placeholders still present in data.js.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
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

/* ---------- cache-busting versions ---------- */
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 8);
const IMPORT_RE = /((?:from\s+|import\s*\(\s*)['"])(\.\/[\w-]+\.js)(?:\?v=[0-9a-f]+)?(['"])/g;
const jsDir = join(root, 'js');
const jsFiles = readdirSync(jsDir).filter((f) => f.endsWith('.js'));
const jsSrc = Object.fromEntries(jsFiles.map((f) => [f, readFileSync(join(jsDir, f), 'utf8')]));
const deps = Object.fromEntries(jsFiles.map((f) => [f, [...jsSrc[f].matchAll(IMPORT_RE)].map((m) => m[2].slice(2))]));
const version = {};
const jsOut = {};
const visit = (f, stack = []) => {
  if (version[f]) return version[f];
  if (stack.includes(f)) throw new Error(`import cycle: ${[...stack, f].join(' → ')}`);
  deps[f].forEach((d) => visit(d, [...stack, f]));
  jsOut[f] = jsSrc[f].replace(IMPORT_RE, (_, a, spec, b) => `${a}${spec}?v=${version[spec.slice(2)]}${b}`);
  return (version[f] = hash(jsOut[f]));
};
jsFiles.forEach((f) => visit(f));
version['main.css'] = hash(readFileSync(join(root, 'css', 'main.css'), 'utf8'));
out = out
  .replace(/(href|src)="(css\/main\.css|js\/[\w-]+\.js)(?:\?v=[0-9a-f]+)?"/g, (_, attr, path) => {
    const v = version[path.split('/').pop()];
    if (!v) throw new Error(`no version for ${path}`);
    return `${attr}="${path}?v=${v}"`;
  });
const staleJs = jsFiles.filter((f) => jsOut[f] !== jsSrc[f]);

const placeholders = new Set();
(function walk(v) {
  if (isPlaceholder(v)) placeholders.add(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
})(data);

if (process.argv.includes('--check')) {
  if (out !== src || staleJs.length) {
    console.error(`out of date (${[out !== src && 'index.html', ...staleJs].filter(Boolean).join(', ')}): run node scripts/sync-fallback.mjs`);
    process.exit(1);
  }
  console.log(`fallback and asset versions in sync (${keys.length} blocks)`);
} else {
  writeFileSync(file, out);
  staleJs.forEach((f) => writeFileSync(join(jsDir, f), jsOut[f]));
  console.log(`synced ${keys.length} blocks: ${keys.join(', ')}`);
  console.log(`versions: ${Object.entries(version).map(([f, v]) => `${f}@${v}`).join(' ')}`);
}
if (placeholders.size) console.log(`placeholders still open: ${[...placeholders].join(', ')}`);
