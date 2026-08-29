# Jetnity – PrivacyBee Vendor Gate 0 Task

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

## Objective

Evaluate whether and how PrivacyBee could safely be integrated as an external privacy/consent/DSAR/vendor-management component for Jetnity. This slice must produce architecture/vendor evidence only. It must not activate PrivacyBee, accept contracts, create accounts, transfer user data or modify runtime.

## Required repository reconstruction

Read current `main` evidence first, including:

- `docs/AP6A_GATE0_LEGAL_FOUNDATION_HANDOFF_2026-08-29.md`
- `docs/AP6A_GATE0_LEGAL_CONTENT_INPUT_CONTRACT_2026-08-29.md`
- current registration/login legal/consent call-sites
- current CookieConsent implementation/status
- current account/privacy/export/delete capabilities
- current Traveller/document truth boundaries

Keep AP-6a Legal content, AP-6b consent/export/delete runtime and external-vendor responsibilities explicitly separate.

## Required PrivacyBee evidence

Prefer current first-party sources. At minimum inspect and date-stamp what is actually available from official PrivacyBee properties, including:

- https://business.privacybee.com/
- https://business.privacybee.com/terms-of-service/
- https://privacybee.com/subprocessors/
- https://privacybee.com/privacy-policy/

If a capability, API, webhook, price, DPA, SCC, certification, data-location statement, SLA or security claim is not publicly evidenced, mark it `unknown / vendor-confirmation-required`; do not infer it.

Known first-party evidence to re-verify live rather than copy blindly:

- Privacy Bee publishes a subprocessor list updated in August 2026 with multiple US data locations.
- Business Terms page identifies Privacy Bee, LLC and sets contractual terms for business services.
- Consumer Privacy Policy was updated in June 2026.

## Required analysis

Produce a fit/gap matrix covering at least:

1. consent/cookie management;
2. DSAR/access/deletion/portability handling;
3. controller/processor/agent role boundaries;
4. DPA / SCC / international-transfer needs;
5. data locations and subprocessors;
6. security, incident and breach-notification expectations;
7. retention, deletion, export and exit strategy;
8. API/webhook/integration surface if publicly evidenced;
9. branding and UX implications;
10. vendor lock-in/failure modes;
11. Swiss DSG + GDPR relevance without claiming legal compliance;
12. data minimization and purpose limitation;
13. current/future cost evidence.

Define the smallest safe future integration architecture if PrivacyBee is selected. Jetnity remains the source of truth for account/trip/traveller ownership and identity. PrivacyBee must never silently become identity authority, RLS authority, traveller registry, consent source of truth beyond an explicitly defined contract, or storage for unrelated travel data.

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

This audit itself must have `Kostenwirkung: keine` unless an unexpected cost is discovered before it occurs. No signup/order/subscription/paid call is allowed.

For future vendor pricing:

- record only currently public first-party prices/claims;
- if Business pricing is quote-based, unclear or absent, state `quote-required / unknown`;
- do not use consumer plan pricing as the Business integration price;
- no recurring-cost activation.

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

## Governance / STOP

- Fresh logical agent generation.
- Work only on this branch/PR.
- Draft PR only.
- Cursor never sets Ready and never merges.
- Agent self-review is not Technical-Lead PASS.
- Every push invalidates prior exact-head gates.
- Immediate review fixes use the same logical Cursor session.
- STOP after final implementation, self-review and evidence for independent ChatGPT Technical-Lead exact-head review.
- Do not start PrivacyBee integration or another vendor evaluation automatically.