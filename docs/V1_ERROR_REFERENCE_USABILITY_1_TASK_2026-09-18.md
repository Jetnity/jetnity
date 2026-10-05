# Jetnity – V1 Error Reference Usability 1 – Binding Task

Stand: 18. September 2026  
Issue: #482  
Branch: `fix/v1-error-reference-usability-1`  
Canonical base: `main@21f489d3beed55ca6a80d901d4aded5e669eb1a9`

## 1. Objective

Close the user-facing/process half of V1 audit finding **4.3**: Jetnity already shows error identifiers, but the user is not told how to use them and the admin boundary may show no reference at all.

This slice must make the reference actionable **without** claiming that Jetnity already has operator-side automatic error correlation.

## 2. Required runtime behavior

### Public error boundary

`app/(public)/error.tsx` must:
- keep the existing `oeffentlicheFehlerId(error.digest, React.useId())` behavior;
- keep raw error details development-only;
- tell the user, in concise German product copy, that they may include the shown Fehler-ID when writing to `info@jetnity.ch`;
- expose a normal `mailto:info@jetnity.ch` link/action;
- not claim that the ID can be automatically looked up or that support is 24/7.

### Account error boundary

`app/account/error.tsx` must:
- preserve the existing stable `Fehler-ID`;
- add the same factual contact path;
- preserve current retry and `/reisen` recovery actions;
- not introduce Production logging or error-message exposure.

### Admin error boundary

`app/(admin)/admin/error.tsx` must:
- stop relying on `error.digest` being present;
- use the shared `oeffentlicheFehlerId()` helper with a render-stable `React.useId()` fallback;
- show the result consistently as `Fehler-ID`, not an optional raw `Ref`;
- not render `error.message` in Production. Raw error details may be development-only, matching the public/account safety posture;
- include the same factual `mailto:info@jetnity.ch` contact path;
- preserve retry and dashboard recovery actions.

## 3. Support truth

Update `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md` narrowly so it no longer says:
- account routes have no error boundary;
- admin IDs exist only when a digest exists;
- error surfaces lack the support contact path.

It must continue to state:
- Jetnity has **no operator-side automatic Fehler-ID correlation** today;
- a quoted ID is context, not proof of a server incident;
- do not tell the user “we can look this ID up”;
- no SLA / 24/7 / ticket number is invented.

Finding 4.3 should be described as **user-facing/process half closed, correlation/tooling half still open under 5.5**. Do not mark 5.5 tooling PASS.

## 4. Security / privacy invariants

Forbidden:
- Sentry, Vercel Observability integration, Logtail or any other new vendor/SDK;
- new external provider or recurring cost;
- new secret/env;
- database/Supabase/Auth/RLS changes;
- migration;
- service-role usage;
- Production write;
- raw Production error message or stack exposure;
- user/account/traveller data in the mailto URL;
- automatic ticket creation;
- claiming the support inbox is continuously monitored.

The mailto may contain a generic subject only. Do **not** prefill user error details, URL, account identity or other potentially sensitive data.

## 5. Tests / gates

Add or update targeted tests so the repository fails if:
- any of the three error boundaries loses the factual support address;
- admin reverts to optional digest-only reference;
- admin exposes raw `error.message` unconditionally;
- the support runbook claims operator correlation exists.

At completion run at least:
- targeted tests for the changed error/reference contract;
- `npm run typecheck`;
- `npm run lint`;
- `npm test`;
- `npm run check:api-schutz`;
- `npm run check:schema-bezug`;
- `npm run check:dead`;
- `npm run check:exports`;
- `npm run check:deps`;
- `npm run build`.

Then obtain exact-head GitHub CI and Vercel Preview evidence.

## 6. Evidence documents

Create:
- `docs/V1_ERROR_REFERENCE_USABILITY_1_STATUS_2026-09-18.md`
- `docs/V1_ERROR_REFERENCE_USABILITY_1_HANDOFF_2026-09-18.md`
- `docs/V1_ERROR_REFERENCE_USABILITY_1_SELF_REVIEW_2026-09-18.md`

STATUS/HANDOFF must record:
- base, branch, exact head;
- changed files;
- local gates;
- CI run/job IDs;
- Vercel Preview deployment ID;
- ahead/behind;
- explicit statement that no external error-tracking/correlation tooling was added.

Do not edit global continuity files in this agent slice.

## 7. Agent / governance

Cursor-Agent: **Jetnity V1 error reference usability 1**  
Generation: **1**  
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

Cursor Agent:
- may implement only this task;
- must not mark Ready;
- must not merge;
- must not start a follow-up slice;
- must stop at **STOP FOR TECHNICAL-LEAD REVIEW**.

Any changed head invalidates prior exact-head evidence.
Technical Lead independently reviews the actual diff and gates.
