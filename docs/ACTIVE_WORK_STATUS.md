# Jetnity – Active Work Status

Stand: 24. August 2026  
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R12-Merge-Blocker 27 ist auf Runtime `1c14e804` implementiert und vollständig gegated. Der unabhängige R13-Review wurde durchgeführt und findet **einen neuen konkreten Merge-Blocker 28**: same-country darf ohne explizite/autoritative Evidence keine Surface-Verbindung beweisen. Noch kein technisches Closure/PASS.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
R13 Review: `docs/PR38_CHATGPT_R13_REVIEW.md`  
R12 Review: `docs/PR38_CHATGPT_R12_REVIEW.md`  
Cursor-Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`  
Multi-Agent-Folgeentscheidung: `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`

## 2. Branch / PR / Review-Lock

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Main beim R13-Review: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R12-Runtime-Head: `1c14e80477b7bea083d722238165c97720442c1d`
- Docs-Lock vor R13: `3fb075dd55938d3037e1f16b05a504c0306df589`
- R13-Review-Dokument: Commit `7b14d601`
- PR-Zustand: **open, Draft, nicht gemergt**

## 3. Status

**R13 = REQUEST CHANGES. Nur Blocker 28 offen.**

R12-Fix 27 bleibt substanziell geschlossen: bekannte IATA-Codes allein beweisen keine Segmentreihenfolge; unverbundene/mehrdeutige Mengen bleiben fail-closed; unbewiesene Connections/Transit-Rollen werden unterdrückt; der Fingerprint einzelner unbewiesener Segmentmengen ist permutationstabil.

### Blocker 28

`lib/route/chronologie.ts` behandelt aktuell eine Lücke zwischen zwei verschiedenen Airports als Surface-Kante, wenn Destination und nächster Origin denselben Country-Code haben. Der Domain-Vertrag enthält jedoch keine explizite Surface-Evidence. Beispiel `LAX→JFK` + `SFO→NRT`: `JFK` und `SFO` sind beide US, wodurch eine nicht gespeicherte `JFK ⇢ SFO`-Verbindung als eindeutige Kette und damit als `chronologieBewiesen=true` entstehen kann.

Verbindliche Korrektur:

- Country-Gleichheit allein darf keine Surface-/Sequence-Truth beweisen.
- Echte `CDG ⇢ ORY`-Surface-Wechsel bleiben unterstützt, wenn eine belastbare provider-neutrale Evidence existiert; sonst fail-closed.
- Keine Live-Provider-, DB-, Secret- oder Kostenanforderung.
- Vollständige Pflicht-Regressionen stehen in `docs/PR38_CHATGPT_R13_REVIEW.md`.

R11-Fixes 24–26, R10-Fixes 20–23 und Blocker 1–27 werden nicht pauschal wiedereröffnet.

PR bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche Product-Owner-Freigabe.

## 4. Verifizierte Exact-Head-Evidence des R12-Runtime-Heads

Auf exakt `1c14e80477b7bea083d722238165c97720442c1d` unabhängig bestätigt:

- `npm test` **1665/1665** laut Gate-Dokumentation
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0, `/api/seasonal/evaluate` enthalten
- UI-Audit **1014/1014**, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB: Rechte 51, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions Run `32669937883`: **SUCCESS** auf exakt `1c14e80477b7bea083d722238165c97720442c1d`
- Vercel Deployment `dpl_3Y7pjngVLWmJvzbTg5VLkkunbunc`: **READY**, `githubCommitSha=1c14e80477b7bea083d722238165c97720442c1d`
- Docs-Lock `3fb075dd`: GitHub Actions Run `32670692111` SUCCESS; kein zweites Runtime-Gate

Grüne Gates ersetzen den R13-Code-Review nicht.

## 5. DB / Kosten / Provider

- keine Seasonal-Tabelle
- keine neue Seasonal-Migration
- `seasonalProviderAus()` bleibt `null`
- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Mark Ready / Merge / Production-Schritt

## 6. Exakter nächster Schritt

Der Cursor-Agent des PR-#38-Workstreams soll **nur Blocker 28** aus `docs/PR38_CHATGPT_R13_REVIEW.md` kohärent schließen, Regressionen ergänzen und den vollständigen Exact-Head-Gate erneut durchführen.

Danach unabhängiger ChatGPT-Re-Review **R14**. Wenn R14 keinen neuen konkreten relevanten Truth-/Security-/Provider-/SoT-/Cross-Domain-/Release-Defekt findet: technisches Closure/PASS dokumentieren und Review-Schleife nach Stop-Kriterium beenden.

PR bleibt Draft. Kein Mark Ready. Kein Merge.

## 7. Multi-Agent-Folgeentscheidung

Account-/Admin-Audits dürfen parallel als Analyse-/Vorbereitungsworkstreams laufen. Gemeinsame Auth/RLS/DB/Traveller-/Route-/Readiness-/Safety-/Seasonal-Contracts bleiben bis zur koordinierten Integrationsfreigabe geschützt.

Grundprinzip:

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

## 8. Agent-Handoff

- Sichtbarer Cursor-Anzeigename für PR #38 ist in ChatGPT weiterhin nicht vollständig bekannt; keinen Namen erfinden.
- Branch/PR: `feat/travel-timing-seasonal-intelligence` / `#38`
- Geprüfter Runtime-Head R13: `1c14e804`
- R13: Blocker 28 dokumentiert
- Nicht umgesetzt / nicht behauptet: Blocker-28-Fix, R14, Mark Ready, Merge, Provider, DB-Migration
- Exakter nächster Schritt: R13-Dokument lesen und nur Blocker 28 schließen.