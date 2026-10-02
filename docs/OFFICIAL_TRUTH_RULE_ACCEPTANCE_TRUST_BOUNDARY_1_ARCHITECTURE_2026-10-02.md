# Official Truth Rule Acceptance Trust Boundary Architecture 1

Date: 2 October 2026
Status: **docs-only architecture / Draft PR #731 / R1 wording correction / Issue #737 reconciliation 2 October 2026 corrects section 5 / no acceptance runtime / no Auth, RLS, DB, model, provider or Production change**
Issue: #729
Draft PR: #731
Branch: `docs/official-truth-rule-acceptance-trust-boundary-1`
Baseline: `main@5e291ed7c4814f034224eda46c3bd62cc9815ea3`
Task: `docs/OFFICIAL_TRUTH_RULE_ACCEPTANCE_TRUST_BOUNDARY_1_TASK_2026-10-02.md`
Logical agent: **Jetnity Official Truth Rule acceptance trust boundary architecture 1**, Generation 1

This file is the binding architecture for the authority boundary before `regelKandidatAkzeptieren`. It does not implement that boundary. The task file still contains the original dispatch sentence that human review is the only future entry. R1 `5390891105` supersedes that sentence here. The task file is left unchanged. `DECISIONS.md` and `docs/ACTIVE_WORK_STATUS.md` stay unchanged because this task forbids global continuity edits. A later Technical-Lead promotion into `DECISIONS.md` is a separate edit.

## Reconciliation — 2 October 2026

Issue #737 corrects section 5 of this binding architecture. The correction is this note and the section 5 text below. The original #731 task, report and handoff stay the historical author record of that delivery. They are not rewritten to look as if they already contained this correction. No runtime file changes with this reconciliation.

## Fact-entry authority binding — 2 October 2026

Issue #760 closes #749 F9 as a dedicated server precondition. This note binds every future fact-entry or acceptance path to that guard. It does not add a route, and it does not call `regelKandidatAkzeptieren`.

`loadOfficialTruthFactEntryAuthority()` in `lib/readiness/official-truth-fact-entry-authority-server.ts` is the only live authority entry. A future F7, F8 or #741 gate must call that function and continue only when the result is exactly `{ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }`. Any other status fails closed.

The loader proves all of the following on the server, in this order:

1. `evaluateAdminAccess({ capability: 'official-truth-freigeben' })`, which is the existing verified-user and current-AAL2 admin guard.
2. `decision.allowed`.
3. `decision.grant === 'role'`.
4. `reachesDatabase(decision) === true`.
5. The user-scoped RPC `public.darf_official_truth_freigeben()` returns exactly boolean `true`.

The loader accepts no caller role, grant, reviewer, AAL, capability, user id, email, RPC result, environment snapshot or dependency override. Break-glass returns `role_grant_required` before the RPC. A missing or unapplied function returns `database_capability_unavailable`. An RPC error, a thrown read, null, or any value other than boolean `true` stays blocked. The result carries no email, user id, role string or database error text.

`decideOfficialTruthFactEntryAuthority` is the deterministic test seam. It is not the live entry. A future route that calls the seam, `requireAdminPage`, or the RPC by itself reopens F9.

The database function remains the merged LOCAL/UNAPPLIED `SECURITY INVOKER` function from `supabase/migrations/20261002154952_official_truth_owner_reviewer_capability_1.sql`. This binding does not edit or apply that migration. `types/supabase.ts` does not list the RPC. The call is one narrow user-scoped wrapper. This guard does not construct a service-role or admin client.

## Autonomous pre-acceptance witness binding — 2 October 2026

Issue #766 closes only the #749 F7 same-request precondition. This note binds that witness. It does not accept a Rule, call a store, add a route, or close F8.

`loadOfficialTruthAutonomousPreacceptanceWitness(eingabe)` in `lib/readiness/official-truth-autonomous-preacceptance-witness-server.ts` is the only live witness entry. It accepts the registry-free review material already required by `officialTruthServerHeldReviewPacket`. It accepts no caller registry, source class, domains, blocked domains, role, grant, capability, reviewer, user, AAL, clock, `maxAgeMs`, freshness result, `reviewPacketKey`, `supportVersionIds`, trusted fact, accepted claim, lifecycle override, suggestion, or model authority.

Authority comes only from `loadOfficialTruthFactEntryAuthority()`. The witness continues only for exactly `{ status: 'authorized', grant: 'role', capability: 'official-truth-freigeben' }`. Any other result fails closed before the catalog read.

One successful re-proof calls `officialTruthServerHeldReviewReproof`. That function loads `quellenKatalogLesen` once, injects that registry, recomputes #723 and #726 v2 from the same reconstructed input, and requires the packet scope and support identities to match the `review-packet:v2:` fingerprint. That identity is order-invariant: the same supports in reversed caller order remain the same key and the same sorted support ids. It returns no caller registry. The validation clock is the same server-owned reference instant the witness uses for `officialFrische`. Caller `uhr` is not read and not executed. The historical pure #723 function still accepts its own validation clock for existing callers.

Every re-proved support must be exactly `current` from `officialFrische`. `checkedAt` is the support `retrievedAt`. `validFrom` and `validUntil` are the re-proved accepted window. Content identity is the re-proved `sourceContentHash`. `now` is a server-owned reference time. No caller `maxAgeMs` is accepted. The existing global ceiling stays in force. A re-proved official source is treated as source-available only inside that helper. `requirementsProviderAus()` stays `null`. Any freshness other than `current` fails closed.

The re-proved candidate quality must be `explicit_primary_statement` or `composed_from_multiple_primary_sources`. `research_gap`, `stale_primary_evidence`, `unresolved_conflict`, a blocked packet, and same-source composition fail closed. Suggestion output and `officialTruthRegelReviewEntscheidungsabsicht` are not authority for this witness.

The success object is ephemeral proof metadata: status `authorized_preacceptance_witness`, the recomputed key, rule scope, fact kind, sorted support version ids, the server reference time, freshness `current`, and the authority echo `grant: 'role'` plus capability `official-truth-freigeben`. It is not a bearer capability, not acceptance, not a trusted fact, and not Official Truth. A later request must call the live entry again. This slice does not persist it.

`decideOfficialTruthAutonomousPreacceptanceWitness` is the deterministic test seam. It is not the live entry. A future route that calls the seam, or that calls `regelKandidatAkzeptieren` from this witness, reopens F7. F8 remains open. This witness does not call `regelKandidatAkzeptieren` or either store writer.

## Evidence-store binding — 2 October 2026

Issue #762 closes #749 F2 for the accepted-Evidence store entry. This note binds future Evidence persistence to that entry. It does not call the store, apply the RPC, accept a Rule, or add a route.

`akzeptierteEvidenceSpeichern(umschlag, uhr, extraktion, abhaengigkeiten?)` in `lib/readiness/official-truth-store-server.ts` is the only canonical accepted-Evidence store entry. It starts from registry-free retrieval input, re-proves through `officialTruthServerHeldEvidenceAnnehmen`, derives the rule scope from the returned accepted Evidence, and builds the dormant store payload only from that returned `accepted_evidence.evidence`. A free `EvidenceVersion`, a caller registry, and caller `sourceContentHash`, `versionId`, lifecycle, validation, or `lookupKey` are not arguments. They must not reach store transport.

The registry comes from the server-held catalog dependency. It is not request-body authority. Catalog failure and retrieval or Evidence rejection do not call the store. After successful re-proof, a missing store transport remains `store_not_configured`. The writer stays dormant. `check:schema-bezug` classifies `public.official_truth_store_accepted_v1` as LOCAL/UNAPPLIED because `types/supabase.ts` does not list it. That label is the repository classifier, not hosted state. At the Technical-Lead read on 2 October 2026, Development already had migration `20261001180549` and the store RPC, and `private.official_evidence_versions` had 0 rows. Production had neither that store RPC, the Evidence table, nor the source-catalog RPC. This binding applies nothing. Do not re-apply the Development migration. A future Production apply or activation remains a separate Product-Owner gate. No route calls this entry. `akzeptierteRegelClaimSpeichern` is unchanged. This binding does not add a `regelKandidatAkzeptieren` path.

The original #731 section 5 said that a composed packet whose supports share one source can exist as review material, because distinct sources are enforced at acceptance, and that the decision contract must refuse `proceed_to_trusted_fact_entry` for that packet with `same_source_composition`. That statement conflicts with accepted #717 and #723 runtime semantics. It is superseded here.

## 1. Binding principle

Technical-Lead R1 `5390891105` corrects the first delivery. Human review is the current V1 path. It is not a permanent ban on every later non-model policy.

Permanent invariant:

> **Model or plugin output alone may never directly become `trustedRuleFact` or Official Truth.**

Model and plugin output may suggest, extract, compare, or flag review material. That output is not a trusted fact and not an accepted Rule Claim.

Current V1 acceptance policy:

Until another trusted policy is separately designed, reviewed and authorized, `trustedRuleFact` may enter `regelKandidatAkzeptieren` only through the server-verified, explicitly authorized human/operator review boundary in this document.

A caller field such as `reviewerKind: human` is not that boundary. Caller assertions are untrusted. On the V1 path the server derives the reviewer from the authenticated session and derives the packet identity by re-running the #723 packet and the #726 fingerprint.

Future-compatible rule, not authorized here:

A separately versioned deterministic, non-model, fail-closed acceptance policy may later be designed for narrowly provable cases. Any such later design must:

- re-prove the exact #726 packet, key and supports;
- refuse model proposal text as the fact;
- use explicit acceptance predicates stricter than “model agrees”;
- stay a separate slice from this document;
- leave Auth, RLS, database, Production, model-secret and cost gates on their own decisions.

This architecture does not design those predicates, does not name a case where they would pass, and does not authorize that policy. No automated acceptance slice starts here.

`regelKandidatAkzeptieren` in `lib/readiness/rule-claims.ts` already ignores the candidate proposal and builds the accepted fact only from the separate `trustedRuleFact` plus evidence versions that pass `akzeptierteEvidenceLesen`. This architecture keeps that function as the only canonical Rule acceptance function. It does not add a second constructor and it does not call the function.

## 2. Place in the Official Truth chain

The merged chain on this baseline, in order:

1. Accepted Evidence is re-proved from original retrieval input.
2. #723 `officialTruthRegelReviewPacket` builds one internal review packet when #717 emits a Rule Candidate. The candidate stays `candidate` / `pending`. The packet is review material. A same-source composition does not reach this step. Section 5 states the rejection.
3. #726 `officialTruthRegelReviewPacketFingerprint` re-runs that packet and returns `reviewPacketKey`, `ruleScopeKey` and `supportVersionIds`. The key is `review-packet:v2:` plus SHA-256 of the canonical review material. The canonical bytes include each support's re-proven accepted `validFrom` and `validUntil`. They do not include `extractionNote`. The prefix `review-packet:v1:` is not this key and is not equivalent to it. The key is a deterministic identity/checksum of that review material. It is not authentication, not authorization, not reviewer identity, not an AAL/capability/grant proof, not a server-stored witness, not acceptance, and not Official Truth. It does not accept a Rule Claim. A future live gate may compare a supplied key to a freshly recomputed key only as an equality check. The key itself grants nothing.
4. This boundary is the current V1 human/operator authority step in front of acceptance. A later deterministic non-model policy is not part of this chain and is not authorized here.
5. `regelKandidatAkzeptieren` remains the only function that returns an accepted Rule Claim.
6. `akzeptierteRegelClaimSpeichern` in `lib/readiness/official-truth-store-server.ts` is the existing dormant writer. It calls `regelKandidatAkzeptieren` and stores only the returned claim. `check:schema-bezug` classifies `public.official_truth_store_accepted_v1` as LOCAL/UNAPPLIED because generated types omit it. Development already has migration `20261001180549` and the function. This document does not call the writer, does not apply anything, and does not re-apply Development. Production does not have the store RPC. Accepted Evidence persistence, when a later slice needs it, uses only the server-reproved entry bound above. That entry does not take a free EvidenceVersion or a caller registry.

Issue #728 defines a non-authoritative review suggestion. Its assessments are `supports_candidate`, `contradicts_candidate`, `insufficient_evidence` and `needs_human_review`. That output is advisory review material. It is not a decision, not a reviewer, and not a fact. This slice does not implement #728.

`requirementsProviderAus()` stays `null`. No provider is selected.

## 3. Packet binding

Every future decision binds to one exact #726 `reviewPacketKey`.

The identity source is a fresh call to `officialTruthRegelReviewPacketFingerprint` with the original packet input `{ supports, metadata }`. That is the same input #723 accepts. Each support is `{ umschlag, uhr, extraktion }`. `metadata` is only `factKind`, `evidenceQuality` and `proposal`.

The following are not identity:

- a caller-built packet;
- a caller `reviewPacketKey`;
- a caller content hash;
- a caller `trustedRuleFact`;
- a caller list of support version ids;
- a #728 suggestion object.

At decision time the server re-runs the fingerprint. The human submission names the key that was shown. The decision is valid only when the recomputed key equals that named key. A missing key fails closed. A different key is a stale or different packet and invalidates the decision. The server does not adopt the caller's key when the two differ.

A blocked #723 or #726 result has no key. It cannot carry a decision.

The fingerprint changes when the candidate scope, rule-scope key, fact kind, evidence quality, support version ids, proposal, source id, canonical URL, retrieval time, existing content hash, or the re-proven accepted `validFrom` / `validUntil` changes. A null validity window and a non-null window are different keys. `extractionNote` does not change the key and does not appear in the fingerprint output. Re-proof at decision time therefore rejects source, scope, version and accepted-validity drift that changes those bytes. The page snapshot stays out of the key and stays visible on the review surface described below. A supplied `review-packet:v1:` key does not match the recomputed `review-packet:v2:` key.

One key is one regulatory cell. A second credential option is a second packet and a second key.

## 4. Reviewer authority

Future reviewer authority has all of the following. All of them are read on the server. None of them are taken from the request body.

### Authenticated session

The reviewer is `supabase.auth.getUser()` on the server, as `loadVerifiedUser` already does in `lib/auth/admin-guard.ts`. That call asks the Auth server. `auth.getSession()` reads request cookies and is not an authorization basis. A body field `reviewerId`, `userId` or `authUid` is ignored as authority and, on the decision contract, is an unexpected field that fails closed.

### Server-verified role and capability

The role comes from `profiles.role` for that verified user id, through the existing `loadRole` / `decideAdminAccess` path. A failed role lookup stays a failure. It does not become a grant.

Current capabilities in `lib/auth/roles.ts` are:

| Capability | Minimum role | What it is today |
| --- | --- | --- |
| `betrieb-lesen` | moderator | Read security and payment overviews |
| `betrieb-eingreifen` | operator | Operational intervention such as a blocklist or refund |
| `konten-verwalten` | moderator | See accounts and assign role or status |
| `inhalte-moderieren` | moderator | Review other people's content |
| `konfiguration-verwalten` | admin | System configuration. It currently covers no table |

This document does not map Official Truth acceptance onto any of those capabilities. A moderator read capability is not acceptance authority. `betrieb-eingreifen` is not acceptance authority. Reusing `konfiguration-verwalten` would allow every admin who holds that capability to mint Official Truth. That reuse is an authority decision. Adding a new capability changes `CAPABILITY_MINIMUM` and the matching `darf_*` database function, which `lib/auth/faehigkeiten-datenbank.test.ts` keeps in lockstep. That change is a major Auth/role/RLS change and a special Product-Owner gate. Until an explicit later decision names the capability, no acceptance endpoint is authorized. That later decision is #739 APPROVE A: dedicated `official-truth-freigeben`, minimum role `owner`. The merged foundation already added that capability and `public.darf_official_truth_freigeben()`. This file still authorizes no acceptance endpoint. The fact-entry authority binding above is the required check before any later endpoint.

### AAL

Current admin and security contracts require `currentLevel === 'aal2'`. `applyAdminAal` in `lib/auth/admin-aal.ts` is that rule. `nextLevel`, the existence of a TOTP factor, a previous login, and a body field such as `aal: 'aal2'` do not satisfy it. An unreadable AAL lookup fails closed as `aal-lookup-failed`. It is not treated as AAL1 and then allowed. Break-glass does not bypass AAL2. The guard reads AAL from `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` and `parseAalLookup` keeps only `currentLevel`.

### Database grant

`reachesDatabase` is true only for `grant: 'role'`. Break-glass (`ADMIN_ALLOWED_EMAILS`) opens the admin surface and leaves the database closed (ADR-0036). A future step that can reach `regelKandidatAkzeptieren` followed by the store writer requires `grant: 'role'` after the capability check and after AAL2. Break-glass is insufficient for `proceed_to_trusted_fact_entry` and insufficient for fact entry. That step must call `loadOfficialTruthFactEntryAuthority()` and continue only on its authorized result. The binding section at the top of this file is that guard.

### Browser storage

The browser keeps the normal authenticated session that the server verifies with `getUser()`. There is no shared generic operator token in `localStorage`, `sessionStorage`, or a static bearer shared across operators. A review id in a URL is not authority.

The audit reviewer id, when a later design records one, is `user.id` from that verified user.

## 5. Decision states

A future decision has exactly one of these states. The three states apply only to an input that successfully became a Rule Review Packet. A blocked #723 result has no packet and no decision intent.

| State | Meaning |
| --- | --- |
| `needs_more_evidence` | The packet stays review material. No trusted fact is created. Acceptance is not called. |
| `reject_candidate` | The candidate is not promoted. No trusted fact is created. Acceptance is not called. Evidence rows stay as they are. |
| `proceed_to_trusted_fact_entry` | The separate human fact-entry step may open for this exact key. This state is not an accepted Rule Claim. |

On the current V1 path there is no decision state named accept. Only the later human fact-entry step may supply a `trustedRuleFact` to `regelKandidatAkzeptieren`. A future deterministic policy is not a fourth state in this contract.

`needs_more_evidence` and `reject_candidate` do not write `not_required`, do not close another credential option, and do not turn a missing rule into a negative official result. The live engine result stays `unknown` while no accepted claim exists.

`proceed_to_trusted_fact_entry` is allowed only when the re-proven packet would still satisfy the acceptance predicates already enforced by `regelKandidatAkzeptieren`:

- evidence quality is `explicit_primary_statement` or `composed_from_multiple_primary_sources`;
- every support is `official_authority`;
- explicit quality has at least one support;
- composed quality has at least two supports and at least two distinct official `sourceId` values.

`stale_primary_evidence`, `unresolved_conflict` and `research_gap` cannot take `proceed_to_trusted_fact_entry`. They remain eligible for `needs_more_evidence` or `reject_candidate`. A research gap keeps a null proposal. None of those three qualities can be approved into accepted truth.

`composed_from_multiple_primary_sources` means multiple distinct official sources before a Rule Candidate is emitted. #717 `officialTruthRegelKandidatAusEvidence` calls `regelKandidatErstellen`, then rejects that quality when the accepted official Evidence has fewer than two distinct `sourceId` values. The failure is `{ ok: false, reason: 'same_source_composition' }` and carries no candidate. Returning that candidate would present one source as composition from multiple primary sources.

#723 calls #717. A same-source composed input therefore fails before a `rule_review_packet` exists. #726 has no review key for that input. No decision intent exists for it, including `needs_more_evidence` and `reject_candidate`. Those two states apply only to an input that successfully became a Rule Review Packet. They still do not write `not_required` and they still do not close another credential option.

If more evidence is required after `same_source_composition`, the upstream research and evidence path must obtain an eligible distinct official source, or otherwise produce a valid candidate quality. The review layer must not relabel that invalid composition as valid review material.

#734 `officialTruthRegelReviewEntscheidungsabsicht` keeps a local source-count check on the proceed path. That check is defense in depth. It is currently unreachable through a successful #723 packet, because #723 already returned `same_source_composition` and no packet. It is not a new candidate path and it does not create a review packet for the rejected input.

`regelKandidatAkzeptieren` remains the only canonical acceptance function. For a packet that does exist, `proceed_to_trusted_fact_entry` still requires the distinct-source predicate above. This reconciliation changes no runtime behavior.

A #728 suggestion may be shown next to these states. It cannot select the state.

The pure decision result carries the recomputed `reviewPacketKey`, `ruleScopeKey`, `factKind` and the decision state. It does not carry `trustedRuleFact`, `lifecycle: 'accepted'` or an accepted claim.

A client flag `decision: 'proceed_to_trusted_fact_entry'` on a later request is not proof that this server recorded that decision. Fact entry across requests requires a server-held binding between the verified user, the exact key and the proceed state. Choosing a persistent store for that binding is part of the later audit/retention design and is not chosen here. Until that binding is server-held, fact entry must not be implemented.

## 6. Trusted fact entry

On the current V1 path, trusted fact entry is a second explicit human step. It is separate from the decision. This section does not define a fact source for a future deterministic policy.

The reviewer sees, on the review surface:

- the re-proven candidate, including its proposal as untrusted review material;
- the official support material from the #723 packet, including each support's `sourceSnapshot`, canonical URL, retrieval time, source id and content hash.

The fingerprint output alone is not that surface. The fingerprint omits the snapshot, the URL, the content hash, the proposal and `extractionNote` on purpose. Accepted validity is inside the checksum and is still not authority. The human still sees the review material before fact entry. The decision still binds to the fingerprint only by equality with the recomputed `review-packet:v2:` key.

The typed fact is entered or explicitly confirmed at this human boundary. The server passes that submitted value as `trustedRuleFact`. It does not copy `kandidat.proposal` into `trustedRuleFact` when the field is missing, untouched or merely displayed. A missing fact does not call acceptance.

If a later UX pre-fills the form from the proposal, the pre-fill stays visibly untrusted. An explicit confirmation control, distinct from first render, is required before the value can be submitted. The server still uses only the submitted fact-entry value. It does not substitute the proposal, and it does not treat equality with the proposal as a server copy. `regelKandidatAkzeptieren` continues to ignore the proposal when it builds the accepted fact.

The submitted fact must pass the existing `regelFaktLesen` rules for the packet's `factKind` and requirement type. Fact kinds remain the current set: `requirement_effect`, `visa_options`, `stay_limit`, `passport_validity`, `blank_passport_pages`, `transit_conditions`, `official_actions` and `temporal_rule`. This boundary does not add a fact kind and does not invent a visa, transit, health, carrier or document rule. Personal-identifier keys still fail closed inside the existing reader.

The same verified user who made the server-held proceed decision is the user who may submit the fact. Both identities come from `getUser()`. Before that submission can reach acceptance, `loadOfficialTruthFactEntryAuthority()` must return authorized for capability `official-truth-freigeben`.

## 7. Revalidation before acceptance

On the current V1 human path, immediately before any call to `regelKandidatAkzeptieren`, the server re-proves the chain. A failure skips the call. A later deterministic policy, if a separate slice ever authorizes one, must re-prove the same #723 packet and #726 key before it can reach that function. This section does not specify that policy.

1. Re-run #723 `officialTruthRegelReviewPacket` on the original `{ supports, metadata }`.
2. Re-run #726 `officialTruthRegelReviewPacketFingerprint` on that same original input.
3. Require the recomputed `reviewPacketKey` to equal the key on the server-held decision.
4. Require the recomputed `ruleScopeKey` and `supportVersionIds` to equal the decision's re-proven values.
5. Require a server-held `proceed_to_trusted_fact_entry` for that key and the same verified user.
6. Re-prove accepted Evidence through the packet path. The evidence versions passed into acceptance are those re-proven versions, not a client-supplied list.
7. Require no source, scope, version or accepted-validity drift. Drift that changes the canonical fingerprint bytes, including `validFrom` or `validUntil`, produces a different `review-packet:v2:` key and stops acceptance. `extractionNote` is not part of that key. The registry is the registry inside the original envelopes, re-read by #723. A matching key remains an equality check. It is not itself acceptance and it is not a capability.
8. Call only `regelKandidatAkzeptieren` with the re-proven candidate, the human-submitted `trustedRuleFact` for this V1 path, the re-proven evidence versions and the re-proven registry. A later deterministic policy would still have to enter through this same function. This document does not define that policy's fact source.

The function's own checks still apply: acceptable quality, accepted evidence, support match, scope match, `official_authority`, distinct sources for composed quality, and `regelFaktLesen`. This boundary does not weaken them and does not duplicate them as a second acceptance engine.

A successful return value is the only object a later store write may persist. The candidate, the proposal, the suggestion and the decision record are not stored as an accepted claim.

## 8. Audit and provenance

A later design may record a minimal decision audit. This document defines the fields and does not choose retention, a table, a migration or a retention window.

Minimal fields:

| Field | Source |
| --- | --- |
| `reviewPacketKey` | Recomputed #726 key, prefix `review-packet:v2:`. Equality check only. Not a capability, grant, AAL proof, reviewer identity, server witness, or acceptance. |
| `ruleScopeKey` | Re-proven candidate key |
| `factKind` | Re-proven candidate |
| reviewer auth uid | `user.id` from server `getUser()` |
| decision timestamp | Server clock at the authenticated endpoint |
| decision type | One of the three decision states |

The timestamp is not taken from the client. The pure decision contract does not mint that timestamp with `Date.now`. When a later function needs a clock, the clock is injected, consistent with the existing readiness modules.

The minimal audit does not include the proposal, the page snapshot, the content hash, the trusted fact body, a passport number, MRZ, a scan, biometrics, health data, an email address, a session token or the request body. Regulatory country and document-type context already live inside the rule-scope key's cell. They are not copied out as a second personal record here.

#626 is the retention/audit precedent and the block this slice must not enter.

- The actor on an audited mutation is the verified session, never a caller-chosen actor. Comment `5887161416` approved that shape only for the Development blocklist producer.
- Server time and fixed bounded metadata are the precedent. Passport, health, traveller, trip and request-body content stay excluded.
- The Development figures of 7 days, hourly cleanup and 1,000 retained events belong to that security-event producer. They are not a general retention policy and they are not the retention choice for this audit.
- Latest #626 comment `5908548520` (30 September 2026) keeps the issue **OPEN / BLOCKED**. Temporary operator permission is not established. Three genuine producer-owned events are not started. Authenticated populated erasure is not run. This architecture does not retry, reformulate or route around that blocked role operation.
- This audit is not `public.security_events` and does not share that producer, cron job or quota.
- #626 also records that backups and WAL have separate lifecycles. A later retention design must not claim that deleting a live audit row erases every copy. This document does not choose that design.

Persistent reviewer audit or retention storage is a special Product-Owner/security gate. The design note in a future docs slice is not that gate. Implementing the table is.

## 9. Model boundary

#728 suggestions, and any #730-style suggestion implementation of that contract, are advisory only. A model, tool or plugin may suggest, extract, compare or flag. It may not:

- assert operator identity;
- assert `reviewerKind`, role, AAL or grant;
- select a decision state;
- give final approval;
- emit `trustedRuleFact`;
- emit an accepted Rule Claim;
- pre-fill the trusted fact as if it were already accepted.

A suggestion that says `supports_candidate` still leaves the current V1 decision to the verified human. It is not acceptance, and it is not a deterministic policy. `needs_human_review` is already the suggestion's own ceiling. A suggestion cannot authorize the future policy in section 1.

The official OpenAI Developers plugin is installed and enabled in the Product Owner's ChatGPT environment, as recorded on current `main` in `docs/ACTIVE_WORK_STATUS.md`. That installation may guide a Technical-Lead chat on current OpenAI API and Agents SDK questions. It does not authorize creating or exposing API keys, storing secrets, activating paid or live OpenAI calls, selecting a provider, or adding material recurring cost. Jetnity Official Truth contracts remain canonical. Plugin output cannot mint Official Truth.

This slice makes no model call and no network call.

## 10. Smallest future implementation sequence

The sequence below is the only authorized **current V1** implementation path. It is the human/operator path. It is not the only conceivable permanent authority mechanism. A separately versioned deterministic non-model acceptance policy sits outside this sequence. This slice does not design it, imply it, or start an automated acceptance slice. This slice starts none of the steps below.

1. **Pure decision-intent contract.** Re-prove the #726 key from original packet input. Accept only the three decision states, and only after #723 returns a packet. Same-source composition is already rejected by #717 and never enters this contract as review material. The #734 proceed-path source-count check remains defense in depth. Refuse `proceed_to_trusted_fact_entry` when acceptance predicates fail on a packet that does exist. Reject caller authority fields and caller packet identity. Return no trusted fact and no accepted claim.
2. **Authenticated server review endpoint.** The verified session is `getUser()`. The endpoint shows the re-proven candidate and the official support snapshots. It records a decision only after the checks in sections 3 and 4.
3. **Privileged reviewer authorization check.** Role, capability, AAL2 `currentLevel` and `grant: 'role'`, all server-side. The capability named by the later owner decision is `official-truth-freigeben`. The check is `loadOfficialTruthFactEntryAuthority()`, which also requires `reachesDatabase` and user-scoped `darf_official_truth_freigeben() === true`. Break-glass stops before fact entry and before that RPC. This architecture still authorizes no acceptance endpoint.
4. **Fact-entry validation.** A separate explicit human submission. The server re-proves the key and the server-held proceed binding, then validates the submitted fact with the existing fact reader. It does not copy the proposal.
5. **Canonical `regelKandidatAkzeptieren`.** The only acceptance function, called on this V1 path with the re-proven inputs from section 7.
6. **Separate persistence.** Only the returned claim, through the existing `akzeptierteRegelClaimSpeichern` writer. The writer stays dormant until a later slice is explicitly assigned. Production apply stays gated. Accepted Evidence, if a later slice persists it, uses only `akzeptierteEvidenceSpeichern` after `officialTruthServerHeldEvidenceAnnehmen`. That call is not Rule acceptance.
7. **Audit and retention design.** Separate from steps 1–6. Fields are section 8. Retention and the table are not chosen here.

A later slice owns one step. It does not skip ahead to acceptance, the store or a model call.

## 11. Gate classification

Special Product-Owner/security gates under the current operating standard are: a major Auth/AAL/role/RLS change, a persistent reviewer audit or retention database change, Production activation, and a model or live API call that uses secrets or creates cost.

| Future step | Classification |
| --- | --- |
| This docs slice and any later pure decision-intent contract | Not a special gate. No Auth, database, Production or model call. |
| Authenticated server review endpoint that only reuses `requireAdminApi` / `evaluateAdminAccess` | Not a special gate while Auth, session, MFA, AAL and RLS stay unchanged. Changing any of those is a special gate. |
| Privileged reviewer authorization that adds a capability, changes `CAPABILITY_MINIMUM`, or changes a `darf_*` function or RLS | Special gate. A major Auth/role/RLS change. Naming which existing capability may mint Official Truth is an explicit authority decision required before that endpoint may authorize acceptance. This document does not make that choice. |
| Fact-entry validation as pure checking of a human-submitted fact | Not a special gate while it does not call a model and does not write a database. |
| Calling the existing `regelKandidatAkzeptieren` | Not a new special gate. The function stays the only acceptance function. The call does not authorize persistence or Production. |
| Persistence through `akzeptierteRegelClaimSpeichern` | Production apply or Production activation of `official_truth_store_accepted_v1` is a Product-Owner gate. `check:schema-bezug` classifies the RPC LOCAL/UNAPPLIED because generated types omit it. Development already has migration `20261001180549` and the function. Do not re-apply Development. This document applies nothing. |
| Persistence of accepted Evidence through `akzeptierteEvidenceSpeichern` | Not a new acceptance path. The payload comes only from server-held re-proof. Production apply or activation of the same RPC remains a Product-Owner gate. Development already contains the function and had 0 Evidence rows at the 2 October 2026 Technical-Lead read. Do not re-apply Development. |
| Audit/retention design prose | Not a special gate. |
| Implementing persistent reviewer audit or choosing retention | Special gate. It is not the #626 security-event producer and it does not inherit that 7-day window. |
| Any model, plugin or live API call with a secret or a cost | Special gate. The OpenAI Developers plugin note does not authorize it. |
| A later deterministic non-model acceptance policy | Not authorized by this document. A future design slice for that policy is separate. Implementing it still meets the Auth, RLS, database, Production, model-secret and cost gates above whenever those apply. This row does not approve the policy. |

## 12. Traveller context

One decision binds one `reviewPacketKey` and therefore one regulatory cell. The cell keeps the full citizenship set already carried on the re-proven candidate. The issuing country stays the credential option's issuing country. It is not treated as citizenship. An unlinked document stays unlinked.

A second citizenship relation or a second travel document is another packet, another key and another decision. Rejecting or pausing one option does not decide the other and does not produce `not_required`. Insufficient evidence stays `needs_more_evidence` or an absent accepted claim, which the engine still surfaces as `unknown`.

This architecture invents no visa, transit, health, carrier, eligibility or document rule. It does not collect a passport number, MRZ, scan, biometric, birth date or health record.

## 13. Out of scope

This slice does not add a runtime module, an API route, an Auth or RLS change, a migration, a call to `regelKandidatAkzeptieren`, a trusted fact, a model call, a provider call, a secret, a Production change or a public-indexing change. It does not start the V1 implementation sequence. It does not authorize or start a deterministic non-model acceptance policy, and it does not select a capability.
