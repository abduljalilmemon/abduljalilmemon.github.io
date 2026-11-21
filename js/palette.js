// jalil.sys: command palette (Ctrl/Cmd + K).
// <dialog> + combobox/listbox pattern: the input owns focus and points at the
// active option with aria-activedescendant. Tab is trapped inside, Escape
// closes, and focus returns to whatever opened it.

import { emailOf } from './render.js?v=89b655e1';
import { toast } from './toast.js?v=e12d8853';

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform || navigator.platform || '');

export function initPalette(data) {
  const trigger = document.getElementById('palette-trigger');
  const L = data.links;

  /* ---------- actions ---------- */
  const sections = [...document.querySelectorAll('section[id]')].map((sec) => {
    const raw = sec.querySelector('.section-label')?.textContent || sec.id;
    const name = raw.replace(/^\d+\s*\/\s*/, '').trim();
    return {
      label: `Go to ${name}`, hint: `#${sec.id}`, group: 'jump',
      run: () => {
        sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        sec.setAttribute('tabindex', '-1');
        sec.focus({ preventScroll: true });
      },
    };
  });
  const actions = [
    ...sections,
    { label: 'Open GitHub', hint: L.github.handle, group: 'link', run: () => window.open(L.github.url, '_blank', 'noopener') },
    { label: 'Open LinkedIn', hint: L.linkedin.handle, group: 'link', run: () => window.open(L.linkedin.url, '_blank', 'noopener') },
    { label: 'Copy email', hint: emailOf(data), group: 'action', keepFocus: true, run: () => copy(emailOf(data)) },
    { label: 'Download CV', hint: data.profile.cv, group: 'action', run: () => download(data.profile.cv) },
    {
      label: 'Focus terminal', hint: 'profile.json', group: 'action',
      run: () => {
        const input = document.getElementById('term-input');
        document.getElementById('hero')?.scrollIntoView({ behavior: 'auto' });
        input?.focus({ preventScroll: true });
      },
    },
  ];

  /* ---------- DOM ---------- */
  const dlg = document.createElement('dialog');
  dlg.className = 'palette';
  dlg.setAttribute('aria-label', 'Command palette');
  dlg.innerHTML = `
    <div class="palette-box">
      <div class="palette-search">
        <span class="palette-prompt" aria-hidden="true">⌕</span>
        <input class="palette-input" type="text" role="combobox" aria-expanded="true" aria-controls="palette-list"
          aria-autocomplete="list" aria-label="Search commands" placeholder="Jump to a section or run a command…"
          autocomplete="off" spellcheck="false">
        <kbd class="palette-esc">esc</kbd>
      </div>
      <ul class="palette-list" id="palette-list" role="listbox" aria-label="Commands"></ul>
      <div class="palette-foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> run</span><span><kbd>esc</kbd> close</span></div>
    </div>`;
  document.body.append(dlg);
  const input = dlg.querySelector('.palette-input');
  const list = dlg.querySelector('.palette-list');
  let results = [], active = 0, opener = null;

  const render = () => {
    const q = input.value.trim();
    results = actions
      .map((a) => ({ a, s: fuzzy(q, `${a.label} ${a.hint}`) }))
      .filter((r) => r.s > -Infinity)
      .sort((x, y) => y.s - x.s)
      .map((r) => r.a);
    active = Math.min(active, Math.max(results.length - 1, 0));
    list.innerHTML = '';
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'palette-empty';
      li.textContent = 'no matching command';
      list.append(li);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    results.forEach((a, k) => {
      const li = document.createElement('li');
      li.id = `palette-opt-${k}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(k === active));
      li.className = 'palette-opt';
      li.dataset.group = a.group;
      li.innerHTML = '<span class="palette-label"></span><span class="palette-hint"></span>';
      li.firstChild.append(highlight(a.label, q));
      li.lastChild.textContent = a.hint;
      li.addEventListener('mousemove', () => { if (active !== k) { active = k; mark(); } });
      li.addEventListener('click', () => exec(a));
      list.append(li);
    });
    mark();
  };
  const mark = () => {
    [...list.children].forEach((li, k) => li.setAttribute('aria-selected', String(k === active)));
    const cur = list.children[active];
    if (cur?.id) { input.setAttribute('aria-activedescendant', cur.id); cur.scrollIntoView({ block: 'nearest' }); }
  };

  const open = () => {
    if (dlg.open) return;
    opener = document.activeElement;
    input.value = ''; active = 0; render();
    dlg.showModal();
    input.focus();
  };
  const close = (restore = true) => {
    if (!dlg.open) return;
    dlg.close();
    if (restore && opener && document.contains(opener)) opener.focus({ preventScroll: true });
  };
  const exec = (a) => {
    if (a.keepFocus) { close(); a.run(); return; }
    close(false);
    a.run();
  };

  input.addEventListener('input', () => { active = 0; render(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(results.length, 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + results.length) % Math.max(results.length, 1); mark(); }
    else if (e.key === 'Home') { e.preventDefault(); active = 0; mark(); }
    else if (e.key === 'End') { e.preventDefault(); active = Math.max(results.length - 1, 0); mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) exec(results[active]); }
    else if (e.key === 'Tab') { e.preventDefault(); input.focus(); } // focus trap: the input is the only stop
  });
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); }); // Escape
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); }); // backdrop

  /* ---------- open: shortcut + chip ---------- */
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dlg.open ? close() : open();
    }
  });
  if (trigger) {
    trigger.querySelector('kbd').textContent = isMac ? '⌘K' : 'Ctrl K';
    trigger.hidden = false;
    trigger.addEventListener('click', open);
  }
  return { open, close };
}

/* ---------- helpers ---------- */

// Subsequence fuzzy match: every query char must appear in order.
// Rewards consecutive runs and word starts; shorter gaps score higher.
export function fuzzy(q, text) {
  if (!q) return 0;
  const t = text.toLowerCase(), s = q.toLowerCase();
  let ti = 0, score = 0, run = 0, prev = -2;
  for (const ch of s) {
    if (ch === ' ') continue;
    const idx = t.indexOf(ch, ti);
    if (idx < 0) return -Infinity;
    run = idx === prev + 1 ? run + 1 : 0;
    score += 1 + run * 2 + (idx === 0 || /[\s#/·-]/.test(t[idx - 1]) ? 3 : 0) - Math.min(idx - ti, 5) * 0.2;
    prev = idx; ti = idx + 1;
  }
  return score;
}

function highlight(label, q) {
  const frag = document.createDocumentFragment();
  if (!q) { frag.append(label); return frag; }
  const s = q.toLowerCase().replace(/\s/g, '');
  let k = 0;
  for (const ch of label) {
    if (k < s.length && ch.toLowerCase() === s[k]) {
      const m = document.createElement('mark'); m.textContent = ch; frag.append(m); k++;
    } else frag.append(ch);
  }
  return frag;
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`✓ copied ${text}`);
  } catch {
    // Clipboard API blocked (insecure context or permissions): legacy fallback
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    const ok = document.execCommand?.('copy');
    ta.remove();
    toast(ok ? `✓ copied ${text}` : `copy failed: ${text}`);
  }
}

function download(href) {
  const a = Object.assign(document.createElement('a'), { href, download: '' });
  document.body.append(a); a.click(); a.remove();
}
