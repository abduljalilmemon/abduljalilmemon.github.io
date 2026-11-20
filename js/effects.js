// jalil.sys: small delights, used sparingly.
//  - section titles "decrypt" once when they first enter view
//  - scroll progress as a thin loading bar
//  - Konami code: the bus canvas bursts with packets for 3s

import { toast } from './toast.js?v=e12d8853';

const motionOK = () => window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

/* ---------- decrypt section titles ---------- */
// The real heading text never leaves the DOM: it is only made transparent
// while an aria-hidden overlay plays the scramble on top, so screen readers
// and layout always see the final text.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@';
const DECRYPT_MS = 650;

function initDecrypt() {
  if (!motionOK() || !('IntersectionObserver' in window)) return;
  const titles = document.querySelectorAll('.section-title');
  const obs = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e) => { obs.unobserve(e.target); decrypt(e.target); });
  }, { threshold: 0.6 });
  titles.forEach((t) => obs.observe(t));
}

function decrypt(el) {
  const text = el.textContent;
  const overlay = document.createElement('span');
  overlay.className = 'decrypt-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  el.classList.add('decrypting');
  el.append(overlay);
  const start = performance.now();
  const rand = (ch) => {
    if (ch === ' ' || /[^\p{L}\p{N}]/u.test(ch)) return ch;
    const g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    return ch === ch.toLowerCase() ? g.toLowerCase() : g;
  };
  let lastStep = -1;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / DECRYPT_MS);
    const step = Math.floor(now / 40); // re-roll glyphs about 25×/s, not every frame
    if (step !== lastStep || p === 1) {
      lastStep = step;
      const solved = Math.floor(p * text.length);
      overlay.textContent = text.slice(0, solved) + [...text.slice(solved)].map(rand).join('');
    }
    if (p < 1) requestAnimationFrame(tick);
    else { overlay.remove(); el.classList.remove('decrypting'); }
  };
  requestAnimationFrame(tick);
}

/* ---------- scroll progress ---------- */
function initProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<span></span>';
  document.body.append(bar);
  const fill = bar.firstChild;
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    fill.style.transform = `scaleX(${p.toFixed(4)})`;
    bar.classList.toggle('done', p > 0.995);
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ---------- Konami → packet burst ---------- */
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

function initKonami() {
  let pos = 0;
  document.addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, [contenteditable="true"]')) { pos = 0; return; }
    const k = e.key.toLowerCase();
    pos = k === KONAMI[pos] ? pos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (pos < KONAMI.length) return;
    pos = 0;
    if (!motionOK()) { toast('↑↑↓↓←→←→BA accepted: burst skipped (reduced motion)'); return; }
    const hero = document.getElementById('hero');
    if (hero && hero.getBoundingClientRect().bottom < 80) hero.scrollIntoView({ behavior: 'smooth' });
    window.dispatchEvent(new CustomEvent('jalil:burst', { detail: { ms: 3000 } }));
    toast('↑↑↓↓←→←→BA: flooding the bus for 3s');
  });
}

export function initEffects() {
  initDecrypt();
  initProgress();
  initKonami();
}
