# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R10-Merge-Blocker 20–23 sind auf Runtime `fdcc5c88` geschlossen. Der unabhängige R11-Closure-Review steht noch aus.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R10 Review: `docs/PR38_CHATGPT_R10_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`  
Multi-Agent-Folgeentscheidung: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R10-Runtime-Gate: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- Runtime-Head R10-Fixes: `fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072`
- R9-Runtime-Head: `263c2f842d2287da652b27cc9660c28db68c6750`
- Sync beim R10-Runtime-Gate: **0 behind** `origin/main`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R10-Blocker 20–23 implementiert und auf Exact-Head `fdcc5c88` gegatet. Noch kein Closure/PASS – R11 offen.**

20. Intra-Itinerary-Leg-Chronologie nutzt eindeutige Segmentzeiten als Source of Truth. Umgekehrt gespeicherte Legs erzeugen keinen falschen TH-Origin.
21. Route-Fingerprints sind `route-v2` und unterscheiden Surface-Change (`~`) von kontinuierlichem Segmentkontakt (`>`). Fehlende IATA ist unknown, nicht gleich.
22. `airportChange=true` nur bei zwei bekannten, verschiedenen IATA. Lokale Uhrzeiten erzeugen keine Cross-Airport-Dauer.
23. Readiness-Fingerprints sind `v4|sha256:…` über kanonisches JSON inklusive aufgelöster Dokument-Citizenship. v2/v3 werden stale.

Blocker 1–19 bleiben geschlossen. PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Exact-Head-Evidence des Runtime-Heads `fdcc5c88`

Lokal und remote auf exakt `fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072` verifiziert:

- `npm test` **1631/1631**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports (`AUDIT_PORT=3488`)
- DB: Rechte 51, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions Run `32661394335`: **SUCCESS**
- Vercel Preview: **SUCCESS** auf `https://vercel.com/jetnity-e1b93c82/jetnity-app/6hAk5DvrcSz8BTnsQQfSrKuaKjFd`

R9-Gate auf `263c2f84` bleibt historische Evidence und ersetzt R10 nicht.

## 5. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine neue Seasonal-Migration
- `seasonalProviderAus()` bleibt `null`
- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Mark Ready / Merge / Production-Schritt

## 6. Exakter nächster Schritt

Unabhängiger ChatGPT-Re-Review **R11** nach Stop-Kriterium.

Wenn R11 keinen weiteren konkreten relevanten Truth-/Security-/Provider-/SoT-/Cross-Domain-/Release-Defekt findet: technisches Closure/PASS. Keine künstliche Verlängerung.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 7. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R10_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CURSOR_REVIEW_FIXES.md`
4. `lib/route/chronologie.ts`
5. `lib/route/ableitung.ts`
6. `lib/route/pfad.ts`
7. `lib/route/fingerprint.ts`
8. `lib/route/verbindung.ts`
9. `lib/readiness/fingerprint.ts`
10. `lib/readiness/traveller-kontext.ts`
11. `lib/readiness/kontext.ts`
12. `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 8. Verbindliche Folgeentscheidung – Multi-Agent-Entwicklungsteam

Nach technischem Closure/PASS von PR #38 wird Jetnity kontrolliert auf ein Multi-Agent-Entwicklungsteam umgestellt. Verbindliche Policy: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`.

Grundprinzip:

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

Vor dem ersten parallelen Implementierungsblock werden Workstream-/Agent-Übersicht, Ownership-Matrix, Branch-/PR-Trennung, Allowed/Forbidden Touch Areas, Abhängigkeiten, Integrationsreihenfolge, Handoff- und Review-Regeln im Repository angelegt. Zunächst sollen ungefähr **2–3 Cursor-Agenten** kontrolliert parallel starten. Gemeinsame Truth-/Security-/Persistenz-Contracts werden nicht unkoordiniert von mehreren Agenten gleichzeitig verändert.

Die Teamstruktur und jeder Workstream-Status müssen repository-basiert rekonstruierbar sein, damit ein Chatwechsel keinen organisatorischen oder technischen Wissensverlust verursacht.
