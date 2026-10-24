# Organisieren Action Recovery 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Organisieren Action Recovery 1 — Cursor Generation 1**
Session: `bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa` — https://cursor.com/agents/bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa
Model: `grok-4.7-high-fast`. Requested Grok 4.7 High Fast. No Auto fallback.
Issue #992. Draft PR #995. Branch `fix/organisieren-action-recovery-1`.

## Pins

- Base / merge-base: `913cf9353fd33491d2bd3130b3c430cc88990200`. Behind: 0.
- Runtime/proof commit: `f78f801048b8a39493f29215b3b70a38d078fbc2`
- Runtime tree: `c4aca780a18e1f7f984653749d3e2886843a15f5`
- Exact final HEAD is the branch tip after the docs commit and is stated in the PR comment.
- TASK V1 unchanged, blob `6db7bbecc3eaecc744569bbe74951342ff7f778e`.
- `ManuelleVerbindung` SHA-256 from `export function ManuelleVerbindung` through EOF: `10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360`.

Component blobs at the runtime commit:

- FlugBestand `25e32d07d8c07996bda7f9ee8b87a615667dac9d` (baseline `75cc47f93d8382e876310dfa250ef685069e8bc5`)
- UnterkunftBestand `3dc596a8ed3673a372da98570274ea8a5f2a357a` (baseline `98f4b67049909d5aa972aece7ad4b8c14b12749b`)
- MobilitaetBereich `748e8733b46abd78beae2ad5940d078365a37709` (baseline `105c8a2a9a4d0b5b285395cfbf2951e411a6dc23`)
- MietwagenBereich `c3076320a8f5c146ffef4ea2b47ff523a6e5dd27` (baseline `08a7a68eebbcdd3ad5f1666db27f514561cc6f36`)
- useBookingActionLifecycle `52cb9adde97616fc6c7d128ece69ca48eb5fbf13`

## What changed

`useBookingActionLifecycle.ts` holds the shared booking claim, generation token, rejection text, and rental-save ownership. It does not call React hooks, so the existing flight and stay tests can keep replacing `react` inside their own component module.

Each inventory claims one item synchronously, sets `aria-busy` on its section, and publishes “Buchungsstatus wird gespeichert.” The active button stays focusable, with `aria-disabled` and reduced opacity, and reads “Wird gespeichert …”. Sibling booking buttons in that inventory use the real `disabled` attribute. Another inventory can still save. Returned string, rejected promise, and throw all clear the claim. Thrown text is replaced by “Der Buchungsstatus konnte nicht gespeichert werden. Du kannst es erneut versuchen.” Success clears the claim and does not change `bookingStatus`. The seal moves only after the parent passes a new stored status.

A changed trip id, or disappearance of the pending item, bumps the generation during render. A late `finishBooking` then does nothing. Unmount is the real React instance: the mounted harness unmounts and remounts, and the old completion does not mark the new instance.

Manual rental uses the same ownership idea for its own form. All ten controls and the submit button disable while that save is pending. Duplicate `requestSubmit` sends one payload. Errors and throws keep the typed values. Success resets only that form to the existing empty start values and shows “Der Mietwagen ist als Nutzerangabe gespeichert – nicht als Providerbestätigung.” Place ids, prices, currency, day, and stage stay null. Names are not trimmed or turned into place ids. Focus returns to the rental submit button only when focus is already on the document body and the save is still the owned one. Booking completion does not move focus, so an open flight-route or stay-interval field keeps it.

The mobility tab row now wraps inside the viewport at 200% text. That edit is above `ManuelleVerbindung`. The connection function itself is unchanged. Its regression still locks the draft, rejects a duplicate submit, keeps values on error and throw, and clears only the connection number and note on success.

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

Executed on the runtime tree unless noted:

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

- Full `npm test` (the whole `lib/**/*.test.ts` script). Not run this session.
- Exact-head App/Auth CI and Vercel Preview for this head. The earlier seed Preview is not evidence for this head.
- Hosted account, guest storage, provider calls, physical devices, and screen readers.
- Personal browser. #748 stays suspended. The browser proof is headless Chrome on an isolated local page.

## Stub boundary

Callbacks resolve in memory. The harness aborts every request that is not GET `/`, `/harness.js`, or `/style.css`. Nothing was written to an account, guest store, or provider.

## Truth, privacy, security, cost

Stored booking status remains the seal. UI success does not invent a provider confirmation. Thrown errors are not shown. No new storage, server, Auth, DB, dependency, or paid call. No new ongoing cost.

## Residuals

- P0: none.
- P1: none.
- P2: at 320px and 200% root font-size, one input inside byte-identical `ManuelleVerbindung` has a box from x=82 to x=367 (`scrollWidth` 367). Owned surfaces do not overflow. Fixing that input would edit the R103 function or global CSS, which this lane must not do.
- P3: bundled Playwright Chromium was missing; proof used installed Chrome. The active booking button uses `aria-disabled` rather than the `disabled` attribute so keyboard focus is not pushed to the next control. A second activation is refused by the synchronous claim.
