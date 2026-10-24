# Organisieren Action Recovery 1 — PLAN

Date: 24 October 2026
Status: plan before product code
Author: **Jetnity Organisieren Action Recovery 1 — Cursor Generation 1**
Issue: #992
Branch: `fix/organisieren-action-recovery-1`
Draft PR: #995

## Session and model

- Cursor session: `bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa`
- Session URL: https://cursor.com/agents/bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa
- Requested model: Grok 4.7 High Fast
- Actual model: `grok-4.7-high-fast` (`originalModelName` from this run). No Auto fallback and no unrelated model.
- Logical name: **Jetnity Organisieren Action Recovery 1 — Cursor Generation 1**
- UI title: renamed with the supported chat-rename capability to that logical name. This is an actual rename result, not an invented UI claim.

## Live read

- Operating mode: `NORMAL` (`.jetnity/operating-mode.json`, re-read this session). Product work on this assigned lane is allowed. Special Product-Owner gates stay in force. This UI lifecycle does not cross one.
- Startup pointer: `JETNITY_START_HERE.md` names #751 as the live index. Historical pins in that file do not override #751 or the task baseline.
- #751 body re-read this session. Current accepted main in that index is **913cf9353fd33491d2bd3130b3c430cc88990200**, tree **d1b7250c68bad2cfe67135fed1d6e5969c864162**, mode NORMAL. R103 is complete. #985/#982 remains scoped HOLD. #917 denied hosted readback, #968 cleanup PAUSE, and #748 personal-browser suspension stay binding. Protected #751 sections 3–5 were not edited.
- R104 precheck: https://github.com/Jetnity/jetnity/issues/751#issuecomment-6382797662. This lane is C. Integration order is **B → A → C**. No sibling branch is integrated.
- Binding Slice Precheck, Multi-Agent Slice Planning, and V1 build order §8 were read. This task completes an existing Organisieren surface with existing contracts. It does not start a provider, Official Truth, or Phase-2 program.
- Local git at this plan commit's parent: HEAD `045e5612e2490986e01d36b06d951ee585bda371`, merge-base with `913cf9353fd33491d2bd3130b3c430cc88990200` is that same main SHA, **1 ahead / 0 behind**. The only commit is the immutable TASK V1. Node `v22.23.4`.
- Baseline blobs match the task: FlugBestand `75cc47f93d8382e876310dfa250ef685069e8bc5`; UnterkunftBestand `98f4b67049909d5aa972aece7ad4b8c14b12749b`; MobilitaetBereich `105c8a2a9a4d0b5b285395cfbf2951e411a6dc23`; MietwagenBereich `08a7a68eebbcdd3ad5f1666db27f514561cc6f36`.
- `ManuelleVerbindung` source from `export function ManuelleVerbindung` through end of file, SHA-256 `10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360`. That function stays byte-identical.

Traveller context is not relevant. Booking status and the manual rental entry record a user action on an existing trip item or a user-typed rental. They do not infer citizenship, travel documents, residence, visas, or route eligibility. Unknown rental facts stay null.

## Observed source defects

Read on the seed head, not yet executed in a browser:

- `FlugBestand`, `UnterkunftBestand`, `MobilitaetBereich`, and `MietwagenBereich` each set a busy item id, then `await onBuchungsstatus(...)` with no `catch` or `finally`. A rejection or throw never clears the busy id.
- Only the active row's button uses `disabled={laeuft === itemId}`. Every other booking button in that inventory still looks available, while the handler returns immediately when `laeuft` is set.
- `laeuft` is React state, so two clicks in the same turn can both pass the guard before the next render. There is no synchronous duplicate guard.
- A late resolution still calls `setLaeuft` / `setMeldung` with no trip, item, or instance ownership check.
- `ManuellerMietwagen` leaves all ten fields editable during `await onAnlegen`. Success then clears them, including edits made while the save was in flight. A throw also skips the `laeuft` reset because it happens after the bare `await`.
- Stored `bookingStatus` already drives the seal and the button direction. The UI does not optimistically flip that truth. That part stays.

## Allowed paths

Runtime:

- `components/trips/FlugBestand.tsx` — booking-status lifecycle and its pending/error presentation only. Flight-route editor stays untouched.
- `components/trips/UnterkunftBestand.tsx` — booking-status lifecycle and presentation only. Stay-interval editor stays untouched.
- `components/trips/MobilitaetBereich.tsx` — connection booking action only, above `ManuelleVerbindung`.
- `components/trips/MietwagenBereich.tsx` — rental booking action and manual rental entry.
- `components/trips/useBookingActionLifecycle.ts` — the identical local booking interaction only. It will not call React hooks. Existing flight and stay tests substitute `react` inside the component module; a hook in another module would execute the real renderer and break those tests, which this lane must not edit. The helper owns the synchronous guard, generation token, rejection text, and focus restoration. Each inventory keeps its own `useState`.

Proof and delivery:

- `lib/trips/organisieren-action-recovery-1.test.ts`
- `scripts/organisieren-action-recovery-1/**`
- `docs/evidence/organisieren-action-recovery-1/**`
- the PLAN, STATUS, REPORT, SELF_REVIEW, and HANDOFF documents named in TASK V1

No global current-state file, shared contract, CSS, package, lockfile, workflow, or config edit. TASK V1 stays immutable. No sibling merge.

## Implementation shape

Booking, per inventory:

- Claim the action on a synchronous memory object before awaiting. A second call while that id is set does not call the callback.
- Disable every booking button in that inventory while one action is pending, and set `aria-busy` on the inventory section. The active button reads "Wird gespeichert …". A polite status says the booking status is being saved.
- Returned string, rejected promise, and synchronous throw all clear the busy state and show a comprehensible message. Thrown details are not shown. There is no automatic second write.
- Success clears the busy state and does not change the seal. The parent trip remains the booking-status source.
- A changed trip id, or disappearance of the active item id, increments the generation and clears the busy state during render so the new context can operate. A late completion with the old generation does not write message or focus.
- Focus returns to the acted-on button only after it is enabled again, and only when focus is still on the document body. A newer focused control, including the flight-route or stay-interval editor, keeps focus.

Manual rental:

- The same ten controls stay disabled while the owned save is pending. Errors and throws keep the entered values. Success resets only that owned form to the existing empty start values and keeps the existing "Nutzerangabe, nicht Providerbestätigung" sentence.
- Payload fields stay exactly as they are today, including null place ids, prices, currency, day, and stage. No new client validation and no derived place id.
- A trip change or unmount invalidates the in-flight save so it cannot reset a newer form.

## Proof strategy

Synthetic and local only.

- Node test drives the real component functions with the same per-module React substitution the flight and stay tests already use, plus real coverage/rental helpers and controlled callbacks. It covers both directions, domain error, reject, throw, retry, duplicate click, disabled siblings, trip change, item disappearance, and the rental payload. It does not claim a browser, focus, or CSS result. It also hashes `ManuelleVerbindung`.
- `scripts/organisieren-action-recovery-1/` bundles and mounts the real four components plus the unchanged manual connection form in disposable local Playwright. Unexpected origins are aborted. Cases include the async paths above, keyboard recovery, 320/390/1280, and 200% root font-size reflow. Screenshots go under `docs/evidence/organisieren-action-recovery-1/`.
- Stub boundary: callbacks are in-memory. No guest storage, account action, hosted write, provider, physical device, or screen reader.

## Gates

On the implementation head: focused node test, mounted harness, typecheck, lint, and the local checks that do not need hosted credentials. Full App/Auth CI and Vercel Preview stay mandatory Technical-Lead gates for the exact head. No workflow or timeout change.

## Unknowns and non-goals

- Whether 200% font-size at 320px overflows an existing Organisieren row. If it does, fix only inside the allowlisted components. If a fix would need global CSS, stop and report it.
- CI, Preview, hosted accounts, and screen readers are NOT VERIFIED in this plan.
- No follow-up slice, Ready, or merge.
