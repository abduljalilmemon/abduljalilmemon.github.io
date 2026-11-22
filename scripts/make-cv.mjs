#!/usr/bin/env node
// Generates cv.pdf (A4) from js/data.js, the same source as the website, so
// the CV and the site never disagree. Rendered with headless Chrome (real,
// selectable text: ATS-friendly, single column, standard section headings).
//
//   node scripts/make-cv.mjs              # writes cv.pdf (+ cv.preview.html for checking)
//   CHROME="/path/to/chrome" node scripts/make-cv.mjs
//
// Then run `node scripts/sync-fallback.mjs` so the site shows "Download CV".
// Rules: only facts from data.js. Placeholders (UPPER_SNAKE) are never printed.
// The phone number is intentionally absent (cv.pdf is public on the site).

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { data } from '../js/data.js';
import { isPlaceholder, emailOf } from '../js/render.js';
import { withChrome } from './chrome.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const font = (f) => `data:font/woff2;base64,${readFileSync(join(root, 'fonts', f)).toString('base64')}`;
const bare = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const P = data.profile, L = data.links;
const email = emailOf(data);

// Which projects go on the CV, in this order (ids from data.projects).
const CV_PROJECTS = ['swapcheck', 'voice-agent', 'firechronos', 'streaker', 'health-platform'];

const summary = `${P.role} with 5+ years building scalable Python backends, high-throughput data pipelines and search infrastructure, `
  + 'plus LLM evaluation (RLHF, SFT, LLM-as-judge) and AI agents. M.Sc. Artificial Intelligence student at BTU Cottbus-Senftenberg. '
  + 'Open to working student, internship and full-time roles in Berlin, Cottbus, Dresden or remote.';

const experience = data.experience.map((e) => `
  <article class="entry">
    <header class="entry-head">
      <h3>${esc(e.role)} <span class="at">· ${esc(e.company)}</span></h3>
      <span class="when">${esc(e.period)} · ${esc(e.place)}</span>
    </header>
    <ul>${e.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    <p class="tags">${e.tags.map(esc).join(' · ')}</p>
  </article>`).join('');

const projects = CV_PROJECTS.map((id) => data.projects.find((p) => p.id === id)).filter(Boolean).map((p) => {
  const desc = isPlaceholder(p.desc) ? p.descFallback : p.desc;
  const link = p.links.find((l) => !isPlaceholder(l.href));
  const status = p.status === 'building' ? 'in progress' : p.status === 'running' ? 'live' : p.status || '';
  return `
  <article class="entry project">
    <header class="entry-head">
      <h3>${esc(p.name)}${p.award ? ` <span class="award">· ${esc(p.award)}</span>` : ''}</h3>
      <span class="when">${esc(status)}${link ? ` · <a href="${esc(link.href)}">${esc(bare(link.href))}</a>` : ''}</span>
    </header>
    <p>${esc(desc)}</p>
    ${p.stack.length ? `<p class="tags">${p.stack.map(esc).join(' · ')}</p>` : ''}
  </article>`;
}).join('');

const awards = data.awards.map((a) => `
  <li><strong>${esc(a.title)}</strong>, ${esc(a.org)}, ${esc(a.place)}, ${esc(a.date)}. Project ${esc(a.project.name)}, ${esc(a.note.split(';')[0])}.</li>`).join(''); // first clause only: the project entry has the rest

const education = data.education.map((e) => `
  <article class="entry">
    <header class="entry-head">
      <h3>${esc(e.degree)}</h3>
      <span class="when">${esc(e.period)}</span>
    </header>
    <p class="school">${esc(e.school)}</p>
  </article>`).join('');

const skills = data.skills.map((c) => `
  <div class="skill-row"><dt>${esc(c.category)}</dt><dd>${c.items.map((it) => esc(Array.isArray(it) ? it[0] : it)).join(', ')}</dd></div>`).join('');

const certs = data.certifications.map((c) => `<li>${esc(c.name)}, ${esc(c.issuer)} (${esc(c.year)})</li>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(P.name)} · CV</title>
<style>
  @font-face { font-family: 'Syne'; font-weight: 700 800; src: url(${font('syne-latin.woff2')}) format('woff2'); }
  @font-face { font-family: 'DM Sans'; font-weight: 300 400; src: url(${font('dm-sans-latin.woff2')}) format('woff2'); }
  @font-face { font-family: 'Space Mono'; font-weight: 400; src: url(${font('space-mono-400-latin.woff2')}) format('woff2'); }
  @font-face { font-family: 'Space Mono'; font-weight: 700; src: url(${font('space-mono-700-latin.woff2')}) format('woff2'); }
  @page { size: A4; margin: 14mm 15mm 14mm; }
  :root { --ink: #14141f; --soft: #4a4a5e; --line: #dcdce6; --accent: #0e7490; --accent2: #6d28d9; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'DM Sans', Arial, sans-serif; font-size: 9.6pt; line-height: 1.42; color: var(--ink); }
  a { color: var(--accent); text-decoration: none; }
  header.top { border-bottom: 2px solid var(--accent); padding-bottom: 7pt; margin-bottom: 9pt; }
  h1 { font-family: 'Syne', Arial, sans-serif; font-weight: 800; font-size: 22pt; letter-spacing: -0.3pt; line-height: 1.05; }
  h1 .last { color: var(--accent); }
  .role { font-family: 'Space Mono', monospace; font-size: 9pt; color: var(--soft); margin-top: 3pt; }
  .role b { color: var(--accent2); font-weight: 400; }
  .contact { font-family: 'Space Mono', monospace; font-size: 8.2pt; color: var(--soft); margin-top: 5pt; display: flex; flex-wrap: wrap; gap: 2pt 12pt; }
  section { margin-top: 9pt; }
  h2 { font-family: 'Syne', Arial, sans-serif; font-weight: 700; font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.9pt; color: var(--accent); border-bottom: 1px solid var(--line); padding-bottom: 2pt; margin-bottom: 5pt; }
  .entry { margin-bottom: 6.5pt; break-inside: avoid; }
  .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }
  h3 { font-family: 'Syne', Arial, sans-serif; font-weight: 700; font-size: 10pt; }
  h3 .at { color: var(--accent2); font-weight: 700; }
  h3 .award { color: var(--accent); font-family: 'DM Sans', Arial, sans-serif; font-weight: 400; font-size: 9pt; }
  .when { font-family: 'Space Mono', monospace; font-size: 8pt; color: var(--soft); white-space: nowrap; }
  ul { padding-left: 11pt; margin-top: 2pt; }
  li { margin: 1pt 0; }
  li::marker { color: var(--accent); }
  .tags { font-family: 'Space Mono', monospace; font-size: 7.6pt; color: var(--soft); margin-top: 2pt; }
  .project p:not(.tags) { margin-top: 1.5pt; }
  .school { color: var(--soft); }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 2pt 10pt; }
  .skill-row { display: contents; }
  dt { font-family: 'Space Mono', monospace; font-size: 8pt; font-weight: 700; color: var(--accent2); padding-top: 0.6pt; }
  dd { font-size: 9pt; }
  .awards li strong { font-family: 'Syne', Arial, sans-serif; font-weight: 700; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16pt; }
  footer { margin-top: 10pt; font-family: 'Space Mono', monospace; font-size: 7.4pt; color: var(--soft); text-align: right; }
</style></head>
<body>
  <header class="top">
    <h1>${esc(P.name.split(' ').slice(0, -1).join(' '))} <span class="last">${esc(P.name.split(' ').pop())}</span></h1>
    <p class="role">${esc(P.role)} · <b>${esc(P.focus)}</b></p>
    <p class="contact">
      <span>${esc(P.location)}</span>
      <a href="mailto:${esc(email)}">${esc(email)}</a>
      <a href="${esc(L.linkedin.url)}">${esc(bare(L.linkedin.url))}</a>
      <a href="${esc(L.github.url)}">${esc(bare(L.github.url))}</a>
      <a href="${esc(data.seo.url)}">${esc(bare(data.seo.url))}</a>
    </p>
  </header>

  <section><h2>Summary</h2><p>${esc(summary)}</p></section>
  <section><h2>Experience</h2>${experience}</section>
  <section><h2>Projects</h2>${projects}</section>
  <section class="awards"><h2>Awards</h2><ul>${awards}</ul></section>
  <section><h2>Education</h2>${education}</section>
  <section><h2>Skills</h2><dl>${skills}</dl></section>
  <section><h2>Certifications</h2><ul class="two">${certs}</ul></section>
  <footer>${esc(bare(data.seo.url))}</footer>
</body></html>`;

writeFileSync(join(root, 'cv.preview.html'), html);
await withChrome(async ({ send, setHtml }) => {
  await setHtml(html);
  const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, generateTaggedPDF: true });
  if (!pdf.data) throw new Error(`printToPDF failed: ${JSON.stringify(pdf.error || pdf)}`);
  writeFileSync(join(root, 'cv.pdf'), Buffer.from(pdf.data, 'base64'));
  const pages = await send('Runtime.evaluate', { expression: 'Math.ceil(document.documentElement.scrollHeight / (297 / 25.4 * 96 - 28 / 25.4 * 96))', returnByValue: true });
  console.log(`wrote cv.pdf (~${pages.result?.value} A4 page(s)) and cv.preview.html`);
});
