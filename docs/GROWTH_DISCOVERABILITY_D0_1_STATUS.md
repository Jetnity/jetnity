# Jetnity – D0-1 Index Boundary Contract – Status

Stand: 25. August 2026  
Status: **P2-D0-1-TL-01 geschlossen / STOPP für erneuten unabhängigen ChatGPT-/Technical-Lead-Review**

Agent: `Jetnity growth discoverability`  
Branch: `fix/d0-1-index-boundary-contract`  
Draft-PR: #70  
Task: `docs/GROWTH_DISCOVERABILITY_D0_1_TASK.md`

Kein Ready. Kein Merge. Kein D0-2/G0-1/D1/G1+.

## 1. Live-Baseline

`main @ 2bb6b8072fa04e8f6db2d989b84ada7b64745fd9`

Merge-Base gegen `origin/main` = diese Baseline. Behind: 0.

Geprüfter TL-Head: `e6b5e58f7ab4976c900e05363a84d347600feb01`  
Ergebnis: **CHANGES REQUIRED**. Review: `PRR_kwDOPM7Rz88AAAABK3ZUfA`.

Presence-Fix-Runtime: `480834e143a8f00cfbb954031cde48e4174e3a20`

Parallele offene Drafts, nicht in diesem Slice: #52, #50, #40, #39, #28.

PR bleibt Draft. Inline-Review-Threads: 0. Ein PR-Review-Kommentar (CHANGES REQUIRED) bleibt offen, bis der Technical Lead erneut prüft.

## 2. Root Cause von P2-D0-1-TL-01

Der verbindliche Task verlangt `noindex`, sobald ein von `/planen` akzeptierter Nutzer-/Intent-Parameter **vorhanden** ist (`idee`, `ziel`, `zielId`).

`planenHatIndexRelevanteParams()` prüfte einen **nicht-leeren, getrimmten Wert**. Deshalb blieben parametrisierte URLs ohne Inhalt indexierbar:

- `/planen?idee=`
- `/planen?idee`
- `/planen?idee=%20`
- `/planen?ziel=`
- `/planen?zielId=`

Die Tests schrieben dieses abweichende Verhalten fest. Die erste HTML-Evidence meldete `/planen?idee=` fälschlich als Basis.

Kein neuer Shared Contract. Nur die D0-1-Index-Grenze für akzeptierte Keys.

## 3. Korrektur

`lib/seo/index-grenze.ts`: Relevanz über `Object.hasOwn(searchParams, name)` auf `PLANEN_INDEX_PARAMS`.

- `{}` / fehlende Keys / unbekannte Params allein → keine eigene robots-Meta, öffentliche Basis
- vorhandener Key `idee` / `ziel` / `zielId` → `noindex, nofollow`, unabhängig von leer / whitespace / Wert / Array
- `app/(public)/planen/page.tsx` UI/`ersterWert`/Übernahme unverändert
- `/reisen`, Sitemap, robots, Admin, Unauthorized unverändert

## 4. Regressionstests

`lib/seo/index-grenze.test.ts` und `lib/seo/robots-regeln.test.ts` – 19/19:

- `{}` → Basis
- `{ idee: '' }` → noindex
- `{ idee: '   ' }` → noindex
- `{ idee: 'Bali' }` → noindex
- `{ ziel: '' }` → noindex
- `{ zielId: '' }` → noindex
- Array-Variante eines akzeptierten Keys → noindex
- unbekannter Param allein → Basis
- `/reisen` / Sitemap / robots / Admin / Unauthorized bleiben grün

`npm test` vollständig: **2013/2013**.

## 5. Lokale Production-Build-HTML-Evidence

`next start` auf `http://127.0.0.1:3010` nach Rebuild von `480834e1`:

| Route | robots |
| --- | --- |
| `/planen` | `index, follow` |
| `/planen?idee=` | `noindex, nofollow` |
| `/planen?idee=%20` | `noindex, nofollow` |
| `/planen?idee=Bali+mit+Pass+CH` | `noindex, nofollow` |
| `/planen?idee` | `noindex, nofollow` |
| `/planen?ziel=` | `noindex, nofollow` |
| `/reisen` | `noindex, nofollow` |

Artefakt: `/opt/cursor/artifacts/d01_presence_html/`.

## 6. Lokale Gates auf Presence-Fix `480834e1`

| Command | Ergebnis |
| --- | --- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0, keine Warnings |
| `npm test` | 0, **2013/2013** |
| `npm run check:setup:ci` | 0, 1 bekannte Warning: keine lokale `.env` |
| `npm run check:dead` | 0 |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0; 12/12 |
| `npm run check:schema-bezug` | 0 |
| `npm run build` | 0 |

## 7. Exact-Head vor diesem Persist

Runtime/Presence-Fix `480834e1` ist gepusht. Dieser Status-Commit ändert den Branch-Head. Technical Lead prüft den dann aktuellen HEAD live (Actions + Vercel).

Vorheriger TL-geprüfter Head `e6b5e58f`: Actions `32895279409` SUCCESS, Vercel `Dz26HiqFhnxg545LZBdp9YpCVywA` READY, Ahead/Behind damals 6/0.

## 8. Geschlossene vs. offene Findings

Durch D0-1 (Index-Boundary) plus TL-Korrektur:

- D0-P1-01
- D0-P1-02
- D0-P2-03
- **P2-D0-1-TL-01** (Presence-Contract)

Bewusst offen, nicht in diesem Slice:

- **D0-P1-03** – `/privacy` und `/terms` sind 404; keine Texte erfinden
- D0-P2-01 – deny-all wirbt weiter Sitemap/Host
- D0-P2-02 – Canonical / `APP_URL` vs `SITE_URL`
- D0-P2-04 – hreflang / Locale
- D0-P2-05 – JSON-LD Foundation
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02

## 9. Runtime / DB / Kosten / Security

Keine DB-/Migration-/RLS-/Auth-/Traveller-/Route-/Provider-/Payment-/Secret-/paid-call-Änderung. Kein Tracking. Keine neuen Kosten.

## 10. Nächster Schritt

**STOPP.**

ChatGPT / Technical Lead führt erneut den vollständigen unabhängigen Review von Anfang an.

Kein Ready. Kein Merge. Kein nächster Slice aus diesem Auftrag.
