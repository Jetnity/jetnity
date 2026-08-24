# Jetnity – verbindliche Build-Reihenfolge

Stand: 25. August 2026  
Status: **Product-Owner-verbindlich; Änderung nur durch neue ausdrückliche Product-Owner-Entscheidung**

## Grundsatz

Diese Datei definiert die kanonische große Entwicklungsreihenfolge. Neue Chats, Technical Leads und Cursor-Agenten dürfen die Reihenfolge nicht aus alten Handoffs, historischen PR-Bodies oder eigener Bequemlichkeit verändern.

Die Reihenfolge beschreibt die großen Programme. Innerhalb eines Programms dürfen konfliktarme Vorbereitungs-, Review- und Dokumentationsarbeiten parallelisiert werden, solange Shared Contracts und der aktive Integrationspfad nicht gefährdet werden.

## 1. Trip Workspace vollständig fertigbauen

Primärer Agent: `Trip workspace audit architecture`

Reihenfolge:

1. TW-1 – Shell & Geräteparität
2. TW-2 – Reiseübersicht
3. TW-4 – Aufmerksamkeit / `Jetzt wichtig`
4. TW-3 – Timeline / Etappe / Tag
5. TW-5 – Item- und Gap-Details
6. TW-6/TW-7/TW-8 nur nach ihren dokumentierten Abhängigkeiten/Gates
7. TW-9 – Polish, Evidence, Closure
8. verpflichtender finaler Function-by-Function-/Intelligence-Audit

TW-1 und TW-2 bleiben getrennte Runtime-Slices. Keine Monster-PRs.

## 2. Traveller / Pass / Multi-Citizenship produktweit vervollständigen

Foundation E ist bereits auf Production und darf **nicht neu gebaut** werden.

Kanonisches Modell:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Fehlende Produktarbeit umfasst insbesondere Account-Traveller-Registry, Dokument-Lifecycle/UX und die konsequente Nutzung dieses Modells in relevanten Reise-, Einreise- und Transitfunktionen.

Primärer Account-Agent: `Account plattform audit vorbereitung`. Shared Traveller-/Identity-Verträge bleiben Technical-Lead-gesteuert.

## 3. Account Platform vollständig weiterführen

Agent: `Account plattform audit vorbereitung`

AP-1 bis AP-3 sind auf `main`. Weiter mit AP-4 bis AP-12 gemäß `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` und den jeweiligen Shared Gates.

Dazu gehören u. a. Archiv/Lifecycle, Security, Privacy, Traveller Registry, Reiseprofil, Favoriten, Booking Overview, Notifications und Subscription-/Entitlement-Grundlage.

## 4. Provider Readiness S4–S8, danach echte Provider

Agent: `Jetnity provider readiness audit`

S1–S3 sind auf `main`. Weiter mit S4–S8 gemäß Provider-Plan.

Erst danach echte Provideraktivierung. Verträge, Secrets/API-Keys, kostenpflichtige Calls, Datenschutz/Lizenz und Production-Aktivierung bleiben besondere Product-Owner-Gates.

## 5. Admin Control Center D–K

Agent: `Admin platform audit`

A–C sind auf `main`. D–K werden gemäß Admin-Plan fertiggestellt.

Der bekannte Billing-/Refund-P1 muss zwingend vor Finance-/Payment-Live und vor finaler Billing Technical Closure geschlossen werden.

## 6. Homepage finalisieren

Homepage erst nach stabilem zentralem Trip-Workspace-Kern, insbesondere nachdem TW-2 und TW-4 fachlich tragen.

Ziel: klare Positionierung und einfacher Einstieg in Jetnity, keine Feature-Wand und keine Versprechen über noch nicht produktive Funktionen.

## 7. Kommerzielle Produktschicht

Danach die vollständige kommerzielle Schicht:

- echte Preise und Verfügbarkeit;
- Multi-Provider-Vergleich;
- Preis vs. Zeit/Komfort/Gesamtnutzen;
- Commercial Provenance/Freshness;
- Affiliate-/Deep-Link-Attribution;
- Revenue-/Provisionserfassung;
- Entitlements/Subscriptions, wo Produktplan dies vorsieht.

Keine Fake-Commercial-Truth.

## 8. Production-Härtung / Launch Readiness

Vor echtem Launch verpflichtend:

- reale sequentielle E2E-Szenarien;
- Security-/Privacy-Abnahme;
- Backup-/Restore-/Recovery-Nachweis;
- Monitoring/Observability;
- globale Rate-/Cost-Grenzen;
- Performance;
- Accessibility;
- Mobile/Tablet/Laptop/Desktop-Acceptance;
- Release-/Rollback-Plan;
- Branch Protection / Required Checks;
- provider-backed Truth-Audit nach echter Provider-Aktivierung.

## Arbeitsweise

Die technische Ausführung folgt `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`.

Normale vollständig geprüfte PRs dürfen nach der Product-Owner-Freigabe vom 25. August 2026 durch den Technical Lead selbst Ready gesetzt und gemergt werden. Besondere Production-/Kosten-/Provider-/Produkt-/Sensitive-Data-Gates bleiben Product-Owner-pflichtig.
