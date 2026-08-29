# Provider Adapter Core Foundation — Handoff

Stand: 29. August 2026  
Status: **REVIEW-FIX IMPLEMENTIERT / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Cursor-Agent: `Jetnity provider adapter core 1`  
Branch: `feat/provider-adapter-core-foundation-2026-08-29`  
PR: https://github.com/Jetnity/jetnity/pull/187  
Base main: `69ef27b169780e41ba506a69acb15caafa645517`

## Auftrag

Nur die Findings aus Technical-Lead Review `5058500841` gegen geprüften Head `98edd7b81a92d1eea6289cfc75048f09398cdff0`. Kein Scope-Ausbau. Kein Folgeslice.

## Review-Fixes

1. **P1 Body-Limit:** Stream-Read mit Abbruch während des Lesens; fehlendes oder gelogenes `Content-Length` materialisiert den Body nicht zuerst.
2. **P1 429-Klassifikation:** `retry_exhausted` nur nach wirklich benutztem Retry. `maxAttempts=1` und `retryOn429=false` bleiben `rate_limited` (HTTP und Preflight).
3. **P2 Guard-Isolation:** Observer-Throw wird geschluckt. Preflight-Throw/invalid Outcome ist fail-closed `rate_limited`, kein HTTP, keine Exception-Leaks.
4. **Server-only:** Produktions-Entry `index.ts` nutzt die bestehende Next-`import 'server-only'`-Grenze. Tests importieren `exports.ts`.

## Verbindliche Grenzen

- Kein Ready.
- Kein Merge.
- Kein Follow-up-Slice.
- Keine echten Provider-Calls.
- Keine Credentials/Secrets.
- Keine Supabase-/Production-Mutation.
- Kein Commercial-Provenance-Mint.
- Kein forgebares Trust-Flag.
- Tests vollständig offline.

## Handoff an Technical Lead

Exact Head, Changed Files, Test-Evidence, `origin/main`-Drift und Residuals stehen in `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_SELF_REVIEW_2026-08-29.md`. Live CI auf `6e2db52c`: Actions `33261310638` SUCCESS; Vercel `c1NB9K5JkHPcnB98mQMiMywx56AW` PASS. STOPP für unabhängigen Technical-Lead Exact-Head-Re-Review. Self-Review ist kein PASS. Alte CI-/Vercel-Evidence auf `98edd7b8` ist ungültig.
