#!/usr/bin/env node
// Generates the social card and icon set from SVG, using headless Chrome via
// the DevTools protocol (Node 22+, no npm packages). Text comes from js/data.js.
//
//   node scripts/make-images.mjs
//   CHROME="/path/to/chrome" node scripts/make-images.mjs
//
// Writes: og.png (1200x630), favicon.svg, favicon.ico (16+32),
//         img/apple-touch-icon.png (180), img/icon-192.png, img/icon-512.png

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { data } from '../js/data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const font = (f) => `data:font/woff2;base64,${readFileSync(join(root, 'fonts', f)).toString('base64')}`;

/* ---------- icon: a geometric "j" plus a running-status dot (no fonts) ---------- */
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="2" y="2" width="60" height="60" rx="13" fill="#0a0a0f" stroke="#00e5ff" stroke-width="3"/>
  <circle cx="35" cy="16.5" r="4.6" fill="#00e5ff"/>
  <path d="M35 27v15.5c0 7-4 10.5-10.5 10.5H21" fill="none" stroke="#00e5ff" stroke-width="7.5" stroke-linecap="round"/>
  <circle cx="50" cy="50" r="5" fill="#10b981"/>
</svg>`;

/* ---------- social card ---------- */
function ogSvg() {
  const P = data.profile;
  const [first, ...rest] = P.name.split(' ');
  const last = rest.pop();
  const middle = rest.join(' ');
  const grid = [];
  for (let x = 60; x < 1200; x += 60) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="630"/>`);
  for (let y = 60; y < 630; y += 60) grid.push(`<line x1="0" y1="${y}" x2="1200" y2="${y}"/>`);
  // mini message bus, right of the name: same graph and colours as the hero canvas
  const N = { producer: [870, 255], kafka: [960, 175], rabbitmq: [960, 335], elasticsearch: [1060, 175], 'llm-judge': [1125, 255] };
  const E = [['producer', 'kafka', '#00e5ff'], ['kafka', 'elasticsearch', '#00e5ff'], ['elasticsearch', 'llm-judge', '#7c3aed'], ['producer', 'rabbitmq', '#10b981'], ['rabbitmq', 'llm-judge', '#7c3aed']];
  const edges = E.map(([a, b, c]) => `<line x1="${N[a][0]}" y1="${N[a][1]}" x2="${N[b][0]}" y2="${N[b][1]}" stroke="${c}" stroke-opacity="0.35" stroke-width="1.5"/>` +
    `<circle cx="${(N[a][0] * 0.4 + N[b][0] * 0.6).toFixed(0)}" cy="${(N[a][1] * 0.4 + N[b][1] * 0.6).toFixed(0)}" r="4" fill="${c}" filter="url(#glow)"/>`).join('');
  const nodes = Object.entries(N).map(([id, [x, y]]) => `<circle cx="${x}" cy="${y}" r="6" fill="#0a0a0f" stroke="#00e5ff" stroke-opacity="0.7" stroke-width="1.5"/>` +
    `<text x="${x}" y="${y + (y > 300 ? 28 : y < 200 ? -16 : 30)}" text-anchor="middle" class="mono" font-size="14" fill="#8b8ba8">${id}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      @font-face { font-family: 'Syne'; font-weight: 700 800; src: url(${font('syne-latin.woff2')}) format('woff2'); }
      @font-face { font-family: 'DM Sans'; font-weight: 300 400; src: url(${font('dm-sans-latin.woff2')}) format('woff2'); }
      @font-face { font-family: 'Space Mono'; font-weight: 400; src: url(${font('space-mono-400-latin.woff2')}) format('woff2'); }
      @font-face { font-family: 'Space Mono'; font-weight: 700; src: url(${font('space-mono-700-latin.woff2')}) format('woff2'); }
      .mono { font-family: 'Space Mono', monospace; }
      .display { font-family: 'Syne', sans-serif; font-weight: 800; }
      .body { font-family: 'DM Sans', sans-serif; }
    </style>
    <radialGradient id="orbV" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#7c3aed" stop-opacity="0.35"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></radialGradient>
    <radialGradient id="orbC" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#00e5ff" stop-opacity="0.22"/><stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="bar" x1="0" x2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#00e5ff"/></linearGradient>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1200" height="630" fill="#0a0a0f"/>
  <circle cx="120" cy="140" r="380" fill="url(#orbV)"/>
  <circle cx="1080" cy="520" r="320" fill="url(#orbC)"/>
  <g stroke="#00e5ff" stroke-opacity="0.045" stroke-width="1">${grid.join('')}</g>
  <rect x="0" y="0" width="1200" height="4" fill="url(#bar)"/>

  <text x="80" y="92" class="mono" font-size="22" fill="#00e5ff">jalil.sys</text>
  <circle cx="218" cy="85" r="6" fill="#10b981" filter="url(#glow)"/>
  <text x="234" y="92" class="mono" font-size="18" fill="#10b981">running</text>
  <text x="1120" y="92" text-anchor="end" class="mono" font-size="18" fill="#8b8ba8">${esc(P.location)}</text>

  <text x="80" y="232" class="display" font-size="92" fill="#e8e8f0" letter-spacing="-2">${esc([first, middle].filter(Boolean).join(' '))}</text>
  <text x="80" y="332" class="display" font-size="92" fill="#00e5ff" letter-spacing="-2">${esc(last)}</text>
  <text x="82" y="388" class="mono" font-size="22" fill="#8b8ba8">${esc(P.role)} · <tspan fill="#a78bfa">${esc(P.focus)}</tspan></text>
  <text x="80" y="456" class="body" font-size="30" fill="#e8e8f0">${esc(P.tagline)}</text>

  <text x="80" y="560" class="mono" font-size="18" fill="#8b8ba8"><tspan fill="#10b981">$</tspan> open ${esc(data.seo.url.replace(/^https:\/\//, '').replace(/\/$/, ''))}</text>
  <g>${edges}${nodes}</g>
</svg>`;
}

/* ---------- headless Chrome via CDP ---------- */
const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(existsSync);
if (!CHROME) { console.error('Chrome not found: set CHROME=/path/to/chrome'); process.exit(1); }

async function withChrome(fn) {
  const port = 9600 + Math.floor(Math.random() * 300);
  const prof = mkdtempSync(join(tmpdir(), 'jalil-img-'));
  const proc = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let target;
    for (let k = 0; k < 60 && !target; k++) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
      if (!target) await new Promise((r) => setTimeout(r, 200));
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0; const pending = new Map();
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
    const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
    await send('Page.enable');
    await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }); // keep icon corners transparent
    const frameId = (await send('Page.getFrameTree')).frameTree.frame.id;
    const render = async (svg, w, h, scale = 1) => {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile: false });
      const html = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block;width:${w}px;height:${h}px}</style></head><body>${svg}</body></html>`;
      await send('Page.setDocumentContent', { frameId, html });
      await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise(r => setTimeout(r, 150)))', awaitPromise: true });
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 }, omitBackground: true });
      return Buffer.from(shot.data, 'base64');
    };
    await fn(render);
    ws.close();
  } finally {
    proc.kill();
    try { rmSync(prof, { recursive: true, force: true }); } catch {}
  }
}

// ICO container with embedded PNGs (supported by every current browser).
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(({ size, buf }, k) => {
    const o = 6 + 16 * k;
    head.writeUInt8(size >= 256 ? 0 : size, o); head.writeUInt8(size >= 256 ? 0 : size, o + 1);
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(buf.length, o + 8); head.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.buf)]);
}

await withChrome(async (render) => {
  writeFileSync(join(root, 'og.png'), await render(ogSvg(), 1200, 630));
  writeFileSync(join(root, 'favicon.svg'), ICON_SVG + '\n');
  const sized = (n) => ICON_SVG.replace('<svg ', `<svg width="${n}" height="${n}" `);
  const p16 = await render(sized(16), 16, 16);
  const p32 = await render(sized(32), 32, 32);
  writeFileSync(join(root, 'favicon.ico'), ico([{ size: 16, buf: p16 }, { size: 32, buf: p32 }]));
  // apple-touch-icon: full-bleed square (iOS rounds corners itself), no transparency
  const apple = ICON_SVG.replace('rx="13"', 'rx="0"').replace('<rect x="2" y="2" width="60" height="60"', '<rect x="0" y="0" width="64" height="64"');
  writeFileSync(join(root, 'img', 'apple-touch-icon.png'), await render(apple.replace('<svg ', '<svg width="180" height="180" '), 180, 180));
  writeFileSync(join(root, 'img', 'icon-192.png'), await render(sized(192), 192, 192));
  writeFileSync(join(root, 'img', 'icon-512.png'), await render(sized(512), 512, 512));
});
console.log('wrote og.png, favicon.svg, favicon.ico, img/apple-touch-icon.png, img/icon-192.png, img/icon-512.png');
