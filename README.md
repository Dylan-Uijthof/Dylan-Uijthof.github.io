# Terminal Portfolio

An interactive, terminal-style portfolio — **pure HTML + CSS + JavaScript**, zero
dependencies, zero build step. Drop it on any static host (it's already wired for
GitHub Pages) and it just works.

```
 ____   __   __ _          _     _   _
|  _ \  \ \ / /| |        / \   | \ | |
| | | |  \ V / | |       / _ \  |  \| |
| |_| |   | |  | |___   / ___ \ | |\  |
|____/    |_|  |_____| /_/   \_\|_| \_|
```

## Try it

Open `index.html` in a browser. The page boots a fake shell — start with:

| Command      | What it does                            |
|--------------|-----------------------------------------|
| `help`       | full command list                       |
| `about`      | short bio                               |
| `projects`   | shows projects (`projects <name>` for one) |
| `skills`     | skill bars                              |
| `experience` | work history                            |
| `contact`    | email + social links                    |
| `neofetch`   | system-style profile card               |
| `theme`      | cycle through 5 built-in color schemes  |
| `clear`      | clear the screen                        |

**Keys:** `Tab` autocompletes · `↑`/`↓` scroll command history · `Ctrl+L` clears ·
`Ctrl+C` cancels the current line. Click anywhere to type.

## Edit the content

Everything lives in the **`CONFIG`** block at the top of [`main.js`](main.js):

```js
const PROFILE   = { name, role, bio, socials, resume, ... };
const PROJECTS  = [ { name, year, desc, tags, url }, ... ];
const SKILLS    = [ { name, level }, ... ];          // level: 0–100
const EXPERIENCE= [ { role, org, period, points }, ... ];
```

Change `PROFILE.email`, add your projects, point `PROFILE.resume` at a PDF — done.

## Themes

Themes are named CSS variable blocks in [`style.css`](style.css). Five are built in:

- `matrix` (default, green-on-black)
- `dracula`
- `nord`
- `amber` (solarized-ish)
- `paper` (light)

**Add your own:** drop a `[data-theme="myname"] { --bg: ...; --accent: ...; }`
block in `style.css`, then add `"myname"` to the `THEMES` array in `main.js`.
The theme choice is saved to `localStorage`.

## Structure

```
index.html   – the page shell and terminal chrome
style.css    – themes + styling
main.js      – CONFIG (edit this) + terminal engine
```

## Deploy on GitHub Pages

This repo is already the `Dylan-Uijthof.github.io` user site, so:

```sh
git add index.html style.css main.js README.md
git commit -m "Add terminal portfolio"
git push origin main
```

Visit `https://dylan-uijthof.github.io` — no build step needed.

## License

[MIT](LICENSE)