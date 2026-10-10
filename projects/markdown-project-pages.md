---
title: Markdown Project Pages
date: 2026-02
tags: [JavaScript, Markdown, GitHub Pages]
summary: How this site renders every project from a plain .md file while keeping one shared navbar and footer.
---

# Markdown Project Pages

I wanted to write project write-ups in Markdown — the format I already use in
`README`s — without giving up the site's navigation. So this portfolio loads
each `.md` file with `fetch()`, converts it to HTML in the browser, and drops it
into a normal page that already has the navbar and footer in place.

No static-site generator. No build step. Just a small renderer.

## The idea

Every project is one Markdown file in `projects/`:

```text
projects/
├── projects.json              ← the index the page reads
├── terminal-portfolio.md
├── markdown-project-pages.md
├── habit-cli.md
└── reading-list-api.md
```

Clicking a card takes you to `project.html?p=<slug>`. That page:

1. reads the `p=` query parameter,
2. finds the matching entry in `projects.json`,
3. fetches `projects/<file>.md`,
4. renders it into `#article-body`,
5. updates the title, breadcrumb, reading time and prev/next links.

> The navbar and footer never move — only the middle of the page is replaced.

## The manifest

GitHub Pages can't list a directory, so a tiny JSON file stands in for one:

```json
{
  "projects": [
    {
      "slug": "terminal-portfolio",
      "title": "Terminal Portfolio",
      "date": "2026-03",
      "tags": ["JavaScript", "CSS"],
      "featured": true
    }
  ]
}
```

The `title`, `date` and `tags` in the manifest are just for the listing page.
Each Markdown file *also* carries its own front matter, which wins on the detail
page:

```yaml
---
title: Terminal Portfolio
date: 2026-03
tags: [JavaScript, CSS, Accessibility]
summary: A keyboard-first portfolio with a working shell.
---
```

## What the renderer supports

- [x] Headings 1–6 with clickable anchors
- [x] Bold, italic, ~~strikethrough~~, `inline code`
- [x] Links and images, with `title` attributes
- [x] Fenced code blocks (copy button included)
- [x] Blockquotes, including nested ones
- [x] Ordered, unordered and nested lists
- [x] Tables with alignment
- [ ] Syntax highlighting *(deliberately out of scope — kept the payload tiny)*

## Trade-offs

| Decision            | Upside                          | Downside                          |
| ------------------- | ------------------------------- | --------------------------------- |
| Client-side render  | Zero build, instant previews    | A flash while the file loads      |
| Hand-rolled parser  | ~250 lines, no dependencies     | Not 100% CommonMark               |
| JSON manifest       | Explicit ordering and metadata  | One extra file to keep in sync    |

## Gotchas worth knowing

1. **Fetch needs a server.** Opening `project.html` straight from disk shows an
   error, because browsers block `fetch()` on `file://`. Run
   `python3 -m http.server` and visit `localhost:8000` to preview locally.
2. **Image paths are relative to the page, not the Markdown file.** Since the
   HTML is injected into `project.html` at the site root, write
   `assets/img/foo.png` — not `../assets/img/foo.png`.
3. **Keep slugs boring.** Lowercase, hyphens, no spaces. They end up in the URL.

---

*One more project page, one more `.md` file, and the listing updates itself.*
