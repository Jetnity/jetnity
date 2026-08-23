# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R10-Merge-Blocker 20–23 sind auf Runtime `fdcc5c88` in ihren geforderten Kernfällen geschlossen. Der unabhängige R11-Closure-Review hat jedoch drei konkrete Restdefekte gefunden: Blocker 24–26.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R10 Review: `docs/PR38_CHATGPT_R10_REVIEW.md`  
R11 Review: `docs/PR38_CHATGPT_R11_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`  
Multi-Agent-Folgeentscheidung: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R11-Runtime-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- letzter geprüfter Runtime-Head: `fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072`
- Cursor-Docs-Lock vor R11: `8f0aaa504f73100445df8e9387ad023fb22a8b7c`
- R11-Review-Doku: `a3827d12e396adc18e06ac17ebcf86c1ac8fc2fa`
- PR-Zustand beim R11-Lock: **open, mergeable, Draft, nicht gemergt**

## 3. Status

**REQUEST CHANGES – R11-Blocker 24–26 offen. Noch kein Closure/PASS.**

R10-Fixes 20–23 sind substanziell bestätigt:

- Reverse-Multi-Leg-Grundfälle erzeugen keinen falschen TH-Origin;
- `route-v2` unterscheidet `~` und `>`;
- Airport-Change-/Duration-Truth ist tri-state/fail-closed;
- Readiness v4 bindet die aufgelöste Dokument-Citizenship in kanonisches SHA-256 ein.

R11 findet:

24. **Cross-Airport-Chronologie aus Ortszeiten:** `departureDate/departureTime` sind laut Flight-Domain lokale Flughafenzeiten. `route/chronologie.ts` behandelt unterschiedliche lokale Datetimes dennoch als absolute Reihenfolge und kann z. B. bei International-Date-Line-/Same-Day-Multi-City-Fällen Legs oder Flight-Items falsch umsortieren.

25. **Segmentreihenfolge innerhalb eines Legs:** Das Schema validiert Segmentwerte, aber nicht die semantische `segments[]`-Reihenfolge. Ein umgekehrt gespeicherter Transit kann deshalb weiterhin als bewiesene Route Truth mit falschem Origin/Transit/Ziel und künstlichem Surface-Change erscheinen.

26. **Globales Route-Ende:** Bei mehreren chronologisch beweisbaren Flight-Items kommt `RouteFacts.destination` weiterhin aus dem Ende der ersten Itinerary statt aus dem Ende der letzten kanonischen Itinerary. Die singuläre Destination kann dadurch der eigenen `segments`-/Country-Truth widersprechen.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Exact-Head-Evidence des letzten Runtime-Heads

Auf exakt `fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072` unabhängig remote bestätigt:

- GitHub Actions Run `32661394335`: **SUCCESS**
- Vercel Deployment `dpl_6hAk5DvrcSz8BTnsQQfSrKuaKjFd`: **READY**, exact Git SHA `fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072`
- Cursor-Gate: `npm test` **1631/1631**, Typecheck/Lint/Hygiene grün, Build Exit 0, UI-Audit **1014/1014**, DB Rechte 51, RLS 0, Sicherheit **210/210**, Parallelität **7/7**

Docs-Head `8f0aaa50` separat verifiziert:

- GitHub Actions Run `32663261760`: **SUCCESS**
- Vercel `dpl_D3r4PnRCPFSyjuvJQsMp1dWLqJnx`: **READY**, exact Git SHA `8f0aaa504f73100445df8e9387ad023fb22a8b7c`
- Compare Runtime→Docs-Head: nur Dokumentationsdateien; die zusätzlichen Commits sind Multi-Agent-Policy-/Review-Dokumentation, kein neues Runtime-Gate.

Grüne Gates ersetzen R11 nicht.

## 5. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine neue Seasonal-Migration
- `seasonalProviderAus()` bleibt `null`
- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Mark Ready / Merge / Production-Schritt

## 6. Exakter nächster Schritt

Cursor soll R11-Blocker **24–26** als begrenzten Route-Chronology-/Canonical-End-Block schließen und danach einen eigenen adversariellen Self-Review machen.

Danach:

1. gezielte Regressionen für 24–26;
2. breite Route/Seasonal/Safety/Readiness-Regression;
3. kompletter lokaler Gate-Lauf;
4. GitHub Actions + Vercel auf exakt neuem Runtime-Head;
5. Docs-Lock ohne weitere Runtime-Änderung;
6. unabhängiger ChatGPT-Re-Review **R12**.

Für R12 gilt das Stop-Kriterium: Wenn kein weiterer konkreter relevanter Defekt gefunden wird, technisches **Closure/PASS**. Keine künstliche Verlängerung.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 7. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R11_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CURSOR_REVIEW_FIXES.md`
4. `lib/route/chronologie.ts`
5. `lib/route/schema.ts`
6. `lib/route/ableitung.ts`
7. `lib/route/verbindung.ts`
8. `lib/route/laender.ts`
9. `lib/route/pfad.ts`
10. `lib/route/fingerprint.ts`
11. `lib/flights/domain.ts`
12. `lib/flights/zeit.ts`
13. `lib/readiness/kontext.ts`
14. `lib/seasonal/kontext.ts`
15. `lib/safety/kontext.ts`
16. `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 8. Verbindliche Folgeentscheidung – Multi-Agent-Entwicklungsteam

Nach technischem Closure/PASS von PR #38 wird Jetnity kontrolliert auf ein Multi-Agent-Entwicklungsteam umgestellt. Verbindliche Policy: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`.

Grundprinzip:

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

Vor dem ersten parallelen Implementierungsblock werden Workstream-/Agent-Übersicht, Ownership-Matrix, Branch-/PR-Trennung, Allowed/Forbidden Touch Areas, Abhängigkeiten, Integrationsreihenfolge, Handoff- und Review-Regeln im Repository angelegt. Zunächst sollen ungefähr **2–3 Cursor-Agenten** kontrolliert parallel starten. Gemeinsame Truth-/Security-/Persistenz-Contracts werden nicht unkoordiniert von mehreren Agenten gleichzeitig verändert.

Die Teamstruktur und jeder Workstream-Status müssen repository-basiert rekonstruierbar sein, damit ein Chatwechsel keinen organisatorischen oder technischen Wissensverlust verursacht.
