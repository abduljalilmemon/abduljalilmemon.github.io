// jalil.sys: page behaviour. Loaded as an ES module (deferred by default).
import { data } from './data.js?v=8aaa8cf0';
import { renderAll } from './render.js?v=eb64cb22';
import { initBoot } from './boot.js?v=5eea878a';
import { initTerminal } from './terminal.js?v=ddb22a96';
import { initMetrics } from './metrics.js?v=bff14201';

const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/* ---------- Custom cursor (fine pointer + motion allowed only) ---------- */
function initCursor() {
  if (!finePointer.matches || !motionOK.matches) return;
  const glow = document.getElementById('cursor-glow');
  const dot = document.getElementById('cursor-dot');
  if (!glow || !dot) return;

  let x = 0, y = 0, queued = false;
  window.addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    document.body.classList.add('cursor-on');
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      dot.style.left = glow.style.left = `${x}px`;
      dot.style.top = glow.style.top = `${y}px`;
      queued = false;
    });
  }, { passive: true });
  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-on'));

  const big = 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)';
  const small = 'radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 70%)';
  document.addEventListener('mouseover', (e) => {
    if (!e.target.closest('a, button, .project-card')) return;
    glow.style.width = glow.style.height = '600px';
    glow.style.background = big;
  });
  document.addEventListener('mouseout', (e) => {
    const from = e.target.closest('a, button, .project-card');
    if (!from || from.contains(e.relatedTarget)) return;
    glow.style.width = glow.style.height = '400px';
    glow.style.background = small;
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
  const fallback = form.dataset.fallbackEmail;
  const mailto = fallback ? ` Please email <a href="mailto:${fallback}">${fallback}</a> instead.` : '';

  const show = (state, html) => { status.dataset.state = state; status.innerHTML = html; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    if (form.action.includes('FORMSPREE_ID')) {
      show('error', `✗ The contact form isn't connected yet.${mailto}`);
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
      if (res.ok) {
        form.reset();
        show('success', "✓ Message sent. I'll get back to you soon.");
      } else {
        let msg = 'The message could not be sent.';
        try {
          const data = await res.json();
          if (data?.errors?.length) msg = data.errors.map((er) => er.message).join(' ');
        } catch { /* non-JSON error body */ }
        show('error', `✗ ${msg}${mailto}`);
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
try { renderAll(data); } catch (err) { console.error('render failed, keeping static fallback', err); }

// Each hero piece is isolated: one failing never takes the rest down.
const safe = (name, fn) => { try { return fn(); } catch (err) { console.error(`${name} failed`, err); } };

const booted = safe('boot', () => initBoot(data)) || Promise.resolve();
safe('terminal', () => initTerminal(data, booted));
safe('metrics', () => initMetrics(booted));

// Bus canvas: loaded and started after first paint, when the browser is idle.
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
requestAnimationFrame(() => idle(() => {
  import('./bus-canvas.js?v=36db171d')
    .then(({ initBus }) => initBus(data))
    .catch((err) => console.error('bus canvas failed', err));
}, { timeout: 1000 }));

initCursor();
initReveal();
initNavHighlight();
initMobileNav();
initContactForm();
