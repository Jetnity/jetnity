# Jetnity Account AP-3 – Status

Stand: 24. August 2026  
Status: **auf `main` `78192ab` synchronisiert und auf Exact Head `c5e4a51f` gegatet – Draft, kein Ready, kein Merge, kein AP-4**

| Feld | Wert |
| --- | --- |
| Cursor-Anzeigename | **Account plattform audit vorbereitung** |
| Branch | `feat/account-ap3` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/53 |
| Base | `main` @ `78192ab775165d08bb357140c2d04b865b8cc049` |
| Auftrag | `docs/ACCOUNT_AP3_TASK.md` |
| **Gegateter Head** | `c5e4a51feff80b94b9bb9b153ee5211d49fa4375` |
| Entscheidung | ADR-0160 (nicht ADR-0158; das bleibt Admin Slice A. ADR-0162 bleibt Admin Slice C) |
| Self-Review | `docs/ACCOUNT_AP3_SELF_REVIEW.md` |

## Current-Main-Sync nach Admin Slice C

PR #49 / Admin Slice C liegt auf `main` `78192ab`. AP-3 wurde darauf rebased. Merge-Base ist genau dieser Commit.

Runtime-Scope unverändert gegenüber dem letzten gegateten Stand auf `e3bad749`:

- ableitende Gruppen Aktiv / Kommend / Vergangen / Ohne Datum
- fail-closed 200er-Hinweis
- kein Archiv-Write, keine Pagination-Architektur, keine neue Funktionalität

Admin Slice C / ADR-0162 und der gemergte S1-Vertrag bleiben erhalten. Nichts fachfremdes wurde überschrieben.

## Remote-Gates auf dem gegateten Head

Genau `c5e4a51feff80b94b9bb9b153ee5211d49fa4375`:

- GitHub Actions CI: **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/32766099353
- Vercel Preview: **success / READY** – https://vercel.com/jetnity-e1b93c82/jetnity-app/62QioKqqL8rwXBHmxLrnXFqAck7j
- Preview-URL: https://jetnity-f4zxs1cp6-jetnity-e1b93c82.vercel.app

Ein späterer Docs-only-Commit ist kein neues Runtime-Gate.

Historischer gegateter Head vor diesem Sync: `c1ccfb6e`. Das ist kein aktuelles Exact-Head-Gate.

## Lokale Gates auf dem gegateten Head

Genau `c5e4a51feff80b94b9bb9b153ee5211d49fa4375`:

- `npm test`: 1870/1870 grün
- Typecheck, Lint, Hygiene (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz` 12 Admin-Routen, `check:schema-bezug`): grün
- `auth:pruefen` (55 Werte): grün
- Production-Build: grün

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

Unabhängiger Technical-Lead-Re-Review von Draft-PR #53 auf `c5e4a51f`.  
STOPP. Kein AP-4. Kein Mark Ready. Kein Merge.
