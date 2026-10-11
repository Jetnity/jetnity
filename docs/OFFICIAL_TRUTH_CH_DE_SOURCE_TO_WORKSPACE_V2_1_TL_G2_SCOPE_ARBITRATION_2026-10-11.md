# Jetnity — TL Scope Arbitration G2 — First Protected Accepted Read V2.1

**Date:** 11 October 2026  
**Status:** **TL CODE-ONLY APPROVED G2 ARBITRATION / SAME PR #928 / DORMANT LOCAL-ONLY IMPLEMENTATION**  
**Parent:** #917; issue #927, Draft PR #928.  
**Original binding TASK unchanged:** `docs/OFFICIAL_TRUTH_CH_DE_SOURCE_TO_WORKSPACE_V2_1_TASK_2026-10-11.md`, immutable Git blob `d590a9769915ba1cbb6bb3cab8c401f0dac70460` (SW01–SW28).  
**Original author HEAD reviewed:** `b5479d5201cec3eca5fab54d185f5c2ccf4ac145`. TL R1 exact-head [review 5482954320](https://github.com/Jetnity/jetnity/pull/928#pullrequestreview-5482954320) = PARTIAL/GATED/NOT READY.  
**Live baseline at amendment:** `main@fcab99dd96e23749dd2624ad5cbe4c2749b127e1`, operating mode NORMAL, merge-base same, previous HEAD 3 ahead / 0 behind. Any later head overrides earlier exact-head gates.  
**Only logical code writer:** `Jetnity Official Truth CH-DE Source-to-Workspace V2 1 — Codex Generation 1`, same Codex Desktop session and existing branch `feat/official-truth-ch-de-source-to-workspace-v2-1`. No second Codex agent, GitHub Copilot job, new branch or PR.

## Independent TL finding and narrow authorization

The PR provides a bounded server-only request check and correctly preserves fail-closed `provider=null` and all `OfficialEvaluation[]` unknown. A local PostgreSQL16 read test confirms direct access to `private.official_evidence_versions`, `private.official_rule_claims`, support/receipt tables is denied, while the existing `public.official_truth_store_accepted_v2` **writer** has no accepted-reader operation. No positive protected accepted reader, current source/Rule provenance or visitor visa result exists. This is a **real technical missing primitive**, not evidence of source/visa approval. The original TASK allowed a reader but required TL scope arbitration for SQL/read contracts outside the owned boundary.

**Technical Lead now explicitly AUTHORIZES within the existing Draft #928:**
- Define and IMPLEMENT the **smallest versioned, read-only, least-privilege accepted-record/custody read contract** reusing existing accepted Evidence/Rule/Review/store and immutable V2 source fingerprint, only where data can be independently re-proven. A **new additive repository SQL migration artifact** and narrowly scoped `lib/readiness/` server reader/test modules are allowed **if demonstrably indispensable**; it must stay **UNAPPLIED on every hosted Supabase project**. No blanket table SELECT grant, no new user-visible endpoint or second engine.
- Prove isolated synthetic local PG16 retained rows / receipt / evidence / Rule supports / exact source profile/identity/pins and consistent read snapshot. Distinguish cryptographically/structurally valid stored bytes from **genuine currently approved state source and legally effective Rule**. A synthetic data roundtrip may return `structurally_verified_non_authoritative` (or equivalent) but must NEVER yield `not_required`, a real official visa claim or a public Requirements Provider.
- Make failure explicit if DB fields do not carry sufficient Rule Review history/currentness/conflict/revocation/source-profile proof. Reuse existing durable history if available; otherwise return `NOT_VERIFIED` and a **precise minimal missing-schema/Owner packet**, not an accepted DTO from caller, bypassed RLS or fabricated authority. Do not invent AAL2 acceptance, current source, missing temporal evidence or transaction ACK.
- Keep the existing `Trip` canonical model and `types/trips.ts` unchanged. `passport` remains insufficient evidence of `ordinary_passport`; tourism, direct route and legal date predicates are unresolved. Thus the new reader can be technically tested locally, but **any positive CH→DE visa projection must still stay BLOCKED/unknown** until the separate G1 TL+Product-Owner canonical-scope contract and G3 legal/source admission.
- Harden the new reader for exact support versionId/profile/hash/protocol, complete custody and no healing of stale/revoked/conflicted/partial state, consistent read under concurrency and retry ACK uncertainty, freshness/effective intervals, count/size bounds and cross-account isolation. Validate all client/model input fields do not confer trusted provenance, and every unsafe/unknown case returns no authority. Use current `main` RLS/ACL contracts as restrictive baseline; no material Auth/RLS/AAL policy widening.

## Strict code-only test and delivery scope

**G2-01** Read live main/mode, #751, #748, #917/#927, this amendment, original immutable TASK and new exact branch head. Verify no competing writer or forced merge.  
**G2-02** Before code, inventory the concrete accepted read/write SQL/RPC/ServerHeld functions, versioned receipt and Rule history and return an explicit finite data-dependency graph.  
**G2-03** Add one source-bound private read primitive ONLY if safe, local disposable PG16 tests for structural verified synthetic read and fail-closed negatives; no unauthorized SQL GRANT to `anon`, `authenticated`, `service_role` (direct table read still denies), no dynamic caller-selected trust. Prevent `SECURITY DEFINER` search_path and role escalation.  
**G2-04** Validate exact bounds/protocol/retrievedAt/canonical full-body custody and historical V1 compatibility, current scope, revocation/history/temporal uncertainty. Re-prove from server-owned, code-owned current source identity before any authoritative future result; no injected production mock registry.  
**G2-05** Finish a **positive LOCAL SYNTHETIC STORAGE STRUCTURE PROOF** only if it cannot grant real source authority or a real visa Rule. Even a positive structural read must not attach a `RequirementsProviderZeile` to the public engine. If unsafe to simulate, report NOT_VERIFIED and stop.  
**G2-06** Use existing `tripOfficialEvaluationsAuswerten` and official engine negative/unknown tests. Legacy 65,536-byte default and conditional 131,072-byte source-specific protection unchanged; no UI/production runtime activation.  
**G2-07** Strict negative tests: missing/extra/tampered/duplicate evidence or Rule support, stale/revoked source, mixed fingerprint protocols, invalid history, changed hash, row leaks, caller-forged accepted DTO, cross-account reads, full 8-table structural rollback where pertinent, SQL/TS canonical parity and transaction snapshot race. Use genuine disposable native PG16; no weakened assertions, skipped tests or fake positive profile.  
**G2-08** Full typecheck, lint, build, native PG16 serial `npm test`, operating-mode/hygiene/scope checks; GitHub exact new head CI/Auth and Vercel Preview independently TL-reviewed. Author must truthfully document dependency risks (unchanged lockfile has 3 production high advisory findings, reachability not assessed) and untouched security/privacy gates.  
**G2-09** Amend the existing six reports + sanitized evidence + Owner packet with actual new head/tree/local tests, blocked conditions and decisions. Original TASK Git blob unchanged; this TL addendum is a separate immutable versioned authority artifact.

## Exclusive reserved gates: NOT approved

**G1:** Product Owner + TL shared canonical citizenship/linked ordinary-document/purpose/verified-route/date scope, no silent global `types/trips.ts` change.  
**G3:** Owner/privacy/legal approved exact Bern/AA whole-source/rights/publisher/retrieval, current legal effect and record retention; no compiled approved Bern identity profile.  
**G4:** Owner explicit hosted Development migration, any real data retention; no Dev/Production DDL/writes in this code slice.  
**G5:** protected AAL2 actual Evidence/Rule acceptance and verified authority.  
**G6:** public/staged Requirements Provider / Trip Workspace activation, F8/autonomous storage and kill switch; Production index/launch remains off.  
**G7:** security vulnerability triage/remediation of unchanged third-party dependencies (sharp, source-map-js, ws). No automatic package upgrade outside this code slice.

No secrets, hosted database credentials, chargeable service/provider, personal ID/MRZ/DOB/biometrics or real government HTML included in repo evidence. No changes to safety-blocked PR #913. Monthly infra cap <=USD100, new committed cost $0.

## Stop conditions and TL authority

If complete read/custody re-proof requires an actual Source Registry registration, new real Legal/Owner decision, general Auth/RLS change, hosted SQL migration, claim promotion, or expanded shared traveller scope, **STOP / PARTIAL GATED**, write precise missing proof and request the single corresponding Owner decision; never create apparent source/visa authority to satisfy tests. Do not construct a fake live compiled Bern profile.

Codex Generation 1 may implement/test/document/commit/push only the existing #928 branch, no force push, no Ready/Merge, no branch/PR duplication, no automatic next slice. After genuine author handoff, independent ChatGPT TL re-reads every changed file and exact HEAD/CI/Preview/security. A changing head invalidates previous passes. **This TL G2 arbitration is a CODE-ONLY SCOPE GRANT, NOT a real source, DB, legal or visitor activation approval.**
