---
title: Markdown-projectpagina's
date: 2026-02
tags: [JavaScript, Markdown, GitHub Pages]
summary: Hoe deze site elk project uit een gewoon .md-bestand weergeeft met één gedeelde navigatie en footer.
---

# Markdown-projectpagina's

Ik wilde projectteksten schrijven in Markdown — het formaat dat ik toch al gebruik
in `README`'s — zonder de navigatie van de site op te geven. Dus laadt dit
portfolio elk `.md`-bestand met `fetch()`, zet het in de browser om naar HTML en
zet het in een normale pagina die de navigatie en footer al heeft.

Geen static-site generator. Geen buildstap. Alleen een kleine renderer.

## Het idee

Elk project is één Markdown-bestand in `projects/`:

```text
projects/
├── projects.json              ← de index die de pagina leest
├── terminal-portfolio.md
├── markdown-project-pages.md
├── habit-cli.md
└── reading-list-api.md
```

Op een kaartje klikken brengt je naar `project.html?p=<slug>`. Die pagina:

1. leest de `p=`-parameter uit de URL,
2. zoekt het bijbehorende item in `projects.json`,
3. haalt `projects/<bestand>.md` op,
4. rendert het in `#article-body`,
5. werkt de titel, het kruimelpad, de leestijd en de vorige/volgende-links bij.

> De navigatie en footer blijven staan — alleen het midden van de pagina wisselt.

## Het manifest

GitHub Pages kan geen map uitlezen, dus een klein JSON-bestand doet dienst als
vervanger:

```json
{
  "projects": [
    {
      "slug": "terminal-portfolio",
      "title": "Terminalportfolio",
      "date": "2026-03",
      "tags": ["JavaScript", "CSS"],
      "featured": true
    }
  ]
}
```

De `title`, `date` en `tags` in het manifest zijn alleen voor de overzichtspagina.
Elk Markdown-bestand heeft *ook* zijn eigen front matter, en die wint op de
detailpagina:

```yaml
---
title: Terminalportfolio
date: 2026-03
tags: [JavaScript, CSS, Toegankelijkheid]
summary: Een portfolio dat je met het toetsenbord bedient.
---
```

## Wat de renderer ondersteunt

- [x] Koppen 1–6 met klikbare ankers
- [x] Vet, cursief, ~~doorgestreept~~, `inline code`
- [x] Links en afbeeldingen, met `title`-attributen
- [x] Codeblokken met ``` fences (inclusief kopieerknop)
- [x] Blockquotes, ook genest
- [x] Geordende, ongeordende en geneste lijsten
- [x] Tabellen met uitlijning
- [ ] Syntax highlighting *(bewust weggelaten — hield de payload klein)*

## Afwegingen

| Keuze                 | Voordeel                        | Nadeel                            |
| --------------------- | ------------------------------- | --------------------------------- |
| Renderen in de browser| Geen build, direct te bekijken  | Korte flikkering tijdens laden    |
| Zelfgeschreven parser | ~250 regels, geen dependencies  | Niet 100% CommonMark              |
| JSON-manifest         | Expliciete volgorde en metadata | Extra bestand om synchroon te houden |

## Valkuilen die het weten waard zijn

1. **Fetch heeft een server nodig.** `project.html` direct vanaf schijf openen
   geeft een fout, want browsers blokkeren `fetch()` op `file://`. Start
   `python3 -m http.server` en ga naar `localhost:8000` om lokaal te bekijken.
2. **Afbeeldingspaden zijn relatief aan de pagina, niet aan het Markdown-bestand.**
   Omdat de HTML in `project.html` in de hoofdmap wordt gezet, schrijf je
   `assets/img/foo.png` — niet `../assets/img/foo.png`.
3. **Houd slugs saai.** Kleine letters, streepjes, geen spaties. Ze komen in de URL.

---

*Nog een projectpagina, nog een `.md`-bestand, en het overzicht werkt zichzelf bij.*
