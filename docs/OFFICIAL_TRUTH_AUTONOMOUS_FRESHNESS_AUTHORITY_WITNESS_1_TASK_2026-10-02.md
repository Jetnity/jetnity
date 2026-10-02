# Official Truth Autonomous Freshness / Authority Witness 1 — Task

Date: 2 October 2026
Issue: #766
Branch: `fix/official-truth-autonomous-freshness-witness-1`
Baseline: `main@c04964e715c0ea6810dae18d7c3d573707672392`
Logical agent: **Jetnity Official Truth autonomous freshness authority witness 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** (`grok-4.7-high-fast`), **not Auto**

## 1. Purpose

Close only the merged #749 **F7 same-request precondition** for the future #741 autonomous Official Truth path.

Build one server-only, fail-closed pre-acceptance witness which proves, in the same server request, that:

1. the existing Official Truth fact-entry authority guard is exactly authorized;
2. the review input is re-proved through the server-held source registry, not caller authority;
3. #723 Rule Review Packet and #726 v2 fingerprint are recomputed from the **same server-held catalog read / same reconstructed input**;
4. every re-proved support is `current` under the existing bounded `officialFrische` policy at a server-owned reference time;
5. only acceptance-eligible evidence qualities can reach the witness;
6. the output is still **not acceptance, not a trusted fact, not a persistent authorization and not Official Truth**.

This slice does **not** close F8. It must not call `regelKandidatAkzeptieren` or either store writer.

## 2. Binding architecture

Read before editing:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md`
4. `docs/JETNITY_ENTRY_REQUIREMENTS_OFFICIAL_TRUTH_AUTONOMY_DIRECTIVE_2026-10-02.md`
5. `docs/OFFICIAL_TRUTH_ACCEPTANCE_PRECONDITIONS_ADVERSARIAL_AUDIT_1_REPORT_2026-10-02.md` — F7/F8
6. `docs/OFFICIAL_TRUTH_SERVER_HELD_SOURCE_REGISTRY_BINDING_1_HANDOFF_2026-10-02.md`
7. current implementations:
   - `lib/readiness/official-truth-server-held-source-registry.ts`
   - `lib/readiness/official-truth-rule-review-packet.ts`
   - `lib/readiness/official-truth-rule-review-fingerprint.ts`
   - `lib/readiness/official-truth-fact-entry-authority-server.ts`
   - `lib/readiness/official.ts::officialFrische`
   - `lib/readiness/official-truth-coverage.ts`
   - `lib/readiness/rule-claims.ts::regelKandidatAkzeptieren`

Live evidence wins over this task if main has moved. If main moves, fetch and rebase/merge main before delivery without widening scope.

## 3. Required live boundary

Implement a **server-only live wrapper** for the future same-request autonomous path.

The live wrapper:

- accepts only the original registry-free review material shape needed by the merged server-held review entry;
- accepts **no** caller registry, source class, domains, blocked domains, role, grant, capability, reviewer/user id, AAL, clock, `maxAgeMs`, freshness result, reviewPacketKey, supportVersionIds, trustedRuleFact, accepted claim, lifecycle override, suggestion or model-authority field;
- derives authority only by calling `loadOfficialTruthFactEntryAuthority()`;
- continues only for exactly:
  `{ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }`;
- derives the reference time from a server-owned clock inside the live wrapper;
- uses no caller dependency override in the live entry.

A separate deterministic test seam may accept injected dependencies/clock for tests. It is **not** the live entry, must be named/documented as such, and a future route must not call that seam as authority.

Prefer authority failure before any catalog transport so unauthorized attempts do not perform the Official Truth source read. Lock that order with a call-count test.

## 4. Server-held packet + fingerprint re-proof

The live witness must not call the pure #723/#726 functions with caller authority.

Extend/refactor the merged server-held source-registry adapter only as narrowly as required so one successful re-proof can:

- load the source catalog once;
- inject that same server-held registry into the original supports;
- recompute #723;
- recompute #726 v2 from the same internally reconstructed input;
- require packet/fingerprint scope and support identities to agree;
- return no caller registry.

Do **not** add a second registry model or source-authority implementation.

A test must prove one catalog read for one successful combined re-proof and must prove the resulting key is the same canonical `review-packet:v2:` identity for the same server-held material.

## 5. Freshness requirement

For every support returned by the freshly re-proved packet, the witness must call the existing `officialFrische` policy and require the result to be exactly `current`.

Binding rules:

- `checkedAt` comes from the re-proved support `retrievedAt`;
- `validFrom` / `validUntil` come from the re-proved accepted Evidence support;
- content identity comes from the re-proved `sourceContentHash`;
- `now` is the server-owned reference time;
- no caller `maxAgeMs` is accepted; use the existing global bounded ceiling from `officialFrische`;
- no provider is selected or added. A successfully re-proved server-held official source may be treated as source-available solely for this existing freshness helper;
- any value other than `current` fails closed.

The v2 review fingerprint remains the replay/content-identity binding. The freshness call is the explicit time/validity gate; it is not a replacement fingerprint.

Lock at least:
- current within the ceiling -> eligible;
- exactly at the existing max-age boundary -> blocked/recheck (current `officialFrische` semantics use `>=`);
- older than the ceiling -> blocked;
- `validFrom` in the future -> blocked;
- elapsed `validUntil` -> blocked;
- malformed/invalid server reference time -> blocked.

Do not invent a new TTL or retention duration.

## 6. Evidence quality / suggestion boundary

An authorized witness may exist only when the freshly re-proved candidate quality is:

- `explicit_primary_statement`, or
- `composed_from_multiple_primary_sources`.

`research_gap`, `stale_primary_evidence`, `unresolved_conflict`, a blocked packet, same-source composition, or any other non-eligible result fails closed.

Do not import or consume #728/#765 suggestion output. Suggestions remain advisory and cannot affect this witness.

Do not use `officialTruthRegelReviewEntscheidungsabsicht` as autonomous authority. That is the current V1 human decision-intent contract.

## 7. Witness output

A successful result may contain only bounded non-personal proof metadata such as:

- status identifying an authorized **pre-acceptance witness**;
- recomputed `reviewPacketKey`;
- recomputed `ruleScopeKey`;
- `factKind`;
- sorted `supportVersionIds`;
- server reference time;
- freshness = `current`;
- verified authority echo limited to `grant: 'role'` and capability `official-truth-freigeben`.

It must contain **no**:
- candidate proposal;
- source snapshot;
- trustedRuleFact;
- accepted claim/fact body;
- model/suggestion payload;
- user/reviewer id, email or other PII;
- registry contents;
- session/auth token;
- database error text.

The witness is an **ephemeral same-request proof object**, not a bearer capability. A later request must re-run the live gate. Do not persist it in this slice.

## 8. Explicitly forbidden

Do not:

- call `regelKandidatAkzeptieren`;
- call `akzeptierteRegelClaimSpeichern` or `akzeptierteEvidenceSpeichern`;
- add or connect an app/API route;
- add a migration/table/RPC/cron/queue;
- apply/re-apply anything in Supabase Development or Production;
- edit Auth/AAL/roles/RLS/capabilities;
- touch #626 retention/audit implementation;
- add a provider, OpenAI/model call, plugin call, secret, payment or recurring cost;
- change `requirementsProviderAus()`;
- change launch/indexing;
- mark Ready or merge;
- start F8 or another follow-up slice.

## 9. Allowed implementation paths

Keep the diff narrowly within:

- `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts` (new)
- `lib/readiness/official-truth-autonomous-preacceptance-witness-server.test.ts` (new)
- `lib/readiness/official-truth-server-held-source-registry.ts` (only the minimal combined re-proof support)
- `lib/readiness/official-truth-server-held-source-registry.test.ts` (matching tests)
- `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_ARCHITECTURE_2026-10-02.md` (small current binding note only if needed)
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_FRESHNESS_AUTHORITY_WITNESS_1_REPORT_2026-10-02.md` (new)
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_FRESHNESS_AUTHORITY_WITNESS_1_HANDOFF_2026-10-02.md` (new)
- `docs/OFFICIAL_TRUTH_AUTONOMOUS_FRESHNESS_AUTHORITY_WITNESS_1_SELF_REVIEW_2026-10-02.md` (new)

This task file is Technical-Lead-owned. Do not rewrite it.

Any additional file requires a clear necessity explanation in the PR before editing it.

## 10. Adversarial tests

At minimum prove:

1. denied/blocked authority -> no catalog call, no witness;
2. break-glass/role-grant failure -> no catalog call;
3. catalog not configured/failure -> no witness;
4. caller registry/source authority fields -> blocked;
5. caller role/grant/AAL/user/reviewer/clock/maxAge/reviewPacketKey/trustedRuleFact/suggestion fields -> blocked;
6. combined server-held re-proof uses one catalog read;
7. packet + fingerprint agree on cell/support identity;
8. non-current freshness cases above all block;
9. acceptable-quality current material can produce only the bounded witness;
10. research gap / stale primary / unresolved conflict cannot produce the witness;
11. output contains no proposal/snapshot/trusted fact/accepted claim/PII/registry;
12. no import/call to suggestion authority, `regelKandidatAkzeptieren` or store writers.

## 11. Validation / delivery

Before STOP:

- focused tests;
- full `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- hygiene checks used by current CI;
- `git diff --check`;
- fetch current main and report merge-base / ahead / behind;
- push branch;
- keep PR **Draft**;
- provide exact head SHA, full changed-file list, CI/Preview evidence if available, and self-review;
- state exact Cursor session id and `originalModelName`.

Cursor must **not** Ready or merge.

STOP after delivery for independent Technical-Lead exact-head review.