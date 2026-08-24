# Jetnity – Provider Ops S1 Status

Stand: 24. August 2026  
Status: **GEMERGT AUF MAIN** – PR #47, Merge-Commit `01761eb9`; Technical Closure galt für Exact Head `b74096a9`  
Branch: `main`  
Auftrag: `docs/PROVIDER_OPS_S1_TASK.md`  
Closure: `docs/PROVIDER_OPS_S1_TECHNICAL_CLOSURE.md`

## 1. Was S1 ist

S1 führt einen **minimalen gemeinsamen Operationsvertrag** ein. Fachdomänen, Truth-Modelle und Provideradapter bleiben getrennt.

Product Owner hat PR #47 am 24. August 2026 Ready gemacht und gemergt. Das ist keine Freigabe für S2, Provideraktivierung, Secrets, kostenpflichtige Calls oder DB-/Production-Migration.

## 2. Runtime-Head

- Reviewed Exact Head: `b74096a9cda1382e4974d95f1a40da0b27ba1b2c`
- Implementierungs-Commit: `66413cf9d61b972341351a21e94b6f0c56a25648`
- Review-Fix-Commit: `b74096a9cda1382e4974d95f1a40da0b27ba1b2c`
- Base: `main` @ `e4f4cca75e55028fab231c1827abf6236ae30eec`
- Merge-Commit auf `main`: `01761eb9ba80828e87ca2da201901e0e211e1719`
- PR: https://github.com/Jetnity/jetnity/pull/47 – **MERGED**

## 3. Umgesetzt

- `lib/provider-ops/*`: Outcome-Taxonomie, JSON-Request-Härtung, Kill-Switch-Form, async Cost-Guard-Port plus In-Memory-Implementierung, Observability-Allowlist ohne Spread
- dünne Domain-Wrapper in Flights, Hotels, Activities, Mobility, Rental Cars, Readiness, Safety, Seasonal
- Flights-Search auf Hotel-Request-Härtung gehoben
- Seasonal-Rate-Limit-Algorithmus unverändert
- Review-Blocker S1-B1, S1-B2 und ADR-0154 geschlossen

## 4. Bewusst nicht geändert

- kein `FlugNachweis` (S2)
- kein Mobility-/Rental-Nachweis-Umbau (S3)
- keine Readiness-/Safety-/Seasonal-Truth und keine neuen Flags (S4)
- keine Offer-Provenance / kein Duffel-`currency` (S5)
- kein persistenter Cost Guard (S6)
- keine Observability-Persistenz / kein Admin-Health (S7)
- Mobility-/Rental-Timeout bleibt HTTP 504
- Account AP-1 und Admin Slice A unberührt

## 5. Gates auf Exact Head `b74096a9`

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **1729/1729 pass** |
| Typecheck / Lint / Hygiene / API-Schutz / Build | **pass** |
| GitHub Actions `32712731964` | **SUCCESS** |
| Vercel Preview `EBDpxxCVSQfccVQAGNnHpprKg398` | **READY** |
| Technical-Lead Re-Review | **PASS / Technical Closure** |

## 6. Empfehlung

S1 und das Provider-Readiness-Audit liegen auf `main` (PR #47 / `01761eb9`, PR #45 / `f92e0c9e`). S2, Provideraktivierung und Production-Migration brauchen jeweils einen neuen ausdrücklichen Auftrag.
