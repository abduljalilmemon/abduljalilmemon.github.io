// jalil.sys: hero metric tiles. Final values are already in the HTML (no-JS
// fallback). With motion allowed, each number counts up once when its tile is
// in view (after the boot overlay is gone) and its sparkline draws in.

const DURATION = 900;

export function initMetrics(ready = Promise.resolve()) {
  const tiles = [...document.querySelectorAll('.metric-tile')];
  if (!tiles.length) return;
  const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  if (!motionOK || !('IntersectionObserver' in window)) {
    tiles.forEach((t) => t.classList.add('counted'));
    return;
  }

  // Reserve the final width so counting never shifts layout.
  for (const t of tiles) {
    const num = t.querySelector('.metric-num');
    if (!num) continue;
    num.style.minWidth = `${num.getBoundingClientRect().width}px`;
    if (+num.dataset.count > 1) num.textContent = '0';
  }
  tiles.forEach((t) => t.classList.add('pending'));

  ready.then(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, k) => {
        obs.unobserve(e.target);
        setTimeout(() => count(e.target), k * 120);
      });
    }, { threshold: 0.6 });
    tiles.forEach((t) => obs.observe(t));
  });
}

function count(tile) {
  const num = tile.querySelector('.metric-num');
  tile.classList.remove('pending');
  tile.classList.add('counted');
  if (!num) return;
  const end = +num.dataset.count;
  if (!(end > 1)) return;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / DURATION);
    const eased = 1 - Math.pow(1 - p, 3);
    num.textContent = String(Math.round(end * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
