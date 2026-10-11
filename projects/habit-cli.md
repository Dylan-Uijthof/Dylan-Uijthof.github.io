---
title: habit — een kleine gewoontetracker
date: 2025-11
tags: [Node.js, CLI, TypeScript]
summary: Een gewoontetracker voor de opdrachtregel zonder configuratie, die zijn status in één JSON-bestand bewaart.
---

# habit

Een gewoontetracker voor de opdrachtregel die één ding doet: je helpen het vakje
elke dag aan te vinken. Geen account, geen synchronisatieserver, geen telemetrie —
alleen een binary en een JSON-bestand in je home-map.

## De pitch

```
$ habit add "20 pagina's lezen"
Toegevoegd: 20 pagina's lezen

$ habit done lezen
✓ 20 pagina's lezen    reeks: 12 dagen

$ habit
VANDAAG
  [x] 20 pagina's lezen        reeks van 12 dagen
  [ ] strekken                 reeks van 3 dagen
  [ ] schrijven                reeks van 0 dagen
```

## Ontwerpdoelen

1. **Direct.** Elk commando komt binnen 100 ms terug, zelfs met jaren aan data.
2. **Draagbaar.** De hele status is `~/.habit/store.json` — back-up maken is het
   bestand kopiëren.
3. **Vergevensgezind.** Reeksen overleven een gemiste dag als je die als rustdag
   markeert.

## Datamodel

De opslag is bewust saai:

```json
{
  "habits": [
    {
      "id": "lezen",
      "label": "20 pagina's lezen",
      "created": "2025-11-02",
      "history": ["2025-11-02", "2025-11-03", "2025-11-05"]
    }
  ]
}
```

Reeksen worden afgeleid, nooit opgeslagen — dus ze kunnen niet uit de pas lopen:

```ts
export function currentStreak(days: string[], today = iso(new Date())): number {
  const set = new Set(days);
  let streak = 0;
  let cursor = new Date(today);

  while (set.has(iso(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
```

> Leid status af, dupliceer hem niet. Het enige dat erger is dan geen cache, is een
> cache die niemand meer invalideert.

## Functies

- [x] Gewoontes toevoegen, afvinken en archiveren
- [x] Reeksen en records van de langste reeks
- [x] Rustdagen die een reeks niet verbreken
- [x] Wekelijkse en maandelijkse overzichten
- [ ] Herinneringen via meldingen van het besturingssysteem

## Cijfers

| Metriek          | Waarde                        |
| ---------------- | ----------------------------- |
| Koude start      | **42 ms**                     |
| Grootte binary   | ~1,8 MB (gecompileerd met Bun)|
| Dependencies     | `commander`, `picocolors`     |
| Regels code      | ~700                          |

---

*Kleine tools moeten direct aanvoelen. Dat is het hele product.*
