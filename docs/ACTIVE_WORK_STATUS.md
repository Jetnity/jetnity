# Jetnity – Active Work Status

Stand: 23. August 2026
Arbeitsstand: **Travel Safety & Disruption Foundation abgeschlossen; nächster neuer Block noch nicht begonnen**

## 1. Zuletzt abgeschlossener Block

**Travel Safety & Disruption Intelligence – provider-neutrale Foundation**

- PR #37: gemergt
- Product-Owner-Merge-Freigabe: 23.08.2026
- Squash-Merge auf `main`: `2cceee0658cc426d66974779b525c8bf9a623534`
- finaler PR-Head: `11976ed734b62ec906abd65581f309b1a38362f1`
- gelockter finaler Runtime-Head: `985cae72ef5abac4012c75c739fa00412189ad48`
- Closure-Nachweis: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_CLOSURE.md`
- Fachdokument: `docs/TRAVEL_SAFETY_DISRUPTION.md`
- Acceptance: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ACCEPTANCE.md`

## 2. Technischer Abschlussnachweis

Finaler Runtime-Stand vor Merge:

- `npm test`: **1481/1481**
- Typecheck, Lint, Hygiene: grün
- Production-Build: **38/38**, inkl. `/api/safety/evaluate`
- Trip-Workspace-UI-Audit: **886/886**, 0 Fehler
- WebKit + Chromium, 8 Viewports
- GitHub Actions: **SUCCESS**
- Vercel Preview: **READY/SUCCESS**
- Branch vor Merge: **0 behind** zu `main`

Nach Merge:

- Vercel auf Merge-Commit `2cceee06…`: **SUCCESS**
- keine Safety-Datenbankmigration
- keine Production-Migration erforderlich
- Production-Schema unverändert

## 3. Safety-Produktgrenzen

- `safetyProviderAus()` bleibt `null`
- kein Live-Safety-/Disruption-Provider
- keine neuen Secrets oder laufenden Providerkosten
- kein Browser-/LLM-Pfad darf Official Safety Evidence erzeugen
- keine automatische Reiseänderung
- `seasonal_pattern` bleibt getrennt von akuter Safety

Bekannte Nicht-Blocker / spätere Gates:

- persistentes globales Rate-Limit vor echtem kostenpflichtigem Production-Provider
- Account-`tripId`-Serverload als spätere Integrationsnaht
- title-only Geo bleibt `unknown`
- minutengenaue lokale Route-Truth braucht später belastbare IANA-Zone oder UTC-Offset in Foundation D

## 4. Neue verbindliche Product-Owner-Entscheidung

Citizenship ist beim einfachen Reise-Start **nicht global verpflichtend**, wird aber zur **harten Pflichtvoraussetzung für jede Funktion, deren Official-/Regulatory-Ergebnis von Citizenship abhängt**.

- keine stille Default-Staatsbürgerschaft
- Residence / Standort / Abflugland ≠ Citizenship
- mehrere Staatsbürgerschaften pro Traveller bleiben unterstützt
- fehlen notwendige Citizenship-/Traveller-Fakten: `insufficient_context` / `unknown`, keine erfundene regulatorische Wahrheit

Policy: `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`

## 5. Aktuell offen

Der nächste neue Entwicklungsblock hat **noch nicht begonnen**.

Nächste Priorität gemäß `ROADMAP.md`:

**Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

Danach:

1. Provider-Readiness-/Adapter-Lücken über relevante Domänen schließen
2. großer Trip-Workspace-/Übersicht-Umbau inklusive vollständigem Function-by-Function-Audit aller bestehenden und neuen Funktionen
3. finaler Workspace Intelligence Audit
4. echte Providerphase
5. provider-backed End-to-End-/Truth-Audit
6. finale Startseiten-Positionierung

## 6. Exakter nächster Schritt

Vor neuer Implementierung:

1. aktuellen `main`-/CI-/Vercel-/Production-Stand erneut prüfen
2. `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md` vollständig lesen
3. Architektur-/Ist-Audit für Seasonal gegen Safety, Route, Traveller Context, Readiness und Workspace erstellen
4. versionierten Cursor-Auftrag für die provider-neutrale Seasonal Foundation erstellen
5. neuer Feature-Branch + Draft PR; kein echter Provider, kein Merge ohne Product-Owner-Freigabe

## 7. Zuerst zu lesen

1. `JETNITY_HANDOFF.md`
2. `ROADMAP.md`
3. `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_CLOSURE.md`
4. `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
5. `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`
