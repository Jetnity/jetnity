# Organisieren Action Recovery 1 — STATUS

Date: 24 October 2026
Author: **Jetnity Organisieren Action Recovery 1 — Cursor Generation 1**
State: I1 integration with accepted main 07016 is committed. Draft. Ready, merge, and tracking-issue closure stay with the Technical Lead.

- Session: `bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa`
- https://cursor.com/agents/bc-9156e555-e2b3-4e47-9b8a-1bfa65fc2bfa
- Model: `grok-4.7-high-fast`
- Branch: `fix/organisieren-action-recovery-1`
- Issue #992, Draft PR #995
- Accepted main: `07016ada86dcfc79d5c7c3efa9ba1d62336a1f60`. Historical lane base: `913cf9353fd33491d2bd3130b3c430cc88990200`.
- Merge-base with accepted main: `07016ada86dcfc79d5c7c3efa9ba1d62336a1f60`. Behind: 0.
- I1 merge commit: `84e7fae065da1abc6765828049ec2b9d8273597f`. Parents: reviewed head `d27dee9a3796cb1d7a3eb7fc7ea846946e442ed5` and accepted main `07016ada86dcfc79d5c7c3efa9ba1d62336a1f60`. Merge tree before this docs commit: `09d3daf91b13fb6848d7ebcd0c54c102361b98ad`.
- Ahead of accepted main before this docs commit: 7. Exact final HEAD is recorded in the PR comment.
- Plan commit: `a1093d53feebe9586b0351ade1ab786d95230bb5`
- Reviewed R1 head: `d27dee9a3796cb1d7a3eb7fc7ea846946e442ed5`
- R1 runtime/proof commit: `143b4976c221eab56a35a872ae0d54f32e69174d`
- TASK V1 blob `6db7bbecc3eaecc744569bbe74951342ff7f778e` unchanged.
- Mode NORMAL. Traveller context is not relevant: no citizenship, document, or visa inference.

## What landed

Booking status for flight, stay, connection, and rental now shares one local lifecycle. A second click in the same inventory does not call the callback. Domain error, rejection, and throw clear the busy state and show a fixed message. Success does not flip the seal; the parent trip remains the booking truth. Trip change, item disappearance, and unmount drop ownership so a late completion cannot write into the next context.

Manual rental locks its ten controls for the owned save. Errors keep the values. Success resets only that form and keeps the Nutzerangabe sentence. A trip change does not clear a newer draft.

`ManuelleVerbindung` stays byte-identical (`10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360`).

## R1 disposition

Owned booking buttons now use one block-level class, `BUCHUNG_AKTION_KLASSE`, on every assigned and unassigned path. The label wraps inside the button. At 320px and root font-size 32px, DOM Range rects sit inside the button border box for idle, pending, recovered, and domain-error labels (`maxExcess` 0). Lifecycle behavior is unchanged. The connection-form overflow and the rental auto-focus P3 are unchanged disclosures.

## I1 disposition

Accepted main `07016ada` merged with a normal merge commit. No rebase, force, or cherry-pick. No textual conflict. Reviewed C runtime blobs are unchanged: FlugBestand `32e7582cade127610a8d264c87733bd93bbf9b1c`, UnterkunftBestand `18e379f5b9b798ca65aa20b2a0629d51523cc085`, MobilitaetBereich `eac9ae0cff6999d4167a1d1e151bbac9ba4a0ba6`, MietwagenBereich `67cc0cbbf25df52770a916b29c2728f177f356fa`, useBookingActionLifecycle `f59a4a25014c9aa17505b4386fd39a45f54ee270`. Accepted A and B files stay as merged. Protected functions match: ManuelleFlugRoute `c3fb5c1f7cf8d82d0a5a4efbff10a329557040a741139d375728f8ba19047498`, UnterkunftZeitraum `17a670b3a1d4a2a8f57e6194387111c9f331360c916374915925a371e133e094`, ManuelleVerbindung `10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360`.

Integrated focused run, Node v22.23.4: 109 tests, 13 suites, 109 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo. Mounted harness PASS, Chrome 148.0.7778.96, ten text-bound stages, `maxExcess` 0. The evidence JSON stayed byte-identical to the reviewed R1 proof. `tsc` exit 0. Lint exit 0, 144 warnings, 0 errors. Setup, operating-mode, api-schutz, schema, dead, exports, and deps exit 0. `npm run build` exit 0.

## Next step

Independent Technical-Lead exact-head review of the integrated head. This session does not mark Ready, merge, or start a follow-up. Tracking issue 992 stays open for Technical-Lead post-merge acceptance.
