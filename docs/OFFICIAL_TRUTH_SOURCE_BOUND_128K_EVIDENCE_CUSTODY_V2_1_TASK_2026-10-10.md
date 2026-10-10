# Official Truth — Source-Bound 128KiB Evidence/Custody V2 1

**Status:** BINDING TASK SEED — CODE + LOCAL POSTGRES IMPLEMENTATION; NO HOSTED APPLY.  
**Date:** 10 October 2026. **Issue:** #925. **Product parent:** #917 (real CH ordinary passport -> Germany visa, still OPEN).  
**Repo:** Jetnity/jetnity; **branch:** feat/official-truth-128k-evidence-custody-v2-1.  
**Baseline:** main c3db56a4021904aa21c25d75d218f91ee1127697, mode NORMAL (re-read live).  
**Single logical writer:** Jetnity Official Truth 128KiB Evidence Custody V2 1 — GitHub Copilot Generation 1 (NEW; not the ended #922/#924 authors).  
**Authority:** Only ChatGPT Technical Lead independently FINAL PASS / Ready / Merge. Writer can implement/test/commit/push in owned branch, then STOP. No real regulatory acceptance or Production changes.

## Proven starting point and exact product deliverable

Do NOT repeat source-size measurements or smaller-page experiments. Merged #918 recorded one-time full-uncompressed research measurements S1 Auswaertiges Amt Staatenliste 92,963 B, S2 AA FAQ 78,922 B, S3 German Embassy Bern 71,122 B. They fit 131,072 bytes but are NOT currently source/identity/privacy/legal qualified. Merged #920 added a dormant source-specific 131,072-BYTE TRANSPORT path for exact future Bern profile; ordinary HTTP remains 65,536 BYTES and the Bern profile is currently NOT compiled/approved. This does not grant new trust.

Actual missing link: legacy evidenceQuellenFingerprint in lib/readiness/evidence.ts refuses sourceSnapshot with JS String.length above 65,536 UTF-16 units; official-truth-server-owned-retrieval.ts, retrieved material, candidate/accepted Evidence, trusted extractor, Rule Review, same-request, refresh, trusted-store SQL RPC and historical provenance depend on the current unversioned 64hex hash. identity_schema=2 / ev2_* is versioned identity, NOT a demonstrated fingerprint protocol version. A raw sha256 fallback or global bound increase is a known P1 bypass.

**Ship an implemented and locally PostgreSQL-tested, immutable, explicit versioned whole-source fingerprint and custody contract that supports ONE future source-specific approved full response up to 131,072 raw UTF-8 bytes while keeping every legacy caller and identifier unchanged.** Real source qualification and Trip Workspace visitor activation are separate later protected gates. A pure documentation report is not the requested delivery.

## Mandatory acceptance criteria EC01–EC28

**EC01 Baseline.** Read live main, operating mode, JETNITY_START_HERE, TL standard, #751, #748 unread MATERIAL, #917, merged #918/#920, stopped #922/#924 and safety-blocked #913. Check branch/task exact SHA, competing authors and merge-base. Do not cherry-pick old unreviewed branches or overwrite a paused workspace.

**EC02 Dependency map.** Independently inventory exact producers/consumers of sourceSnapshot/sourceContentHash and immutable history in existing lib/readiness modules, SQL migration/RPC, Evidence version, Review Packet, refresh/replay, Integrated Pilot and autonomous provenance. Include exact affected function signatures and stored fields in CONTRACTS. Reuse canonical system; no second engine, store or network fetch.

**EC03 Backwards compatibility.** Preserve legacy evidenceQuellenFingerprint for ALL existing/unknown calls EXACTLY: original LF-normalized SHA256, JS String.length 1..65,536, historical v1 SHA golden vectors, legacy sourceContentHash, identity_schema 2/ev2_* identifiers/lookupKeys/rows/RPC/readback. Preserve default 65,536-BYTE HTTPS response ceiling and GOV.UK behavior.

**EC04 Explicit new protocol.** New source fingerprint contract must be strictly typed/versioned, with immutable explicit identity/preimage and persisted discriminator (or a complete independently demonstrated equivalently safe versioned mapping). Distinguish v1/v2, no ambiguous 64hex hash treatment. If needed implement a new Evidence identity schema/versionId family while keeping ev2_* historic bytes intact; do not silently repurpose old schema.

**EC05 Real code-owned authorization.** New >64KiB material eligibility requires a single approved CURRENT COMPILED code-owned profile and exact registered sourceId + contentItem/version + representation/version + identityProfile/version + full canonical request/final URL + media. Caller/model-supplied flag/maxBytes, source hostname, injected mock/catalog/profile, test seam and unqualified/historical profile cannot elevate size/trust. Before any network, failure must remain bounded/refused.

**EC06 Source dormant.** Do NOT register or compile an actual Bern/AA approved profile, change hosted source registry, insert real Evidence or assert Swiss visa-free. #920 current Bern source-bound budget remains dormant until separately approved. You CAN use pure synthetic fixed data tests to demonstrate deterministic v2 fingerprint math without generating live source-authority or an accepted legal rule.

**EC07 Complete response, never truncated.** For v2 require full original decompressed? No: preserve existing no-compression strict ACCEPT-ENCODING identity contract and original complete HTTP response with max 131,072 UTF-8 TRANSPORT BYTES; enforce full actual stream and declared GET size, timeout/abort, HTTPS 443, DNS/public-IP/pinned socket/TLS, media, charset, redirects and no credentials. Reject compression, invalid UTF8/BOM, length drift, late oversize chunk, conflicting headers, partial body. Explicit independent UTF-16 code-unit bound and full LF normalisation; no byte/unit confusion.

**EC08 Cryptographic v2.** Bind full original bounded source and exact source tuple, profile, protocol/version to a CLOSED domain-separated canonical preimage (preserve v1 SHA byte-for-byte). Never hash an extracted snippet, abbreviated HTML, untrusted caller-provided digest, raw SHA after legacy function rejects, or body constructed by a model. No trusted receipt after refusal.

**EC09 Uniform consumer re-proof.** Existing server-owned retrieval, retrieved-material, Evidence candidate/accept/accepted-reader, extractor, Review packet, same-request, refresh, SQL store/RPC and provenance replay must all agree on protocol and immutable tuple. Every consumer rejects unknown/missing/mixed/downgrade profile/protocol/identity. Historical v1 accepted rows remain readable only as v1 and never automatically upgraded.

**EC10 No caller authority.** Model/research input cannot supply or override fingerprint version, authority, URL, retrievedAt, sourceSnapshot, hash, validFrom or trusted status. Preserve existing ownership/privacy checks, decision-field ban and source re-proving. Fake profile or direct service-role RPC cannot mint a valid v2 approval merely with a 64hex hash; document and test current storage authority boundary.

**EC11 Canonical applicability.** No personal identity capture; Swiss citizenship is not residency or passport issuing country. 1:n citizenship + documents, ordinary document subtype, purpose/route/transit/date applicability and legal effective interval remain unknown until separately proven. unknown != not_required. No real positive CH->DE visa result this task.

**EC12 Additive local schema.** This TASK expressly ALLOWS a NEW repository SQL migration artifact under supabase/migrations and matching existing trusted-store RPC/code changes if essential. Explicit persisted fingerprint protocol (or defended equivalent), immutable identity consistency, exact profile pin/FK/old constraint compatibility and all impacted receipt/replay/compare paths. Existing RLS + FORCE RLS, grants, security definer boundaries, immutable history, idempotent retry, transaction atomicity, locks/timeout and guard failure semantics unchanged. Fail closed against unknown protocols and installed data incompatibility.

**EC13 No hosted apply.** Execute DDL and synthetic proof ONLY on disposable local native PostgreSQL 16. NEVER run migrations/DDL, registration/ingest or modify hosted Supabase Dev/Production, RLS/Auth/AAL, secrets, retention or customer data. Hosted schema apply, actual source admission/retention/acceptance, F8 and public visitor activation require separate specific Product Owner gates.

**EC14 Version ID derivation.** New Evidence/review/storage binding must cryptographically include protocol version (and exact source identity) without silently rehashing old v1 artifact version IDs or changing legacy lookup/receipt formats. Explicit schema family if needed; existing SQL FK/unique/citation/support contracts must stay consistent.

**EC15 Local integrated proof.** Create a security-complete developer-only synthetic >65,536 and <=131,072 whole-body test spanning producer/fingerprint/Evidence/review/SQL RPC insert/idempotent retry, independent readback and same-request replay IF AND ONLY IF isolation cannot bestow actual production source authority. Otherwise show precise NOT_VERIFIED and refusal, not a fabricated positive. No real government HTML in fixtures.

**EC16 Native PG hardening.** On disposable PG16 run fresh+representative old v1 migration, v1 old rows unchanged, v2 new versioned schema, duplicate/conflicting idempotency one-winner, concurrent transaction, incomplete reference/forged digest/version mismatch denial, rollback without partial rows, FORCE RLS/ACL/grants/immutability, native timeouts and actual PG16 semantic/R2/R3/structural regression groups. No change in production SQL before Owner gate.

**EC17 Boundary tests.** v1 65,535/65,536 accepts, 65,537 refuses for bytes and JS UTF-16 units. v2 131,071/131,072 and 131,073 byte tests, multi-byte UTF8/codeunits, surrogate/CRLF normalisation and encoded/decoded bounds; forged caller v2, stale/wrong/revoked profile, wrong URL/media/redirect, trailing data, truncated stream, compression, tampered same-request proof and replay all refuse. Confirm old profile defaults remain strict.

**EC18 Security equivalence.** Existing SSRF/TLS/HTTPS/443/DNS/socket pin, bounded redirects, response media/UTF8, no secret/cookie forwarding, abort cleanup, cost/CPU/concurrent memory bounds, 10s timeout and safe-public-output checks may NOT weaken. No full HTML body/raw hash/IP/personal identifier, local home path or model/session traces in GitHub docs, fixtures or logs; use synthetic finite counters only.

**EC19 Do not duplicate work.** Keep #922 and #924 untouched. Their no-migration blocker and limited S4/S5 tool are historical context, not authority. #913 privacy publication stays platform-safety BLOCKED. Existing source and inspector code is reused, not copied to new alternate engine.

**EC20 Strict file scope.** Own necessary existing lib/readiness Evidence/source-identity/retrieved/extractor/same-request/accepted/store/provenance files and corresponding tests plus exactly one new SQL migration + native SQL test file(s), and task docs. No app UI, account runtime, types/trips, unrelated refactor, packages, CI workflow, Auth, RLS/Owner policy, paid API or provider without fresh explicit TL scope amendment.

**EC21 Full verification.** Run focused + full serial native test suite (no skip/xfail/softened assertions), npm ci when needed, npm run typecheck/lint/build/check:setup:ci/check:operating-mode/check:api-schutz/check:schema-bezug/check:dead/check:exports/check:deps and git diff --check. Report every real outcome, native PG version and exact tests/suites. GitHub CI on exact implementation HEAD plus Auth and matching Vercel Preview are TL gates; action_required/0 jobs is NOT success.

**EC22 Privacy and cost.** No personal passport numbers/MRZ, birthdates/health, accounts/trips, real HTML, new secrets, hosted writes or new recurring costs; existing USD100/month cap, actual incremental cost $0. Report bounded approximate memory/CPU per 128KiB in-flight original body and no unbounded replay/retention.

**EC23 Six reports.** Publish TASK-named PLAN, CONTRACTS, REPORT, SELF_REVIEW, STATUS and HANDOFF plus sanitized finite synthetic evidence manifest. Keep TASK blob immutable. Record main, merge-base, exact author HEAD/tree, changed paths, migration filename/blob/unapplied, v1/v2 invariants, tested/blocked native groups, rollback plans and precise reserved Owner decisions.

**EC24 Material progress required.** This is an implementation task: deliver working, independently testable canonical protocol + local DB integration if safe, not only another research recommendation. If a real architectural impossibility is encountered, STOP with independently reproducible exact blockers; do not claim a dormant utility equals completed custody.

**EC25 No special gate crossed.** Preparing SQL in repo and testing in throwaway local PG16 is permitted; never APPLY on hosted Supabase. Separate later protected decisions for exact source/profile/privacy/legal approval, Development/Production migration and retention, real Evidence/Rule acceptance, trusted accepted reader, F8 or visitor Trip Workspace activation. A broad user “weiter” does not approve those actions.

**EC26 SINGLE_AGENT.** Fingerprint/identity/SQL/consumer semantics are one authority boundary. One new GitHub Copilot Gen1 writer on one branch; no overlapping parallel coding. Independent read-only Guardian is supplementary. Agent may commit/push/correct only in owned scope, but MUST leave Draft, not Ready/Merge, not auto-start next slice.

**EC27 Exact-head independent review.** Re-read origin/main and task blob just before push/STOP. A new head invalidates prior CI/self-review. TL independently reviews entire changed diff, SQL/FK/RPC/RLS/data compatibility, security/PII, native PG16 tests, GitHub CI/Auth/Preview and all open threads. Green automation and agent Self-Review never substitute for TL PASS.

**EC28 STOP.** Final delivery is CODE_ONLY_128K_EVIDENCE_CUSTODY_V2_READY_FOR_TL_REVIEW only when full local protocol + migration + relevant replay are independently defensible. Otherwise PARTIAL/BLOCKED with exact missing predicates. No automatic follow-up, no real government source qualified, no production writes/launch/visitor result.

## Stage after THIS task (NOT automatically authorized)

Owner-supervised separately qualified S1 AA Staatenliste or S3 Bern exact identity, full legal/ordinary-passport/exceptions/time verification; then actual accepted Evidence/Rule, server-held accepted reader, existing Trip Workspace OfficialEvaluation[] runtime and staged environment/Owner permissions. This task unblocks 128KiB material custody; it does not claim Official Truth production is complete.

**STOP — code and local database test only. Wait for independent Technical Lead review.**
