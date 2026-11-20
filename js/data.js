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
    availability: 'Open to working student, internship & full-time roles in Germany.',
    cv: '/cv.pdf',
    terminal: {
      name: 'Abdul Jalil Memon',
      role: 'Senior Software Engineer',
      location: 'Cottbus, Germany',
      specializations: ['Python Backend', 'Distributed Systems', 'LLM Evaluation & RLHF', 'Search Infrastructure'],
      last_role: 'Python Developer @ Turing',
      education: 'M.Sc. AI @ BTU Cottbus',
      seeking: ['working_student', 'internship', 'full_time'],
      status: 'open_to_work',
    },
    about: [
      "I'm a Senior Software Engineer with 5+ years of experience building scalable backend systems, high-throughput data pipelines, and AI-driven solutions. My expertise spans Python engineering, distributed architectures, and search infrastructure.",
      'At TechnoGenics, I led backend initiatives including high-volume IOC processing pipelines, ANTLR-based structured search, ElasticSearch indexing optimizations achieving 50× faster queries, and distributed job orchestration using RabbitMQ, Kafka, and MongoDB.',
      'At Turing (Nov 2024 – Apr 2026), I worked on AI model development and evaluation — writing clean, efficient Python code and collaborating with research teams to refine model behavior and performance in LLM alignment workflows.',
      "I'm currently based in Cottbus, Germany, pursuing an M.Sc. in Artificial Intelligence at BTU Cottbus-Senftenberg, while staying active in student organizations including the StuRa, Pakistan Student Association (PSA) and JALTA, a student consulting network.",
      "I'm passionate about systems that scale, architectures that are clean, and teams that innovate with purpose.",
    ],
    highlights: [
      { icon: '📍', label: 'Location', value: 'Cottbus, Germany' },
      { icon: '💼', label: 'Last Role', value: 'Python Developer @ Turing' },
      { icon: '🎓', label: 'Education', value: 'M.Sc. AI · BTU Cottbus-Senftenberg' },
      { icon: '✉️', label: 'Email', value: 'abduljaleelmemon3@gmail.com' },
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
      ['clear', 'clear the screen'],
    ],
    hidden: ['cat profile.json', 'sudo hire jalil'],
    notFound: "command not found, try 'help'",
  },

  awards: [
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
    { category: 'Automation', items: [['n8n · Certified L1 + L2', true]] },
  ],

  experience: [
    {
      role: 'Python Developer',
      company: 'Turing',
      place: 'Remote',
      period: 'Nov 2024 – Apr 2026',
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
      links: [{ label: 'GitHub', href: 'SWAPCHECK_REPO_URL' }],
    },
    {
      id: 'voice-agent',
      name: 'Real-Time AI Voice Agent',
      status: 'running',
      flagship: true,
      desc: 'A multi-node LangGraph system with Deepgram speech-to-text and Edge TTS, streamed over WebSockets from a FastAPI backend. Classifies caller intent, retrieves answers via RAG on ChromaDB, and runs automated booking logic.',
      stack: ['LangGraph', 'ChromaDB', 'RAG', 'Deepgram STT', 'Edge TTS', 'FastAPI', 'WebSockets'],
      links: [{ label: 'View Architecture', href: 'https://github.com/abduljalilmemon/voice-agent' }],
    },
    {
      id: 'health-platform',
      name: 'Microservice Health Platform',
      status: 'building',
      desc: 'An ongoing microservice health platform, with each service maintained in its own repo under a shared GitHub organization. Currently building out the auth-service with FastAPI, PostgreSQL, and Redis.',
      stack: ['FastAPI', 'PostgreSQL', 'Redis', 'Microservices'],
      links: [],
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
      links: [{ label: 'GitHub', href: 'STREAKER_URL' }],
    },
    {
      id: 'sales-automation',
      name: 'Enterprise Sales Automation (n8n)',
      status: null,
      desc: 'Built complex n8n workflows for multi-source sales reporting. Integrated Gmail, Discord, and custom API error monitoring to replace manual data processing.',
      stack: ['n8n', 'Data Integration', 'Error Recovery'],
      links: [],
    },
    {
      id: 'mario-asm',
      name: '8-bit Super Mario in x86 Assembly',
      status: 'archived',
      desc: 'A from-scratch Super Mario implementation written in Assembly. Managed low-level memory, sprite rendering, and hardware-level collision logic without high-level abstractions.',
      stack: ['Assembly (x86)', 'Low-Level Systems'],
      links: [],
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

  links: {
    email: 'abduljaleelmemon3@gmail.com',
    linkedin: { handle: 'abdul-jalil-memon', url: 'https://linkedin.com/in/abdul-jalil-memon' },
    github: { handle: 'abduljalilmemon', url: 'https://github.com/abduljalilmemon' },
    githubRepos: 'https://github.com/abduljalilmemon?tab=repositories',
  },
};
