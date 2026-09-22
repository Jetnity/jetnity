# Admin Audience & Partner Reporting Preflight 1 — Task v1

Date: 2026-09-22
Authority: Technical Lead; Product Owner requested reliable Admin statistics and partner-ready reports, then approved source/gap inspection and a bounded task.
Logical Cursor agent: **Jetnity admin audience partner reporting preflight 1**
Generation: **1 — new, dedicated session**
Required model: **Grok 4.6 High Fast / cursor-grok-4.6-high-fast**. No Auto or substitution.
Status: TASK ONLY; no delivery/PASS claimed.
Branch: audit/admin-audience-partner-reporting-1
Baseline: main **9dc8926ef859bcde2dc31dc8b96f2e61e1948f74**, mode NORMAL.

## 1. Outcome

Produce a narrow evidence-based inventory and the smallest implementation-task PROPOSAL for an Admin audience/product/partner report. Answer which metrics can be honestly displayed now, which require collection or authorized data access, and which remain blocked. Reuse the existing Growth standard and Admin contracts.

This is DOCUMENTATION / READ-ONLY PREFLIGHT. Do not implement analytics, tracking, SQL, migrations, UI, runtime contracts or exports. Do not repeat the full Admin D–K audit, remaining-build map or entire Growth OS specification. Broader Growth remains later-phase. This bounded preflight does not reorder V1, select an analytics vendor, open public indexing or create a launch gate.

## 2. Read first

- AGENTS.md; JETNITY_START_HERE.md; .jetnity/operating-mode.json.
- docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md.
- docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md.
- Current handoff and docs/ACTIVE_WORK_STATUS.md; docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-22.md.
- Later PR #512 comments, especially requirement5780510581, provider discussion5780349486 and review checkpoint5780294998. Live state wins.
- docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md, especially M0, data quality, privacy and exports.
- docs/JETNITY_MARKETING_GROWTH_STANDARD.md.
- docs/JETNITY_REMAINING_BUILD_MAP_1_REPORT_2026-09-22.md and binding three-phase/build-order documents.
- docs/INTELLIGENT_ADMIN_COPILOT_PRO_FOUNDATION_1_SOURCE_MATRIX_2026-09-21.md.
- AP6A legal runtime/input contracts and lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts.
- Relevant Admin pages/guards, aggregate sources, profile lifecycle/writers, commercial provenance and tests.

## 3. TL initial readback (verify, do not inflate)

On baseline:
- /admin/analytics is an explicit placeholder and navigation kind=later.
- AdminStatsStrip uses admin_reisen_kennzahlen and displays Reisen(30T), Konten mit Reise(30T). Neither means total registrations or unique visitors.
- Users page counts profiles under konten-verwalten with optional search filter. Do not repurpose filtered/RLS-limited counts as a global audience count. profiles.created_at and last_seen_at exist in reads; verify actual lifecycle and writers before any registration/activity claim.
- Provider-core and Duffel fixture/test ports exist. Synthetic/test activity must not feed partner metrics.
- Legal inventory deliberately asserts no nonessential tracking SDK and no mounted consent banner. Do not weaken this contract or restore a banner/SDK.
- Affiliate provenance fields exist; they do not prove outbound event collection, completed bookings or revenue.

TL production metadata read (2026-09-22, Supabase project qscbgcdmivbbnzrcyegn ACTIVE_HEALTHY): public.admin_reisen_kennzahlen exists; returns reisen_30d bigint, reisen_gesamt bigint, konten_mit_reise_30d bigint; STABLE SECURITY DEFINER, search_path public,pg_temp, guarded by public.darf_betrieb_lesen(). It counts trips by created_at and distinct trip user_id during rolling30days. No user rows or counts were retrieved. This proves function definition only, not caller authorization, exclusions or reporting accuracy. Do not claim all production schema independently verified.
Main CI/Auth SUCCESS and production dpl_Ahi7cmxVkbvEg3RsdHoVAbzmFZAZ READY on baseline were live verified by TL.

## 4. Required analysis

A. Source-to-metric matrix, file/SQL references and evidence level:
- existing accounts, registrations, activation and active accounts;
- unique visitors, sessions, pageviews, returning use;
- trips, searches, feature usage;
- coarse market/language/device/acquisition breakdowns;
- provider outbound referrals;
- provider-confirmed bookings; commission pending/approved/reversed/paid.
For each: precise definition, source and actual producer, earliest reliable coverage, timeframe/timezone, environment/test/internal/bot treatment, authorization path, freshness, limitations, AVAILABLE / PARTIAL / ABSENT / GATED.
Avoid reading/exporting personal rows, emails, tokens, IPs, trips or documents.

B. Proposed versioned metric definitions, DOCUMENTATION ONLY:
Distinguish account vs profile vs measured visitor/device vs human; define active event criteria; rolling30days vs calendar month; unique-over-period vs sum-of-daily-uniques. Note deletion/account lifecycle and backfill limits. Distinguish observed zero, unavailable, forbidden and collection-not-started. No fabricated historical traffic, nationwide user identity assumptions, cross-device fingerprinting or person-count guarantee. No inferred nationality from language/IP; no sensitive travel/document attributes in marketing segmentation.

C. Minimal partner-report contract:
Date range/timezone, as-of, metric definitions/version, source/coverage, exclusions, caveats. Aggregate CSV first if justified; optional PDF later. No real person fields. Document formula-injection/export authorization and small-group disclosure risks without implementing. Provider may require their own approved analytics evidence; an internal report does not guarantee acceptance.
Official Skyscanner affiliate criterion currently >5,000 unique visitors/month, NOT accounts; source https://www.partners.skyscanner.net/product/affiliates. Verify only if making current external claims; no partner contact or signup.

D. Smallest next implementation task PROPOSAL:
Concrete reusable sources, owned paths, acceptance criteria and meaningful tests for a read-only Admin overview/report; name missing prerequisite/gate. Prefer independently useful existing measures over a speculative universal event platform. If useful first slice requires new aggregate RPC/migration or legal/consent decisions, state that explicitly; do not bypass with service-role access or broad grants. Give a bounded later event-collection gap list, not a new tracking architecture as accepted contract.
Explain collision/build-order fit and which special gates apply.

## 5. Ownership / deliverables

You may create/edit ONLY:
- docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_SOURCE_MATRIX_2026-09-22.md
- docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_NEXT_TASK_PROPOSAL_2026-09-22.md
- docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_STATUS_2026-09-22.md
- docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_HANDOFF_2026-09-22.md
- docs/ADMIN_AUDIENCE_PARTNER_REPORTING_1_SELF_REVIEW_2026-09-22.md

This task is TL-owned: do not rewrite it. Embed definition/report proposal in the source matrix; no broad additional docs. Global status/start/handoff/roadmap/standards remain read-only.
No app/components/lib/types/scripts/package/workflow/SQL edits.
No production DB writes, migration, RLS/auth/identity changes, tracking SDK, vendor signup/contact/terms/secret, paid call, environment change or external sending.
Repository inspection sufficient; no production data extraction. If any live check unavailable, say NOT VERIFIED rather than guessing.

## 6. Parallel state / stop

At dispatch precheck:
- #545 Admin navigation, head a187e4df53b85b6ee9a130968506543bbd39532c, session bc-65468a42-a473-4d29-8fdb-5f48564db44d — independent re-review pending.
- #547 Admin indexing, head ed25bd07b7dfe0b4f0ebfd71ca9dc6c96ae97d59, session bc-80776dce-2c41-423e-9ab6-c46b8747ff43 — re-gating pending.
- #548 HBX offline adapter, head5417569dd97833c240c43e1132f5f7c36e0cdc75, session bc-c538c2b5-3cc6-4f9f-8f00-2ccac1bb9cf1 — independent re-review pending.
These are different scopes. Do not reuse/resume those writers, merge sibling branches, change their files or use unmerged runtime as main truth. Old historical open audits #40/#39/#52/#50/#28 are not authority to start work.
Report actual model/run-info and session footer; do not claim UI rename unless performed.

## 7. Acceptance and handoff

Re-read actual main/open PRs before delivery. Include exact head, merge-base, ahead/behind, changed-file ownership, evidence limits and P0/P1/P2/P3. Trace material claims to current code/producer definitions; explicitly distinguish repository evidence from TL-provided live metadata.
Docs-only: no manufactured runtime tests. Validate links/paths and contradictory metrics; inspect actual diff. Required CI/Auth/Vercel exact-head gates remain applicable before TL merge.
Freeze final head. Any changed head invalidates old gates.
Do not mark Ready. Do not merge. Do not start or implement the proposed next slice.
STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.
