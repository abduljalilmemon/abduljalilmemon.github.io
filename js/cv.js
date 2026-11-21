// jalil.sys: is the CV actually there? One HEAD request, shared by the hero
// button, the terminal `resume` command and the palette. A missing file (or a
// server that answers with an HTML 404 page) counts as "not available", so we
// never offer a download that saves an error page as cv.htm.

let check;

export function cvAvailable(href) {
  if (!check) {
    check = fetch(href, { method: 'HEAD', cache: 'no-cache' })
      .then((res) => res.ok && /pdf/i.test(res.headers.get('content-type') || ''))
      .catch(() => false);
  }
  return check;
}

// Hide every [data-cv] link when the file is missing.
export function syncCvLinks(href) {
  return cvAvailable(href).then((ok) => {
    document.querySelectorAll('[data-cv]').forEach((a) => { a.hidden = !ok; });
    return ok;
  });
}
