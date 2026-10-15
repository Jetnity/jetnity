# Source Discovery 1 — implementation plan and retained blocker history

Author: **Jetnity Research Engine V1 Source Discovery 1 — Codex Generation 1**.
Issue #948 / existing Draft PR #949 / branch `feat/research-engine-v1-source-discovery-1`.
Binding TASK blob: `0ab1d067d45a84b51c9f4acfcf3539ad2a0b94cf` (unchanged).

## Resumed plan — 15 October 2026

The exact amendment [TL R1 / 6179537467](https://github.com/Jetnity/jetnity/pull/949#issuecomment-6179537467) supersedes the historical stop below. Same author/session/branch; TASK unchanged. Deliver the two planned runtime modules and namespaced acceptance/cold-start tests, and change only the single literal importer entry plus finite negative lookalike assertions in `lib/readiness/official-truth-content-identity.test.ts`. No other existing code changes.

The coordinator accepts bounded data only, rebuilds the complete synthetic graph using `createContentIdentityGraph`, and supplies the rebuilt registry to both existing routing and URL validation. Injected functions, proxies/accessors, source flags, extra descriptor fields and inconsistent registry copies fail closed. Profile pins receive a code-owned always-refusing verifier solely to reconstruct the data graph; no verifier is invoked and no content is qualified. Query intents are capped at six source/domain pairs; overflow fails closed, without truncation or ranking. Candidate batches remain capped at sixteen. Repeated calls are pure and deterministic.

Run focused adversarial/scenario/cold-start tests and unchanged regressions, then all original required gates. Preserve original failures; publish only inspected counts and digests. Exact delivered-head Verify/Auth/Preview are separate external gates. The new #748 report COS-20261015-0757-014 (P1 Next.js advisory exposure) is an open TL/Owner risk; this scope authorizes no dependency upgrade. No direct source, Supabase or provider access.

## Original intended implementation (retained history)

Compose the existing coverage → research request → source routing/allowlist → bounded deterministic query descriptors → synthetic strict `{sourceId,url}` hits → canonical URL validator. Keep `officialResult=unknown`, `sourceQualified=false`; never accept Evidence or a Rule. Preserve canonical scope and fact kind. No second registry or URL/identity validator.

Planned files, **not delivered as runtime**:

- `lib/readiness/official-truth-source-discovery-v1/coordinator.ts`: pure offline composition, fail-closed input and authority boundaries, canonical graph validation before using an injected fixture snapshot.
- `lib/readiness/official-truth-source-discovery-v1/query-intents.ts`: at most six deterministic, non-personal descriptors from canonical country/document/fact classes and registered source domains.
- Namespaced tests: CH citizenship / CH passport / VN synthetic scenario, current/missing/recheck, invalid scope, hostile hits, malformed inputs, identity conflicts, cold-start network refusal and unchanged canonical regressions.
- The four TASK-authorized PLAN/REPORT/SELF_REVIEW/HANDOFF documents and sanitized JSON evidence.

No database, API, UI, traveller graph, package, workflow, provider, paid service or recurring-cost changes. No live source retrieval. The future live entry must continue to use the existing server-held source-registry boundary.

## Inspection result and binding stop

Live main matches the TASK baseline `10fdee40c3e4fcc7dffb6515dda5acf1db391aed`, mode NORMAL. The branch seed is `35ed794ae5b8a354e46d3e051dbc7935e95976e7`. #751 and the latest #748 material report `COS-20261014-1105-012` were read; no newer report was returned. The current no-BMDS-contact, source, database, privacy and paused-work gates remain binding.

The canonical URL validator assumes a previously constructed content-identity graph. A synthetic incomplete/conflicting graph can still produce URL candidates. The canonical `createContentIdentityGraph` rejects these inputs, but importing it from the proposed coordinator fails the existing finite importer inventory. TASK §4 explicitly requires STOP for this situation. See REPORT for executed counterexamples and exact evidence.

**Status: BLOCKED_SCOPE_AMENDMENT_REQUIRED.** No query helper, coordinator, production-facing seam or runtime implementation is committed. The temporary import-only probe was removed after recording the original failing guard result. The planned implementation is not a partial feature shipment.

## Minimal amendment requested from the independent Technical Lead

Authorize only `lib/readiness/official-truth-content-identity.test.ts` in addition to the existing TASK allowlist, to add the exact future path `lib/readiness/official-truth-source-discovery-v1/coordinator.ts` to `reviewedContentIdentityImporters` and add negative lookalike-path assertions. Keep the exhaustive repository scan and all other import restrictions unchanged. No wildcard, exclusion, dynamic-import evasion, validator rewrite or global authorization is requested.

If approved, the same author can resume this same slice with the existing canonical graph constructor and the unchanged URL validator. The immutable TASK must remain unchanged; authorization needs a separate exact-scope record. No amendment is assumed granted by this report. No additional writer or follow-up slice was started.
