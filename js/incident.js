// jalil.sys: on-call incident game. Loaded on demand by the terminal's
// `incident` command. A scenario from data.incidents breaks the system; the
// visitor diagnoses it with status / logs / metrics, applies a fix, and gets a
// short postmortem with a grade. Everything is a labelled simulation; only the
// `realWorld` line refers to real experience.
//
// The terminal hands us a small API: { line, print, echo, setMode }.

const SERVICES = ['kafka', 'rabbitmq', 'elasticsearch', 'llm-judge', 'producer'];
const SOLVED_KEY = 'jalil.sys.incidents';

const loadSolved = () => { try { return new Set(JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]')); } catch { return new Set(); } };
const saveSolved = (set) => { try { localStorage.setItem(SOLVED_KEY, JSON.stringify([...set])); } catch { /* storage blocked */ } };
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

export function startIncident(api, data, arg = '') {
  const { line, print } = api;
  const all = data.incidents;
  const solved = loadSolved();

  if (arg === 'list') {
    print([
      line({ cls: 't-comment', text: 'incidents (simulated):' }),
      ...all.map((s) => line(
        { cls: solved.has(s.id) ? 't-arr' : 't-comment', text: solved.has(s.id) ? '  ✓ ' : '  ○ ' },
        { cls: 't-key', text: s.id.padEnd(15) }, s.title,
      )),
      line({ cls: 't-comment', text: "start one with 'incident <id>', or just 'incident'" }),
    ]);
    return;
  }

  let s = arg ? all.find((x) => x.id === arg || String(all.indexOf(x) + 1) === arg) : null;
  if (arg && !s) { print([line({ cls: 't-err', text: `no incident '${arg}'` }, { cls: 't-comment', text: ", try 'incident list'" })]); return; }
  if (!s) {
    const open = all.filter((x) => !solved.has(x.id));
    const pool = open.length ? open : all;
    s = pool[Math.floor(Math.random() * pool.length)];
  }

  const st = { start: performance.now(), commands: 0, hints: 0, wrong: 0 };
  const fixes = s.fixes.map((f) => ({ ...f, re: new RegExp(f.match) }));
  const wrong = s.wrong.map((w) => ({ ...w, re: new RegExp(w.match) }));
  const dot = (lvl) => ({ ok: ['t-arr', '● ok  '], warn: ['t-err', '▲ warn'], info: ['t-val', '● info'] }[lvl] || ['t-comment', '●     ']);

  print([
    line({ cls: 't-err', text: '🔴 PAGE · sev2 · ' }, { cls: 't-str', text: s.title }, { cls: 't-comment', text: '  [simulated]' }),
    line({ cls: 't-comment', text: s.summary }),
    line({ cls: 't-comment', text: "you're on call. try: " }, { cls: 't-key', text: 'status' }, ', ', { cls: 't-key', text: 'logs <service>' }, ', ', { cls: 't-key', text: 'metrics <service>' }, ', ', { cls: 't-key', text: 'hint' }, ', ', { cls: 't-key', text: 'abort' }),
    line({ cls: 't-comment', text: 'the fix command is yours to figure out.' }),
  ]);
  emit('jalil:incident', { state: 'start', node: s.node });

  const finish = (resolved, note) => {
    api.setMode(null);
    emit('jalil:incident', { state: resolved ? 'resolved' : 'end', node: s.node });
    if (!resolved) { print([line({ cls: 't-comment', text: 'incident aborted. the pager will be back.' })]); return; }
    const secs = Math.round((performance.now() - st.start) / 1000);
    const score = 100 - Math.max(0, st.commands - 4) * 3 - st.hints * 15 - st.wrong * 20 - Math.max(0, secs - 90) / 6;
    const grade = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 55 ? 'B' : 'C';
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    solved.add(s.id); saveSolved(solved);
    print([
      line({ cls: 't-arr', text: '✓ resolved. ' }, note),
      line({ cls: 't-key', text: 'postmortem' }),
      line({ cls: 't-comment', text: '  root cause  ' }, s.rootCause),
      line({ cls: 't-comment', text: '  response    ' }, `${time} · ${st.commands} commands · ${st.hints} hints · ${st.wrong} bad fixes → grade `, { cls: 't-val', text: grade }),
      line({ cls: 't-comment', text: '  in prod     ' }, { cls: 't-str', text: s.realWorld }),
      line({ cls: 't-comment', text: `${solved.size}/${all.length} incidents solved · 'incident' for another, 'incident list' for all` }),
    ]);
    emit('jalil:flag', { id: 'incident' });
  };

  const svcList = () => line({ cls: 't-comment', text: `services: ${SERVICES.join(', ')}` });

  api.setMode({
    prompt: 'oncall#',
    complete: ['status', 'hint', 'abort', 'help', ...SERVICES.flatMap((x) => [`logs ${x}`, `metrics ${x}`])],
    run(raw) {
      const cmd = raw.toLowerCase();
      st.commands++;
      if (cmd === 'help') {
        return [
          line({ cls: 't-key', text: 'status            ' }, { cls: 't-comment', text: 'health of every service' }),
          line({ cls: 't-key', text: 'logs <service>    ' }, { cls: 't-comment', text: 'recent log lines' }),
          line({ cls: 't-key', text: 'metrics <service> ' }, { cls: 't-comment', text: 'key numbers' }),
          line({ cls: 't-key', text: 'hint              ' }, { cls: 't-comment', text: 'a nudge (costs points)' }),
          line({ cls: 't-key', text: 'abort             ' }, { cls: 't-comment', text: 'give up' }),
          line({ cls: 't-comment', text: 'fixes are real-world verbs: scale, restart, rollback, reindex, set, pin…' }),
        ];
      }
      if (cmd === 'status') return s.status.map(([svc, lvl, msg]) => { const [c, t] = dot(lvl); return line({ cls: c, text: `${t} ` }, { cls: 't-key', text: svc.padEnd(14) }, msg); });
      const m = cmd.match(/^(logs|metrics) ?(.*)$/);
      if (m) {
        const svc = m[2].trim();
        if (!svc) return [line({ cls: 't-err', text: `usage: ${m[1]} <service>` }), svcList()];
        const src = (m[1] === 'logs' ? s.logs : s.metrics)[svc];
        if (src) return src.map((t) => line({ cls: t.startsWith('[warn]') ? 't-err' : 't-comment', text: m[1] === 'metrics' ? `  ${t}` : t }));
        if (SERVICES.includes(svc) || s.status.some(([x]) => x === svc)) return [line({ cls: 't-comment', text: `${svc}: nothing unusual in the last 15 minutes` })];
        return [line({ cls: 't-err', text: `unknown service '${svc}'` }), svcList()];
      }
      if (cmd === 'hint') {
        if (st.hints >= s.hints.length) return [line({ cls: 't-comment', text: 'no more hints. you have everything you need.' })];
        return [line({ cls: 't-val', text: `hint ${st.hints + 1}/${s.hints.length}: ` }, s.hints[st.hints++])];
      }
      if (cmd === 'abort' || cmd === 'exit' || cmd === 'quit') { finish(false); return []; }
      const fix = fixes.find((f) => f.re.test(cmd));
      if (fix) { finish(true, fix.note); return []; }
      const bad = wrong.find((w) => w.re.test(cmd));
      if (bad) { st.wrong++; return [line({ cls: 't-err', text: '✗ ' }, bad.out)]; }
      if (/^(scale|restart|rollback|reindex|set|pin|kill|stop|deploy|flush|clear|add|drain|rerun|retry)\b/.test(cmd)) {
        st.wrong++;
        return [line({ cls: 't-err', text: '✗ ' }, `'${raw}' ran, but the alert is still firing.`)];
      }
      st.commands--; // typos don't count
      return [line({ cls: 't-err', text: "not an on-call command, try 'help'" })];
    },
  });
}
