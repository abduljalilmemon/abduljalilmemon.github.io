// jalil.sys: service-card hover. A subtle tilt plus a glow border that
// follows the cursor. Fine pointers with motion allowed only; one rAF write
// per card per frame, transform and CSS custom properties only.

const MAX_X = 2;   // deg, rotateX (kept small: more makes text soft)
const MAX_Y = 2.5; // deg, rotateY

export function initCards() {
  const ok = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  if (!ok.matches) return;

  document.querySelectorAll('.project-card').forEach((card) => {
    let rect = null, raf = 0, px = 0.5, py = 0.5;
    const paint = () => {
      raf = 0;
      card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      card.style.transform = `perspective(900px) rotateX(${((0.5 - py) * MAX_X * 2).toFixed(2)}deg) rotateY(${((px - 0.5) * MAX_Y * 2).toFixed(2)}deg)`;
    };
    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      rect = card.getBoundingClientRect();
      card.classList.add('tilting');
    });
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !rect) return;
      px = (e.clientX - rect.left) / rect.width;
      py = (e.clientY - rect.top) / rect.height;
      if (!raf) raf = requestAnimationFrame(paint);
    });
    card.addEventListener('pointerleave', () => {
      rect = null;
      if (raf) cancelAnimationFrame(raf), (raf = 0);
      card.classList.remove('tilting');
      card.style.transform = '';
    });
  });
}
