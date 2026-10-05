# PR #87 – Technical Lead Re-Review Checkpoint

Stand: 27. August 2026

Status: **CHANGES REQUIRED / BLOCKED. Kein Ready. Kein Merge. Kein Gate B.**

## Live Git

- current `main`: `3d0ffa2d97df66a4d6006587047bf27b0df9606c`
- PR #87 head: `0b7d6cfd5b34ffd3e9c0a96779ee51df999bcc67`
- merge-base: `1d558ef56cc275d429f4076c7a8877c3791947a7`
- compare current main → PR head: **21 ahead / 8 behind / diverged**
- PR #87 remains Draft and GitHub reports it non-mergeable.

PR #89 has already integrated the three reviewed TW6-B migration files and the bounded transactional Gate-B playbook onto `main`. PR #87 must therefore be synchronized with current `main` and its effective diff reconstructed before a final verdict.

## CI / Vercel

Old PR exact head `0b7d6cfd` has real pull_request GitHub Actions run `33021548357` = SUCCESS and Vercel deployment `3ME6xvSx4NhyGfvkb2aurKdDhUgF` = SUCCESS.

These checks predate the required current-main synchronization/correction and cannot be reused as merge evidence for the next head.

## Production truth

Product-Owner-approved Gate A has already been executed and independently verified PASS:

1. `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
2. `20260824180000_trip_items_flug_handelsfelder_guard`

Production remains healthy. Explicitly not applied: TW6-B `20260826220000/230000/240000`, AAL2, Direction A and other Production migrations.

The old PR #87 body/status that describes Gate A as only planned is stale and must be corrected after branch synchronization.

## New P1 finding – zero-stage false mode

The approved Day→Stage Mode contract defines:

- `single_destination` = **exactly one Stage**;
- multiple Stages + positions = `explicit`;
- multiple Stages without positions = `unassigned`;
- new requests never mint `legacy_fallback`.

Current TS helper and Development SQL instead derive `single_destination` for `stageCount <= 1`.

Independent Development RPC probe against the actually deployed `20260826240000` function proved that a new `reise_anlegen(jsonb)` request with **zero Stages** is accepted and persists:

- `day_stage_assignment_mode = 'single_destination'`
- Stage count = 0
- all created days remain `stage_id = null`

That is an internally false server mode and contradicts the contract's own meaning. Because `reise_anlegen(jsonb)` is SECURITY INVOKER and callable by `authenticated`, the normal UI invariant is not a sufficient trust boundary.

The probe also re-confirmed expected current behavior for relevant cases:

- multi-stage without positions → `unassigned`;
- partial valid positions → `explicit`, unpositioned days stay null;
- claimed `legacy_fallback` + valid positions → `explicit`;
- unknown claim → `22023`;
- out-of-range position → `22023`.

Temporary Development probe trips were deleted after verification.

## Required correction

Cursor-Agent: `Trip workspace audit architecture`

1. synchronize `feat/tw6-rest-progressive-stages` with current `main` and resolve PR #89 collisions without altering established migration provenance;
2. make zero-stage new Create/RPC requests fail closed (preferred if consistent with the existing Create invariant) or otherwise use a contractually truthful non-single mode; keep TS and SQL identical;
3. add adversarial TS + real Development RPC evidence for zero stages and preserve all existing mode cases;
4. update PR body/status/ADR to current Gate-A PASS / Gate-0-on-main truth;
5. run full exact-head GitHub Actions and exact-head Vercel after correction;
6. keep Production untouched. No Gate B, no AAL2, no Direction A, no TW-7/8/9, no Ready, no merge.

## STOP

Next verdict only on the new synchronized exact head.