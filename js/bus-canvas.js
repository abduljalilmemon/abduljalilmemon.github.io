// jalil.sys: hero message bus. Labelled nodes joined by curved edges, with
// packets flowing producer → brokers → index → judge. Packet colour = traffic
// type: events (cyan), jobs (green), evals (violet).
//
// - rAF loop, devicePixelRatio-aware (capped at 2), at most 60 packets
//   (24 on narrow screens).
// - Static layer (edges, nodes, labels) is cached offscreen; each frame only
//   blits it and draws packet sprites, so a frame costs well under 1ms.
// - Pauses when the tab is hidden or the hero is off-screen.
// - Hover (fine pointers only): packets speed up slightly and route toward
//   the node nearest the cursor.
// - Reduced motion: a static SVG frame of the same graph instead.

const COLORS = { events: '#00e5ff', jobs: '#10b981', evals: '#7c3aed' };
const BASE_SPEED = 110;     // px per second along an edge
const HOVER_BOOST = 1.35;
const SPAWN_MS = 170;
const BURST_SPAWN_MS = 12;  // Konami burst (effects.js)
const BURST_CAP = 180;

export function initBus(data, host = document.getElementById('bus-layer')) {
  const hero = document.getElementById('hero');
  if (!host || !hero) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const graph = buildGraph(data.bus);
  if (reduced) return staticFrame(host, graph, data.bus.legend);
  return animate(host, hero, graph, data.bus.legend);
}

/* ---------- graph ---------- */
function buildGraph(bus) {
  const nodes = bus.nodes.map((n) => ({ ...n, out: [], flash: 0 }));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = bus.edges.map((e) => {
    const edge = { ...e, a: byId[e.from], b: byId[e.to] };
    edge.a.out.push(edge);
    return edge;
  });
  const sources = nodes.filter((n) => !bus.edges.some((e) => e.to === n.id));
  // next[from][target] = first edge on a shortest path from → target
  const next = {};
  for (const start of nodes) {
    next[start.id] = {};
    const queue = [[start, null]], seen = new Set([start.id]);
    while (queue.length) {
      const [node, first] = queue.shift();
      for (const e of node.out) {
        if (seen.has(e.b.id)) continue;
        seen.add(e.b.id);
        const f = first || e;
        next[start.id][e.b.id] = f;
        queue.push([e.b, f]);
      }
    }
  }
  return { nodes, edges, sources, next };
}

// Lay out nodes in pixels and give each edge a quadratic curve that bows away
// from the hero centre, so traffic runs around the content rather than across it.
function layout(graph, w, h) {
  for (const n of graph.nodes) { n.px = n.x * w; n.py = n.y * h; }
  for (const e of graph.edges) {
    const mx = (e.a.px + e.b.px) / 2, my = (e.a.py + e.b.py) / 2;
    let dx = mx - w / 2, dy = my - h / 2;
    const d = Math.hypot(dx, dy) || 1;
    const len = Math.hypot(e.b.px - e.a.px, e.b.py - e.a.py);
    const bow = Math.min(len * 0.18, 90);
    dx /= d; dy /= d;
    e.cx = mx + dx * bow; e.cy = my + dy * bow;
    e.len = approxLen(e);
  }
}
const qb = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
function approxLen(e) {
  let L = 0, x = e.a.px, y = e.a.py;
  for (let k = 1; k <= 16; k++) {
    const t = k / 16, nx = qb(e.a.px, e.cx, e.b.px, t), ny = qb(e.a.py, e.cy, e.b.py, t);
    L += Math.hypot(nx - x, ny - y); x = nx; y = ny;
  }
  return L;
}

function labelPos(n, w, h) {
  const left = n.x < 0.5;
  const top = n.y < 0.5;
  const side = n.x < 0.15 || n.x > 0.85; // side nodes: label above, top/bottom nodes: label beside
  if (side) return { x: n.px + (left ? 10 : -10), y: n.py - 12, align: left ? 'left' : 'right' };
  return { x: n.px + (left ? 12 : -12), y: n.py + (top ? 14 : -10), align: left ? 'left' : 'right' };
}

/* ---------- canvas ---------- */
function animate(host, hero, graph, legend) {
  const canvas = document.createElement('canvas');
  canvas.className = 'bus-canvas';
  host.append(canvas);
  const ctx = canvas.getContext('2d');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const sprites = Object.fromEntries(Object.entries(COLORS).map(([k, c]) => [k, makeSprite(c)]));
  let staticLayer = null;
  let w = 0, h = 0, dpr = 1, cap = 60;
  const packets = [];
  let running = false, visible = true, onScreen = true, raf = 0, last = 0, spawnAcc = 0;
  let speedMul = 1, hover = null; // hover = target node id
  let burstUntil = 0;

  function resize() {
    const r = host.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    cap = w < 768 ? 24 : 60;
    layout(graph, w, h);
    staticLayer = drawStatic(graph, w, h, dpr, legend);
    packets.length = 0;
  }

  function spawn() {
    const src = graph.sources[Math.floor(Math.random() * graph.sources.length)];
    const e = pickEdge(src);
    if (e) packets.push({ e, t: 0, speed: BASE_SPEED * (0.8 + Math.random() * 0.4) });
  }
  function pickEdge(node) {
    if (!node.out.length) return null;
    if (hover && hover !== node.id) {
      const route = graph.next[node.id][hover];
      if (route) return route;
    }
    return node.out[Math.floor(Math.random() * node.out.length)];
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    speedMul += ((hover ? HOVER_BOOST : 1) - speedMul) * Math.min(dt * 4, 1);

    const bursting = now < burstUntil;
    const every = bursting ? BURST_SPAWN_MS : SPAWN_MS;
    const limit = bursting ? BURST_CAP : cap;
    spawnAcc += dt * 1000;
    while (spawnAcc > every) { spawnAcc -= every; if (packets.length < limit) spawn(); }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(staticLayer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // arrival flashes: a node lights up when it receives a packet
    for (const n of graph.nodes) {
      if (n.flash <= 0) continue;
      n.flash = Math.max(0, n.flash - dt * 2.5);
      ctx.globalAlpha = n.flash * 0.6;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(n.px, n.py, 5 + (1 - n.flash) * 10, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.globalCompositeOperation = 'lighter';
    for (let k = packets.length - 1; k >= 0; k--) {
      const p = packets[k];
      p.t += (p.speed * speedMul * dt) / p.e.len;
      if (p.t >= 1) {
        const node = p.e.b;
        node.flash = 1;
        const nxt = pickEdge(node);
        if (!nxt) { packets.splice(k, 1); continue; }
        p.e = nxt; p.t = 0;
      }
      const e = p.e;
      const x = qb(e.a.px, e.cx, e.b.px, p.t), y = qb(e.a.py, e.cy, e.b.py, p.t);
      ctx.globalAlpha = Math.min(1, p.t * 6, (1 - p.t) * 6 + 0.4);
      ctx.drawImage(sprites[e.kind], x - 8, y - 8, 16, 16);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function setRunning() {
    const should = visible && onScreen;
    if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }

  resize();
  new ResizeObserver(() => resize()).observe(host);
  // labels are drawn into the cached layer, so redraw once Space Mono is ready
  document.fonts?.ready.then(() => { staticLayer = drawStatic(graph, w, h, dpr, legend); });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; setRunning(); });
  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; setRunning(); }).observe(hero);

  if (fine) {
    hero.addEventListener('mousemove', (ev) => {
      const r = host.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top;
      let best = null, bd = Infinity;
      for (const n of graph.nodes) {
        const d = Math.hypot(n.px - mx, n.py - my);
        if (d < bd) { bd = d; best = n; }
      }
      hover = best?.id ?? null;
    }, { passive: true });
    hero.addEventListener('mouseleave', () => { hover = null; });
  }

  // Konami burst: flood with packets for e.detail.ms; they drain naturally after.
  window.addEventListener('jalil:burst', (e) => { burstUntil = performance.now() + (e.detail?.ms || 3000); });

  setRunning();
  return { canvas, packets, graph };
}

function makeSprite(color) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.15, color);
  grad.addColorStop(0.45, hexA(color, 0.35));
  grad.addColorStop(1, hexA(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return c;
}
const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

function drawStatic(graph, w, h, dpr, legend) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.lineWidth = 1;
  for (const e of graph.edges) {
    g.strokeStyle = hexA(COLORS[e.kind], 0.16);
    g.beginPath(); g.moveTo(e.a.px, e.a.py); g.quadraticCurveTo(e.cx, e.cy, e.b.px, e.b.py); g.stroke();
  }
  const small = w < 600;
  g.font = `${small ? 9 : 10}px "Space Mono", monospace`;
  g.textBaseline = 'middle';
  for (const n of graph.nodes) {
    g.fillStyle = '#0a0a0f';
    g.strokeStyle = 'rgba(0,229,255,0.55)';
    g.beginPath(); g.arc(n.px, n.py, 4, 0, Math.PI * 2); g.fill(); g.stroke();
    const l = labelPos(n, w, h);
    g.fillStyle = 'rgba(107,107,138,0.85)';
    g.textAlign = l.align;
    g.fillText(n.id, l.x, l.y);
  }
  if (!small && legend) drawLegend(g, w, h, legend);
  return c;
}

function drawLegend(g, w, h, legend) {
  let x = w - 24;
  g.textAlign = 'right';
  g.font = '10px "Space Mono", monospace';
  const items = Object.entries(legend).reverse();
  for (const [kind, label] of items) {
    g.fillStyle = 'rgba(107,107,138,0.75)';
    g.fillText(label, x, h - 20);
    x -= g.measureText(label).width + 8;
    g.fillStyle = COLORS[kind];
    g.beginPath(); g.arc(x, h - 20, 2.5, 0, Math.PI * 2); g.fill();
    x -= 18;
  }
}

/* ---------- reduced motion: static SVG ---------- */
function staticFrame(host, graph, legend) {
  const render = () => {
    const r = host.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h) return;
    layout(graph, w, h);
    const edges = graph.edges.map((e) => {
      const mid = { x: qb(e.a.px, e.cx, e.b.px, 0.5), y: qb(e.a.py, e.cy, e.b.py, 0.5) };
      return `<path d="M${e.a.px} ${e.a.py} Q${e.cx} ${e.cy} ${e.b.px} ${e.b.py}" stroke="${hexA(COLORS[e.kind], 0.22)}" fill="none"/>` +
        `<circle cx="${mid.x.toFixed(1)}" cy="${mid.y.toFixed(1)}" r="2.5" fill="${COLORS[e.kind]}"/>`;
    }).join('');
    const small = w < 600;
    const nodes = graph.nodes.map((n) => {
      const l = labelPos(n, w, h);
      return `<circle cx="${n.px}" cy="${n.py}" r="4" fill="#0a0a0f" stroke="rgba(0,229,255,0.55)"/>` +
        `<text x="${l.x}" y="${l.y}" text-anchor="${l.align === 'left' ? 'start' : 'end'}" dominant-baseline="middle">${n.id}</text>`;
    }).join('');
    let leg = '';
    if (!small && legend) {
      let x = w - 24;
      Object.entries(legend).reverse().forEach(([kind, label]) => {
        leg += `<text x="${x}" y="${h - 20}" text-anchor="end" dominant-baseline="middle">${label}</text>`;
        x -= label.length * 6.1 + 8;
        leg += `<circle cx="${x}" cy="${h - 20}" r="2.5" fill="${COLORS[kind]}"/>`;
        x -= 18;
      });
    }
    host.innerHTML = `<svg class="bus-static" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Space Mono, monospace" font-size="${small ? 9 : 10}" fill="rgba(107,107,138,0.85)">${edges}${nodes}${leg}</svg>`;
  };
  render();
  let t = 0;
  new ResizeObserver(() => { clearTimeout(t); t = setTimeout(render, 150); }).observe(host);
  return { svg: true };
}
