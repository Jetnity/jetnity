# Jetnity – Product-Owner Freigabenachweis Technical-Lead-Autonomie

Stand: 25. August 2026

Der Product Owner hat die in `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md` dokumentierte Lockerung ausdrücklich freigegeben.

Freigegeben ist insbesondere:

- normale, scope-treue Entwicklungs-PRs nach vollständigem Technical Closure ohne erneute PO-Freigabe Ready zu setzen;
- diese normalen PRs nach erneuter Integrationsprüfung selbst nach `main` zu mergen;
- den nächsten bereits verbindlich geplanten Slice selbstständig vorzubereiten und zu beauftragen;
- Branches, Draft-PRs, Tests, Refactorings, Bug-/Security-Fixes, Dokumentation und Development-only Migrationen innerhalb der dokumentierten Grenzen selbstständig zu steuern.

Besondere Gates bleiben PO-pflichtig gemäß Autonomy Policy: Production-Datenbank/destructive Daten, echte Provider/Secrets/Verträge/paid calls, Kosten über USD 100/Monat, große Produkt-/Geschäftsmodelländerungen, besonders sensible Identitätsdaten und öffentliche/produktive Aktivierungen.

Diese Entscheidung ersetzt für normale Engineering-PRs die frühere pauschale doppelte PO-Ready-/Merge-Pflicht.
