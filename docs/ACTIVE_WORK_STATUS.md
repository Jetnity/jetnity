# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34** https://github.com/Jetnity/jetnity/pull/34
- Implementierungs-Head: `23dd548ae05016b2a1b5011e24c3bdd9d2018f8f`
- Aktueller Branch-Head: `1eb24d241d61985d54558e6b139e83b85c5343dd` (Merge von `origin/main` `4a8a4ea6`, Progress-Persistence-Policy)
- Status: **technisch umgesetzt; Branch mit aktuellem `main` synchronisiert; GitHub Actions Verify für den Implementierungs-HEAD nachziehen**
- Merge: **nicht freigegeben**, PR bleibt Draft

## 2. Ziel

Eine Route, eine strukturierte Wahrheit. Länder nur aus Airport-Referenzen. Kein Raten aus Ortsnamen.

## 3. Bereits umgesetzt

- `lib/route/` als provider-neutrale Route-Facts-Domäne
- Persistenz in vorhandenem `trip_items.metadata`, keine Migration
- Guest- und Account-Parität über `TripItem.routeItinerary`
- `routeFactsAusReise()` liefert `flight_itinerary` bei gültiger Itinerary
- Readiness wird bei Transitänderung stale
- Flug-UI progressiv, Übersicht dezent
- Reiseänderung nennt Transitwechsel
- UI-Audit-Fixtures für Direktflug / 1 Transit / 2 Transits
- Fachdokumente, ADR-0108-Nachzug, ADR-0112

Route Facts sind traveller-neutral. Sie setzen keine einzelne Staatsbürgerschaft voraus und können später mehrere Credential-Profile gegen dieselbe Route auswerten.

## 4. Noch offen

- Human-/Architecture-Review
- ausdrückliche Product-Owner-Merge-Freigabe
- GitHub Actions Verify-Job für den aktuellen Branch-Head nachziehen (letzter grüner PR-Lauf bleibt `ea34163b`; Implementierungs-Pushes haben keinen neuen `pull_request`-Lauf erzeugt)
- kein Timatic, kein echter Provider, keine Production-Migration
- **separater zukünftiger Readiness-Schritt vor echter Requirements-Provider-Aktivierung:** Mehrfachstaatsbürgerschaften und mehrere Reisedokumente gemäß `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`; nicht still in Foundation D hineinmigrieren

## 5. Letzte relevanten Änderungen

Foundation D implementiert. Multi-Citizenship ist verbindlich beschlossen, aber nicht in diesem PR implementiert.

Neue verbindliche Product-Owner-Entscheidung: Ein Reisender kann mehrere Staatsbürgerschaften / Reisedokumente besitzen. Jetnity muss später für die konkrete Route die rechtlich zulässigen Dokumentoptionen getrennt prüfen. Gesetzliche Dokumentpflichten haben Vorrang; kein LLM-/Pass-Hopping-Raten.

## 6. Tests / CI / Preview

- `npm test`: 1271 pass / 0 fail
- Typecheck, Lint, Hygiene: grün
- Production Build: grün
- `auth:pruefen`: 55/55
- Trip Workspace Audit: 726 Kombinationen, 0 Fehler, WebKit + Chromium
- Vercel Preview READY für Implementierungs-Commit `23dd548a`: https://jetnity-16l9pmw3e-jetnity-e1b93c82.vercel.app
- GitHub Actions CI: letzter abgeschlossener PR-Lauf success auf Docs-Head `ea34163b` (https://github.com/Jetnity/jetnity/actions/runs/32571564738). Nach Rebase/Merge/Implementierung kein neuer `pull_request`-Lauf. Branch wurde mit `main` `4a8a4ea6` synchronisiert, um den dirty Merge-State zu heben und CI erneut anzustoßen.

## 7. Datenbank / RLS / Production

- keine neue Migration
- Production-Schema unverändert
- Traveller-Schema nicht angefasst
- RLS bleibt Eigentümergrenze von `trip_items`
- aktuelles Foundation-C-`trip_travellers`-Schema hat weiterhin nur ein singuläres `nationality_country_code` + ein Dokumentprofil; Multi-Citizenship benötigt später einen separat reviewten 1:n-Ansatz, nicht Teil des aktuellen PR-#34-DB-Scopes

## 8. Kosten / Provider / Secrets

- keine neuen Secrets, keine neuen laufenden Kosten
- kein Flight-/Requirements-Provider aktiviert

## 9. Bekannte Risiken

- ohne Airport-Zeile bleibt Country `null`
- mehrdeutige Flüge bekommen keine Itinerary
- Official Transit bleibt ohne Provider `unknown`
- ein echter Requirements-Provider darf nicht produktiv aktiviert werden, bevor Mehrfachstaatsbürgerschaft / mehrere Dokumentprofile fachlich und providerseitig geklärt sind

## 10. Offene Nutzerentscheidungen / Freigaben

- **Merge von PR #34 nicht freigegeben**
- Production-/Provider-/Kostenfreigaben getrennt und nicht erteilt
- Multi-Citizenship-/Multi-Document-Unterstützung ist **verbindlich beschlossen**, aber die konkrete Schema-/Implementierungsfreigabe folgt in einem eigenen Readiness-Schritt vor echter Provider-Aktivierung

## 11. Exakter nächster Schritt

1. Human-/Architecture-Review von PR #34
2. Product Owner entscheidet über Änderungen oder Merge-Freigabe
3. nicht mergen, nicht Mark Ready, keine Production-Migration
4. nach Foundation-D-Review die Multi-Citizenship-Erweiterung als eigenen Readiness-Arbeitsblock einplanen, bevor Timatic/Requirements produktiv aktiviert wird

## 12. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- `docs/CURSOR_ROUTE_TRANSIT_MERGE_APPROVAL_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_PROGRESS_PERSISTENCE_AMENDMENT.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` ADR-0108/0112
