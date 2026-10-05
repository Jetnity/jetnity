# Jetnity – Trip Workspace TW-5 Status

Stand: 25. August 2026  
Status: **ABGESCHLOSSEN / PR #66 gemergt / Independent Technical-Lead PASS / Technical Integration Closure.**

Agent: `Trip workspace audit architecture`  
Branch: `feat/trip-workspace-tw5-item-gap-details`  
PR: #66 – `Trip Workspace TW-5 – Item- und Gap-Details`

## 1. Finaler Stand

- Baseline vor finalem Merge: `main` `d039e7bf7f7fa9db261b4623c72cc35944aa82c4`
- Runtime-/Evidence-Head: `8183782fc08c486949212b0e78b9f4ce938aa0dd`
- finaler docs-only Persist-Head: `49aa04d99a5eb33a89fa624f1d096f7c5400698f`
- Independent Technical-Lead Result: **PASS / Technical Integration Closure**
- Merge-Commit: `6f2beeccae2c1e6bdf9bcb9fdc35a5cd56e50bec`
- Vercel Production auf Merge: **READY** (`dpl_HWmkViKGgzNgKFVAxmhqw2EVkoCv`)
- offene Review-Threads beim Merge: 0

Dieser Status superseded frühere TW-5-Formulierungen `Draft`, `STOPP`, `kein Ready` oder `kein Merge`.

## 2. Umgesetzter Scope

TW-5 hängt vorhandene Flight-/Stay-/Activities-/Mobility-Flächen als kontextuelle Details einer Reise, Coverage-/Attention-Lücke oder eines Timeline-Items ein.

Umgesetzt:

- reisezentrierte Haupt-IA statt gleichrangiger Domain-Tabs;
- workspace-lokaler Detail-/Intent-State nur mit IDs und UI-Intent, ohne kopierte Hard Truth;
- Coverage-/Attention-/Timeline-Einstiege öffnen Gap- bzw. Item-Details;
- Flight-/Stay-/Mobility-Gaps bleiben `offen`/`teilweise`/`unbestimmt`/`belegt` ehrlich getrennt;
- `0 Aktivitäten` ist keine erfundene Pflichtlücke;
- alle sechs `TripItemKind`: `flight`, `stay`, `activity`, `transfer`, `rental_car`, `note`;
- `ohneTag`-Items öffnen ohne erfundenen Tag/Stage;
- tote Item-Refs fallen deterministisch auf die Reiseoberfläche zurück;
- Guest und Account nutzen dieselbe Presentation-Ableitung;
- Mobile und Desktop nutzen dieselbe Zustandsmaschine; Desktop darf Master/Detail zeigen;
- Commercial-Suche mountet erst nach ausdrücklicher Aktion;
- vorhandene `FlugBestand`-/`UnterkunftBestand`-/Search-Flächen werden wiederverwendet;
- Fokus/Keyboard/hidden/inert/Overflow im Workspace-Audit geprüft;
- `FlugSuche` verwendet kein stilles `ZRH`-Herkunftsdefault; `ZRH` bleibt nur Placeholder-Beispiel.

Nicht verändert:

- DB/Migration/RLS/Auth/Identity;
- Traveller-/Citizenship-/Document-Kernmodell;
- Route-/Transit-Shared-Contract;
- Provider-Aktivierung/Secrets/paid calls;
- Guardian/Simulator/Value;
- TW-6+ Runtime.

## 3. P1-QS1-01 – Closure

QS-1 fand einen realen Product-Truth-P1: ungeplante Flight-Itineraries konnten in `bereichStatus()` doppelt in die sichtbare Route eingehen.

### Root Cause

Der Presentation-Pfad kombinierte explizites `ohneTag` mit `reise.ohneTag`, obwohl der reale Account-Produktpfad bereits `ohneTag === reise.ohneTag` liefern konnte.

### Fix

Workspace-/Presentation-Komposition liest genau eine ungeplante Liste:

- nicht-leeres explizites `ohneTag` gewinnt;
- sonst `reise.ohneTag`;
- kein Concat;
- keine heuristische ID-Deduplizierung;
- keine Änderung der Route Engine.

### Regressionsevidence

Realistischer ungeplanter Flug ZRH → DOH → BKK mit Transit DOH:

- eine Source Item ID;
- `segments === 2`;
- `connections === 1`;
- Route genau einmal;
- kein künstliches `Reihenfolge unbekannt`;
- `bereichStatus().text` enthält weiterhin die echte `flugAbdeckung`-Zusammenfassung;
- explizite andere nicht-leere `ohneTag`-Liste wird nicht mit `reise.ohneTag` vermischt;
- ohne explizites `ohneTag` wird `reise.ohneTag` verwendet;
- leere ungeplante Liste erzeugt keine Phantom-Items.

Der Technical Lead hat Root Cause, Fix und Regression unabhängig im finalen PR-Code geprüft und den P1 als geschlossen bewertet.

## 4. Finale Tests und Gates

Runtime-/Evidence-Head `8183782f`:

- gezielte TW-2/TW-3/TW-4/TW-5/P1-Tests: **112/112**
- `npm test`: **1994/1994**
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run check:setup:ci`: OK mit bekannter Warnung `keine .env`
- Dead/Exports/Deps/API-Schutz/Schema-Bezug: grün; `CookieConsent` bleibt dokumentierter begründeter Orphan
- `npm run build`: OK, Next 14.2.32
- `npm run audit:trip-workspace`: **1018/1018, 0 Fehler**, Chromium + WebKit
- GitHub Actions Run `32884017732`: SUCCESS
- Vercel Preview: READY

Finaler Persist-Head `49aa04d9`:

- GitHub Actions Run `32885780086`: SUCCESS
- Vercel Preview: READY
- Branch vor Merge 15 ahead / 0 behind `main`
- Review-Threads: 0

Merge `6f2beecc`:

- Vercel Production: READY

## 5. Security / Privacy / Kosten

- kein neuer Endpoint;
- kein Secret/Service-Role-Change;
- keine Migration;
- kein RLS/Auth-Change;
- kein Provider/paid call;
- keine neuen laufenden Kosten;
- keine neue sensitive Traveller-/Passdaten-Speicherung.

## 6. Offene Follow-ups außerhalb TW-5

- QS-1 P2/P3 bleiben separat dokumentierte Quality/Polish-Follow-ups.
- `covered_by_flight` existiert als Mobility-Status, wird von der aktuellen Mobility-Engine nicht erzeugt; TW-5 erfindet ihn nicht.
- Compact kann redundante Zurück-Controls besitzen; kein zweiter Domain-IA-Pfad.
- `main` Branch Protection ist weiterhin nicht aktiv.

## 7. Nächster Schritt

TW-5 ist abgeschlossen. Kein weiterer Fix ist in diesem Slice offen.

Die nächste Trip-Workspace-Runtime wird erst nach erneuter Abhängigkeitsprüfung freigegeben. TW-6 hat ausdrücklich die Abhängigkeit **dokumentierter Product-Owner-Schnitt + Guest-One-Trip-Vertrag**; TW-7 und TW-8 haben eigene Account-/Provider-Abhängigkeiten.

Siehe:

- `docs/CHATGPT_TW5_MERGE_CHECKPOINT_2026-08-25.md`
- `docs/TRIP_WORKSPACE_IMPLEMENTATION_PLAN.md`
- `docs/ACTIVE_WORK_STATUS.md`.