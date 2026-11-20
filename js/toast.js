// jalil.sys: tiny toast. One polite live region, one message at a time.

let region, timer;

export function toast(message, ms = 2200) {
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  region.textContent = message;
  region.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => region.classList.remove('show'), ms);
}
