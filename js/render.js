// jalil.sys: renders page blocks from data.js.
// Pure string builders: the browser uses them at load (renderAll), and
// scripts/sync-fallback.mjs uses the same functions to write the static no-JS
// fallback into index.html, so both are always identical.

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// UPPER_SNAKE values are unfilled placeholders and must never reach the page.
export const isPlaceholder = (v) => typeof v === 'string' && /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(v);

const isExternal = (href) => /^https?:\/\//.test(href);
const linkAttrs = (href) => `href="${esc(href)}"${isExternal(href) ? ' target="_blank" rel="noopener"' : ''}`;
const placeholderComments = (...vals) => vals.filter(isPlaceholder).map((v) => `<!-- ${v} -->`).join('');

const i = (n) => '\n' + '  '.repeat(n); // indentation helper for readable static HTML

export const blocks = {
  tagline: (d) => esc(d.profile.tagline),
  summary: (d) => esc(d.profile.summary),
  availability: (d) => esc(d.profile.availability),

  stats: (d) => d.stats.map((s) =>
    `${i(6)}<div class="stat-item">${i(7)}<div class="stat-num">${esc(s.value)}</div>${i(7)}<div class="stat-label">${esc(s.label)}</div>${i(6)}</div>`,
  ).join('') + i(5),

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
    lines.push('<div>&nbsp;</div>', '<div><span class="t-prompt">$</span> <span class="cursor"></span></div>');
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

  experience: (d) => d.experience.map((e) => {
    const dotStyle = e.dot && e.dot !== 'accent' ? ` style="background: var(--${e.dot}); box-shadow: 0 0 12px var(--${e.dot});"` : '';
    return `${i(4)}<div class="exp-item">` +
      `${i(5)}<div class="exp-dot"${dotStyle}></div>` +
      `${i(5)}<div class="exp-header">${i(6)}<h3 class="exp-role">${esc(e.role)}</h3>${i(6)}<div class="exp-period">${esc(e.period)}</div>${i(5)}</div>` +
      `${i(5)}<div class="exp-company"><span>${esc(e.company)}</span> · ${esc(e.place)}</div>` +
      `${i(5)}<ul class="exp-points">${e.points.map((p) => `${i(6)}<li>${esc(p)}</li>`).join('')}${i(5)}</ul>` +
      `${i(5)}<div class="exp-tags">${e.tags.map((t) => `${i(6)}<span class="exp-tag">${esc(t)}</span>`).join('')}${i(5)}</div>` +
      `${i(4)}</div>`;
  }).join('') + i(3),

  projects: (d) => d.projects.map((p, n) => {
    const desc = isPlaceholder(p.desc) ? p.descFallback : p.desc;
    const links = p.links.filter((l) => !isPlaceholder(l.href));
    const status = p.status
      ? `<span class="project-status" data-status="${esc(p.status)}">${esc(p.status)}</span>`
      : '';
    return `${i(4)}<article class="project-card${p.flagship ? ' flagship' : ''}" id="project-${esc(p.id)}">` +
      `${placeholderComments(p.desc, ...p.links.map((l) => l.href)) ? i(5) + placeholderComments(p.desc, ...p.links.map((l) => l.href)) : ''}` +
      `${i(5)}<div class="project-meta"><span class="project-num">${String(n + 1).padStart(2, '0')}${p.flagship ? ' · flagship' : ''}</span>${status}</div>` +
      `${i(5)}<h3 class="project-name">${esc(p.name)}</h3>` +
      (p.award ? `${i(5)}<div class="project-award">🏆 ${esc(p.award)}</div>` : '') +
      (desc ? `${i(5)}<p class="project-desc">${esc(desc)}</p>` : '') +
      (p.stack.length ? `${i(5)}<div class="project-stack">${p.stack.map((s) => `${i(6)}<span class="stack-tag">${esc(s)}</span>`).join('')}${i(5)}</div>` : '') +
      (links.length ? `${i(5)}<div class="project-links">${links.map((l) => `<a ${linkAttrs(l.href)}>${esc(l.label)} →</a>`).join('')}</div>` : '') +
      `${i(4)}</article>`;
  }).join('') + (d.archive.length ? archive(d) : '') + i(3),

  about: (d) => d.profile.about.map((p) => `${i(5)}<p>${esc(p)}</p>`).join('') + i(4),

  highlights: (d) => d.profile.highlights.map((h) =>
    `${i(6)}<div class="highlight-row">${i(7)}<div class="hl-icon" aria-hidden="true">${esc(h.icon)}</div>${i(7)}<div>${i(8)}<div class="hl-label">${esc(h.label)}</div>${i(8)}<div class="hl-val">${esc(h.value)}</div>${i(7)}</div>${i(6)}</div>`,
  ).join('') + i(5),

  education: (d) => d.education.map((e) =>
    `${i(5)}<div class="education-card">${i(6)}<div class="edu-degree">${esc(e.degree)}</div>${i(6)}<div class="edu-school">${esc(e.school)}</div>${i(6)}<div class="edu-period">${esc(e.period)}</div>${i(5)}</div>`,
  ).join('') + i(4),

  certifications: (d) => d.certifications.map((c) =>
    `${i(6)}<div class="cert-item">${i(7)}<div class="cert-icon" aria-hidden="true">🏅</div>${i(7)}<div>${i(8)}<div class="cert-name">${esc(c.name)}</div>${i(8)}<div class="cert-issuer">${esc(c.issuer)} · ${esc(c.year)}</div>${i(7)}</div>${i(6)}</div>`,
  ).join('') + i(5),

  contactLinks: (d) => {
    const L = d.links;
    const row = (href, icon, label, val, iconStyle = '') =>
      `${i(6)}<a ${linkAttrs(href)} class="contact-link">${i(7)}<div class="cl-icon"${iconStyle} aria-hidden="true">${icon}</div>${i(7)}<div>${i(8)}<div class="cl-label">${label}</div>${i(8)}<div class="cl-val">${esc(val)}</div>${i(7)}</div>${i(7)}<div class="cl-arrow" aria-hidden="true">→</div>${i(6)}</a>`;
    return row(`mailto:${L.email}`, '✉', 'Email', L.email) +
      row(L.linkedin.url, 'in', 'LinkedIn', L.linkedin.handle) +
      row(L.github.url, 'gh', 'GitHub', L.github.handle, ' style="font-family: var(--mono); font-size: 0.85rem;"') + i(5);
  },

  footerLinks: (d) => {
    const L = d.links;
    return `${i(5)}<a ${linkAttrs(L.github.url)}>GitHub</a>${i(5)}<a ${linkAttrs(L.linkedin.url)}>LinkedIn</a>${i(5)}<a href="mailto:${esc(L.email)}">Email</a>${i(4)}`;
  },
};

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
export function renderAll(data, root = document) {
  root.querySelectorAll('[data-render]').forEach((el) => {
    const fn = blocks[el.dataset.render];
    if (fn) el.innerHTML = fn(data);
  });
}
