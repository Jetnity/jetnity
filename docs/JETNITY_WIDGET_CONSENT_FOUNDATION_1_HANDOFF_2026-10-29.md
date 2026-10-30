# Jetnity – Shared Widget Consent Foundation 1 — HANDOFF

**Stand:** 29 October 2026. **Stop for independent Technical Lead review.**
**Author:** Jetnity Shared Widget Consent Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-dc782027-b7e1-4592-a7ae-b4f709161135
**Model:** `grok-4.7-high-fast`. **PR:** https://github.com/Jetnity/jetnity/pull/1089 draft.

## Read next

1. Immutable task `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_TASK_V1_2026-10-29.md` (unchanged).
2. `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_STATUS_2026-10-29.md` for the SHA, tree, and command results.
3. `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_PROPOSED_PRIVACY_2026-10-29.md` before anyone edits `/privacy`.
4. `docs/JETNITY_WIDGET_CONSENT_FOUNDATION_1_REPORT_2026-10-29.md` and `SELF_REVIEW`.

Re-read the PR head after this push. Do not reuse this note if the head moved.

## What the next reviewer is checking

The foundation is inert shared code. It may be reviewed as non-active source. It is not a working widget and not legal clearance. Both vendor scripts stay disabled. APPROVE B is not authority to enable GTM, marketing, or to publish the proposed note.

## Recommended next step (not started)

Technical Lead exact-head review of the pushed head, including native CI and Preview. This author does not mark Ready and does not merge.

If that review passes, the original DiscoverCars (#1084) and 12Go (#1086) writers can later opt in by importing `lib/privacy/widget-consent/**` and `components/privacy/WidgetConsentChoice.tsx` under their own tasks. They still cannot execute a vendor script until a separate source proof shows purpose separation and a safe embed, and a separate gate allows it. They should not invent a parallel consent flag.

Do not pass a real trip id, user id, or document number as `scopeKey`. The value is in memory only, and it is not a persistence key.

## Explicitly not done

- No follow-up slice, no provider activation, no cookie, no `/privacy` edit, no `ACTIVE_WORK_STATUS.md` edit.
- CI and Preview for the final head: pending push, then independent observation.
