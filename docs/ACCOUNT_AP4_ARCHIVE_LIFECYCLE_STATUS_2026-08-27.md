# Jetnity – AP-4 Account Archive Lifecycle – Status

Stand: 27. August 2026  
Status: **TECHNICAL-LEAD CHANGES REQUIRED GESCHLOSSEN / EXACT-HEAD GATES GRÜN AUF `d9e35bb6` / DRAFT / KEIN READY / KEIN MERGE DURCH AUTOR-AGENT**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 3`**  
Branch: `cursor/ap4-account-archive-lifecycle-67d4`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/108

> Live-Evidence gewinnt. Assignment-SHAs sind historische Evidence.

## 1. Live-Start

| Feld | Wert |
| --- | --- |
| Verifizierter `origin/main` vor erstem Edit | `4f630ff41b3529dadc0bfd8984d3afc02b1c4efb` – `docs: record AP-4 start gate` |
| Branch-Basis | genau dieser Live-`main`, nicht PR #39/#107 |
| Offene parallele Runtime-PRs | keine AP-4-Kollision; offene Drafts #88/#52/#50/#40/#39/#28 historisch/fremd |

## 2. Runtime

- Archivieren/Wiederherstellen nur für Konto-Reisen über `reiseArchivLebenszyklus`.
- Aktiv/Kommend/Vergangen/Ohne Datum enthalten keine archivierten Reisen.
- `/reisen` hat einen eigenen Abschnitt **Archiv**.
- Restore nutzt nur gültiges `metadata.account_archive.previous_status`.
- Restore entfernt nur `previous_status`; bestehende Geschwister unter `account_archive` bleiben.
- Historische `archived`-Reise ohne Provenienz: fail-closed.
- Optimistic Guard `.eq('status', expectedStatus)` **und** `.eq('updated_at', gelesene Version)`.
- Keine AP-4-eigene 8-KB-Grenze für `trips.metadata`.
- Kein Service Role, kein `user_id` aus der Nutzlast.
- Keine Migration, keine RLS-/Auth-/AAL-Änderung.
- Gast-Reisen ohne Archiv.
- TW7-A `TripSummary.stages` / `reiseOrte()` / `stageCount` / `itemCount` unverändert.
- Follow-up nach erstem Exact-Head-PASS: Client-Action-State wird nach Erfolg und Statuswechsel zurückgesetzt, damit `router.refresh()` den Knopf nicht disabled stehen lässt.

## 3. Gegateter Head `954b0c751e5b662985119e26d0c49acbd9d0b82f`

Genau dieser SHA, vor dem Action-State-Follow-up:

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions | Run `33108364497` **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/33108364497 |
| Typecheck, Lint & Build | SUCCESS |
| Auth-Konfiguration | SUCCESS |
| Vercel Preview | Deployment `6129580583` / Inspector `C6s9zyHZV9owevNEXH1Rie2t96rH` **READY** auf demselben SHA |
| Preview-URL | https://jetnity-al2al1tbk-jetnity-e1b93c82.vercel.app |
| Review-Threads | 0 |
| Reviews | keine |

Lokale Gates auf demselben Stand vor dem Follow-up: `npm test` 2364/2364, Typecheck, Lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, Production Build – alle grün. Historischer Fail auf `486f44b5` war `check:exports` (`istWiederherstellbarerStatus`) und ist auf `954b0c75` geschlossen.

## 3b. Aktueller Exact Head `f19b5711e05282617d7c35262ebbfaeef4253e0d`

Follow-up inkl. Action-State-Reset und Continuity, genau dieser SHA:

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions | Run `33108697812` **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/33108697812 |
| Vercel Preview | Deployment `6129645873` / Inspector `BiQYRdySrHjnea8MmTbxqSomsCMQ` **READY** auf demselben SHA |
| Preview-URL | https://jetnity-r859131ln-jetnity-e1b93c82.vercel.app |
| Review-Threads | 0 |

Ein späterer Continuity-only-Commit muss live neu geprüft werden.

## 3c. Technical-Lead Review `e34d5829` – CHANGES REQUIRED

Review: https://github.com/Jetnity/jetnity/pull/108#pullrequestreview-5045022530

| Finding | Fix |
| --- | --- |
| P1-AP4-TL-01 Restore löschte den ganzen `account_archive`-Namespace | nur `previous_status` entfernen; Geschwister behalten |
| P1-AP4-TL-02 Status-only Guard konnte fremde Metadata überschreiben | Write zusätzlich gegen gelesenes `updated_at` |
| P2-AP4-TL-03 erfundene 8-KB-Grenze für `trips.metadata` | entfernt; kein `metadata-zu-gross` |

Der status-only Guard ist **kein** akzeptiertes Restrisiko mehr.

## 3d. Review-Fix Exact Head `d9e35bb66ed51e7861107872c6c96b1edb989106`

Runtime-Fixes plus Continuity, genau dieser SHA:

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions | Run `33110692991` **SUCCESS** – https://github.com/Jetnity/jetnity/actions/runs/33110692991 |
| Typecheck, Lint & Build | SUCCESS |
| Auth-Konfiguration | SUCCESS |
| Vercel Preview | Deployment `6130005583` / Inspector `2EtoM6gGvaEpJwWhFRGj25S8X42F` **READY** auf demselben SHA |
| Preview-URL | https://jetnity-d5woaiy7n-jetnity-e1b93c82.vercel.app |
| Live `origin/main` | unverändert `4f630ff41b3529dadc0bfd8984d3afc02b1c4efb` |
| PR | mergeable / CLEAN; nicht hinter der Startbaseline |
| Review-Threads | 0 |

Lokale Gates auf demselben SHA: `npm test` 2367/2367, Typecheck, Lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, Production Build – alle grün.

Ein späterer Continuity-only-Commit muss live neu geprüft werden.

## 4. Shared Contracts

Unverändert: Auth, RLS, Ownership, Guest→Account, Traveller, AAL2, Provider, Admin, Growth, TW-8.

## 5. Nächster Schritt

Unabhängiger Exact-Head-Finalreview durch ChatGPT / Technical Lead auf dem dann aktuellen PR-Head. Kein Ready. Kein Merge durch den Autor-Agenten.
