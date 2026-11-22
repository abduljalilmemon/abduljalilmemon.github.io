// jalil.sys: hidden flags. Other modules announce discoveries with
//   window.dispatchEvent(new CustomEvent('jalil:flag', { detail: { id } }))
// Flags are listed in data.flags and saved per visitor in localStorage (a
// convenience only: the page works the same without it). A footer chip shows
// progress; finding them all ends with a nudge to get in touch.

import { toast } from './toast.js?v=e12d8853';

const KEY = 'jalil.sys.flags';
const load = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); } };
const save = (set) => { try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* storage blocked */ } };

let state = null;

export function initAchievements(data) {
  const flags = data.flags;
  const found = load();
  const valid = new Set(flags.map((f) => f.id));
  [...found].forEach((id) => { if (!valid.has(id)) found.delete(id); });
  state = { flags, found };

  const chip = document.getElementById('flags-chip');
  const paint = () => {
    if (!chip) return;
    chip.querySelector('.flags-count').textContent = `${found.size}/${flags.length}`;
    chip.classList.toggle('complete', found.size === flags.length);
    chip.hidden = false;
  };
  chip?.addEventListener('click', () => window.dispatchEvent(new CustomEvent('jalil:term-run', { detail: { cmd: 'flags' } })));
  paint();

  window.addEventListener('jalil:flag', (e) => {
    const id = e.detail?.id;
    if (!valid.has(id) || found.has(id)) return;
    found.add(id); save(found); paint();
    const f = flags.find((x) => x.id === id);
    if (found.size === flags.length) {
      toast(`⚑ ${found.size}/${flags.length} flags: you've explored the whole system. Let's talk → contact`, 5000);
    } else {
      toast(`⚑ flag captured: ${f.label} (${found.size}/${flags.length})`, 3200);
    }
  });

  // explorer: every section has been on screen at least once
  const sections = [...document.querySelectorAll('main > section[id]')];
  if (!found.has('explorer') && 'IntersectionObserver' in window && sections.length) {
    const seen = new Set();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { seen.add(en.target.id); obs.unobserve(en.target); } });
      if (seen.size === sections.length) { obs.disconnect(); window.dispatchEvent(new CustomEvent('jalil:flag', { detail: { id: 'explorer' } })); }
    }, { rootMargin: '-35% 0px -35% 0px' }); // counts once a section crosses the middle of the screen (works for very tall sections too)
    sections.forEach((sec) => obs.observe(sec));
  }
}

// Terminal `flags` command output: [{ done, text, hint }]
export function flagReport() {
  if (!state) return null;
  return {
    count: state.found.size,
    total: state.flags.length,
    rows: state.flags.map((f) => ({ done: state.found.has(f.id), label: f.label, hint: f.hint })),
  };
}
