# jalil.sys — Refactor Plan (Prompt 1 of 5)

Concept: **"jalil.sys, a system that's running."** The page reads as an observable
backend system. Every animation must stand for something real: queue depth, search
latency, pipeline stages, eval scores.

Design tokens that stay: `--bg #0a0a0f`, `--accent #00e5ff`, `--accent2 #7c3aed`,
`--accent3 #10b981`; Space Mono / Syne / DM Sans; noise overlay; faint 60px grid.

Constraints: plain HTML/CSS/JS, no build step, no npm runtime deps, GitHub Pages.
Respect `prefers-reduced-motion` and `pointer: coarse` in everything new.

---

## 1. Current state (verified)

- `index.html` is the only rendered page: 1414 lines in total, made up of about 840 lines of inline
  CSS (L10–847), markup, and two inline scripts (L854–880 cursor glow; L1381–1413
  reveal, nav highlight, mobile nav, fake form handler).
- `grep` of `index.html` for `assets/`, `forms/`, `inner-page`, `portfolio-details`,
  `src=`, `href=` finds only Google Fonts, `#anchors`, `mailto:`, `tel:` and
  external GitHub/LinkedIn URLs. **No local file is referenced.**
- `inner-page.html` and `portfolio-details.html` are the old Bootstrap "Alex Smith"
  template pages; they link back to `index.html` but nothing links to them.
- `assets/` is about 15 MB of template vendor code (Bootstrap, AOS, boxicons, glightbox,
  isotope, swiper, typed.js, waypoints, php-email-form), SCSS, stock images.

## 2. New file map

```
/
├── index.html          markup only; <link> to css, <script type="module" defer>
├── css/
│   └── main.css        everything from the inline <style>, byte-for-byte at first
├── js/
│   └── main.js         ES module: cursor, reveal, nav highlight, mobile nav, form
├── img/
│   ├── favicon.png         (moved from assets/img/)
│   ├── apple-touch-icon.png(moved from assets/img/)
│   └── profile-img.jpg     (moved; kept for a later og:image, not rendered yet)
├── PLAN.md
└── (later prompts may add js/modules/*.js, one per "system" widget)
```

Note: `type="module"` scripts are already deferred, so `defer` adds nothing (harmless,
kept as requested). Module scope also means the inline `onclick="toggleNav()"` /
`onclick="handleSubmit(event)"` handlers **will break**, so they get replaced with
`addEventListener` in `main.js`.

## 3. Files to delete

- `inner-page.html`
- `portfolio-details.html`
- `forms/` (`Readme.txt`, `contact.php`; PHP does not run on GitHub Pages anyway)
- `assets/css/`, `assets/js/`, `assets/scss/`, `assets/vendor/` (all of it)
- `assets/img/*` **except** `favicon.png`, `apple-touch-icon.png`, `profile-img.jpg`
  (those three move to `/img/`). That covers the tech-logo PNGs/SVGs, `hero-bg.jpg`, `profile-img.png`
  (duplicate of the jpg), `portfolio/*`, `testimonials/*` (template stock photos)
- then remove the empty `assets/` directory

## 4. Bugs to fix in Step B

Requested:

1. **Fake contact form.** `handleSubmit` shows "Message sent!" and sends nothing.
   → Real `<form action="https://formspree.io/f/FORMSPREE_ID" method="POST">` with
   `name` attributes, `required`, labels tied with `for`/`id`, a `_gotcha` honeypot,
   `fetch` with `Accept: application/json`, and three states: sending (button disabled),
   success (only on a 2xx), error (shows the mailto fallback). While the ID is still
   the placeholder, the form shows an error and never a false success.
2. **Mobile nav is missing `#ai-lab` "Intelligence".**
3. **Section numbering.** Starts at `02`, and `#ai-lab` has no number. → Renumber to `01`–`07`
   (see open question 5 about what the 7th is).
4. **Custom cursor** is on at `min-width: 1024px` no matter the input device, and
   ignores reduced motion. → Enable only under
   `(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`,
   in both the CSS (`cursor: none`) and JS (do not attach listeners or show the elements).
5. **No favicon `<link>`.** → `icon` + `apple-touch-icon`.

Found while reading (fixed in Step B unless noted):

6. **Cursor dot/glow visible on touch devices.** They sit at `0,0` with
   `translate(-50%,-50%)`, so a quarter of the cyan dot shows in the top-left corner on phones.
   Item 4 fixes this.
7. **Hamburger is a `<div onclick>`**: not focusable, no keyboard support, no
   `aria-expanded`/`aria-controls`. → `<button>` with ARIA; Esc closes the menu.
8. **Reveal hides content without JS**: `.reveal`, `.exp-item` and `.project-card` start at
   `opacity: 0`. → Gate behind a `.js` class on `<html>`; skip the transition under
   reduced motion. Same for `scroll-behavior: smooth` and the hero keyframes.
9. **Nav highlight runs on every scroll event** and reads `offsetTop` each time. → Use an
   IntersectionObserver; also add `aria-current`.
10. **`#ai-lab` heading's `<span class="accent">` is unstyled** (`.accent` is only
    defined under `.hero-name`), and `#ai-lab` lacks the `.reveal` classes the other
    sections use. *Visual change, so deferred to Prompt 2 so that Step B stays pixel-identical.*
11. `.project-card` declares `transition` twice (the second wins). Harmless; tidy it
    when splitting.
12. Voice-agent link has no `target`/`rel`; `target="_blank"` links lack
    `rel="noopener"`. → Make these consistent.
13. **Content inconsistency (not a code bug):** the TechnoGenics Senior SE bullet says
    "Kafka" while its tags list RabbitMQ/Redis, and the sentence is missing a
    punctuation mark ("using Kafka 10× improvement"). Also, Turing (Nov 2024 start) overlaps
    TechnoGenics Senior (to Dec 2024). Is that intentional? Text left as is until you confirm.

## 5. Open questions (blocking)

1. **Turing status.** The timeline says "Nov 2024 – Apr 2026", the terminal says
   `"current": "Turing · AI Dev"`, and About says "Last Role". Which is true? (If
   it has ended, the terminal becomes e.g. `"last_role"`, and `"status": "open_to_work"`
   stays.)
2. **Phone number** `+49 152 …` is public in Contact. Keep or remove?
3. **Streaker.** It is not on the page today. I need a one-line description and a link.
   I will not write either myself.
4. **College Automation & Event Management**: archive (collapsed "legacy" list) or
   drop?
5. **The 7th section number.** There are six numbered sections today (Skills,
   Experience, Intelligence, Projects, About, Contact). Proposal: Hero = `01 / Status`,
   then `02`–`07`. Or is a new section (e.g. Streaker or a "system" panel) meant to be one of them?
6. **Image folder.** OK to move the three kept images to `/img/`, or keep them at `assets/img/`?

### Answers (2026-11-20)

1. Turing: **ended Apr 2026**. Terminal uses `"last_role"`, About is past tense, dates stay Nov 2024 – Apr 2026.
2. Phone: **remove** from the public page.
3. Streaker: no line given yet → `STREAKER_DESC`, `STREAKER_URL` placeholders.
4. College Automation & Event Management: **archive** (collapsed row).
5. Numbering: default taken: Hero = `01 / Status`.
6. Images: default taken: moved to `/img/`.

## 6. Step B commit

`chore: remove template leftovers, split assets, fix form and nav`

Verification: `python3 -m http.server`; compare 375px and 1440px before and after
(the page should look identical except for the cursor and nav fixes); check the console for errors;
submit the form with the placeholder ID and confirm the error state appears, not a success message.

## 7. Prompt 2: content (data.js)

### Hero tagline: pick one (option 1 is live until you choose)

1. **"Backend systems that scale. LLM evals that don't lie."** *(live)*
2. "I build the queues, search and pipelines underneath, and the evals that tell you if the model on top is any good."
3. "From 50,000-IOC Kafka batches to SHIP / HOLD verdicts on model swaps."

To switch, change `profile.tagline` in `js/data.js` and run `node scripts/sync-fallback.mjs`.

### How content works now

- `js/data.js` is the single source for profile, stats, awards, skills, experience,
  projects, archive, education, certifications and links.
- `js/render.js` holds pure string builders. `main.js` re-renders every `[data-render]`
  block on load; if that throws, the static HTML stays.
- `scripts/sync-fallback.mjs` (Node, no deps, optional) writes the same output into
  `index.html` so the page reads with JS off. `--check` fails if the fallback is stale.
  This is a dev helper, not a deploy step.
- UPPER_SNAKE placeholders never reach the page: placeholder links are dropped, and a
  placeholder description falls back to `descFallback`. They stay as HTML comments so grep finds them.

### Section order

01 Status (hero) · 02 Awards · 03 Skills · 04 Experience · 05 Projects · 06 About · 07 Contact.
`#ai-lab` was merged into Projects (Voice Agent = flagship; n8n = project 05).

## 8. Placeholders and missing files

| Placeholder          | Where                          | Needed from you                  |
|----------------------|--------------------------------|----------------------------------|
| `FORMSPREE_ID`       | `index.html` contact form      | Formspree form ID (`/f/xxxxxxx`) |
| `SWAPCHECK_REPO_URL` | `js/data.js` → SwapCheck link   | Repo URL                         |
| `STREAKER_DESC`      | `js/data.js` → Streaker         | One-line description             |
| `STREAKER_URL`       | `js/data.js` → Streaker link    | Repo or demo URL                 |
| `/cv.pdf`            | Hero "Download CV" button      | Add `cv.pdf` at the repo root (currently a 404) |

## 9. Prompt 3: animated hero

Modules (all content from `js/data.js`):

| Module | What it means | Motion rules |
|---|---|---|
| `boot.js` | Startup log: brokers, index, eval harness, ready (≈1.26s) | First visit per session (`sessionStorage`); any key/click/tap skips it, even before the module loads; none under reduced motion; CSS failsafe hides it after 4s |
| `bus-canvas.js` | producer → kafka/rabbitmq → elasticsearch → llm-judge. Packet colour = traffic type (events cyan, jobs green, evals violet); nodes ring when a packet arrives | Lazy-loaded after first paint on idle; pauses off-screen or in hidden tabs; ≤60 packets (24 under 768px); hover routing on fine pointers only; static SVG under reduced motion |
| `terminal.js` | Live `profile.json` shell: help, whoami, skills, experience, projects, awards, contact, resume, hire, sudo hire jalil, clear | Real labelled `<input>`, `aria-live` output, history and tab completion; card keeps the fallback height (no shift) |
| `metrics.js` | 5+ yrs · 50× ES · 10× IOC (5k → 50k/msg) · 1st Monad Blitz | Count-up once in view after boot; final values are in the HTML |

Measured (headless Chrome, GPU on, 1440px): rAF p50 16.7ms and p95 17.0ms with the canvas, the same as without it.
Layout shift during boot and typing ≈ 0.

Known trade-off: on phones the terminal (above the name, as before) is now taller
because of the `seeking` array. Worth revisiting in the redesign.
