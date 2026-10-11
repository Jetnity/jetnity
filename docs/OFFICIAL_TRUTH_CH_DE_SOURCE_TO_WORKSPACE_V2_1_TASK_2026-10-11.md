# Jetnity — Official Truth CH→DE Source-to-Workspace V2.1

**BINDING TASK / CODE-ONLY + RESEARCH-ONLY / ONE INTEGRATED V1 PRODUCT CASE**  
**Date:** 11 October 2026. **Issue:** #927. **Product parent:** #917.  
**Baseline:** `main@fcab99dd96e23749dd2624ad5cbe4c2749b127e1` / mode NORMAL (independently LIVE RECHECK).  
**Exact branch:** `feat/official-truth-ch-de-source-to-workspace-v2-1`. **Only author:** **Jetnity Official Truth CH-DE Source-to-Workspace V2 1 — Codex Generation 1** (Codex Desktop, not GitHub Copilot agent).  
**Approval:** ChatGPT Technical Lead alone independent exact-head FINAL PASS / Ready / Merge. This TASK authorizes no hosted DB, real regulatory promotion, user visa result or Production activation.

## Why this work follows #926

PRs #920 and #926 merged, post-merge independently verified on `main`. Existing **conditional** 131,072 UTF-8-BYTE transport + versioned complete-source Evidence/custody V2 is code-complete (native PG16.15, 6,275 / 6,275 tests, 819 suites, Auth55/243). Legacy 65,536-byte default remains unchanged. Source-specific larger transport still requires a **current code-owned approved exact content identity profile**. The Bern/AA real source is `SOURCE_NOT_QUALIFIED`. New SQL migration `supabase/migrations/20261010180000_official_truth_source_fingerprint_protocol_2.sql` is MERGED AS CODE and **NOT APPLIED** on hosted Dev or Production. Do not rebuild/retest the general database foundation unless a new code diff genuinely requires regression tests.

Issue #917 already documents the real product goal: for a traveller explicitly having CH citizenship and CH ordinary passport, with a direct DE destination and known dates/purpose, an authenticated Trip Workspace should ultimately show a **verified visa cell** with traceable official evidence. Today `lib/readiness/official-truth-ch-de-first-visa-vertical-1/adapter.ts` returns `trusted_accepted_reader_unavailable`; `requirementsProviderAus()` returns null; `tripOfficialEvaluationsAuswerten` → canonical `OfficialEvaluation[]` is already wired under account Auth/RLS to Workspace/Preparation/Destination Essentials, but remains unknown for unqualified rules. Do not duplicate the engine or create a parallel UI.

**Reference official research candidates, NOT accepted Official Truth**:
- S3 German Embassy Bern, exact 128KiB transport pin: `https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474`, historic whole-body research observation 71,122 bytes, in `lib/readiness/official-truth-ch-de-source-budget-128k-1.ts`. The research-only tuple is `de-bern-embassy-research-only / bern-visa-entry-2611474 / bern-visa-entry-html-de / de-bern-entry-page-unqualified`; it is NOT an approved identity profile.
- S1 German Federal Foreign Office: `https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820`, historically 92,963 bytes and the 03.06.2026 list includes `Schweiz | Nein`. S1 is official **corroboration/research**, not yet a permitted 128KiB production source. Do not silently give S1 S3's size entitlement.
- Other official legislation/embassy pages only when needed to resolve exact purpose/ordinary document/exception/legal date, fully cited and tracking-clean. No broker/blog/provider as primary truth.

## Non-negotiable result

Produce **material, merged-ready CODE-ONLY preparation** for a) an exact DE source identity/legal/privacy qualification evidence packet and b) a **dormant, server-owned accepted-evidence+rule reader/projection into the EXISTING Requirements/Trip Workspace seam, exercised with strictly synthetic local PG16 fixtures and explicit full trust re-proof**. Retain `SOURCE_NOT_QUALIFIED` and NULL production provider until the distinct Source/Owner/hosted gates are approved. Never claim a synthetic positive is a real visa rule.

If a safe source-admission or positive local-read path cannot be proven without a protected decision, continue implementing the safely separable **negative and reader interface** work and provide an actionable exact blocker/PO packet. Do not deliver only a broad speculative architecture report.

## Acceptance criteria SW01–SW28

### A. Preflight and official truth research
**SW01** Re-read live main/mode, `JETNITY_START_HERE.md`, TL standard, #751 Current State, latest unread Guardian #748 MATERIAL, parent #917, closed #925, #913 safety block and other open PR writers. Confirm seed TASK blob, merge-base, ahead/behind and no competing writer. If changed, STOP for TL arbitration. Document actual SHA not chat assumptions.

**SW02** Inventory *only* actual binding gaps between existing source-catalog/compiled profile, current-source HTTP retrieval, versioned Evidence/accepted store local readback, trusted accepted rule/history/refresh and existing `tripOfficialEvaluationsAuswerten`/RequirementsProvider/Trip Workspace. Give exact functions/line references and 1-path dependency graph; **do not refactor the foundation**.

**SW03** Research S3/Bern and S1/AA using only official state primary web sources. Record canonical tracking-free `officialSourceUrl` and separate `officialActionLink` if relevant, retrieval timestamp full UTC, competent authority, current exact publisher identity and legal rule context. Avoid invented validFrom/validUntil (unknown→null), time conversions, and source snippets/hash/body in GitHub. Web/search rendered excerpts are background, never the complete trusted original response or hash.

**SW04** Assess S3 exact source/item/representation/profile identity with independent **WHOLE-RESPONSE** privacy, dynamic-content, publisher stability, canonical final URL, media/charset, redirect, language and embedded third-party metadata; identify stable, bounded proof predicates and currentness/expiry. Prior 71,122-byte S3 measurement is historical, not today’s live size. If a fresh protected full-source read is essential, use existing bounded source-owned HTTPS/DNS/SSRF/stream/UTF-8 path and designated 128KiB pin only after genuine source authorization; never add a side HTTP client or untrusted mock authorizer. If unavailable, mark exact RESEARCH_GAP, not success.

**SW05** Produce one **finite, reviewable SOURCE CANDIDATE / OWNER DECISION PACKET**, not a live approved source: S3 vs S1 authority and legal corroboration; exact CH nationality vs residence/issuer distinctions; ordinary passport implications, tourism vs work/study/long-stay, direct route vs transit, date/legal effective window, residual exceptions/conflicts. Never transpose 90/180 EU/third-national footnote to Swiss citizens or create passport/health/arrival/transit negative rules. When sources are ambiguous, set `research_gap` or `unresolved_conflict`. `retrievedAt` is not `validFrom`.

### B. Actual product engineering, hard-off in production
**SW06** Keep `OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY` without an approved Bern/AA profile and preserve fail-closed source selection; do NOT change `OFFICIAL_TRUTH_CH_DE_SOURCE_BUDGET_128K_1` to authorize arbitrary data. A proposed profile can be a strict developer-only non-live candidate (NOT compiled into live registry) only if safe; never promote `de-bern-entry-page-unqualified` by renaming a mock field.

**SW07** Design and IMPLEMENT a **bounded server-only trusted accepted read capability** reusing existing Official Truth accepted Evidence/Rule store read contracts; no generic caller-provided JSON/accepted-shape DTO may create authority. Server reads must revalidate versioned source identity/protocol/hash/whole custody, current registry, accepted lifecycle, currentness/effective time, Rule Review support, conflict/stale/revocation, and exact scope. Do not trust a generated/model summary or accept a stale database row as proof.

**SW08** Limit the initial projection to **CH citizenship + explicitly selected linked ordinary CH passport + DE destination + explicit supported travel-date/purpose/route**; never infer nationality from Swiss residence or issuing state, never use first passport, and never apply across travellers/options. Inspect existing canonical `passport` vs `ordinary_passport` gap honestly. If a global `types/trips.ts`/identity/ownership/Scope schema modification is necessary, STOP at an exact TL/PO contract arbitration (not silent broad expansion); still deliver separable safe read negative path.

**SW09** Integrate any new local-safe adapter by **reusing existing** `tripOfficialEvaluationsAuswerten` → canonical `requirementsFuerReise` → `OfficialEvaluation[]` and existing Trip Workspace presentation. No second Requirements engine, standalone visitor visa API or unofficial sidebar. Preserve existing `requirementsProviderAus() = null` Production and `requirementsProviderNachZustand` hard-off. No actual public visa-free text or hidden runtime activation.

**SW10** In *strictly isolated* code+disposable PostgreSQL16 tests only, attempt genuine server-owned acceptance/read/provenance verification of **non-authoritative synthetic fixtures** (all source and people data fabricated, never actual authority). Do not create a fake globally approved official identity or promote synthetic evidence into any hosted instance. If a positive trusted synthetic test would require bypassing the real source gate, mark NOT_VERIFIED and test strong refusal instead, not forged PASS.

**SW11** Explicitly test existing Trip Workspace/Preparation/Destination Essentials read path with single scoped synthetic provider **only when derived by the protected store reader**, and no user-facing live activation. Preserve fail-closed unknown for unmatched country, citizenship, credential option, purpose/date/route, stale source, missing proof, revoked/conflicted content and every other requirementType. Strict source attribution and retrievedAt for a valid isolated case.

**SW12** No user-identifying passport/MRZ/photo/biometric/health or private account/session/trip records in scripts, commits or test evidence. Do not log raw HTML, user IDs, source hash, IP, server path, email or secrets to public artifacts. Never store full governmental page or replicate regulated data to GitHub.

### C. Verification and proof
**SW13** Verify legacy V1 and new V2 hashes/source limits unchanged: default 65,536 raw bytes, source-specific 131,072 only via true compiled current approved exact identity, re-proof all downstream consumers, no direct SHA fallbacks, no caller profile mock or snippet-to-fit.

**SW14** Adversarial local tests: forged accepted DTO, arbitrary source profile/catalog, wrong URL/locale/media/charset, unsigned or stale Rule, expired validity, changed source hash, fake authority, unknown version/downgrade, incomplete signature/custody, dispute/conflict, lost transaction COMMIT ACK, revoked Rule/Source, RLS-cross-account and multi-traveller/passport leakage must block with deterministic reason and no positive evaluation.

**SW15** Reuse native disposable PG16.15 local migration harness; no second SQL migration except when separately authorised by TL and absolutely necessary for this adapter, no hosted schema apply. Backwards compatibility of currently merged `20261010180000_official_truth_source_fingerprint_protocol_2.sql` must remain. Focus on existing readback; if local SQL authority/read RPC shape insufficient, expose exact missing primitive and STOP at contract gate rather than bypass.

**SW16** Full `npm test` serial native PostgreSQL16 including R2/R3, Typecheck, Lint, Build, operating-mode check, API/schema/dead/exports/deps/setup/hygiene, `git diff --check`, 0 skip; if a test is blocked by the environment, report precise reason and do not call PASS. No dependency changes unless TL approves; no paid calls. Output actual counts and head/tree. GitHub exact-head CI/Auth and matching Vercel Preview independently reviewed by TL, author Self-Review not TL PASS.

**SW17** Keep mobile-first existing Trip Workspace data contract; only adapt the current server path when there is real verified data to feed. Avoid cosmetic UI changes or raw government HTML exposure.

### D. Approval and delivery boundaries
**SW18** Do not apply any SQL migration to hosted Development or Production; do not use production database credentials or a hosted DB CLI write. Production version can deploy code but no new source/truth activation. Do not store personal travel documents.

**SW19** Do not register a *real* German/Bern source profile in the live compiled registry, promote real Evidence or Rule, enable F8/autonomous Official Truth storage, activate Requirements Provider, alter Auth/RLS/AAL/Owner roles, add paid providers/secrets, index/public launch, or bypass the privacy-safety-blocked Draft #913. All are protected special Product-Owner gates.

**SW20** Deliver an exact **Owner Decision Packet** identifying which hosted Development migration to apply, needed exact source/representation/profile approvals, legal authority/validity and privacy/retention evidence, protected AAL2 acceptance and kill switch/rollback, cost $0 vs any spend, and a staged user-facing rehearsal. It must be narrow, reversible and safely approvable independently; no generic ‘approve everything’ or assumed approval.

**SW21** If the code-only adapter cannot be completed safely without protected Owner gates, complete negative/unknown-path tests, exact source candidate report and finite blocker graph; label `PARTIAL / GATED`, not ‘working user visa’. Do not launch a new technical foundation project in response.

**SW22** Only owned modules: `lib/readiness/official-truth-ch-de-first-visa-vertical-1/**`, necessary bounded `lib/readiness/` accepted-reader/provider projection seam and focused tests, task-owned `scripts/official-truth-ch-de-first-visa-vertical-1/**`, task documents/evidence. No unrelated account/marketing/flight/provider changes; any shared Auth/trip/rule/DB contract beyond this needs explicit TL scope amendment.

**SW23** Commit the exact TASK untouched. Create task-scoped PLAN / CONTRACTS / REPORT / STATUS / SELF_REVIEW / HANDOFF plus finite sanitized evidence/Owner packet, preserving exact source URLs and unknown legal validity. No postscript converting RESEARCH_ONLY to source approval.

**SW24** Full final report: original main/task SHA, actual branch final author HEAD/tree, merge-base/ahead/behind, complete changed file list, exact test counts and whether native PG16 proven, CI/Auth/Vercel Preview statuses, security risks P0–P3, work not accomplished and exact next gated Owner decision.

**SW25** **SINGLE_AGENT:** `Jetnity Official Truth CH-DE Source-to-Workspace V2 1 — Codex Generation 1` only; the semantic source, accepted reader and Trip Workspace seam share one authority boundary. Guardian/Chief of Staff may independently review READ ONLY; do not rely on their Self-Review instead of TL.

**SW26** Coding agent may implement/test/commit/push on task Branch and existing Draft PR only. Must NEVER Ready or merge; never change main or force-push; never start another slice automatically. Any changed author HEAD invalidates former exact-head gates. At issues correct in SAME Codex generation/session for TL review.

**SW27** Technical Lead alone FINAL PASS/Ready/Merge when full exact HEAD and post-merge gates independently certified. Code-only merge cannot itself apply Dev/Prod migrations or official source/legal approval. If a real, protected Owner gate becomes necessary, STOP with decision packet rather than secretly proceeding.

**SW28** Stop at author handoff. The V1 product target is one **real** DE visa cell shown correctly with officialSourceUrl/checkedAt after later protected admission, not 60-country breadth or endless foundational testing. The current task is a meaningful engineering bridge toward that result, but no unapproved runtime claim.

**FINAL CURRENT STATUS:** TASK SEED / CODE-ONLY + RESEARCH-ONLY / `SOURCE_NOT_QUALIFIED` / NO HOSTED MIGRATION / NO USER VISA RESULT / DO NOT READY OR MERGE.
