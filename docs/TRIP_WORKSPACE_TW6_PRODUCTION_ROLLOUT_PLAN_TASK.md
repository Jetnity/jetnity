# TW6-B Production Rollout Plan Task

Status: BINDING TASK — PLAN ONLY. NO PRODUCTION WRITE.

Owner: ChatGPT / Technical Lead
Cursor-Agent: Trip workspace audit architecture
PR: #87

## Context

The TW6-B Day→Stage Mode contract is semantically accepted on Development. Exact-head CI and Vercel were green on `001105721c0b716bf0c4079581fd002d72fde1eb` before this task commit.

Production is not yet compatible with the new runtime:

- Production has neither `trips.day_stage_assignment_source` nor `trips.day_stage_assignment_mode`.
- Production still runs the old `public.reise_anlegen(jsonb)` contract.
- Production migration history currently ends at `20260824140000`.
- Development additionally has `20260824160000`, `20260824180000`, `20260826052735`, `20260826220000`, `20260826230000`, `20260826240000`.
- `20260826052735_admin_aal2_data_plane` remains an explicit Production gate and MUST NOT be activated by this slice.
- `20260826240000_trip_day_stage_assignment_mode.sql` was authored on top of the Development RPC and therefore also contains behavior introduced by `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis` while Production does not yet have the companion `20260824180000_trip_items_flug_handelsfelder_guard`.

Therefore PR #87 MUST NOT be merged before a bounded Production rollout plan exists and receives explicit Product Owner approval.

## Required analysis

Produce a production-safe rollout plan without changing Production.

The plan must:

1. Re-read live Production and Development migration histories.
2. Re-read the exact current Production `public.reise_anlegen(jsonb)` definition and the final TW6-B Development definition.
3. Enumerate every behavioral/schema change that would occur if the TW6-B migration set were applied to Production.
4. Identify which currently unapplied migrations are genuinely required for TW6-B and which are unrelated/gated.
5. Explicitly keep `20260826052735_admin_aal2_data_plane` excluded.
6. Decide whether `20260824160000` and `20260824180000` must be activated together before TW6-B, or whether TW6-B needs a production-specific reconciliation approach that does not silently activate a partial commercial-truth contract.
7. Preserve exact migration-history truth. Do not invent or silently mint migration versions.
8. Define a reversible/checkpointed deployment order that never exposes the new multi-destination UI against the old proportional RPC.
9. Prove whether DB-first is safe against current `main`, taking existing Production data and current public surfaces into account.
10. Define preflight, apply, verification, rollback/abort, and post-merge checks.
11. Define the exact Product Owner approval boundary in plain language.

## Live facts already independently verified by Technical Lead

At review time:

- `main`: `1d558ef56cc275d429f4076c7a8877c3791947a7`
- PR #87 head before this task: `001105721c0b716bf0c4079581fd002d72fde1eb`
- PR #87: open, Draft, mergeable, 17/0 against main
- GitHub Actions run `33016677941`: SUCCESS on that exact head
- Vercel deployment `dpl_3nYQocXT5WohScB9MP9SEMQstNoK`: READY on that exact head
- Production has 4 trips and 4 trip stages; all 4 trips are single-stage, no multi-stage persisted account trip.
- Production has no Day→Stage source/mode column.
- Production does not have migration versions `20260826220000`, `20260826230000`, `20260826240000`.
- Development has all three TW6-B migrations applied and has `day_stage_assignment_mode`.

Live evidence must be rechecked before relying on any of these facts.

## Non-scope / forbidden

Do NOT:

- apply any Production migration
- use `--produktion`
- merge Supabase branch to Production
- change Production RLS/ownership/auth/AAL
- activate Admin AAL2
- activate provider/payment/domain/public-indexing work
- merge PR #87
- mark PR #87 Ready
- start TW-7/TW-8/TW-9
- build Direction-A stay/day assignment UX

## Deliverable

Update/create a status section in `docs/TRIP_WORKSPACE_TW6_REST_PROGRESSIVE_STAGES_STATUS.md` and the PR body with:

- exact current main/head/merge-base/ahead-behind
- Production vs Development migration matrix
- Production vs Development RPC behavior diff
- required migration set
- explicitly excluded migration set
- zero-false-truth deployment order
- rollback/abort checkpoints
- exact Product Owner approval text recommended by the agent
- P0/P1/P2/P3

Then STOP.

No Production write. ChatGPT / Technical Lead independently reviews the rollout plan and asks the Product Owner for the final Production approval only after the plan is proven safe.
