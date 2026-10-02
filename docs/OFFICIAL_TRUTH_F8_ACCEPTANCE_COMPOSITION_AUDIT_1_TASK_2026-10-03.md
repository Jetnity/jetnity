# Official Truth F8 Canonical Acceptance Composition Audit 1 — Task

Date: 3 October 2026
Issue: #768
Baseline: `main@6a12cd7abac92ba0356d7da0d3f8ec2d32df15fa`
Branch: `docs/official-truth-f8-acceptance-composition-audit-1`
Logical agent: **Jetnity Official Truth F8 canonical acceptance composition audit 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), not Auto

## Purpose

Perform a read-only adversarial architecture audit for the remaining merged #749 F8 blocker after F7 merged as PR #767.

Do **not** implement F8.

Determine the smallest safe server-only composition that may, in a later separately versioned runtime slice, reach the existing canonical `regelKandidatAkzeptieren` function without reopening F1/F2/F3/F5/F7/F9.

## Binding baseline

Read live main first, then at minimum:

- `docs/OFFICIAL_TRUTH_ACCEPTANCE_PRECONDITIONS_ADVERSARIAL_AUDIT_1_REPORT_2026-10-02.md` — F8
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_FRESHNESS_AUTHORITY_WITNESS_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_FRESHNESS_AUTHORITY_WITNESS_1_HANDOFF_2026-10-02.md`
- `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts`
- `lib/readiness/official-truth-server-held-source-registry.ts`
- `lib/readiness/official-truth-rule-review-packet.ts`
- `lib/readiness/official-truth-rule-review-fingerprint.ts`
- `lib/readiness/official-truth-fact-entry-authority-server.ts`
- `lib/readiness/rule-claims.ts`
- `lib/readiness/official-truth-store-server.ts`

Live evidence wins.

## Required questions

Independently determine:

1. **Witness use.**
   - May a later F8 runtime function accept an `authorized_preacceptance_witness` supplied by a caller?
   - Or must it call the merged F7 live entry internally in the same trusted server flow?
   - Prove the answer from current contracts.

2. **Exact acceptance material.**
   `regelKandidatAkzeptieren` needs exactly:
   - `kandidat`
   - `trustedRuleFact`
   - `evidenceVersions`
   - `registry`

   For each one, identify the only acceptable source in a future autonomous path and every caller-controlled substitute that must be forbidden.

3. **Registry / Evidence provenance.**
   - Show how a later F8 composition can reuse one server-held registry truth.
   - Determine whether current F7/reproof APIs expose enough internal data for canonical acceptance.
   - If they do not, specify the **smallest narrow internal refactor** needed.
   - Do not solve this by returning registry contents or free Evidence objects to a caller.

4. **TOCTOU / double-read drift.**
   - Analyze whether a future flow that runs F7, then separately reloads catalog/rebuilds Evidence for acceptance can observe different authority/content and still appear valid.
   - Specify the invariant needed to prevent that.
   - Prefer one same-request internal proof graph over passing proof objects through an untrusted boundary.

5. **Candidate and proposal boundary.**
   - Prove that model/research `proposal` must never silently become `trustedRuleFact`.
   - Determine whether the accepted candidate passed to `regelKandidatAkzeptieren` should be rebuilt from the same re-proved material rather than accepted from a request.

6. **Canonical constructor.**
   - No second Rule acceptance constructor is allowed.
   - State the exact future function boundary that may call `regelKandidatAkzeptieren`, and what it must prove immediately before the call.

7. **Persistence separation.**
   - F8 acceptance and store persistence must remain separable.
   - Do not treat `akzeptierteRegelClaimSpeichern` as the acceptance boundary.
   - Production activation/store apply remains separately gated.

8. **Adversarial test matrix.**
   Produce mandatory future tests for:
   - caller witness replay/injection
   - caller registry
   - caller EvidenceVersion / accepted Evidence
   - caller candidate
   - caller support ids
   - caller trustedRuleFact
   - proposal-copy attack
   - catalog drift/double-read
   - scope/credential-cell mismatch
   - stale/future support
   - break-glass / missing capability
   - suggestion/model output as authority
   - exact same-request success path

## Output decision

Classify the future F8 implementation as one of:

- **READY_FOR_ONE_BOUNDED_RUNTIME_SLICE**
- **REQUIRES_NARROW_INTERNAL_PREREQUISITE**
- **BLOCKED_BY_PRODUCT_OWNER_GATE**
- **BLOCKED_BY_MISSING_TRUTH_SOURCE**

Do not select a class optimistically. Support it with exact current-code evidence.

If a narrow prerequisite is needed, specify:
- exact files/functions;
- why it is required;
- why it is not F8 acceptance itself;
- proposed file ownership so a later writer does not collide.

## Allowed files

Create only:

- `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_REPORT_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_HANDOFF_2026-10-03.md`
- `docs/OFFICIAL_TRUTH_F8_ACCEPTANCE_COMPOSITION_AUDIT_1_SELF_REVIEW_2026-10-03.md`

Do not edit this task file.
Do not edit any runtime/test/migration/global-current-state file.

## Hard boundaries

No runtime change.
No tests changed.
No migration or Supabase mutation.
No Auth/AAL/role/RLS change.
No route/UI.
No store activation.
No provider/model/plugin/live API call.
No secrets/cost.
No #626 work.
No F8 implementation.
No follow-up slice.
Stay Draft.
Do not Ready or merge.

## Validation / STOP

- fetch live main;
- finish 0 behind;
- inspect sufficient exact code/test evidence;
- `git diff --check`;
- operating-mode guard;
- changed files must be only the three audit outputs plus this TL-owned seed already present;
- push exact review head;
- report session id and `originalModelName`;
- STOP for independent Technical-Lead review.
