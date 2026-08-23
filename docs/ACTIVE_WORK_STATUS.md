# Jetnity – Active Work Status

Stand: 23. August 2026
Arbeitsstand: **Travel Safety & Disruption abgeschlossen; Travel Timing & Seasonal Foundation vollständig vorbereitet, Implementierung noch nicht begonnen**

## 1. Zuletzt abgeschlossener Block

**Travel Safety & Disruption Intelligence – provider-neutrale Foundation**

- PR #37: gemergt und geschlossen
- Product-Owner-Merge-Freigabe: 23.08.2026
- Squash-Merge auf `main`: `2cceee0658cc426d66974779b525c8bf9a623534`
- finaler PR-Head: `11976ed734b62ec906abd65581f309b1a38362f1`
- gelockter finaler Runtime-Head: `985cae72ef5abac4012c75c739fa00412189ad48`
- Closure-Nachweis: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_CLOSURE.md`
- final vor Merge: 1481/1481 Tests, Build 38/38, UI-Audit 886/886, CI + Vercel grün
- keine Safety-DB-/Production-Migration
- kein Live-Safety-Provider

Safety nicht erneut als Foundation bauen.

---

## 2. Nächster Block – vorbereitet, noch nicht gestartet

**Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

Verbindliche Dokumente auf `main`:

- Policy: `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
- Ist-Audit: `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ARCHITECTURE_AUDIT.md`
- Acceptance: `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`
- Cursor-Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`
- globale Provider-Regel: `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`

Die Implementierung hat **noch nicht begonnen**. Es existiert bewusst noch kein Seasonal-Feature-Branch und kein Seasonal-PR aus diesem Auftrag.

Empfohlener Branch:

`feat/travel-timing-seasonal-intelligence`

Draft-PR-Titel:

`Travel Timing & Seasonal Intelligence – provider-neutrale Foundation`

---

## 3. Verbindliche Architekturgrenzen für Seasonal

- eigene Truth-Domäne `lib/seasonal/`
- Seasonal Pattern / Official Seasonal Risk Window / Forecast Outlook getrennt
- Active Warning/Event bleibt Safety-Domäne
- Safety darf `seasonal_pattern` weiterhin nicht als Safety-Warnung anzeigen
- kanonischer Trip-/Stage-/Route-Kontext wiederverwenden
- Foundation-D-Route Truth nicht duplizieren
- Date-only und Foundation-D-Ortszeiten nicht als erfundene UTC-Instants lesen
- feinere Geo-Scopes nicht auf ganzes Land hochstufen
- Evidence, Freshness, Reference Period und Travel Window getrennt
- jährliche recurring windows inkl. Jahreswechsel deterministisch
- keine erfundenen Wetterwahrscheinlichkeiten oder „beste Monate“
- keine automatische Reiseänderung
- Guest/Account fachlich identisch
- standardmäßig compute-on-read, **keine DB-Migration**
- `seasonalProviderAus()` bleibt `null`
- kein echter Provider, keine Secrets, keine neuen laufenden Kosten

---

## 4. Workspace-Grenze

Dieser Block baut nur die minimale provider-neutrale Seasonal-Naht:

- optionale Seasonal Evaluations
- ruhige, semantisch von Safety getrennte Darstellung
- keine permanente leere Karte
- kein vorgezogener großer `Jetzt wichtig`-/Workspace-Umbau
- keine improvisierte Persistenz für `Trotzdem so planen`

Der große Function-by-Function-Workspace-Umbau bleibt später ein eigener Block.

---

## 5. Neue verbindliche Product-Owner-Entscheidung – Citizenship

Citizenship ist beim einfachen Reise-Start **nicht global verpflichtend**, wird aber zur **harten Pflichtvoraussetzung für jede Funktion, deren Official-/Regulatory-Ergebnis von Citizenship abhängt**.

- keine stille Default-Staatsbürgerschaft
- Residence / Standort / Abflugland ≠ Citizenship
- mehrere Staatsbürgerschaften pro Traveller bleiben unterstützt
- fehlen notwendige Citizenship-/Traveller-Fakten: `insufficient_context` / `unknown`

Policy: `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`

Seasonal bleibt im aktuellen Foundation-Vertrag traveller-neutral und soll Citizenship nicht unnötig anfordern.

---

## 6. Exakter nächster Schritt

Einen **neuen Cursor-Agenten** starten, weil Safety vollständig abgeschlossen ist.

Der Agent soll:

1. mit `git fetch origin` beginnen
2. `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md` vollständig lesen
3. alle dort genannten Pflichtdokumente lesen
4. neuen Feature-Branch von aktuellem `origin/main` erstellen
5. früh einen Draft PR öffnen
6. Architektur-Audit gegen tatsächlichen aktuellen Code verifizieren
7. Auftrag professionell und vollständig implementieren
8. währenddessen Handoff/Active/Acceptance/ADRs aktuell halten
9. keinen echten Provider, kein Mark Ready, kein Merge, keine Migration ausführen

Nach vollständiger Cursor-Umsetzung folgt ein unabhängiger ChatGPT-Review nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`.

---

## 7. Danach laut Roadmap

1. Travel Timing & Seasonal – provider-neutrale Foundation
2. Provider-Readiness-/Adapter-Lücken über relevante Domänen schließen
3. großer Trip-Workspace-/Übersicht-Umbau inkl. Function-by-Function-Audit
4. finaler Workspace Intelligence Audit
5. echte Providerphase
6. provider-backed End-to-End-/Truth-Audit
7. finale Startseiten-Positionierung

---

## 8. Paralleler Workstream – Admin Platform Audit

**Ersetzt Seasonal nicht.** Nur Dokumentation / Vorbereitung.

- Cursor-Anzeigename: `Admin platform audit`
- Branch: `audit/admin-platform`
- Status: Audit fertig nach Self-Review; Implementierung nicht freigegeben
- Handoff: `docs/ADMIN_PLATFORM_HANDOFF.md`
- Gesperrt: Rollen/RLS/Service-Role/Live-Integrationen/Mark Ready/Merge ohne Product Owner
- Nächster Schritt: unabhängiger ChatGPT-/Technical-Lead-Review; Slice 0 Shared Contracts; erst danach ggf. Slice A
