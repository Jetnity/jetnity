# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34** https://github.com/Jetnity/jetnity/pull/34
- Implementierungs-Head: `23dd548ae05016b2a1b5011e24c3bdd9d2018f8f`
- Persistenz-Fix-Head: `6cbe39f3a96fd425b2e0e60ef33c3c206432ed81`
- verifizierter Branch-/PR-Head: `69f903e6b5f6717d381471aaa8f8ddd8724bdef2`
- aktuellen Branch-/PR-Head vor jeder weiteren Arbeit erneut über GitHub verifizieren
- Status: **Review-Blocker Guest→Account-Route-Persistenz umgesetzt; CI/Preview auf `69f903e6` grün; erneutes Human-Review offen**
- Merge: **nicht freigegeben**, PR bleibt Draft

## 2. Ziel

Eine Route, eine strukturierte Wahrheit. Länder nur aus belastbaren Airport-/Itinerary-Referenzen. Kein Raten aus Ortsnamen.

## 3. Bereits umgesetzt

- `lib/route/` als provider-neutrale Route-Facts-Domäne
- Persistenz in vorhandenem `trip_items.metadata`; Development-RPC schreibt die Itinerary atomar (ADR-0113)
- `routeFactsAusReise()` liefert `flight_itinerary` bei gültiger Itinerary
- Guest→Account: gültige Route bleibt erhalten oder die Übernahme gilt nicht als vollständig erfolgreich
- Readiness wird bei Transitänderung stale
- Flug-UI progressiv, Übersicht dezent
- Reiseänderung nennt Transitwechsel
- UI-Audit-Fixtures für Direktflug / 1 Transit / 2 Transits
- Fachdokumente, ADR-0108-Nachzug, ADR-0112

Route Facts sind traveller-neutral. Sie setzen keine einzelne Staatsbürgerschaft voraus und können später dieselbe Route gegen mehrere Traveller-/Credential-Profile auswerten.

## 4. Human-/Architecture-Review – Blocker umgesetzt

Verbindlicher Review-Nachtrag:

- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`

Umgesetzt:

- `reise_anlegen()` schreibt validierte `route_itinerary` in derselben Transaktion nach `trip_items.metadata`
- Helper `flug_route_itinerary_metadata()` ist fail-closed
- TypeScript-Nachlauf ist fail-closed Recovery; kein stilles `ok` bei Lesen-/Schreib-/Unvollständigkeitsfehler
- Retry bleibt über `client_ref` idempotent
- Development-Migration `20260822130000_reise_anlegen_route_itinerary.sql` angewendet
- Production nicht migriert

## 5. Noch offen

- Human-/Architecture-/UX-/Security-Re-Review gegen `69f903e6` bzw. den tatsächlichen aktuellen Head
- Product Owner erhält danach erneut Ergebnis/Nutzerwirkung und kann weitere Änderungen verlangen
- ausdrückliche Product-Owner-Merge-Freigabe bleibt erforderlich
- kein Timatic, kein echter Provider, keine Production-Migration
- **separater zukünftiger Readiness-/Traveller-Context-Schritt vor echter Requirements-Provider-Aktivierung:** Mehrfachstaatsbürgerschaften und mehrere Reisedokumente als 1:n-Modell; nicht still in Foundation D hineinmigrieren

## 6. Letzte relevanten Änderungen / Entscheidungen

### Globale Traveller Context Intelligence Policy

Der Product Owner hat verbindlich entschieden:

> **Traveller Context Intelligence muss bei jeder relevanten Jetnity-Funktion berücksichtigt werden.**

Global verbindlich auf `main`:

- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `.cursor/rules/jetnity-traveller-context.mdc`

Foundation-D-spezifisch:

- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_TRAVELLER_CONTEXT_AMENDMENT.md`

Konsequenz: Keine relevante Funktion darf still nur eine Staatsbürgerschaft / einen Pass / ein Credential als universelle Dauerannahme verwenden, wenn mehrere rechtlich nutzbare Optionen das Ergebnis verändern können. Wo Traveller-Kontext nicht relevant ist, sollen keine unnötigen Daten erhoben werden.

### Merge-Gate

Technisch fertig = review-bereit. **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**

### Progress Persistence

Jeder relevante Fortschritt, Blocker, Review-Fund, Test-/CI-/Preview-Stand und nächste Schritt muss versioniert werden.

### Expert Proactivity

Global verbindlich: `docs/EXPERT_PROACTIVITY_POLICY.md`. Foundation-D-Nachtrag: `docs/CURSOR_ROUTE_TRANSIT_EXPERT_PROACTIVITY_AMENDMENT.md`. Senior Expert Pass siehe `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`.

### Human Review

ChatGPT stuft Senior-Expert-Fund 1 höher ein als der Cursor-Abschlussbericht: Weil Guest-/Account-Parität ausdrücklich Teil des ursprünglichen Tasks ist, muss der stille Route-Verlust **vor Merge** behoben werden, nicht erst irgendwann vor Production.

Senior-Expert-Fund 2 (Gesamt-Destination bei späterem Open-Jaw/Multi-City) und Fund 3 (zeitabhängiger Connection-Risk-Fingerprint) bleiben bewusst spätere Fachblöcke und sind kein PR-#34-Blocker.

## 7. Tests / CI / Preview

Nachweis nach Persistenz-Fix und Architektur-Nachzug (`69f903e6`):

- `npm test` auf Code-Head `6cbe39f3`: 1284 pass / 0 fail
- Typecheck, Lint, Hygiene: grün
- Production Build: grün
- `auth:pruefen`: 55/55
- `db:anwenden` Development: `20260822130000_reise_anlegen_route_itinerary.sql` angewendet
- `db:rechte`: OK (43 Tabellenrechte)
- `db:rls`: grün
- `db:sicherheit`: 185/185
- Trip Workspace Audit: 726 Kombinationen, 0 Fehler, WebKit + Chromium
- Vercel Preview READY für `69f903e6`: https://jetnity-hmdtw8ime-jetnity-e1b93c82.vercel.app
- GitHub Actions CI **success** auf `69f903e6`: https://github.com/Jetnity/jetnity/actions/runs/32575412251
- Draft-PR #34 mergeable / CLEAN; das ist keine Merge-Freigabe

## 8. Datenbank / RLS / Production

- Development: `20260822130000_reise_anlegen_route_itinerary.sql` angewendet
- Production-Schema unverändert
- Traveller-Schema in Foundation D nicht angefasst
- RLS bleibt Eigentümergrenze von `trip_items`
- **Production nicht migrieren** ohne separate Freigabe

Aktuelles Foundation-C-`trip_travellers`-Schema hat weiterhin nur ein singuläres `nationality_country_code` + ein Dokumentprofil; das ist ein Übergangsmodell und kein langfristiges Architekturmandat. Multi-Citizenship / Multi-Document braucht später einen separat reviewten 1:n-Ansatz.

## 9. Kosten / Provider / Secrets

- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Flight-/Requirements-Provider aktiviert

## 10. Bekannte Risiken / spätere Expert-Funde

- ohne Airport-Zeile bleibt Country `null`
- mehrdeutige Flüge bekommen keine Itinerary
- Official Transit bleibt ohne Provider `unknown`
- echter Requirements-Provider darf nicht produktiv aktiviert werden, bevor Multi-Citizenship / mehrere Credential-Profile fachlich und providerseitig geklärt sind
- Gesamt-Destination-Regel vor First-Class-Multi-City/Open-Jaw explizit am Graphende definieren
- zeitabhängiges Connection-Risk später in eigene Logik/Fingerprint aufnehmen, nicht die Readiness-Route-Wahrheit damit vermischen

## 11. Offene Nutzerentscheidungen / Freigaben

- **Merge von PR #34 nicht freigegeben**
- Production-/Provider-/Kostenfreigaben getrennt und nicht erteilt
- Multi-Citizenship-/Multi-Document-Unterstützung ist verbindlich beschlossen
- globale Traveller-Context-Relevanzprüfung gilt für jede relevante neue/geänderte Funktion
- Review-Fix selbst liegt innerhalb des bereits freigegebenen Foundation-D-Scopes; eine mögliche Production-Anwendung einer RPC-Migration ist **nicht** freigegeben

## 12. Exakter nächster Schritt

1. ChatGPT führt den erneuten Human-/Architecture-/UX-/Security-Review gegen `69f903e6` bzw. den tatsächlichen Head durch
2. Product Owner sieht Ergebnis/Nutzerwirkung und kann Änderungen verlangen
3. **nicht mergen, nicht Mark Ready, keine Production-Migration ohne Freigabe**

## 13. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CURSOR_PR34_HUMAN_REVIEW_FIXES.md`
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
