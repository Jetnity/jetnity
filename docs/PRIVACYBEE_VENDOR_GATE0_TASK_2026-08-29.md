# Jetnity – PrivacyBee Schweiz Vendor Gate 0 Task

Stand: 29. August 2026
Issue: #169
Status: AUTHORIZED / PARALLEL AUDIT / DOCS-CONTRACT-EVIDENCE ONLY / NO VENDOR ACTIVATION

## Baseline

- Repository: `Jetnity/jetnity`
- Exact start `main`: `6083ee63a5da62870ab7ac4f5f91f69230718e44`
- Branch: `audit/privacybee-vendor-gate0-2026-08-29`
- Logical Cursor-Agent: `Privacy provider integration audit 1`
- Parallel runtime: PR #168 / Issue #109 Visitor Search. Do not touch Search/Places/Homepage runtime or contracts.

Live evidence wins over documentation. Re-check current branch/base before authoring.

## Critical vendor identity correction

The Product Owner means the **Swiss PrivacyBee website-privacy product at `privacybee.io` / its Swiss-facing offering**, not the unrelated US consumer/privacy-removal service at `privacybee.com` / `business.privacybee.com`.

This distinction is binding for the entire slice:

- **TARGET:** Swiss PrivacyBee website privacy / legal-tech service on `privacybee.io`, whose first-party materials describe website scanning, privacy-policy generation, cookie/consent banner, imprint generation, periodic rescans/updates, DSG/DSGVO variants and Swiss pricing.
- **NOT TARGET:** `privacybee.com`, Privacy Bee LLC, US consumer data-broker removal or its business service.
- The final report must include one short disambiguation note so future chats/agents cannot confuse the two vendors again.

Any evidence collected from the US service before this correction is invalid for the target-vendor assessment and must not be reused as Swiss PrivacyBee truth.

## Objective

Evaluate whether and how the Swiss PrivacyBee service could safely cover Jetnity's website privacy-policy, imprint and cookie/consent-management needs and what remains Jetnity-native. This slice must produce architecture/vendor evidence only. It must not activate PrivacyBee, accept contracts, create accounts, transfer user data or modify runtime.

Do **not** force DSAR/account export/delete functionality onto PrivacyBee unless the Swiss product's current first-party material explicitly supports that capability. AP-6b remains a separate Jetnity responsibility unless evidence proves an intentional vendor integration contract.

## Required repository reconstruction

Read current `main` evidence first, including:

- `docs/AP6A_GATE0_LEGAL_FOUNDATION_HANDOFF_2026-08-29.md`
- `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`
- current registration/login legal/consent call-sites
- current CookieConsent implementation/status
- current account/privacy/export/delete capabilities
- current Traveller/document truth boundaries

Keep AP-6a Legal content, AP-6b consent/export/delete runtime and external-vendor responsibilities explicitly separate.

## Required Swiss PrivacyBee evidence

Prefer current first-party sources from the Swiss PrivacyBee properties. At minimum inspect and date-stamp what is actually available from:

- `https://www.privacybee.io/de-ch/`
- `https://www.privacybee.io/de-ch/preis/`
- `https://www.privacybee.io/de-ch/integration/`
- `https://www.privacybee.io/de-ch/auftragverarbeitervertrag/`
- `https://www.privacybee.io/de-ch/lizenzbedingungen/`
- `https://www.privacybee.io/de-ch/haeufig-gestellte-fragen/`
- relevant current `support.privacybee.io` articles when they clarify product behavior

Verify, do not merely repeat, at least these current first-party claims/facts:

- website scanning and periodic re-scanning / update behavior;
- privacy-policy generation and update model;
- cookie/consent banner capabilities and script-blocking/consent behavior;
- imprint generation;
- DSG and DSGVO variants;
- integration modes and technical embedding model;
- languages currently supported;
- public Swiss end-customer price and whether it is per domain / excludes VAT;
- operator/legal-entity truth and the relationship stated by PrivacyBee between PrivacyBee AG, Domenig & Partner Rechtsanwälte AG and Digital Innovation Lab AG;
- current processor agreement terms, processing locations, subprocessors/third-country transfer mechanisms and any sensitive residuals;
- licence limitations, especially what the service does **not** cover beyond website-facing privacy/information duties.

If a capability, API, webhook, certification, data-location statement, SLA, support commitment or security claim is not publicly evidenced, mark it `unknown / vendor-confirmation-required`; do not infer it.

## Required analysis

Produce a fit/gap matrix covering at least:

1. privacy-policy generation and automatic maintenance;
2. imprint generation and maintenance;
3. cookie/consent management and script blocking;
4. integration model for a custom Next.js/Vercel application;
5. controller/processor role boundaries;
6. DPA / SCC / international-transfer needs;
7. data locations and subprocessors;
8. security, incident and breach-notification expectations;
9. consent evidence retention, deletion, export and exit strategy;
10. API/webhook/integration surface if publicly evidenced;
11. branding, accessibility, UX and performance implications;
12. vendor lock-in/failure modes;
13. Swiss DSG + GDPR relevance without making our own legal-compliance claim;
14. data minimization and purpose limitation;
15. current/future cost evidence;
16. what PrivacyBee does **not** replace: Jetnity account export/delete, internal retention lifecycle, RLS/ownership, Auth, Traveller/privacy truth and broader organisational privacy duties.

Define the smallest safe future integration architecture if Swiss PrivacyBee is selected. Jetnity remains the source of truth for account/trip/traveller ownership and identity. PrivacyBee must never silently become identity authority, RLS authority, traveller registry or storage for unrelated travel data.

## Sensitive-data boundary

Explicitly classify data that must not be sent to PrivacyBee without a later Product-Owner + Legal + Security gate, including at minimum:

- passport/document numbers;
- scans/images;
- MRZ;
- biometrics;
- unnecessary citizenship/traveller identity details;
- auth/session secrets or tokens;
- provider/payment secrets.

Do not state that PrivacyBee is approved for any of these categories.

## Cost contract

This audit itself must have `Kostenwirkung: keine`. No signup/order/subscription/paid call is allowed.

For future Swiss PrivacyBee pricing:

- record only currently public first-party pricing and scope;
- current public evidence indicates an end-customer price of **CHF 54.90 per year and domain, excluding VAT**; re-verify live before treating it as current truth;
- distinguish end-customer pricing from partner/agency economics;
- identify any cost not included in that public price as `unknown / vendor-confirmation-required`;
- no recurring-cost activation in this slice.

## Required deliverables

Dedicated versioned docs only, avoiding shared continuity files to prevent collision with PR #168:

1. `docs/PRIVACYBEE_VENDOR_GATE0_STATUS_2026-08-29.md`
2. `docs/PRIVACYBEE_VENDOR_FIT_GAP_MATRIX_2026-08-29.md`
3. `docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md`
4. `docs/PRIVACYBEE_VENDOR_GATE0_SELF_REVIEW_2026-08-29.md`
5. `docs/PRIVACYBEE_VENDOR_GATE0_HANDOFF_2026-08-29.md`

No central `JETNITY_HANDOFF.md`, `ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `DECISIONS.md` or runtime file change in this parallel slice unless the Technical Lead explicitly re-scopes after #168.

## Mandatory final report

The final agent report/handoff must contain explicit sections:

1. **Ergebnis**
2. **Risiken / Residuals** with severity
3. **Kostenwirkung** – explicitly `keine` for this audit; future costs only if evidenced, else `unknown/quote-required`
4. **Offene Entscheidungen / Gates**
5. **Empfohlene nächste Schritte** – bounded recommendation only; do not start integration
6. **Exact evidence** – final head SHA, exact first-party source URLs + observed update dates, local checks, GitHub CI, Vercel Preview and review-thread state
7. **Vendor identity disambiguation** – explicitly state that `privacybee.com` / Privacy Bee LLC was not the evaluated target.

## Hard non-scope

- no PrivacyBee signup/account/order/subscription
- no acceptance of Terms/DPA/SCC/contract
- no API key/secret
- no user-data transfer
- no runtime integration
- no cookie banner mount/change
- no legal text generation or legal-completeness claim
- no AP-6a runtime or AP-6b runtime
- no DB migration/RLS/Ownership/Identity/Auth/MFA/AAL/Supabase mutation
- no Search #168 / Homepage #110
- no AP-7 Registry
- no provider booking/payment/subscription/public-indexing/domain-cutover/branch-protection change
- no paid call or recurring cost
- no analysis of the US `privacybee.com` service beyond the minimal disambiguation needed to prevent future confusion

## Governance / STOP

- Fresh logical agent generation already running; this correction stays in the same logical session because it corrects the vendor identity for the same slice before implementation evidence was produced.
- Work only on this branch/PR.
- Draft PR only.
- Cursor never sets Ready and never merges.
- Agent self-review is not Technical-Lead PASS.
- Every push invalidates prior exact-head gates.
- Immediate review fixes use the same logical Cursor session.
- STOP after final implementation, self-review and evidence for independent ChatGPT Technical-Lead exact-head review.
- Do not start PrivacyBee integration or another vendor evaluation automatically.
