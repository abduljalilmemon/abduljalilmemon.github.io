# jalil.sys

Portfolio of Abdul Jalil Memon at **https://abduljalilmemon.github.io**, styled as
a running backend system: a boot log, a message bus, a live terminal, an
experience trace and service cards.

Plain HTML, CSS and JavaScript (ES modules). There is no framework, no bundler and no
npm dependencies at runtime. GitHub Pages serves the repository as is.

---

## Preview locally

```bash
python scripts/serve.py          # http://127.0.0.1:8000
python scripts/serve.py 8765     # any port
```

`scripts/serve.py` is the standard library `http.server` with three additions
that match GitHub Pages: gzip, `404.html` for missing paths, and a larger
connection backlog. Without the larger backlog, Windows refuses some of the
parallel module requests and you get a half-loaded page.

Opening `index.html` straight from disk (`file://`) won't run the JavaScript,
because browsers block ES modules there. You'll see the static fallback instead.

## Edit content: `js/data.js`

All content lives in **`js/data.js`**: profile, tagline, metrics, awards, skills,
experience, projects, archive, education, certifications, links, the footer status line
and the SEO facts. `index.html` keeps a static copy of the same content so the
page reads fine with JavaScript disabled.

After **any** edit to `js/data.js`, `js/*.js` or `css/main.css`, run:

```bash
node scripts/sync-fallback.mjs           # rewrites the fallback, stamps ?v= cache-busting hashes
node scripts/sync-fallback.mjs --check   # verify before committing (exits 1 if anything is stale)
```

The sync step:
- rewrites every `data-render="…"` block in `index.html` from `data.js`;
- generates the JSON-LD `Person` block;
- stamps `?v=<content hash>` on CSS and JS URLs so visitors never mix a new page with old cached files;
- syntax-checks every module, so a typo can't silently drop the whole site to its no-JS fallback.

Rules for content:
- Plain text only. The renderer escapes it.
- Never invent numbers, dates or links. Put an `UPPER_SNAKE` placeholder there instead (see below).
- Every metric in `metrics` must be backed by an experience bullet or an award.

## Add a project

Add an object to `projects` in `js/data.js`. The array order is the display order.

```js
{
  id: 'my-service',                 // used for the card's anchor: #project-my-service
  name: 'My Service',
  status: 'building',               // running | building | shipped | archived | null
  desc: 'One or two sentences on what it does.',
  stack: ['FastAPI', 'PostgreSQL'], // shown as tags
  links: [{ label: 'view source', href: 'https://github.com/you/my-service' }],
  // optional:
  flagship: true,                   // wide, highlighted card (use for one project)
  award: '1st Place · Some Hackathon',
},
```

Then run `node scripts/sync-fallback.mjs`.

- If you don't have a URL yet, use a placeholder such as `href: 'MY_SERVICE_REPO_URL'`.
  Placeholder links never appear on the live site. On localhost they show up as amber TODO tags.
- To retire a project, move it to `archive` (the collapsed "Archive" row) or set `status: 'archived'`.

## Set up the contact form (Web3Forms)

GitHub Pages can't receive form posts, so messages go through
[Web3Forms](https://web3forms.com): free, no account needed, 250 messages a month.

1. Go to https://web3forms.com, enter the email address that should receive messages, and
   copy the **access key** they send you.
2. In `index.html`, replace the placeholder in the contact form:
   ```html
   <input type="hidden" name="access_key" value="WEB3FORMS_ACCESS_KEY">
   ```
3. Run `node scripts/sync-fallback.mjs`, then commit and push.

The access key is meant to be public (it can only deliver to your inbox), so your email
address never appears in the page source. Until the key is set, submitting opens the
visitor's email app with their message pre-filled. The form only reports "Message sent"
when Web3Forms confirms `success: true`. A hidden `botcheck` field catches simple spam bots.

## Placeholders

Values that are still unknown are written as `UPPER_SNAKE` placeholders. List them with:

```bash
node scripts/sync-fallback.mjs --check                      # prints the placeholders open in data.js
grep -rnE "\b[A-Z][A-Z0-9]*(_[A-Z0-9]+)+\b" index.html js/data.js
```

| Placeholder                 | File            | What to put there                       |
|-----------------------------|-----------------|-----------------------------------------|
| `WEB3FORMS_ACCESS_KEY`      | `index.html`    | Web3Forms access key (contact form)      |
| `SWAPCHECK_REPO_URL`        | `js/data.js`    | SwapCheck repository URL                 |
| `FIRECHRONOS_REPO_URL`      | `js/data.js`    | FireChronos repo URL (or remove the link)|
| `STREAKER_DESC`             | `js/data.js`    | One-line Streaker description            |
| `STREAKER_URL`              | `js/data.js`    | Streaker repository or demo URL          |
| `HEALTH_PLATFORM_REPO_URL`  | `js/data.js`    | Health platform GitHub org or repo URL   |
| `SALES_AUTOMATION_REPO_URL` | `js/data.js`    | n8n project URL (or remove the link)     |
| `MARIO_ASM_REPO_URL`        | `js/data.js`    | Assembly Mario repo URL (or remove)      |

Also missing: **`cv.pdf`** at the repository root. Use that exact filename, with no
spaces or brackets. Until it exists, the "Download CV" button is hidden, the terminal's `resume`
command says it isn't uploaded, and the palette leaves it out. After adding the file, run
`node scripts/sync-fallback.mjs` so the static page shows the button too.

## Images and icons

```bash
node scripts/make-images.mjs   # needs Chrome or Edge; set CHROME=/path/to/chrome if it isn't found
```

This generates `og.png` (1200×630 social card), `favicon.svg`, `favicon.ico`,
`img/apple-touch-icon.png` and `img/icon-192.png` / `icon-512.png` from SVG, using
headless Chrome. Re-run it after changing your name, tagline or role in `data.js`.

## Layout

```
index.html            page + static no-JS fallback (generated blocks marked data-render)
404.html              "HTTP 404: route not found in jalil.sys" + mini terminal
css/main.css          all styles; tokens at the top (:root)
js/data.js            ← all content
js/render.js          pure HTML builders shared by the browser and the sync script
js/main.js            entry: render, then start each feature (failures stay isolated)
js/boot.js            first-visit boot log (skipped under reduced motion)
js/bus-canvas.js      hero message bus (static SVG on phones / reduced motion)
js/terminal.js        interactive profile.json terminal
js/metrics.js         count-up metric tiles
js/trace.js           experience as a distributed trace
js/cards.js           service-card tilt and glow (mouse only)
js/palette.js         Ctrl/⌘ K command palette
js/effects.js         title decrypt, scroll progress, Konami burst
js/toast.js           small live-region toast
js/cv.js              checks that cv.pdf exists before offering it
js/notfound.js        404 terminal
fonts/                self-hosted latin subsets (Syne, DM Sans, Space Mono)
scripts/              dev tools: serve.py, sync-fallback.mjs, make-images.mjs
PLAN.md               decisions, measurements and open questions
```

## Accessibility notes

- One `h1`, landmarks (`header` / `main` / `footer`), a skip link, and 2px cyan focus rings.
- Text colours meet WCAG AA on every surface (`--muted` ≥ 5.1:1; violet text uses `--accent2-text`).
- Every animation is either `aria-hidden` decoration or has a text equivalent (the metric tiles carry
  `sr-only` final values, and terminal output goes through an `aria-live` region).
- `prefers-reduced-motion`: no boot, no typing, no count-up, no decrypt, and a static bus.
- With JavaScript off, all content is readable (the static fallback).
