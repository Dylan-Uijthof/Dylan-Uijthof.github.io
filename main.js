/* ==========================================================================
   Portfolio — main.js
   Zero dependencies. Edit your content in the CONFIG block below.
   ========================================================================== */

/* ==========================================================================
   ✏️  CONFIG — EDIT ME
   ========================================================================== */

const PROFILE = {
  name:     "Dylan Uijthof",
  handle:   "dylan",                    // shown in the terminal prompt & navbar
  host:     "portfolio",
  role:     "Full-Stack Developer",     // placeholder
  location: "City, Country",            // placeholder
  email:    "dylanuijthof07@gmail.com",
  status:   "Open to opportunities",    // placeholder
  tagline:  "I build fast, accessible things for the web.",
  bio: [
    "Hi — I'm Dylan. I'm a developer who likes turning fuzzy ideas into",
    "products people actually use. I care about performance, accessibility",
    "and writing code that the next person can read.",
  ],
  socials: [
    { label: "GitHub",   url: "https://github.com/Dylan-Uijthof" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/your-handle" },
    { label: "Email",    url: "mailto:dylanuijthof07@gmail.com" },
  ],
  resume: "#",   // link to a PDF, or "#" to hide
};

const PROJECTS = [
  {
    name: "Project One",
    year: "2026",
    desc: "Short one-line description of what it does and why it's interesting.",
    tags: ["TypeScript", "Node", "Postgres"],
    url:  "https://github.com/Dylan-Uijthof",
  },
  {
    name: "Project Two",
    year: "2025",
    desc: "Another project. Lead with the outcome, not the tech stack.",
    tags: ["React", "Vite"],
    url:  "https://github.com/Dylan-Uijthof",
  },
  {
    name: "Project Three",
    year: "2025",
    desc: "A tool, a game, a CLI — whatever shows your range.",
    tags: ["Rust", "CLI"],
    url:  "https://github.com/Dylan-Uijthof",
  },
];

const SKILLS = [
  { name: "JavaScript / TypeScript", level: 90 },
  { name: "HTML & CSS",              level: 92 },
  { name: "Node.js",                 level: 78 },
  { name: "React",                   level: 75 },
  { name: "Postgres / SQL",          level: 68 },
  { name: "Docker / CI",             level: 60 },
];

const EXPERIENCE = [
  {
    role: "Job Title", org: "Company", period: "2024 — present",
    points: ["What you did and the impact it had.", "Another achievement."],
  },
  {
    role: "Previous Role", org: "Other Company", period: "2022 — 2024",
    points: ["Something you shipped or improved."],
  },
];

/* Must match a [data-theme="name"] block in style.css */
const THEMES = ["matrix", "dracula", "nord", "amber", "paper"];

/* ==========================================================================
   END CONFIG
   ========================================================================== */

const BANNER = [
  " ____   __   __ _          _     _   _",
  "|  _ \\  \\ \\ / /| |        / \\   | \\ | |",
  "| | | |  \\ V / | |       / _ \\  |  \\| |",
  "| |_| |   | |  | |___   / ___ \\ | |\\  |",
  "|____/    |_|  |_____| /_/   \\_\\|_| \\_|",
];

const TERMINAL = document.getElementById("terminal");

/* --------------------------------------------------------------------------
   Shared helpers
   -------------------------------------------------------------------------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const stripScheme = (url) => url.replace(/^https?:\/\//, "").replace(/^mailto:/, "");

const link = (url, label) =>
  `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

const tBtn = (num, label, href, external = false) => {
  const target = external ? ` target="_blank" rel="noopener noreferrer"` : "";
  return `<a class="t-btn" href="${esc(href)}"${target}><span class="num">[${num}]</span>${esc(label)}</a>`;
};

const fileView = (name, mode, lines) => {
  const body = lines.map((l) => `<div>${l}</div>`).join("");
  return `<div class="file"><div class="file-head"><span>${esc(name)}</span><span class="dim">${esc(mode)}</span></div><div class="file-body">${body}</div></div>`;
};

const bar = (level) => `█`.repeat(Math.round(level / 5)) + `░`.repeat(20 - Math.round(level / 5));

function setTheme(name, announce) {
  document.documentElement.setAttribute("data-theme", name);
  try { localStorage.setItem("portfolio-theme", name); } catch (_) {}
  if (TERMINAL && announce && typeof line === "function") line(`theme → ${name}`, "accent");
}
function cycleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  setTheme(next, true);
}

/* --------------------------------------------------------------------------
   Page rendering (non-terminal pages)
   -------------------------------------------------------------------------- */

/* about.html */
function renderAbout() {
  const bio = document.getElementById("about-bio");
  const status = document.getElementById("about-status");
  if (bio) {
    bio.textContent = PROFILE.bio.join(" ").replace(/\s+/g, " ");
  }
  if (status) {
    status.textContent = PROFILE.status;
    status.className = "status-line";
  }
  const bars = document.getElementById("skill-bars");
  if (bars) {
    bars.innerHTML = "";
    for (const s of SKILLS) {
      const row = document.createElement("div");
      row.className = "skill-row";
      row.innerHTML =
        `<div class="skill-name"><span>${esc(s.name)}</span><em>${s.level}%</em></div>` +
        `<div class="bar-track"><div class="bar-fill" data-level="${s.level}"></div></div>`;
      bars.appendChild(row);
    }
    requestAnimationFrame(() => {
      setTimeout(() => {
        bars.querySelectorAll(".bar-fill").forEach((f) => { f.style.width = f.dataset.level + "%"; });
      }, 60);
    });
  }
}

/* projects.html */
function renderProjects() {
  const grid = document.getElementById("project-cards");
  if (!grid) return;
  grid.innerHTML = "";
  for (const p of PROJECTS) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML =
      `<h3>${esc(p.name)} <span class="year">${esc(p.year)}</span></h3>` +
      `<p>${esc(p.desc)}</p>` +
      `<div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` +
      (p.url && p.url !== "#"
        ? `<a class="card-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">visit →</a>`
        : `<span class="card-link dim">no link yet</span>`);
    grid.appendChild(card);
  }
  if (!PROJECTS.length) {
    const p = document.createElement("p");
    p.className = "dim";
    p.textContent = "No projects yet — add some in main.js → PROJECTS.";
    grid.appendChild(p);
  }
}

/* contact.html */
function renderContact() {
  const list = document.getElementById("contact-list");
  if (!list) return;
  list.innerHTML = "";
  const card = (title, meta, href, label) =>
    `<div class="contact-card"><h3>${title}</h3><div class="meta">${meta}</div>` +
    `${link(href, label)}</div>`;
  list.innerHTML =
    card("email", "best for a quick message", `mailto:${PROFILE.email}`, PROFILE.email) +
    PROFILE.socials
      .filter((s) => s.url !== "mailto:" + PROFILE.email)
      .map((s) => card(s.label, "link", s.url, stripScheme(s.url)))
      .join("");
}

/* --------------------------------------------------------------------------
   Output helpers (terminal pages only)
   -------------------------------------------------------------------------- */
const outEl    = document.getElementById("out");
const screenEl = document.getElementById("screen");
const formEl   = document.getElementById("form");
const inputEl  = document.getElementById("entry");

function scroll() { screenEl.scrollTop = screenEl.scrollHeight; }

/** Append a plain text line. Empty text keeps the line height. */
function line(text = "", cls = "") {
  const d = document.createElement("div");
  d.className = "line" + (cls ? " " + cls : "");
  if (text === "") d.innerHTML = "&nbsp;";
  else d.textContent = text;
  outEl.appendChild(d);
  scroll();
  return d;
}

/** Append a line of trusted HTML (we build it ourselves). */
function raw(html, cls = "") {
  const d = document.createElement("div");
  d.className = "line" + (cls ? " " + cls : "");
  d.innerHTML = html;
  outEl.appendChild(d);
  scroll();
  return d;
}

const promptHTML = () =>
  `<span class="user">${esc(PROFILE.handle)}</span>` +
  `<span class="at">@</span><span class="host">${esc(PROFILE.host)}</span>` +
  `<span class="colon">:</span><span class="path">~</span>` +
  `<span class="sigil">$</span>`;

const heading = (text) => line(text, "section");

/* --------------------------------------------------------------------------
   The "file system": output of `cat <file>`
   -------------------------------------------------------------------------- */

/* One project, printed as a clickable line: name → url */
function projectLine(p, i) {
  const name = p.url && p.url !== "#"
    ? link(p.url, p.name)
    : `<span class="accent bold">${esc(p.name)}</span>`;
  const tags = p.tags.length ? ` <span class="dim">· ${esc(p.tags.join(", "))}</span>` : "";
  return `  <span class="accent bold">[${i + 1}]</span>  ${name}  <span class="dim">${esc(p.year)}</span>${tags}`;
}

function viewPortfolio() {
  raw(fileView("portfolio.txt", "-rw-r--r--  1 dylan  staff  1.6K", [
    `<span class="accent bold">${esc(PROFILE.name.toUpperCase())}</span> <span class="dim">·</span> ${esc(PROFILE.role)}`,
    `${esc(PROFILE.location)} · ${link(PROFILE.email, PROFILE.email)}`,
    "",
    `> ${esc(PROFILE.tagline)}`,
    "",
    "projects (click a name to open it):",
    ...PROJECTS.map(projectLine),
    "",
    "pages:",
    tBtn(1, "projects", "projects.html") +
      tBtn(2, "about", "about.html") +
      tBtn(3, "contact", "contact.html"),
    `<span class="dim">…or type: open projects · cat about.txt · help</span>`,
  ]));
}

function viewProjects() {
  const lines = [
    `PROJECTS  <span class="dim">(${PROJECTS.length} selected)</span>`,
    "",
    ...PROJECTS.map(projectLine),
    "",
    "open the full list:",
    tBtn(1, "projects page", "projects.html"),
    `<span class="dim">…or type: projects to see them right here</span>`,
  ];
  raw(fileView("projects.txt", "-rw-r--r--  1 dylan  staff  2.3K", lines));
}

function viewAbout() {
  const lines = [
    "ABOUT",
    "",
    ...PROFILE.bio,
    "",
    `<span class="accent bold">skills</span>  ` + SKILLS.map(
      (s) => `${esc(s.name)} ${bar(s.level)} ${s.level}%`).join("  "),
    "",
    tBtn(1, "about page", "about.html") + tBtn(2, "contact", "contact.html"),
  ];
  raw(fileView("about.txt", "-rw-r--r--  1 dylan  staff  0.9K", lines));
}

function viewContact() {
  const lines = [
    "CONTACT",
    "",
    `email    ${link(PROFILE.email, PROFILE.email)}`,
    ...PROFILE.socials
      .filter((s) => s.url !== "mailto:" + PROFILE.email)
      .map((s) => `${esc(s.label.toLowerCase().padEnd(9))}${link(s.url, stripScheme(s.url))}`),
    "",
    tBtn(1, "contact page", "contact.html"),
  ];
  raw(fileView("contact.txt", "-rw-r--r--  1 dylan  staff  0.4K", lines));
}

const FILES = {
  "portfolio.txt": viewPortfolio,
  "portfolio":     viewPortfolio,
  "projects.txt":  viewProjects,
  "projects":      viewProjects,
  "about.txt":     viewAbout,
  "about":         viewAbout,
  "contact.txt":   viewContact,
  "contact":       viewContact,
};

/* --------------------------------------------------------------------------
   Commands
   -------------------------------------------------------------------------- */

const COMMANDS = {
  help: {
    group: "core",
    help: "list available commands",
    run() {
      line("Available commands:", "accent bold");
      line();
      const pad = (s) => s.padEnd(30, " ");
      const groups = {
        explore: ["cat", "open", "projects", "about", "contact"],
        fun:     ["whoami", "skills", "experience", "neofetch"],
        look:    ["theme", "themes", "banner"],
        shell:   ["clear", "history", "date", "echo", "ls", "pwd", "resume"],
      };
      for (const [title, keys] of Object.entries(groups)) {
        line(title, "dim");
        for (const k of keys) {
          if (COMMANDS[k]) line("  " + pad(k) + COMMANDS[k].help);
        }
        line();
      }
      line("Tip: Tab autocompletes, ↑/↓ scroll history, Ctrl+L clears.", "dim");
    },
  },

  cat: {
    group: "core",
    help: "print a section: cat <portfolio|projects|about|contact>.txt",
    run(args) {
      const name = (args.join(" ").trim() || "portfolio").toLowerCase();
      const view = FILES[name];
      if (view) { view(); return; }
      line(`cat: ${args.join(" ")}: No such file or directory`, "err");
      line("files: portfolio.txt  projects.txt  about.txt  contact.txt", "dim");
    },
  },

  open: {
    group: "core",
    help: "open a page: open <projects|about|contact|home>",
    run(args) {
      const map = {
        "index": "index.html", "home": "index.html", "portfolio": "index.html",
        "projects": "projects.html", "about": "about.html", "contact": "contact.html",
      };
      const key = args.join(" ").trim().toLowerCase();
      if (map[key]) {
        line(`opening ${map[key]} …`, "dim");
        window.setTimeout(() => { window.location.href = map[key]; }, 250);
      } else {
        line(`open: unknown target "${key}"`, "err");
        line("try: open projects | open about | open contact", "dim");
      }
    },
  },

  projects: {
    group: "core",
    help: "list projects with links",
    run() {
      heading("projects");
      if (!PROJECTS.length) { line("no projects yet — add some in main.js", "dim"); return; }
      PROJECTS.forEach((p) => {
        raw(`<span class="accent bold">${esc(p.name)}</span> <span class="dim">${esc(p.year)}</span>`);
        line("  " + p.desc);
        if (p.url && p.url !== "#") {
          raw(`  <span class="dim">${esc(p.tags.join(" · "))}</span> → ${link(p.url, stripScheme(p.url))}`);
        }
        line();
      });
      line("→ see all: " + tBtn(1, "projects page", "projects.html"), "dim");
    },
  },

  about: { group: "core", help: "cat about.txt", run() { viewAbout(); } },
  contact: { group: "core", help: "cat contact.txt", run() { viewContact(); } },

  whoami: {
    group: "fun",
    help: "print name and role",
    run() {
      line(`${PROFILE.name} · ${PROFILE.role}`, "accent bold");
      line(`${PROFILE.location} · ${PROFILE.status}`, "dim");
    },
  },

  skills: {
    group: "fun",
    help: "print skill bars",
    run() {
      heading("skills");
      SKILLS.forEach((s) =>
        line(`${s.name.padEnd(24, " ")} ${bar(s.level)} ${s.level}%`));
    },
  },

  experience: {
    group: "fun",
    help: "work history",
    run() {
      heading("experience");
      EXPERIENCE.forEach((job, i) => {
        raw(`<span class="accent bold">${esc(job.role)}</span> <span class="dim">@</span> ${esc(job.org)}`);
        line(`  ${job.period}`, "dim");
        job.points.forEach((p) => line(`  • ${p}`));
        if (i < EXPERIENCE.length - 1) line();
      });
    },
  },

  neofetch: {
    group: "fun",
    help: "system-style profile card",
    run() {
      const info = [
        ["user",   `${PROFILE.handle}@${PROFILE.host}`],
        ["role",   PROFILE.role],
        ["base",   "HTML · CSS · JavaScript"],
        ["shell",  "vanilla.js"],
        ["locale", PROFILE.location],
        ["status", PROFILE.status],
      ];
      const rows = info.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
      raw(
        `<div class="fetch">` +
          `<pre class="fetch-art">${BANNER.map(esc).join("\n")}</pre>` +
          `<div class="fetch-info"><div class="accent bold">${esc(PROFILE.name)}</div>` +
          `<div class="dim">${"-".repeat(Math.max(12, PROFILE.name.length))}</div>` +
          `<dl class="kv">${rows}</dl></div>` +
        `</div>`
      );
    },
  },

  banner: {
    group: "look",
    help: "print the ascii logo",
    run() { BANNER.forEach((l) => line(l, "ascii")); },
  },

  theme: {
    group: "look",
    help: "switch theme: theme <name>",
    run(args) {
      if (!args[0]) {
        line(`current: ${document.documentElement.getAttribute("data-theme")}`, "dim");
        line(`run: theme ${THEMES.join(" | ")}`, "dim");
        return;
      }
      const name = args[0].toLowerCase();
      if (!THEMES.includes(name)) {
        line(`unknown theme: ${args[0]}`, "err");
        line(`available: ${THEMES.join(", ")}`, "dim");
        return;
      }
      setTheme(name, true);
    },
  },

  themes: { group: "look", help: "alias for theme", run() { COMMANDS.theme.run([]); } },

  resume: {
    group: "shell",
    help: "open my CV",
    run() {
      if (!PROFILE.resume || PROFILE.resume === "#") {
        line("no resume linked yet — set PROFILE.resume in main.js", "warn");
        return;
      }
      window.open(PROFILE.resume, "_blank", "noopener");
    },
  },

  ls: {
    group: "shell",
    help: "list files",
    run() {
      line("portfolio.txt   about.txt   projects.txt   contact.txt   links/", "accent-2");
    },
  },

  pwd: { group: "shell", help: "print working directory", run() { line(`/home/${PROFILE.handle}/portfolio`); } },
  date: { group: "shell", help: "current date & time", run() { line(new Date().toString()); } },
  echo: { group: "shell", help: "echo text back", run(args) { line(args.join(" ")); } },

  history: {
    group: "shell",
    help: "show command history",
    run() {
      if (!history.length) { line("no history yet", "dim"); return; }
      history.forEach((h, i) =>
        raw(`<span class="entry-num">${String(i + 1).padStart(3, " ")}  </span>${esc(h)}`));
    },
  },

  clear: {
    group: "shell",
    help: "clear the screen",
    run() { outEl.textContent = ""; },
  },

  /* ---------------------------- Easter eggs ---------------------------- */
  sudo: {
    group: "hidden", help: "run as root",
    run() { line("dylan is not in the sudoers file. This incident will be reported.", "err"); },
  },
  rm: {
    group: "hidden", help: "remove files",
    run() { line("Nice try. This portfolio is read-only. 🙂", "warn"); },
  },
  coffee: {
    group: "hidden", help: "brew coffee",
    run() { line("HTTP 418: I'm a teapot.", "err"); line("...but I do run on coffee. ☕", "dim"); },
  },
  exit: {
    group: "hidden", help: "leave the terminal",
    run() { line("There's no escape. Try closing the tab.", "dim"); },
  },
};

/* --------------------------------------------------------------------------
   Command execution
   -------------------------------------------------------------------------- */
let history = [];
let histIndex = -1;
let draft = "";
let busy = false;
let booting = false;

function echoPrompt(text) {
  raw(`<span class="prompt-echo">${promptHTML()} <span class="cmd">${esc(text)}</span></span>`);
}

async function run(rawText, { echo = true, save = true } = {}) {
  const text = rawText.trim();
  if (echo) echoPrompt(rawText);

  if (!text) return;

  if (save) { history.push(text); histIndex = history.length; }
  draft = "";

  const parts = text.split(/\s+/);
  const name = parts[0].toLowerCase();
  const args = parts.slice(1);
  const cmd = COMMANDS[name];

  if (!cmd) {
    line(`command not found: ${name}`, "err");
    const near = Object.keys(COMMANDS).filter((k) => k.startsWith(name[0]));
    if (near.length) line(`did you mean: ${near.join(", ")}?`, "dim");
    else line("type 'help' for the list", "dim");
  } else {
    try { await cmd.run(args); } catch (e) { line("error: " + e.message, "err"); }
  }
  line();
}

/* --------------------------------------------------------------------------
   Terminal boot — no animation, straight to `cat portfolio.txt`
   -------------------------------------------------------------------------- */
function boot() {
  booting = true;
  outEl.textContent = "";
  run("cat portfolio.txt", { save: false });
  booting = false;
  focusInput();
}

/* --------------------------------------------------------------------------
   Input handling
   -------------------------------------------------------------------------- */
function focusInput() {
  try { inputEl.focus({ preventScroll: true }); } catch (_) { inputEl.focus(); }
}
function renderEntry() { document.getElementById("entryText").textContent = inputEl.value; }

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busy) return;
  const value = inputEl.value;
  busy = true;
  inputEl.value = "";
  renderEntry();
  await run(value);
  busy = false;
  focusInput();
  requestAnimationFrame(scroll);
});

inputEl.addEventListener("input", renderEntry);

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    complete();
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (histIndex > 0) {
      if (histIndex === history.length) draft = inputEl.value;
      histIndex--;
      inputEl.value = history[histIndex];
      renderEntry();
    }
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (histIndex < history.length - 1) {
      histIndex++;
      inputEl.value = history[histIndex];
    } else if (histIndex === history.length - 1) {
      histIndex = history.length;
      inputEl.value = draft;
    }
    renderEntry();
    return;
  }
  if (e.ctrlKey && e.key.toLowerCase() === "l") {
    e.preventDefault();
    outEl.textContent = "";
    line();
    return;
  }
  if (e.ctrlKey && e.key.toLowerCase() === "c") {
    e.preventDefault();
    echoPrompt(inputEl.value + "^C");
    inputEl.value = "";
    renderEntry();
    line();
    return;
  }
});

/** Tab completion for commands and theme names. */
function complete() {
  const value = inputEl.value;
  const parts = value.split(/\s+/);

  if (parts.length === 2 && parts[0].toLowerCase() === "theme") {
    const m = THEMES.filter((t) => t.startsWith(parts[1].toLowerCase()));
    if (m.length === 1) { inputEl.value = `theme ${m[0]}`; renderEntry(); }
    else if (m.length > 1) { echoPrompt(value); line(m.join("  "), "dim"); line(); }
    return;
  }
  if (parts.length > 1) return;

  const frag = parts[0].toLowerCase();
  const matches = Object.keys(COMMANDS).filter(
    (c) => COMMANDS[c].group !== "hidden" && c.startsWith(frag));

  if (matches.length === 1) { inputEl.value = matches[0] + " "; renderEntry(); }
  else if (matches.length > 1) { echoPrompt(value); line(matches.join("  "), "dim"); line(); }
}

/* Focus: click anywhere in the screen to type. */
screenEl.addEventListener("click", (e) => {
  if (e.target.closest("a, button")) return;
  const sel = window.getSelection();
  if (sel && sel.toString().length) return;
  focusInput();
});

inputEl.addEventListener("focus", () => screenEl.classList.add("focused"));
inputEl.addEventListener("blur", () => screenEl.classList.remove("focused"));

document.addEventListener("keydown", (e) => {
  if (booting) return;
  if (e.key.length === 1 || e.key === "Backspace") {
    if (document.activeElement !== inputEl) focusInput();
  }
});

/* --------------------------------------------------------------------------
   Init (every page)
   -------------------------------------------------------------------------- */
(function init() {
  // theme
  try {
    const saved = localStorage.getItem("portfolio-theme");
    if (saved && THEMES.includes(saved)) {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (_) {}

  const themeBtn = document.getElementById("themebtn");
  if (themeBtn) themeBtn.addEventListener("click", cycleTheme);

  // footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // page-specific rendering
  renderAbout();
  renderProjects();
  renderContact();

  // terminal (only on the home page)
  if (TERMINAL && outEl && screenEl && formEl && inputEl) {
    const title = document.getElementById("title");
    if (title) title.textContent = `${PROFILE.handle}@${PROFILE.host}: ~ — ${PROFILE.role}`;

    window.addEventListener("load", () => {
      screenEl.classList.add("focused");
      boot();
    });
  }
})();