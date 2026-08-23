# Jetnity – Active Work Status

Stand: 24. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R11-Merge-Blocker 24–26 sind auf Runtime `ba5bcd76` implementiert und auf exaktem Runtime-Head gegated. Der unabhängige R12-Closure-Review ist abgeschlossen und ergibt **REQUEST CHANGES** wegen eines neuen konkreten Route-Truth-Restdefekts: **R12-Blocker 27**.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R11 Review: `docs/PR38_CHATGPT_R11_REVIEW.md`  
R12 Review: `docs/PR38_CHATGPT_R12_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`  
Multi-Agent-Folgeentscheidung: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R12-Review: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R11-Runtime-Head: `ba5bcd7634eb3a561c54eb1eb63908fe43fcd71b`
- R10-Runtime-Head: `fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072`
- R11-Docs-Lock vor R12: `f4f2fbd5bf89438ae0ccb6999eb0baa2c536e72f`
- R12-Review-Dokument: `2e0cef13e29b22a0a1a4b1c6c1c1ee40d5216470`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R12 = REQUEST CHANGES. R11-Fixes 24–26 bleiben substanziell geschlossen; R12-Blocker 27 ist offen. Noch kein technisches Closure/PASS.**

R11-Fixes 24–26:

24. Airport-lokale Uhren vergleichen nicht mehr pauschal cross-airport; same-IATA bzw. konservativ sichere Kalenderabstände bleiben vergleichbar. Date-Line-/Same-Day-Fälle sind fail-closed bzw. topologisch abgesichert.
25. Eindeutig kontinuierliche Segmentketten innerhalb eines Legs werden kanonisiert; Zyklen und fehlende IATA sind als fail-closed Regressionen vorhanden.
26. Bei bewiesener Chronologie ist `RouteFacts.destination` das letzte Segment der letzten kanonischen Itinerary. `airportContacts` wird nun ebenfalls aus derselben kanonischen `wahrheit` abgeleitet.

### R12-Blocker 27 – bekannte IATA-Codes beweisen keine Segmentreihenfolge

In `lib/route/chronologie.ts` fällt `segmenteOrdnungBewiesen()` bei **null** vollständigen kontinuierlichen Pfaden auf `alleIataBekannt(segmente)` zurück. Damit kann eine vollständig mit IATA-Codes versehene, aber semantisch nicht rekonstruierbare Segmentmenge trotzdem `chronologieBewiesen=true` erzeugen.

Das ist unzulässig: bekannte Airport-Codes identifizieren Endpunkte, beweisen aber nicht die Reihenfolge. Dadurch können untrusted Array-Nachbarschaften zu falschem Origin/Destination, Country-Rollen, Connections/Airport-Changes, Fingerprint und damit Readiness/Safety/Seasonal-Truth werden.

Verbindliche Details und Pflicht-Regressionen stehen in `docs/PR38_CHATGPT_R12_REVIEW.md`.

R10-Fixes 20–23 und die früheren Blocker bleiben geschlossen, soweit R12 sie geprüft hat. R12 eröffnet keine Provider-/DB-/Secret-/Kostenanforderung.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Exact-Head-Evidence des geprüften Runtime-Heads

Auf exakt `ba5bcd7634eb3a561c54eb1eb63908fe43fcd71b` unabhängig bestätigt:

- Cursor dokumentiert `npm test` **1655/1655** sowie gezielte Route/Seasonal/Safety/Readiness-Regressions **368/368**.
- Cursor dokumentiert Typecheck / Lint / Hygiene grün.
- Cursor dokumentiert Production-Build Exit 0 und `/api/seasonal/evaluate` enthalten.
- Cursor dokumentiert UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports.
- Cursor dokumentiert DB: Rechte 51, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**.
- GitHub Actions Run `32665395877`: **SUCCESS** auf exakt `ba5bcd7634eb3a561c54eb1eb63908fe43fcd71b`.
- Vercel Deployment `dpl_7zWojxDr6ThXiAM2Yb9oNp3KoQ5n`: **READY** mit `githubCommitSha=ba5bcd7634eb3a561c54eb1eb63908fe43fcd71b`.
- Main bleibt `cd220beb44d90ae376feeb8de9db8a3afb808d60`.

Diese grünen Gates belegen den R11-Runtime-Stand, schließen Blocker 27 aber nicht.

## 5. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine neue Seasonal-Migration
- `seasonalProviderAus()` bleibt `null`
- keine neuen Secrets
- keine neuen Service-Role-Pfade
- keine neuen laufenden Kosten
- kein Mark Ready / Merge / Production-Schritt

## 6. Exakter nächster Schritt

Der aktuelle Seasonal-Cursor-Agent soll **nur R12-Blocker 27 kohärent schließen**:

1. den pauschalen `alleIataBekannt(segmente)`-Fallback als Reihenfolgebeweis beseitigen bzw. durch belastbare Sequence-/Surface-Evidence ersetzen;
2. echte Surface-/Airport-Change-Fälle weiterhin korrekt unterstützen;
3. unbekannte Segmentreihenfolge fail-closed halten, ohne Cross-Airport-Wanduhren wieder zur absoluten Chronologie zu machen;
4. die Pflicht-Regressionen aus `docs/PR38_CHATGPT_R12_REVIEW.md` ergänzen;
5. adversariellen Self-Review durchführen;
6. vollständigen Exact-Head-Gate auf dem neuen Runtime-Head durchführen und dokumentieren.

Danach folgt unabhängiger ChatGPT **R13**. Wenn R13 nach ausreichend tiefer Prüfung keinen neuen konkreten relevanten Truth-/Security-/Provider-/SoT-/Cross-Domain-/Release-Defekt findet, gilt das verbindliche Stop-Kriterium: technisches Closure/PASS dokumentieren und Review-Schleife beenden.

PR bleibt bis zur ausdrücklichen Product-Owner-Freigabe Draft. Kein Mark Ready. Kein Merge.

## 7. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R12_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CHATGPT_R11_REVIEW.md`
4. `docs/PR38_CURSOR_REVIEW_FIXES.md`
5. `lib/route/chronologie.ts`
6. `lib/route/ableitung.ts`
7. `lib/route/verbindung.ts`
8. `lib/route/laender.ts`
9. `lib/route/fingerprint.ts`
10. `lib/route/r11-chronologie.test.ts`
11. `lib/readiness/kontext.ts`
12. `lib/seasonal/kontext.ts`
13. `lib/safety/kontext.ts`
14. `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 8. Multi-Agent-Entwicklungsteam

Account-/Admin-Audits dürfen parallel als Analyse-/Vorbereitungsworkstreams laufen. Gemeinsame Auth/RLS/DB/Traveller-/Route-/Readiness-/Safety-/Seasonal-Contracts bleiben bis zur koordinierten Integrationsfreigabe geschützt.

Grundprinzip:

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

Der bekannte Account-Cursor-Anzeigename lautet exakt `Account platform audit vorbereitung`. Der vollständige Anzeigename des Seasonal-Cursor-Agenten ist in den vorliegenden Screenshots weiterhin nur abgeschnitten sichtbar und wird deshalb nicht erfunden.

## 9. Agent-Handoff dieser Review-Session

- Seasonal-Cursor-Anzeigename: vollständiger Name derzeit nicht sicher bekannt; UI zeigt abgeschnitten `Reisezeitpunkt saisonale intellig...`.
- Branch/PR/geprüfter Runtime-Head: `feat/travel-timing-seasonal-intelligence` / `#38` / `ba5bcd76`.
- R12 erledigt: R11 24–26 unabhängig gegengeprüft; CI/Vercel exact runtime head bestätigt; Provider-Scope bestätigt; neuer Blocker 27 dokumentiert.
- Offen: Blocker 27 Runtime-Fix, Regressionen, Exact-Head-Gate, danach R13.
- Nicht freigegeben: Mark Ready, Merge, Production, Provider, Seasonal-DB/Migration, neue Secrets/Kosten.
- Exakter nächster Schritt: `docs/PR38_CHATGPT_R12_REVIEW.md` lesen und ausschließlich Blocker 27 gezielt schließen.
