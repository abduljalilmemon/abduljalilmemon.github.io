// jalil.sys: renders page blocks from data.js.
// Pure string builders: the browser uses them at load (renderAll), and
// scripts/sync-fallback.mjs uses the same functions to write the static no-JS
// fallback into index.html, so both are always identical.

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// UPPER_SNAKE values are unfilled placeholders and must never reach the page.
export const isPlaceholder = (v) => typeof v === 'string' && /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(v);

// Email is stored split (data.links.email). opts.reveal (browser) prints the
// real address and a mailto:; the static fallback gets a readable, scraper-
// resistant form and links to #contact instead.
export const emailOf = (d) => `${d.links.email.user}@${d.links.email.domain}`;
const emailText = (d, opts) => (opts.reveal ? emailOf(d)
  : `${d.links.email.user} [at] ${d.links.email.domain.replace(/\./g, ' [dot] ')}`);
const emailHref = (d, opts) => (opts.reveal ? `mailto:${emailOf(d)}` : '#contact');

const isExternal = (href) => /^https?:\/\//.test(href);
const linkAttrs = (href) => `href="${esc(href)}"${isExternal(href) ? ' target="_blank" rel="noopener"' : ''}`;
const placeholderComments = (...vals) => vals.filter(isPlaceholder).map((v) => `<!-- ${v} -->`).join('');

const STATUS_GLYPH = { running: '●', building: '◐', shipped: '✓', archived: '○' };

const i = (n) => '\n' + '  '.repeat(n); // indentation helper for readable static HTML

export const blocks = {
  tagline: (d) => esc(d.profile.tagline),
  summary: (d) => esc(d.profile.summary),
  availability: (d) => esc(d.profile.availability),

  metrics: (d) => d.metrics.map((m) => {
    const unit = m.unit ? `<span class="metric-unit">${esc(m.unit)}</span>` : '';
    const label = esc(m.label) + (m.detail ? ` <span class="metric-detail">· ${esc(m.detail)}</span>` : '');
    return `${i(6)}<div class="metric-tile" data-tone="${esc(m.tone)}">` +
      // visible value is aria-hidden (it counts up); screen readers get the final value once
      `${i(7)}<div class="metric-value" aria-hidden="true"><span class="metric-num" data-count="${m.value}">${m.value}</span>${esc(m.suffix)}${unit}</div>` +
      `<span class="sr-only">${esc(`${m.value}${m.suffix}${m.unit ? ` ${m.unit}` : ''}`)}</span>` +
      `${i(7)}${sparkline(m)}` +
      `${i(7)}<div class="metric-label">${label}</div>` +
      `${i(6)}</div>`;
  }).join('') + i(5),

  terminal: (d) => {
    const t = d.profile.terminal;
    const key = (k) => `<span class="t-key">"${esc(k)}"</span>`;
    const str = (v) => `<span class="t-str">"${esc(v)}"</span>`;
    const entries = Object.entries(t);
    const lines = [
      '<div><span class="t-prompt">$</span> <span class="t-cmd">cat profile.json</span></div>',
      '<div>&nbsp;</div>',
    ];
    entries.forEach(([k, v], idx) => {
      const comma = idx < entries.length - 1 ? ',' : '';
      if (Array.isArray(v)) {
        lines.push(`<div>${key(k)}: <span class="t-arr">[</span></div>`);
        v.forEach((item, j) => lines.push(`<div>&nbsp;&nbsp;${str(item)}${j < v.length - 1 ? ',' : ''}</div>`));
        lines.push(`<div><span class="t-arr">]</span>${comma}</div>`);
      } else if (k === 'status') {
        lines.push(`<div>${key(k)}: <span class="t-val">"${esc(v)}"</span>${comma}</div>`);
      } else {
        lines.push(`<div>${key(k)}: ${str(v)}${comma}</div>`);
      }
    });
    lines.push('<div>&nbsp;</div>', '<div><span class="t-prompt">$</span> <span class="cursor" aria-hidden="true"></span></div>');
    return lines.map((l) => i(7) + l).join('') + i(6);
  },

  awards: (d) => d.awards.map((a) =>
    `${i(4)}<article class="award-item">` +
    `${i(5)}<div class="award-rank" aria-hidden="true">${esc(a.rank)}</div>` +
    `${i(5)}<div class="award-body">` +
    `${i(6)}<h3 class="award-title">${esc(a.title)}</h3>` +
    `${i(6)}<div class="award-meta">${[a.org, a.place, a.date].map(esc).join(' · ')}</div>` +
    `${i(6)}<p class="award-note">Project <a href="${esc(a.project.anchor)}">${esc(a.project.name)}</a>, ${esc(a.note)}</p>` +
    `${i(5)}</div>${i(4)}</article>`,
  ).join('') + i(3),

  skills: (d) => d.skills.map((c) => {
    const tags = c.items.map((it) => {
      const [name, hot] = Array.isArray(it) ? it : [it, false];
      return `${i(6)}<span class="skill-tag${hot ? ' hot' : ''}">${esc(name)}</span>`;
    }).join('');
    return `${i(4)}<div class="skill-category">${i(5)}<div class="skill-cat-name">${esc(c.category)}</div>${i(5)}<div class="skill-tags">${tags}${i(5)}</div>${i(4)}</div>`;
  }).join('') + i(3),

  // Experience as a distributed trace: one span per role on a shared time axis.
  // opts.now extends the axis to today (browser); without it the axis ends at
  // the latest span, so the static fallback is deterministic.
  experience: (d, opts = {}) => {
    const spans = [...d.experience].sort((a, b) => a.start.localeCompare(b.start)); // waterfall: oldest first
    const m = (ym) => { const [y, mo] = ym.split('-').map(Number); return y * 12 + (mo - 1); };
    const startM = Math.floor(m(spans[0].start) / 12) * 12; // Jan of the first year
    const lastEnd = Math.max(...spans.map((e) => m(e.end) + 1));
    const nowM = opts.now ? opts.now.getFullYear() * 12 + opts.now.getMonth() + 1 : lastEnd;
    const endM = Math.max(lastEnd, nowM);
    const pct = (v) => (((v - startM) / (endM - startM)) * 100).toFixed(2);
    const dur = (e) => {
      const n = m(e.end) - m(e.start) + 1; // inclusive months
      const y = Math.floor(n / 12), r = n % 12;
      return [y && `${y}y`, r && `${r}m`].filter(Boolean).join(' ');
    };
    const ticks = [];
    for (let y = startM / 12; y * 12 <= endM; y++) ticks.push(`<span class="trace-tick" style="left:${pct(y * 12)}%">${y}</span>`);
    const nowMark = opts.now ? `<span class="trace-now" style="left:${pct(nowM)}%">now</span>` : '';

    const rows = spans.map((e, k) => {
      const left = +pct(m(e.start)), width = +pct(m(e.end) + 1) - left;
      const where = width >= 26 ? 'in' : left + width < 62 ? 'right' : 'left';
      const id = `span-${k}`;
      const label = `${e.period} · ${dur(e)}`;
      return `${i(5)}<li class="trace-row" style="--span-color: var(--${esc(e.dot || 'accent')})">` +
        `${i(6)}<div class="trace-label"><span class="trace-service">${esc(e.company)}</span><h3 class="trace-op">${esc(e.role)}</h3></div>` +
        `${i(6)}<div class="trace-track">` +
        `${i(7)}<button type="button" class="trace-bar" data-label="${where}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%" aria-expanded="true" aria-controls="${id}" aria-label="${esc(`${e.role} at ${e.company}, ${label}`)}">` +
        `<span class="trace-bar-label">${esc(label)}</span></button>` +
        `${i(6)}</div>` +
        `${i(6)}<div class="trace-panel" id="${id}">` +
        `${i(7)}<div class="exp-company"><span>${esc(e.company)}</span> · ${esc(e.place)} · ${esc(e.period)}</div>` +
        `${i(7)}<ul class="exp-points">${e.points.map((p) => `${i(8)}<li>${esc(p)}</li>`).join('')}${i(7)}</ul>` +
        `${i(7)}<div class="exp-tags">${e.tags.map((t) => `${i(8)}<span class="exp-tag">${esc(t)}</span>`).join('')}${i(7)}</div>` +
        `${i(6)}</div>` +
        `${i(5)}</li>`;
    }).join('');

    return `${i(4)}<div class="trace-head" aria-hidden="true">` +
      `${i(5)}<div class="trace-head-label">service · span</div>` +
      `${i(5)}<div class="trace-axis">${ticks.join('')}${nowMark}</div>` +
      `${i(4)}</div>` +
      `${i(4)}<ol class="trace-spans">${rows}${i(4)}</ol>${i(3)}`;
  },

  // Projects as service cards. Placeholder links are never printed in
  // production; on localhost (opts.dev) they show as a visible TODO.
  projects: (d, opts = {}) => d.projects.map((p, n) => {
    const desc = isPlaceholder(p.desc) ? p.descFallback : p.desc;
    const links = p.links.map((l) => {
      if (!isPlaceholder(l.href)) return `<a ${linkAttrs(l.href)}>${esc(l.label)} →</a>`;
      return opts.dev ? `<span class="project-todo">TODO ${esc(l.label)}: ${esc(l.href)}</span>` : '';
    }).filter(Boolean);
    const status = p.status
      ? `<span class="project-status" data-status="${esc(p.status)}"><span class="status-glyph" aria-hidden="true">${STATUS_GLYPH[p.status] || '●'}</span>${esc(p.status)}</span>`
      : '';
    const comments = placeholderComments(p.desc, ...p.links.map((l) => l.href));
    return `${i(4)}<article class="project-card${p.flagship ? ' flagship' : ''}" id="project-${esc(p.id)}">` +
      (comments ? i(5) + comments : '') +
      `${i(5)}<div class="project-meta"><span class="project-num">${String(n + 1).padStart(2, '0')}${p.flagship ? ' · flagship' : ''}</span>${status}</div>` +
      `${i(5)}<h3 class="project-name">${esc(p.name)}</h3>` +
      (p.award ? `${i(5)}<div class="project-award">🏆 ${esc(p.award)}</div>` : '') +
      (desc ? `${i(5)}<p class="project-desc">${esc(desc)}</p>` : '') +
      (p.stack.length ? `${i(5)}<div class="project-stack">${p.stack.map((s) => `${i(6)}<span class="stack-tag">${esc(s)}</span>`).join('')}${i(5)}</div>` : '') +
      (links.length ? `${i(5)}<div class="project-links">${links.join('')}</div>` : '') +
      `${i(4)}</article>`;
  }).join('') + (d.archive.length ? archive(d) : '') + i(3),

  // JSON-LD Person. Email deliberately omitted (scrapers read structured data).
  jsonld: (d) => {
    const S = d.seo, L = d.links;
    const org = (o) => ({ '@type': 'CollegeOrUniversity', name: o.name, alternateName: o.alternateName });
    const json = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: d.profile.name,
      jobTitle: d.profile.role,
      url: S.url,
      image: `${S.url}og.png`,
      address: { '@type': 'PostalAddress', addressLocality: S.locality, addressCountry: S.country },
      sameAs: [L.github.url, L.linkedin.url],
      alumniOf: org(S.alumniOf),
      affiliation: org(S.affiliation),
      knowsAbout: ['Python', 'Distributed Systems', 'LLM Evaluation', 'Search Infrastructure'],
      award: d.awards.map((a) => (a.title.includes(a.date) ? a.title : `${a.title} (${a.date})`)),
    }, null, 2);
    return `\n${json.replace(/</g, '\\u003c').replace(/^/gm, '  ')}\n  `;
  },

  footerStatus: (d) => esc(d.footer.status),

  about: (d) => d.profile.about.map((p) => `${i(5)}<p>${esc(p)}</p>`).join('') + i(4),

  highlights: (d, opts = {}) => d.profile.highlights.map((h) =>
    `${i(6)}<div class="highlight-row">${i(7)}<div class="hl-icon" aria-hidden="true">${esc(h.icon)}</div>${i(7)}<div>${i(8)}<div class="hl-label">${esc(h.label)}</div>${i(8)}<div class="hl-val">${esc(h.email ? emailText(d, opts) : h.value)}</div>${i(7)}</div>${i(6)}</div>`,
  ).join('') + i(5),

  education: (d) => d.education.map((e) =>
    `${i(5)}<div class="education-card">${i(6)}<div class="edu-degree">${esc(e.degree)}</div>${i(6)}<div class="edu-school">${esc(e.school)}</div>${i(6)}<div class="edu-period">${esc(e.period)}</div>${i(5)}</div>`,
  ).join('') + i(4),

  certifications: (d) => d.certifications.map((c) =>
    `${i(6)}<div class="cert-item">${i(7)}<div class="cert-icon" aria-hidden="true">🏅</div>${i(7)}<div>${i(8)}<div class="cert-name">${esc(c.name)}</div>${i(8)}<div class="cert-issuer">${esc(c.issuer)} · ${esc(c.year)}</div>${i(7)}</div>${i(6)}</div>`,
  ).join('') + i(5),

  contactLinks: (d, opts = {}) => {
    const L = d.links;
    const row = (href, icon, label, val, iconStyle = '') =>
      `${i(6)}<a ${linkAttrs(href)} class="contact-link">${i(7)}<div class="cl-icon"${iconStyle} aria-hidden="true">${icon}</div>${i(7)}<div>${i(8)}<div class="cl-label">${label}</div>${i(8)}<div class="cl-val">${esc(val)}</div>${i(7)}</div>${i(7)}<div class="cl-arrow" aria-hidden="true">→</div>${i(6)}</a>`;
    return row(emailHref(d, opts), '✉', 'Email', emailText(d, opts)) +
      row(L.linkedin.url, 'in', 'LinkedIn', L.linkedin.handle) +
      row(L.github.url, 'gh', 'GitHub', L.github.handle, ' style="font-family: var(--mono); font-size: 0.85rem;"') + i(5);
  },

  footerLinks: (d, opts = {}) => {
    const L = d.links;
    return `${i(5)}<a ${linkAttrs(L.github.url)}>GitHub</a>${i(5)}<a ${linkAttrs(L.linkedin.url)}>LinkedIn</a>${i(5)}<a href="${esc(emailHref(d, opts))}">Email</a>${i(4)}`;
  },
};

// Tiny SVG sparkline, 64x22. Series are step/line values from data.js;
// a null series draws an event tick (a dated one-off, not a trend).
function sparkline(m) {
  const W = 64, H = 22, P = 3;
  let body;
  if (m.series && m.series.length > 1) {
    const min = Math.min(...m.series), max = Math.max(...m.series);
    const x = (k) => P + (k * (W - 2 * P)) / (m.series.length - 1);
    const y = (v) => H - P - ((v - min) / (max - min || 1)) * (H - 2 * P);
    const pts = m.series.map((v, k) => `${x(k).toFixed(1)} ${y(v).toFixed(1)}`);
    body = `<path d="M${pts.join(' L')}" pathLength="1"/>`;
  } else {
    body = `<path d="M${P} ${H - P} H${W - 12} M${W - 8} ${H - P} V${P + 2}" pathLength="1"/><circle cx="${W - 8}" cy="${P + 2}" r="2.2"/>`;
  }
  return `<svg class="metric-spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(m.note)}"><title>${esc(m.note)}</title>${body}</svg>`;
}

function archive(d) {
  const items = d.archive.map((a) =>
    `${i(7)}<li class="archive-item">${i(8)}<div class="archive-name">${esc(a.name)}</div>${i(8)}<p class="archive-desc">${esc(a.desc)}</p>${i(8)}<div class="project-stack">${a.stack.map((s) => `<span class="stack-tag">${esc(s)}</span>`).join('')}</div>${i(7)}</li>`,
  ).join('');
  return `${i(4)}<details class="project-archive">` +
    `${i(5)}<summary><span class="archive-label">Archive</span> <span class="archive-count">${d.archive.length} legacy projects</span></summary>` +
    `${i(5)}<div class="archive-body">${i(6)}<ul class="archive-list">${items}${i(6)}</ul>${i(5)}</div>` +
    `${i(4)}</details>`;
}

// Browser entry: replace every [data-render] block with fresh output.
// Small, fast string hash (FNV-1a, 32-bit) shared with scripts/sync-fallback.mjs.
export function hash(str) {
  let h = 0x811c9dc5;
  for (let k = 0; k < str.length; k++) { h ^= str.charCodeAt(k); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

// opts: { dev, now, reveal } (see the experience, projects and email blocks).
// The sync script stamps data-render-hash = hash(static output) on each block.
// A block is only rewritten when its HTML would actually change: the static
// fallback is stale (data.js edited without syncing), or runtime opts alter it
// (today's date, localhost TODOs, the assembled email). Rewriting identical
// blocks would invalidate style and layout for the whole page on load.
export function renderAll(data, root = document, opts = {}) {
  root.querySelectorAll('[data-render]').forEach((el) => {
    const fn = blocks[el.dataset.render];
    if (!fn || el.tagName === 'SCRIPT') return;
    const staticHtml = fn(data);
    const html = fn(data, opts);
    if (html === staticHtml && el.dataset.renderHash === hash(staticHtml)) return;
    el.innerHTML = html;
  });
}
