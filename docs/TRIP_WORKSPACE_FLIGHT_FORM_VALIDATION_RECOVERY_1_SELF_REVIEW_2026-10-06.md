# Trip Workspace flight form validation recovery 1 — Self-review

Date: 6 October 2026 · Issue #875 · Draft PR #879
Classification: **TRIP_WORKSPACE_FLIGHT_FORM_VALIDATION_RECOVERY_READY**

This is the implementation writer's self-review, not independent Technical-Lead PASS.

| Requirement / risk | Evidence |
| --- | --- |
| Schema remains exact | No schema diff; actual `flugRouteManuellSchema` is used for submit and correction state |
| One bad field no longer invalidates all inputs | Dedicated four-segment test asserts exactly one invalid input out of 24; all six field-specific cases assert only their field |
| Error ownership follows actual paths | Only exact known input paths enter the map; current cross-segment refinements retain the one supplied path; root/array paths stay summary-only |
| Safe and accessible error text | Summary uses `ersteMeldung`; field text comes from the unchanged schema, rendered as React text; own IDs, labels, alert roles, descriptions, danger/surface tokens and decorative icon |
| First-error recovery | Post-commit effect targets first invalid input in DOM order; test reverses Zod issue order relative to DOM; retry counter re-focuses on repeated rejection |
| Summary-only recovery | Actual root/array Zod errors at test-only parser seam; zero invalid inputs, focusable/announced summary, form description |
| Correction recovery | Validation derives from current draft; corrected input/description clears before resubmit; no focus theft or silent draft normalization |
| Cross-field correction | Updating previous destination or connection departure time clears the schema-addressed downstream field error |
| Add/remove/index stability | Bounds and button focus unchanged; error map recomputes after removal and re-addition; no hidden continuity repair |
| Zero invalid writes / exactly one valid write | Rejection stays before callback; four-segment async duplicate/Escape guard plus unchanged 51-test manual-flight suite |
| Success, exceptions, Escape and reopen | Existing safe async behavior remains; new trigger/initial focus/reset tests and original success/error tests PASS |
| Parallel ownership | Only editor, new dedicated test and three authorized documents changed after TASK seed; readback, coverage and shared tests unchanged |

Validation: 84/84 focused tests PASS (16 new, 51 existing manual-flight, 17 coverage/route); no skips. New final suite against unchanged component: expected 14 failures / 2 passes. Typecheck, lint (0 errors / 145 existing warnings), operating-mode, five hygiene checks, fresh local production build and `git diff --check` PASS. The original sandbox build/cache failure is disclosed in REPORT.

No browser/real-device/screen-reader speech or hosted Account E2E evidence is claimed. No full-suite green or earlier CI/Preview result is presented as final-head evidence. The TASK permits the deterministic React/event harness and makes the browser check optional.

Unresolved findings within this slice: **P0 0 / P1 0 / P2 0 / P3 0**. Unrelated #871 findings are not closed by this classification. No DB/schema migration, provider, Official Truth/F8, global continuity or recurring cost change.

TASK remains `0eff8d0fb2d3dc8c316500a410326e1880afbd43`. Final exact head and fresh remote graph are resolved after commit/push in the STOP receipt. Session `01a111cd-eb31-7b71-94d9-e9f6b5643b73`; model `gpt-6-astra` / `xhigh`, verified from persisted turn context rather than inferred from a UI label.

Keep Draft; no Ready, merge or follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
