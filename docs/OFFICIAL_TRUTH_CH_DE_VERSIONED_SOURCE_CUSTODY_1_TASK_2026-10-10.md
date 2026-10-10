# Jetnity – Official Truth CH→DE Versioned Source Custody 1

**Status:** BINDING TASK / TASK SEED / CODE-ONLY / REQUIRES INDEPENDENT TL REVIEW  
**Date:** 10 October 2026  
**Parent:** #917 (still OPEN; real visa Official Truth unqualified)  
**Task Issue:** #921  
**Repo:** Jetnity/jetnity  
**Baseline:** main `c3db56a4021904aa21c25d75d218f91ee1127697` (merge #920). Re-read live before work.  
**Branch:** `feat/official-truth-ch-de-versioned-source-custody-1`  
**Logical coding agent:** **Jetnity CH-DE Versioned Source Custody 1 — GitHub Copilot Generation 1**. New agent; do not reuse completed #920 author/session.  
**Operating Mode:** NORMAL at task creation. Live mode and Product-Owner gates win.

## Why this task is needed

PR #920 correctly implemented a **dormant** exactly source-bound 131,072-BYTE response transport policy with default 65,536 bytes. It did NOT change authoritative Evidence. Main's `evidenceQuellenFingerprint(snapshot)` in `lib/readiness/evidence.ts` rejects any `snapshot.length > 65_536` (UTF-16 code units), and `official-truth-server-owned-retrieval.ts`, `official-truth-retrieved-material.ts`, and the trusted extractor all use that canonical bound. Returning a trusted retrieval by taking a separate raw SHA-256 of an oversized response is a known **R1 P1 defect** from #920 and strictly forbidden. Likewise an injected source profile or unregistered Bern identifier must NOT elevate trust.

The target is a **single coherent, versioned, server-owned full-source snapshot/custody extension** that can, after *separate genuine source approval*, safely carry an exact allowed representation that is larger than the existing default, up to the tested 131,072-byte transport cap. Source acquisition/identity, publisher/privacy/legal admission, evidence and regulatory Rule truth are separate gates; this task authorizes none of those external admissions.

## Acceptance criteria (VC01–VC30)

**Architecture / before editing**
- **VC01** Re-read live main/mode, #751, #748 later MATERIAL, #917, #919, #920, #913 and this immutable TASK; verify there is no competing writer/head. If base/drift differs, preserve exact facts and ask TL for arbitration, not silently overwrite.
- **VC02** Independently inventory *all* canonical producers/consumers that hash, store, re-read, compare, review or derive provenance from `sourceSnapshot` and `sourceContentHash`; include `evidence.ts`, server-owned retrieval, retrieved-material, trusted extractor, same-request proof/extraction, Candidate Evidence/accepted Evidence and versioned identity policy. Produce a bounded matrix of exact functions and compatibility constraints in CONTRACTS.
- **VC03** Decide whether a source-scoped versioned extension can be end-to-end safe while the genuine Bern profile is absent. If an unsafe global Evidence change, DB/schema migration, broad shared contract rewrite, unreviewed profile authority or unversioned hash is required, **STOP and report BLOCKED / TL SCOPE ARBITRATION before implementing a bypass**. A defensible code-only proposal and negative tests are acceptable; do not claim positive trusted material.

**Non-negotiable security / version compatibility**
- **VC04** Preserve current global default `65_536` BYTE retrieval and existing `65_536` UTF-16-code-unit canonical Evidence fingerprint semantics exactly for all existing and unknown callers/sources. Legacy fingerprints and source/result identities must not drift; add parity regressions.
- **VC05** A larger path must be **explicitly versioned**, server-held, exact source+contentItem/version+representation/version+identityProfile/version+canonical URL+content-type bound, and permitted only by the real compiled/current approved identity profile with live private authorization. No caller, test seam, opaque catalog row, arbitrary URL, hostname match, untrusted maxBytes, source name string, model output or injected mock is an authority grant.
- **VC06** Do not add the real Bern identity profile to `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY`. It does not exist as an approved source yet. Real Bern must stay `SOURCE_NOT_QUALIFIED`, and cannot produce a new trusted envelope through this task.
- **VC07** A versioned large-body fingerprint must be derived only from a complete, bounded, successfully decoded full response under the **same canonical LF-normalization and cryptographic digest semantics** as Evidence. NEVER a direct-SHA fallback after `evidenceQuellenFingerprint` refuses, a hash of a stripped/selected snippet, length-normalization workaround, unsupported unversioned digest or externally supplied hash. The consuming path must re-prove the *versioned authorization*, complete response bytes/snapshot, hash and exact identity.
- **VC08** Preserve the distinction between 131,072 UTF-8 transport **bytes** and `string.length` UTF-16 **code units**; no unit confusion, Unicode surrogate/combining/CRLF semantic bypass or unbounded decoding/memory. Versioned code-unit bound must be explicit and independently justified, never inferred from bytes alone.
- **VC09** Canonical transport remains HTTPS/443, DNS/public-address/pinned socket/TLS, redirect hop URL reapproval, GET header+stream bounds, media/charset/encoding/BOM, fatal UTF-8, timeout/abort, no cookies/credentials. No alternate HTTP client, proxy or body slicing.
- **VC10** Before first trusted large snapshot, positive real profile/source/privacy/legal/whole-page metadata/operative validity predicates must be proven by separate authority; tests cannot mint that proof. Source admission and publication are **NOT** this task's acceptance.
- **VC11** No forged server-held receipt, direct accepted DTO, supplied `sourceContentHash`, stale/unknown/revoked profile, alternate URL/media, history version, disputed source or unverified model proposal can cross the provenance boundary. `unknown` and `research_gap` remain unknown.
- **VC12** Enforce consumer symmetry: all downstream code paths that receive a versioned long snapshot must validate the same scoped authority/fingerprint and must refuse any unrecognized version. Never rely on a producer-only guard or a type cast.
- **VC13** Preserve immutable custody/replay/recheck/refresh and same-request race/rollback/commit-uncertainty properties of existing Official Truth; do not create a second engine, store, global override, accepted-fact authority, provider or ingestion path.
- **VC14** No new public endpoint, visitor runtime output, requirements provider activation, real importer, F8, legal conclusions, or ContentIdentity production registration. Current Production remains hard-off. All other requirement cells stay unknown.
- **VC15** Protect source/body/hash/session/host/IP/PII privacy: never copy live government HTML, raw hashes, person data, machine paths, secrets, screenshots of sensitive context, request traces or potentially private metadata into public artifacts/logs; only finite sanitized synthetic evidence.

**Implementation and tests, only if VC03 safe**
- **VC16** Work within existing `lib/readiness/` source-owned/retrieved/Evidence/trusted-extractor/same-request/acceptance modules and their corresponding tests, plus task-scoped docs/evidence. Keep necessary exact finite import/guard inventory changes narrowly scoped, with negative lookalike tests; do not alter App, DB, Auth/RLS, package deps/CI/workflows or production configurations.
- **VC17** Implement a source-specific versioned custody policy **dormant until real independent code-owned profile/source qualification**. Prefer factoring shared canonical normalization/hash + explicit private policy re-proof over forked calculators. If source capability cannot be soundly enclosed and reproduced all the way through downstream consumers, implement no half-path: STOP.
- **VC18** Test legacy 65,535/65,536 accepted, 65,537 refused for default (appropriate byte and UTF-16 units independently), unknown identity, mocked profile and injected catalog. No legacy behavioral loosening.
- **VC19** Test synthetic candidate at 131,071/131,072 bytes versus 131,073 rejected by transport; independently test UTF-16 code-unit boundaries, incomplete/missing material and every identity version mismatch. Synthetic positive buffering is **not** live trusted Official Truth.
- **VC20** Test forged/edited body + unchanged hash, caller-supplied digest, CRLF/unicode differences, alternate representation/media, stale profile, redirect to other origin/path, non-UTF8, BOM/compressed, late oversize chunk, false short Content-Length, cancelled/timeout stream and deliberately enormous chunks; fail closed without partial envelopes.
- **VC21** Test source-scoped identity and **downstream producer-consumer agreement** including candidate→review→same-request if actual architecture permits safe synthetic proofs. Any path which cannot safely be exercised must be explicitly marked NOT_VERIFIED, not fictitiously PASS.
- **VC22** Include unchanged GOV.UK/other approved-source regression checks and the protected old `evidenceQuellenFingerprint` 65,536 default; no source adoption.
- **VC23** Test native disposable PostgreSQL 16 semantic/R2/R3/structural groups if supported by repository harness; do not use a real Supabase instance and do not weaken gates, skip tests, replace actual PostgreSQL with mock or label a skipped step PASS.
- **VC24** Full `npm ci` when needed, `npm run typecheck`, `npm run lint`, full serial `npm test` (native PG where available), `npm run build`, `check:setup:ci`, `check:operating-mode`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps` and `git diff --check`; give command and exact outcome/counter. Environment limitations are honest BLOCKED.
- **VC25** No new dependency/secret/paid API call, no change to monthly infrastructure cost (existing cap USD100/month), no provider, new auth identity or external storage.

**Handoff and guards**
- **VC26** Publish TASK-named PLAN, CONTRACTS, REPORT, SELF_REVIEW, STATUS, HANDOFF and sanitized bounded evidence manifest; report original and current main SHA, exact author head/tree, tested artifacts and any non-run tests. No raw HTML/hash/secret/personal or machine-specific path in docs.
- **VC27** Source stays `SOURCE_NOT_QUALIFIED`; parent #917 stays OPEN; accepted Evidence/Rule/F8/production/visitor activation remain blocked. A successful synthetic test is *not* legal or Official Truth approval.
- **VC28** GitHub Copilot may implement/test/document/commit/push **only on this branch and only within scope**. It must not mark Ready, merge, enable Production, modify #913 or start a follow-up. Do not cherry-pick unreviewed other PR heads.
- **VC29** Any changed head invalidates older CI/Preview/Review; report GitHub exact-head CI/Auth and matching Vercel Preview or explicit `action_required`/unavailable, NOT CI PASS. Independent ChatGPT Technical Lead alone reviews full diff, exact head, native tests, source/security/PII, RLS/Production boundaries, open threads, Guardian and merge suitability.
- **VC30** STOP after author delivery, or earlier on a genuine dependency/scope/Owner gate. No autonomous writing into Development/Production, source registration, live government rule, F8 or noindex/public indexing change.

## Explicit Product-Owner gates (NOT approved)

Real source/identity/privacy/legal admission; real Evidence/Rule promotion or F8 autonomous approval; Development/Production Supabase migration, persistent rule retention/access or Source Catalog mutation; significant Account Auth/RLS/MFA/ownership changes; secrets/provider contracts/paid calls; public requirements activation/launch/indexing. A general instruction to keep developing does **not** approve these. Owner can supervise later under protected permissions; Copilot model decisions alone can never authorize official truth.

## Multi-Agent Suitability — SINGLE_AGENT

Retrieval, canonical fingerprint, trust envelope, Evidence, and same-request proof are **one sensitive security boundary**; two implementing agents could create inconsistent definitions or uncontrolled authority. Use exactly one writer/branch; independent read-only Guardian/Grok review is optional and never substitutes TL PASS. Privacy Draft #913 stays separately safety-blocked; no parallel edits or overlap. Original #920 GitHub Copilot takeover is COMPLETED, not continued; this is a distinct new Generation 1.

## Stop, status and source of truth

This file is the immutable binding task. Task-seed CI/build tests are not implementation evidence. No task may claim real approved identity, complete legal Swiss passport CH→DE visa fact, officialSourceUrl legally admitted, or a user-visible visa answer. New exact HEAD → new all-gate review. Persist every material decision to PR/#921/#751. **LIVE EVIDENCE WINS.**
