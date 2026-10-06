# Trip Workspace flight form validation recovery 1 — Task

Date: 6 October 2026
Issue: #875
Repository: Jetnity/jetnity
Baseline: `main@b16a250b95715418c125a92a2d407ba2ec3f89fa`
Branch: `fix/trip-workspace-flight-form-validation-recovery-1`
Execution lane: Codex Desktop
Parallel-safe with #873/#874/#876 when this allowlist is respected.

## Objective

Close #871 F-04. The manual-flight editor currently turns one failed parse into one global `feldfehler` boolean, marks every input `aria-invalid`, and leaves keyboard focus on Save.

## Required behavior

- Preserve `flugRouteManuellSchema` exactly; do not weaken validation.
- Derive field-invalid state from the actual Zod issue paths.
- Only inputs implicated by current field-level issues get `aria-invalid=true`.
- Form-level/cross-segment issues remain form-level; do not falsely mark every field.
- On rejected submit, focus the first actual invalid field in deterministic DOM order when one exists.
- If only a form-level issue exists, focus/announce the form error summary or another deterministic accessible target; never leave the user without recovery guidance.
- Existing safe error text via `ersteMeldung` remains.
- After the user changes a field following a failed submit, update/recompute invalid-field state so corrected inputs do not remain falsely invalid.
- Valid submit, Escape, add/remove segment, 1–4 bounds, async write guard, success state and persistence callbacks remain unchanged.
- No hidden automatic repair of continuity or user data.

## Allowed files

TASK is immutable:
- `docs/TRIP_WORKSPACE_FLIGHT_FORM_VALIDATION_RECOVERY_1_TASK_2026-10-06.md`

Modify:
- `components/trips/FlugBestand.tsx`

Create:
- `lib/trips/flug-route-form-validation.test.ts`
- `docs/TRIP_WORKSPACE_FLIGHT_FORM_VALIDATION_RECOVERY_1_REPORT_2026-10-06.md`
- `docs/TRIP_WORKSPACE_FLIGHT_FORM_VALIDATION_RECOVERY_1_HANDOFF_2026-10-06.md`
- `docs/TRIP_WORKSPACE_FLIGHT_FORM_VALIDATION_RECOVERY_1_SELF_REVIEW_2026-10-06.md`

Do not modify `FlugRoute.tsx` or shared existing manual-flight tests; parallel slice #874 owns readback.

## Required tests

At minimum:
- one missing IATA marks/focuses only that field;
- correcting it clears/recomputes that field state;
- a different invalid field then becomes first focus if applicable;
- cross-segment continuity error does not mark unrelated fields invalid;
- valid route submits exactly once;
- no write on invalid route;
- 4-segment/add/remove behavior unchanged;
- accessible error association remains valid.

Use the smallest deterministic React/event harness; browser check optional if useful.

## Non-scope

No schema change. No flight coverage logic. No readback/presentation change. No DB/Supabase/provider/Official Truth/F8. No global continuity. No follow-up.

## Delivery

Run focused new test + relevant manual flight tests, `git diff --check`, typecheck/lint if proportionate.
Commit + push. Report exact head, merge-base/ahead/behind, files, TASK blob, checks, Codex session/model evidence.

Classification:
- `TRIP_WORKSPACE_FLIGHT_FORM_VALIDATION_RECOVERY_READY`
or
- `TRIP_WORKSPACE_FLIGHT_FORM_VALIDATION_RECOVERY_NOT_READY`

Stay Draft. Do not Ready. Do not merge.

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
