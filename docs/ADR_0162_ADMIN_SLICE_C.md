# ADR-0162 – Admin Slice C bleibt read-only Provider- und Kostenboard

Stand: 24. August 2026  
Status: **verbindliche Integrationsentscheidung für Draft-PR #49**

Vollständige Entscheidung: [DECISIONS.md](../DECISIONS.md) ADR-0162.

Kurz:

- Parent Provider-Ops = `foundation_only` / non-green. Domain-`available` gilt nur für eine belegte Test-Capability.
- Kill-Switch-Form und In-Memory Cost Guard bleiben Foundation, keine persistente Enforcement und kein globales Budget.
- `model_usage` nur über `darf_betrieb_lesen`, Empty ≠ Error, keine 0-USD-Lüge.
- GET-only, `betrieb-lesen`, keine neuen Secrets, keine Writes, keine Migration.
- ADR-0160 bleibt Account AP-3. ADR-0161 bleibt Provider S3.
