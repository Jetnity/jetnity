# Trip Workspace contextual navigation + preparation targeting 1 — Report

Date: 5 October 2026
Issue: #840 · Draft PR: #841
Writer: Jetnity Trip Workspace contextual navigation 1 — Generation 1
Execution: Codex Desktop, `gpt-6-astra`, `xhigh`.
Status: **PUSHED / DRAFT / INDEPENDENT EXACT-HEAD REVIEW PENDING**.

## Binding identities and scope

- Main / merge-base: `3ba69f15907e0652cfe83478dabcf91904ca9a00`.
- Immutable task seed: `10e7ac7d7f40e912af56eecce04f8b7cdf03be70`.
- Published implementation commit: `d44b527a93cbfa2d415286c93a32ff496459f11c`. This report describes its containing delivery commit, whose runtime/test/audit source blobs are identical to that implementation commit. The final exact-head receipt is linked from PR #841; it identifies the containing commit without a self-referential SHA inside this document.
- Branch: `fix/trip-workspace-contextual-navigation-1`.
- Verified implementation/test/browser-evidence tree, before these delivery documents: `b7d4f3cd63ac0b4c57d032b28107e0bee95810eb`. GitHub's created tree SHA equals the locally staged tree SHA.
- Binding Task blob stays `c839b3a6d8e0e790e123e9cbf8123b36775977ad`, byte-identical to seed.
- Remote commit/push explicitly authorized by the user and [TL comment 5992723507](https://github.com/Jetnity/jetnity/pull/841#issuecomment-5992723507).
- Only expansion: [TL approval 5991882705](https://github.com/Jetnity/jetnity/pull/841#issuecomment-5991882705), reiterated explicitly by the user, adds `attention-presentation.ts` and its existing regression test.
- Nine runtime files are changed: eight from Task section 13 plus the single approved expansion. No new runtime, route, database or provider surface.

## Result

U02: plan day and item selection now round-trip through the existing URL/history contract. Item references are reconciled against the current Trip graph. A wrong or stale day is replaced by the item's actual existing day; unplanned items have no invented day; deleted items fall back to the valid plan/day parent. Opening details writes one child entry with a workspace-local parent marker. Visible Back and Escape use `history.back()` for internal children; direct links replace with the safe parent. Popstate reconstructs selection without pushing. Detail and compact navigation share one explicit return contract: `Zum Tagesplan`, `Zur Übersicht`, `Zur Organisation` (or the actual Preparation origin). Focus returns to a mounted visible source, otherwise to the parent heading.

U03: Preparation exposes its area navigation and section list immediately. Each section remains collapsible. The workspace owns a deterministic in-memory Set of open sections, preserving choices across mode switches. A typed target opens its section, then focuses and reveals the exact traveller heading when its applicable slot/card exists; otherwise it focuses the section summary. Repeated activation retriggers focus. No target causes a form submission, truth update or persistence.

Official Attention points now carry only a presentation payload: `insufficient_context` targets `reisende-dokumente`; other Official states target `offizielle-anforderungen`, with the exact known slot ref. The existing trip-wide insufficient-context point has no single known traveller and therefore remains section-only. No person is inferred. Coverage actions and canonical point IDs/order/severity/results remain unchanged.

The grouping key projects the complete supported action into `[art, bereich, target ? [section, travellerClientRef ?? null] : null]`. This stable value projection is independent of property order and object identity. Different sections, refs and present/absent targets remain separate. Membership, counts, earliest-member order, priority and group-based visible limits remain unchanged.

## URL contract

| Owned key | Valid context | Meaning / bound |
| --- | --- | --- |
| `ansicht` | Workspace | Existing four modes; omitted for overview |
| `bereich` | Organisieren | Existing supported domain |
| `tag` | Plan | Exact day ref, maximum 80 characters |
| `punkt` | Plan | Exact item ref, maximum 80 characters |
| `vorbereitung` | Vorbereitung | Supported Preparation section enum |
| `reisender` | Preparation with section | Exact applicable traveller ref, existing Readiness bound 64 |

Every owned value must be unique. Empty, duplicate, unsupported, overlong, whitespace-padded or control/replacement-character refs fail closed to the nearest valid parent. Foreign query values (including duplicates) and the hash survive. Item/day fields outside Plan and targets outside Preparation are removed. Opaque IDs are compared exactly, never parsed for navigation semantics. Graph validation delegates applicable-slot identity to the existing slot projection.

Internal history state uses `jetnityWorkspace: { reiseId, url, elternUrl? }`, preserving existing router state. The parent marker is accepted only for the current trip/address and the same path/origin. It is presentation context, not a domain field or an origin query parameter.

## Validation

All originally required commands were executed again on the final source state. Exact source blob hashes, model metadata and sanitized command excerpts are in `evidence/trip-workspace-contextual-navigation-1/validation.json` and `validation.txt`.

| Check | Result |
| --- | --- |
| `git diff --check` / staged diff check | PASS |
| `npm run check:operating-mode` | PASS; NORMAL |
| Focused workspace-mode/detail/attention/preparation/cross-device/premium tests, 10 files | 155/155 PASS |
| Bounded browser audit, real workspace through existing audit route | 57/57 PASS, 360/390/1440 px, on local production build; also passed on dev |
| `npm test` | **FAIL: 5,281 pass, 4 environment failures, 5,285 total** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS exit 0; 0 errors, 144 warnings |
| `npm run check:api-schutz` | PASS |
| `npm run check:schema-bezug` | PASS |
| `npm run check:dead` | PASS; 0 orphan modules |
| `npm run check:exports` | PASS; 0 unused exports |
| `npm run check:deps` | PASS |
| `npm run build` | PASS; prebuild setup, TypeScript and static generation completed |

Four existing, unmodified disposable-PostgreSQL integration tests fail before database startup because this macOS environment lacks `/usr/lib/postgresql/16/bin/initdb` (`ENOENT`): catalog-hardening-schema, content-identity-schema-v2, source-catalog-server and store-server. They were neither skipped nor edited. This is the historical local result; the remote PostgreSQL-equipped CI run below subsequently passed all 5,346 tests.

The browser script is the Task-permitted bounded addition: existing audits do not prove the new internal history parent, direct links, exact traveller target or repeated focus. It loads synthetic data through the existing local audit harness; external requests, all `/api/` calls and non-GET requests are intercepted. The successful run recorded zero page errors and zero attempted blocked requests. It checks visible Back/browser Back/Escape, Forward reconstruction, no popstate push, direct fallbacks, actual day correction, unplanned/deleted items, keyboard section collapse, preservation across all modes, target reopening, saved links, stale traveller fallback, repeated focus, no visible raw ref, no hidden/inert focus, no positive tabindex and no horizontal overflow. Six viewport screenshots are retained; mobile Preparation and desktop detail screenshots were visually inspected.

Build/browser used synthetic localhost configuration only. No hosted DB, Production, paid provider or model calls were made. No environment/config/dependency files changed. Framework-generated AGENTS/next-env changes were restored before delivery.

## Live pre-push evidence and delivery identity

- Main remains exact baseline and mode NORMAL.
- #751 still registers this writer, its approval and the disjoint #843 writer.
- #748 has 41 comments; latest processed MATERIAL remains `5988971332`, latest triage `5989855107`; no newer material.
- #841 was re-read open Draft at seed before the authorized fast-forward to the published implementation. No review submissions or inline review threads were present.
- #843 remains open Draft at `523f58e2e8c810fe424e0128ae88314d0cab52b5`; all five changed paths are its own semantic-contract documents, disjoint from this slice.
- Implementation commit is 2 ahead / 0 behind main. Its documentation/evidence-only delivery descendant is 3 ahead / 0 behind main. No main synchronization or unrelated commit is included.
- Sanitized local Codex turn-context evidence records `gpt-6-astra` / `xhigh` for this session, including the continuation. No other writer, Cursor or subagent was started.

## Exact delivery changed files (relative to seed)

- `components/trips/Reisevorbereitung.tsx`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceDetail.tsx`
- `components/trips/TripWorkspaceNavigation.tsx`
- `docs/TRIP_WORKSPACE_CONTEXTUAL_NAVIGATION_PREPARATION_TARGETING_1_HANDOFF_2026-10-05.md`
- `docs/TRIP_WORKSPACE_CONTEXTUAL_NAVIGATION_PREPARATION_TARGETING_1_REPORT_2026-10-05.md`
- `docs/TRIP_WORKSPACE_CONTEXTUAL_NAVIGATION_PREPARATION_TARGETING_1_SELF_REVIEW_2026-10-05.md`
- `docs/evidence/trip-workspace-contextual-navigation-1/1440-item.png`
- `docs/evidence/trip-workspace-contextual-navigation-1/1440-preparation.png`
- `docs/evidence/trip-workspace-contextual-navigation-1/360-item.png`
- `docs/evidence/trip-workspace-contextual-navigation-1/360-preparation.png`
- `docs/evidence/trip-workspace-contextual-navigation-1/390-item.png`
- `docs/evidence/trip-workspace-contextual-navigation-1/390-preparation.png`
- `docs/evidence/trip-workspace-contextual-navigation-1/result.json`
- `docs/evidence/trip-workspace-contextual-navigation-1/validation.json`
- `docs/evidence/trip-workspace-contextual-navigation-1/validation.txt`
- `lib/readiness/preparation-identity.test.ts`
- `lib/readiness/preparation-premium-experience-5.test.ts`
- `lib/readiness/preparation-premium-experience-5.ts`
- `lib/trips/attention-presentation.test.ts`
- `lib/trips/attention-presentation.ts`
- `lib/trips/attention.test.ts`
- `lib/trips/attention.ts`
- `lib/trips/cross-device-interaction-1.test.ts`
- `lib/trips/detail.test.ts`
- `lib/trips/detail.ts`
- `lib/trips/organize-premium-experience-6.test.ts`
- `lib/trips/workspace-mode-2.test.ts`
- `lib/trips/workspace-mode.ts`
- `scripts/trip-workspace-contextual-navigation-1-audit.mjs`

## Remote validation and review boundary

Published implementation head `d44b527a93cbfa2d415286c93a32ff496459f11c`: [CI run 37298050896](https://github.com/Jetnity/jetnity/actions/runs/37298050896) **SUCCESS**. Both jobs passed: `111723903607` (all validation steps, including 5,346 tests passed / 0 failed) and `111723903800` (Auth configuration, actual comparison executed). The remote PostgreSQL-equipped suite closes the four local fixture-startup failures; dynamic PostgreSQL subtests account for the larger remote test count.

Matching Vercel Preview `dpl_6PabGKigoVcn26jLx2JPxSngDTqj` is **READY**, `aliasError=null`, exact Git SHA confirmed. Authenticated GET to [the implementation Preview](https://jetnity-bpp8fzkvw-jetnity-e1b93c82.vercel.app/) returned HTTP 200 and the matching deployment ID. This is an availability smoke check; the 57 navigation/focus cases were run locally against the identical runtime source. The final documentation/evidence-only head must receive its own complete CI and Preview checks; the final PR delivery receipt records those exact-head results.

The implementation was published through the connected GitHub API after explicit remote authorization. The GitHub implementation tree equals the tested local tree. The delivery commit changes only the three already-authorized delivery documents and the existing validation evidence; all runtime, test, audit and screenshot blobs remain identical to the published implementation. Its exact final CI/Preview readback belongs to the final PR delivery receipt. No Ready/merge or independent acceptance is implied by the writer's validation.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
