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
- Round-4-Fix-/finaler Code-Head: `f55a8dcf1491575d5b0370bafec3934d9b7b884b`
- letzter vollständig grün verifizierter Docs-Head vor Final-Review-Nachtrag: `472acdf83045b05211309c2fe28a61b01b9d9b9e`
- aktuellen Branch-/PR-Head vor jeder weiteren Arbeit erneut über GitHub verifizieren
- Status: **finaler Human-/Architecture-/UX-/Security-/Truth-Review bestanden; technisch bereit für Product-Owner-Entscheidung**
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
- Final Review: keine weiteren Foundation-D-Blocker gefunden (`docs/PR34_FINAL_HUMAN_REVIEW.md`)

Route Facts sind traveller-neutral. Sie setzen keine einzelne Staatsbürgerschaft voraus und können später dieselbe Route gegen mehrere Traveller-/Credential-Profile auswerten.

## 4. Review-Kette – alle Blocker behoben

### Round 1 – Persistenz
- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`
- `reise_anlegen()` schreibt validierte `route_itinerary` atomar
- Recovery fail-closed, Retry idempotent
- Development-Migration `20260822130000_reise_anlegen_route_itinerary.sql`

### Round 2 – normaler Client-Trust-Pfad
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND2.md`
- Browserwerte `countryCode`, `city`, `country` werden verworfen
- IATA-Batch-Lookup gegen `public.airports`
- fehlende Referenz → `null`, kein Client-Fallback

### Round 3 – direkter RPC
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND3.md`
- DB-Funktion baut Route-Punkte aus IATA + `public.airports`
- direkter `reise_anlegen`-RPC kann Country-Truth nicht umgehen
- Development-Migration `20260822140000_flug_route_itinerary_airport_truth.sql`

### Round 4 – direkte Tabellen-Schreibwege
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND4.md`
- BEFORE-Trigger `trip_items_route_itinerary_schuetzen` auf `INSERT` und `UPDATE OF metadata, kind`
- Flight-`routeItinerary` wird bei jedem persistenten Schreibweg kanonisiert
- ungültige Route wird entfernt; andere Metadata-Schlüssel bleiben
- Nicht-Flight-Zeilen bleiben unverändert; `kind`-Wechsel zu `flight` wird kanonisiert
- Development-Migration `20260822150000_trip_items_route_itinerary_guard.sql`

### Final Review
- `docs/PR34_FINAL_HUMAN_REVIEW.md`
- **keine weiteren Foundation-D-Blocker**
- technisch bereit für Product-Owner-Entscheidung

## 5. Tests / CI / Preview

Nachweis auf Code-Head `f55a8dcf`:

- `npm test`: 1295 pass / 0 fail
- Typecheck, Lint, Hygiene: grün
- Production Build: grün (38/38 Seiten)
- `auth:pruefen`: 55/55
- `db:rechte`: OK
- `db:rls`: grün
- `db:sicherheit`: **200/200** inkl. direkter INSERT/UPDATE-Manipulation
- Trip Workspace Audit: 726 Kombinationen, 0 Fehler, WebKit + Chromium
- GitHub Actions CI success auf Code-Head
- Vercel Preview READY auf Code-Head

Zusätzlich unabhängig geprüft:

- Docs-Head `472acdf8` lag exakt einen Dokumentations-Commit vor `f55a8dcf`
- GitHub CI auf `472acdf8`: success
- Vercel auf `472acdf8`: success

## 6. Datenbank / RLS / Production

Direkt verifiziert am 22.08.2026:

- Development enthält `20260822130000`, `20260822140000`, `20260822150000`
- der Round-4-Trigger existiert tatsächlich auf Development als `BEFORE INSERT OR UPDATE OF metadata, kind`
- `authenticated` hat auf `trip_items` SELECT/INSERT/UPDATE/DELETE; Owner-RLS ist aktiv
- Route-Guard schützt zusätzlich die Route-Wahrheit innerhalb eigener Zeilen
- Production enthält **keine** der drei Foundation-D-Migrationen
- Traveller-Schema in Foundation D nicht angefasst
- **Production nicht migrieren** ohne separate Freigabe

## 7. Traveller Context Intelligence

Verbindlich:

- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_TRAVELLER_CONTEXT_AMENDMENT.md`

Keine relevante Funktion darf still nur eine Staatsbürgerschaft / einen Pass / ein Credential als universelle Dauerannahme verwenden, wenn mehrere rechtlich nutzbare Optionen das Ergebnis verändern können.

Mehrfachstaatsbürgerschaften / mehrere Reisedokumente bleiben der verbindliche nächste Readiness-/Traveller-Context-Schritt vor echter Requirements-Provider-Aktivierung.

## 8. Kosten / Provider / Secrets

- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Flight-/Requirements-Provider aktiviert
- kein Timatic-Vertrag

## 9. Bewusst offene spätere Punkte – keine Foundation-D-Blocker

- ohne Airport-Zeile bleibt Country `null`
- mehrdeutige Flüge bekommen keine Itinerary
- Official Transit bleibt ohne Provider `unknown`
- Gesamt-Destination-Regel vor First-Class-Multi-City/Open-Jaw explizit am Graphende definieren
- zeitabhängiges Connection-Risk später in eigene Logik/Fingerprint aufnehmen

## 10. Governance

### Merge-Gate

Technisch review-bestanden = **bereit für Product-Owner-Entscheidung**, nicht automatisch merge-freigegeben.

- PR #34 bleibt Draft
- nicht Mark Ready ohne Product-Owner-Entscheidung
- **kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe**
- keine Production-Migration ohne separates Product-Owner-Gate

### Progress Persistence

Jeder relevante Fortschritt, Blocker, Review-Fund, Test-/CI-/Preview-Stand und nächste Schritt muss versioniert werden.

### Expert Proactivity

`docs/EXPERT_PROACTIVITY_POLICY.md` bleibt global verbindlich.

## 11. Exakter nächster Schritt

Der technische Review ist abgeschlossen.

**Jetzt entscheidet der Product Owner:**

1. weitere Produkt-/UX-Änderungen verlangen; oder
2. später ausdrücklich die Merge-Freigabe für PR #34 erteilen.

Bis dahin: **nicht mergen, nicht Mark Ready, keine Production-Migration.**

## 12. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PR34_FINAL_HUMAN_REVIEW.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND2.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND3.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND4.md`
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/EXPERT_PROACTIVITY_POLICY.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` ADR-0108/0112/0113/0114/0115/0116
