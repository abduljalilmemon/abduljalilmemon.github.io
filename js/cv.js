// jalil.sys: is the CV actually there? scripts/sync-fallback.mjs checks for
// cv.pdf in the repo and marks the hero's [data-cv] link `hidden` when it is
// missing. The hero button, the terminal `resume` command and the palette all
// read that one flag, so none of them offers a download that would save the
// 404 page as cv.htm. (No network probe: a 404 HEAD request would log a
// console error on every visit.)

export function cvAvailable() {
  const link = document.querySelector('[data-cv]');
  return Promise.resolve(Boolean(link) && !link.hasAttribute('hidden'));
}
