# Trip Workspace Manual Flight Route Completion 1 — Self Review

Date: 5 October 2026 · Issue #836 · Draft PR #837
Implementation reviewed: `9fea3e8284d6d291b809ebc5a9deafaafad25d40`
Reviewer: the same Generation-1 Codex Desktop writer (`gpt-6-astra`, `xhigh`). **Not an independent TL review.**

## Contract review

| Boundary | Review and evidence |
| --- | --- |
| Scope | Eight permitted runtime files, one test file, three delivery docs; immutable task retained. No parallel-writer file changes. |
| Manual-only | Shared predicate rejects any non-null identity and non-flight kind; UI, account pre-read, guarded UPDATE and guest all use the boundary. Booking status/source alone does not block. |
| Input | Strict root and six-field segments; bounded IATA length, 1–4 array, trim/uppercase, real dates, exact optional times, endpoint/continuity/chronology checks. Injection rejected before account auth. |
| Account airport authority | Actual existing airport resolver called once for distinct IATAs; every code required. Reference-only canonical country/city data; no client surface evidence. |
| Narrow mutation | Five UPDATE columns only; unrelated metadata retained. No booking/commercial/day/stage/position/title/note changes. Missing update row and provider/kind/metadata races fail. |
| Auth/errors | Existing `konto()` and RLS; no service role. Sanitized read/write/transport failures, no failure revalidation. No schema or trigger changes. |
| Guest | Exactly one target across both collections; only route/schedule patch; existing persistence/schema validation. Country/city fields null, siblings preserved. |
| Route facts | Existing canonicalizer/readers/chronology unchanged; account fixtures yield reference-backed country facts; guest and ambiguous cycles do not fabricate them. |
| UI/React | Editor declared at module scope; immutable functional updates, interaction work in handlers, one effect for input focus, ref blocks duplicate save. Labels, alerts/status, pending states, explicit controls and separate booking. |
| Keyboard/mobile | Browser demonstrated Enter/open/add/remove/save, Escape/cancel and focus return; 280/320/390/768/1280 widths have no document/body overflow. |

## Corrections made during review

1. Corrected the typed nonstandard booking-source fixture; final typecheck succeeds.
2. Browser identified focus loss after removing segment four because Add was disabled before commit. Deferred focus now targets the re-enabled Add button; repeat browser proof passes.
3. Empty but structurally parseable itineraries with no airport codes show **Flugroute ergänzen**; a regression assertion covers this case.
4. Guarded legacy multi-leg/greater-than-four routes against silent truncation and tested refusal.
5. Added metadata compare-and-set and a concurrent-metadata regression case to prevent unrelated metadata loss between read and write.

## Limits, not waived gates

- Local full suite: **5,246 PASS / 4 FAIL**, not a global PASS. All four failures are unchanged disposable-PostgreSQL tests with `initdb ENOENT` at a hard-coded Linux path. No test was bypassed; final-head Linux CI remains an independent gate.
- Account proof executes the real action and airport reader with mocked auth/DB transport. There was no hosted account save, RLS exercise or DB trigger execution by this writer.
- Native browser verification used Chrome on macOS at multiple widths. It is not a claim of a physical iOS/Android or WebKit acceptance pass.
- Local calendar comparisons implement the binding input/item contract; no timezone or date-line inference was added. Existing general route chronology remains the authority for derived facts.
- Local guest updates retain the existing persistence/concurrency model; this slice does not introduce a cross-tab transaction system.
- Build/browser used dummy loopback Supabase configuration. No hosted/Production mutation, provider call, secret use or migration apply occurred.

No remaining implementation defect was found within this review's tested scope. That statement does not replace independent review or the missing local PostgreSQL proof. REPORT and HANDOFF preserve the exact validation limitation and the final-head identification procedure.

**Remain Draft. STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
