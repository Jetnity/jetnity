# R107-T handoff — 2026-10-25

Stop for independent Technical-Lead candidate review. Do not Ready, do not merge, do not close #1012, do not write `main`, and do not start a sibling or a follow-up task.

## Identity

- Agent: Jetnity Trip Traveller Snapshot Workflow Completion 1 — Cursor Generation 1
- Session: https://cursor.com/agents/bc-5d06d92d-a371-4889-b29c-f03a9b6c85d0
- Runtime: `grok-4.7-high-fast`
- Branch: `feat/r107-trip-traveller-snapshot-workflow-1`
- Draft PR: #1017
- Tracking: #1012, batch #1011

## Heads

- TASK blob: `75c59b0851d835560ff4b5562e9fcc52c395b2ad`
- Authorized plan head: `781cd373fdd3fe6135039751dc8199bbb573b451`
- Plan blob: `252ae82c9cf1aff34f7f46e16999d50178369dff`
- RED head: `318fd50821be3c83aa8ec7182ad2e6cd3a4c9dec`
- First GREEN head: `27102ebae649ceaaab5866a0df6db84f570c507a` (residence Enter only)
- Earlier implementation head: `00ba5b9124abf1cafe26b711d50b4527f40e70a5`
- Earlier implementation tree: `a8d9f7f938382623622f3adf5bb3500f5fd519ef`
- Reviewed candidate this correction answers: `b443fb13db1e97e0d0d85d51814046349fd7491b`, tree `9518d8f4f73c205cfc033ea06de3667d7dc48626`
- Card correction commit: `a68e6b4a3690decb4b7f21373aa53e86c5f008d1`
- Card correction tree: `4f2165518fdea569afbb63d45efaef13409c276b`
- Addendum commit: `c589266158a4d15f90a952e370435150e45f41d7`
- Addendum tree: `55970376c0e8c08b0bc79610854fc4898355673a`
- Focus correction commit: `6e3ec8b5910cf39f342844b2ccc5198f5a4617b2`
- Focus correction tree: `8975beab7ef622a18002692c3435527375b8c8b7`
- Match-claim correction commit: `669f8ec80324583adaec6dc21d5caf6d23e11c84`
- Match-claim correction tree: `e0b8ffcbecdbc01d64686ec886140a1c1ee79437`
- `origin/main` fetched for this handoff: `a74c443c6be3f064f150fcf021ab6154bda325e5`
- Merge-base: `a74c443c6be3f064f150fcf021ab6154bda325e5`
- No rebase. If `main` moves later, report the drift and wait.

`origin/main` fetched again for this receipt is still `a74c443c6be3f064f150fcf021ab6154bda325e5`. Before this documentation commit the branch was **19 ahead / 0 behind**. This commit adds documentation only. The pushed tip is the review head. No rebase.

The handoff at `736edb9f900645137c6947f8de194171d3757c95` recorded only the two card corrections. It is not the current receipt.

## Current packet

Review R1, both later addenda, and the later match-claim correction are on this tip. Product behavior is commit `669f8ec80324583adaec6dc21d5caf6d23e11c84`, tree `e0b8ffcbecdbc01d64686ec886140a1c1ee79437`. The mounted log is bound to that tree.

1. Newer draft during a held save, commit `a68e6b4a3690decb4b7f21373aa53e86c5f008d1`. When the pending intent is no longer the operation for that draft generation, occupancy is released and a newer intent such as removal confirmation stays. When that same intent is still pending and the draft generation has moved, an entered null becomes idle and says the previous save was accepted and the later edits are not repeated. A writer that was not entered becomes `not_sent`. An entered non-null becomes `unproven`. The original payload is not sent again, and that stale accept does not refresh.

2. Matching readback, same commit. The submitted fingerprint is recognized only while the draft generation is still that submission. The draft is not rebuilt, so the citizenship UUID and passport relation stay. A later matching graph can be shown as consistent. A later edit drops that claim. A different graph conflicts. The match is an observation, not an exactly-once receipt.

3. Registry uncertainty, commit `c589266158a4d15f90a952e370435150e45f41d7`. `unaufgeloest` stays on that registry source through cancel and a section return. Unknown, then another request, then cancel, then another request still shows both “Das Ergebnis dieser Übernahme ist nicht bekannt. Sie wird nicht von selbst wiederholt.” and “Eine erneute Übernahme kann einen weiteren Snapshot erzeugen, falls die vorherige angekommen ist.” before confirm. Confirm is a new writer call. A later accepted confirm does not claim the first attempt was absent.

4. T-EX2, same commit, only the test “account forwards arrays losslessly on repeated renders; existing mutation callbacks refresh” in `lib/readiness/trip-official-evaluations-server.test.ts`. The removal writer returns null and the refresh count stays 0. `onReadinessAktualisieren` raises it to 1 and returns `{ art: 'props' }`. The accommodation callback raises it to 2. Invalidations stay 2. The write payloads stay the removal and the accommodation pair. Every other assertion in that file stays. Native App job 121237625987 on superseded `b443fb13` was the old expected 2 / actual 1 failure. That assertion is retargeted under the root authorization. It is not waived and it is not disabled. T-EX1 remains the four helper assertions.

5. Owned one-refresh proof, same mounted command, test “each accepted save, removal and intake requests one refresh”, `art: 'konto'`. `window.__ROUTER_REFRESH__` reaches 1 after save, 2 after removal, and 3 after intake. The Konto call list has one `travellerSetzen`, one `travellerEntfernen`, and one `registryTravellerInReiseUebernehmen`. The stubbed unit test is not the only wiring evidence.

6. Focus ownership, commit `6e3ec8b5`. A trusted focus calls `interaktion`. Completion keeps the status request only when that interaction is still current and the active element is still that card, or body after the disabled save button releases focus. The effect follows the request and the phase, then clears the request. A pointer click on the second card’s residence country search, with the value left empty, keeps that input. Tab from “Weitere Staatsbürgerschaft” into that search does the same. A save with no further move focuses the accepted status paragraph. Escape still focuses “Angaben entfernen”. The hold uses the account matrix host because Konto’s product writer returns null immediately. The cards are the Workspace cards.

7. Later canonical change, commit `669f8ec8`. Save FR, then a matching FR graph, becomes consistent. A later DE graph with no user edit replaces the draft cleanly: residence DE, dirty false, conflict false. The current-match sentence goes away. The earlier save stays accepted, so “Die Angaben wurden zum Speichern angenommen.” remains. The payload stays the one FR write. Refresh stays 1. No replay and no conflict warning.

Mounted command on tree `e0b8ffcb`: 22 pass, 0 fail, exit 0. Node v22.23.4, Playwright 1.55.0. `npm test` on that product pass exits 1: 7181 tests, 7165 pass, 11 fail, 5 skipped. All 11 failures are missing local PostgreSQL 16 binaries. `npm run typecheck`, the five hygiene checks, and `npm run build` exit 0. `npx eslint .` exits 0 with 0 errors and 181 warnings.

## Next step

Independent exact-head re-gate of the pushed tip. P1, the product relation-loss on a residence-only edit, stays OPEN. Draft remains. No Ready, no merge, no main sync, no sibling integration, no tracking close.

Holds that remain: #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, Bern #934. No Production DB, Auth, AAL, RLS, secret, provider, payment, legal, or launch action is authorized by this delivery.
