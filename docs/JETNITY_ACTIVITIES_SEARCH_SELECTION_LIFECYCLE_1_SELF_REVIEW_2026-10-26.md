# R108-A — Activities Search and Selection Lifecycle 1 — SELF_REVIEW

Date: 26 October 2026.

Author: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast`.

**This note is not a Technical-Lead PASS.**

Reviewed idle-path base, not the review head: `d8f89dc4df3c7dc571a88e9ca0930a6c1cec186f`.  
Superseded snapshot runtime and its docs: `79a109615857940812b05b5d99a1041b8d76750f`, `5202613afa0c82de291579a629193bae4cd9f497`.  
Supplemental review head, historical: `0bd3ddd1b67e487aca1c96022f1d5753cd6ee10d`.  
R2 delivery, historical: `05d6f934beefc5c174794905a775e8655257ecc3`.  
Rejected head: `8224f7ce061ac2dea85dc781594f3493af732502`.  
Runtime head checked by the author: `3c24d85509ace94bc6f69ecbef6b333ec0c2d611`.  
Tree: `9c13f157b07fc32ccfd72398020af323591f5bc9`.  
Main / merge-base: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`.  
Relation at that runtime head: 16 ahead / 0 behind. The review head is the documentation commit that contains this file.

## Remaining R2, with the earlier corrections kept

- F1: `optionSchreibIdentitaet` is `JSON.stringify(alsActivityMomentaufnahme(option, dayDate))`. The frozen mapper is not edited. The focused test parses both fixtures through `activitySucheAntwortLesen`, compares the snapshots, renders `AktivitaetKarte` with `renderToStaticMarkup`, and checks the register. Rating 9.01 and 9.02 with count 100 produce one snapshot, one card, and a second claim is rejected while pending, after `null`, and while unconfirmed. A null rating with count 100 and 101 does the same. A present rating with count 101 changes the stored note and is a different operation. The raw card key still differs, so a stale handler for 9.01 does not send when 9.02 is the visible result.
- F3: `aktionSichern`, `aktionAlt`, and `aktion` return `{ ok: false, grund: 'fehlt' }` when no callable exists. They no longer store or call null. `freigeben(id)` returns the same failure when that resolver is absent and leaves every other waiter pending. A no-id release of an empty map fails the same way. The mounted lifecycle requires `ok: true` on every expected direct probe and expected release, including the never-dispatched handler. A missing id is an explicit failure, before the real settlement, for both the accepted and the unconfirmed idle witnesses. A captured handler that the content check rejects is therefore distinct from a probe that never ran, and a missing settlement is distinct from a notice that stayed absent.
- F4 card path remains. An older `null` or empty-string settlement does not appear on a newer pending card. The newer claim stays held.
- F4 idle path: when `karten === null`, each same-day notice is prefixed with the sanitized title and captured time. The mounted witness starts A, changes travellers and starts B, changes travellers again so the surface is idle with no third search, then settles only A. The status includes the named activity and does not start with the bare gemeldet or unconfirmed sentence. B stays disabled. Returning to B and searching again does not add a callback. The same shape covers `null` and the empty string. An unconfirmed guest insert clears the heading and leaves the named idle notice.
- F2 remains. Present invalid active text is non-actionable. Ignored AbortSignal, synchronous throw, and empty string remain covered.

## Checked on the runtime head

Node `v22.23.4`.

- Focused tests: 23 pass, exit 0.
- `npm run audit:activities`: 188 combinations, 0 failures, exit 0. Lifecycle viewports each recorded 38 explicit searches. WebKit and Chromium.
- Typecheck, full lint (0 errors, 180 existing warnings), production build, and the five hygiene checks: exit 0.

## Not claimed

- `null` does not prove the trip row changed.
- Abort and unmount do not cancel a writer that already entered.
- The register does not cover other tabs.
- The idle notice names the captured activity and time. Identical full lines are shown once. It is not a new provenance model.
- A rating count that the writer stores in the note is a different operation. The card does not display that count.
- Description, coordinates, categories, tags, and the client option id stay outside the lock because they stay outside the writer snapshot. They still participate in the stale-handler check.
- Traveller count stays a search-context fact already present in the request. This slice does not collect documents or infer ages.
- The audit is synthetic. It is not a provider or certification result.
- Native CI and Preview on the review head were not observed in this session.
- Two existing `react-hooks/set-state-in-effect` warnings remain. They were not drive-by fixed.

STOP for independent exact-head Technical-Lead review.
