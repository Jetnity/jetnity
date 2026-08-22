# PR #34 – Foundation D Acceptance / Verification

Stand: 22. August 2026  
Status: **technisch umgesetzt auf Draft-PR #34; Human-/Architecture-Review und Product-Owner-Freigabe offen**

Branch: `feat/route-transit-intelligence`  
PR: https://github.com/Jetnity/jetnity/pull/34  
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
- `db:rechte` / `db:rls` / `db:sicherheit` gelten hier nicht als Schemaänderung; sie wurden deshalb nicht als neue Migrationsprüfung gefahren

---

## Head / Preview / CI

Diese Felder werden nach dem offiziellen Testlauf dieses PRs nachgetragen:

| Nachweis | Stand |
| --- | --- |
| Head-Commit | wird nach Push nachgetragen |
| `npm test` | ausstehend |
| Typecheck | ausstehend |
| Lint | ausstehend |
| Hygiene | ausstehend |
| Production Build | ausstehend |
| Auth-Config-Checks | ausstehend |
| Trip Workspace Audit WebKit | ausstehend |
| Trip Workspace Audit Chromium | ausstehend |
| GitHub CI | ausstehend |
| Vercel Preview | ausstehend |

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

UI-Audit-Fixtures: `route-direkt`, `route-ein-transit`, `route-zwei-transits`.

---

## Risiken, die bewusst offen bleiben

- Ohne Airport-Zeile in `public.airports` gibt es IATA ohne Land. Fail-closed, kein Guess.
- `reise_anlegen()` schreibt die Itinerary nicht selbst; ein RPC-Fehler nach Insert ohne nachgelagertes Schreiben verlöre die Route. Der bestehende Insert-Fehlerpfad bleibt maßgeblich.
- Mehrdeutige Flüge (identische Titel/Daten/Provider/Ref/Position) bekommen keine Itinerary.
- Echter Connection-Risk- oder Transfer-Hinweis ist nicht gebaut.
- Official Transit-Requirements bleiben ohne Timatic `unknown`.

---

## Harte Nicht-Ziele

- kein Merge, kein Mark Ready
- keine Production-Migration
- kein Provider, kein Secret, kein Timatic-Vertrag
- keine Fake-Routen
