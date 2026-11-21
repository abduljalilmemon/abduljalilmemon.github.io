// jalil.sys: 404 mini terminal. Shows the missing path and accepts a few
// commands; `cd /` (or cd, cd ~, home) goes back to the site.

const out = document.getElementById('nf-out');
const body = document.getElementById('nf-body');
const pathEl = document.getElementById('nf-path');
if (pathEl) {
  let path = location.pathname;
  try { path = decodeURI(path); } catch { /* malformed escape: show raw */ }
  pathEl.textContent = path || '/';
}

const ROUTES = ['/#hero', '/#awards', '/#skills', '/#experience', '/#projects', '/#about', '/#contact'];

function line(...parts) {
  const row = document.createElement('div');
  for (const p of parts) {
    if (typeof p === 'string') row.append(p);
    else if (p.href) { const a = document.createElement('a'); a.href = p.href; a.textContent = p.text; row.append(a); }
    else { const s = document.createElement('span'); s.className = p.cls; s.textContent = p.text; row.append(s); }
  }
  out.append(row);
  body.scrollTop = body.scrollHeight;
}

function run(raw) {
  const cmd = raw.trim().replace(/\s+/g, ' ');
  line({ cls: 't-prompt', text: '$' }, ' ', { cls: 't-cmd', text: cmd });
  if (!cmd) return;
  if (['cd /', 'cd', 'cd ~', 'home', 'cd ..'].includes(cmd)) {
    line({ cls: 't-arr', text: '→ routing to /' });
    location.href = '/';
  } else if (cmd === 'ls') {
    ROUTES.forEach((r) => line('  ', { href: r, text: r }));
  } else if (cmd === 'help') {
    line({ cls: 't-key', text: 'cd /' }, { cls: 't-comment', text: '   back to jalil.sys' });
    line({ cls: 't-key', text: 'ls  ' }, { cls: 't-comment', text: '   list routes' });
  } else {
    line({ cls: 't-err', text: `no route for '${cmd}'` }, { cls: 't-comment', text: ", try 'cd /'" });
  }
}

const form = document.createElement('form');
form.className = 'term-input-row';
form.innerHTML = '<label for="nf-input" class="sr-only">Command (try cd /)</label>' +
  '<span class="t-prompt" aria-hidden="true">$</span>' +
  '<input id="nf-input" class="term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="cd /">';
body.append(form);
const input = form.querySelector('input');
form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });
// Focus the prompt on desktop only (avoid popping a phone keyboard).
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) input.focus({ preventScroll: true });
