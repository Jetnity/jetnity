# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34** https://github.com/Jetnity/jetnity/pull/34
- Implementierungs-Head: `23dd548ae05016b2a1b5011e24c3bdd9d2018f8f`
- Nachgezogener Docs-Head: `68bcb04984521beb24272e63027b93f67adf1c1e`
- Status: **technisch umgesetzt und lokal/preview geprüft; wartet auf Human-/Architecture-Review und Product-Owner-Freigabe**
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
- GitHub Actions Verify-Job für den Implementierungs-Head in der PR-Run-Liste nachziehen
- kein Timatic, kein echter Provider, keine Production-Migration
- Multi-Citizenship-/Multi-Document-Readiness: eigener späterer Block, siehe `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`

## 5. Letzte relevanten Änderungen

Foundation D implementiert. Anschließend Docs-Commit für Multi-Citizenship-Amendment (nicht implementiert, nur bindend dokumentiert).

## 6. Tests / CI / Preview

- `npm test`: 1271 pass / 0 fail
- Typecheck, Lint, Hygiene: grün
- Production Build: grün
- `auth:pruefen`: 55/55
- Trip Workspace Audit: 726 Kombinationen, 0 Fehler, WebKit + Chromium
- Vercel Preview READY: https://jetnity-16l9pmw3e-jetnity-e1b93c82.vercel.app
- GitHub Actions CI: letzter abgeschlossener PR-Lauf success auf Docs-Head `ea34163b`; Implementierungs-Commits hatten zum Prüfzeitpunkt Vercel READY

## 7. Datenbank / RLS / Production

- keine neue Migration
- Production-Schema unverändert
- Traveller-Schema nicht angefasst

## 8. Kosten / Provider / Secrets

- keine neuen Secrets, keine neuen laufenden Kosten
- kein Flight-/Requirements-Provider aktiviert

## 9. Bekannte Risiken

- ohne Airport-Zeile bleibt Country `null`
- mehrdeutige Flüge bekommen keine Itinerary
- Official Transit bleibt ohne Provider `unknown`

## 10. Offene Nutzerentscheidungen / Freigaben

- **Merge von PR #34 nicht freigegeben**
- Production-/Provider-/Kostenfreigaben getrennt und nicht erteilt

## 11. Exakter nächster Schritt

1. Human-/Architecture-Review von PR #34
2. Product Owner entscheidet über Änderungen oder Merge-Freigabe
3. nicht mergen, nicht Mark Ready, keine Production-Migration

## 12. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `JETNITY_HANDOFF.md`, `ROADMAP.md`, ADR-0108/0112
