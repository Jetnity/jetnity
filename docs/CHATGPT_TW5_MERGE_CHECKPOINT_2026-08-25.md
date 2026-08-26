# Jetnity – TW-5 Merge Checkpoint

Stand: 25. August 2026

Status: **HISTORICAL CHECKPOINT. TW-5 bleibt integriert. Nicht mehr der aktuellste operative Checkpoint.**

> Aktueller Checkpoint: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`.

## Live-verifizierter Abschluss

- PR: #66 – `Trip Workspace TW-5 – Item- und Gap-Details`
- Agent: `Trip workspace audit architecture`
- finaler Runtime-/Evidence-Head: `8183782fc08c486949212b0e78b9f4ce938aa0dd`
- finaler Persist-Head: `49aa04d99a5eb33a89fa624f1d096f7c5400698f`
- Independent Technical-Lead Result: **PASS / Technical Integration Closure**
- Merge-Commit auf `main`: `6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`
- Production-Vercel auf diesem Merge: **READY** (`dpl_HWmkViKGgzNgKFVAxmhqw2EVkoCv`)
- offene PR-Review-Threads beim Merge: 0

## P1-QS1-01

Der im QS-1-Audit bestätigte Product-Truth-P1 wurde vor dem Merge unabhängig geschlossen.

Root Cause: `bereichStatus()` führte explizites `ohneTag` und `reise.ohneTag` zusammen, obwohl der reale Produktpfad dieselbe Liste bereits explizit übergab. Dadurch konnte dieselbe ungeplante Flug-Itinerary zweimal in die Route-Ableitung gelangen.

Fix: Workspace-/Presentation-Komposition liest genau eine ungeplante Liste. Nicht-leeres explizites `ohneTag` gewinnt; ansonsten wird `reise.ohneTag` verwendet. Keine heuristische ID-Deduplizierung und keine Änderung der Shared Route/Transit Engine.

Regressionsevidence:

- realistischer ZRH → DOH → BKK-Fall;
- eine `sourceItemId`;
- 2 Segmente;
- 1 Connection;
- Route genau einmal;
- kein künstliches `Reihenfolge unbekannt`;
- sichtbarer `bereichStatus().text` bleibt mit `flugAbdeckung` konsistent.

## Final Gates

- gezielte TW-2/TW-3/TW-4/TW-5/P1-Regressionen: **112/112**
- `npm test`: **1994/1994**
- Typecheck: grün
- Lint: grün
- Production Build: grün, Next 14.2.32
- Hygiene/API/Schema/Dependency Gates: grün; `CookieConsent` bleibt dokumentierter begründeter Orphan
- Setup-CI: nur bekannte Warnung wegen fehlender lokaler `.env`
- `npm run audit:trip-workspace`: **1018/1018, 0 Fehler** (Chromium + WebKit)
- GitHub Actions Runtime-Head `8183782f`: SUCCESS, Run `32884017732`
- GitHub Actions Persist-Head `49aa04d9`: SUCCESS, Run `32885780086`
- Vercel Runtime-Head: READY
- Vercel Persist-Head: READY
- Vercel Production Merge `6f2beecc`: READY

## TW-5 fachlicher Abschluss

Integriert sind insbesondere:

- reisezentrierte Workspace-IA statt gleichrangiger Domain-Tabs;
- kontextuelle Gap-/Item-Details aus Coverage, Attention und Timeline;
- ehrliche Flight-/Stay-/Mobility-Zustände;
- `0 Aktivitäten` ist keine erfundene Pflichtlücke;
- alle sechs `TripItemKind` inkl. ungeplanter `ohneTag`-Items;
- tote Item-Refs fallen deterministisch zurück;
- Guest/Account dieselbe Presentation-Logik;
- Mobile/Desktop dieselbe Zustandsmaschine;
- Commercial-Suchen erst nach ausdrücklicher Aktion;
- Fokus/Keyboard/hidden/inert/Overflow im Workspace-Audit;
- kein stilles `ZRH` als Suchherkunft – `ZRH` ist nur Placeholder-Beispiel;
- keine neue DB-/Migration-/RLS-/Auth-/Traveller-/Route-/Provider-/Secret-/paid-call-Wahrheit.

## Nächste Build-Entscheidung

TW-6 darf **nicht automatisch** gestartet werden. Laut `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md` hat TW-6 die Abhängigkeit **dokumentierter Product-Owner-Schnitt + Guest-One-Trip-Vertrag**. Das ist vor Runtime-Start explizit zu prüfen und sauber zu versionieren.

TW-7 hängt am Account-/Hub-Vertrag, TW-8 an Provider S5. TW-9 ist der spätere Polish/Evidence/Closure-Slice.

Der erreichte TW-5-Merge ist ein neuer Integrationscheckpoint. Konfliktarme Audit-/Vorbereitungsarbeit kann vom Technical Lead parallel geprüft werden; Shared Contracts und große Build-Reihenfolge bleiben geschützt.

## Continuity

Dieser Checkpoint superseded alle älteren Formulierungen, die PR #66 noch als Draft/STOPP beschreiben. Live-Systeme sind dennoch bei jedem neuen Chat erneut zu prüfen.