// jalil.sys: boot overlay. About 1.2s, first visit per session only.
// The overlay is a fixed layer shown by the inline <head> flag (html.boot),
// so the page underneath renders and paints normally (no layout shift, no
// LCP delay). Any key, click or tap skips it. CSS hides it after 4s even if
// this module never runs.

const LINE_MS = 180;   // gap between log lines
const HOLD_MS = 160;   // pause on [ready]
const FADE_MS = 300;   // dissolve (matches CSS); total ≈ 1.26s

/**
 * @returns {Promise<void>} resolves once the overlay is gone (or immediately
 * when there is no boot this visit). Other hero effects wait on it.
 */
export function initBoot(data) {
  const root = document.documentElement;
  const overlay = document.getElementById('boot');
  const log = document.getElementById('boot-log');
  const cfg = data.boot;

  if (!root.classList.contains('boot') || !overlay || !log) {
    overlay?.remove();
    return Promise.resolve();
  }

  try { sessionStorage.setItem(cfg.storageKey, '1'); } catch { /* private mode etc. */ }
  log.style.minHeight = `${cfg.lines.length * 1.9}em`; // reserve height: lines appear without shifting

  return new Promise((resolve) => {
    const timers = [];
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      ['keydown', 'pointerdown', 'touchstart'].forEach((t) => window.removeEventListener(t, finish, true));
      overlay.classList.add('done');
      setTimeout(() => {
        overlay.remove();
        root.classList.remove('boot', 'boot-skip');
        resolve();
      }, FADE_MS);
    };

    ['keydown', 'pointerdown', 'touchstart'].forEach((t) =>
      window.addEventListener(t, finish, { capture: true, passive: true }));
    if (root.classList.contains('boot-skip')) { finish(); return; } // skipped before this module loaded

    cfg.lines.forEach(([status, text], n) => {
      timers.push(setTimeout(() => {
        const row = document.createElement('div');
        row.className = 'boot-line';
        const tag = document.createElement('span');
        tag.className = `boot-tag boot-${status}`;
        tag.textContent = `[${status}]`;
        row.append(tag, ` ${text}`);
        log.append(row);
      }, 80 + n * LINE_MS));
    });
    timers.push(setTimeout(finish, 80 + cfg.lines.length * LINE_MS + HOLD_MS));
  });
}
