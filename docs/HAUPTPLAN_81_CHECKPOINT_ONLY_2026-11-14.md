# Hauptplan 81: interruption checkpoint — do not merge this wrapper

Saved at the PO's explicit request on 2026-11-14. Work was paused, not released.

## Restore the exact unfinished source

- Repository: Jetnity/jetnity
- Exact restorable source commit: `dff88df98c5bce5f082c23d3509e9c009c3a47cd`
- Exact source tree: `8f9c89003d5b0ead54950baf925610a392b1cf25`
- Its remote parent (unchanged PR #1197 head when captured): `9677f9e526f729402cdaeb2a1b087ec376437db1`
- Equivalent local commit: `771ba1c5da5b49b29f716b5c6b18d7c449dbc532`
- Local parent: `dc9aeefeab309d5687803ac67ac82a4d42a87d94`
- Twelve files are preserved, including the existing recovery handoff.
- Read `docs/OFFICIAL_TRUTH_DEV_GUARD_RECOVERY_1_HANDOFF_2026-11-14.md` at the **source commit**.

This checkpoint branch adds this note and a branch-specific Vercel auto-deployment exclusion in a separate wrapper commit. CI only runs on main pushes or PRs; no checkpoint PR is opened. Do not cherry-pick or merge the wrapper. Restore only the source commit above, then resolve its known finding before normal CI publication.

## Still open

1. The new native Same-Slot pre-wait can require 64 + 300 + 330 = 694 seconds plus earlier setup, beyond the unchanged 675-second lifetime. It is still present. No native run or complete approval for this candidate exists.
2. The single-command idea was rejected: the second audit would use an entered timestamp earlier than last_observed; the clock check precedes idempotency. Do not implement that idea.
3. GitHub Actions configuration `JETNITY_DEV_PUBLIC_APP_KEY` is prepared but **not saved**. The automatic approval review rejected the final Add secret action because it requires current explicit confirmation for storing the existing public Dev key in GitHub. Do not use another storage path to bypass the rejection.
4. The additive status RPC is not installed in Dev. Existing installed BG1 and its exact five-minute cron remain active.
5. New Owner actions, actual source retry and Production remain joint steps with the PO. Research stays RESEARCH_ONLY, unimported.

## Last completed CI

CI 4238, run 43562679953, head 9677f9e5: all nine jobs complete; eight succeeded, Auth/Dev-Guardstatus failed access_denied. No new CI was started for this checkpoint.
