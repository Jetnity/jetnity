# R108-A — Activities Search and Selection Lifecycle 1 — SELF_REVIEW

Date: 26 October 2026.

Author: **Jetnity Activities Search and Selection Lifecycle 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-0c04bed6-dbf2-41ff-853c-2b5509df4be3  
Model: `grok-4.7-high-fast`.

**This note is not a Technical-Lead PASS.**

Runtime head reviewed by the author: `728235723a4ceb606e6a610765f43fa4254e10d5`.  
Tree: `909c1ba9099caadd986061552e93c497eeb5b87b`.  
Main / merge-base: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`.  
Relation at that head: 3 ahead / 0 behind. The review head is the documentation commit that contains this file.

## Checked

- Search dispatch is explicit. Same-tick duplicates return the current loading run.
- Context changes clear the visible response during render and ignore a late payload whose epoch or generation does not match, including when the caller does not observe `AbortSignal`.
- Adoption claims the captured content before the callback. `finally` releases only that key. A reused id with different content is not sent.
- `null`, a bounded string, a throw, a rejection, and a non-string fulfillment use the honest notice. The string path still says the outcome is unconfirmed.
- A newer search on the same day hides the older notice. Another day does not show it. Unmount does not replay it.
- Client parsing drops unknown and secret fields, refuses non-2xx success shapes, and keeps partial, empty, unavailable, and rate-limited meanings.
- The card says “Preisangabe”.
- Mounted audit on that head: 188 combinations, 0 failures, exit 0. Layout and keyboard coverage remain. Lifecycle covers 390 and 1280 in WebKit and Chromium at 20 px root font.
- Typecheck, lint (0 errors), production build, and the five hygiene checks exited 0 on that head.

## Not claimed

- The callback return does not prove a trip row was written or was not written.
- Abort does not cancel a writer that already entered.
- The in-memory register does not serialize other tabs. After unmount it is gone.
- There is no exactly-once guarantee.
- The audit uses synthetic fixtures. It is not a provider, sandbox, or certification result.
- Native CI and Preview on the review head were not observed in this session.
- ESLint still reports 180 existing warnings, including two `react-hooks/set-state-in-effect` warnings in the activity surface and the audit client. They were not drive-by fixed.
- `check:schema-bezug` still prints older `LOCAL/UNAPPLIED` RPC notes.

## Boundary

No frozen parent, schema, factory, proof, package, CI, or ruleset edit. No Viator work. Production hard-off remains. No cost change.

STOP for independent exact-head Technical-Lead review.
