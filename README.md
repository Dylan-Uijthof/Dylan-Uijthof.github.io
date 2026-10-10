# Portfolio — multi-page + terminal

A small static portfolio: **pure HTML + CSS + JavaScript**, zero dependencies, no
build step. There's a simple navbar, a few regular pages, and an interactive
**terminal on the home page** that behaves like a file system — type
`cat portfolio.txt` and it prints clickable buttons that open your projects and
the other pages.

```
home (terminal)  →  projects  →  about  →  contact
```

## Try it

Open `index.html` in a browser (or `python3 -m http.server`). The home page
boots a terminal and **automatically runs `cat portfolio.txt`**, which shows
buttons for the other pages. Command examples:

| Command | What it does |
|---------|--------------|
| `cat portfolio.txt` | the main portfolio file with page buttons |
| `cat projects.txt` / `about.txt` / `contact.txt` | other sections |
| `open projects` / `open about` / `open contact` | navigate to a page |
| `projects` | list your projects with links |
| `help` | full command list |
| `theme` | cycle 5 built-in color schemes |
| `clear` | clear the terminal |

**Keys:** `Tab` autocompletes · `↑`/`↓` command history · `Ctrl+L` clears ·
`Ctrl+C` cancels. Click anywhere in the terminal to type.

## Pages

- `index.html` — hero + the interactive terminal
- `projects.html` — project cards (filled from `main.js`)
- `about.html` — bio + animated skill bars
- `contact.html` — email + social links
- `style.css` — themes + all styling
- `main.js` — content + terminal engine + page rendering

## Edit the content

Everything lives in the **`CONFIG`** block at the top of [`main.js`](main.js):

```js
const PROFILE   = { name, role, tagline, bio, socials, resume, ... };
const PROJECTS  = [ { name, year, desc, tags, url }, ... ];  // → projects.html
const SKILLS    = [ { name, level }, ... ];                   // level 0–100
const EXPERIENCE= [ { role, org, period, points }, ... ];
```

Edit those arrays and all pages + the terminal update at once — single source of
truth.

## Themes

Themes are named CSS variable blocks in `style.css`. Five are built in:
`matrix` (default), `dracula`, `nord`, `amber`, `paper`. Add your own by adding
`[data-theme="name"] { --bg: …; --accent: …; }` to `style.css` and the name to
the `THEMES` array in `main.js`. The choice is saved in `localStorage`.

## Deploy on GitHub Pages

```sh
git add -A
git commit -m "Add portfolio"
git push origin main
```

Visit `https://dylan-uijthof.github.io`.

## License

[MIT](LICENSE)