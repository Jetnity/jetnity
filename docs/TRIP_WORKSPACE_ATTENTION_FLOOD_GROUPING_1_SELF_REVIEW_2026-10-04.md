# Trip Workspace Attention Flood Grouping 1 — Writer Self-Review

4 October 2026. Writer **Jetnity Trip Workspace attention flood grouping 1**, Generation 1.
Issue #830 / Draft PR #831. **This is not an independent Technical-Lead PASS.**

## Checks against the binding task

| Invariant / attack | Writer result |
| --- | --- |
| Canonical loss or mutation | `attention.ts` unchanged; real 64-point derivation and frozen-input/deep-equality tests preserve all IDs, fields and references |
| Different signal/severity/state/title/level | Each independently tested difference creates a separate group |
| Different action target or null | Separate groups; equal art/bereich values group regardless of object identity/property order |
| ID-based inference | IDs absent from grouping key; no parsing; unrelated opaque IDs may group solely by presentation fields |
| Distinct item/date mismatch titles | Three different item/date titles remain three groups; existing protected item-date tests pass |
| Coverage hidden by generic flood | Actual canonical fixture retains blocker and both concrete gaps before the 64-member group |
| Size changes priority | No new sort; Map first insertion fixes earliest-member position, including non-contiguous members |
| Raw visible prefix incorrectly grouped | UI projects the complete canonical list before applying numeric visible capacity |
| Incorrect “weitere” count | Count refers explicitly to additional presentation groups; unit/SSR and browser proof |
| Expansion recreates 64 titles | Browser and renderer show one Official title; expansion adds one missing distinct group |
| Action fans out over members | Only representative action is wired; real browser click records exactly one callback |
| Inaccessible group disclosure | No member disclosure added; existing native expansion button works with Tab/Enter/Space and reflects aria-expanded |
| Opaque IDs exposed as labels | Visible text checked; existing data attributes remain technical metadata only |
| Empty/singleton regressions | Render tests retain empty-state text and singleton action without a count suffix |
| Layout regressions | Real component + repository CSS inspected at mobile/desktop sizes; no horizontal overflow; screenshots reviewed |
| Scope creep | Only two allowed production files; no domain derivation changes; one new presentation test file |

## Deliberate choices and limits

- Count-only groups are intentional. The current canonical point contains no readable person/destination/member context; inventing labels from its ID would violate the task.
- `attention.sichtbar.length` supplies the current presentation capacity, including caller-selected limits. Canonical `sichtbar` and `weitere` retain raw-point semantics for all existing consumers/tests.
- The helper's action tuple is exact for the current `AttentionAktion` contract (`art`, `bereich`). A future richer action union must explicitly extend this projection and its tests; this slice introduces no such union.
- Canonical sort is untouched. The projection assumes already ordered canonical input and deliberately does not use member count, severity re-sorting or invented priority.
- UI tests use real rendering and a separate real-browser synthetic component harness. They do not establish account-backed end-to-end behavior, new Official Truth data, physical-device or screen-reader certification.
- Existing compact row layout wraps heavily at 320 px with 200% root text. It remains within width, and the expanded four-group fixture stays below the duplicate-wall size. This slice does not redesign row layout or address U06's existing accessible status tokens.

## Verification outcome

102 focused tests PASS. Full suite 5,231/5,231 PASS in a disposable network-disabled Linux/PostgreSQL-16 container using unchanged repository tests and byte-identical package files. Native macOS lacked the hardcoded PostgreSQL path for three existing tests; container transfer issues were repaired without source changes. Typecheck, lint (0 errors, 149 warnings), all required guards/hygiene checks and local production build PASS. No results from the failed environment attempts are represented as passes.

Task SHA-256 remains `b0ba5d2f0e9b226d3807c214efa15d3231edaa8ebff2bc2075f4fa08b0323801`. Startup/pre-delivery live reads show unchanged baseline and the commissioned Draft writer. Model evidence comes directly from Codex session metadata: `gpt-6-astra`, `xhigh`, session `01a108b6-a48e-7dd1-849c-59497b5709d5`. No additional writer was started.

No known bounded implementation defect remains from this self-review. Exact pushed-head CI/Preview and independent review remain separate acceptance evidence. No Production/hosted DB/provider operation or new cost is introduced.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Keep Draft; no Ready, merge or follow-up.
