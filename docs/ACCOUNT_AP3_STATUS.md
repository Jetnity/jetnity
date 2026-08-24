# Jetnity Account AP-3 – Status

Stand: 24. August 2026  
Status: **auf `main` `78192ab` synchronisiert – lokale/remote Exact-Head-Gates folgen; Draft, kein Ready, kein Merge, kein AP-4**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap3` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/53 |
| Base | `main` @ `78192ab775165d08bb357140c2d04b865b8cc049` |
| Auftrag | `docs/ACCOUNT_AP3_TASK.md` |
| Entscheidung | ADR-0160 (nicht ADR-0158; das bleibt Admin Slice A. ADR-0162 bleibt Admin Slice C) |
| Self-Review | `docs/ACCOUNT_AP3_SELF_REVIEW.md` |

## Current-Main-Sync nach Admin Slice C

PR #49 / Admin Slice C liegt auf `main` `78192ab`. AP-3 wurde darauf rebased. Merge-Base ist genau dieser Commit.

Runtime-Scope unverändert gegenüber dem letzten gegateten Stand auf `e3bad749`:

- ableitende Gruppen Aktiv / Kommend / Vergangen / Ohne Datum
- fail-closed 200er-Hinweis
- kein Archiv-Write, keine Pagination-Architektur, keine neue Funktionalität

Admin Slice C / ADR-0162 und der gemergte S1-Vertrag bleiben erhalten. Nichts fachfremdes wurde überschrieben.

Historischer gegateter Head vor diesem Sync: `c1ccfb6e`. Das ist kein aktuelles Exact-Head-Gate.

## Scope-Ergebnis

| Regel | Ergebnis |
| --- | --- |
| Gruppen | Aktiv / Kommend / Vergangen / Ohne Datum aus `startDate`/`endDate` |
| Kalendertag | Geräte-Kalendertag, gemeinsame Prädikate mit der Übersicht |
| Ohne Datum | niemals Vergangen |
| Empty-Gruppe | Text, kein `role=alert` |
| Error ≠ Empty | unverändert in `KontoReisen` |
| Limit 200 | fail-closed Hinweis, wenn die geladene Liste die Grenze erreicht |
| Suche | Titel und Herkunft, nur auf der geladenen Auswahl |
| Archiv | kein Write, kein Filter |
| Gast | unverändert `GastReisen` |

## Shared Contracts unverändert

Auth, RLS, `trips.status`, Guest→Account, Traveller, Privacy, Billing, Admin, Provider.

## Offene Risiken

- Bereits gespeichertes `archived` bleibt in der Datumsgruppe sichtbar; Archiv-UX ist AP-4.
- 200 ist last-updated, keine vollständige Inventur und kein Count.
- Erster Client-Paint ist ungruppiert, bis der Geräte-Kalendertag da ist.

## Nächster Schritt

Lokale und remote Exact-Head-Gates auf dem neuen current-main-integrierten Head, danach STOPP für unabhängigen Technical-Lead-Re-Review.  
Kein AP-4. Kein Mark Ready. Kein Merge.
