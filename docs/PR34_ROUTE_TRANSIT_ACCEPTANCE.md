# PR #34 – Foundation D Acceptance / Verification

Stand: 22. August 2026  
Status: **Review-Blocker Guest→Account-Route-Persistenz umgesetzt; lokal/CI/Preview/DB-Development geprüft; erneutes Human-Review und Product-Owner-Freigabe offen**

Branch: `feat/route-transit-intelligence`  
PR: https://github.com/Jetnity/jetnity/pull/34  
PR-Zustand: **Draft**  
Base: `main`  
Merge-Approval: `docs/CURSOR_ROUTE_TRANSIT_MERGE_APPROVAL_AMENDMENT.md` und `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`

---

## Was dieser Block beweist

Jetnity besitzt eine gemeinsame, strukturierte Route Truth aus validierten Flight-Itineraries.

`routeFactsAusReise()` liefert `quelle: 'flight_itinerary'`, sobald eine gültige Itinerary im Reisegraphen liegt. Titel, Notizen und Ortsnamen erzeugen keine Route.

---

## Datenbankgrenze

- Development-Migration `20260822130000_reise_anlegen_route_itinerary.sql` **angewendet**
- Keine neue Tabelle oder Spalte; Persistenz bleibt `trip_items.metadata`
- Production-Schema unverändert
- `db:rechte` OK, `db:rls` grün, `db:sicherheit` 185/185 nach der Development-Migration

---

## Head / Preview / CI

| Nachweis | Stand |
| --- | --- |
| Arbeits-Head der Implementierung | `23dd548ae05016b2a1b5011e24c3bdd9d2018f8f` |
| Persistenz-Fix-Head | `6cbe39f3a96fd425b2e0e60ef33c3c206432ed81` |
| Verifizierter Branch-Head | `69f903e6b5f6717d381471aaa8f8ddd8724bdef2` |
| `npm test` | **1284 pass / 0 fail** (Code-Head `6cbe39f3`) |
| Typecheck | **grün** (`tsc --noEmit`) |
| Lint | **grün** (`next lint`, 0 warnings/errors) |
| Hygiene | **grün** (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`) |
| Production Build | **grün** (`next build`, 38/38 Seiten). Setup-Warnung: keine `.env`/`.local` in dieser Agent-Umgebung. |
| Auth-Config-Checks | **grün** (`auth:pruefen`: 55/55 Werte) |
| Trip Workspace Audit | **726 Kombinationen, 0 Fehler**, Engines WebKit + Chromium, inkl. `route-direkt` / `route-ein-transit` / `route-zwei-transits` |
| Vercel Preview | **READY** für `69f903e6`: https://jetnity-hmdtw8ime-jetnity-e1b93c82.vercel.app |
| GitHub Actions `CI` | **success** auf `69f903e6`: https://github.com/Jetnity/jetnity/actions/runs/32575412251 |

---

## Mindestfälle

Automatisiert in `lib/route/ableitung.test.ts` und `lib/route/persistenz.test.ts`:

1. Direktflug CH → TH
2. ein Transit CH → QA → TH
3. zwei Transits
4. fehlender Airport-Country-Kontext bleibt unknown
5. gleiche Stadt / unterschiedlicher Airport = Flughafenwechsel
6. Transitwechsel QA → SG erzeugt neue Route Facts
7. Readiness Context wird bei Transitänderung stale
8. Segmentreihenfolge bleibt korrekt
9. Connection Duration aus validen Zeiten
10. ungültige/fehlende Zeiten erzeugen keine Duration
11. Guest-/Account-Parität über dasselbe Trip-Feld und denselben Fingerprint
12. Direktflug-Anzeige ist einfacher als Umstieg
13. Titel/Notiz werden nicht zur Route
14. FlugOption-Ableitung nutzt nur Referenzländer

Bestehende Flight-/Mobility-/Readiness-/Trip-/Change-Regressionen: im vollen `npm test` (1271) enthalten.

UI-Audit-Fixtures: `route-direkt`, `route-ein-transit`, `route-zwei-transits`.

---

## Risiken, die bewusst offen bleiben

- Ohne Airport-Zeile in `public.airports` gibt es IATA ohne Land. Fail-closed, kein Guess.
- Production kennt die RPC-Erweiterung noch nicht; dort bleibt der fail-closed TypeScript-Nachlauf die Recovery. Development schreibt atomar.
- Mehrdeutige Flüge (identische Titel/Daten/Provider/Ref/Position) bekommen keine Itinerary.
- Echter Connection-Risk- oder Transfer-Hinweis ist nicht gebaut.
- Official Transit-Requirements bleiben ohne Timatic `unknown`.
- Multi-Citizenship/Multi-Document ist eine spätere Readiness-Erweiterung (`docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`), kein Foundation-D-Schema.

---

## Senior Expert Pass

Geprüft gegen `docs/CURSOR_ROUTE_TRANSIT_EXPERT_PROACTIVITY_AMENDMENT.md`. Route Facts sind traveller-neutral (`lib/route` enthält keine Staatsbürgerschaft/Passfelder). Dieselbe Route kann später gegen mehrere Credential-Profile ausgewertet werden, ohne dupliziert zu werden.

### Fund 1 – Nachgelagertes Itinerary-Schreiben war nicht fail-closed

- **Beobachtung:** Der stille Nachlauf konnte eine Guest-Route verlieren und trotzdem `ok` liefern.
- **Status:** **behoben** in `6cbe39f3` (ADR-0113). RPC schreibt atomar auf Development; Nachlauf ist fail-closed Recovery.
- **Priorität:** Production-Anwendung der Migration bleibt separate Freigabe
- **Scope:** innerhalb Foundation D, umgesetzt
- **Product-Owner-Entscheidung:** Production-Migration später, nicht jetzt

### Fund 2 – Gesamt-Destination folgt dem frühesten Itinerary

- **Beobachtung:** `destination` kommt vom ersten zeitlich sortierten Itinerary. `destinationCountryCodes` sammelt alle Nicht-Rückkehr-Ziele.
- **Relevanz:** Readiness-Länder sind vollständig; die eine Destinationsanzeige kann bei späteren Open-Jaw-/Mehrstrecken-Graphen zu früh enden.
- **Empfehlung:** Solange Etappen die Zielwahrheit tragen, belassen. Vor echter Multi-City-UX Destinationsregel explizit am Graphende festlegen.
- **Priorität:** nächster Block, falls Mehrstrecken-Reisen first-class werden
- **Scope:** außerhalb Foundation D
- **Product-Owner-Entscheidung:** nicht jetzt

### Fund 3 – Route-Fingerprint ist pfadbezogen

- **Beobachtung:** Fingerprint ist `route-v1|ZRH:CH>DOH:QA>BKK:TH` ohne Zeiten. Reisedaten liegen bereits im Readiness-Fingerprint.
- **Relevanz:** Gleicher Pfad / andere Uhrzeit stale-t Official Transit nicht über die Route. Das ist für Länderregeln korrekt; Connection-Risk später nicht.
- **Empfehlung:** Istzeiten erst in einem Connection-Risk-Block in den Fingerprint, nicht jetzt.
- **Priorität:** später
- **Scope:** außerhalb Foundation D
- **Product-Owner-Entscheidung:** nicht jetzt

Keine weiteren hochwirksamen Experten-Funde außerhalb dieser Punkte und der bereits dokumentierten Risiken.

---

## Harte Nicht-Ziele

- kein Merge, kein Mark Ready
- keine Production-Migration
- kein Provider, kein Secret, kein Timatic-Vertrag
- keine Fake-Routen
