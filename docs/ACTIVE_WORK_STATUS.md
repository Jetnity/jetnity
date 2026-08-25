# Jetnity – Active Work Status

Stand: 25. August 2026  
Status: **TW-1, TW-2, TW-4, TW-3 und TW-5 sind auf `main` integriert. TW-5 / PR #66 erhielt unabhängigen Technical-Lead-PASS und wurde gemergt. Vor neuer Runtime ist die nächste Abhängigkeit/PO-Kante zu entscheiden.**

## 0. Live-verifizierte Baseline

Aktueller `main` nach TW-5-Merge:

`6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`

Merge:

- PR #66 – `Trip Workspace TW-5 – Item- und Gap-Details`
- finaler Runtime-/Evidence-Head `8183782fc08c486949212b0e78b9f4ce938aa0dd`
- finaler Persist-Head `49aa04d99a5eb33a89fa624f1d096f7c5400698f`
- Independent TL: **PASS / Technical Integration Closure**
- Merge-Commit `6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`
- Vercel Production auf Merge: **READY**
- Review-Threads beim Merge: 0

Finale Gates:

- gezielte TW-2/TW-3/TW-4/TW-5/P1-Regressionen 112/112
- `npm test` 1994/1994
- Typecheck/Lint/Hygiene grün
- Production Build grün
- `npm run audit:trip-workspace` 1018/1018, 0 Fehler
- GitHub Actions Runtime + Persist SUCCESS
- Vercel Runtime + Persist READY

Details: `docs/CHATGPT_TW5_MERGE_CHECKPOINT_2026-08-25.md`.

## 1. Integrierter Trip-Workspace-Stand

- TW-1 / PR #56 – Shell & Geräteparität ✅
- TW-2 / PR #58 – Reiseübersicht ✅
- TW-4 / PR #60 – Aufmerksamkeit / Jetzt wichtig ✅
- TW-3 / PR #64 – Timeline / Etappe / Tag ✅
- TW-5 / PR #66 – Item- und Gap-Details ✅

TW-5 hat insbesondere die Domain-Tabs als primäre IA entfernt, vorhandene Flight/Stay/Activities/Mobility-Flächen kontextuell an Gap-/Item-Details gehängt, Commercial-Suche explizit lazy gehalten, `0 Aktivitäten` nicht als Pflichtlücke erfunden und Guest/Account sowie Mobile/Desktop auf derselben Presentation-Logik belassen.

### P1-QS1-01

Der QS-1-P1 ist geschlossen. `bereichStatus()` führt nicht mehr explizites `ohneTag` und `reise.ohneTag` zusammen. Genau eine ungeplante Liste geht in Coverage/Route/Status. Der Shared Route/Transit Contract wurde nicht verändert.

Regression: ZRH → DOH → BKK, eine Source-ID, 2 Segmente, 1 Connection, Route einmal, kein künstliches `Reihenfolge unbekannt`.

## 2. Nächste Trip-Workspace-Kante

Gemäß `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`:

- **TW-6 – Create-Entry angleichen**: erst nach dokumentiertem Product-Owner-Schnitt + Guest-One-Trip-Vertrag.
- **TW-7 – Hub-Anschluss**: darf Account-AP-3 nicht überschreiben; weitere Lifecycle-/Archivlogik hängt an Account AP-4.
- **TW-8 – Commercial Surfaces**: abhängig von Provider S5 / realer Commercial Provenance.
- **TW-9 – Polish, Evidence, Closure**: nach den abhängigen Slices.
- danach finaler Function-by-Function-/Intelligence-Audit.

Daher aktuell **kein automatischer TW-6-Start**. Technical Lead prüft zuerst live, welcher abhängige Slice freigegeben ist und ob ein dokumentierter Product-Owner-Schnitt erforderlich ist.

## 3. Workstream-Status

### `Trip workspace audit architecture`

TW-5 abgeschlossen und integriert. Wartet auf nächste freigegebene Trip-Workspace-Aufgabe.

### `Account plattform audit vorbereitung`

- AP-1 bis AP-3 integriert.
- AP-4 bis AP-12 warten gemäß großer Build Order / Traveller-/Account-Abhängigkeiten.
- Multi-Citizenship/Multi-Document bleibt Pflicht; kein Default-Pass.

### `Jetnity provider readiness audit`

- S1 bis S3 integriert.
- S4 bis S8 warten gemäß Build Order.
- echte Provider, Verträge, Secrets und paid calls bleiben besondere Product-Owner-Gates.

### `Admin platform audit`

- A bis C integriert.
- D bis K und Growth-Control-Slices warten gemäß Build Order.
- Billing-/Refund-P1 bleibt vor Finance-/Payment-Live zwingend.

### `Jetnity growth discoverability`

Reserviert. Aktivierung erst nach erneuter Abhängigkeitsprüfung von Public-/Workspace-Truth und D0/G0-Bedingungen.

### `Jetnity quality security audit`

QS-1 abgeschlossen und in PR #67 dokumentiert. Für weitere unabhängige Quality/Security/Resilience-Checkpoints reserviert, nicht allgemeiner Feature-Entwickler.

### `Jetnity native app architecture`

Für spätere Native-Phase reserviert; kein breiter Native-Runtime-Start vor Native-Audit/Target Architecture.

## 4. Parallelisierung

Der Post-TW-3-Checkpoint und nun der TW-5-Merge erlauben konfliktarme Parallelisierung, aber nicht automatisch.

Vor Öffnung eines parallelen Workstreams prüft der Technical Lead:

- Shared-Contract-Kollisionen;
- File-/Surface-Überschneidung;
- Abhängigkeiten zur großen Build-Reihenfolge;
- eigener Branch/Draft-PR/Task/Status/Gates/STOPP;
- klare Merge-Reihenfolge.

Nicht mehrere Runtime-Agenten nur zur Auslastung starten.

## 5. Shared Contracts

Technical-Lead-kontrolliert bleiben insbesondere:

- Auth / Identity / Sessions / MFA / AAL
- RLS / Ownership / Guest→Account
- Traveller / Multi-Citizenship / Multi-Document
- Route / Transit
- Privacy / Consent
- Billing / Payment
- Admin Audit / Capabilities
- Provider Activation
- Attribution / Revenue / Claims Truth
- Guardian / Simulator / Value Impact

Ein möglicher Citizenship-only Credential Option Contract bleibt separater Shared-Contract-Bedarf und wurde in TW-5 nicht erfunden.

## 6. Supabase / Production

Supabase Production:

`qscbgcdmivbbnzrcyegn`

Zuletzt live verifiziert: `ACTIVE_HEALTHY`.

Production enthält bis einschließlich:

- `20260824120000_flug_route_itinerary_surface_evidence`
- `20260824140000_flug_route_itinerary_untrusted_surface`

Development enthält zusätzlich:

- `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000_trip_items_flug_handelsfelder_guard`

Diese beiden Development-Migrationen sind **nicht Production-approved**. TW-5 brachte keine Migration/RLS/Auth/Traveller/Provider/Secret-Änderung.

## 7. Kosten und Product-Owner-Gates

Aktuell wurde durch TW-5 keine neue laufende Kostenposition oder paid call eingeführt.

Product-Owner-Freigabe bleibt zwingend insbesondere für:

- Production-Migration/destructive Production-Daten;
- große Production-RLS-/Ownership-/Identity-Änderungen;
- echte Providerverträge, Production-Secrets, paid calls;
- neue laufende Kosten über USD 100/Monat;
- reale Payments/Geldbewegung;
- fundamentale Produkt-/Business-Model-/Build-Order-Abweichung;
- neue besonders sensitive Pass-/MRZ-/Biometrie-Speicherung;
- fundamentale Auth/MFA/AAL/Session-Änderungen;
- neue sensible externe Datenweitergabe;
- Public Launch / große Production-Aktivierung / reale Provider live.

Normale scope-treue Engineering-PRs dürfen nach vollständigen Exact-Head-Gates und unabhängigem Technical-Lead-PASS autonom Ready gesetzt und gemergt werden.

## 8. Offene Risiken / Follow-ups

- `main` Branch Protection ist live weiterhin nicht aktiviert.
- QS-1 P2/P3-Findings bleiben dokumentierte Follow-ups; sie wurden bewusst nicht in TW-5 gezogen.
- TW-6-Abhängigkeit `dokumentierter Product-Owner-Schnitt + Guest-One-Trip-Vertrag` ist vor Start zu klären.
- Historische offene PRs/Drafts sind nicht automatisch aktive Runtime-Slices.

## 9. Exakter nächster Schritt

1. Post-TW-5-Continuity auf Merge `6f2beecc...` abschließen.
2. Danach live Abhängigkeiten für TW-6/TW-7/TW-8 und mögliche konfliktarme Audit-/Vorbereitungsarbeit prüfen.
3. Keine neue Runtime starten, bevor deren versionierter Scope, Abhängigkeiten und Gates klar sind.

Aktuell muss in Cursor **kein neuer Agentenprompt** gesendet werden.