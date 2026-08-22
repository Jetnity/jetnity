# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34** https://github.com/Jetnity/jetnity/pull/34
- Implementierungs-Head: `23dd548ae05016b2a1b5011e24c3bdd9d2018f8f`
- Persistenz-Fix-Head: `6cbe39f3a96fd425b2e0e60ef33c3c206432ed81`
- letzter vor Round-2 verifizierter Branch-/PR-Head: `69f903e6b5f6717d381471aaa8f8ddd8724bdef2`
- Round-2-Review-Dokument: Commit `0837a9a1cab31b9788fdd0203b59a90d4851bd0b`
- aktuellen Branch-/PR-Head vor jeder weiteren Arbeit erneut über GitHub verifizieren
- Status: **erster Persistenz-Blocker behoben; erneutes Human-/Truth-Review hat einen zweiten Trust-Boundary-Blocker gefunden: Browser-/Local-Storage-Country-Facts dürfen nicht als Route Truth persistiert werden**
- Merge: **nicht freigegeben**, PR bleibt Draft

## 2. Ziel

Eine Route, eine strukturierte Wahrheit. Länder nur aus belastbaren Airport-/Itinerary-Referenzen. Kein Raten aus Ortsnamen und keine Country-Truth aus Client-/Browserdaten.

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
- Fachdokumente, ADR-0108-Nachzug, ADR-0112/0113

Route Facts sind traveller-neutral. Sie setzen keine einzelne Staatsbürgerschaft voraus und können später dieselbe Route gegen mehrere Traveller-/Credential-Profile auswerten.

## 4. Human Review Round 1 – Persistenz-Blocker behoben

Verbindlicher Review-Nachtrag:

- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`

Umgesetzt:

- `reise_anlegen()` schreibt validierte `route_itinerary` in derselben Transaktion nach `trip_items.metadata`
- Helper `flug_route_itinerary_metadata()` ist strukturell fail-closed
- TypeScript-Nachlauf ist fail-closed Recovery; kein stilles `ok` bei Lesen-/Schreib-/Unvollständigkeitsfehler
- Retry bleibt über `client_ref` idempotent
- Development-Migration `20260822130000_reise_anlegen_route_itinerary.sql` angewendet
- Production nicht migriert

## 5. Human / Truth Review Round 2 – BLOCKER offen

Verbindlicher Review-Nachtrag:

- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND2.md`

### Fund

`gastreiseUebernehmen()` akzeptiert Browser-/Local-Storage-Nutzlasten. Das Route-Schema und die SQL-Helferfunktion prüfen `airportCode` / `countryCode` / `city` / `country` derzeit nur strukturell. Die Development-RPC kann deshalb formal gültige, aber fachlich falsche Client-Country-/Display-Facts in `trip_items.metadata` persistieren.

`routeFactsAusGraph()` behandelt diese persistierte Itinerary anschließend als `quelle: 'flight_itinerary'` und speist Origin-/Destination-/Transit-Countries in Readiness.

Das verletzt die Foundation-D-Truth-Boundary.

### Verbindlicher Fix

Vor Persistenz muss jede clientseitig kommende Route serverseitig kanonisiert werden:

- alle IATA-Codes über alle Legs/Segmente sammeln;
- ein Batch-Lookup gegen `public.airports`;
- Route-Punkte aus IATA + serverseitiger Referenz neu bilden;
- Clientwerte `countryCode`, `city`, `country` verwerfen;
- unbekannte / nicht verfügbare Referenz → `null`/unknown, niemals Client-Fallback;
- kanonisierte Nutzlast sowohl an RPC als auch Recovery übergeben;
- kein N+1;
- direkte Account-Flugübernahme darf nicht regressieren.

## 6. Noch offen

- Round-2-Truth-Boundary-Fix gemäß `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND2.md`
- Pflicht-Tests gegen manipulierte Client-Country-/City-Facts
- kompletter DoD-Lauf nach dem Fix
- erneutes Human-/Architecture-/UX-/Security-/Truth-Review gegen den tatsächlichen finalen Head
- Product Owner erhält danach Ergebnis/Nutzerwirkung und kann weitere Änderungen verlangen
- ausdrückliche Product-Owner-Merge-Freigabe bleibt erforderlich
- kein Timatic, kein echter Provider, keine Production-Migration
- **separater zukünftiger Readiness-/Traveller-Context-Schritt vor echter Requirements-Provider-Aktivierung:** Mehrfachstaatsbürgerschaften und mehrere Reisedokumente als 1:n-Modell; nicht still in Foundation D hineinmigrieren

## 7. Letzte relevante globale Entscheidungen

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

## 8. Letzter grüner Nachweis vor Round-2-Fix

Auf Head `69f903e6` / Code-Fix `6cbe39f3`:

- `npm test`: 1284 pass / 0 fail
- Typecheck, Lint, Hygiene: grün
- Production Build: grün
- `auth:pruefen`: 55/55
- Development-Migration `20260822130000_reise_anlegen_route_itinerary.sql` angewendet
- `db:rechte`: OK (43 Tabellenrechte)
- `db:rls`: grün
- `db:sicherheit`: 185/185
- Trip Workspace Audit: 726 Kombinationen, 0 Fehler, WebKit + Chromium
- Vercel Preview READY
- GitHub Actions CI success

Diese Nachweise gelten **nicht automatisch** für den kommenden Round-2-Code-Fix. Danach vollständig neu verifizieren.

## 9. Datenbank / RLS / Production

Direkt verifiziert am 22.08.2026:

- Development (`yfvbxvijcorffwxbxahl`) enthält `20260822130000 reise_anlegen_route_itinerary`
- Production (`qscbgcdmivbbnzrcyegn`) endet weiterhin bei `20260822020000 trip_travellers`
- Production ist also **nicht** mit Foundation-D-RPC migriert
- Traveller-Schema in Foundation D nicht angefasst
- **Production nicht migrieren** ohne separate Freigabe

## 10. Kosten / Provider / Secrets

- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Flight-/Requirements-Provider aktiviert

## 11. Bekannte spätere Expert-Funde

Kein Round-2-Blocker:

- ohne Airport-Zeile bleibt Country `null`
- mehrdeutige Flüge bekommen keine Itinerary
- Official Transit bleibt ohne Provider `unknown`
- echter Requirements-Provider darf nicht produktiv aktiviert werden, bevor Multi-Citizenship / mehrere Credential-Profile fachlich und providerseitig geklärt sind
- Gesamt-Destination-Regel vor First-Class-Multi-City/Open-Jaw explizit am Graphende definieren
- zeitabhängiges Connection-Risk später in eigene Logik/Fingerprint aufnehmen, nicht die Readiness-Route-Wahrheit damit vermischen

## 12. Offene Nutzerentscheidungen / Freigaben

- **Merge von PR #34 nicht freigegeben**
- Production-/Provider-/Kostenfreigaben getrennt und nicht erteilt
- Multi-Citizenship-/Multi-Document-Unterstützung ist verbindlich beschlossen
- globale Traveller-Context-Relevanzprüfung gilt für jede relevante neue/geänderte Funktion
- Round-2-Fix liegt innerhalb Foundation-D-Truth-/Security-Scope; keine Production-Freigabe daraus ableiten

## 13. Exakter nächster Schritt

1. Cursor liest `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND2.md` und diesen Status
2. serverseitige Route-Kanonisierung implementieren und alle Pflicht-Tests ergänzen
3. vollständigen DoD-Lauf / CI / Preview erneut durchführen und dokumentieren
4. ChatGPT führt erneuten Human-/Architecture-/UX-/Security-/Truth-Review aus
5. Product Owner sieht Ergebnis und entscheidet über weitere Änderungen oder spätere Merge-Freigabe
6. **nicht mergen, nicht Mark Ready, keine Production-Migration ohne Freigabe**

## 14. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND2.md`
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
- `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` ADR-0108/0112/0113
