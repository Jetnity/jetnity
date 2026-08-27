# Jetnity – AP-4 Account Archive Lifecycle – Status

Stand: 27. August 2026  
Status: **RUNTIME IMPLEMENTIERT / DRAFT / KEIN READY / KEIN MERGE DURCH AUTOR-AGENT**  
Workstream: Account / Traveller  
Cursor-Agent: **`Account plattform audit vorbereitung 3`**  
Branch: `cursor/ap4-account-archive-lifecycle-67d4`

> Live-Evidence gewinnt. Start-SHAs in älteren Assignment-Zeilen sind historische Evidence.

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
- Historische `archived`-Reise ohne Provenienz: fail-closed.
- Optimistic Guard `.eq('status', expectedStatus)`.
- Kein Service Role, kein `user_id` aus der Nutzlast.
- Keine Migration, keine RLS-/Auth-/AAL-Änderung.
- Gast-Reisen ohne Archiv.
- TW7-A `TripSummary.stages` / `reiseOrte()` / `stageCount` / `itemCount` unverändert.

## 3. Gates

Lokale und Exact-Head-Gates werden nach dem Draft-PR auf dem jeweiligen Head dokumentiert. Kein Ready. Kein Merge.

## 4. Shared Contracts

Unverändert: Auth, RLS, Ownership, Guest→Account, Traveller, AAL2, Provider, Admin, Growth, TW-8.

## 5. Nächster Schritt

Unabhängiger Exact-Head-Finalreview durch ChatGPT / Technical Lead.
