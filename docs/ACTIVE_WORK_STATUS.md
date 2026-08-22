# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34 – Foundation D – Route & Transit Intelligence**
- Head: nach Push erneut über GitHub verifizieren
- Status: **technisch umgesetzt; offizieller DoD-Lauf (Tests/CI/Preview) folgt; wartet nicht auf neue Fachfeatures**
- Merge: **nicht freigegeben**, PR bleibt Draft

## 2. Ziel

Eine Route, eine strukturierte Wahrheit: Origin, Destination, Segmente, Multi-Transit, Connection Duration und Evidence nur aus validierten Flight-Itineraries. Kein Raten aus Ortsnamen.

## 3. Bereits umgesetzt

- `lib/route/` als provider-neutrale Route-Facts-Domäne
- Persistenz in vorhandenem `trip_items.metadata` als `{ routeItinerary }`, keine Migration
- Guest- und Account-Parität über `TripItem.routeItinerary`
- Konto-Übernahme löst IATA-Länder serverseitig aus `public.airports`
- `routeFactsAusReise()` liefert `flight_itinerary`, sobald eine Itinerary existiert
- Readiness-Fingerprint wird bei Transitänderung stale; ohne Route bleibt er bitgleich
- Flug-UI progressiv (`FlugRoute`), Übersicht eine dezente Zeile
- Reiseänderung nennt Transitwechsel
- Mobility rät Connection/Airport Change nicht aus Titeln
- UI-Audit-Fixtures `route-direkt`, `route-ein-transit`, `route-zwei-transits`
- Fachdokumente, ADR-0108-Nachzug, ADR-0112

## 4. Noch offen

- vollständiger DoD-Lauf: `npm test`, Typecheck, Lint, Hygiene, Production Build, Auth-Checks, Trip-Workspace-Audits WebKit/Chromium, GitHub CI, Vercel Preview
- Human-/Architecture-Review
- ausdrückliche Product-Owner-Merge-Freigabe
- kein Timatic, kein echter Provider, keine Production-Migration
- **separater zukünftiger Readiness-Schritt vor echter Requirements-Provider-Aktivierung:** Mehrfachstaatsbürgerschaften und mehrere Reisedokumente pro Traveller gemäß `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`; nicht still in Foundation D hineinmigrieren

## 5. Letzte relevanten Änderungen

Implementierung der Route Truth plus Dokumentation. Branch wurde auf aktuellen `main` rebased und mit den späteren Progress-Persistence-Commits des Feature-Branches zusammengeführt.

Neue verbindliche Product-Owner-Entscheidung: Ein Reisender kann mehrere Staatsbürgerschaften / Reisedokumente besitzen. Jetnity muss später für die konkrete Route die **rechtlich zulässigen** Dokumentoptionen getrennt prüfen und belegte Einreise-/Visa-/Transitvorteile verständlich vergleichen. Gesetzliche Dokumentpflichten haben Vorrang; kein LLM-/Pass-Hopping-Raten. Details: `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`.

## 6. Tests / CI / Preview

Fokustests lokal grün (Route 1–14, Persistenz, Readiness, Flüge, Trip-Schema, Änderungsschutz). Der verbindliche Gesamt-DoD-Lauf ist noch nicht als Nachweis eingetragen.

## 7. Datenbank / RLS / Production

- keine neue Migration
- keine neue Tabelle/Spalte
- Production-Schema unverändert
- RLS bleibt Eigentümergrenze von `trip_items`
- aktuelles Foundation-C-`trip_travellers`-Schema hat weiterhin nur ein singuläres `nationality_country_code` + ein Dokumentprofil; Multi-Citizenship benötigt später einen separat reviewten 1:n-Ansatz, nicht Teil des aktuellen PR-#34-DB-Scopes

## 8. Kosten / Provider / Secrets

- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Flight-/Requirements-Provider aktiviert
- keine Fake-Routen

## 9. Bekannte Risiken

- ohne Airport-Zeile bleibt Country `null`
- mehrdeutige Flüge bekommen keine Itinerary
- `reise_anlegen()` schreibt Metadata nicht selbst
- Official Transit bleibt ohne Provider `unknown`
- ein echter Requirements-Provider darf nicht produktiv aktiviert werden, bevor Mehrfachstaatsbürgerschaft / mehrere Dokumentprofile fachlich und providerseitig geklärt sind

## 10. Offene Nutzerentscheidungen / Freigaben

- **Merge von PR #34 nicht freigegeben**
- Production-/Provider-/Kostenfreigaben getrennt und nicht erteilt
- Multi-Citizenship-/Multi-Document-Unterstützung ist **verbindlich beschlossen**, aber die konkrete Schema-/Implementierungsfreigabe folgt in einem eigenen Readiness-Schritt vor echter Provider-Aktivierung

## 11. Exakter nächster Schritt

1. Branch pushen, PR #34 Draft lassen
2. DoD-Tests, Audits, CI und Vercel Preview ausführen und hier nachtragen
3. auf Human-/Architecture-Review und Product-Owner-Entscheidung warten
4. nicht mergen, nicht Mark Ready
5. nach Foundation-D-Review die Multi-Citizenship-Erweiterung als eigenen Readiness-Arbeitsblock einplanen, bevor Timatic/Requirements produktiv aktiviert wird

## 12. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- `docs/CURSOR_ROUTE_TRANSIT_MERGE_APPROVAL_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_PROGRESS_PERSISTENCE_AMENDMENT.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` ADR-0108/0112
