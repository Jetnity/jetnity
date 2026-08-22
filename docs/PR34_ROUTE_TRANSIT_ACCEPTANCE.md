# PR #34 – Foundation D Acceptance / Verification

Stand: 22. August 2026  
Status: **Product-Owner-Rundgang abgeschlossen; Branch mit `main` synchronisiert und lokal verifiziert; Merge-Freigabe offen**

Branch: `feat/route-transit-intelligence`  
PR: https://github.com/Jetnity/jetnity/pull/34  
PR-Zustand: **Draft**  
Base: `main`  
Merge-Approval: `docs/CURSOR_ROUTE_TRANSIT_MERGE_APPROVAL_AMENDMENT.md` und `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`

---

## Was dieser Block beweist

Jetnity besitzt eine gemeinsame, strukturierte Route Truth aus validierten Flight-Itineraries.

`routeFactsAusReise()` liefert `quelle: 'flight_itinerary'`, sobald eine gültige Itinerary im Reisegraphen liegt. Titel, Notizen, Ortsnamen und Browser-Country-Felder erzeugen keine Route. Account-Länder kommen nur aus `public.airports` (ADR-0114, ADR-0115, ADR-0116). Weder ein normaler Client-Pfad, ein direkter `reise_anlegen`-RPC noch ein Eigentümer-INSERT/UPDATE auf `trip_items.metadata` kann Client-Länder als Route Truth persistieren.

---

## Datenbankgrenze

- Development-Migrationen `20260822130000_reise_anlegen_route_itinerary.sql`, `20260822140000_flug_route_itinerary_airport_truth.sql` und `20260822150000_trip_items_route_itinerary_guard.sql` **angewendet**
- Keine neue Tabelle oder Spalte; Persistenz bleibt `trip_items.metadata`
- Production-Schema unverändert
- `db:rechte` OK, `db:rls` grün, `db:sicherheit` 200/200 nach dem Metadata-Guard
- Round-4-Trigger existiert auf Development als `BEFORE INSERT OR UPDATE OF metadata, kind`

---

## Head / Preview / CI

| Nachweis | Stand |
| --- | --- |
| Arbeits-Head der Implementierung | `23dd548ae05016b2a1b5011e24c3bdd9d2018f8f` |
| Persistenz-Fix-Head | `6cbe39f3a96fd425b2e0e60ef33c3c206432ed81` |
| Round-2-Fix-Head | `ab8a4910735b05c294f1060ce0f591afc3f25f4d` |
| Round-3-Fix-Head | `be6112061a3429ecf8c8f4aaba595cb5913f3860` |
| Round-4-/finaler Code-Head | `f55a8dcf1491575d5b0370bafec3934d9b7b884b` |
| letzter vor Final-Review vollständig grüner Docs-Head | `472acdf83045b05211309c2fe28a61b01b9d9b9e` |
| Closeout-Sync-Head | `6098cf45` |
| Closeout-Bericht | `docs/PR34_PRODUCT_OWNER_CLOSEOUT_REPORT.md` |
| `npm test` | **1295 pass / 0 fail** – neu nach erstem `main`-Sync |
| Typecheck | **grün** (`tsc --noEmit`) – neu |
| Lint | **grün** (`next lint`, 0 warnings/errors) – neu |
| Hygiene | **grün** – neu |
| Production Build | **grün** (`next build`, 38/38 Seiten) – neu |
| Auth-Config-Checks | **grün** (`auth:pruefen`: 55/55 Werte) – neu |
| Trip Workspace Audit | **726 Kombinationen, 0 Fehler**, WebKit + Chromium – neu |
| GitHub Actions `CI` | auf finalem Closeout-Head prüfen; ältere grüne Heads ersetzen das nicht |
| Vercel | auf finalem Closeout-Head prüfen |
| `db:sicherheit` | **200/200** nach `20260822150000_trip_items_route_itinerary_guard.sql` – neu |

---

## Kernfälle

Automatisiert bzw. in DB-Security-Prüfungen nachgewiesen:

1. Direktflug CH → TH
2. ein Transit CH → QA → TH
3. zwei Transits
4. fehlender Airport-Country-Kontext bleibt unknown
5. gleiche Stadt / unterschiedlicher Airport = Flughafenwechsel
6. Transitwechsel QA → SG erzeugt neue Route Facts
7. Readiness Context wird bei Transitänderung stale
8. Segmentreihenfolge bleibt korrekt
9. Connection Duration nur aus validen Zeiten
10. Guest-/Account-Parität
11. Titel/Notiz werden nicht zur Route
12. direkter `reise_anlegen`-RPC kann Client-Country nicht persistieren
13. direkter `trip_items`-INSERT kann Client-Country nicht persistieren
14. direkter `metadata`-UPDATE kann Transitland nicht manipulieren
15. unbekannter IATA-Code bleibt Country/City/Country `null`
16. ungültige `routeItinerary` wird fail-closed entfernt
17. andere Metadata-Schlüssel bleiben erhalten
18. Nicht-Flight-Metadata wird nicht unnötig verändert
19. `kind`-Wechsel zu `flight` löst Kanonisierung aus

---

## Finaler Human Review

Verbindlicher Abschluss:

- `docs/PR34_FINAL_HUMAN_REVIEW.md`
- Ergebnis: **keine weiteren Foundation-D-Blocker**
- Architektur-, UX-, Security- und Truth-Grenzen sind für den freigegebenen Foundation-D-Scope konsistent
- Foundation D ist **technisch bereit für die Product-Owner-Entscheidung**

---

## Bewusst offene Punkte – keine PR-#34-Blocker

- Ohne Airport-Zeile in `public.airports` gibt es IATA ohne Land. Fail-closed, kein Guess.
- Production kennt RPC-Kanonisierung und Metadata-Guard noch nicht; die drei Foundation-D-Migrationen sind dort nicht angewendet.
- Mehrdeutige Flüge können ohne eindeutige Zuordnung keine Itinerary erhalten.
- Echter Connection-Risk-/Transfer-Risk-Block ist noch nicht gebaut.
- Official Transit-Requirements bleiben ohne echten Requirements-Provider `unknown`.
- Multi-Citizenship/Multi-Document ist der verbindliche spätere Readiness-/Traveller-Context-Schritt vor echter Requirements-Provider-Aktivierung.
- Gesamt-Destination für First-Class-Multi-City/Open-Jaw muss später am Graphende definiert werden.

---

## Merge-/Production-Gate

**Technisch review-bestanden ist keine Merge-Freigabe.**

- PR bleibt Draft
- nicht Mark Ready ohne Product-Owner-Entscheidung
- kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe
- keine Production-Migration ohne separates Product-Owner-Gate
- kein Provider, Secret, Timatic-Vertrag oder neue laufende Kosten ohne entsprechende Freigabe
