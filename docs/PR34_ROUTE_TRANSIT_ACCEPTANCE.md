# PR #34 – Foundation D Acceptance / Verification

Stand: 22. August 2026  
Status: **technisch umgesetzt und lokal/preview geprüft; Human-/Architecture-Review und Product-Owner-Freigabe offen**

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

- **Keine neue Migration**
- **Keine neue Tabelle oder Spalte**
- Persistenz nutzt vorhandenes `trip_items.metadata`
- Production-Schema unverändert
- `db:rechte` / `db:rls` / `db:sicherheit` nicht als neue Migrationsprüfung gefahren, weil das Schema nicht berührt wurde

---

## Head / Preview / CI

| Nachweis | Stand |
| --- | --- |
| Arbeits-Head der Implementierung | `23dd548ae05016b2a1b5011e24c3bdd9d2018f8f` |
| Nachgezogener Branch-Stand | Merge von `origin/main` `4a8a4ea6` (Progress-Persistence-Policy); exakten Head nach Push prüfen |
| `npm test` | **1271 pass / 0 fail** |
| Typecheck | **grün** (`tsc --noEmit`) |
| Lint | **grün** (`next lint`, 0 warnings/errors) |
| Hygiene | **grün** (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`) |
| Production Build | **grün** (`next build`, 38/38 Seiten) |
| Auth-Config-Checks | **grün** (`auth:pruefen`: 55/55 Werte) |
| Trip Workspace Audit | **726 Kombinationen, 0 Fehler**, Engines WebKit + Chromium, inkl. `route-direkt` / `route-ein-transit` / `route-zwei-transits` |
| Vercel Preview | **READY** für `23dd548a`: https://jetnity-16l9pmw3e-jetnity-e1b93c82.vercel.app |
| GitHub Actions `CI` | letzter abgeschlossener PR-Lauf **success** auf Docs-Head `ea34163b` (https://github.com/Jetnity/jetnity/actions/runs/32571564738). Implementierungs-Pushes danach haben keinen neuen `pull_request`-Lauf erzeugt. Der Branch ist mit `main` `4a8a4ea6` synchronisiert, um den dirty Merge-State zu heben und CI erneut anzustoßen. |

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
- `reise_anlegen()` schreibt die Itinerary nicht selbst; ein RPC-Fehler nach Insert ohne nachgelagertes Schreiben verlöre die Route.
- Mehrdeutige Flüge (identische Titel/Daten/Provider/Ref/Position) bekommen keine Itinerary.
- Echter Connection-Risk- oder Transfer-Hinweis ist nicht gebaut.
- Official Transit-Requirements bleiben ohne Timatic `unknown`.
- Multi-Citizenship/Multi-Document ist eine spätere Readiness-Erweiterung (`docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`), kein Foundation-D-Schema.

---

## Harte Nicht-Ziele

- kein Merge, kein Mark Ready
- keine Production-Migration
- kein Provider, kein Secret, kein Timatic-Vertrag
- keine Fake-Routen
