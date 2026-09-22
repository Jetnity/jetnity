# Admin Account Counts Delivery 1 — HANDOFF

Stand: 22. September 2026  
Status: **FROZEN / AWAITING INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**

## Identity

- Agent: **Jetnity admin account counts delivery 1**, Generation 1
- Session: `bc-3d009635-3ebd-40d6-b47e-dc8328cf309b`
- Required/actual model: `cursor-grok-4.6-high-fast`
- UI rename: **not** performed; run-info display name is `Jetnity admin account counts delivery`
- Footer: [#553 comment 5783559904](https://github.com/Jetnity/jetnity/pull/553#issuecomment-5783559904)
- Task seed: `6666b02795a080fdb10f73158503e009f7d853c2`
- PR: #553 Draft
- Branch: `feat/admin-account-counts-delivery-1`

## Reconstruction pins

- Live / authorized main / merge-base: `0d4c871867e7c4daac45af4a737cc032723863ae`
- Ahead / behind vs origin/main at persist time: see `git rev-list --left-right --count origin/main...HEAD` after this commit
- Mode: NORMAL
- #551: Draft `cc1dc599c60adafe5491ecc6fe57417a4cb97b73`, integrates first; not imported
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

Independent Technical-Lead exact-head review of this persist. Do not Ready. Do not merge. Do not start another agent or follow-up slice. After #551 is independently reviewed/merged, TL may bind an accepted main sync SHA for this PR and re-gate it. Production activation remains a separate reserved gate.

## Limitations to preserve

- No live statistics claim
- No hosted/Production/Preview enablement
- No authenticated PostgREST/browser E2E
- PostgreSQL 16.15, not Production 17.6
- Schema-reference stays honest: generated types do not contain the unapplied wrapper
