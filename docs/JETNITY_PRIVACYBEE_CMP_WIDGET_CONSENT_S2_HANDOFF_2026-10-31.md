# Jetnity – PrivacyBee CMP and widget consent S2 — HANDOFF

**Stand:** 31 October 2026. Stop for independent exact-head review.
**PR:** https://github.com/Jetnity/jetnity/pull/1096 draft.
**Session:** https://cursor.com/agents/bc-dc782027-b7e1-4592-a7ae-b4f709161135

## Read next

1. Immutable task `docs/JETNITY_PRIVACYBEE_CMP_WIDGET_CONSENT_S2_TASK_V1_2026-10-31.md` (unchanged blob `b460b21bdeb2ee4434766fee6b775f594a09a2a0`).
2. STATUS for the verification. REPORT and DISCLOSURE_CONTRACT for behavior and observed hosts.
3. Re-fetch `origin/main` and re-read `git rev-parse HEAD` before review. This delivery started from amendment seed `3b39b8c6b48f33e4f37d6a14018f7556cc9ce614`. Main remains `36efd23835373f4a9cac28175bbefacc9cc45c58`.

## Current policy

CMP release is false. Both production policy rows are null. Informative consent is not execution. A token exists only after a validated policy identity is bound. The four consumer calls are `requestProductionExecution(providerId, scopeKey)`, `checkProductionExecution(capability)`, `consumeProductionGrant(capability)`, and `releaseProductionExecution(capability)` in `lib/privacy/privacybee-cmp/produktion.ts`. Absent pins: policy id, required categories, processing revision, disclosure revision, network revision, host-selection commit, and sandbox. Present literals only: parent `https://jetnity.com`, child `https://jetnity-widgets.vercel.app`, `/embed/discovercars`, `/embed/twelvego`, and the two artifact hashes named in the amendment. Viator source from main `36efd238` is included by the earlier merge and is not changed here.

## First unfinished step

Technical Lead exact-head review of the pushed #1096 head, including native CI and Preview. Do not treat this handoff as Ready. Do not start DiscoverCars, 12Go, or host follow-up from this author.

`docs/ACTIVE_WORK_STATUS.md` was not edited. The continuity delta for the Technical Lead is: S2 R2 is a draft correction on #1096, banner off, provider execution off, execution epochs retired on revocation.
