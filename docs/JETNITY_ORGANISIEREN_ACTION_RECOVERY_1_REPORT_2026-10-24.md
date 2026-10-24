# Organisieren Action Recovery 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Organisieren Action Recovery 1 — Cursor Generation 1**
Session: `bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa` — https://cursor.com/agents/bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa
Model: `grok-4.7-high-fast`. Requested Grok 4.7 High Fast. No Auto fallback.
Issue #992. Draft PR #995. Branch `fix/organisieren-action-recovery-1`.

## Pins

- Accepted main / current merge-base: `07016ada86dcfc79d5c7c3efa9ba1d62336a1f60`. Behind: 0. Ahead before this docs commit: 7.
- I1 merge commit: `84e7fae065da1abc6765828049ec2b9d8273597f`. Merge tree before this docs commit: `09d3daf91b13fb6848d7ebcd0c54c102361b98ad`.
- Historical lane base: `913cf9353fd33491d2bd3130b3c430cc88990200`.
- Reviewed head that received CHANGES REQUIRED R1: `48fd52dad48583871948ce804aecb9063e7e2410`
- Pre-R1 runtime/proof commit: `f78f801048b8a39493f29215b3b70a38d078fbc2`
- R1 runtime/proof commit: `143b4976c221eab56a35a872ae0d54f32e69174d`
- R1 runtime tree: `26e4a8ba2d2db56f0961d753a7dc9cb2f662641e`
- Exact final HEAD is the branch tip after the docs commit and is stated in the PR comment.
- TASK V1 unchanged, blob `6db7bbecc3eaecc744569bbe74951342ff7f778e`.
- `ManuelleVerbindung` SHA-256 from `export function ManuelleVerbindung` through EOF: `10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360`.

Component blobs at the R1 runtime commit:

- FlugBestand `32e7582cade127610a8d264c87733bd93bbf9b1c` (baseline `75cc47f93d8382e876310dfa250ef685069e8bc5`)
- UnterkunftBestand `18e379f5b9b798ca65aa20b2a0629d51523cc085` (baseline `98f4b67049909d5aa972aece7ad4b8c14b12749b`)
- MobilitaetBereich `eac9ae0cff6999d4167a1d1e151bbac9ba4a0ba6` (baseline `105c8a2a9a4d0b5b285395cfbf2951e411a6dc23`)
- MietwagenBereich `67cc0cbbf25df52770a916b29c2728f177f356fa` (baseline `08a7a68eebbcdd3ad5f1666db27f514561cc6f36`)
- useBookingActionLifecycle `f59a4a25014c9aa17505b4386fd39a45f54ee270`

## What changed

`useBookingActionLifecycle.ts` holds the shared booking claim, generation token, rejection text, and rental-save ownership. It does not call React hooks, so the existing flight and stay tests can keep replacing `react` inside their own component module.

Each inventory claims one item synchronously, sets `aria-busy` on its section, and publishes “Buchungsstatus wird gespeichert.” The active button stays focusable, with `aria-disabled` and reduced opacity, and reads “Wird gespeichert …”. Sibling booking buttons in that inventory use the real `disabled` attribute. Another inventory can still save. Returned string, rejected promise, and throw all clear the claim. Thrown text is replaced by “Der Buchungsstatus konnte nicht gespeichert werden. Du kannst es erneut versuchen.” Success clears the claim and does not change `bookingStatus`. The seal moves only after the parent passes a new stored status.

A changed trip id, or disappearance of the pending item, bumps the generation during render. A late `finishBooking` then does nothing. Unmount is the real React instance: the mounted harness unmounts and remounts, and the old completion does not mark the new instance.

Manual rental uses the same ownership idea for its own form. All ten controls and the submit button disable while that save is pending. Duplicate `requestSubmit` sends one payload. Errors and throws keep the typed values. Success resets only that form to the existing empty start values and shows “Der Mietwagen ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.” Place ids, prices, currency, day, and stage stay null. Names are not trimmed or turned into place ids. Focus returns to the rental submit button only when focus is already on the document body and the save is still the owned one. Booking completion does not move focus, so an open flight-route or stay-interval field keeps it.

The mobility tab row now wraps inside the viewport at 200% text. That edit is above `ManuelleVerbindung`. The connection function itself is unchanged. Its regression still locks the draft, rejects a duplicate submit, keeps values on error and throw, and clears only the connection number and note on success.

## R1 — booking-label containment

Reviewed head `48fd52dad48583871948ce804aecb9063e7e2410` kept the button inside the viewport while the label painted past the button edge. `inline-flex` made the label a flex item, so `whitespace-normal` did not wrap it inside the 156px box.

`BUCHUNG_AKTION_KLASSE` is `inline-block`, `min-w-0`, `max-w-full`, `whitespace-normal`, and `break-words`, with the existing focus ring, minimum height, and disabled opacity. All six booking buttons use it: flight section, unassigned flight, stay, connection edge, unassigned connection, and rental. `ManuelleVerbindung`, `ManuelleFlugRoute`, and `UnterkunftZeitraum` were not edited.

Proof condition, recorded in the harness result: at 320 CSS px and `document.documentElement.style.fontSize = '32px'`, every booking-label DOM Range client rect must lie inside that button’s border box (excess ≤ 1px). The check also rejects button scroll, `overflow: hidden`, and `text-overflow: ellipsis`. States measured: idle, pending, recovered, and domain error, eight controls each, `maxExcess` 0. Existing 320/390/1280 lifecycle assertions still run. The mounted trip leaves flights and connections unassigned; those buttons and the stay and rental buttons are the ones on screen. The assigned branches use the same class string.

Rental submit focus after rejection is still best-effort. This R1 makes no auto-refocus PASS claim.

## I1 — accepted main integration

Identity re-attested before the merge: logical name **Jetnity Organisieren Action Recovery 1 — Cursor Generation 1**, session `bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa`, model `grok-4.7-high-fast`. Local HEAD was the reviewed head `d27dee9a3796cb1d7a3eb7fc7ea846946e442ed5`. Fetched `origin/main` was `07016ada86dcfc79d5c7c3efa9ba1d62336a1f60`. Mode remained NORMAL. TASK V1 blob remained `6db7bbecc3eaecc744569bbe74951342ff7f778e`. Live #751 V14 names this integration as the next C step after A’s actual-main acceptance.

`git merge --no-ff origin/main` completed with the ort strategy and no conflict. Parents are `d27dee9a3796cb1d7a3eb7fc7ea846946e442ed5` and `07016ada86dcfc79d5c7c3efa9ba1d62336a1f60`. The five reviewed C runtime blobs are unchanged. Accepted A/B files, including `lib/trips/flug-manuell.test.ts` and `lib/trips/unterkunft-manuell.test.ts`, are the merged main versions. No C refactor and no test-predicate edit.

Protected function SHA-256, rechecked on the integrated tree:

- `function ManuelleFlugRoute` through its closing brace and the following blank line: `c3fb5c1f7cf8d82d0a5a4efbff10a329557040a741139d375728f8ba19047498`. The function bytes also match exact main `07016ada` and historical base `913cf935`.
- `function UnterkunftZeitraum` through EOF: `17a670b3a1d4a2a8f57e6194387111c9f331360c916374915925a371e133e094`.
- `export function ManuelleVerbindung` through EOF: `10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360`.

Integrated commands, Node v22.23.4, on the merge tree:

- `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/organisieren-action-recovery-1.test.ts lib/trips/flug-manuell.test.ts lib/trips/flug-route-form-validation.test.ts lib/trips/unterkunft-manuell.test.ts lib/trips/lodging-coverage-truth-1.test.ts` — exit 0. Actual count: 109 tests, 13 suites, 109 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo. Duration 5147 ms.
- `node scripts/organisieren-action-recovery-1/harness.mjs` — exit 0, status PASS, Chrome 148.0.7778.96. Four scenario groups PASS. Ten text-bound stages, eight controls each, `maxExcess` 0. `pageErrors` and `blockedRequests` empty. The result file stayed byte-identical to the reviewed R1 evidence.
- `npx tsc -p tsconfig.json --noEmit` — exit 0.
- `npm run lint` — exit 0, 144 warnings, 0 errors. The owned `UNTERBEREICHE` warning remains. This count is the integrated tree.
- `npm run check:setup` — exit 0, warning: no `.env` / `.env.local`.
- `npm run check:operating-mode` — PASS.
- `npm run check:api-schutz` — PASS.
- `npm run check:schema-bezug` — exit 0, with the same pre-existing LOCAL/UNAPPLIED RPC notes.
- `npm run check:dead` — 0 orphans.
- `npm run check:exports` — 0 unexplained exports.
- `npm run check:deps` — 0 unused.
- `npm run build` — exit 0.

## Acceptance

1. Both directions for flight, stay, connection, and rental use the existing `itemId` / boolean callback. The seal stays “Ausgewählt” until `commitBooking` supplies stored `booked`. No provider confirmation string.
2. Domain error, reject, and throw recover with a visible alert and an enabled retry. No second write is started automatically.
3. Enter on the pending flight button and a forced sibling click add no call. A stay action still starts while the flight action is pending. Pending copy, `aria-busy`, and `aria-disabled` match the refusal.
4. Item removal, trip change, and unmount/remount ignore the late completion. The new context can start another action. Route and stay editors keep focus and their typed values, and their callbacks are not called.
5. Ten rental controls stay disabled and unchanged while pending. Error, reject, and throw keep them. Success clears only that form. Retry sends the corrected note.
6. Empty optionals and the impossible date `2026-02-31` stay explicit in the node payload. The browser date control is not the proof for an impossible date. Place ids and prices stay null. The Nutzerangabe sentence is unchanged.
7. Rental and connection payloads match the previous field set. No server, account, or guest contract change.
8. Connection hash matches. Flight-route and stay-interval editor suites pass: 109 focused tests, 0 failures.
9. Keyboard recovery keeps focus on the active booking button. Viewports 320, 390, and 1280 have no horizontal overflow at 100%. At 200% root font-size, owned booking and rental surfaces fit. One unchanged connection input still extends to x=367 at 320px. See residuals.
10. The harness mounts real `FlugBestand`, `UnterkunftBestand`, `MobilitaetBereich` (including `ManuelleVerbindung`), and `MietwagenBereich` with real coverage helpers and in-memory callbacks. Two rows per inventory.
11. Evidence states the stub boundary. This is not account, persistence, provider, device, or screen-reader acceptance.

## Commands

The list below is the pre-integration R1 run. The integrated counts are in the I1 section.

- `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/organisieren-action-recovery-1.test.ts lib/trips/flug-manuell.test.ts lib/trips/flug-route-form-validation.test.ts lib/trips/unterkunft-manuell.test.ts lib/trips/lodging-coverage-truth-1.test.ts` — 109 pass, 0 fail.
- `node scripts/organisieren-action-recovery-1/harness.mjs` — exit 0, evidence status PASS. Chrome 148.0.7778.96. Playwright’s bundled Chromium was absent (`chromium_headless_shell-1187`), so the harness used the Chrome channel. No blocked requests. No page errors.
- `npx tsc -p tsconfig.json --noEmit` — exit 0.
- `npm run lint` — exit 0, 146 warnings, 0 errors. Same warning count as the task baseline, including the pre-existing `UNTERBEREICHE` warning.
- `npm run check:setup` — exit 0, warning: no `.env` / `.env.local`.
- `npm run check:operating-mode` — PASS.
- `npm run check:api-schutz` — PASS, 12 admin routes.
- `npm run check:schema-bezug` — exit 0. It printed pre-existing LOCAL/UNAPPLIED RPC notes. No schema edit in this lane.
- `npm run check:dead` — 0 orphans.
- `npm run check:exports` — 0 unexplained exports.
- `npm run check:deps` — 0 unused.
- `npm run build` — exit 0.

## NOT VERIFIED

- Full `npm test` (the whole `lib/**/*.test.ts` script). Not run on the integrated head.
- Exact-head App/Auth CI and Vercel Preview for the integrated head. Earlier previews, including the reviewed R1 preview, are not this head.
- Hosted account, guest storage, provider calls, physical devices, and screen readers.
- Personal browser. #748 stays suspended. The browser proof is headless Chrome on an isolated local page.

## Stub boundary

Callbacks resolve in memory. The harness aborts every request that is not GET `/`, `/harness.js`, or `/style.css`. Nothing was written to an account, guest store, or provider.

## Truth, privacy, security, cost

Stored booking status remains the seal. UI success does not invent a provider confirmation. Thrown errors are not shown. No new storage, server, Auth, DB, dependency, or paid call. No new ongoing cost.

## Residuals

- P0: none.
- P1: none.
- P2 from R1, owned booking-label overflow: addressed. Range excess is 0 at 320px / root 32px for the measured labels.
- P2, unchanged and out of scope: one input inside byte-identical `ManuelleVerbindung` still extends to x=367 at 320px and 200% root font-size. Compared with exact main by the Technical Lead; this lane does not edit it.
- P3: bundled Playwright Chromium was missing; proof used installed Chrome. The active booking button uses `aria-disabled` rather than the `disabled` attribute so keyboard focus is not pushed to the next control. Rental auto-focus after rejection can leave `document.body`; retry stays keyboard-reachable. No auto-refocus PASS claim, and R1 does not change that behavior.
