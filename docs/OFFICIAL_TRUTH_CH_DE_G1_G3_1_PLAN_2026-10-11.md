# G1/G3 preflight 1 — implementation plan

Author: **Jetnity Official Truth CH-DE G1 G3 Preflight 1 — Codex Generation 1**.
Issue #930 / Draft #931; parent #917 OPEN. Binding TASK blob
`d95a59e3e0e948cd7c1ff70cb795319e48d090e5` is immutable.

## Pre-edit reconstruction

Live main and merge-base `5bd1b0f57eec8f4eed0d749a8f9b848eb90f419f`;
branch `feat/official-truth-ch-de-g1-g3-preflight-1`, seed
`0262f60b1a6b613333184215123cfb992f020b7d`, 1 ahead / 0 behind, clean.
Machine mode NORMAL. #751, #748 and #917/#930 were read, including Owner receipt
6111481221 and task receipt 6111520363. No newer #748 comment after 6036558748.
Open PR inventory: #931 is this sole writer; #913 is separately blocked;
#28/#39/#40/#50/#52 are historical inactive drafts. No overlapping active writer
was identified. No dispatch or additional writer is created here.

Read startup/AGENTS, TL and multi-agent standards, product vision, architecture,
roadmap, relevant decisions, design, quality and continuity contracts; relevant
traveller registry, Trip snapshot/materialization, account/guest parsers,
credentialOptionsAus, route schema/derivation, server Workspace and provider;
prior #918/#920/#926/#928 source reports/Owner packet and retrieval/budget/profile
code. Historical startup claims are not substituted for live #751/main.

## Chosen bounded implementation

1. Extend the existing dormant `read-request.ts` with an optional, strictly
   bounded `proposedContext` field. It explicitly binds Trip id/revision,
   selected document and linked citizenship references, nullable passport
   class, positively selected tourism, exact travel interval and a complete
   direct CH→DE **user attestation**. Missing/legacy facts remain unknown.
2. Reuse `credentialOptionsAus` and the loaded Trip snapshot. Check references,
   duplicates, dates and any contradictory canonical route facts. Return only
   representational status `proposed_context_only`, never official eligibility.
   Canonical engine/OfficialEvaluation and null-provider boundary remain intact.
3. Keep the contract local to this existing read boundary: no new shared Trip
   field, generic credential normalizer, account registry, persistence mapper,
   schema, migration, API or UI. This avoids pretending guest-only extensions
   are durable account facts and stays inside G1-03/G1-09 without a protected
   shared-path amendment. Real durable ordinary-class/purpose/route data remains
   a separate gate; the explicitly approved local proposal is useful only for
   code-level prerequisite validation.
4. G3 static preflight: compiled registry contains only GOV.UK. Bern's existing
   identity tuple is research-only; its conditional budget requires the exact
   compiled profile. No suitable profile exists. **CAPTURE_BLOCKED**, zero real
   attempts, no source bytes/timestamps/size inferred. Stop G3; no new network
   runner or profile. Add offline proof and a finite TL quarantine-seam packet.

## Files, effects and risks

Edit only existing CH→DE read-request/adapter/tests, new task-owned tests under
`lib/readiness/official-truth-ch-de-g1-g3-1/`, and task-owned docs/evidence.
No DB/API/Auth/RLS/CI/package/route-engine changes. No hosted operation. No
provider activation, accepted Evidence/Rule or positive visa. No paid call;
incremental recurring cost USD 0. The new context is an untrusted proposal,
not a source of account ownership or government truth. Full date representation
does not prove a legally supported duration or document validity.

## Verification and handoff

Run adversarial selection/link/class/purpose/route/date/provenance/serialization
and cross-trip tests; verify existing server Workspace remains unknown. Run
offline guarded retrieval/profile/budget/encoding regression suites without live
source requests. Run npm ci, setup, mode, typecheck, lint, full npm test with
native PostgreSQL16 including unchanged M1–M4, schema/API/dead/exports/deps,
production build and diff check. Record failures honestly and safe exact totals.
Review exact diff, refresh main/#751/#748, publish only this branch, obtain
exact-author-head CI with genuinely executed Auth and matching Preview evidence.
Version STATUS/REPORT/SELF_REVIEW/HANDOFF and sanitized evidence. Final STOP for
independent ChatGPT Technical Lead: no Ready, merge or follow-up.
