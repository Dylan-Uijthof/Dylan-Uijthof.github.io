/* ==========================================================================
   Terminal portfolio — main.js
   Zero dependencies. Everything you need to edit is in the CONFIG block.
   ========================================================================== */

/* ==========================================================================
   ✏️  CONFIG — EDIT ME
   ========================================================================== */

const PROFILE = {
  name:     "Dylan Uijthof",
  handle:   "dylan",                    // shown in the prompt: dylan@portfolio
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
    "",
    "[ EDIT ME ] Replace this bio, the role above and the project list below.",
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

/* Themes must match a [data-theme="name"] block in style.css */
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

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --------------------------------------------------------------------------
   DOM
   -------------------------------------------------------------------------- */
const root      = document.documentElement;
const outEl     = document.getElementById("out");
const screenEl  = document.getElementById("screen");
const formEl    = document.getElementById("form");
const inputEl   = document.getElementById("entry");
const entryEl   = document.getElementById("entryText");
const titleEl   = document.getElementById("title");
const themeBtn  = document.getElementById("themebtn");

/* --------------------------------------------------------------------------
   Output helpers
   -------------------------------------------------------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

/** Type text out character by character (respects skip / reduced motion). */
async function typeOut(text, cls = "", speed = 12) {
  const d = line("", cls);
  if (skip || speed === 0) { if (text) d.textContent = text; scroll(); return d; }
  for (let i = 0; i < text.length; i++) {
    d.textContent += text[i];
    if (i % 4 === 0) scroll();
    await sleep(speed);
    if (skip) { d.textContent = text; break; }
  }
  if (text === "") d.innerHTML = "&nbsp;";
  scroll();
  return d;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const link = (url, label) =>
  `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

const promptHTML = () =>
  `<span class="user">${esc(PROFILE.handle)}</span>` +
  `<span class="at">@</span><span class="host">${esc(PROFILE.host)}</span>` +
  `<span class="colon">:</span><span class="path">~</span>` +
  `<span class="sigil">$</span>`;

function heading(text) { line(text, "section"); }

function bar(level, width = 22) {
  const filled = Math.round((level / 100) * width);
  return `<span class="bar"><span class="fill">${"█".repeat(filled)}</span>` +
         `<span class="empty">${"░".repeat(width - filled)}</span></span>`;
}

/* --------------------------------------------------------------------------
   Boot sequence
   -------------------------------------------------------------------------- */
let skip = REDUCED;
let booting = true;

function requestSkip() { skip = true; }

const BOOT_LINES = [
  ["[  OK  ] booting portfolio.sh",                    "dim"],
  [`[  OK  ] mounting profile: ${PROFILE.name}`,       "dim"],
  ["[  OK  ] loading modules: html css js",            "dim"],
  ["[  OK  ] /dev/coffee ................ ready",      "dim"],
];

async function boot() {
  document.addEventListener("keydown", requestSkip, { capture: true });
  screenEl.addEventListener("pointerdown", requestSkip, { capture: true });

  outEl.textContent = "";
  for (const [text, cls] of BOOT_LINES) await typeOut(text, cls, 6);

  line();
  for (const l of BANNER) line(l, "ascii");
  await sleep(skip ? 0 : 120);

  await typeOut(`${PROFILE.name} — ${PROFILE.role}`, "accent bold", 8);
  await typeOut(PROFILE.tagline, "", 8);
  line();
  await typeOut("This terminal is interactive. Type a command and hit Enter.", "dim", 6);
  line("Try: help · about · projects · skills · contact · theme", "dim");
  line("Keys: Tab completes, ↑/↓ history, Ctrl+L clears.", "dim");
  line();

  booting = false;
  skip = REDUCED;
  document.removeEventListener("keydown", requestSkip, { capture: true });
  screenEl.removeEventListener("pointerdown", requestSkip, { capture: true });
  focusInput();
}

/* --------------------------------------------------------------------------
   Commands
   -------------------------------------------------------------------------- */

/** Each command: { help, group, run(args) } */
const COMMANDS = {
  help: {
    group: "core",
    help: "list available commands",
    run() {
      const groups = {
        about: ["about", "whoami", "skills", "experience"],
        work:  ["projects", "resume"],
        reach: ["contact", "socials"],
        look:  ["banner", "neofetch", "themes", "theme"],
        shell: ["clear", "history", "date", "echo", "ls", "pwd"],
      };
      line("Available commands:", "accent bold");
      line();
      const pad = (s) => s.padEnd(34, " ");
      const render = (title, keys) => {
        line(title, "dim");
        for (const k of keys) {
          if (COMMANDS[k]) line("  " + pad(k) + COMMANDS[k].help);
        }
        line();
      };
      render("about", groups.about);
      render("work", groups.work);
      render("reach", groups.reach);
      render("appearance", groups.look);
      render("shell", groups.shell);
      line("Tip: Tab autocompletes. Some commands hide a surprise. 🙂", "dim");
    },
  },

  whoami: {
    group: "core",
    help: "print name and role",
    run() {
      line(`${PROFILE.name} · ${PROFILE.role}`, "accent bold");
      line(`${PROFILE.location} · ${PROFILE.status}`, "dim");
    },
  },

  about: {
    group: "core",
    help: "short bio",
    run() {
      heading("about");
      for (const l of PROFILE.bio) line(l);
    },
  },

  skills: {
    group: "core",
    help: "things I work with",
    run() {
      heading("skills");
      for (const s of SKILLS) {
        raw(`${esc(s.name.padEnd(24, " "))} ${bar(s.level)} <span class="dim">${s.level}%</span>`);
      }
    },
  },

  experience: {
    group: "core",
    help: "where I've worked",
    run() {
      heading("experience");
      EXPERIENCE.forEach((job, i) => {
        raw(`<span class="accent bold">${esc(job.role)}</span> <span class="dim">@</span> ${esc(job.org)}`);
        line(`  ${job.period}`, "dim");
        for (const p of job.points) line(`  • ${p}`);
        if (i < EXPERIENCE.length - 1) line();
      });
    },
  },

  projects: {
    group: "work",
    help: "selected work",
    run(args) {
      if (args[0]) {
        const p = PROJECTS.find(
          (x) => x.name.toLowerCase().includes(args.join(" ").toLowerCase()));
        if (!p) { line(`no project matching "${args.join(" ")}"`, "err"); return; }
        line(p.name, "accent bold");
        line(p.year + " · " + p.tags.join(", "), "dim");
        line();
        line(p.desc);
        line();
        line("→ " + p.url, "accent-2");
        return;
      }
      heading("projects");
      for (const p of PROJECTS) {
        raw(`<span class="accent bold">${esc(p.name)}</span> <span class="dim">${esc(p.year)}</span>`);
        line("  " + p.desc);
        raw(`  <span class="dim">${esc(p.tags.join(" · "))}</span> → ${link(p.url, p.url.replace(/^https?:\/\//, ""))}`);
        line();
      }
      line("Open one with: projects " + PROJECTS[0].name, "dim");
    },
  },

  contact: {
    group: "reach",
    help: "how to reach me",
    run() {
      heading("contact");
      raw(`email    ${link(PROFILE.email, PROFILE.email)}`);
      for (const s of PROFILE.socials) raw(`${esc(s.label.toLowerCase().padEnd(9))}${link(s.url, s.url.replace(/^mailto:/, ""))}`);
    },
  },

  socials: {
    group: "reach",
    help: "alias for contact",
    run() { COMMANDS.contact.run(); },
  },

  resume: {
    group: "work",
    help: "get my CV",
    run() {
      if (!PROFILE.resume || PROFILE.resume === "#") {
        line("no resume linked yet — set PROFILE.resume in main.js", "warn");
        return;
      }
      line("Opening resume…", "dim");
      window.open(PROFILE.resume, "_blank", "noopener");
    },
  },

  banner: {
    group: "look",
    help: "print the logo again",
    run() { for (const l of BANNER) line(l, "ascii"); },
  },

  neofetch: {
    group: "look",
    help: "system-style summary",
    run() {
      const info = [
        ["user",  `${PROFILE.handle}@${PROFILE.host}`],
        ["role",  PROFILE.role],
        ["base",  "HTML · CSS · JavaScript"],
        ["shell", "vanilla.js"],
        ["editor","whatever works"],
        ["locale",PROFILE.location],
        ["uptime",`${Math.round(performance.now() / 1000)}s`],
        ["status",PROFILE.status],
      ];
      const art = BANNER.map((l) => esc(l)).join("\n");
      const rows = info
        .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
      raw(
        `<div class="fetch">` +
          `<pre class="fetch-art">${art}</pre>` +
          `<div class="fetch-info"><div class="accent bold">${esc(PROFILE.name)}</div>` +
          `<div class="dim">${"-".repeat(Math.max(12, PROFILE.name.length))}</div>` +
          `<dl class="kv">${rows}</dl></div>` +
        `</div>`
      );
    },
  },

  theme: {
    group: "look",
    help: "switch theme: theme <name>",
    run(args) {
      if (!args[0]) {
        line(`current theme: ${root.getAttribute("data-theme")}`, "dim");
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

  themes: { group: "look", help: "list themes", run() { COMMANDS.theme.run([]); } },

  clear: {
    group: "shell",
    help: "clear the screen",
    run(args) {
      if (args[0] === "-h") { line("clear -h  (just clears, there are no flags 😄)", "dim"); return; }
      outEl.textContent = "";
    },
  },

  history: {
    group: "shell",
    help: "show command history",
    run() {
      if (!history.length) { line("no history yet", "dim"); return; }
      history.forEach((h, i) =>
        raw(`<span class="entry-num">${String(i + 1).padStart(3, " ")}  </span>${esc(h)}`));
    },
  },

  date: { group: "shell", help: "current date & time", run() { line(new Date().toString()); } },

  echo: {
    group: "shell",
    help: "echo text back",
    run(args) { line(args.join(" ")); },
  },

  ls: {
    group: "shell",
    help: "list sections as files",
    run() {
      raw(
        `<span class="accent-2">about.txt</span>   ` +
        `<span class="accent-2">contact.json</span>   ` +
        `<span class="accent-2">projects/</span>   ` +
        `<span class="accent-2">skills.md</span>   ` +
        `<span class="accent-2">resume.pdf</span>`
      );
    },
  },

  pwd: { group: "shell", help: "print working directory", run() { line(`/home/${PROFILE.handle}/portfolio`); } },

  /* ---------------------------- Easter eggs ---------------------------- */
  sudo: {
    group: "hidden", help: "run a command as root",
    run(args) {
      if (!args.length) { line("usage: sudo <command>", "dim"); return; }
      line(`${PROFILE.handle} is not in the sudoers file. This incident will be reported.`, "err");
    },
  },
  rm: {
    group: "hidden", help: "remove files",
    run() { line("Nice try. This portfolio is read-only. 🙂", "warn"); },
  },
  coffee: {
    group: "hidden", help: "brew coffee",
    run() {
      line("HTTP 418: I'm a teapot.", "err");
      line("...but I do run on coffee. ☕", "dim");
    },
  },
  exit: {
    group: "hidden", help: "leave the terminal",
    run() {
      line("There's no escape. (Try closing the tab.)", "dim");
    },
  },
};

/* --------------------------------------------------------------------------
   Command execution
   -------------------------------------------------------------------------- */
let history = [];
let histIndex = -1;
let draft = "";
let busy = false;

function echoPrompt(text) {
  raw(`<span class="prompt-echo">${promptHTML()} <span class="cmd">${esc(text)}</span></span>`);
}

async function run(rawText) {
  const text = rawText.trim();
  echoPrompt(rawText);

  if (!text) return;

  history.push(text);
  histIndex = history.length;
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
   Themes
   -------------------------------------------------------------------------- */
function setTheme(name, announce) {
  root.setAttribute("data-theme", name);
  try { localStorage.setItem("portfolio-theme", name); } catch (_) {}
  if (announce) line(`theme → ${name}`, "accent");
}
function cycleTheme() {
  const cur = root.getAttribute("data-theme");
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  setTheme(next, true);
}

/* --------------------------------------------------------------------------
   Input handling
   -------------------------------------------------------------------------- */
function focusInput() {
  try { inputEl.focus({ preventScroll: true }); } catch (_) { inputEl.focus(); }
}
function renderEntry() { entryEl.textContent = inputEl.value; }

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
  if (e.ctrlKey && e.key.toLowerCase() === "l") { e.preventDefault(); outEl.textContent = ""; line(); return; }
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

  // completing a theme argument
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

  if (matches.length === 1) {
    inputEl.value = matches[0] + " ";
    renderEntry();
  } else if (matches.length > 1) {
    echoPrompt(value);
    line(matches.join("  "), "dim");
    line();
  }
}

/* Focus management: click anywhere on the screen to type. */
screenEl.addEventListener("click", (e) => {
  if (e.target.closest("a, button")) return;
  const sel = window.getSelection();
  if (sel && sel.toString().length) return;
  focusInput();
});

inputEl.addEventListener("focus", () => screenEl.classList.add("focused"));
inputEl.addEventListener("blur",  () => screenEl.classList.remove("focused"));

themeBtn.addEventListener("click", (e) => { e.stopPropagation(); cycleTheme(); focusInput(); });

document.addEventListener("keydown", (e) => {
  if (booting) return;
  if (e.key.length === 1 || e.key === "Backspace") {
    if (document.activeElement !== inputEl) focusInput();
  }
});

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
(function init() {
  try {
    const saved = localStorage.getItem("portfolio-theme");
    if (saved && THEMES.includes(saved)) root.setAttribute("data-theme", saved);
  } catch (_) {}

  const base = PROFILE.handle + "@" + PROFILE.host;
  titleEl.textContent = `${base}: ~ — ${PROFILE.role}`;

  root.setAttribute("data-theme", root.getAttribute("data-theme") || "matrix");

  window.addEventListener("load", () => { screenEl.classList.add("focused"); });
  boot();
})();
