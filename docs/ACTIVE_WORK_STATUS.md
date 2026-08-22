# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34** https://github.com/Jetnity/jetnity/pull/34
- aktuellen Branch-/PR-Head vor jeder weiteren Arbeit erneut über GitHub verifizieren
- Status: **technisch umgesetzt; Human-/Architecture-Review offen; neue globale Traveller-Context-Policy muss im Review berücksichtigt werden**
- Merge: **nicht freigegeben**, PR bleibt Draft

## 2. Ziel

Eine Route, eine strukturierte Wahrheit. Länder nur aus belastbaren Airport-/Itinerary-Referenzen. Kein Raten aus Ortsnamen.

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

Route Facts sind traveller-neutral. Sie setzen keine einzelne Staatsbürgerschaft voraus und können später dieselbe Route gegen mehrere Traveller-/Credential-Profile auswerten.

## 4. Noch offen

- Human-/Architecture-/UX-Review
- ausdrückliche Product-Owner-Merge-Freigabe
- GitHub Actions / Preview gegen aktuellen finalen Branch-Head verifizieren
- kein Timatic, kein echter Provider, keine Production-Migration
- **separater zukünftiger Readiness-/Traveller-Context-Schritt vor echter Requirements-Provider-Aktivierung:** Mehrfachstaatsbürgerschaften und mehrere Reisedokumente als 1:n-Modell; nicht still in Foundation D hineinmigrieren

## 5. Letzte relevanten Änderungen / Entscheidungen

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

## 6. Tests / CI / Preview

Letzter dokumentierter Foundation-D-Nachweis:

- `npm test`: 1271 pass / 0 fail
- Typecheck, Lint, Hygiene: grün
- Production Build: grün
- `auth:pruefen`: 55/55
- Trip Workspace Audit: 726 Kombinationen, 0 Fehler, WebKit + Chromium
- Vercel Preview READY für Implementierungs-Commit `23dd548a`
- GitHub Actions CI: letzter dokumentierter PR-Lauf success auf früherem Docs-Head; aktuellen Branch-Head erneut verifizieren

Nach den neuen Governance-/Traveller-Context-Commits muss der finale technische Nachweis immer gegen den tatsächlichen aktuellen Head geprüft werden; alte grüne Runs nicht automatisch auf neue Heads übertragen.

## 7. Datenbank / RLS / Production

- keine neue Foundation-D-Migration
- Production-Schema unverändert
- Traveller-Schema in Foundation D nicht angefasst
- RLS bleibt Eigentümergrenze von `trip_items`
- aktuelles Foundation-C-`trip_travellers`-Schema hat weiterhin nur ein singuläres `nationality_country_code` + ein Dokumentprofil; das ist ein Übergangsmodell und **kein langfristiges Architekturmandat**
- Multi-Citizenship / Multi-Document braucht später einen separat reviewten 1:n-Ansatz

## 8. Kosten / Provider / Secrets

- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Flight-/Requirements-Provider aktiviert

## 9. Bekannte Risiken

- ohne Airport-Zeile bleibt Country `null`
- mehrdeutige Flüge bekommen keine Itinerary
- Official Transit bleibt ohne Provider `unknown`
- echter Requirements-Provider darf nicht produktiv aktiviert werden, bevor Multi-Citizenship / mehrere Credential-Profile fachlich und providerseitig geklärt sind
- neuer Foundation-D-Code muss im Review darauf geprüft werden, dass keine singuläre Traveller-/Passport-Annahme in Route-Schnittstellen verhärtet wurde

## 10. Offene Nutzerentscheidungen / Freigaben

- **Merge von PR #34 nicht freigegeben**
- Production-/Provider-/Kostenfreigaben getrennt und nicht erteilt
- Multi-Citizenship-/Multi-Document-Unterstützung ist verbindlich beschlossen
- globale Traveller-Context-Relevanzprüfung gilt ab jetzt für **jede relevante neue/geänderte Funktion**

## 11. Exakter nächster Schritt

1. PR #34 gegen den tatsächlichen aktuellen Head Human-/Architecture-/UX-reviewen
2. dabei ausdrücklich `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md` und `docs/CURSOR_ROUTE_TRANSIT_TRAVELLER_CONTEXT_AMENDMENT.md` prüfen
3. CI / Vercel Preview gegen finalen Head verifizieren bzw. erneut laufen lassen
4. dem Product Owner Ergebnis und Nutzerwirkung zeigen
5. Product Owner entscheidet über weitere Änderungen oder spätere Merge-Freigabe
6. **nicht mergen, nicht Mark Ready, keine Production-Migration ohne Freigabe**

## 12. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- `docs/CURSOR_ROUTE_TRANSIT_MERGE_APPROVAL_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_PROGRESS_PERSISTENCE_AMENDMENT.md`
- `docs/CURSOR_ROUTE_TRANSIT_TRAVELLER_CONTEXT_AMENDMENT.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `JETNITY_HANDOFF.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` ADR-0108/0112
