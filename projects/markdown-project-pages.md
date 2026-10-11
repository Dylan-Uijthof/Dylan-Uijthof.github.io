## Markdown-projectpagina's: projectteksten als losse .md-bestanden

Elk project op deze site is één Markdown-bestand. Ik wilde projectteksten kunnen schrijven in het formaat dat ik toch al gebruik in `README`'s, zonder de navigatie en footer van de site op te geven. Dus haalt deze pagina het `.md`-bestand op met `fetch()`, zet het in de browser om naar HTML en plakt het in een normale pagina die de navigatie en footer al heeft.

[GitHub](https://github.com/Dylan-Uijthof/Dylan-Uijthof.github.io)

**Status:** in gebruik op deze site. Draait volledig in de browser, zonder dependencies of buildstap.

### Waarom ik het maakte

Ik wilde geen framework en geen buildstap. GitHub Pages serveert statische bestanden, en met platte HTML, CSS en JS blijft de site eenvoudig: geen dependencies, geen tooling. Maar ik wilde mijn projectteksten ook niet in HTML schrijven: dat is onleesbaar in een diff en vervelend om aan te passen. Markdown met een renderer in de browser gaf me beide — de site blijft statisch, en ik schrijf in een formaat dat leesbaar blijft.

### Wat ik ervan geleerd heb

- **Hoeveel Markdown je met weinig code kunt ondersteunen.** Koppen, lijsten, tabellen, blockquotes, codeblokken en taken kosten ongeveer 250 regels JS. CommonMark is groot; de subset die ik echt gebruik niet.
- **Dat je eerst moet escapen en dan opmaken.** HTML escapen vóór je Markdown-vervangingen doet, is de veilige volgorde. Anders kun je via je eigen tekst HTML injecteren.
- **Dat `fetch()` een server nodig heeft.** `project.html` direct vanaf schijf openen werkt niet: browsers blokkeren `fetch()` op `file://`. Lokaal test ik met `python3 -m http.server`.

### Beslissingen en waarom

- **Een JSON-manifest in plaats van een map uitlezen.** GitHub Pages kan geen mappenindex genereren, dus `projects.json` is de expliciete lijst met titels, datums en tags voor het overzicht.
- **Front matter is optioneel.** Titel, datum en tags komen uit het manifest; een `.md`-bestand mag ze overschrijven. Bestanden zoals `vnpsp-RE.md` hebben helemaal geen front matter — hun openingskop is de titel.
- **De openingskop is de titel.** De renderer haalt een `#`/`##`-kop bovenaan het bestand eruit en gebruikt die als paginatitel, zodat de titel niet twee keer op de pagina staat.
- **Syntax highlighting zonder dependency.** Geen CDN, geen build — een klein tokenizertje in `markdown.js` kleurt de talen die ik gebruik.

### Wat ik zou verbeteren

- **Ankers zijn niet stabiel.** Verander je een kop, dan verandert de slug. Een expliciete anker-syntax zou links van buitenaf betrouwbaarder maken.
- **Geen volledige CommonMark.** Geneste lijsten en af en toe een tabelrand wijken van de spec af. Voor mezelf prima; laat ik ooit Markdown van anderen renderen, dan pak ik een echte parser.
- **Alles gebeurt client-side.** Op een trage verbinding zie je de tekst even later verschijnen. Pre-renderen zou dat oplossen, maar dat vraagt een buildstap (bijvoorbeeld via GitHub Actions), en die wilde ik bewust niet.

### Code-highlights

**1. Een project laden op basis van de `?p=`-parameter (`main.js`)**

```js
async function loadProject(slug) {
  var entry = projects.find(function (p) { return p.slug === slug; });
  var res = await fetch(CONFIG.projectsDir + entry.file);
  var parsed = Markdown.parseWithMeta(await res.text());
  document.getElementById('article-body').innerHTML = parsed.html;
}
```

*Waarom zo:* de URL is de enige bron van waarheid voor welk project je bekijkt. Daardoor werken een gedeelde link, de terugknop en een verversing allemaal zonder extra state.

**2. De openingskop als titel pakken (`markdown.js`)**

```js
var lead = md.match(/^[ \t]*(#{1,2})[ \t]+(.+?)[ \t]*#*[ \t]*(?:\n|$)/);
if (lead) {
  var leadTitle = lead[2].replace(/[`*_~\[\]]/g, '').trim();
  if (leadTitle && !meta.title) meta.title = leadTitle;
  md = md.slice(lead[0].length);
}
```

*Waarom zo:* hierdoor kan een bestand als `r-utils.md` met `##` beginnen en is die kop meteen de titel van de pagina — geen front matter nodig, en geen dubbele titel.

**3. Een klein tokenizertje voor highlighting (`markdown.js`)**

```js
if (cfg.strings && cfg.strings.indexOf(c) !== -1) {
  var q = c, j = i + 1, s = c;
  while (j < n) {
    if (code[j] === '\\') { s += code.substr(j, 2); j += 2; continue; }
    if (code[j] === q) { s += q; j++; break; }
    s += code[j];
    j++;
  }
  span('tok-str', s);
  i = j;
}
```

*Waarom zo:* in plaats van een bibliotheek loop ik de code één teken per keer door. Zodra ik een aanhalingsteken tegenkom, lees ik door tot het bijbehorende sluitteken, en een teken na een backslash sla ik over, zodat een ge-escapete quote de string niet afsluit.