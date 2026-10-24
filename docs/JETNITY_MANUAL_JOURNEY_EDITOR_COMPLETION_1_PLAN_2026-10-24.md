# Manual Journey Editor Completion 1 — PLAN

Date: 24 October 2026
Status: revised plan after Technical-Lead plan review R1. Still before product code. Stop for exact-head re-review.
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Issue: #998
Branch: `fix/manual-journey-editor-completion-1`
Draft PR: #1001
TASK: `docs/JETNITY_MANUAL_JOURNEY_EDITOR_COMPLETION_1_TASK_V1_2026-10-24.md` remains immutable.
Addendum: `docs/JETNITY_MANUAL_JOURNEY_EDITOR_COMPLETION_1_TASK_ADDENDUM_V1_2026-10-24.md` is immutable and read before this correction.

## Session and model

- Cursor session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
- Session URL: https://cursor.com/agents/bc-02fbe98d-97ba-4c0b-a3b0-10857d784379
- Requested model: Grok 4.7 High Fast / `grok-4.7-high-fast`
- Actual model: `grok-4.7-high-fast` (`originalModelName` from this run). No Auto fallback and no unrelated model.
- Logical name: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
- UI title: the supported chat-rename capability returned that exact title for this same `bcId`. This is the tool result, not an invented rename.

## Live read

- Operating mode re-read this session: `NORMAL` in `.jetnity/operating-mode.json`. This assigned lane is ordinary bounded product work. Special Product-Owner gates stay in force. This editor lifecycle does not cross one.
- Startup pointer: `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` still describe the 2 October continuity writer. Those dated paragraphs are historical. Live evidence wins.
- #751 body re-read this session. Current accepted main in that index is **0c37d318c47a758f06634448d6e0de3856bbc6a6**, tree **5e7b61a111f94f16a27c80a8ec89e42ef7af62e8**, mode NORMAL. R105 V2 records three dispatches. This lane is C, state at that index **DISPATCHED_START_UNVERIFIED** until this plan. Protected #751 sections 3–5 were not edited.
- First plan head `a5159391fc1872d62e2599302bbf0cb62d521109` was 2 ahead / 0 behind and is superseded by this correction. Technical Lead committed addendum V1 at `1cc1eb973e1f87b61697536e49ab820ad179230f`, parent `a5159391`, one new document. This session fetched that branch and fast-forwarded to that exact SHA before editing the plan.
- `origin/main` remains **0c37d318c47a758f06634448d6e0de3856bbc6a6**, tree **5e7b61a111f94f16a27c80a8ec89e42ef7af62e8**. Merge-base is that same SHA. At this correction's parent the branch is **3 ahead / 0 behind**. After this plan commit the diff against main is three documents: TASK V1, addendum V1, and this revised PLAN. Node `v22.23.4`.
- R105 precheck: https://github.com/Jetnity/jetnity/issues/751#issuecomment-6385343244. Integration order is **A → C → B**. No sibling branch is integrated. A is #999 / #996. B is #1000 / #997. Their files stay untouched.
- Binding Slice Precheck, Multi-Agent Operating System, Multi-Agent Slice Planning, Technical-Lead operating standard, and V1 build order §8 were read. This task completes three existing Organisieren editors. It does not start a provider, Official Truth, account, or Phase-2 program.
- Standing stops preserved: #985/#982 HOLD, #917 denied hosted readback, #913/#911 block, #968 cleanup PAUSE, #748 personal-browser SUSPENDED, #626 STOP, Bern #934/#937 PAUSE, #944 no-autostart, #585 deferred. No hosted read or write, no credential, no migration, no provider or paid call.
- Source hashes on the seed, read only, not a runtime proof:
  - `ManuelleFlugRoute` (`function ManuelleFlugRoute` through the line before `export default function FlugBestand`): `c3fb5c1f7cf8d82d0a5a4efbff10a329557040a741139d375728f8ba19047498`
  - `UnterkunftZeitraum` (function through EOF): `17a670b3a1d4a2a8f57e6194387111c9f331360c916374915925a371e133e094`
  - `ManuelleVerbindung` (`export function` through EOF): `10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360`
- A local `next-env.d.ts` edit was already in the worktree from the environment. It is not staged and is not part of this plan commit.

Traveller context is not relevant. These three editors record user-typed flight segments, stay dates, or a connection. They do not infer citizenship, travel documents, residence, visas, carrier eligibility, or route truth. Empty and unknown values stay unknown.

## Evidence class

Everything below is source inspection on the seed. It is not mounted behavior, not hosted state, and not CI. Mounted proof belongs to the later implementation head.

## Observed source defects

### Flight route — `components/trips/FlugBestand.tsx`

- `ManuelleFlugRoute` focuses the first input on open and focuses the first `input[aria-invalid="true"]`, or the summary, after `fokusVersuch` changes. Schema failure increments that counter. The domain-string branch (line 112) and the throw branch (line 118) set the message and do not increment it, so those errors do not move focus.
- `speichern` reads `item.id` at the `await` and has no generation, trip, or unmount guard. `finally` always clears `schreibt` and `laeuft` on that instance.
- Section rows use `key={abschnitt.id}` (`outbound:${stageId}`, `connection:${from}:${to}`, `return:${stageId}` from `flugAbdeckung`). The editor at the callsite near line 324 has no key. Replacing the item inside one section reuses the editor instance: segment state can still be item A's draft while `item.id` is already item B. Unassigned rows are keyed by `item.id`; the editor there (near line 360) is also unkeyed, so a same-id refresh keeps the draft, and a trip change that keeps an item id can reuse it too.
- The route-readback wrapper (lines 230–255) stores `itemId`, segments, and `window.location.href`. It does not store the trip id. A late matching readback can focus a row and set the saved status after the trip id has changed, when the URL is unchanged.
- Existing behavior to keep: synchronous `schreibt` lock, disabled segments while pending, schema recompute while `validieren` is on, 1–4 segment bounds, refusal of multi-leg and over-four routes, Escape ignored while pending, success closes and focuses the trigger, thrown details are not shown.

### Stay interval — `components/trips/UnterkunftBestand.tsx`

- `UnterkunftZeitraum` has no focus effect, no Escape handler, and no unmount or target guard. Open does not focus Check-in. Validation failure, a returned domain string, and a throw do not move focus.
- `feldfehler` is one boolean set on failed submit and cleared only when the form is opened again. Both date inputs stay `aria-invalid` after the user corrects a field, until the next submit.
- The callsite near line 133 passes `item` only. The list key is `aufenthalt.item.id`, not the trip id. A pending save reads `item.id` from the render that reaches the `await`. A later completion still closes, focuses, and sets the saved status on that same instance.
- The invalid-submit test expects exactly one `role="alert"`. New field alerts would break that assertion. The single summary stays.

### Connection — `components/trips/MobilitaetBereich.tsx`

- `ManuelleVerbindung` already has a synchronous `schreibt` lock, disables all ten controls while `laeuft`, and ignores completion after unmount (`lebendig`).
- State initializers (lines 349–358) run once. The Organisieren callsite near line 334 is `<ManuelleVerbindung reise={reise} onAnlegen={onManuellAnlegen} />` with no key. A later trip, origin, first stage, start date, or first day on that same mount does not change the draft. A late success can still clear `connectionRef` and `note` and set the status sentence in the newer render.
- `components/trips/TripIntegratedDay.tsx` already keys the same component with `${need.occurrence}:${dayId}` and passes `vorgabe`. That file is read-only. Its key does not include the trip id, so the component itself must treat a new `reise.id` as a target change.
- Place ids are already cleared when the submitted text differs from `vorgabe` origin or destination. Price, currency, title, and `mobilityChanges` are already null. That payload stays.
- Accepted R104 evidence `docs/evidence/organisieren-action-recovery-1/result.json` records one connection `INPUT` with right edge 367 and page `scrollWidth` 367 at viewport 320 and root font-size scale 2. Shared `ORGANISIEREN_EINGABE_KLASSE` is `w-full` without `min-w-0` or `max-w-full`. That shared class is outside this allowlist. The local control class list is the fix. Historical evidence files stay untouched.
- The reject alert is exactly `Die Verbindung konnte nicht gespeichert werden. Deine Eingabe bleibt erhalten.` That sentence states a failed write. A thrown or rejected create does not prove the connection was not stored. Addendum V1 requires that uncertainty in the one primary alert, and it opens the two expected-text constants named below. The first plan's separate non-alert note is withdrawn.

## Allowed paths

Runtime, only the named functions:

- `components/trips/FlugBestand.tsx` — `ManuelleFlugRoute`, local `FLUGFELDER` / `ROUTE_KNOPF` / `leeresFlugsegment`, imports those need, the two editor callsites near lines 324 and 360, and the route-readback wrapper at lines 230–255. Booking actions stay as they are, including `useBookingActionLifecycle`.
- `components/trips/UnterkunftBestand.tsx` — `UnterkunftZeitraum`, its local helpers and classes, its imports, and the editor callsite near line 133. Booking actions stay.
- `components/trips/MobilitaetBereich.tsx` — `ManuelleVerbindung`, exclusively local editor helpers and classes, its imports, and the callsite near line 334. Search, inventory, and booking stay.
- `lib/trips/manual-journey-editor-completion-1.ts` and `lib/trips/manual-journey-editor-completion-1.test.ts` — pure context and preset comparison only. No React.

Not created: `components/trips/useManualEditorLifecycle.ts`. The flight and stay node tests substitute `react` inside the component module and then call the editor as a function. A hook in another module would execute real React and break those tests. Lifecycle state stays in the three component modules the substitution already controls.

Proof and delivery, later, after plan approval:

- `scripts/manual-journey-editor-completion-1/**`
- `docs/evidence/manual-journey-editor-completion-1/**`
- `docs/JETNITY_MANUAL_JOURNEY_EDITOR_COMPLETION_1_{STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-24.md`
- `VERBINDUNG_HASH` in `lib/trips/organisieren-action-recovery-1.test.ts` and `scripts/organisieren-action-recovery-1/harness.mjs`. The old hash stays named as R104 lineage in this lane's report.
- Thrown-text constants only, bound to the new primary sentence, equality checks kept: `VERBINDUNG_ABGELEHNT` in `scripts/organisieren-action-recovery-1/harness.mjs` (baseline line 29, assertion near 548) and `THROWN` in `scripts/manual-mobility-pending-draft-guard-1/harness.mjs` (baseline line 24, assertion near 432). No other assertion, viewport, payload, pending, retry, or secret-redaction edit in those files.
- EVIDENCE-path initialization only in those two harnesses: accept `JETNITY_R105_C_EVIDENCE_DIR` when it resolves inside `docs/evidence/manual-journey-editor-completion-1/`, and keep the historical folder when the variable is unset. `SCREENS` stays derived from the chosen directory.
- `lib/trips/flug-manuell.test.ts`, `lib/trips/flug-route-form-validation.test.ts`, and `lib/trips/unterkunft-manuell.test.ts` only if the editor shape makes an existing adapter fail. Existing domain, validation, and behavior assertions stay. The stay adapter needs a no-op `useEffect` once the editor calls it, and functional `useState` updates if the editor uses them. The flight validation harness only accepts `querySelector` selectors `input` and `input[aria-invalid="true"]`; those selectors stay.

No global current-state file, shared contract, CSS module, package, lockfile, workflow, schema, or config edit. No sibling merge. TASK V1 stays immutable.

## Context rules

Three different events:

| Event | Flight and stay | Connection |
| --- | --- | --- |
| Target change: new trip id, or another item id in the same section | Remount with `key={`${reise.id}:${item.id}`}`. In-flight completion of the old instance cannot close, focus, unlock, or mark the new instance. | Organisieren callsite `key={reise.id}`. Inside the function, a changed `reise.id` without remount also increments the generation, drops the old draft, and ignores the old completion. |
| Preset change, same trip and same target | Opening copies the current stored route or dates. An already open draft is not replaced because the parent refreshed the same item. | Fields that still equal the last applied preset follow the new preset. Fields the user changed stay, including times, connection number, and note. |
| Ordinary save readback, same trip and same target | Do not put route or date content in the React key. Success closes only the submitting instance. The flight wrapper focuses the saved row only when trip id, item id, URL, and stored segments still match. | Success clears only connection number and note, and only in the submitting generation. Other typed fields stay. |

A write that has already called the parent callback is not described as aborted or rolled back. Late UI completion is ignored. The stored graph remains the authority when it arrives.

Pending is synchronous. `schreibt` is set before the await and before the corresponding `laeuft` render. A second submit in the same turn does not call the callback. Segment add/remove and all submitted controls stay disabled for that pending generation. A context change releases the lock for the new generation without letting the old `finally` clear the new lock.

## Implementation shape

Flight:

- Pass `reiseId`. Capture `{ reiseId, itemId, generation }` when the submit begins, then await.
- After a returned string or a throw, keep the segments, set the existing messages, and increment `fokusVersuch` so the current effect focuses the summary. Do not show thrown details. Do not change the `querySelector` selectors.
- Ignore completion when the instance is unmounted or the generation differs. Do not focus a closed or replaced form.
- Keep schema-owned field errors recomputed from the current draft. A corrected field loses `aria-invalid` without a new submit. One to four segments, connected-airport rules, and the multi-leg / over-four refusal stay on the existing schema.
- Wrapper stores `reiseId` with the readback and returns before focus or status text when `reise.id` differs. Booking state is not part of that change.

Stay:

- Same identity, generation, and unmount rule.
- On open, focus Check-in after render. On schema, domain, and throw failure, focus the first invalid date input, otherwise the single summary. Escape while open and not pending closes and returns focus to the trigger. Escape while pending does nothing.
- While validation is armed, derive each input's `aria-invalid` from the current `unterkunftZeitraumSchema` issues. Correcting a field clears that mark on the next render. Keep one `role="alert"` summary so the existing count assertion stays true.
- Existing date contract stays: explicit check-in and check-out, check-out after check-in, no inferred dates. The schema import stays read-only.

Connection:

- Generation increments on trip change and on a real preset-key change. Preset key covers mode, origin and destination text, place ids, day id, and start date from `vorgabe` or, when `vorgabe` is absent, from the current trip's origin, first stage, start date, and first day. It does not cover object identity.
- Pending completion with a mismatched generation does not clear fields, set the status sentence, set the error, or focus.
- One `role="alert"` carries the outcome. A returned domain string stays that alert's text. A throw or rejection replaces the old definitive sentence with this primary text, and focus moves to that alert after render, only in the submitting generation: `Ob die Verbindung gespeichert wurde, konnten wir nicht bestätigen. Deine Eingabe bleibt erhalten. Prüfe deinen Reiseplan vor einem erneuten Versuch. Ein erneuter Versuch kann eine zweite Verbindung anlegen.` There is no second paragraph. The alert does not say the write failed or was rolled back. No automatic retry, no hidden idempotency key, no new writer field. Thrown details stay hidden.
- Success keeps the sentence `Die Verbindung ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.` and clears only the connection number and note in that generation.
- Local classes on this form only: `min-w-0 max-w-full` composed onto the ten controls and their immediate wrappers, plus `min-w-0` on the form grid. Shared `ORGANISIEREN_*` and `ARBEITSFELD_SPALTEN_KLASSE` strings stay. No page or root `overflow-hidden`.

## Proof strategy

Synthetic and local only. No deployed test route, no personal browser, no hosted account.

- Pure node test for target equality, preset-key stability, and "clean field follows preset / dirty field does not".
- Existing flight, stay, and route-validation node tests rerun. They remain the domain and payload proofs. Adapters change only where a new hook would throw outside a renderer.
- New Playwright harness bundles and mounts the real three editors with in-memory callbacks. Unexpected origins are aborted. Cases:
  - Flight: valid save, schema errors, domain string, reject, throw, retry keeping segments, add/remove within 1–4, multi-leg and over-four refusal, open and pending replacement inside one section with no old-target submit and no old result applied to the new item.
  - Stay: initial focus, invalid dates, correction clearing the old invalid mark, domain and throw, retained draft, retry, Escape and cancel, success readback, pending replacement and unmount.
  - Connection: pending lock on all ten controls, double submit, domain error and reject retaining the draft, explicit success clearing only number and note, same-mount trip change, preset and day change, late result, manually edited values not replaced, local geometry.
- Keyboard and focus for the changed paths. `prefers-reduced-motion: reduce` recorded; this plan adds no animation.
- Viewports 280, 320, 360, 390, 430, 768, 1280, plus a short landscape pass where the form is the subject. At minimum the mounted set includes 320, 390, 1280, and 320 with root font-size 32px. Evidence records bounding boxes. That setup is CSS viewport and root font-size, not native browser zoom and not a physical device.
- R103 and R104 harnesses still run, with equality checks intact. `VERBINDUNG_ABGELEHNT` and `THROWN` become the primary sentence above. The connection hash constant becomes the new function bytes. Booking, rental, domain-string, success, payload, pending, retry, secret-redaction, and viewport assertions stay.
- This lane runs those two harnesses only with `JETNITY_R105_C_EVIDENCE_DIR` set:
  - R103: `docs/evidence/manual-journey-editor-completion-1/r103-manual-mobility-pending-draft-guard`
  - R104: `docs/evidence/manual-journey-editor-completion-1/r104-organisieren-action-recovery`
- An override outside `docs/evidence/manual-journey-editor-completion-1/` is rejected. Unset, each harness still targets its historical folder. Historical `docs/evidence/organisieren-action-recovery-1/**` and `docs/evidence/manual-mobility-pending-draft-guard-1/**` stay byte-identical. New results name this head, the harness bytes, the override, and the cases. They are not labeled as the old accepted head.

Every new evidence file names the exact head, command, exit, case count, browser version, viewport, root font-size, motion setting, stubs, and port. Callbacks are in-memory. No guest storage, account action, hosted write, provider, database, screen reader, or physical device is claimed.

## Gates

On the later implementation head: focused node tests, mounted harness, TypeScript, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, and a production build. `db:*` and `auth:pruefen` are not in scope; no schema or auth file changes. Full App, Auth, and Vercel gates stay mandatory and unchanged. A skip is not a pass. Existing warnings stay disclosed. This plan runs none of those gates.

## Costs, security, database

- No new dependency, provider, model call, or recurring cost.
- No new route, service role, secret, or log of route, stay, or connection payloads.
- No migration, RLS, grant, or Auth change.

## Unknowns

- The exact input that reaches x=367 is recorded as an `INPUT` in the historical result, not remeasured here. Implementation measures all ten controls and fixes the local overflow that is actually present. If a local `min-w-0` composition is not enough and the fix would require the shared class or global CSS, stop and report it.
- C-P2-PLAN-01 and C-P2-PLAN-02 are incorporated above. The separate unconfirmed note is not the product behavior.
- CI, Preview, hosted accounts, screen readers, native zoom, and physical devices are NOT VERIFIED in this plan.
- No follow-up slice, Ready, or merge.

## Stop

This commit is the revised PLAN gate after addendum V1. No runtime or test implementation is included. The next actor is the Technical Lead, re-reviewing this exact head in this same session. Implementation stays unauthorized until that acceptance.
