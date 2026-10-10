---
title: Terminal Portfolio
date: 2026-03
tags: [JavaScript, CSS, Accessibility]
summary: A keyboard-first portfolio with a working shell, fuzzy file tree and five switchable themes.
---

# Terminal Portfolio

Most portfolios are a fancy PDF with extra steps. I wanted mine to feel like the
tools I actually use all day, so I built a **browser-based terminal** that doubles
as a portfolio. Type `ls`, open a file, read the output.

> It started as a joke: "what if the contact page was a `cat contact.txt`?"
> Then it became the whole thing.

## Why a terminal?

Three reasons, in order of how much I care about them:

1. **It's honest.** A shell is exactly what I do all day. There's no design
   language to maintain and nothing to fake.
2. **It's accessible when done right.** A terminal is just text, and text
   screenshots beautifully for screen readers — *if* you wire up the ARIA.
3. **It's fun.** Everything else on the web is a card. This is a prompt.

### The parts that were fiddly

- Handling `Tab` completion without trapping focus *inside* the page.
- Keeping the caret blinking in sync with a real `<input>`.
- Making `Ctrl+L` clear the screen without the browser stealing it first.

## Architecture

The whole thing is three files and no dependencies:

```text
terminal-portfolio/
├── index.html
├── style.css
└── main.js      ← all the fun lives here
```

Commands are a simple lookup table. Adding one is a single object:

```js
// main.js — command palette
const commands = {
  help:   () => print(HELP_TEXT),
  ls:     () => print(PROJECTS.map((p) => p.name).join('  ')),
  cat:    (args) => openFile(args[0]),
  theme:  (args) => setTheme(args[0] || cycleTheme()),
  clear:  () => screen.innerHTML = '',
};
```

Themes are pure CSS custom properties, so switching is a one-line attribute flip:

```css
[data-theme="matrix"] { --accent: #00ff9c; --bg: #050806; }
[data-theme="amber"]  { --accent: #ffb000; --bg: #12100a; }
```

## What shipped

| Feature        | Status | Notes                                    |
| -------------- | :----: | ---------------------------------------- |
| Command parsing|   ✅   | Quotes, flags, `--help`                  |
| Tab completion |   ✅   | Prefix + fuzzy match                     |
| History        |   ✅   | `↑` / `↓`, persisted to `localStorage`   |
| Themes         |   ✅   | 5 built in, remembered between visits    |
| Mobile keyboard|   ⚠️   | Works, but the soft keyboard is cramped  |

## Things I'd do differently

- **I'd start with the mobile layout.** The desktop terminal was easy; making it
  feel good on a phone took about as long as everything else combined.
- **I'd write the command parser test-first.** Regular expressions crept in and
  I paid for it in edge cases.

## Take a look

The full thing runs on GitHub Pages and is entirely inspectable — no build step,
no minifier, no framework.

- Source: [github.com/Dylan-Uijthof](https://github.com/Dylan-Uijthof)
- Try it: this site's home page

![A screenshot of the terminal portfolio](assets/img/placeholder.svg "Terminal portfolio — placeholder screenshot")

---

*Built with vanilla JavaScript, ~600 lines of CSS, and a stubborn refusal to add
a bundler.*
