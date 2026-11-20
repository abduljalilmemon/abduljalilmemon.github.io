// jalil.sys: interactive terminal. Upgrades the static profile.json card.
// Auto-types `cat profile.json` (instantly under reduced motion), then takes
// commands. Real <input> with a label; command output goes to an
// aria-live="polite" region. All text comes from data.js.

import { blocks } from './render.js?v=e0a21533';

const TYPE_MS = 45;

export function initTerminal(data, ready = Promise.resolve()) {
  const card = document.querySelector('.terminal-card');
  const body = card?.querySelector('.terminal-body');
  if (!card || !body) return;
  const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const T = data.terminal;
  const allCommands = [...T.commands.map(([c]) => c), ...T.hidden];

  // Keep the card exactly as tall as the static fallback: no layout shift.
  body.style.height = `${body.offsetHeight}px`;

  // Header hint
  const header = card.querySelector('.terminal-header');
  if (header && !header.querySelector('.term-hint')) {
    const hint = document.createElement('span');
    hint.className = 'term-hint';
    hint.innerHTML = `type <kbd>help</kbd>`;
    header.append(hint);
  }

  body.innerHTML = '';
  body.classList.add('term-live');
  const typed = document.createElement('div'); // auto-typed intro, not announced
  typed.className = 'term-line';
  typed.setAttribute('aria-hidden', 'true');
  const out = document.createElement('div');
  out.className = 'term-output';
  out.setAttribute('role', 'log');
  out.setAttribute('aria-live', 'polite');
  out.setAttribute('aria-label', 'Terminal output');

  const form = document.createElement('form');
  form.className = 'term-input-row';
  form.hidden = true;
  form.innerHTML =
    '<label for="term-input" class="sr-only">Terminal command (type help for a list)</label>' +
    '<span class="t-prompt" aria-hidden="true">$</span>' +
    '<span class="cursor term-idle-cursor" aria-hidden="true"></span>' +
    '<input id="term-input" class="term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" maxlength="80">';
  const input = form.querySelector('input');
  // block cursor shows while the prompt is idle (unfocused and empty)
  input.addEventListener('input', () => form.classList.toggle('has-text', input.value !== ''));
  body.append(typed, out, form);
  body.classList.add('term-ready');

  const scroll = () => { body.scrollTop = body.scrollHeight; };

  /* ---------- output helpers ---------- */
  const line = (...parts) => {
    const row = document.createElement('div');
    row.className = 'term-line';
    for (const p of parts) {
      if (typeof p === 'string') row.append(p);
      else if (p.href) {
        const a = document.createElement('a');
        a.href = p.href; a.textContent = p.text;
        if (/^https?:/.test(p.href)) { a.target = '_blank'; a.rel = 'noopener'; }
        row.append(a);
      } else {
        const s = document.createElement('span');
        s.className = p.cls; s.textContent = p.text;
        row.append(s);
      }
    }
    return row;
  };
  const print = (rows) => { const frag = document.createDocumentFragment(); rows.forEach((r) => frag.append(r)); out.append(frag); scroll(); };
  const echo = (cmd) => line({ cls: 't-prompt', text: '$' }, ' ', { cls: 't-cmd', text: cmd });
  const pad = (s, n) => s + ' '.repeat(Math.max(1, n - s.length));

  const profileRows = () => {
    const tmp = document.createElement('div');
    tmp.innerHTML = blocks.terminal(data);
    // drop the leading "$ cat profile.json" and trailing "$ ▮" lines of the static block
    return [...tmp.children].slice(1, -2).map((el) => { el.classList.add('term-line'); return el; });
  };

  /* ---------- commands ---------- */
  const P = data.profile, L = data.links;
  const commands = {
    help: () => T.commands.map(([c, d]) => line({ cls: 't-key', text: pad(c, 12) }, { cls: 't-comment', text: d })),
    whoami: () => [
      line({ cls: 't-str', text: `${P.name}` }, ` · ${P.role} · ${P.location}`),
      line({ cls: 't-comment', text: P.tagline }),
      line({ cls: 't-arr', text: P.availability }),
    ],
    skills: () => data.skills.map((c) => line({ cls: 't-key', text: `#${c.category}` }, ' ',
      c.items.map((it) => (Array.isArray(it) ? it[0] : it)).join(', '))),
    experience: () => data.experience.map((e) => line({ cls: 't-val', text: pad(e.period, 21) }, `${e.role} @ `, { cls: 't-str', text: e.company })),
    projects: () => data.projects.map((p) => line({ cls: `t-status t-status-${p.status || 'none'}`, text: pad(`[${p.status || '-'}]`, 11) }, p.name)),
    awards: () => data.awards.map((a) => line({ cls: 't-val', text: `🏆 ${a.title}` }, { cls: 't-comment', text: ` · ${a.org} · ${a.place} · ${a.date}` })),
    contact: () => [
      line({ cls: 't-key', text: pad('email', 10) }, { href: `mailto:${L.email}`, text: L.email }),
      line({ cls: 't-key', text: pad('linkedin', 10) }, { href: L.linkedin.url, text: L.linkedin.handle }),
      line({ cls: 't-key', text: pad('github', 10) }, { href: L.github.url, text: L.github.handle }),
    ],
    resume: () => {
      window.open(P.cv, '_blank', 'noopener');
      return [line({ cls: 't-comment', text: `opening ${P.cv} …` })];
    },
    hire: () => {
      const target = document.getElementById('contact');
      target?.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto' });
      setTimeout(() => document.getElementById('cf-name')?.focus({ preventScroll: true }), motionOK ? 700 : 0);
      return [line({ cls: 't-arr', text: '→ routing to #contact' })];
    },
    'sudo hire jalil': () => [
      line({ cls: 't-comment', text: '[sudo] password for recruiter: ********' }),
      line({ cls: 't-arr', text: '✓ permission granted.' }, " offer queued on topic 'offers', partition 0."),
      line('  consumer jalil.sys is listening at ', { href: `mailto:${L.email}`, text: L.email }),
    ],
    'cat profile.json': () => profileRows(),
    clear: () => { out.innerHTML = ''; return []; },
  };

  const run = (raw) => {
    const cmd = raw.trim().replace(/\s+/g, ' ');
    if (!cmd) { print([echo('')]); return; }
    const fn = commands[cmd.toLowerCase()];
    if (cmd.toLowerCase() === 'clear') { fn(); return; }
    print([echo(cmd), ...(fn ? fn() : [line({ cls: 't-err', text: T.notFound })])]);
  };

  /* ---------- input: history + tab completion ---------- */
  const history = [];
  let hIdx = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    if (v.trim()) history.push(v.trim());
    hIdx = history.length;
    input.value = '';
    form.classList.remove('has-text');
    run(v);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault(); hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx];
    } else if (e.key === 'ArrowDown' && history.length) {
      e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] ?? '';
    } else if (e.key === 'Tab' && input.value.trim()) {
      const v = input.value.trimStart().toLowerCase();
      const matches = allCommands.filter((c) => c.startsWith(v));
      if (!matches.length) return; // let Tab move focus as usual
      e.preventDefault();
      if (matches.length === 1) input.value = matches[0];
      else {
        const common = matches.reduce((a, b) => { let k = 0; while (a[k] && a[k] === b[k]) k++; return a.slice(0, k); });
        input.value = common;
        print([echo(input.value), line({ cls: 't-comment', text: matches.join('   ') })]);
      }
    }
  });
  // Clicking the screen focuses the prompt (unless the user is selecting text).
  body.addEventListener('click', (e) => {
    if (e.target.closest('a') || String(window.getSelection())) return;
    input.focus({ preventScroll: true });
  });

  /* ---------- intro ---------- */
  const intro = 'cat profile.json';
  const finishIntro = () => {
    typed.remove();
    print([echo(intro), ...profileRows()]);
    form.hidden = false;
    scroll();
  };
  ready.then(() => {
    if (!motionOK) return finishIntro();
    typed.innerHTML = '<span class="t-prompt">$</span> <span class="t-cmd"></span><span class="cursor"></span>';
    const cmdEl = typed.querySelector('.t-cmd');
    let k = 0;
    const tick = () => {
      cmdEl.textContent = intro.slice(0, ++k);
      if (k < intro.length) setTimeout(tick, TYPE_MS);
      else setTimeout(finishIntro, 180);
    };
    setTimeout(tick, 250);
  });
}
