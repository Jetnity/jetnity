# Official Truth Rule Review Decision Intent Contract 1 — Binding Task

Date: 2 October 2026
Issue: #733
Baseline: `main@45a4592de638b0cb73f177e255a82dd55bb512ad`
Branch: `feat/official-truth-rule-review-decision-intent-contract-1`
Logical agent: **Jetnity Official Truth Rule review decision intent contract 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## 1. Purpose

Implement the smallest pure contract immediately after the accepted #731 Rule acceptance trust-boundary architecture.

This contract records **no decision** and grants **no authority**. It only validates one decision intent against one exact, freshly re-proven #723/#726 Rule Review Packet identity inside the same invocation.

The permanent invariant remains:

> Model/plugin output alone may never become `trustedRuleFact` or Official Truth.

The current V1 path remains server-verified human/operator review. This slice does not implement that server boundary; it only builds the pure intent contract that the later authenticated endpoint may call.

## 2. Mandatory reads

Before editing, read current `main` versions of:

- `.jetnity/operating-mode.json`;
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`;
- `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`;
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`;
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_REPORT_2026-10-02.md`;
- `lib/readiness/official-truth-rule-review-packet.ts`;
- `lib/readiness/official-truth-rule-review-fingerprint.ts`;
- `lib/readiness/official-truth-review-suggestion.ts` and its tests;
- `lib/readiness/rule-claims.ts`;
- `lib/readiness/provider.ts`.

Live evidence wins. Re-fetch `origin/main` before final handoff.

## 3. Exact public contract

Create:

`lib/readiness/official-truth-rule-review-decision-intent.ts`

Export one function:

`officialTruthRegelReviewEntscheidungsabsicht(eingabe: unknown)`

The accepted top-level input shape is **exactly**:

```ts
{
  packetInput: unknown
  reviewPacketKey: string
  decision:
    | 'needs_more_evidence'
    | 'reject_candidate'
    | 'proceed_to_trusted_fact_entry'
}
```

No additional top-level field is accepted.

### Required re-proof

For every invocation:

1. run #723 `officialTruthRegelReviewPacket(packetInput)`;
2. run #726 `officialTruthRegelReviewPacketFingerprint(packetInput)`;
3. require both to succeed;
4. require their `ruleScopeKey` / support identity to agree;
5. require the caller-supplied `reviewPacketKey` to equal the **recomputed** #726 key;
6. derive `factKind` from the re-proven packet candidate, never from caller input.

A missing, malformed, stale or different key must fail closed. Do not echo the supplied key or sensitive input in a blocked result.

### Allowed decision values

Only:

- `needs_more_evidence`
- `reject_candidate`
- `proceed_to_trusted_fact_entry`

No aliases, casing normalization, trimming, boolean approval, generic `approved`, `accepted`, `continue`, or free text.

### Success result

The success result must contain **only**:

```ts
{
  status: 'rule_review_decision_intent'
  reviewPacketKey: string       // recomputed #726 key
  ruleScopeKey: string          // recomputed
  factKind: RegelFaktArt         // from re-proven packet candidate
  decision:
    | 'needs_more_evidence'
    | 'reject_candidate'
    | 'proceed_to_trusted_fact_entry'
}
```

No candidate, proposal, support snapshot, URL, content hash, support-version list, suggestion, reviewer identity, authority, trusted fact, accepted lifecycle or persistence receipt may appear.

The result name and documentation must make clear that it is a **decision intent only**, valid only as the pure output of this invocation. It is not evidence that a server stored or authorized the decision and must not be usable later as cross-request authorization.

### Blocked results

Use a fail-closed blocked result with a bounded reason union. Reuse #723/#726 block reasons where applicable and add only the minimum local reasons needed for:

- invalid decision;
- recomputed packet/fingerprint disagreement;
- caller `reviewPacketKey` mismatch.

Do not echo rejected data in error output.

## 4. Truth, privacy and security invariants

- `research_gap`, `stale_primary_evidence`, `unresolved_conflict` remain non-acceptable truth states. This slice does not override downstream acceptance checks.
- No decision state itself changes a candidate lifecycle.
- `proceed_to_trusted_fact_entry` means only “the current pure intent requests the later fact-entry step”; it is **not** trusted fact entry.
- A #730 review suggestion may exist independently but must not be accepted as an input that selects or proves the decision.
- Reject personal/sensitive/free-text expansion consistently with the existing review contracts. At minimum preserve the existing forbidden identifiers including user/account/trip/traveller identifiers, passport/document number, MRZ, biometric, DOB, health, email/name/phone, scans and note/comment/free-text fields.
- Never infer Citizenship from Residence or Issuer Country. One credential option / regulatory cell remains one independently keyed decision context.
- Do not emit or log rejected values.

## 5. Forbidden

This slice must not:

- call `regelKandidatAkzeptieren`;
- construct or accept `trustedRuleFact`;
- emit `lifecycle: 'accepted'` or an accepted Rule Claim;
- persist anything;
- add an API route, Server Action or UI;
- read or modify Auth/session/MFA/AAL/roles/capabilities/RLS;
- select or remap an Official-Truth capability;
- add SQL, migrations, Supabase calls, RPCs, triggers or policies;
- call a provider, OpenAI/model/plugin, browser or network;
- use `Date.now`, a new wall clock, random IDs or hidden ambient state;
- alter #723, #726, #730, `rule-claims.ts`, provider selection or the accepted store;
- change Production, Vercel configuration, indexing, domain state, payment, secrets or cost;
- touch #626 or attempt its blocked privileged operation;
- edit global current-state files `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, or `docs/ACTIVE_WORK_STATUS.md`.

## 6. Allowed files

Implementation writer may change only:

- `lib/readiness/official-truth-rule-review-decision-intent.ts`
- `lib/readiness/official-truth-rule-review-decision-intent.test.ts`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_DECISION_INTENT_CONTRACT_1_REPORT_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_DECISION_INTENT_CONTRACT_1_HANDOFF_2026-10-02.md`
- `docs/OFFICIAL_TRUTH_RULE_REVIEW_DECISION_INTENT_CONTRACT_1_SELF_REVIEW_2026-10-02.md`

This binding task file is Technical-Lead-owned and read-only for the implementation agent.

If correct implementation requires any other file, STOP and report the dependency instead of widening scope.

## 7. Required tests

At minimum prove:

1. all three exact decision states succeed on a valid current packet/key;
2. success output has exactly the five allowed fields and derives `factKind` from the re-proven packet;
3. missing/wrong/stale `reviewPacketKey` fails closed and does not echo the supplied key;
4. mutating packet material after a key was computed cannot reuse the old key;
5. malformed/blocked #723/#726 input remains blocked;
6. invalid decision strings, whitespace/case variants, `accepted`, `approved`, booleans and free text fail closed;
7. caller attempts to provide candidate, proposal, supports, support ids, fingerprint, suggestion, reviewer/user/role/AAL/capability, `trustedRuleFact`, accepted state or lifecycle fail closed;
8. personal/sensitive/note/free-text fields fail closed without echo;
9. a second credential option / regulatory cell produces a different binding and cannot reuse another key;
10. input objects are not mutated;
11. source-level boundary test proves the module imports/calls only the #723 packet and #726 fingerprint plus type-only safe dependencies; no acceptance/store/provider/model/network/Auth/DB/time source;
12. `requirementsProviderAus()` remains `null`.

Use synthetic `.example` official-source fixtures only. No remote database or network is needed.

## 8. Validation before handoff

Before final push:

- fetch and integrate latest `origin/main`;
- remain 0 behind current `main`;
- `git diff --check`;
- operating-mode guard;
- targeted decision-intent tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- production build;
- existing dead/export/dependency/API/schema reference checks used by adjacent Official-Truth slices.

After push, report exact head. GitHub exact-head CI/Auth and Vercel Preview are Technical-Lead gates and are not self-certified by the agent.

## 9. Deliverables / continuity

Write the three lane-local docs:

- REPORT: exact behavior, boundary and validation;
- HANDOFF: branch/PR/head, exact logical agent/session evidence if exposed, scope and exact next TL action;
- SELF_REVIEW: adversarial findings and explicit statement that self-review is **not** Technical-Lead PASS.

Do not rewrite global continuity.

## 10. Agent governance

- Stay Draft.
- Do not mark Ready.
- Do not merge.
- Do not start a follow-up slice.
- Agent self-review is not Technical-Lead PASS.
- If the Technical Lead returns CHANGES REQUIRED, remain in this same logical agent/session and change only the requested review findings.
- Any new head invalidates prior exact-head gates.

**STOP for independent Technical-Lead exact-head review.**
