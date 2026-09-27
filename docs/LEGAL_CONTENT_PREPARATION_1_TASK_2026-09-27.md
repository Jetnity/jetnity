# Legal content and Preview preparation 1 — versioned task

Date: 27 September 2026
Status: PO-APPROVED / DOCS-ONLY PREPARATION / NOT PUBLICATION APPROVAL
Canonical issue: [#577](https://github.com/Jetnity/jetnity/issues/577)
Logical Cursor agent: **Jetnity legal content preparation 1**
Generation: **1**
Branch: `docs/legal-content-preparation-1`
Baseline main: `4d1888f95aec3395e35c785bcb3e0d83301d5cec`
Task owner: Technical Lead. Cursor must not edit this task.

## 1. Authority, context and model

PO approved starting proposal v1 (issue comment 5851396768), recorded in [5851434120](https://github.com/Jetnity/jetnity/issues/577#issuecomment-5851434120). Gate A/B domain enablement and PrivacyBee validation/scan/generation/snippet retrieval were completed separately; see 5851358367. Do not repeat completed domain work.

Required new-session model: **Cursor Grok 4.7 High Fast**, not Auto. Read `docs/JETNITY_CURSOR_MODEL_PREFERENCE_2026-09-27.md`. Verify actual selected model using available session/runtime evidence. If unavailable or unverified, STOP and report; never silently substitute or represent this instruction as selection evidence. If a rename capability is available, use the exact logical name above. Otherwise document that UI renaming was not verified. No internal subagents, additional reviewers, Guardian or additional Cursor sessions are authorized by this task.

One writer, independent Technical-Lead review. An agent handoff or green CI is not TL PASS. No merge to main is authorized by this preparation task.

## 2. Required reads and live reconstruction

Read before substantive work:
- `JETNITY_START_HERE.md`, `AGENTS.md`, `.jetnity/operating-mode.json`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`
- `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
- `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/JETNITY_CURSOR_MODEL_PREFERENCE_2026-09-27.md`
- `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`
- `docs/AP6A_GATE0_LEGAL_RUNTIME_CONTRACT_2026-08-29.md`
- `docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md`
- `docs/PRIVACYBEE_PRODUCT_OWNER_BINDING_DECISION_2026-08-30.md`
- `lib/legal/ap6a-gate0-vertrag.ts`, its legal foundation inventory test, current public layout/footer and SEO helpers
- Live #577, especially comments 5850986944, 5851278348, 5851299265, 5851322020, 5851342372, 5851358367, 5851390009, 5851396768 and 5851434120.

TL preflight: mode NORMAL; main as above; CI run 36278043222 successful on that main; Production deployment `dpl_AgCAzkVJ9rZhMiE4vqUXgcGLCr2f` READY on that main. Only historical Draft PRs #52/#50/#40/#39/#28 were open before this task PR; no competing legal writer evidenced. Re-fetch main, branch/head, merge-base/ahead/behind and relevant open PRs before work and handoff. Historical operating-mode metadata about prior HOLD work is not a current HOLD when mode is NORMAL. Live evidence wins; stop for material conflicting scope/ownership/hold.

Historical August restrictions specifically superseded by #577's later bounded Gate A/B and billing authorization must not be reintroduced. That supersession does not authorize legal runtime or new contracts.

## 3. Objective

Produce a reviewable, source-evidenced German content dossier and integration specification for eventual `/privacy` and `/impressum`. This slice is preparation only: no route implementation, vendor-script installation, preview UI construction or publication. Do not publish the raw PrivacyBee template.

The scanner is not an inventory of backend/account processing. Separate repository-implemented behavior, observed configured/active runtime, historical evidence, explicit PO confirmation and unknown facts. No private database rows, secrets, customer content or account/billing data reads are needed.

## 4. Required deliverables

Create these new documents only:
1. `docs/LEGAL_CONTENT_PREPARATION_1_REPORT_2026-09-27.md`
2. `docs/LEGAL_CONTENT_PREPARATION_1_DRAFTS_2026-09-27.md`
3. `docs/LEGAL_CONTENT_PREPARATION_1_STATUS_2026-09-27.md`
4. `docs/LEGAL_CONTENT_PREPARATION_1_HANDOFF_2026-09-27.md`
5. `docs/LEGAL_CONTENT_PREPARATION_1_SELF_REVIEW_2026-09-27.md`

### A. Processing matrix and evidence

Use REPORT for a matrix with source path/line or durable source link, evidence date and evidence class for:
- Accounts/auth/session data and actual session mechanisms.
- Profiles, trips and travellers; data minimization and access.
- Guest browser storage and quota cookies, their actual purposes/lifetimes.
- Admin access and actual PII exposure boundaries.
- Actual infrastructure and external services, logging, deletion and retention.
- Gated, optional, historical and disabled integrations distinguished from active use.

Starting investigation pointers (verify, do not blindly restate): guest key `jetnity:reise:v3`; quota cookie `jetnity_gast`; current auth/profile/trip/traveller paths; Vercel/Supabase; GeoNames and optional model/provider paths only to the extent repository and available evidence support their current role. Do not imply every implemented adapter is enabled in Production. Traveller architecture must not imply storage of passport numbers/scans/MRZ when not present. No private row reads or hosted mutation.

Unknown retention, deployment region, provider agreements, transfer safeguards, enabled feature flags or contract state stays unknown. A code retention constant is evidence of that mechanism, not proof of complete platform deletion.

### B. German privacy supplement draft

Use DRAFTS for plain, user-facing German text describing proven processing categories and purposes. Keep source annotations and unresolved decisions in separate editorial sections/matrix, not disguised as final published policy. Avoid developer implementation details where they do not help visitors understand data use.

Clearly label the complete draft as NOT APPROVED FOR PUBLICATION. Separate unresolved legal basis, retention, location/transfer and contract questions in a decision list with evidence needed and appropriate owner. Do not invent retention schedules, consent, safeguards, DPA acceptance, compliance or legal sign-off. This technical preparation does not provide legal certification.

### C. Vendor correction brief

PrivacyBee screenshots supplied by PO in the conversation show generated German DSE dated 27 September 2026:
- Services listed: Vercel (necessary) and PrivacyBee.
- Section 8.2 asserts a cookie banner appears and discusses analysis/statistics cookies.
- Section 8.3 includes tracking-pixel/email-tracking boilerplate.
- Section 8.1 asserts logs are deleted after each session and cannot be assigned to a person; not established for actual Jetnity hosting.
- Vercel section is a generic description of the platform, not a complete processing inventory.

These are TL-recorded screenshot observations in #577, not a full exported text attachment. Do not claim you read the original image set or possess a complete machine-readable vendor policy. If exact wording is needed beyond recorded findings, mark that source gap.

Produce a supported correction/configuration brief, including which current public vendor documentation supports configuration and which points need vendor clarification or a full export. Use primary vendor documentation for current product claims; record URL and access date. Do not infer that a scanner badge proves correctness.
- Do not add tracking or a banner to make the template true.
- Do not hide contradictory vendor paragraphs through CSS or DOM rewriting.
- Do not contact support, sign in, retry magic links, mutate the vendor account or accept contracts.
- Keep AVV/DPA/TOM/TIA and license/domain compatibility unresolved where evidence is missing.

### D. Corrected German imprint draft

Confirmed inputs:
- Operator/controller: **Feirov Global Trading**, proprietor **Sasa Feirov**, Einzelunternehmen.
- Current address: **Meilipromenade 14, 6032 Emmen, Schweiz**.
- General/imprint contact: **info@jetnity.ch**.
- Data-protection contact: **admin@jetnity.com**.
- PO explicitly confirmed current operator/address and receipt/regular checking of both mailboxes in 5851390009. This is not an independently performed email delivery test.
- Website: **https://jetnity.com**.
- UID: **CHE-432.441.385**, historical official SHAB evidence HR01-1005031125, 25 November 2020: https://www.shab.ch/shabforms/servlet/Search?DOCID=1005031125&EID=7 . Do not infer current VAT registration from this.

Preserve the actual company name; do not append unexplained “EIU” as part of the name. Present proprietor/legal form clearly. Show the country once. No guessed MWST suffix, phone number, register facts or professional/regulatory status.

### E. Preview integration specification only

In REPORT specify future planned files/routes using existing public layout, branding and metadata patterns, content composition, accessible headings/navigation, loading/error/empty distinction, external vendor failure behavior and a kill switch. Existing inventory tests deliberately assert legal route absence and footer state: identify future intentional changes, do not make them now.

Preserve canonical https://jetnity.com, prelaunch noindex/nofollow, robots blocking, current sitemap limits and indexing guard. No `NEXT_PUBLIC_ALLOW_INDEXING=true`.

Assess vendor license/domain compatibility for Preview using documentation/evidence. Never add an unapproved Preview alias as another legal domain, assume production domain license works on Preview, route around restrictions or expose preview as canonical. Specify how a later implementation can be tested without unsupported licensing claims. Distinguish static/local test fixtures from an actually licensed vendor render.

The exact secured snippets are integration data only, not an instruction to run them:

Imprint — copied verbatim by PO:
```html
<script src="https://app.privacybee.io/imprint-widget.js"></script>
<imprint-widget website-id="cmuj24t7p05512zwul6dghfhu" lang="de"></imprint-widget>
```

Policy — transcribed from screenshot; shared website-id corroborated by copied imprint:
```html
<script src="https://app.privacybee.io/widget.js" defer></script>
<privacybee-widget website-id="cmuj24t7p05512zwul6dghfhu" type="dsgvo" lang="de"></privacybee-widget>
```

This website-id is the intended client-side embed identifier, not a privileged authentication token. Neither widget has been installed by this gate.

### F. Acceptance matrix and handoff

List precise completed items, unresolved content decisions and blockers:
1. Before a separately authorized runtime implementation/Preview-review slice.
2. Before any Production publication.
3. Separate launch prerequisites not solved by legal widgets.

`/terms` is separate and unresolved; PrivacyBee snippets do not provide Jetnity terms. Do not imply all legal trust routes are complete.

## 5. Writable scope / contracts / hard boundaries

Only the five named new preparation documents in section 4 are writable. All other repository files are read-only, including this TASK, `docs/ACTIVE_WORK_STATUS.md`, existing contracts, governance, `app/`, `lib/`, `components/`, `supabase/`, packages/locks and CI. Do not refactor global documentation or alter binding contracts.

No:
- main merge, Ready transition, force-push, ruleset bypass or follow-up slice;
- Production deployment/change, environment mutation, DNS/domain/email change;
- runtime routes, live vendor script installation or cookie banner;
- search indexing, public launch, Google/Bing submission;
- analytics/tracking activation, external paid model/provider calls;
- DB/Auth/RLS/migration/configuration change or private user/customer data reads;
- provider signup, contract/terms/DPA acceptance, new payment or cost changes;
- support messages or vendor-account mutations.

Existing PrivacyBee Single Domain jetnity.com: PO approved CHF 59.35/year automatic continuation after free trial ends 11 October 2026; recorded in 5851299265. Record as authorized, not a new cost blocker. Do not modify billing. Exclude unrelated domain subscriptions, payment-card data and account credentials.

If login/2FA/password or irreversible confirmation is required, stop at that action and report exactly what is needed. Public read-only source research and repository analysis remain allowed.

## 6. Verification and delivery

For docs-only work: run diff whitespace/scope checks, validate repository/source references, review all source-to-prose claims, inspect missing coverage and promises, and recheck current origin/main/PR state. Existing automated CI may run; no need for speculative builds or runtime tests. Do not fabricate browser/build/runtime/Production proof for documents.

Every substantive claim has source evidence, explicit PO confirmation, or is marked an unresolved proposal. Label stale evidence. Keep user-facing drafts separate from editorial questions. Do not mark unresolved legal content as compliant/final.

STATUS/HANDOFF/SELF_REVIEW must use the exact logical agent name and generation, baseline, commit/head evidence, changed files, tests actually performed, not-performed tests, known gaps and first unfinished action. Avoid self-referential commit SHA claims: final delivery comment must report actual pushed head. Re-fetch origin/main before handoff and report drift honestly.

Deliver in this Draft PR with a final comment linking the five documents and reporting actual pushed head, model/session evidence, scope checks, findings/blockers and first unfinished action.

**Do not mark Ready. Do not merge. Do not start a follow-up slice. STOP for independent Technical-Lead review of the exact delivered head.**
