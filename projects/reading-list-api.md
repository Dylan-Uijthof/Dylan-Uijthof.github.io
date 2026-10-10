---
title: Reading List API
date: 2025-08
tags: [Node.js, Postgres, REST]
summary: A small REST API for tracking what you're reading, with optimistic deletes and offline sync.
---

# Reading List API

A focused REST API for one job: keeping a personal reading list in sync across
devices. It's small on purpose — a handful of endpoints, a single table, and a
sync strategy that behaves well on a flaky phone connection.

## Endpoints

| Method   | Path                 | Purpose                          |
| -------- | -------------------- | -------------------------------- |
| `GET`    | `/books`             | List, with `?status=` and `?q=`  |
| `POST`   | `/books`             | Add a book                       |
| `PATCH`  | `/books/:id`         | Update status or progress        |
| `DELETE` | `/books/:id`         | Deleted, but tombstoned          |
| `POST`   | `/sync`              | Push local changes, pull updates |

## Why optimistic deletes

Mobile clients go offline constantly. If a delete waits for the server, the UI
has to guess what to show. Instead, the client applies the change locally and
queues it:

```js
async function removeBook(id) {
  const previous = state.books;
  state.books = state.books.filter((b) => b.id !== id); // optimistic
  render();

  try {
    await api.delete(`/books/${id}`);
    await queue.remove(id);
  } catch (err) {
    state.books = previous;                              // roll back
    render();
    await queue.keep(id);
  }
}
```

On the server, deletes are **tombstones** rather than real row deletions, so a
device that's been offline for a week still learns the book is gone:

```sql
UPDATE books
   SET deleted_at = now(),
       updated_at = now()
 WHERE id = $1
   AND user_id = $2
RETURNING id, updated_at;
```

> A delete you can't replay is a delete you'll have to make twice.

## Sync in one round trip

`POST /sync` takes the client's `last_synced_at` plus any queued mutations, and
returns everything that changed since. It's deliberately dumb — last-write-wins
on a per-field basis — because the data is a reading list, not a bank ledger.

## Hard-won lessons

- **Timestamps, not versions.** A monotonic `updated_at` column removed an
  entire class of "which copy is newer?" bugs.
- **Ids the client can make.** UUIDs generated on the device meant offline
  creates never needed a server round trip before showing up.
- **Paginate from day one.** Retrofitting cursors onto an offset API is misery.

## Numbers

| Metric              | Value          |
| ------------------- | -------------- |
| p95 latency         | **38 ms**      |
| Rows in `books`     | 4,200 (mine)   |
| Test coverage       | 91%            |
| Infra               | 1 container + 1 DB |

---

*Built to scratch an itch: too many browser bookmarks, no single list.*
