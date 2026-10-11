---
title: Leeslijst-API
date: 2025-08
tags: [Node.js, Postgres, REST]
summary: Een kleine REST-API om bij te houden wat je leest, met optimistische deletes en offline synchronisatie.
---

# Leeslijst-API

Een gerichte REST-API met één taak: een persoonlijke leeslijst synchroon houden
tussen apparaten. Klein met opzet — een handvol endpoints, één tabel en een
synchronisatiestrategie die zich netjes gedraagt op een wankele telefoonverbinding.

## Endpoints

| Methode  | Pad                  | Doel                             |
| -------- | -------------------- | -------------------------------- |
| `GET`    | `/books`             | Lijst, met `?status=` en `?q=`   |
| `POST`   | `/books`             | Een boek toevoegen               |
| `PATCH`  | `/books/:id`         | Status of voortgang bijwerken    |
| `DELETE` | `/books/:id`         | Verwijderd, maar als tombe bewaard |
| `POST`   | `/sync`              | Lokale wijzigingen pushen, updates pullen |

## Waarom optimistische deletes

Mobiele clients gaan voortdurend offline. Als een delete op de server wacht, moet
de UI maar raden wat te tonen. In plaats daarvan past de client de wijziging
lokaal toe en zet hem in de wachtrij:

```js
async function removeBook(id) {
  const previous = state.books;
  state.books = state.books.filter((b) => b.id !== id); // optimistisch
  render();

  try {
    await api.delete(`/books/${id}`);
    await queue.remove(id);
  } catch (err) {
    state.books = previous;                              // terugdraaien
    render();
    await queue.keep(id);
  }
}
```

Op de server zijn deletes **tombs** in plaats van echte rijverwijderingen, zodat
een apparaat dat een week offline was nog steeds leert dat het boek weg is:

```sql
UPDATE books
   SET deleted_at = now(),
       updated_at = now()
 WHERE id = $1
   AND user_id = $2
RETURNING id, updated_at;
```

> Een delete die je niet kunt herhalen, is een delete die je twee keer moet doen.

## Synchroniseren in één roundtrip

`POST /sync` krijgt de `last_synced_at` van de client plus eventuele wachtende
mutaties, en geeft alles terug wat sindsdien is veranderd. Het is bewust dom —
last-write-wins per veld — want de data is een leeslijst, geen bankgrootboek.

## Lessen die ik met vallen en opstaan leerde

- **Tijdstempels, geen versienummers.** Een monotone `updated_at`-kolom haalde een
  hele klasse van "welke kopie is nieuwer?"-bugs weg.
- **Id's die de client zelf maakt.** UUID's die op het apparaat ontstaan, betekenden
  dat offline aanmaken nooit een serverronde nodig had om te verschijnen.
- **Pagineren vanaf dag één.** Achteraf cursors op een offset-API plakken is kommer
  en kwel.

## Cijfers

| Metriek            | Waarde          |
| ------------------ | --------------- |
| p95-latentie       | **38 ms**       |
| Rijen in `books`   | 4.200 (de mijne)|
| Testdekking        | 91%             |
| Infra              | 1 container + 1 DB |

---

*Gebouwd om een irritatie weg te nemen: te veel browserbladwijzers, geen één lijst.*
