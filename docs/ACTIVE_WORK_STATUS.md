# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R8-Merge-Blocker 14 und 15 sind auf Runtime `de83d026` geschlossen. Der unabhängige R9-Closure-Review ist **REQUEST CHANGES** mit Merge-Blockern 16–19.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R9 Review: `docs/PR38_CHATGPT_R9_REVIEW.md`  
R8 Review: `docs/PR38_CHATGPT_R8_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R9-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- geprüfter R9-Runtime-Head: `de83d0269e1910ef82a596dd6e7005001f1cb860`
- R8 Docs-lock vor R9: `0c0ba91ae2f231d564e96da1933487ce7b9f1652`
- Sync beim R9-Lock: **0 behind** `origin/main`
- PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 3. Status

**R8-Blocker 14/15 geschlossen. R9 findet Merge-Blocker 16–19. Noch kein Closure/PASS.**

16. **Segment-/Airport-Change-Topologie:** `pfadAusSegmenten()` und `routeKompakt()` verlieren weiterhin den Origin eines späteren Segments innerhalb desselben Legs. Bestehender Fall `ZRH→CDG`, danach `ORY→BKK` kann als `ZRH→CDG→BKK` erscheinen; ORY fehlt im Route-Fingerprint. Eine Änderung des Transfer-Abflughafens kann dadurch in Route-Change/Readiness unsichtbar bleiben.

17. **Connection-Leg-Zuordnung:** `RouteVerbindung` trägt nur leg-lokale Segmentindizes; nach `flatMap` ist die Zuordnung mehrdeutig. `FlugRoute.tsx` benutzt `umstiege[index]` gegen die flache Segmentliste. Bei Hinflug direkt + Rückflug mit Transit kann der Rückflug-Umstieg am Hinflugsegment erscheinen.

18. **Chronologie-Präzision:** Gleich grobe Item-Starts (`startsOn` gleich, `startsAt=null`) gelten derzeit als „bewiesen“. Segmentzeiten können die Reihenfolge beweisen, werden aber durch `T00:00` überdeckt; anschließend kann lexikographischer Pfad wieder den Origin bestimmen. Echte Ties/Widersprüche müssen fail-closed bleiben. Unbewiesene Chronologie darf auch in der Anzeige keine erfundene Reihenfolge behaupten.

19. **Readiness-Fingerprint-Truncation:** `readinessFingerprint()` schneidet den kanonischen Klartext nach 800 Zeichen ab. Mit leg-aware Route-Fingerprints und erlaubtem Multi-Citizenship/Multi-Document-Kontext können relevante Änderungen hinter Zeichen 800 liegen und denselben gespeicherten Fingerprint behalten. Alter `done`-Status kann dadurch fälschlich `current` bleiben. Der vollständige Kontext muss vor der Längenbegrenzung in eine kollisionsresistente Identität eingehen.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Bereits umgesetzt / bestätigt

- Seasonal Foundation-Runtime
- Review-Blocker 1–13 auf bisherigen Runtime-Heads
- R8-Blocker 14 und 15 auf `de83d026`
- Open-Jaw-/Multi-Leg-Country-Truth für die R8-Fälle
- Leg-aware Fingerprint/Anzeige für normale Leg-Grenzen
- `seasonalProviderAus()` bleibt `null`
- keine Seasonal-DB-Migration, keine Secrets, keine neuen laufenden Kosten

## 5. Gerade offen

- Blocker 16: Airport-Change-/Segment-Origin vollständig erhalten
- Blocker 17: Connections eindeutig an Leg/Segment binden
- Blocker 18: präzisions-/konfliktbewusste Route-Chronologie + unknown UI
- Blocker 19: Readiness-Fingerprint ohne Prefix-Truncation
- danach neues Exact-Head-Gate und unabhängiger R10-Review
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. R8 Exact-Head-Gate auf `de83d026`

Unabhängig remote verifiziert:

- `npm test` laut Gate **1593/1593**
- Typecheck / Lint / Hygiene laut Gate grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions Run `32654092944`: **SUCCESS** auf exakt `de83d0269e1910ef82a596dd6e7005001f1cb860`
- Vercel Deployment `dpl_F9g6B69cw1B12Q2YRK2oyoC9okTE`: **READY** auf exakt `de83d026...`
- Main beim Lock `cd220beb`, Branch **0 behind**

R8 Docs-lock `0c0ba91a...` ist genau ein nachfolgender Dokumentations-Commit:

- GitHub Actions Run `32654883182`: **SUCCESS**
- Vercel Deployment `dpl_9gvqqM2Uqnw5qvQzaZ1nsVBmxVGi`: **READY**

Grüne Gates ersetzen den R9-Code-Review nicht.

## 7. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine neue Seasonal-Development-/Production-Migration
- `seasonalProviderAus()` bleibt `null`
- kein Live-Provider / Secret / neue laufende Kosten
- Blocker 19 soll vorzugsweise innerhalb des bestehenden 800-Zeichen-DB-Limits durch vollständige kanonische Identität + Digest gelöst werden; keine Production-Migration ohne separate Freigabe

## 8. Offene Nutzerentscheidungen / Freigaben

- keine Merge-Freigabe
- kein Mark Ready freigegeben
- keine Provider-/Kosten-/Secret-Freigabe
- keine DB-/Production-Migration freigegeben

## 9. Exakter nächster Schritt

Cursor schließt **R9-Blocker 16–19 gemeinsam** inklusive aller Pflicht-Regressionen aus `docs/PR38_CHATGPT_R9_REVIEW.md`.

Danach vollständiges Exact-Head-Gate auf dem neuen Runtime-SHA, genau ein Docs-Lock und unabhängiger ChatGPT-R10-Review nach Stop-Kriterium.

PASS nur, wenn R10 keinen weiteren konkreten merge-blocking Defekt findet.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 10. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R9_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CURSOR_REVIEW_FIXES.md`
4. `lib/route/pfad.ts`
5. `lib/route/fingerprint.ts`
6. `lib/route/anzeige.ts`
7. `lib/route/verbindung.ts`
8. `lib/route/chronologie.ts`
9. `lib/route/ableitung.ts`
10. `components/trips/FlugRoute.tsx`
11. `lib/readiness/fingerprint.ts`
12. `lib/readiness/status.ts`
13. `lib/readiness/traveller-kontext.ts`
