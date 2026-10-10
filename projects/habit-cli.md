---
title: habit — a tiny habit tracker
date: 2025-11
tags: [Node.js, CLI, TypeScript]
summary: A zero-config command line habit tracker that keeps its state in a single JSON file.
---

# habit

A command line habit tracker that does one thing: helps you tick the box every
day. No account, no sync server, no telemetry — just a binary and a JSON file in
your home directory.

## The pitch

```
$ habit add "read 20 pages"
Added: read 20 pages

$ habit done read
✓ read 20 pages        streak: 12 days

$ habit
TODAY
  [x] read 20 pages        12 day streak
  [ ] stretch               3 day streak
  [ ] write                 0 day streak
```

## Design goals

1. **Instant.** Every command returns in under 100 ms, even with years of data.
2. **Portable.** The entire state is `~/.habit/store.json` — back it up by
   copying the file.
3. **Forgiving.** Streaks survive a missed day when you mark it as a rest day.

## Data model

The store is intentionally boring:

```json
{
  "habits": [
    {
      "id": "read",
      "label": "read 20 pages",
      "created": "2025-11-02",
      "history": ["2025-11-02", "2025-11-03", "2025-11-05"]
    }
  ]
}
```

Streaks are derived, never stored — so they can't drift out of sync:

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

> Derive state, don't duplicate it. The only thing worse than no cache is a
> cache nobody remembers to invalidate.

## Features

- [x] Add, complete and archive habits
- [x] Streaks and longest-streak stats
- [x] Rest days that don't break a streak
- [x] Weekly and monthly summaries
- [ ] Reminders via OS notifications

## Numbers

| Metric            | Value                    |
| ----------------- | ------------------------ |
| Cold start        | **42 ms**                |
| Binary size       | ~1.8 MB (Bun-compiled)   |
| Dependencies      | `commander`, `picocolors`|
| Lines of code     | ~700                     |

---

*Small tools should feel instant. That's the whole product.*
