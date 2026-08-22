# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34** https://github.com/Jetnity/jetnity/pull/34
- Implementierungs-Head: `23dd548ae05016b2a1b5011e24c3bdd9d2018f8f`
- Persistenz-Fix-Head: `6cbe39f3a96fd425b2e0e60ef33c3c206432ed81`
- Round-2-Fix-Head: `ab8a4910735b05c294f1060ce0f591afc3f25f4d`
- Round-3-Fix-Head: `be6112061a3429ecf8c8f4aaba595cb5913f3860`
- letzter vor Round-4 verifizierter PR-Head: `86d507cd119bdeff947d85c2a7292d93a574b4ce`
- Round-4-Fix-Head: `f55a8dcf1491575d5b0370bafec3934d9b7b884b`
- aktuellen Branch-/PR-Head vor jeder weiteren Arbeit erneut über GitHub verifizieren
- Status: **Round-4-Metadata-Guard umgesetzt und lokal/CI/Preview/DB geprüft; finaler Human-/Truth-Review offen**
- Merge: **nicht freigegeben**, PR bleibt Draft

## 2. Ziel

Eine Route, eine strukturierte Wahrheit. Länder nur aus belastbaren Airport-/Itinerary-Referenzen. Kein Raten aus Ortsnamen und keine Country-Truth aus Client-/Browserdaten – unabhängig davon, über welchen erlaubten Schreibweg die Flight-Metadata dauerhaft gespeichert wird.

## 3. Bereits umgesetzt

- `lib/route/` als provider-neutrale Route-Facts-Domäne
- Persistenz in vorhandenem `trip_items.metadata`; Development-RPC schreibt die Itinerary atomar (ADR-0113)
- `routeFactsAusReise()` liefert `flight_itinerary` bei gültiger Itinerary
- Guest→Account: gültige Route bleibt erhalten oder die Übernahme gilt nicht als vollständig erfolgreich
- Readiness wird bei Transitänderung stale
- Flug-UI progressiv, Übersicht dezent
- Reiseänderung nennt Transitwechsel
- UI-Audit-Fixtures für Direktflug / 1 Transit / 2 Transits
- direkte Account-Flugübernahme löst Airport-/Country-Facts serverseitig über `public.airports` auf
- Round 2: normaler Guest→Account-Pfad kanonisiert Browser-Itineraries vor RPC und Recovery über `public.airports`
- Round 3: direkter `reise_anlegen`-RPC kanonisiert Country-/City-Facts in der Datenbank aus IATA + `public.airports`
- Round 4: BEFORE-Trigger kanonisiert Flight-`routeItinerary` auf jedem `trip_items`-INSERT/UPDATE (ADR-0116)
- Fachdokumente, ADR-0108-Nachzug, ADR-0112/0113/0114/0115/0116

Route Facts sind traveller-neutral. Sie setzen keine einzelne Staatsbürgerschaft voraus und können später dieselbe Route gegen mehrere Traveller-/Credential-Profile auswerten.

## 4. Human Review Round 1 – Persistenz-Blocker behoben

Verbindlicher Review-Nachtrag:

- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`

Umgesetzt:

- `reise_anlegen()` schreibt validierte `route_itinerary` in derselben Transaktion nach `trip_items.metadata`
- TypeScript-Nachlauf ist fail-closed Recovery; kein stilles `ok` bei Lesen-/Schreib-/Unvollständigkeitsfehler
- Retry bleibt über `client_ref` idempotent
- Development-Migration `20260822130000_reise_anlegen_route_itinerary.sql` angewendet
- Production nicht migriert

## 5. Human / Truth Review Round 2 – normaler Client-Trust-Pfad behoben

Verbindlicher Review-Nachtrag:

- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND2.md`

Umgesetzt in `ab8a4910` (ADR-0114):

- `reiseAusNutzlastAnlegen()` sammelt alle IATA-Codes, holt `public.airports` einmal und übergibt nur die kanonisierte Nutzlast an RPC und Recovery
- `itineraryKanonisieren()` / `reiseNutzlastRouteKanonisieren()` bauen Punkte mit `flughafenPunkt()` neu
- Clientwerte `countryCode`, `city`, `country` werden verworfen
- fehlende Referenz oder Lookup-Fehler → `null`, kein Client-Fallback
- Datum/Uhrzeit bleiben
- `flugInReiseUebernehmen` bleibt referenzbasiert

## 6. Human / Security / Truth Review Round 3 – RPC-DB-Trust-Boundary behoben

Verbindlicher Review-Nachtrag:

- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND3.md`

Umgesetzt in `be611206` (ADR-0115):

- `flug_route_itinerary_metadata()` ist `STABLE` und baut Punkte aus IATA + `public.airports` neu
- Helfer `flug_route_punkt_aus_iata()`; 0 oder mehrere Treffer → `null`
- Clientwerte `countryCode`, `city`, `country` werden in der Datenbank verworfen
- direkter `reise_anlegen`-RPC mit `ZRH.countryCode = 'US'` persistiert CH, nicht US
- TypeScript-Kanonisierung bleibt Defense in Depth
- Development-Migration `20260822140000_flug_route_itinerary_airport_truth.sql` angewendet
- Production nicht migriert

## 7. Human / Security / Truth Review Round 4 – Metadata-Guard umgesetzt

Verbindlicher Review-Nachtrag:

- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND4.md`

Umgesetzt in `f55a8dcf` (ADR-0116):

- BEFORE-Trigger `trip_items_route_itinerary_schuetzen` auf `INSERT` und `UPDATE OF metadata, kind`
- Flight-`routeItinerary` wird über `flug_route_itinerary_metadata()` neu aufgebaut
- ungültige Route wird entfernt; andere Metadata-Schlüssel bleiben
- Nicht-Flight-Zeilen bleiben unverändert; `kind`-Wechsel zu `flight` wird kanonisiert
- Development-Migration `20260822150000_trip_items_route_itinerary_guard.sql` angewendet
- Production nicht migriert

## 8. Noch offen

- finalen Human-/Architecture-/UX-/Security-/Truth-Re-Review gegen tatsächlichen Head durchführen
- Product Owner erhält danach Ergebnis/Nutzerwirkung und kann weitere Änderungen verlangen
- ausdrückliche Product-Owner-Merge-Freigabe bleibt erforderlich
- kein Timatic, kein echter Provider, keine Production-Migration
- **separater zukünftiger Readiness-/Traveller-Context-Schritt vor echter Requirements-Provider-Aktivierung:** Mehrfachstaatsbürgerschaften und mehrere Reisedokumente als 1:n-Modell

## 9. Letzte relevante globale Entscheidungen

### Traveller Context Intelligence

Verbindlich:

- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_TRAVELLER_CONTEXT_AMENDMENT.md`

Keine relevante Funktion darf still nur eine Staatsbürgerschaft / einen Pass / ein Credential als universelle Dauerannahme verwenden, wenn mehrere rechtlich nutzbare Optionen das Ergebnis verändern können.

### Merge-Gate

Technisch fertig = review-bereit. **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**

### Progress Persistence

Jeder relevante Fortschritt, Blocker, Review-Fund, Test-/CI-/Preview-Stand und nächste Schritt muss versioniert werden.

### Expert Proactivity

Global verbindlich: `docs/EXPERT_PROACTIVITY_POLICY.md`. Wichtige fachliche Chancen/Risiken werden proaktiv präsentiert und bei Relevanz versioniert.

## 10. Tests / CI / Preview nach Round 4

Nachweis auf Code-Head `f55a8dcf`:

- `npm test`: 1295 pass / 0 fail
- Typecheck, Lint, Hygiene: grün
- Production Build: grün (38/38 Seiten)
- `auth:pruefen`: 55/55
- `db:anwenden` Development: `20260822150000_trip_items_route_itinerary_guard.sql` angewendet
- `db:rechte`: OK
- `db:rls`: grün
- `db:sicherheit`: **200/200** inkl. direkter INSERT/UPDATE-Manipulation
- Trip Workspace Audit: 726 Kombinationen, 0 Fehler, WebKit + Chromium
- Vercel Preview READY: https://jetnity-fm2luyy0k-jetnity-e1b93c82.vercel.app
- GitHub Actions CI **success**: https://github.com/Jetnity/jetnity/actions/runs/32578859981
- Draft-PR #34 mergeable / CLEAN; das ist keine Merge-Freigabe

## 11. Datenbank / RLS / Production

Direkt verifiziert am 22.08.2026:

- Development enthält `20260822130000 reise_anlegen_route_itinerary`, `20260822140000 flug_route_itinerary_airport_truth` und `20260822150000 trip_items_route_itinerary_guard`
- `authenticated` hat auf `trip_items` SELECT/INSERT/UPDATE/DELETE; Owner-RLS ist aktiv
- Production endet weiterhin bei `20260822020000 trip_travellers`
- Production ist **nicht** mit Foundation-D-RPC migriert
- Traveller-Schema in Foundation D nicht angefasst
- **Production nicht migrieren** ohne separate Freigabe

## 12. Kosten / Provider / Secrets

- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Flight-/Requirements-Provider aktiviert

## 13. Bekannte spätere Expert-Funde

Nicht Teil des Round-4-Blockers:

- ohne Airport-Zeile bleibt Country `null`
- mehrdeutige Flüge bekommen keine Itinerary
- Official Transit bleibt ohne Provider `unknown`
- echter Requirements-Provider darf nicht produktiv aktiviert werden, bevor Multi-Citizenship / mehrere Credential-Profile fachlich und providerseitig geklärt sind
- Gesamt-Destination-Regel vor First-Class-Multi-City/Open-Jaw explizit am Graphende definieren
- zeitabhängiges Connection-Risk später in eigene Logik/Fingerprint aufnehmen

## 14. Offene Nutzerentscheidungen / Freigaben

- **Merge von PR #34 nicht freigegeben**
- Production-/Provider-/Kostenfreigaben getrennt und nicht erteilt
- Multi-Citizenship-/Multi-Document-Unterstützung ist verbindlich beschlossen
- globale Traveller-Context-Relevanzprüfung gilt für jede relevante neue/geänderte Funktion
- Round-4-Guard liegt innerhalb der bereits geprüften Foundation-D-Truth-/Security-Grenze; keine Production-Freigabe daraus ableiten

## 15. Exakter nächster Schritt

1. ChatGPT führt den finalen Re-Review gegen `f55a8dcf` bzw. den tatsächlichen Head durch
2. Product Owner entscheidet danach über weitere Änderungen oder spätere Merge-Freigabe
3. **nicht mergen, nicht Mark Ready, keine Production-Migration ohne Freigabe**

## 16. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND2.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND3.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND4.md`
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- `docs/CURSOR_ROUTE_TRANSIT_MERGE_APPROVAL_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_PROGRESS_PERSISTENCE_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_TRAVELLER_CONTEXT_AMENDMENT.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/EXPERT_PROACTIVITY_POLICY.md`
- `docs/CURSOR_ROUTE_TRANSIT_EXPERT_PROACTIVITY_AMENDMENT.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` ADR-0108/0112/0113/0114/0115/0116
