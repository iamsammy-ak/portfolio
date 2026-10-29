/* =====================================================================
   PORTFOLIO DATA — edit this file only to update your content.
   Every room of the 3D site is rendered from this object.
   ===================================================================== */

window.PORTFOLIO = {
  meta: {
    name: "Abhishek Kumar",
    short: "ABHISHEK",                       // big sketched name in the corridor
    title: "< engineering management />",    // line under the name
    hello: "hello, I'm",                     // small handwritten line above the name on the entrance screen
    role: "Engineering Management @ Politecnico di Torino",
    tagline: "data · product · a few hackathon trophies",
    quote: "Building things at the edge of engineering and business",
    location: "Turin, Italy",
    email: "kumarabhishekk363@gmail.com",
    links: {
      linkedin: "https://www.linkedin.com/in/sammy4bhishek/",
      github: "https://github.com/iamsammy-ak",
      cv: "assets/Abhishek_Kumar_CV.pdf",
    },
  },

  /* ---------- Building entrance ---------- */
  entrance: {
    sign: "PORTFOLIO",
    cue: "click the door to come in",
    // three sticky-note facts shown on the entrance screen
    stats: [
      { big: "3", small: "hackathon podiums" },
      { big: "1,000+", small: "students reached" },
      { big: "40%", small: "faster reporting" },
    ],
    // stickers on the glass of the entrance doors
    stickers: [
      { text: "Python", color: "#f2d35b" },
      { text: "SQL", color: "#9ad0f5" },
      { text: "Power BI", color: "#f5c66b" },
      { text: "AI/ML", color: "#b7e3a8" },
      { text: "React", color: "#9bdcf0" },
      { text: "Docker", color: "#8fc1f0" },
      { text: "Figma", color: "#f2a5c8" },
      { text: "MATLAB", color: "#f0a56b" },
      { text: "JIRA", color: "#8fb4f5" },
      { text: "Excel", color: "#9fd6a6" },
    ],
  },

  /* ---------- Corridor ---------- */
  corridor: {
    hintEnter: "Click a door to enter",
    hintExplore: "Scroll to explore the corridor",
    // doors along the corridor (z is depth; left/right wall)
    rooms: [
      { id: "gallery", label: "THE GALLERY", sub: "projects & hackathons", side: "left",  z: -14, icon: "frames" },
      { id: "studio",  label: "THE OFFICE",  sub: "experience",            side: "right", z: -24, icon: "screens" },
      { id: "about",   label: "ABOUT",       sub: "my story",              side: "left",  z: -36, icon: "plane" },
      { id: "contact", label: "CONTACT",     sub: "say hello",             side: "right", z: -46, icon: "mail" },
    ],
    // framed sketches on the walls
    frames: [
      { side: "right", z: -10, y: 1.9, lines: ["3 hackathon", "podiums", "in one year"] },
      { side: "left",  z: -29, y: 1.9, lines: ["1,000+ students", "impacted", "as PISA president"] },
      { side: "right", z: -40, y: 1.9, lines: ["40% faster", "reporting", "at Fibzio"] },
      { side: "left",  z: -52, y: 1.9, lines: ["Empty canvas!", "Want to collaborate?", "Find the Contact door"] },
    ],
    endDoor: { label: "MY CV", action: "cv" },
  },

  /* ---------- The Gallery: posters on a clothesline ---------- */
  gallery: {
    hint: "Click a project to inspect",
    projects: [
      {
        title: "cityX",
        badge: "1st PLACE",
        event: "404: Pothole Not Found — LOKI Urban Monitoring Hackathon",
        date: "Oct 2026",
        summary: "An AI-powered civic intelligence platform that turns street reports into actionable incidents.",
        bullets: [
          "AI-assisted classification, geospatial analysis, duplicate detection and risk-based prioritization.",
          "Privacy safeguards built in from the first commit.",
        ],
        tags: ["AI", "Geospatial", "Civic Tech"],
        link: "",
      },
      {
        title: "RISK RADAR",
        badge: "2nd PLACE",
        event: "Automation Hackathon",
        date: "Mar 2026",
        summary: "An AI supply-chain risk platform built in five hours, extracting supplier intelligence for 1,000+ vendors.",
        bullets: [
          "ScrapeGraphAI + LLMs to surface geopolitical, weather and logistics risks affecting cargo routes.",
        ],
        tags: ["LLMs", "ScrapeGraphAI", "Supply Chain"],
        link: "",
      },
      {
        title: "WELD AI",
        badge: "1st PLACE",
        event: "Therness Hackathon",
        date: "Feb 2026",
        summary: "Analyzed 1,551 welding samples across thermal video, audio and sensor data to detect six defect categories.",
        bullets: ["Multimodal pipeline: thermal video + audio + sensor fusion."],
        tags: ["ML", "Computer Vision", "Sensor Fusion"],
        link: "",
      },
      {
        title: "VR HOMES",
        badge: "MVP",
        event: "OpenSky VR Italia",
        date: "2025",
        summary: "Property visualization platform with interactive 3D walkthroughs and VR previews.",
        bullets: [
          "React, Angular, REST APIs, Matterport and LiDAR.",
          "Cut property presentation time by ~30%; MVP shipped in six months with a six-person team.",
        ],
        tags: ["React", "Angular", "Matterport", "LiDAR"],
        link: "",
      },
      {
        title: "CHESS x RED BULL",
        badge: "400+ PLAYERS",
        event: "PISA — Politecnico Indian Students Association",
        date: "2024",
        summary: "Organized a Red Bull-sponsored chess tournament with 400+ participants.",
        bullets: ["Owned budget, sponsorships, logistics and the volunteer team."],
        tags: ["Events", "Sponsorship", "Leadership"],
        link: "",
      },
    ],
  },

  /* ---------- The Office: floating screens (experience) ---------- */
  studio: {
    hint: "Drag to rotate, click a screen",
    items: [
      {
        title: "Technical Management Trainee",
        org: "OpenSky VR Italia",
        period: "Jan 2025 – Jun 2025",
        bullets: [
          "Built a property visualization platform using React, Angular, RESTful APIs, Matterport and LiDAR for 3D walkthroughs and VR previews.",
          "Reduced property presentation time by ~30% through immersive virtual tours.",
          "Delivered an MVP within six months with a six-person cross-functional team.",
        ],
        tags: ["React", "Angular", "Matterport", "LiDAR"],
      },
      {
        title: "Junior Data Analyst",
        org: "Fibzio",
        period: "Sep 2023 – Dec 2024",
        bullets: [
          "Queried MS SQL and PostgreSQL datasets and built Power BI dashboards tracking 10+ service metrics, SLA adherence and incident trends.",
          "Supported FP&A through budget forecasting and variance analysis; cut reporting turnaround by 40%.",
          "Analyzed network and storage performance to reduce incidents by 20%; client training lifted satisfaction by 25%.",
        ],
        tags: ["SQL", "PostgreSQL", "Power BI", "FP&A"],
      },
      {
        title: "Marketing Manager",
        org: "AIESEC",
        period: "Nov 2022 – Jun 2023",
        bullets: ["Led a 10+ member volunteer team, coordinating event logistics and tracking campaign performance."],
        tags: ["Marketing", "Events"],
      },
      {
        title: "President",
        org: "Politecnico Indian Students Association (PISA)",
        period: "Apr 2023 – Present",
        bullets: [
          "Lead strategic planning and initiatives impacting 1,000+ students.",
          "Organized a Red Bull-sponsored chess tournament with 400+ participants.",
        ],
        tags: ["Leadership", "Strategy"],
      },
      {
        title: "Logistics Coordinator",
        org: "Torino 2025 FISU Games",
        period: "May 2024 – Jul 2024",
        bullets: ["Coordinated logistics across 5+ venues, pre-event inspections and on-site execution."],
        tags: ["Volunteer", "Logistics"],
      },
    ],
  },

  /* ---------- About: a flight through the clouds ---------- */
  about: {
    hint: "Scroll to fly through my story",
    intro: {
      name: "ABHISHEK KUMAR",
      sub: "(Engineering Management @ PoliTo)",
      quote: ["\"Computer engineer by training,", "manager by ambition\""],
    },
    skills: {
      title: "SKILLS",
      sub: "Tools I love working with",
      items: ["Python", "SQL", "Power BI", "AI / ML", "MATLAB", "Docker", "Figma", "React", "Excel", "JIRA", "Notion", "Market Research", "Project Mgmt", "Public Speaking"],
    },
    journey: {
      title: "JOURNEY",
      sub: "My path so far...",
      islands: [
        { label: "POLITO", sub: "B.Sc. CompEng · 2022-2025" },
        { label: "FIBZIO", sub: "Data Analyst · 2023-2024" },
        { label: "OPENSKY", sub: "Mgmt Trainee · 2025" },
        { label: "POLITO", sub: "M.Sc. Eng. Mgmt · 2025-NOW" },
        { label: "PISA", sub: "President · 2023-NOW" },
      ],
    },
    awards: {
      title: "AWARDS",
      sub: "Certificates & wins",
      items: [
        "INSIDE LVMH Certificate",
        "McKinsey Forward Program",
        "CS50 — Harvard",
        "Therness Hackathon — 1st",
        "LOKI Hackathon — 1st",
        "Automation Hackathon — 2nd",
      ],
    },
    languages: ["Hindi · native", "English · professional", "Italian · beginner"],
    interests: ["Football", "Startups", "Economics", "FinTech", "Travel"],
  },

  /* ---------- Contact: signposts in the sea ---------- */
  contact: {
    hint: "Find a contact method",
    methods: [
      { label: "GITHUB",   url: "https://github.com/iamsammy-ak" },
      { label: "LINKEDIN", url: "https://www.linkedin.com/in/sammy4bhishek/" },
      { label: "MESSAGE",  url: "mailto:kumarabhishekk363@gmail.com" },
      { label: "MY CV",    url: "assets/Abhishek_Kumar_CV.pdf" },
    ],
  },

  achievements: [
    { id: "explorer",   title: "Explorer",   label: "Click a door to enter" },
    { id: "wanderer",   title: "Wanderer",   label: "Scroll to explore the corridor" },
    { id: "art_critic", title: "Art Critic", label: "Click a project to inspect" },
    { id: "director",   title: "Director",   label: "Drag to rotate the office" },
    { id: "sky_walker", title: "Sky Walker", label: "Scroll to fly through my story" },
    { id: "sociable",   title: "Sociable",   label: "Find a contact method" },
  ],
};
