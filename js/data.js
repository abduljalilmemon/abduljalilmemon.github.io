// jalil.sys: single source of truth for page content.
// index.html carries the same content as a static no-JS fallback; js/render.js
// re-renders every [data-render] block from this file on load.
//
// Rules: plain text only (the renderer escapes it). Never invent metrics,
// employers, dates or links. Unknown values are UPPER_SNAKE placeholders; the
// renderer never prints a placeholder to the page (links are dropped, text is
// replaced by its fallback).

export const data = {
  profile: {
    name: 'Abdul Jalil Memon',
    role: 'Senior Software Engineer',
    focus: 'Python & AI Systems',
    location: 'Cottbus, Germany',
    tagline: "Backend systems that scale. LLM evals that don't lie.",
    summary:
      'Building scalable backend systems, high-throughput data pipelines, and AI-driven solutions. 5+ years delivering production-grade systems in cybersecurity and AI evaluation/alignment workflows.',
    availability: 'Based in Germany. Open to working student, internship & full-time roles in Berlin, Cottbus, Dresden and more, on-site or remote.',
    cv: '/cv.pdf',
    terminal: {
      name: 'Abdul Jalil Memon',
      role: 'Senior Software Engineer',
      location: 'Cottbus, Germany',
      specializations: ['Python Backend', 'Distributed Systems', 'LLM Evaluation & RLHF', 'AI Coding Agents', 'Search Infrastructure'],
      last_role: 'Python Developer @ Turing',
      education: 'M.Sc. AI @ BTU Cottbus',
      seeking: ['working_student', 'internship', 'full_time'],
      open_to: ['berlin', 'cottbus', 'dresden', 'remote'],
      status: 'open_to_work',
    },
    about: [
      "I'm a Senior Software Engineer with 5+ years of experience building scalable backend systems, high-throughput data pipelines, and AI-driven solutions. My expertise spans Python engineering, distributed architectures, and search infrastructure.",
      'At TechnoGenics, I led backend initiatives including high-volume IOC processing pipelines, ANTLR-based structured search, ElasticSearch indexing optimizations achieving 50× faster queries, and distributed job orchestration using RabbitMQ, Kafka, and MongoDB.',
      'At Turing (Nov 2024 – Apr 2026), I worked on AI model development and evaluation — writing clean, efficient Python code and collaborating with research teams to refine model behavior and performance in LLM alignment workflows.',
      "I'm currently based in Cottbus, Germany, pursuing an M.Sc. in Artificial Intelligence at BTU Cottbus-Senftenberg, while staying active in student organizations including the StuRa, Pakistan Student Association (PSA) and JALTA, a student consulting network.",
      'I build with AI coding agents (Claude Code, GitHub Copilot and Google Antigravity) and I evaluate them. This site was built with Claude Code as a pair programmer; at Turing I benchmarked LLMs on programming tasks; and SwapCheck, my current project, checks whether an agent still behaves when you swap the model behind it.',
      "I'm passionate about systems that scale, architectures that are clean, and teams that innovate with purpose.",
    ],
    highlights: [
      { icon: '📍', label: 'Location', value: 'Cottbus, Germany' },
      { icon: '🧭', label: 'Open to', value: 'Berlin · Cottbus · Dresden · Remote' },
      { icon: '💼', label: 'Last Role', value: 'Python Developer @ Turing' },
      { icon: '🎓', label: 'Education', value: 'M.Sc. AI · BTU Cottbus-Senftenberg' },
      { icon: '✉️', label: 'Email', email: true }, // value assembled at runtime (see links.email)
    ],
  },

  // Hero metric tiles. Each number is backed by an experience bullet or award.
  // Sparklines only encode real values: years since Sep 2021, before/after
  // steps for the two speedups, and an event tick for the award date.
  metrics: [
    { value: 5, suffix: '+', unit: 'yrs', label: 'Experience', tone: 'accent',
      series: [0, 1, 2, 3, 4, 5], note: 'Years of production engineering since Sep 2021' },
    { value: 50, suffix: '×', label: 'ES query speedup', tone: 'accent',
      series: [1, 1, 1, 50, 50], note: 'Search query performance before and after structured indexing' },
    { value: 10, suffix: '×', label: 'IOC throughput', detail: '5k → 50k / msg', tone: 'accent3',
      series: [5, 5, 5, 50, 50], note: 'IOCs per Kafka message: 5,000 before, 50,000 after' },
    { value: 1, suffix: 'st', label: 'Monad Blitz Berlin', detail: 'Sep 2026', tone: 'accent2',
      series: null, note: 'Hackathon win, Sep 2026' },
  ],

  // Boot overlay (js/boot.js). First visit per session, skipped under reduced motion.
  boot: {
    storageKey: 'jalil.sys.booted',
    lines: [
      ['ok', 'mounting kafka.brokers'],
      ['ok', 'warming elasticsearch index (50x)'],
      ['ok', 'loading eval harness'],
      ['ready', 'jalil.sys'],
    ],
  },

  // Hero message bus (js/bus-canvas.js). x/y are fractions of the hero box.
  // Edge kind = traffic type and packet colour: events (cyan), jobs (green),
  // evals (violet). llm-judge is the sink: packets end there.
  bus: {
    nodes: [
      { id: 'producer', x: 0.045, y: 0.5 },
      { id: 'kafka', x: 0.3, y: 0.06 },
      { id: 'rabbitmq', x: 0.3, y: 0.95 },
      { id: 'elasticsearch', x: 0.7, y: 0.06 },
      { id: 'llm-judge', x: 0.955, y: 0.5 },
    ],
    edges: [
      { from: 'producer', to: 'kafka', kind: 'events' },
      { from: 'kafka', to: 'elasticsearch', kind: 'events' },
      { from: 'elasticsearch', to: 'llm-judge', kind: 'evals' },
      { from: 'producer', to: 'rabbitmq', kind: 'jobs' },
      { from: 'rabbitmq', to: 'llm-judge', kind: 'evals' },
    ],
    legend: { events: 'events', jobs: 'jobs', evals: 'evals' },
  },

  // Interactive terminal (js/terminal.js). Output text is built from the rest of this file.
  terminal: {
    hint: 'type help',
    commands: [
      ['help', 'list commands'],
      ['whoami', 'who is this'],
      ['skills', 'skills by category'],
      ['experience', 'work history'],
      ['projects', 'running, building, shipped'],
      ['awards', 'wins'],
      ['contact', 'how to reach me'],
      ['resume', 'open cv.pdf'],
      ['hire', 'jump to the contact form'],
      ['incident', 'on-call game: fix a broken system'],
      ['flags', 'hidden flags you have found'],
      ['clear', 'clear the screen'],
    ],
    hidden: ['cat profile.json', 'sudo hire jalil', 'incident list', 'incident consumer-lag', 'incident slow-search', 'incident judge-drift'],
    notFound: "command not found, try 'help'",
  },

  // newest first
  awards: [
    {
      rank: '2nd',
      title: '2nd Place · NASA International Space Apps Challenge 2026',
      org: 'NASA Space Apps',
      place: 'BTU Cottbus-Senftenberg',
      date: 'Nov 2026',
      project: { name: 'FireChronos', anchor: '#project-firechronos' },
      note: 'nominated for Global Judging; built with a team of five.',
    },
    {
      rank: '1st',
      title: '1st Place · Monad Blitz Berlin Hackathon',
      org: 'Encode Club / Monad Foundation',
      place: 'CIC Berlin',
      date: 'Sep 2026',
      project: { name: 'Streaker', anchor: '#project-streaker' },
      note: 'built with a small team; working demo shipped within the event deadline.',
    },
  ],

  skills: [
    { category: 'Languages', items: [['Python', true], 'TypeScript', 'JavaScript', 'C++'] },
    { category: 'Frameworks', items: [['FastAPI', true], ['Django', true], 'Flask', 'Angular'] },
    { category: 'Databases', items: [['MongoDB', true], ['ElasticSearch', true], 'PostgreSQL', 'Redis', 'Neo4j', 'MySQL'] },
    { category: 'Messaging & Infra', items: [['RabbitMQ', true], ['Kafka', true], 'Docker', 'Kubernetes', 'GCP'] },
    {
      category: 'AI / ML',
      items: [['LLM Evaluation', true], ['RLHF', true], ['LangGraph', true], 'LangChain', 'RAG', 'ChromaDB', 'LLM-as-judge / Evals', 'SFT', 'NLP / BERT', 'Prompt Eng.'],
    },
    { category: 'Core Competencies', items: [['Distributed Systems', true], 'Microservices', 'REST APIs', 'GraphQL', 'Search & Indexing'] },
    { category: 'AI Coding Agents', items: [['Claude Code', true], ['GitHub Copilot', true], ['Antigravity', true], 'Agent Evaluation'] },
    { category: 'Automation', items: [['n8n · Certified L1 + L2', true]] },
  ],

  experience: [
    {
      role: 'Python Developer',
      company: 'Turing',
      place: 'Remote',
      period: 'Nov 2024 – Apr 2026',
      start: '2024-11', end: '2026-04', // trace span (from period)
      dot: 'accent',
      points: [
        'Designed large-scale LLM benchmarking pipelines to evaluate top-tier language models on programming, reasoning, and problem-solving tasks.',
        'Created adversarial prompts, edge cases, and failure paths to surface model weaknesses and identify behavioral gaps for future model improvements.',
        'Conducted detailed LLM evaluations (Evals), ranking model responses with clear technical rationales grounded in algorithms and system design fundamentals.',
        'Contributed to SFT and RLHF workflows, improving dataset quality, reward modeling, and semantic alignment of model outputs.',
      ],
      tags: ['LLM Evaluation', 'RLHF', 'SFT', 'Python', 'AI Alignment'],
    },
    {
      role: 'Senior Software Engineer',
      company: 'TechnoGenics SMC PVT LTD',
      place: 'Remote',
      period: 'Aug 2024 – Dec 2024',
      start: '2024-08', end: '2024-12',
      dot: 'accent2',
      points: [
        'Led UI/UX improvements using Angular and TypeScript, achieving a high increase in user satisfaction for cybersecurity search and subscription features.',
        'Designed a structured ANTLR query interface enhancing user search capabilities and query accuracy by 35%.',
        'Implemented batch handling for processing up to 50,000 IOCs per message using Kafka, a 10× improvement over the previous 5,000 IOC limit.',
        'Managed a team of 6 developers, conducted PR reviews, and ensured timely project delivery.',
      ],
      tags: ['Angular', 'TypeScript', 'ANTLR', 'RabbitMQ', 'Redis', 'Team Lead'],
    },
    {
      role: 'Software Engineer',
      company: 'TechnoGenics SMC PVT LTD',
      place: 'Lahore',
      period: 'Sep 2021 – Jul 2024',
      start: '2021-09', end: '2024-07',
      dot: 'accent3',
      points: [
        'Built a fully automated backend service using FastAPI, ElasticSearch, RabbitMQ, and REST APIs for seamless trigger-based user subscriptions.',
        'Achieved a 50× improvement in search query performance by implementing structured indexing in ElasticSearch.',
        'Built a Job Service using Flask and RabbitMQ distributing 1,000+ tasks daily with MongoDB real-time monitoring deployed on GCP.',
        'Engineered a reporting feature with MongoDB and Redis caching that enhanced analysis speed by 50%.',
        'Synchronized data from 20+ web crawlers through Kafka into a Neo4j graph database in real-time.',
      ],
      tags: ['FastAPI', 'ElasticSearch', 'MongoDB', 'RabbitMQ', 'Kafka', 'Neo4j', 'GCP'],
    },
  ],

  // status: running | building | shipped | archived | null (not stated)
  projects: [
    {
      id: 'swapcheck',
      name: 'SwapCheck',
      status: 'building',
      desc: 'Agent evaluation harness that gives a SHIP / HOLD verdict when you swap the model behind an agent. Replays scenarios, scores them with LLM-as-judge plus rule checks, and compares the results against a reference config.',
      stack: ['Agent Evals', 'LLM-as-judge', 'Rule-based Scoring', 'Scenario Replay'],
      links: [{ label: 'view source', href: 'SWAPCHECK_REPO_URL' }],
    },
    {
      id: 'voice-agent',
      name: 'Real-Time AI Voice Agent',
      status: 'running',
      flagship: true,
      desc: 'A multi-node LangGraph system with Deepgram speech-to-text and Edge TTS, streamed over WebSockets from a FastAPI backend. Classifies caller intent, retrieves answers via RAG on ChromaDB, and runs automated booking logic.',
      stack: ['LangGraph', 'ChromaDB', 'RAG', 'Deepgram STT', 'Edge TTS', 'FastAPI', 'WebSockets'],
      links: [{ label: 'view source', href: 'https://github.com/abduljalilmemon/voice-agent' }],
    },
    {
      id: 'health-platform',
      name: 'Microservice Health Platform',
      status: 'building',
      desc: 'An ongoing microservice health platform, with each service maintained in its own repo under a shared GitHub organization. Currently building out the auth-service with FastAPI, PostgreSQL, and Redis.',
      stack: ['FastAPI', 'PostgreSQL', 'Redis', 'Microservices'],
      links: [{ label: 'view source', href: 'HEALTH_PLATFORM_REPO_URL' }],
    },
    {
      id: 'firechronos',
      name: 'FireChronos',
      status: 'shipped',
      desc: "Interactive geospatial platform combining NASA's MODIS and VIIRS satellite data to explore 25 years of fire activity across Europe (2001–2025): maps, burning calendars, seasonal patterns and weather context. VIIRS sees far smaller fires than MODIS, so raw counts jump when the record switches sensors in 2012; we built a correction, tested it on held-out years, and made every number traceable to its source.",
      award: '2nd Place · NASA Space Apps · Nov 2026',
      stack: ['NASA MODIS', 'VIIRS', 'Geospatial', 'Remote Sensing', 'Data Science'],
      links: [
        { label: 'live demo', href: 'https://nasa-hackaton-2026.vercel.app' },
        { label: 'view source', href: 'FIRECHRONOS_REPO_URL' },
      ],
    },
    {
      id: 'streaker',
      name: 'Streaker',
      status: 'shipped',
      desc: 'STREAKER_DESC',
      // Shown while desc is still a placeholder (facts from the award entry).
      descFallback: 'Built with a small team at Monad Blitz Berlin (Sep 2026); working demo shipped within the event deadline.',
      award: '1st Place · Monad Blitz Berlin',
      stack: [],
      links: [{ label: 'view source', href: 'STREAKER_URL' }],
    },
    {
      id: 'sales-automation',
      name: 'Enterprise Sales Automation (n8n)',
      status: null,
      desc: 'Built complex n8n workflows for multi-source sales reporting. Integrated Gmail, Discord, and custom API error monitoring to replace manual data processing.',
      stack: ['n8n', 'Data Integration', 'Error Recovery'],
      links: [{ label: 'view source', href: 'SALES_AUTOMATION_REPO_URL' }],
    },
    {
      id: 'mario-asm',
      name: '8-bit Super Mario in x86 Assembly',
      status: 'archived',
      desc: 'A from-scratch Super Mario implementation written in Assembly. Managed low-level memory, sprite rendering, and hardware-level collision logic without high-level abstractions.',
      stack: ['Assembly (x86)', 'Low-Level Systems'],
      links: [{ label: 'view source', href: 'MARIO_ASM_REPO_URL' }],
    },
  ],

  archive: [
    {
      name: 'College Automation & Scheduling System',
      desc: 'A robust web application to streamline management of student and staff activities. Applied best practices for UI/UX design resulting in a user-friendly, efficient tool that significantly improved task organization and tracking for colleges.',
      stack: ['Django', 'HTML/CSS', 'Bootstrap 4', 'MySQL', 'JavaScript'],
    },
    {
      name: 'Event Management System',
      desc: 'A Django-based system that lets users easily organize and join events. The user-friendly interface allows seamless event browsing, registration, and access to detailed event information.',
      stack: ['Django', 'SQLite', 'Python'],
    },
  ],

  education: [
    {
      degree: 'M.Sc. Artificial Intelligence',
      school: 'Brandenburg University of Technology (BTU) Cottbus-Senftenberg',
      period: 'In progress · through 2028 · Cottbus',
    },
    {
      degree: 'Bachelor of Science in Computer Science',
      school: 'FAST — National University of Computer & Emerging Sciences',
      period: 'Aug 2017 – Jul 2021 · Islamabad',
    },
  ],

  certifications: [
    { name: 'Building AI Browser Agents', issuer: 'DeepLearning.AI', year: '2025' },
    { name: 'ChatGPT Prompt Engineering for Developers', issuer: 'DeepLearning.AI', year: '2025' },
    { name: 'n8n Course Level 1', issuer: 'n8n.io', year: '2026' },
    { name: 'n8n Course Level 2', issuer: 'n8n.io', year: '2026' },
  ],

  // On-call game (js/incident.js). Everything here is a SIMULATION, labelled
  // as such in the UI. Numbers are scenario props, not claims; the only real
  // facts are the `realWorld` lines, which mirror experience bullets above.
  // fixes/wrong: regex strings matched against the lower-cased command.
  incidents: [
    {
      id: 'consumer-lag',
      title: 'Kafka consumer lag is climbing',
      node: 'kafka',
      summary: 'Consumer group ioc-ingest is 48,200 messages behind and growing. Indicator lookups are going stale.',
      status: [
        ['kafka', 'warn', 'lag 48,200 msgs (+1.9k/min)'],
        ['producer', 'warn', 'publish rate 3.2× baseline'],
        ['elasticsearch', 'ok', 'p95 41ms'],
        ['rabbitmq', 'ok', 'queue depth 12'],
        ['llm-judge', 'ok', 'idle'],
      ],
      logs: {
        kafka: ['[warn] group=ioc-ingest lag=48200 partitions=6 active_consumers=1', '[info] partitions 0-5 assigned to ioc-ingest-0'],
        producer: ['[info] threat-feed import started: 2.1M indicators', '[info] publish rate 3.2× baseline, no errors'],
      },
      metrics: {
        kafka: ['partitions: 6', 'consumers: 1 (one consumer is reading all 6 partitions)', 'consume ~1.1k msg/s vs. produce ~3.0k msg/s'],
        producer: ['batch size unchanged', 'error rate 0%'],
      },
      hints: [
        'Compare how fast messages arrive with how fast they are consumed.',
        'How many partitions does the topic have, and how many consumers read them?',
        'Try: scale consumers <n>',
      ],
      fixes: [
        { match: '^scale consumers? 6$', note: '6 consumers for 6 partitions: every partition gets its own reader. Lag drains in ~4 min.' },
        { match: '^scale consumers? ([7-9]|\\d{2,})$', note: 'Lag drains, but consumers beyond 6 sit idle: a partition is read by at most one consumer in a group.' },
        { match: '^scale consumers? [45]$', note: 'Lag drains, a bit slower: some consumers still own two partitions. 6 would match the partition count.' },
      ],
      wrong: [
        { match: '^scale consumers? [0-3]$', out: 'Still behind: that many consumers cannot keep up with 3.2× traffic. Lag keeps growing.' },
        { match: '^restart kafka', out: 'Broker restart triggered a consumer-group rebalance: lag +6k during the pause. The brokers were healthy.' },
        { match: '^(restart|stop|kill) producer', out: 'The import resumed from its checkpoint. Same traffic, same lag. Stopping the business is not a fix.' },
      ],
      rootCause: 'A bulk threat-feed import tripled the publish rate while consumer group ioc-ingest ran a single consumer across 6 partitions.',
      realWorld: 'At TechnoGenics I reworked IOC batch handling on Kafka: up to 50,000 IOCs per message, 10× the previous 5,000 IOC limit.',
    },
    {
      id: 'slow-search',
      title: 'Search latency spiked after a deploy',
      node: 'elasticsearch',
      summary: 'p95 search latency went from 41 ms to 2.8 s right after deploy v2.4.1. Analyst IOC searches are timing out.',
      status: [
        ['elasticsearch', 'warn', 'p95 2,830ms (was 41ms) · timeouts 7%'],
        ['producer', 'info', 'deploy v2.4.1 finished 18 min ago'],
        ['kafka', 'ok', 'lag 120'],
        ['rabbitmq', 'ok', 'queue depth 9'],
        ['llm-judge', 'ok', 'idle'],
      ],
      logs: {
        elasticsearch: ['[warn] slowlog: wildcard query on ioc.value took 2.8s (scanned 41M terms)', '[warn] ioc.value is now type text: exact lookups run as wildcard scans'],
        producer: ['[info] deploy v2.4.1 finished', '[info] index template updated: ioc.value keyword → text'],
      },
      metrics: {
        elasticsearch: ['cpu 94% · heap 61%', 'query mix: 88% wildcard on ioc.value', 'index template version: v2.4.1'],
      },
      hints: [
        'What changed 18 minutes ago?',
        'Read the slowlog: which field do the slow queries hit, and what type is it now?',
        'Undo the mapping change: roll back the template, or reindex with ioc.value as keyword.',
      ],
      fixes: [
        { match: '^rollback( (deploy|elasticsearch|es|template|mapping|v2\\.4\\.1))?$', note: 'Template rolled back: ioc.value is keyword again and the hot index is reindexed in the background. p95 back to 40ms.' },
        { match: '^reindex( .*)?$', note: 'Reindexed with ioc.value as keyword: exact and prefix lookups hit the term index instead of scanning. p95 back to 40ms.' },
      ],
      wrong: [
        { match: '^restart (elasticsearch|es)', out: 'Nodes restarted with cold caches: p95 3.4s for two minutes, then back to 2.8s. The cluster is not sick, the queries are.' },
        { match: '^(scale|add) (elasticsearch|es|nodes?|data)', out: '+2 data nodes: p95 2.1s. Hardware makes a full scan a little faster and a lot more expensive.' },
        { match: '^(clear|flush)[- ]?cache', out: 'Query cache cleared: no change. Every wildcard misses the cache anyway.' },
      ],
      rootCause: 'Deploy v2.4.1 changed ioc.value from keyword to text, so exact and prefix IOC lookups became wildcard scans over analyzed terms.',
      realWorld: 'At TechnoGenics, structured indexing in Elasticsearch made search queries 50× faster.',
    },
    {
      id: 'judge-drift',
      title: 'Eval verdicts flipped after a model swap',
      node: 'llm-judge',
      summary: "Nightly eval: 31% of answers changed verdict since yesterday, but the agent under test didn't change.",
      status: [
        ['llm-judge', 'warn', 'verdict flips 31% vs. yesterday'],
        ['rule-checks', 'ok', '99% agreement with yesterday'],
        ['kafka', 'ok', 'lag 40'],
        ['elasticsearch', 'ok', 'p95 39ms'],
        ['rabbitmq', 'ok', 'eval jobs draining normally'],
      ],
      logs: {
        'llm-judge': ['[info] judge model judge-v2 (was judge-v1), config change at 02:10', '[info] sampling temperature=0.9', '[warn] same answer judged PASS, then FAIL on retry (3 of 5 samples)'],
        rabbitmq: ['[info] 1,200 eval jobs queued and consumed normally'],
      },
      metrics: {
        'llm-judge': ['self-agreement on retries: 61%', 'agreement with rule checks: 58% (was 93%)', 'agent under test: same version, same prompts'],
      },
      hints: [
        "If the agent didn't change, what did?",
        "A judge that disagrees with itself on retries isn't measuring the agent.",
        'Make the judge deterministic again, or roll back the judge config.',
      ],
      fixes: [
        { match: '^set (judge\\.|llm-judge\\.)?temperature 0(\\.0+)?$', note: 'Judge pinned to temperature 0: retries agree again and verdicts are back to 93% agreement with rule checks.' },
        { match: '^rollback( (llm-judge|judge|config|judge-config))?$', note: 'Judge config rolled back to judge-v1 at temperature 0. Swap the judge later, against its own baseline.' },
        { match: '^pin (judge|llm-judge)', note: 'Judge model and sampling pinned: retries agree again. Verdicts measure the agent, not the judge.' },
      ],
      wrong: [
        { match: '^rollback agent', out: 'Agent rolled back to the version it was already on. Nothing changed, because the agent never did.' },
        { match: '^restart (llm-judge|judge)', out: 'Judge restarted with the same config: verdicts still flip (29%).' },
        { match: '^(rerun|retry|run eval)', out: 'Eval re-run: 27% flips. Different number, same problem: a noisy judge.' },
      ],
      rootCause: 'The judge was swapped to a new model at temperature 0.9, so verdicts measured judge noise instead of agent behaviour.',
      realWorld: 'This is what SwapCheck guards against: compare against a pinned reference config before shipping a swap. At Turing I ranked model responses with written technical rationales.',
    },
  ],

  // Hidden flags (js/achievements.js). Saved per visitor in localStorage.
  flags: [
    { id: 'palette', label: 'opened the command palette', hint: 'Ctrl/⌘ K' },
    { id: 'sudo', label: 'tried sudo on the terminal', hint: 'the terminal has root opinions' },
    { id: 'trace', label: 'expanded every span in the trace', hint: 'experience is a distributed trace' },
    { id: 'incident', label: 'resolved an incident', hint: "type 'incident' in the terminal" },
    { id: 'konami', label: 'flooded the message bus', hint: '↑↑↓↓←→←→BA' },
    { id: 'explorer', label: 'scrolled through every section', hint: 'read the whole system' },
  ],

  // SEO / JSON-LD (index.html <head>). Facts mirror the content above.
  seo: {
    url: 'https://abduljalilmemon.github.io/',
    locality: 'Cottbus',
    country: 'DE',
    alumniOf: { name: 'FAST — National University of Computer & Emerging Sciences', alternateName: 'FAST-NUCES' },
    affiliation: { name: 'Brandenburg University of Technology Cottbus-Senftenberg', alternateName: 'BTU Cottbus-Senftenberg' },
  },

  footer: {
    status: 'uptime: since 2021 · p99 latency: replies within 24h',
  },

  links: {
    // Stored in parts so the address never appears whole in the markup or source.
    // js/render.js emailOf() joins it in the browser; the no-JS fallback shows
    // 'user [at] domain [dot] tld'.
    email: { user: 'abduljaleelmemon3', domain: 'gmail.com' },
    linkedin: { handle: 'abdul-jalil-memon', url: 'https://linkedin.com/in/abdul-jalil-memon' },
    github: { handle: 'abduljalilmemon', url: 'https://github.com/abduljalilmemon' },
    githubRepos: 'https://github.com/abduljalilmemon?tab=repositories',
  },
};
