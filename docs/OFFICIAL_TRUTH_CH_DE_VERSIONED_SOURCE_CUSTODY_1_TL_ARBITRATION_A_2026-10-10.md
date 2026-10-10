# Technical Lead Scope Arbitration A — CH→DE Versioned Source Custody 1

Date: 2026-10-10  
Binding base task: `docs/OFFICIAL_TRUTH_CH_DE_VERSIONED_SOURCE_CUSTODY_1_TASK_2026-10-10.md`, blob `2540fda6bcf7b4111296ad2695128dc30c2183b2`, acceptance VC01–VC30 **unchanged**.  
Parent: #917, task #921, Draft #922.  
Actual main at scope arbitration: `c3db56a4021904aa21c25d75d218f91ee1127697`, mode NORMAL.  
Single logical writer: **Jetnity CH-DE Versioned Source Custody 1 — GitHub Copilot Generation 1**. Continue the *same* stopped agent/session on the *same* existing branch; do not fork or start a second writer.

## Why TL intervenes

Author responded to VC01–VC03 with `BLOCKED / TL SCOPE ARBITRATION`: safe admission of long snapshots needs a versioned fingerprint semantics re-proven consistently across Evidence, review, storage and same-request; Bern's genuine code-owned identity profile is absent; a partial positive path is forbidden. **TL accepts that STOP as correct.** No code was pushed, no testing completed, and seed-only PR is not PASS.

A new **read-only independent TL finding** merits one *strictly bounded no-migration feasibility recheck* before a protected schema-expansion decision:

`supabase/migrations/20261004010705_official_truth_content_identity_2.sql` already defines/persists on `private.official_evidence_versions`:
- `identity_schema = 2`,
- `content_item_id/version`, `representation_id/version`,
- `identity_profile_id/version`,
- `content_type` and `canonical_url`,
- an exact compound FK to registered representations,
- `source_content_hash` constrained to 64 lower-case hex digits (from earlier migration),
- immutable/historical `ev2_*` identity/version contracts.

**This does not by itself prove** that the current hash is algorithm-versioned or that an alternate hash is safe. It only means “there is no separate `fingerprint_version` column” does not alone prove a SQL migration is unavoidable. In principle an immutable exact versioned code-owned identity/profile tuple might select a hash algorithm *if and only if all producers, consumers, accepted evidence, RPCs, immutable historical artifact verification and replay enforce it*. No identity value, profile pin, or hash string sent from a caller may grant this ability.

## Arbitration verdict / exact allowed next action

**ARBITRATION_A_APPROVED_FOR_READ_ONLY_FEASIBILITY_AND_CONDITIONAL_CODE_ONLY_PROOF**.

The TL authorizes the same Copilot author to continue VC03 in the existing #922 Draft, but only in this order:

1. **Read-only proof of feasibility.** Inspect the already-shipped `identity_schema=2`, `identity_profile_id/version`, FK, `ev2_*` source/evidence identity, canonical full-source hashing, accepted Evidence readers, Rule Review Packet, refresh/recheck, same-request extraction/proof, deterministic trust/extractor, RPC JSON validation, SQL equality/immutability/legacy path and any historical provenance store. No assumed authority from a database field; use actual repo code and migration evidence. Report concrete signatures, source lines and every producer/consumer; identify contract collisions, missing proof steps and any existing profile that cannot interpret historical v1.
2. **Evaluate two explicit options without committing to either:**
   - **A / NO-MIGRATION:** a **genuinely immutable code-owned approved profile + exact identity version** can determine the fingerprint variant, preserve a 64-hex content hash and `ev2_*` identity under existing persisted FK fields, with stable historical verification, default legacy fingerprint semantics untouched, strict domain separation/version and all downstream re-proof. Report why this is secure or exactly where it fails.
   - **B / NEW PERSISTED SCHEMA:** a separate `fingerprint_contract_version` (or equivalent trusted structured custody) is unavoidable. Identify the exact new-column/RPC/readback/history/rollback/privacy/retention/owner scope; **do not create/edit a migration or change runtime code** as this is reserved for a separate reviewed task and Product-Owner authorization where applicable.
3. **No fabricated source eligibility.** The compiled profile registry currently contains GOV.UK only; **DO NOT** add Bern or a “synthetic approved production profile”. A pure, isolated digest-property test on **non-authoritative synthetic text**, if necessary for option A, is permissible as a pure hash test; it may not produce `server_owned_official_retrieval`, accepted Evidence/Rule or imply a live approved source.
4. **If AND ONLY IF Option A is defensible without changing DB/schema/Auth/RLS/production source approval**, continue the original VC01–VC30 implementation strictly in task-owned code/tests. First add negative-only test evidence for old path invariants, no caller-controlled fingerprints, wrong/new profile version, unregistered S3, no direct SHA fallback or public truth. No partial trusted large-body envelope; no relaxed import guard; no new dependency or paid call. Each downstream path consuming a permitted *versioned* digest must independently re-prove exact profile+identity+contract. Run full serial native PG16 suite + Typecheck/Lint/Build/security/hygiene. A safe local pure hash test is not a visitor truth proof. If full end-to-end cannot be made safe, STOP and do not invent progress.
5. **If Option A is not provable**, stay STOPPED / BLOCKED and produce only a finite **TL/PO decision packet** in task-scoped docs or the GitHub issue: exact incompatible contracts, minimal schema and code changes required, migration/retention/rollback tests/atomicity, safety risks, and concrete Owner-gated choices. Do not implement Option B or broaden shared contracts without a new explicit TL task/Owner approval.

### Hard boundaries not changed

- Existing legacy `evidenceQuellenFingerprint` `snapshot.length <=65_536` (UTF-16), default HTTP 65,536-byte cap, and production/government source identity behavior **must stay exactly unchanged** for all existing and unknown sources.
- The #920 131,072-BYTE transport exception stays unqualified/dormant while Bern compiled profile is absent. Correctly keep `SOURCE_NOT_QUALIFIED`, #917 OPEN, no actual CH→DE visa/entry statement.
- Do not equate `131072 UTF-8 bytes` with `131072 UTF-16 units`; preserve complete raw response, full-body normalization and bounded independent verification.
- **No Supabase hosted Development/Production writes, migrations or RLS**, no Auth/AAL changes, live registrar/actual-source profile approval, real Rule/Evidence/F8 promotion, customer-visible Requirements Provider, public website/indexing, new provider/secret/paid call/recurring cost, privacy/retention choice, or alteration of safety-blocked #913. No confidential source body/hash/system-machine data in GitHub.
- **Agent is not TL:** can plan/implement/test/commit/push only authorized #922 source files; cannot Ready/merge/rebase-force/silently modify main/start follow-up. All new heads invalidate old head gates. STOP for independent TL review or protected gate.

## Independent TL acceptance of this arbitration

This is a **question with a protected stop condition**, not an instruction to force Option A to succeed. Engineering may legitimately report `NO_MIGRATION_NOT_PROVABLE` and stop; never weaken source/evidence contracts to avoid a migration.

The baseline #922 seed had no author changes. This new versioned TL arbitration document is a scope clarification only; an updated commit/head must be re-read and re-gated after it lands. If the original author session cannot be resumed, stop and report unavailable, do not impersonate or claim completed work.

**STATUS: TL ARBITRATION A / RESEARCH + CONDITIONAL CODE-ONLY CONTINUATION / DO NOT READY / DO NOT MERGE / DO NOT START FOLLOW-UP.**
