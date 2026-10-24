# Jetnity — Planning Creation Lifecycle 1 — PLAN

Date: 24 October 2026
Status: plan before product code
Author: **Jetnity Planning Creation Lifecycle 1 — Cursor Generation 1**
Issue: #990
Branch: `fix/planning-creation-lifecycle-1`
Draft PR: #993

## Session and model (before product code)

- Cursor session: `bc-6fcb8c1a-ed18-49b0-a0fc-e2a0006117c5`
- Session URL: https://cursor.com/agents/bc-6fcb8c1a-ed18-49b0-a0fc-e2a0006117c5
- Actual model: `grok-4.7-high-fast` (`originalModelName` from this run). Requested Grok 4.7 High Fast. No Auto fallback and no unrelated model.
- UI title rename is a supported capability on this run and was applied: **Jetnity Planning Creation Lifecycle 1 — Cursor Generation 1**.

## Live read

- Operating mode: `NORMAL` (`.jetnity/operating-mode.json`, re-read this session). Product slice is allowed. Special Product-Owner gates stay in force. This UI lifecycle does not cross one.
- Live #751 index and [R104 V1 precheck](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6382797662) assign this lane only. Integration remains **B → A → C**. No sibling branch is merged, cherry-picked or rebased.
- `JETNITY_START_HERE.md`, the Technical Lead / Cursor operating standard, the multi-agent slice standard, the binding slice precheck, V1 build order §8 (dependency-free product-surface reliability) and the task’s quality boundary were read. Historical pins do not override live #751 / main `913cf9353fd33491d2bd3130b3c430cc88990200`.
- Seed HEAD `b5390fe4c4cfea9a0016331de52358295f61166c`, merge-base `913cf9353fd33491d2bd3130b3c430cc88990200`, **1 ahead / 0 behind**. Diff is the immutable TASK file only. TASK V1 stays byte-identical.
- Baseline blobs match the task: TripPlanner `7fc7727d2974fd46c2210a20177417f529451911`, Reiseidee `981eb75af0ec450db83eae71c0a5604f184a22d4`.
- Node `v22.23.4`.
- #985/#982 scoped HOLD, #917 denied hosted readback, #968 cleanup PAUSE and #748 personal-browser suspension stay binding. No held-review retry, hosted write, credential read or provider/model activation.

## Traveller context

Not relevant to collect. These forms record a user-chosen route, dates, party size, budget and a free wish. They do not infer citizenship, documents, visas or eligibility. Route truth stays the selected canonical places. No new identity field.

## Observed source defects (read, not yet executed)

`TripPlanner.absenden`:

- `if (laeuft) return` is React state. A second submit can pass before paint and invoke `reiseorteBestaetigen` / `reiseAnlegen` twice.
- `reiseorteBestaetigen` and account `reiseAnlegen` are awaited with no rejection/throw catch. A rejection leaves `laeuft` true and the submit control disabled.
- Returned `{ok:false}` and the guest `gastreiseAnlegen` catch already recover. Those paths stay.
- While pending, origin/destination search, add/remove/reorder, dates, travellers, budget and the wish stay editable against the submitted snapshot.
- After an await, an unmounted completion can still `router.push` or call `gastreiseAnlegen`. An account call already sent cannot be cancelled.

`Reiseidee`:

- `vorschlagErzeugen` and account `vorschlagUebernehmen` have no rejection/throw catch. Generation’s `anlauf` check returns early on a newer run and can leave `laeuft` true; it does not cover unmount.
- Textarea and example buttons stay editable while generation is pending, so the visible draft can diverge from the submitted text.
- Adoption’s guest `try/catch` keeps specific storage errors. Proposal, warnings and `clientRef` already survive a returned `{ok:false}`. Rejection can still strand the preview.
- A late `vorschlagOrteAufloesen` completion can still call `gastreiseAblegen` after unmount. An account adoption already sent is not cancellable.

`clientRef` is already minted once per manual attempt and once per successful proposal. Retries must not replace it. Guest action-time `gastCreateJetztPruefen` and account independence from guest storage stay where they are.

These are source-control findings. Executed evidence starts only after mounted components and controlled boundary promises.

## Allowed writes

- `components/trips/TripPlanner.tsx`
- `components/trips/Reiseidee.tsx`
- `components/trips/usePlanningCreationLifecycle.ts` — small shared UI guard only: synchronous in-flight ref, mounted generation, pending flag, release. It does not call actions, storage, the router or a mutation framework.
- `lib/trips/planning-creation-lifecycle-1.test.ts`
- `scripts/planning-creation-lifecycle-1/**`
- `docs/evidence/planning-creation-lifecycle-1/**`
- this PLAN, plus STATUS, REPORT, SELF_REVIEW and HANDOFF after implementation.

Readonly seams stay unchanged: `OrtSuche` (`disabled`), `VorschlagVorschau`, `PlanenCreateGate`, guest storage, schemas, server actions, place/proposal mapping. No dependency, workflow, config, global style, current-state or TASK V1 edit.

## Implementation shape

1. Take the synchronous guard only after the existing action-time gate and validation succeed, and before the first await. Failed validation does not lock the form and does not invoke an action.
2. Disable the existing controls and pass `disabled` into `OrtSuche` for the whole pending window. Mutators also refuse when the ref is already held, so a same-turn edit does not change the submitted draft. Keep `key={primaerKey}` and `key={ziel.key}`.
3. Capture the manual payload and the proposal text/proposal object before the await. Retries reuse the existing `clientRef`. Do not mint a replacement after an ambiguous result.
4. Catch rejection and unexpected throw on every awaited boundary. Returned domain errors keep their current field or message mapping. Guest storage classes keep their current messages. Transport failure uses one short recovery sentence and does not claim the account write was cancelled.
5. After each await, ignore completion when the instance is gone or the generation no longer owns the run: no `setState`, no `router.push`, and no not-yet-called `gastreiseAnlegen` / `gastreiseAblegen`. A server action that has already been invoked stays invoked.
6. Success still navigates and keeps the guard until unmount. Failure releases it, leaves the draft or proposal and warnings, and leaves retry explicit. No automatic write retry.
7. `aria-busy` on the pending form. Existing alert/status, focus-on-field-error, change and discard behavior stay.

## Synthetic proof

Isolated local Playwright. Esbuild bundles the real `TripPlanner` and `Reiseidee` with real validation, route swap, guest storage and proposal mapping. Aliased boundaries, disclosed in the evidence:

- `next/navigation` and `next/link`
- `@/lib/places/aktionen` (`reiseorteBestaetigen` only)
- `@/lib/trips/aktionen` (`reiseAnlegen` only)
- `@/lib/reisevorschlag/aktionen` (`vorschlagErzeugen`, `vorschlagUebernehmen`, `vorschlagOrteAufloesen`)

Place search is a same-origin synthetic `/api/search/places` response so the real `OrtSuche` can select a canonical id. Guest storage uses the page `localStorage`. A quota fault is a throwing `setItem`, not a storage-module stub. No hosted API, account, model call or personal browser profile. Unexpected origins abort.

Cases: guest and account success, domain/reject/throw, stable payload and `clientRef`, rapid double submit, pending route and text controls, late completion, unmount/remount, existing-draft and legacy-slot non-overwrite, account independence from guest storage, proposal warnings surviving adoption failure. Viewports 320, 390 and 1280, keyboard, and 200% root font reflow, with compiled `styles/globals.css`. Screenshots under `docs/evidence/planning-creation-lifecycle-1/`.

`lib/trips/planning-creation-lifecycle-1.test.ts` executes that runner. It is not a source-text substitute.

## Gates

On the implementation head: harness, the new test, focused create/form/guest regressions, typecheck and lint of the touched files. Full exact-head App/Auth CI and Vercel Preview stay mandatory Technical-Lead gates. No Ready, merge, issue close or follow-up slice.

## Unknowns before the harness runs

- Whether this VM’s Playwright Chromium launches.
- Whether the guest-storage import graph bundles without a server-only edge.
- Whether 200% reflow already fits inside the existing manual field classes. Overflow, if found, is fixed only in the allowlisted components.
