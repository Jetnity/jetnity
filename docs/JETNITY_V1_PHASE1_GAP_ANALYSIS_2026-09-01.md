# Jetnity V1 – Phase-1 Gap Analysis

Stand: 1. September 2026  
Status: **CURRENT PRODUCT-PLANNING EVIDENCE / NO RUNTIME AUTHORIZATION**  
Baseline: `main@6891cab6b204e6e6093a7002d7cad9b4afc692cc`

## Bewertungslegende

- **DONE** – fachlicher Kern für Phase 1 ist integriert; Release-QA kann trotzdem noch offen sein.
- **FOUNDATION ONLY** – professionelle Architektur/Ports/UI-Nähte existieren, aber reale V1-Wirkung fehlt.
- **PARTIAL** – nutzbarer Runtime-Anteil existiert, aber V1-Definition ist noch nicht vollständig.
- **BLOCKED** – Restarbeit hängt an externem/PO-/Production-/Truth-Gate.
- **MISSING** – Phase-1-Produktfläche ist noch nicht belastbar nachgewiesen oder nicht gebaut.

`DONE` bedeutet **nicht automatisch Release Ready**. Der V1 Release Readiness Gate bleibt separat.

## Phase-1 Kernmatrix

| Bereich | Status | Bereits belastbar vorhanden | Für V1 noch nötig |
| --- | --- | --- | --- |
| Trip Workspace | **PARTIAL / weit fortgeschritten** | TW-1/2/3/4/5, TW6-A/B, Visitor Search, TW7-A; Reisegraph, Tages-/Etappen-/Gap-Logik | TW-8 reale Commercial Truth Integration, TW-9 Polish/Closure, vollständige V1-E2E-Journey |
| Guest → Account / Account | **PARTIAL / stark** | Guest-Trip, Übernahme, Account Home, Reisen, Security-Slices, Archiv; RLS/Ownership-Grundlage | V1-spezifische Privacy/Legal/Consent/Export/Delete-/Support-Lücken live revalidieren und nur releasekritische Teile schließen |
| Account Traveller Registry | **DONE für Kernarchitektur** | AP7 Gate0 + S1–S4: Persistenz, owner-only RLS, CRUD/UI, Registry→unabhängiger Trip Snapshot | Release-/E2E-Prüfung; keine Neubauplanung |
| Multi-Citizenship / Multi-Document | **DONE Foundation / PARTIAL Produktwirkung** | Foundation E, mehrere Citizenship-/Document-Children, Relations, keine first-item Truth, Credential Options, Document Lifecycle | reale Official-Evidence-basierte Eignung/Vorteilsbewertung pro konkreter Reise |
| Route / Transit / Multi-Destination | **DONE Foundation / starke Runtime** | Foundation D, Trip Stages, Multi-Destination, Transit-/Route-Truth-Grundsätze | V1-E2E gegen echte Provider-/Entry-Evidence und Änderungsfälle |
| Flights | **FOUNDATION ONLY / BLOCKED** | Flight-Domain, Suche-/Ranking-/Nachweis-/Provenance-/Temporal Foundations | Provider Readiness abschließen; PO-Providergate; realer Flight-Provider; echter Server-Snapshot; Writer/Read Path; Workspace/TW-8 |
| Hotels / Accommodation | **FOUNDATION ONLY / BLOCKED** | provider-neutrale Hotel-Domain, Quartierlogik, Ranking, Workspace, Nachweisnaht, sichere Übernahme | echter Provider/Affiliatepfad, Nachweis, Commercial Provenance, Persistenz/Weiterleitung, Production Readiness |
| Activities / Experiences | **FOUNDATION ONLY / BLOCKED** | provider-neutrale Domain, Tageskontext, Ranking, Konfliktlogik, Workspace, Nachweisnaht | realer Provider/Partnerzugang, belastbare Availability/Commercial Truth, Provenance, Weiterleitung; ggf. explizite PO Launch Exception bei externem Blocker |
| Entry Requirements | **PARTIAL / BLOCKED für Hard Truth** | Foundation C/E, detaillierter Requirement-Vertrag, Official Actions, Checklist, temporal contracts/projections, fail-closed semantics | echter Official-Truth-Provider bzw. belastbare Official Evidence, Production-runtime wiring, realer End-to-End-Nachweis |
| Temporal Readiness / Companion | **FOUNDATION ONLY / PARTIAL** | E4/E5 temporal rules/projection, Flight event evidence/provenance payload mint, Readiness workspace foundations | realer Event-/Official-Truth-Input, sichere Persistenz/Resolver, Tasks/Action State und V1-In-App-Companion ohne geratene Deadlines |
| Intelligenter Reiseassistent | **PARTIAL** | strukturierter Reisevorschlag und Reiseänderung, strict schema, Human Approval, Cost Guard; Preview-Fähigkeit | V1 Production-Betriebsentscheidung, Truth-aware In-Trip Assistance, E2E/Failure/Cost/Privacy QA; keine Provider-/Official-Erfindung |
| Destination Essentials | **MISSING PRODUCT SURFACE / Foundations reusebar** | Safety/Disruption und Seasonal Foundations, Entry-Requirement-Truth-Architektur | klar begrenzte V1-Länder-/Destination-Essentials-Fläche mit Official Links/Safety/praktischer Vorbereitung und Truth-Klassen |
| World Map | **MISSING** | keine belastbare aktuelle Produktfläche im Live-Audit gefunden | einfache accountgebundene Karte für geplante und besuchte Orte/Länder; kein Social Scope |
| Mobile Web | **PARTIAL / stark** | mobile-first Standards und umfangreiche responsive/browserbezogene Arbeit in Kernflächen | vollständige V1 Real-Device-/Browser-Journey, Performance und Accessibility Gate |
| PWA | **INSUFFICIENT EVIDENCE / vermutlich MISSING als eigener Release-Vertrag** | mobile Web vorhanden | Installability/manifest/service-worker/offline/freshness Scope explizit auditieren; nur benötigte V1-PWA-Fähigkeit bauen |
| Admin / Operations | **PARTIAL / starkes Minimum vorhanden** | Admin A–C, System Health, Security/Users, Provider/Cost Board, AAL2 | Phase-1-Ops-Minimum gegen aktuelle Live-Wirkung revalidieren: incidents/logging/analytics/cost/revenue/audit/support; kein Full D–K Growth OS nötig |
| Monetarisierung | **FOUNDATION ONLY / PARTIAL** | Commercial Provenance contracts/persistence, affiliate-orientierte Produktarchitektur, D0/G0-nahe Foundations | reale Provider-/Referral-Weiterleitungen, Revenue Attribution, Conversion Measurement und schlanke Premium-Grenzen soweit V1 wirtschaftlich nötig |
| V1 Release Readiness | **MISSING als formaler Gesamtgate** | viele einzelne CI/Security/QA-Gates vorhanden | neuer verbindlicher V1 Release Readiness Gate + Alpha/Beta/Swiss Launch-Abnahme |

## Bereits Phase-1-reif genug, um nicht neu gebaut zu werden

Folgende Grundlagen werden **wiederverwendet**, nicht wegen der neuen Phasen neu entworfen:

- Trip-Persistenz und gemeinsamer Reisegraph;
- Foundation C/D/E;
- Trip Workspace TW-1–TW7-A integrierte Teile;
- Guest→Account-Grundlage;
- Account Home/Trips/Security bereits integrierte Slices;
- AP7 Account Traveller Registry S1–S4;
- Traveller 1:n Citizenship/Document Contracts und Document-Lifecycle-Grundlage;
- Admin A–C und Admin-AAL2;
- Provider S1–S3, S5 Commercial Provenance Foundations;
- provider-neutraler Outbound-Core und vorhandene Flight/Hotel/Activity Ports;
- Safety/Disruption und Seasonal Foundations;
- Product Quality, Logic, Continuity und Technical-Lead Governance;
- D0 technische Discoverability-/Canonical-Grundlagen, soweit bereits integriert.

## Explizit nicht mehr automatisch V1-blockierend

Die folgenden langfristig wertvollen Bereiche werden **nicht als Gesamtprogramm vor V1 verlangt**:

- mehrere Provider pro Kategorie;
- Bahn/Bus/Fähren/Mietwagen/Cruises/Versicherungen als vollständige Breite;
- vollständiges Admin D–K / Growth Control Operating System;
- Bexio-Liveintegration, umfangreiche Finance-/Ads-/CRM-Automation;
- breite Personalisierung;
- Social-/Traveller Network;
- Creator Ecosystem;
- Partner Marketplace;
- Native iOS-/Android-Apps;
- globale Expansion;
- tiefe Trends-/Social-Hotspot-/Community-Features;
- vollständiges Referral-/Experiment-/Paid-Growth-System;
- komplexe Subscription-Tariflandschaft;
- allgemeine Collaboration-/Social-Breite, sofern sie nicht für die Phase-1-Kernreise zwingend wird.

Diese Arbeit bleibt erhalten und wird Phase 2 oder Phase 3 zugeordnet.

## Externe V1-Blocker

Heute besonders relevant:

1. **reale Providerzugänge** für Flights und Hotels; Activities zusätzlich abhängig von geeigneter Partner-/API-Reife;
2. **Providerverträge, DPA, Lizenz-/Caching-/Attribution-Regeln**;
3. **Secrets/API Keys und Kostenfreigaben**;
4. **echte Official Entry-Requirement Evidence / Provider**;
5. Legal-/Privacy-Inhalte und Schweizer/EU-Rechtsprüfung vor Public Launch;
6. reale Production-Observability/Support-/Incident-/Backup-/Recovery-Abnahme;
7. reale V1 Browser-/Mobile-/Load-/Failure-Evidence.

## Fazit

Jetnity startet Phase 1 **nicht bei null**. Der größte Teil der schwierigen Kernarchitektur ist bereits vorhanden. Die kritische Restarbeit verschiebt sich jetzt von „mehr Features bauen“ zu:

> **bestehende Foundations mit echten Truth-Quellen verbinden, die komplette Kernreise schließen und anschließend Release Readiness beweisen.**
