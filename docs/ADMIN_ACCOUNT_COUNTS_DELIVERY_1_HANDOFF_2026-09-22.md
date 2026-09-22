# Admin Account Counts Delivery 1 — HANDOFF

Stand: 22. September 2026  
Status: **FROZEN AFTER AUTHORIZED MAIN SYNC / AWAITING INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**

## Identity

- Agent: **Jetnity admin account counts delivery 1**, Generation 1
- Session: `bc-3d009635-3ebd-40d6-b47e-dc8328cf309b`
- Required/actual model: `cursor-grok-4.6-high-fast`
- UI rename: **not** performed; run-info display name is `Jetnity admin account counts delivery`
- Footer: [#553 comment 5783559904](https://github.com/Jetnity/jetnity/pull/553#issuecomment-5783559904)
- Coordination ack: [#553 comment 5783773133](https://github.com/Jetnity/jetnity/pull/553#issuecomment-5783773133)
- Task seed: `6666b02795a080fdb10f73158503e009f7d853c2`
- PR: #553 Draft
- Branch: `feat/admin-account-counts-delivery-1`

## Reconstruction pins

- Preserved implementation checkpoint: `a88159b52cac8251b16776cf4b7c7b79a8facdec`
- Authorized exact-main sync pin: `ff054f76c14cf1c434890ba342af4df5e536dd05`
- Merge commit: `1d45dec7810a537f821744250dc20ab6578bd6b7`
- Live / authorized main / merge-base: `ff054f76c14cf1c434890ba342af4df5e536dd05`
- Original task baseline: `0d4c871867e7c4daac45af4a737cc032723863ae`
- Ahead / behind vs origin/main after this freeze commit: see `git rev-list --left-right --count origin/main...HEAD`
- Mode: NORMAL
- #551: CLOSED / MERGED / POST-MERGE VERIFIED at the authorized pin; incoming docs-only files taken unchanged
- Completed #550 session `bc-49dd67e9-5979-44af-9476-1df8bcdfff93` and #552 session `bc-4a3288b3-eb42-480b-9c37-f74b584e2419` were not reused

## What a reviewer should read

1. Binding task `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_TASK_2026-09-22.md`
2. Wrapper SQL `scripts/db/admin-account-counts-delivery-1-rpc.sql`
3. Proof runner `scripts/db/admin-account-counts-delivery-1-local-proof.mjs`
4. Application path `lib/admin/account-counts-delivery/*` and `components/admin/home/AdminAccountCounts.tsx`
5. Page mount only in `app/(admin)/admin/page.tsx`
6. Evidence `docs/evidence/admin-account-counts-delivery-1/`
7. This STATUS / HANDOFF / SELF_REVIEW

## Exact next step

Independent Technical-Lead exact-head review of this post-sync persist. Do not Ready. Do not merge the PR. Do not start another agent or follow-up slice. Production activation remains a separate reserved gate.

## Limitations to preserve

- No live statistics claim
- No hosted/Production/Preview enablement
- No authenticated PostgREST/browser E2E
- PostgreSQL 16.15, not Production 17.6
- Schema-reference stays honest: generated types do not contain the unapplied wrapper
