# Trip Workspace flight form validation recovery 1 — Report

Date: 6 October 2026 · Issue #875 · Draft PR #879
Classification: **TRIP_WORKSPACE_FLIGHT_FORM_VALIDATION_RECOVERY_READY**
Status: implementation delivered for independent exact-head review; no Ready/merge authority.

## Provenance and scope

- Branch: `fix/trip-workspace-flight-form-validation-recovery-1`.
- Live remote main and merge-base at delivery preparation: `b16a250b95715418c125a92a2d407ba2ec3f89fa`.
- Starting remote head: `7761390747e3d8dc929c60125633c245f5a5d481` (TASK seed, 1 ahead / 0 behind).
- Immutable TASK: `docs/TRIP_WORKSPACE_FLIGHT_FORM_VALIDATION_RECOVERY_1_TASK_2026-10-06.md`, blob `0eff8d0fb2d3dc8c316500a410326e1880afbd43`.
- Live main/mode (`NORMAL`), #751, #875/#879, #871 F-04, TASK, editor, actual schema paths and existing error/focus contracts were read before implementation. Historical Cursor directives are superseded by the current Codex execution directive.
- Final pushed SHA and fresh graph/Draft readback are in the delivery STOP receipt; this document does not claim to contain its own commit hash.

Only `components/trips/FlugBestand.tsx` changes at runtime. The new dedicated `lib/trips/flug-route-form-validation.test.ts` and this slice's REPORT/HANDOFF/SELF_REVIEW are added. The TASK remains byte-identical. No shared manual-flight test, `FlugRoute.tsx`, schema, coverage, persistence, provider, DB/Supabase, Official Truth/F8 or global continuity file changes.

## Result

The editor derives invalid fields from the current `flugRouteManuellSchema` result after a rejected submit. Only exact `segments / index / known input name` paths create field errors. Corrections and segment addition/removal recompute these errors from the current draft, without changing its values or persisting anything.

Each invalid input has its own labelled error text, `aria-invalid`, `aria-describedby`, existing danger/surface tokens and decorative icon. The summary preserves `ersteMeldung(...)`. Pathless, array-level or other non-input issues never expand into a blanket field-invalid flag.

The existing schema explicitly places continuity issues on the later `origin`, and connection chronology issues on the later `departureDate`. Those exact paths are honored; no error is inferred for other inputs. Errors without an input path remain in the form summary. Neither interpretation repairs the route automatically.

A rejected-submit counter triggers focus after React commits the error DOM. The first invalid input is selected in DOM order, independently of Zod's issue order. With no invalid input, the focusable form summary receives focus and has `role="alert"`. Repeating the same rejected submit focuses again; ordinary corrections do not trigger focus. Field messages announce their own errors, so the summary does not duplicate their alert role.

The existing valid-submit payload, synchronous in-flight write guard, safe async failure handling, success status, Escape/trigger focus, add/remove behavior and 1–4 segment bounds remain intact.

## Executed checks

| Check | Result |
| --- | --- |
| `npm ci --offline --no-audit --no-fund` | PASS, 530 packages; lockfile unchanged |
| Dedicated validation test | 16/16 PASS, no skips |
| Existing `lib/trips/flug-manuell.test.ts` | 51/51 PASS, unchanged |
| Combined focused command below | 84/84 PASS, 8 suites, no failures/cancellations/skips |
| Final new tests against the unchanged seed component | Expected RED: 14 failures / 2 passes; corrected source restored before final 84/84 run |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors / 145 pre-existing warnings; none in changed source/test |
| `check:operating-mode` | PASS |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | All PASS |
| `NEXT_TELEMETRY_DISABLED=1 npx next build` | PASS with fresh `.next` and permitted local process/port access; 25/25 static pages |
| `git diff --check` | PASS |
| TASK / excluded runtime and shared-test comparison | Unchanged |

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/trips/flug-route-form-validation.test.ts \
  lib/trips/flug-manuell.test.ts \
  lib/trips/flug-abdeckung.test.ts \
  lib/route/r15-flugoption.test.ts
```

The first build was blocked by sandbox port binding. A retry reused that cached Turbopack error. Moving the generated `.next` directory aside and rebuilding with the required local process rights passed. No source/configuration workaround was made. Existing Browserslist age warning remains.

## Accessibility and focus evidence

The dedicated deterministic React/event harness executes the actual component and real Zod schema, attaches host refs before dependency-aware effects, and records focus calls. It verifies:

- one missing first IATA among four segments: exactly 1 of 24 inputs invalid, first input focused, all input values unchanged, zero callbacks;
- correction removes that input's error/association immediately; lowercase draft text stays lowercase until the existing valid-submit normalization;
- multiple errors follow DOM order even when Zod emits a later input first; correcting the first error makes the next rejected submit focus the next error;
- all six field types have their own error association and label, with valid siblings unmarked;
- continuity/chronology only mark the exact existing schema paths, and upstream corrections recompute downstream errors;
- root/array-only errors focus the announced summary and mark zero inputs;
- add/remove shifts error paths correctly, keeps bounds/focus and does not repair continuity;
- valid four-segment route calls persistence exactly once, duplicate submit and Escape during an in-flight write remain guarded;
- invalid route calls persistence zero times, and Escape/reopen clears validation state.

Root/array-only errors are real errors produced by the unchanged schema and injected at the parser seam solely for fallback testing, because the bounded UI cannot create a zero/five-segment route or extra root keys. All ordinary validation cases use the unmodified parser directly.

No browser, physical-device, native screen-reader speech or authenticated Account E2E check is claimed. The TASK makes the browser check optional. No full-suite/remote CI/hosted Preview result is inferred from the local checks or the earlier TASK-seed checks.

## Assessment and execution identity

In-scope self-review: **P0 0 / P1 0 / P2 0 / P3 0** unresolved findings. F-04 is covered by the new regression tests; independent TL acceptance remains required. Other #871 findings and parallel slices remain outside this delivery.

Security: no authority, input policy or transport change. Database/migrations: none. New ongoing costs: none. Documentation: only the three TASK-authorized delivery documents. No product-wide release acceptance is asserted.

Codex Desktop session: `01a111cd-eb31-7b71-94d9-e9f6b5643b73`.
Persisted session metadata: originator `Codex Desktop`, CLI `0.160.0`, provider `openai`.
Persisted turn context `2026-10-06T15:21:11.960Z`: model `gpt-6-astra`, effort `xhigh`.
Single writer; no subagents or replacement session.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
