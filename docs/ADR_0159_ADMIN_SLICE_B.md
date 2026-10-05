# ADR-0159 – Admin Slice B bleibt read-only System Health ohne Fake-Green

Stand: 24. August 2026  
Status: **verbindliche Integrationsentscheidung; auf `main` gemergt (PR #46, `e3bad749`)**

Vollständige Entscheidung: [DECISIONS.md](../DECISIONS.md) ADR-0159.

Kurz:

- Parent `App / Deployment` = `unknown` / non-green. Nur Sub-Check `App-Prozess` darf bei Prozessantwort `healthy` sein.
- Parent `Supabase` = `not_configured` / non-green. `public.airports` belegt nur Sub-Check `Supabase App-Datenzugriff`.
- Vercel, GitHub/CI, Infomaniak ohne Management-Quelle = `not_configured`.
- GET-only, `betrieb-lesen`, keine neuen Secrets, keine Writes, keine Migration.

Historische Draft-Nummer ADR-0153 bleibt Evidence des alten Stacks und gilt nicht gegen aktuellen `main`.
