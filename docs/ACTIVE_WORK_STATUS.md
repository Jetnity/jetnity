# Jetnity – Active Work Status

Stand: 23. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R9-Merge-Blocker 16–19 sind auf Runtime `263c2f84` in ihren geforderten Kernfällen geschlossen. Der unabhängige R10-Closure-Review hat jedoch vier konkrete Restdefekte gefunden: Blocker 20–23.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R9 Review: `docs/PR38_CHATGPT_R9_REVIEW.md`  
R10 Review: `docs/PR38_CHATGPT_R10_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`  
Multi-Agent-Folgeentscheidung: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R10-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- letzter geprüfter Runtime-Head: `263c2f842d2287da652b27cc9660c28db68c6750`
- Cursor-Docs-Lock vor R10: `081896abc4e84a2ff009b145e89a1fb11b7cb94e`
- R10-Review-Doku: `42374b5e0d94e17e345848eb01229ebbb0819680`
- Sync beim R10-Lock: **0 behind** `origin/main`
- PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 3. Status

**REQUEST CHANGES – R10-Blocker 20–23 offen. Noch kein Closure/PASS.**

R9-Fixes 16–19 sind substanziell bestätigt:

- spätere Segment-Origins bleiben sichtbar;
- Connection-Segmentzuordnung ist global eindeutig;
- Cross-Itinerary-Chronologie ist präzisions-/konfliktbewusst;
- Readiness verwendet v3 SHA-256 über den vollständigen Rohkontext.

R10 findet:

20. **Intra-Itinerary-Leg-Chronologie:** Eine einzelne Multi-Leg-Itinerary wird pauschal als chronologisch bewiesen behandelt. Explizit umgekehrt datierte Legs können dadurch einen falschen globalen Origin/Country-Truth erzeugen.

21. **Surface-Grenze fehlt in Route-ID:** `surfaceChange` wird in der Anzeige erhalten, aber im Route-Fingerprint verworfen. Surface `ZRH→CDG / ORY→BKK` kann mit einer kontinuierlichen `ZRH→CDG→ORY→BKK`-Kette kollidieren. Route-Change/Readiness-Stale können die Änderung verpassen.

22. **Connection-Truth:** Bei nur einem bekannten IATA wird aktuell `airportChange=true` erfunden. Zusätzlich werden lokale Uhrzeiten auch über verschiedene Airports/Zeitzonen als Layover-Dauer subtrahiert, obwohl `umstiegMinuten()` nur für denselben Kalenderort belastbar ist.

23. **Traveller/Credential-Stale:** Der v3-Hash enthält die Citizenship-Menge und opaque `citizenshipClientRef`, aber nicht zwingend die aktuelle Abbildung Ref→Country. Ein Pass kann fachlich von CH auf RS wechseln, während die gehashte Credential-Identität gleich bleibt. Die delimiterbasierte Rohserialisierung muss zudem für erlaubte opaque Refs eindeutig werden.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Exact-Head-Evidence des letzten Runtime-Heads

Auf exakt `263c2f842d2287da652b27cc9660c28db68c6750` unabhängig remote bestätigt:

- GitHub Actions Run `32657741587`: **SUCCESS**
- Vercel Deployment `dpl_6SEMJak1nD6KxpJ5C6uib9VqE7pZ`: **READY**, exact Git SHA `263c2f842d2287da652b27cc9660c28db68c6750`
- Cursor-Gate: `npm test` **1614/1614**, Typecheck/Lint/Hygiene grün, Build Exit 0, UI-Audit **1014/1014**, DB Rechte 51, RLS 0, Sicherheit **210/210**, Parallelität **7/7**

Docs-Lock `081896ab` separat verifiziert:

- GitHub Actions Run `32658442601`: **SUCCESS**
- Vercel `dpl_4Ti2HJjXCBAQaj5g5uUy7M18uCyh`: **READY**, exact Git SHA `081896abc4e84a2ff009b145e89a1fb11b7cb94e`
- Compare Runtime→Docs-Lock: genau ein Commit, nur Dokumentation

Grüne Gates ersetzen R10 nicht.

## 5. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine neue Seasonal-Migration
- `seasonalProviderAus()` bleibt `null`
- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Mark Ready / Merge / Production-Schritt

## 6. Exakter nächster Schritt

Cursor soll R10-Blocker **20–23** gemeinsam als Fehlerklassen schließen und danach einen eigenen adversariellen Self-Review machen.

Danach:

1. gezielte Regressionen für 20–23;
2. kompletter lokaler Gate-Lauf;
3. GitHub Actions + Vercel auf exakt neuem Runtime-Head;
4. genau ein Docs-Lock ohne Runtime-Code;
5. unabhängiger ChatGPT-Re-Review **R11**.

Für R11 gilt das Stop-Kriterium: Wenn kein weiterer konkreter relevanter Defekt gefunden wird, technisches **Closure/PASS**. Keine künstliche Verlängerung.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 7. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_R10_REVIEW.md`
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/PR38_CURSOR_REVIEW_FIXES.md`
4. `lib/route/chronologie.ts`
5. `lib/route/schema.ts`
6. `lib/route/pfad.ts`
7. `lib/route/fingerprint.ts`
8. `lib/route/verbindung.ts`
9. `lib/flights/zeit.ts`
10. `lib/readiness/traveller-kontext.ts`
11. `lib/readiness/kontext.ts`
12. `lib/readiness/fingerprint.ts`

## 8. Verbindliche Folgeentscheidung – Multi-Agent-Entwicklungsteam

Nach technischem Closure/PASS von PR #38 wird Jetnity kontrolliert auf ein Multi-Agent-Entwicklungsteam umgestellt. Verbindliche Policy: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`.

Grundprinzip:

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

Vor dem ersten parallelen Implementierungsblock werden Workstream-/Agent-Übersicht, Ownership-Matrix, Branch-/PR-Trennung, Allowed/Forbidden Touch Areas, Abhängigkeiten, Integrationsreihenfolge, Handoff- und Review-Regeln im Repository angelegt. Zunächst sollen ungefähr **2–3 Cursor-Agenten** kontrolliert parallel starten. Gemeinsame Truth-/Security-/Persistenz-Contracts werden nicht unkoordiniert von mehreren Agenten gleichzeitig verändert.

Die Teamstruktur und jeder Workstream-Status müssen repository-basiert rekonstruierbar sein, damit ein Chatwechsel keinen organisatorischen oder technischen Wissensverlust verursacht.
