# TA-DL1 – Document Lifecycle Handoff

Stand: 30. August 2026  
Status: **LOKALE GATES GRÜN / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Cursor-Agent: `Account plattform audit vorbereitung 19`

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/227 |
| Branch | `feat/ta-dl1-document-lifecycle-trip-date-awareness-2026-08-30` |
| Baseline | `main @ 0ac7296fbd9e348b05a30b4c43cd5fe1815e24d9` |
| Issue | #226 |
| Cloud-Run | https://cursor.com/agents/bc-23223c5d-1f12-447a-b02b-26054bfc666e` |
| Exact Head | der Commit dieses Stamps; live am PR prüfen |

## Wahrheit

Account Registry zeigt nur, ob ein gespeichertes Ablaufdatum vor dem heutigen Kalendertag liegt.  
Trip Workspace zeigt nur, ob das Ablaufdatum vor Reisebeginn, während der Reise oder nicht vor Reiseende liegt.  
Beides ist Metadatenvergleich, keine Zulässigkeit.

## Lokale Gates

- Tests 2738/2738
- Typecheck / Lint 0 / Hygiene / Production-Build pass

Exact-Head CI/Vercel nicht vorab behauptet.

## Review protocol

1. Exact Head / Diff / Merge-Base gegen Baseline `0ac7296f` prüfen.
2. Helper-Grenzen, unabhängige Dokumente und Copy-Vertrag reviewen.
3. GitHub Actions + Vercel Preview auf dem exact head prüfen.
4. PASS nur durch unabhängigen Technical Lead. Cursor markiert nicht Ready und merged nicht.

## Nächster Schritt

Unabhängiger Technical-Lead-Review. Kein Folgeslice.
