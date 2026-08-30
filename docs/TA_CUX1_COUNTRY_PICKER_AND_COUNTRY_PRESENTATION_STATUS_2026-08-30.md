# TA-CUX1 – Implementation Status

Stand: 30. August 2026  
Status: **IMPLEMENTATION COMPLETE / EXACT-HEAD CI+VERCEL GREEN / STOP FÜR UNABHÄNGIGEN TL-REVIEW**  
Cursor-Agent: `Account plattform audit vorbereitung 21`  
Task: `docs/TA_CUX1_COUNTRY_PICKER_AND_COUNTRY_PRESENTATION_TASK_2026-08-30.md`  
Baseline: `main @ 7b85e683f39cf42762cac5b6aa7a8eb45b2728db`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/234  
Implementation Head: `aafc1464c0c09f5e61a1249db8edcc5fa114fec9`  
Overflow-Fix Head: `7d802c72686ecf223cda9b810d9f6e658ce23e95`  
Evidence Head: `7f31ac107b2184556a2519fe836fd45126a4ffc2`

## Geliefert

- Shared Country Foundation: `lib/country/katalog.ts`, `lib/country/darstellung.ts`, `lib/country/copy.ts`, `lib/country/land-feld.ts`
- Shared Control: `components/country/LandFeld.tsx` — natives `<select>` plus Namensfilter
- Account Registry `/account/travellers`: Wohnsitz, Citizenship add/list, Issuer, Document↔Citizenship-Labels
- Trip Workspace `Reisevorbereitung`: Citizenship-Zeilen, Residence, Issuer, Relation-Labels, Read-only- und Readiness-Country-Presentation
- Focused Tests + bestehende Gates
- Slice-ADR, dieser Status, Self-Review, Handoff

## Control-Entscheidung

Keine Custom-Combobox. Der vorhandene Stack hat kein robustes Combobox-Primitive. Das native Select bleibt der Werte-Control; die Filterzeile ist `role="searchbox"` und verhindert Enter-Submit. Tastatur/Screenreader/Touch kommen vom nativen Select. Kein `touch-pan-x`.

## Nicht geliefert / bewusst ausserhalb

- Migration, Schema, RLS, Grant, Ownership, Supabase-Mutation
- Auth / MFA / AAL
- Änderung der gespeicherten Country-Code-Feldsemantik
- Default-/Primary-/Preferred-/Chosen-Credential oder Defaultland
- Visa / Einreise / Transit / Boarding / Best-Pass
- neue npm-Abhängigkeit, voller i18n-Rollout, neue Country-Tabelle
- globale Continuity-Dateien (`JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, TL-Checkpoints)

## Lokale Gates

Auf Implementation Head `aafc1464` und nach Overflow-Fix `7d802c72` wiederholt, soweit unten markiert:

- `npm test` **2759/2759** pass
- `npm run typecheck` pass
- `npm run lint` 0 errors / 135 vorhandene Warnings
- Hygiene: `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` pass
- `npm run build` pass
- `npm run audit:account` **48/48** grün
- Fokussierte Chromium-Verifikation der Reisevorbereitung: Schweiz/Serbien sichtbar, keine `ISO-2`-Labels, 4 Searchboxes, kein `touch-pan-x`
- Erster `audit:trip-workspace`: 4/1018 rot wegen `Seiten-Overflow 289>280` in Vorbereitung mit mehreren Citizenships/Reisenden
- Overflow-Fix: `min-w-0` am LandFeld, Citizenship-Zeilen gestapelt
- 280px-Recheck der beiden zuvor roten Fixtures: `scrollWidth === 280`
- Zweiter `audit:trip-workspace` auf `7d802c72`: **1017/1018**. Die 280px-Vorbereitung-Overflows sind weg. Verbleibend: WebKit `1280-tabwechsel` «Fokusziel unter klebender Kopfzeile» nach Mobilität — kein Country-Feld, kein ISO-2, kein LandFeld. Nicht als TA-CUX1-Regression behandelt; nicht in diesem Slice repariert.

## CI / Vercel auf `7f31ac10`

- GitHub Actions CI #1323 / Run `33285896324` = **SUCCESS** auf exact `7f31ac107b2184556a2519fe836fd45126a4ffc2`
- Vercel Preview: **SUCCESS** / Deployment `B5DnsqWF5vVUdYZL2LrbSjg63cfJ`
- Vorgänger: `a5cf4193` CI #1322 / Vercel `7EnN9EACJrtSJuJMcxH1CiiWmMsT` SUCCESS; Overflow-Fix `7d802c72` CI #1319 SUCCESS

Kein weiterer Evidence-Stamp durch diesen Agenten. Der Reviewer prüft CI/Vercel live am dann aktuellen exact Head.

## Nächster Schritt

Unabhängiger Technical-Lead-Review. PR bleibt Draft. Kein Ready, kein Merge, kein Folgeslice.
