# Jetnity – CMP 12Go selection — HANDOFF

**Stand:** 31 October 2026. Stop for independent exact-head review.
**PR:** https://github.com/Jetnity/jetnity/pull/1098 draft.
**Session:** https://cursor.com/agents/bc-dc782027-b7e1-4592-a7ae-b4f709161135

## Read next

1. Immutable task `docs/JETNITY_CMP_12GO_SELECTION_TASK_V1_2026-10-31.md` (blob `b1ffeaab607637fbd7fb62c27814d02e892836c1`).
2. STATUS for the verification. REPORT for the tuple, the narrow category test, and the harness adapter.
3. Re-read `git rev-parse HEAD` before review. Main at delivery was `32445c90c2d33695cbd8f69ea3cb7498768dda67`.

## Current policy

`CMP_RELEASE_AUTHORIZED` is false. DiscoverCars is null. 12Go is selected and frozen. The public calls remain `requestProductionExecution(providerId, scopeKey)`, `checkProductionExecution(capability)`, `consumeProductionGrant(capability)`, and `releaseProductionExecution(capability)` in `lib/privacy/privacybee-cmp/produktion.ts`.

New exports:

- `PRODUCTION_POLICY_TABLE.twelvego` in `lib/privacy/privacybee-cmp/produktionspolitik.ts`
- `TWELVEGO_PRODUCTION_DISCLOSURE` in `lib/privacy/privacybee-cmp/offenlegung.ts`
- `PrivacyBeeCmpPreferences` in `components/privacy/PrivacyBeeCmpPreferences.tsx`

The disclosure revision is `twelvego-general-disclosure-v1`. The privacy link is `https://12go.asia/en/privacy-policy`.

## Provider handoff

The 12Go author can import `TWELVEGO_PRODUCTION_DISCLOSURE` and `PrivacyBeeCmpPreferences`, then call the existing facade with `twelvego`. The production footer already mounts the preferences control. This branch does not mount the provider, does not change S1 informative consent, and does not turn the release on. Removing the iframe does not recall provider storage or a provider tab. Paths that share the child origin are not described as isolated storage. The harness adapter is test-only and is not a product boundary.

## First unfinished step

Technical Lead exact-head review of the pushed #1098 head, including native CI and Preview. Do not treat this handoff as Ready. Do not start a follow-up from this author.

`docs/ACTIVE_WORK_STATUS.md` was not edited.
