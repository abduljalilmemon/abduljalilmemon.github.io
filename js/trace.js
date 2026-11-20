// jalil.sys: experience as a distributed trace. Each span bar is a button
// (aria-expanded) that toggles its bullet panel. The static fallback ships
// every panel open; JS collapses all but the most recent span.

export function initTrace() {
  const root = document.querySelector('.trace');
  if (!root) return;
  const bars = [...root.querySelectorAll('.trace-bar')];
  if (!bars.length) return;

  const set = (bar, open) => {
    bar.setAttribute('aria-expanded', String(open));
    const panel = document.getElementById(bar.getAttribute('aria-controls'));
    if (panel) panel.hidden = !open;
    bar.closest('.trace-row')?.classList.toggle('open', open);
  };

  // Most recent span = latest start (rows render oldest first).
  bars.forEach((bar, k) => set(bar, k === bars.length - 1));
  root.classList.add('trace-live');

  // <button> already handles Enter and Space.
  root.addEventListener('click', (e) => {
    const bar = e.target.closest('.trace-bar');
    if (bar) set(bar, bar.getAttribute('aria-expanded') !== 'true');
  });
}
