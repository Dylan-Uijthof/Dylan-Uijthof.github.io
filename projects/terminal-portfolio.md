---
title: Terminalportfolio
date: 2026-03
tags: [JavaScript, CSS, Toegankelijkheid]
summary: Een portfolio dat je met het toetsenbord bedient, met een werkende shell, fuzzy bestandsboom en vijf wisselbare thema's.
---

# Terminalportfolio

De meeste portfolio's zijn een mooie pdf met extra stappen. Ik wilde dat de mijne
aanvoelde als de gereedschappen die ik de hele dag gebruik, dus bouwde ik een
**terminal in de browser** die tegelijk dienstdoet als portfolio. Typ `ls`, open
een bestand, lees de uitvoer.

> Het begon als grap: "wat als de contactpagina gewoon `cat contact.txt` was?"
> Daarna werd het het hele ding.

## Waarom een terminal?

Drie redenen, in volgorde van hoe belangrijk ik ze vind:

1. **Het is eerlijk.** Een shell is precies wat ik de hele dag doe. Er is geen
   design language om te onderhouden en niets om te faken.
2. **Het is toegankelijk als je het goed doet.** Een terminal is gewoon tekst, en
   tekst laat zich prima voorlezen — *mits* je de ARIA goed opzet.
3. **Het is leuk.** Al het andere op het web is een kaartje. Dit is een prompt.

### De onderdelen die lastig waren

- `Tab`-aanvulling zonder de focus *in* de pagina te vangen.
- De cursor synchroon laten knipperen met een echte `<input>`.
- `Ctrl+L` het scherm laten wissen zonder dat de browser het eerst pakt.

## Architectuur

Het hele ding is drie bestanden en geen dependencies:

```text
terminal-portfolio/
├── index.html
├── style.css
└── main.js      ← hier zit alle lol
```

Commando's zijn een simpele opzoektabel. Eén toevoegen is één object:

```js
// main.js — commandopalet
const commands = {
  help:   () => print(HELP_TEXT),
  ls:     () => print(PROJECTS.map((p) => p.name).join('  ')),
  cat:    (args) => openFile(args[0]),
  theme:  (args) => setTheme(args[0] || cycleTheme()),
  clear:  () => screen.innerHTML = '',
};
```

Thema's zijn puur CSS custom properties, dus wisselen is één attribuut omzetten:

```css
[data-theme="matrix"] { --accent: #00ff9c; --bg: #050806; }
[data-theme="amber"]  { --accent: #ffb000; --bg: #12100a; }
```

## Wat er is opgeleverd

| Functie          | Status | Opmerking                                    |
| ---------------- | :----: | -------------------------------------------- |
| Commandoparsing  |   ✅   | Quotes, flags, `--help`                      |
| Tab-aanvulling   |   ✅   | Prefix + fuzzy match                         |
| Geschiedenis     |   ✅   | `↑` / `↓`, bewaard in `localStorage`         |
| Thema's          |   ✅   | 5 ingebouwd, onthouden tussen bezoeken       |
| Mobiel toetsenbord | ⚠️   | Werkt, maar het schermtoetsenbord is krap   |

## Wat ik anders zou doen

- **Ik zou bij de mobiele layout beginnen.** De desktopterminal was makkelijk; hem
  op een telefoon goed laten voelen kostte ongeveer evenveel als al het andere bij
  elkaar.
- **Ik zou de commandoparser test-first schrijven.** Er slopen regexes in en dat
  betaalde ik terug in randgevallen.

## Neem een kijkje

Het hele ding draait op GitHub Pages en is volledig te inspecteren — geen
buildstap, geen minifier, geen framework.

- Broncode: [github.com/Dylan-Uijthof](https://github.com/Dylan-Uijthof)
- Probeer het: de homepagina van deze site

![Een schermafbeelding van het terminalportfolio](assets/img/placeholder.svg "Terminalportfolio — tijdelijke schermafbeelding")

---

*Gemaakt met vanilla JavaScript, ~600 regels CSS en een koppige weigering om een
bundler toe te voegen.*
