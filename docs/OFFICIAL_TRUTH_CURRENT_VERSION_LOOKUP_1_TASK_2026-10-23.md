# Official Truth Current-Version Lookup 1

Date: 23 October 2026 (Europe/Zurich)
Version: 1 — immutable Technical-Lead assignment
Issue: #975
Branch: `feat/official-truth-current-version-lookup-1`
Logical Cursor writer: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**
Status at creation: TASK ONLY / NOT DISPATCHED. No actual session is assigned yet.

## 1. Purpose and authority

Implement one missing local database capability: resolve an exact canonical regulatory cell and fact kind to the uniquely remaining, structurally verified stored receipt, without requiring the caller to know its fingerprint beforehand.

Existing M1–M4 custody already persists originals, a protected synthetic review, receipt binding and lifecycle events. Its `readCandidate(..., fingerprint, key, witness)` re-proves one known fingerprint. It does not discover which receipt is current for a cell/fact request. The existing historical support selector selects evidence inside an already supplied snapshot; it does not perform this database lookup.

This finite new read contract is authorized under NORMAL and the Owner's request to continue useful development. It corrects TL R99's overly broad inference that every useful Official-Truth code step required an actual source run or the blocked Development readback. Neither live action is required for this isolated implementation. It is not a new general foundation, a new fact model, the larger legacy accepted-claim adapter, or source activation.

Verified baseline main/merge-base: `5269b9192a2300c6c03fc8659964583130d2d1d1`; tree `961641af883a23126e4479849a78b0a27f042c1e`; operating mode NORMAL, re-read before task creation. Task seed head/blob and actual future dispatch evidence belong in the PR, not self-referentially in this immutable document.

## 2. Mandatory orientation and startup

Read JETNITY_START_HERE.md, AGENTS.md, .jetnity/operating-mode.json, the Technical Lead / Cursor operating standard, multi-agent operating and slice-planning standards, current referenced handoff, ACTIVE_WORK_STATUS, and newest material #751, #748 and #917 evidence.

Read these existing contracts and implementations before proposing files:

- docs/OFFICIAL_TRUTH_CH_DE_SOURCE_TO_WORKSPACE_V2_1_M1_M4_CONTRACT_2026-10-11.md
- scripts/db/official-truth-original-custody-1/storage.ts
- supabase/migrations/20261011111839_official_truth_original_custody_lifecycle_1.sql
- lib/readiness/official-truth-original-custody.test.ts
- lib/readiness/official-truth-integrated-pilot-bundle.ts
- scripts/db/official-truth-integrated-pilot-1/storage.ts, local-cluster.ts and pg-wire.ts
- lib/readiness/official-truth-support-selection-server.ts
- the existing canonical scope, receipt, pin and fact-kind validators referenced by those modules.

Inspect lib/readiness/official-truth-store-server.ts and the first-visa-vertical accepted-read proof only to preserve their existing limitations. Do not connect this task to the legacy claim writer or alter historical negative proofs.

Before implementation, publish a concise task-owned PLAN: exact interfaces/files, candidate-completeness argument, lifecycle/concurrency ordering, read budgets, local ACLs, tests and explicit non-authoritative result. Report a contract collision instead of broadening scope.

## 3. Multi-Agent Suitability and ownership

**SINGLE_WRITER for this slice.** SQL selection, transaction lifetime and the TypeScript proof composition share one correctness boundary and must not be written by competing agents. Independent read-only review is useful but is not TL acceptance.

This branch is independent of #972 visit precision, #973 lodging preview and #974 support documentation, with disjoint files and no dependency on unmerged work. Their authors must not modify this branch. TL controls integration ordering and any response to main drift.

Exclusive write allowlist:

1. New files under `scripts/db/official-truth-current-version-lookup-1/**` for the minimal local resolver, synthetic fixtures/proof and any strictly necessary local SQL support.
2. One new focused `lib/readiness/official-truth-current-version-lookup-1.test.ts` integrating the actual native PostgreSQL proof into existing test discovery.
3. At most ONE new unapplied migration artifact `supabase/migrations/<CLI-generated UTC timestamp>_official_truth_current_version_lookup_1.sql`, only for the narrowly specified read API. Generate its filename through the normal Supabase CLI, never guess/reuse an applied migration ID. The artifact is installed only in the isolated native local proof; no hosted apply is authorized.
4. New task-owned `docs/OFFICIAL_TRUTH_CURRENT_VERSION_LOOKUP_1_*` PLAN, STATUS, SELF_REVIEW and HANDOFF, with this TASK immutable.

Do not modify existing custody/provenance modules, migrations, app/runtime files, shared schemas, workflows, package/lock files, global governance/status or other tasks. Reuse exported existing helpers. If a necessary helper is not exported or an existing contract prevents safe composition, stop with the precise minimal requested amendment; do not copy a verification engine.

## 4. Required semantics

### Exact request identity

Use existing strict canonical identity and validators: the exact global-cell definition pin (id/version/digest), complete canonical scope and its recomputed ruleScopeKey, factKind and matching requirementType. Do not collapse distinct definition versions, document/traveller dimensions or fact kinds into a country-pair key. Do not accept an arbitrary client-provided candidate or provenance graph as stored authority.

### Current guard and complete candidate set

Acquire the existing READ COMMITTED lifecycle head SHARE lock and verify the caller's independent external witness BEFORE enumeration. Keep that guard transaction and lock through all selection and complete custody verification. A cursor fetched from the same restored database is not an independent witness.

Derive the complete bounded accepted identity set from the verified append-only accepted-event history. Prove exact accepted-event ↔ rule-binding ↔ review ↔ retained-receipt coverage, including duplicates, missing rows, orphan bindings and mismatched identities, before using receipt fields to filter by the requested cell/fact. A reviewed but unpublished candidate is not an accepted binding and must not appear as a result.

**Do not use an INNER JOIN / JSON scope predicate that silently drops a missing, corrupt or unclassifiable competing receipt.** Incomplete or unverifiable candidate enumeration must refuse; it must never produce false absence or false uniqueness. Strictly validate receipt bytes/fingerprint and identity with the existing canonical codec, not a new loose JSON decoder. Never select from a caller-maintained candidate list.

An existing explicitly terminal lifecycle event can exclude its version according to the established contract. Two still-active matching bindings are ambiguous/unknown. Never choose the latest timestamp, highest sequence, first row or convenient valid candidate. A damaged or currently unverifiable competitor cannot be skipped in favour of a positive result. Do not add a new supersession writer or infer supersession merely because V2 exists.

For the uniquely remaining candidate, compose the existing complete readCandidate proof: retained provenance closure, exact protected synthetic review/support mapping, originals/byte hashes, current lifecycle, source/profile state, expiry and external witness. Preserve its separate historical REPEATABLE READ / READ ONLY archive connection under the live guard. Do not reimplement eligibility, original custody, review, canonicalization or lifecycle rules.

### Bounded work and refusal

Use checked fixed limits before transferring or decoding receipt collections: no more than the existing 1,024-review ceiling, no more than 8 MiB aggregate receipt metadata per lookup, and the existing 262,144-byte receipt maximum individually. Existing lifecycle history limits remain unchanged. A stricter documented bound is permissible; weakening these limits is not.

Check full cardinality and total bytes without silently truncating the dataset. No successful result based on LIMIT, pagination that omitted candidates, timeout, caught SQL error, skipped row or unavailable metadata. Bound transaction time and release connections on every result/error. Do not load complete original bodies for all candidates just to filter identities. Sanitise errors; never log keys, original bytes, secrets or raw user material.

### Result meaning

Use explicit no-match, ambiguous and unavailable/refused outcomes, distinguishable in the local test contract. A successful result returns the selected fingerprint and minimum proof/identity metadata and is explicitly synthetic/local, structurally verified, bound to the supplied witness and read time.

Preserve `productionAcceptedRead: 'NOT_AUTHORIZED'` and `positiveVisaCells: 0`. Do not return an application-ready OfficialEvaluation, customer visa answer, production acceptance token, plaintext original, cryptographic key or real-source authority. A returned fingerprint/proof is not a reusable positive cache authority after the transaction; every later decision must run the current proof again. Explain this freshness boundary in the handoff.

## 5. SQL / permissions boundary

Only a minimal new protected read function or functions needed for complete enumeration and proof composition. No new table, writer, role, service credential, data import, policy, trigger rewrite or hosted configuration. Existing admission, synthetic-review authority, key handling, quotas and retention rules stay unchanged.

Use the existing private/API schema conventions and SECURITY DEFINER protections where required, qualified references, empty search_path and explicit UTC. Revoke public execution in the same migration transaction. Grant the new read capability only to the existing `ot_original_reader` role. Prove no executable access for PUBLIC, anon, authenticated or service_role and no new direct private-table access. Application roles must not acquire role membership or bypass rights.

Do not weaken RLS or existing ownership. The artifact is LOCAL / UNAPPLIED against all hosted environments until separately reviewed and explicitly authorized. Creating it grants no Development or Production migration permission.

## 6. Required behavioural evidence

Use the existing isolated native PostgreSQL cluster/transport with synthetic example.invalid fixtures, no connection override to a hosted project, no embedded SQLite substitute and no regex-only proof. Prove persistent write/read separation with distinct connections and no reused in-memory candidate cache.

At minimum cover:

1. Empty accepted corpus; review-only unpublished candidate; one exact current match; wrong cell pin, scope, fact kind and requirement type.
2. Persist V1 and close the producer; later lookup by cell/fact alone re-proves V1. Persist V2 for the same identity: ambiguity until the existing explicit supersession mechanism terminates V1; then later lookup proves V2.
3. Missing/corrupt second receipt, missing/mismatched binding/review, duplicate or orphan acceptance and malformed/unclassifiable identity: no false unique or false empty result. Corruption setup is isolated test-owner fault injection, never a new runtime permission.
4. Withdrawal, conflict, supersession, expiry, source/profile withdrawal, unavailable originals and stale/wrong/restored witness: no positive reuse. An expired/disposed historical version must not be silently recast as a fresh one.
5. Concurrency: accepted binding publication and withdrawal racing enumeration/full verification. Demonstrate correct blocking/ordering with the existing lock and a fresh later lookup observing the changed lifecycle; no stale reusable positive after completion.
6. Boundary and overflow tests for complete receipt count/aggregate bytes and per-receipt bounds; no truncated success. Error paths close/rollback readers and release the guard.
7. New SQL ACL, no direct private access, no app-role execution and no writer/table/role changes. Existing custody proof and historical negative accepted-read proof remain unchanged.
8. No deployed application import or capability activation; provider/pilot remain disabled.

Run the repository's mandatory relevant typecheck, lint, npm test, build and hygiene/operating-mode checks on actual implementation. For this slice the focused native PostgreSQL behavioural proof is REQUIRED; a missing native binary or environment refusal is a missing gate, not PASS. Do not connect to a real DB to make it pass, weaken tests, set a hosted connection override or claim old-head CI covers a new head.

## 7. Hard gates and actual model

No actual government/source/provider/LLM call, crawl, legal-page retry, source publication, outreach, terms/contract acceptance, paid activation, credential change, real account/person data, Owner personal browser/profile, Production/Development SQL or migration apply, deployment/alias/flag change, restoration/disposal operation or retention/key-hosting choice.

The blocked #917 DEV-PREP-1 readback stays blocked; no retry, replay, alternate tool/credential/operator or delegated route. Prior approved Development work does not authorise bypassing the platform restriction. #944 source-use/outreach gate remains; declined BMDS message remains unsent; #937 stays paused. No production legacy accepted-claim bridge or real reviewer authority. Existing normal branch CI/Preview may run.

Requested/required launch setting for THIS task: **Claude Opus 5.5 High**. A prompt naming the model is not a model selector. Do not start implementation until actual selected model and session identity are evidenced. If actual model differs or cannot be verified, STOP BEFORE CODE and report. No Auto/fallback, model replacement, new default GitHub mention dispatch or inherited Full Access. A session not yet created must never be described as active.

Use the exact logical writer name and generation above. Rename the UI session only if supported; report actual link/ID and whether rename is verified. TL will bind a correctly configured session to this existing task/branch/PR; do not open a replacement.

## 8. Delivery, review and STOP

Commit/push only to the existing branch. No main mutation, force push, rebase/merge/cherry-pick of another assignment, cleanup or new task. Persist concise PLAN/STATUS/SELF_REVIEW/HANDOFF with actual commands/results and limitations.

Before final handoff re-read origin/main and report exact main/base/head/tree, merge-base/ahead/behind, immutable TASK blob, changed paths, actual logical name/session/model, native proof, CI/Preview head binding, all missing/failed/skipped gates and P0/P1/P2/P3 findings. Include an honest comparison: implemented local lookup versus still-unimplemented real-source/hosted/legacy/runtime activation. No self-review is TL acceptance.

**STOP for independent Technical-Lead review. DO NOT MARK READY. DO NOT MERGE. DO NOT START A FOLLOW-UP SLICE.** Immediate review fixes remain with the same author/session under a bounded CHANGES REQUIRED instruction; any new head requires complete re-gating.
