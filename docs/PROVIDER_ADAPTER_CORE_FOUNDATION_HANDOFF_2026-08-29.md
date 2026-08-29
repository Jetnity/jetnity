# Provider Adapter Core Foundation — Handoff

Stand: 29. August 2026  
Status: **SELF-EXPIRING / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider adapter core 1`  
Branch: `feat/provider-adapter-core-foundation-2026-08-29`  
PR: https://github.com/Jetnity/jetnity/pull/187

Self-expiring: solange #187 offen → STOP für TL Exact-Head-Re-Review von `5463847278`. Sobald gemergt → Core integriert; erster nächster Schritt Post-Merge-Verifikation + TL-Continuity gemäß Binding Slice Precheck, nicht automatisch Skyscanner.

Authoritative current-state bleibt Checkpoint V2 (PR #194/#195) plus PR #196 Governance. `main` live prüfen.

## Auftrag

Nur Kommentar `5463847278` auf Head `8df3e9c2`: Request-ID Secret Boundary, eine Rate-Limit-Wahrheit plus fail-closed `retryAfterMs`, PR-#196 Continuity/`main`-Sync. Frühere akzeptierte Fixes nicht zurückdrehen.

## Fixes

1. **Secret boundary:** `resolveRequestIdHeaderName` prüft gültigen Header-Namen und lehnt bekannte sensitive Namen vor jedem HTTP-Call ab.
2. **Rate-limit contract:** `ProviderRateLimitPolicy` trägt nur `preflight`. Duplikat-Retry-Felder sind `invalid_configuration`. Ungültiges Preflight-`retryAfterMs` fail-closed ohne Leak.
3. **Continuity:** `origin/main` gemerged (`behind_by=0` zum Merge-Zeitpunkt). HANDOFF / ACTIVE_WORK / START_HERE / ROADMAP / ADR-0199 sind self-expiring. PR #196 Dateien bleiben erhalten.

## Verbindliche Grenzen

Kein Ready. Kein Merge. Kein Folgeslice. Keine echten Provider-Calls/Secrets/Production-Mutation. Kein Commercial-Provenance-Mint.

## Handoff

Exact Head, Tests und Drift: `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_SELF_REVIEW_2026-08-29.md`. STOPP für unabhängigen Technical-Lead Exact-Head-Re-Review. Self-Review ist kein PASS.
