# Provider Adapter Core Foundation — Handoff

Stand: 29. August 2026  
Status: **SELF-EXPIRING / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider adapter core 1`  
Branch: `feat/provider-adapter-core-foundation-2026-08-29`  
PR: https://github.com/Jetnity/jetnity/pull/187

Self-expiring: solange #187 offen → STOP für TL Exact-Head-Re-Review von `5463879179`. Sobald gemergt → Core integriert; erster nächster Schritt Post-Merge-Verifikation + TL-Continuity gemäß Binding Slice Precheck, nicht automatisch Skyscanner.

Authoritative current-state bleibt Checkpoint V2 (PR #194/#195) plus PR #196 Governance. `main` live prüfen.

## Auftrag

Nur Kommentar `5463879179` auf Head `ec7eff42`: Request-ID-Quelle auch gegen per-Request `additionalSensitiveHeaderNames` prüfen. Frühere akzeptierte Fixes nicht zurückdrehen.

## Fixes

Request-registrierte Custom-Secrets (z. B. `x-partner-secret`) dürfen nicht als Request-ID-Quelle gelesen werden. Konflikt ist `invalid_request` vor HTTP. Default-Secret-Liste bleibt `invalid_configuration` bei Executor-Create.

## Verbindliche Grenzen

Kein Ready. Kein Merge. Kein Folgeslice. Keine echten Provider-Calls/Secrets/Production-Mutation. Kein Commercial-Provenance-Mint.

## Handoff

Exact Head, Tests und Drift: `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_SELF_REVIEW_2026-08-29.md`. STOPP für unabhängigen Technical-Lead Exact-Head-Re-Review. Self-Review ist kein PASS.
