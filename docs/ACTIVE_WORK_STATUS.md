# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R9-Merge-Blocker 16–19 sind auf Runtime `263c2f84` geschlossen. Der nächste verbindliche Schritt ist der unabhängige R10-Closure-Review.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R9 Review: `docs/PR38_CHATGPT_R9_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R9-Gate: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R9-Runtime-Head: `263c2f842d2287da652b27cc9660c28db68c6750`
- Sync: **0 behind** `origin/main`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R9-Blocker 16–19 im Code geschlossen. Exact-Head-Gate auf `263c2f84` grün. Noch kein Closure/PASS – R10 steht aus.**

16. Airport-Change-/Segment-Origins bleiben in Pfad, Fingerprint und Kompaktanzeige.
17. Connections sind leg-aware mit globalen Segmentindizes; `FlugRoute` hängt Umstiege am richtigen Segment.
18. Chronologie ist nur bewiesen, wenn Item- und Segmentquellen eindeutig und widerspruchsfrei ordnen.
19. Readiness-Fingerprints sind `v3|sha256:…` über den vollen Kontext. Prefix-Truncation entfällt.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Review-Blocker 1–15 auf bisherigen Runtime-Heads
- R9-Blocker 16–19 auf `263c2f84`
- `seasonalProviderAus()` bleibt `null`
- keine Seasonal-DB-Migration, keine Secrets, keine neuen laufenden Kosten

## 5. Gerade offen

- unabhängiger ChatGPT-Re-Review **R10**
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. R9 Exact-Head-Gate auf `263c2f84`

Lokal und remote verifiziert:

- `npm test` **1614/1614**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions Run `32657741587`: **SUCCESS** auf exakt `263c2f842d2287da652b27cc9660c28db68c6750`
- Vercel Deployment: **READY** auf `https://vercel.com/jetnity-e1b93c82/jetnity-app/6SEMJak1nD6KxpJ5C6uib9VqE7pZ`
- Main `cd220beb`, Branch **0 behind**

Grüne Gates ersetzen den R10-Code-Review nicht.

## 7. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine neue Seasonal-Development-/Production-Migration
- `seasonalProviderAus()` bleibt `null`
- kein Live-Provider / Secret / neue laufende Kosten
- Blocker 19 bleibt innerhalb des 800-Zeichen-DB-Limits durch Digest

## 8. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- kein Mark Ready freigegeben
- keine Provider-/Kosten-/Secret-Freigabe
- keine DB-/Production-Migration freigegeben

## 9. Exakter nächster Schritt

Unabhängiger ChatGPT-Re-Review **R10** nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` auf Runtime `263c2f84`.

PASS nur, wenn R10 keinen weiteren konkreten merge-blocking Defekt findet.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 10. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R9_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CURSOR_REVIEW_FIXES.md`
4. `lib/route/pfad.ts`
5. `lib/route/verbindung.ts`
6. `lib/route/chronologie.ts`
7. `lib/route/anzeige.ts`
8. `components/trips/FlugRoute.tsx`
9. `lib/readiness/fingerprint.ts`
10. `lib/readiness/digest.ts`
