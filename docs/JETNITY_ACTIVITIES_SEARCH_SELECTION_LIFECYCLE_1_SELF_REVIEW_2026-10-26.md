# R108-A — Activities Search and Selection Lifecycle 1 — SELF_REVIEW

Date: 26 October 2026.

Author: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast`.

**This note is not a Technical-Lead PASS.**

Rejected head: `8224f7ce061ac2dea85dc781594f3493af732502`.  
Intermediate runtime, not accepted: `055055ac6b998693d30c9a8829aba8b7827c8ab2`.  
Runtime head checked by the author: `8adbb10c46acf6d7ca811d721e188026c5203a31`.  
Tree: `4d804ff1be4b947427522a2ca917a0d4116ada61`.  
Main / merge-base: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`.  
Relation at that head: 8 ahead / 0 behind. The review head is the documentation commit that contains this file.

## Supplemental R1

- F1: the operation key no longer includes epoch, generation, labels, reasons, or konflikt. The focused test runs the frozen anreichern → ranking → client pipeline: the same provider option and 15:00–16:30 timeslot, first beside a 09:00–11:00 window and then with the adopted window added, changes only labels, reasons, and konflikt from frei to ueberschneidung. Both visible options produce the same `alsActivityMomentaufnahme`. A second claim is rejected while pending, after `null`, and while unconfirmed. Releasing an accepted key is a no-op. A different title, externalRef, price, timeslot, trip, or day is a different operation and can be claimed beside the locked one. A stale generation or a stale full card still cannot send, even when the operation key matches.
- F2: preserved. `message: {}`, `coverageNote: 123`, and a 501-character message on an otherwise valid active body return `invalid` with no options and no raw field. Partial with zero options stays partial. HTTP 200 `error` with options stays non-actionable. AbortError from `res.json()` rejects.
- F3: the mounted WebKit and Chromium lifecycle captures a never-dispatched handler, renders a reused option id with different content, invokes the old handler for zero callbacks and no substitution, then sends the current unclaimed card once. The guest seam inserts the selected activity item, keeps an existing 09:00–11:00 window, and re-searches the same snapshot after the ranking fields change. That stays one writer call while pending, after `null`, and while unconfirmed. “Erneut anbieten” does not write. Leaving for Flüge keeps that exact control as `document.activeElement`, with the activity workspace hidden and inert and the old message absent from the visible page. Independent cases use distinct synthetic provider, externalRef, timeslot, and price. Ignored AbortSignal, synchronous throw, and empty string remain covered.

## Checked on the runtime head

- Focused tests: 21 pass, exit 0.
- `npm run audit:activities`: 188 combinations, 0 failures, exit 0. Lifecycle viewports each recorded 28 explicit searches.
- Typecheck, full lint (0 errors, 180 existing warnings), production build, and the five hygiene checks: exit 0.

## Not claimed

- `null` does not prove the trip row changed.
- Abort and unmount do not cancel a writer that already entered.
- The register does not cover other tabs.
- Description, coordinates, categories, tags, and the client option id are outside the local lock because they are outside the writer snapshot. They still participate in the stale-handler check through the full visible card.
- The audit is synthetic. It is not a provider or certification result.
- Native CI and Preview on the review head were not observed in this session.
- Two existing `react-hooks/set-state-in-effect` warnings remain. They were not drive-by fixed.

STOP for independent exact-head Technical-Lead review.
