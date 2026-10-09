# Trip Workspace Contextual Editing UX 1 — Generation 1 report

Issue [#907](https://github.com/Jetnity/jetnity/issues/907), Draft [#909](https://github.com/Jetnity/jetnity/pull/909). The editor now opens in one native modal scroll surface, with stored trip context and three progressive groups. The saved Workspace stays mounted and retains its four modes. Confirmation still uses the existing Guest or Account mutation and independently read committed graph. The return action restores the initiating control and canonicalizes removed day/item references through the existing Workspace helper.

Local acceptance is recorded below. Final publication receipt and exact-head CI/Auth/Preview are recorded in the Draft PR after publication; no TL acceptance is implied.

## Visible changes and measured result

The baseline was reconstructed at immutable seed `c3004bc159bc86a7eb25b741cc0aab49344c63c8` (TASK blob `e3c0c4b4c37663f4269fae282bfea24f12e1ad01`), on real production Guest routes using synthetic storage fixtures. The original Product Owner screenshot pixels were not available in this session. The TASK's description and independently captured baseline are distinguished here.

At 360px/100% text, the initial form measured 1,336px; at 360px/200%, 3,844px. The replacement initially measured approximately 742px/1,918px, with the final exact measurements in [after geometry](evidence/trip-workspace-contextual-editing-ux-1/after/geometry.json). The entire editor scrolls separately from the document. Baseline preview changed document scroll from 712 to 539 at 360px/100%, and 2,913 to 2,232 at 200%. Final open/preview document scroll is equal in every tested viewport/text combination. The retained overview no longer moves down when the editor opens. Actions stay in normal flow; there is no additional sticky bar or fixed footer.

| Width/text | Before | After |
|---|---|---|
| 360/100% | [open](evidence/trip-workspace-contextual-editing-ux-1/baseline/360-1-open.png) | [open](evidence/trip-workspace-contextual-editing-ux-1/after/360-1-open.png), [preview](evidence/trip-workspace-contextual-editing-ux-1/after/360-1-preview.png) |
| 360/200% | [open](evidence/trip-workspace-contextual-editing-ux-1/baseline/360-2-open.png) | [open](evidence/trip-workspace-contextual-editing-ux-1/after/360-2-open.png), [preview](evidence/trip-workspace-contextual-editing-ux-1/after/360-2-preview.png) |
| 390/100% | [open](evidence/trip-workspace-contextual-editing-ux-1/baseline/390-1-open.png) | [open](evidence/trip-workspace-contextual-editing-ux-1/after/390-1-open.png) |
| 768/100% | [open](evidence/trip-workspace-contextual-editing-ux-1/baseline/768-1-open.png) | [open](evidence/trip-workspace-contextual-editing-ux-1/after/768-1-open.png) |
| 1024/100% | [open](evidence/trip-workspace-contextual-editing-ux-1/baseline/1024-1-open.png) | [open](evidence/trip-workspace-contextual-editing-ux-1/after/1024-1-open.png) |
| 1440/100% | [open](evidence/trip-workspace-contextual-editing-ux-1/baseline/1440-1-open.png) | [open](evidence/trip-workspace-contextual-editing-ux-1/after/1440-1-open.png), [preview](evidence/trip-workspace-contextual-editing-ux-1/after/1440-1-preview.png) |

Legacy regression audit screenshots are newly captured as viewport-only PNGs through a task-owned adapter; their assertions remain unchanged. This bounds review artifacts without truncating tested consequences.

Both geometry directories include all five widths at both text sizes and closed/open/preview screenshots. Closed screenshots show trip identity, dates, header, four modes and saved overview.

## Acceptance matrix

Evidence abbreviations: [Journey](evidence/trip-workspace-contextual-editing-ux-1/journey/journey.json), [Edges](evidence/trip-workspace-contextual-editing-ux-1/edges/edges.json), [Guest](evidence/trip-workspace-contextual-editing-ux-1/regressions/guest/guest-browser.json), [Account](evidence/trip-workspace-contextual-editing-ux-1/regressions/account/account-browser.json), [903](evidence/trip-workspace-contextual-editing-ux-1/regressions/903/), [Checks](evidence/trip-workspace-contextual-editing-ux-1/checks-audit.json). These exercise actual production components; fixtures seed data, not success UI.

| Criterion | Implementation and executable proof |
|---|---|
| A01 | Stored header/overview before opening, independent stored context inside `TripWorkspaceEditSurface`; closed screenshots, Journey. |
| A02 | Existing labelled entry opens the same surface in Guest and real authenticated Account; Guest/Account. |
| A03 | 360px full-width modal; three groups, optional interests/wish; closed editor has no form footprint. Geometry/Journey. |
| A04 | 1440px two columns with stored title/date/destination disclosure and Workspace location. Screenshot/Journey. |
| A05 | 768px same progressive flow with wrapping controls; geometry and complete Journey. |
| A06 | Native top layer and dialog-scoped `workspaceEditFocus`; 35 Tab transitions per combination, group/preview/error focus, scoped impact pagination. |
| A07 | No document horizontal overflow at 360/390/768/1024/1440, 100/200% text. Geometry, Guest, Edges. |
| A08 | Reduced-motion, 44px labelled touch targets, 200% text, simulated top/bottom/side insets and 430px-high viewport. Guest/Edges; actions remain scroll-reachable. |
| A09 | Guest keyboard-only preview/back/confirm, Journey Escape/Browser Back and initiating-trigger focus restoration; multi-entry Back also restores the historical Workspace mode (Edges). |
| A10 | Named native modal, saved-context complementary region, impact region, active step, field-linked errors and status/alert announcements; [Chromium AX tree](evidence/trip-workspace-contextual-editing-ux-1/edges/accessibility.json). Background navigation is absent from the modal AX tree and rejects focus. |
| A11 | Existing exact draft validation and unchanged literal fields/currency. Guest metadata case, Account owner metadata case. |
| A12 | Date, total duration, stage duration/removal use existing domain functions; compound-date Guest and real Account RPC cases. |
| A13 | Legal removal preserves every protected item as unplanned; Guest 1,000-point case and Account removal/reload. |
| A14 | #905 A09 v1.1 linked removal fails before Guest write/Account RPC, retains draft/graph/reference; unrelated edits still save. Guest/Account. |
| A15 | Existing complete `auswirkungen` projection, unchanged prospective possible/proven/unknown wording, prior/proposed ranges. Guest conflict evidence and full domain suite. |
| A16 | 1,000-point graph; all 250 removed ordinary and all 250 protected consequences traversed, each visible page <=20 rows; categories remain accessible, document scroll stable. Guest traversal/save case completed in 1,378 ms in this local run; no new performance budget or physical-device claim. |
| A17 | Preview/back/cancel preserve draft and write zero Guest mutations; Account preview uses existing authenticated read-only server action, no write RPC. Guest/Account/Journey. |
| A18 | Explicit confirmation; one committed Guest revision, stable readback; Account idempotency and independent authenticated graph read. |
| A19 | Dates/booking IDs/places/route and Preparation assertions retained in replayed tests; no domain/storage/SQL changes. |
| A20 | Guest reload and same-revision other-trip rejection. Guest. |
| A21 | Real local GoTrue sessions, authenticated PostgREST/RLS and unchanged `reise_aendern`, owner/outsider/no-session controls and independent reload. Account (10 browser cases). |
| A22 | Storage quota, lost RPC ACK, committed write/unavailable readback, read-only recovery and duplicate retry; no invented saved heading. Guest/Account/Journey. |
| A23 | Native child revision and later unrelated mutation invalidate drafts/replays without clearing input. Account, full domain tests. |
| A24 | DOM authority guard blocks close/Escape/Back and native modality blocks background actions. Busy state is propagated before paint. Journey uncertainty case, Account pending/lost-ACK cases. |
| A25 | Existing free-text proposal mode remains explicit. Actual locally disabled-model server action is exercised, preserving manual fallback; no paid provider request is made. Direct Guest route has zero POSTs; Account has only its existing authenticated server actions, zero catalog/quota calls. |
| A26 | #903: 24 browser cases, pending-editor proof, nine real authenticated persistence cases. Existing timeline core (40), temporal review (32), contextual navigation (three viewport matrices), premium plan (26 steps) all pass. |
| A27 | Local Linux 5,806/5,806, 810 suites, zero fail/skip/cancel/todo; Typecheck/Lint/hygiene/Build pass. Exact published CI, actual Auth comparison and READY Preview must be read on final head and are linked in the PR publication receipt. |

## Engineering and evidence boundaries

The final source is six production files: the Workspace composition, new edit surface, direct/free-text presentation, manual form, impact presentation, and a presentation-only focus helper. Existing direct request construction, validation, mutation IDs, basis revision, RPC/Auth/RLS, source wrappers, serialization, official/booking/Preparation semantics are unchanged. Source hashes and the complete delivery file inventory are in [source manifest](evidence/trip-workspace-contextual-editing-ux-1/source-manifest.json). TASK and PRECHECK remain unchanged.

No new packages or global CSS/layout. No `lib/readiness`, Official Truth script, migration, schema, provider, or global governance modification. No hosted database changes, production deployment, new costs/secrets/providers or paid model activation. Local Account databases are ephemeral run-owned containers with synthetic identities; only those containers/networks are removed.

The Linux runtime initially exposed PG_MAJOR/PG_VERSION/PGDATA defaults that newer isolated repository tests reject. The task-owned runner clears those variables; no test or Official Truth code is changed. The first 5,802/5,806 attempt is superseded by the actual 5,806/5,806 pass. During UI verification, a lost canonical day reference on return and a one-paint busy-button discrepancy were found and corrected, then tested again. Initial test-harness assumptions about native dialog role matching, browser-chrome Tab behavior and canonical overview query were corrected to inspect actual browser semantics; graph/security assertions were retained and expanded.

Screenshots are Chromium 154 emulation, not physical phones, WebKit or real screen-reader sessions. Safe-area evidence uses explicit synthetic insets plus source inspection of env(safe-area-inset-*); it does not claim hardware notch/keyboard behavior. Text scaling is 100/200% root font size. Account fault injection is confined to an owned loopback proxy. No Production E2E or hosted Account save is claimed. Free-text model success is covered by existing domain tests rather than a paid live generation in this task.

## Reproduction and handoff

Run `node scripts/trip-workspace-contextual-editing-ux-1/audit.mjs all` from the repository with Node 22, installed repository dependencies, local Chrome and the existing local Docker test images. It owns port 3517 and its local containers; it must not be run against an unrelated server. `checks` runs only static/hygiene checks. Individual `replay.mjs guest|account|903|linux`, `browser.mjs`, `edges.mjs`, and `geometry.mjs after` are also available. Replay adapters retain original source SHA256s, change only evidence/import paths/local ports/UI group navigation and isolated runner environment, and add timing/full protected-row inspection. Baseline geometry must run on the immutable seed, not the implementation.

PR remains Draft. Independent TL owns acceptance, any later main reconciliation, Ready/merge and postmerge checks. Author does not synchronize main or work on parallel Official Truth #908.

Latest publication-time main is `d70af4a869716f11bf5c556a1dc679c973f290c2` after the independent #910 merge. This author preserves the prepared `2ee48bcd40ba9c056898474a2eab87d0ce0d91ca` base and performs no main synchronization. TL owns any later reconciliation. PR CI may therefore test the GitHub merge ref with the newer base; branch Preview remains bound to the author head.
