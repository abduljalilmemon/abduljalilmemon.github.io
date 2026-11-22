// Shared headless-Chrome helper for the dev scripts (DevTools protocol over the
// built-in WebSocket; Node 22+, no npm packages).
//
//   await withChrome(async ({ send, frameId, setHtml }) => { ... });

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(existsSync);

export async function withChrome(fn) {
  if (!CHROME) { console.error('Chrome not found: set CHROME=/path/to/chrome'); process.exit(1); }
  const port = 9600 + Math.floor(Math.random() * 300);
  const prof = mkdtempSync(join(tmpdir(), 'jalil-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let target;
    for (let k = 0; k < 60 && !target; k++) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {}
      if (!target) await new Promise((r) => setTimeout(r, 200));
    }
    if (!target) throw new Error('could not connect to headless Chrome');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0; const pending = new Map();
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m.result ?? { error: m.error }); pending.delete(m.id); } });
    const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
    await send('Page.enable');
    const frameId = (await send('Page.getFrameTree')).frameTree.frame.id;
    // load an HTML string and wait for its fonts
    const setHtml = async (html) => {
      await send('Page.setDocumentContent', { frameId, html });
      await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise(r => setTimeout(r, 150)))', awaitPromise: true });
    };
    await fn({ send, frameId, setHtml });
    ws.close();
  } finally {
    proc.kill();
    try { rmSync(prof, { recursive: true, force: true }); } catch {}
  }
}
