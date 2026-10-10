# Dylan Uijthof — portfolio

A small, dependency-free portfolio. Plain **HTML, CSS and JavaScript** on
[GitHub Pages](https://pages.github.com/), with each project written as a
**Markdown** file and rendered inside a normal page — so the navbar and footer
are the same everywhere.

## Layout

```
.
├── index.html               Home
├── projects.html            All projects (with tag filters)
├── project.html             Renders a single Markdown file (?p=slug)
├── about.html               About
├── contact.html             Contact
├── 404.html                 GitHub Pages not-found page
├── assets/
│   ├── style.css            All the styling (light + dark)
│   ├── main.js              Navbar, theme, project loading  ← edit CONFIG here
│   ├── markdown.js          Self-contained Markdown → HTML renderer
│   └── img/                 Images used by project pages
├── projects/
│   ├── projects.json        The project index (the "manifest")
│   └── *.md                 One Markdown file per project
└── .nojekyll                Tells GitHub Pages to leave files alone
```

## Adding a project

1. Create `projects/my-project.md`:

   ```markdown
   ---
   title: My Project
   date: 2026-04
   tags: [JavaScript, CSS]
   summary: One sentence for the card on the projects page.
   ---

   # My Project

   Write the write-up in normal Markdown…
   ```

2. Add an entry to `projects/projects.json`:

   ```json
   {
     "slug": "my-project",
     "file": "my-project.md",
     "title": "My Project",
     "summary": "One sentence for the card on the projects page.",
     "date": "2026-04",
     "tags": ["JavaScript", "CSS"],
     "featured": true
   }
   ```

   - `slug` becomes the URL: `project.html?p=my-project`
   - `featured: true` shows it on the home page.
   - `file` is optional — it defaults to `<slug>.md`.

That's it. The projects page reads the manifest and builds the cards; the
Markdown is fetched and rendered when you open a project.

## Supported Markdown

Headings (with anchor links), **bold**, *italic*, ~~strikethrough~~, `inline
code`, links, images, fenced code blocks (with a copy button), blockquotes,
ordered / unordered / nested lists, task lists, tables with alignment, and
horizontal rules. Front matter (`---` block) supplies the title, date, tags and
summary.

## Editing your details

- **Name, email, social links, role:** the `CONFIG` block at the top of
  `assets/main.js`, plus the header/footer markup in each `.html` file.
- **Colors and spacing:** the design tokens at the top of `assets/style.css`.
- **About page copy and skills:** `about.html`.

## Previewing locally

`fetch()` is blocked when you open the files directly from disk
(`file://`), so run a tiny local server:

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying

The site is served straight from the default branch by GitHub Pages. Commit and
push — that's the deploy:

```bash
git add .
git commit -m "Update portfolio"
git push
```

## Notes

- Image paths inside a Markdown file are resolved relative to the **page**
  (`project.html` at the site root), not the Markdown file. Use
  `assets/img/foo.png`, not `../assets/img/foo.png`.
- Keep slugs lowercase with hyphens; they appear in the URL.
- There is no build step, no bundler and no dependencies.
