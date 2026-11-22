// jalil.sys: page behaviour. Loaded as an ES module (deferred by default).
import { data } from './data.js?v=9837c4ea';
import { renderAll, emailOf } from './render.js?v=44d0a3b0';
import { initBoot } from './boot.js?v=5eea878a';
import { initTerminal } from './terminal.js?v=c8015fea';
import { initTrace } from './trace.js?v=8c662fe2';
import { initCards } from './cards.js?v=91bd5b31';
import { initPalette } from './palette.js?v=dfbfedef';
import { initEffects } from './effects.js?v=3bf109ab';
import { initMetrics } from './metrics.js?v=bff14201';

const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/* ---------- Cursor glow (fine pointer + motion allowed only) ---------- */
// The native cursor stays visible. The glow is positioned with a transform
// written straight from the event (no rAF hop, no layout), so it tracks the
// mouse with the minimum possible latency.
function initCursor() {
  if (!finePointer.matches || !motionOK.matches) return;
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    document.body.classList.add('cursor-on');
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => document.body.classList.remove('cursor-on'));

  const HOT = 'a, button, .project-card';
  document.addEventListener('mouseover', (e) => { if (e.target.closest(HOT)) glow.classList.add('hot'); });
  document.addEventListener('mouseout', (e) => {
    const from = e.target.closest(HOT);
    if (from && !from.contains(e.relatedTarget)) glow.classList.remove('hot');
  });
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal, .exp-item, .project-card');
  if (!motionOK.matches || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e, i) => {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => obs.observe(el));
}

/* ---------- Active nav link ---------- */
function initNavHighlight() {
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = [...document.querySelectorAll('section[id]')];
  if (!('IntersectionObserver' in window) || !sections.length) return;
  const inBand = new Set();
  const update = () => {
    // last section (in document order) currently crossing the band below the nav
    const current = sections.filter((s) => inBand.has(s)).pop();
    const id = current ? `#${current.id}` : '';
    links.forEach((a) => {
      const on = a.getAttribute('href') === id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? inBand.add(e.target) : inBand.delete(e.target)));
    update();
  }, { rootMargin: '-120px 0px -65% 0px' });
  sections.forEach((s) => obs.observe(s));
}

/* ---------- Mobile nav ---------- */
function initMobileNav() {
  const btn = document.getElementById('ham');
  const panel = document.getElementById('mobileNav');
  if (!btn || !panel) return;
  const set = (open) => {
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => set(!panel.classList.contains('open')));
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) { set(false); btn.focus(); }
  });
}

/* ---------- Contact form (Formspree) ---------- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;
  const btn = form.querySelector('button[type="submit"]');
  const fallback = emailOf(data);
  const mailto = fallback ? ` Please email <a href="mailto:${fallback}">${fallback}</a> instead.` : '';

  const show = (state, html) => { status.dataset.state = state; status.innerHTML = html; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    // No Web3Forms key yet: hand the message to the visitor's email app instead
    // of dead-ending. Nothing claims it was sent; the visitor still presses send.
    const key = form.querySelector('input[name="access_key"]')?.value || '';
    if (!key || key === 'WEB3FORMS_ACCESS_KEY') {
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const from = String(fd.get('email') || '').trim();
      const subject = `Portfolio message from ${name}`;
      const body = `${String(fd.get('message') || '').trim()}\n\n— ${name} <${from}>`;
      window.location.href = `mailto:${fallback}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      show('sending', `↗ Opening your email app with this message. If nothing opens, email <a href="mailto:${fallback}">${fallback}</a>.`);
      return;
    }

    btn.disabled = true;
    show('sending', '… sending');
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      // Web3Forms answers JSON { success, message }; only a confirmed success counts.
      let result = null;
      try { result = await res.json(); } catch { /* non-JSON error body */ }
      if (res.ok && result?.success) {
        form.reset();
        show('success', "✓ Message sent. I'll get back to you soon.");
      } else {
        const msg = (result?.message && String(result.message)) || 'The message could not be sent.';
        const safe = msg.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
        show('error', `✗ ${safe}${mailto}`);
      }
    } catch {
      show('error', `✗ Network error, message not sent.${mailto}`);
    } finally {
      btn.disabled = false;
    }
  });
}

// Render content from data.js first so reveal/nav observers see the final DOM.
// If rendering throws, the static fallback in index.html stays in place.
const dev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
try { renderAll(data, document, { dev, now: new Date(), reveal: true }); } catch (err) { console.error('render failed, keeping static fallback', err); }
// Static (non-rendered) email links, e.g. the nav CTA: assemble the address now.
document.querySelectorAll('[data-email-link]').forEach((a) => { a.href = `mailto:${emailOf(data)}`; });

// Each hero piece is isolated: one failing never takes the rest down.
const safe = (name, fn) => { try { return fn(); } catch (err) { console.error(`${name} failed`, err); } };

const booted = safe('boot', () => initBoot(data)) || Promise.resolve();
safe('terminal', () => initTerminal(data, booted));
safe('metrics', () => initMetrics(booted));
// Below-the-fold and on-demand features: set up when the browser is idle,
// so the first load task stays short (TBT).
const whenIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
whenIdle(() => {
  safe('trace', () => initTrace());
  safe('palette', () => initPalette(data));
});
whenIdle(() => {
  safe('cards', () => initCards());
  safe('effects', () => initEffects());
  reanchor();
});

// Deep links (/#projects): the browser scrolls to the fragment early, then the
// trace collapses and fonts swap above it, pushing the target away. Re-scroll
// once things settle, unless the visitor has already started moving.
let userMoved = false;
['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) =>
  window.addEventListener(t, () => { userMoved = true; }, { once: true, passive: true, capture: true }));
function reanchor() {
  if (userMoved || location.hash.length < 2) return;
  let target = null;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* bad escape */ }
  target?.scrollIntoView({ block: 'start', behavior: 'instant' });
}
document.fonts?.ready.then(() => requestAnimationFrame(reanchor));
window.addEventListener('load', () => requestAnimationFrame(reanchor), { once: true });

// Bus canvas: loaded and started after first paint, when the browser is idle.
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
requestAnimationFrame(() => idle(() => {
  import('./bus-canvas.js?v=f813c206')
    .then(({ initBus }) => initBus(data))
    .catch((err) => console.error('bus canvas failed', err));
}, { timeout: 1000 }));

initCursor();
initReveal();
initNavHighlight();
initMobileNav();
initContactForm();
