# Trip Plan Editing and Placement Recovery 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Trip Plan Editing and Placement Recovery 1 — Cursor Generation 1**
Session: `bc-ddd91109-9dd1-4ed0-b554-c9c9d5b3888d`
Model: `grok-4.7-high-fast`
Issue: #996. Draft PR: #999.

This report is author evidence. It is not Technical-Lead PASS, Ready, or merge.

## Implemented

Existing items with null, one, or several days can be edited. Explicit placement sends the captured original and the selected `dayId`, including `null` for unassigned. A zero-day trip opens the editor. Protected flights stay placement-only. New-item creation still requires a real day and stays inside `#plan-tag-kontext`.

Delete errors render on the plan section as `[data-plan-meldung]`, outside `#plan-tag-kontext`, so the premium-4 locator for the new-item validation alert is unchanged. The alert stays visible for the current trip and delete operation. Focus moves to it only when the focus token captured at delete start is still current. A newer editor open, a newer save, a day change, or a trip change advances that token. The scheduled return after save or cancel uses the same check. A later trip does not keep the alert, and a late resolution does not alert or lock the newer trip. The editor's own error alert still receives focus for the operation that owns the form.

Guest `gastPlanpunktEntfernen` keeps its signature. It captures `aktiveSchluesselRohLesen()` once, parses those bytes once, validates the stored graph and the caller with `reiseLesen`, checks id and revision, then compares `gastLoeschBasisGleich`. That helper projects each side with `tageEtappenZuordnen` and compares a key-sorted stringify that drops no field. The write base is the unprojected stored graph. The target must occur exactly once. Day positions are renumbered. `ohneTag` is filtered and not renumbered. `gastreiseSpeichern` is unchanged.

The editor classifies the visible same-id item with read-only `punktAendern`. Domain comparison removes only `rowVersion`. Success closes only for this operation's `null`, an expected-domain item, and the unchanged submit draft. An unchanged full original enters one waiting render, then becomes editable again without a success claim. A version-only change, a missing item, or a duplicate item keeps the draft and shows the existing conflict text on `null`. A returned error stays that error unless the target is missing or duplicated. A later matching graph does not clear edits made after recovery.

Binding clarification, also in the plan: a domain no-op is an expected-domain match when `rowVersion` is unchanged. Completion still needs the successful callback and unchanged ownership.

## Files

- `components/trips/TripWorkspacePlan.tsx`
- `components/trips/PlanpunktEditor.tsx`
- `components/trips/usePlanEditorLifecycle.ts`
- `lib/trips/gastspeicher.ts` — import plus `gastPlanpunktEntfernen` only
- `lib/trips/trip-plan-editing-placement-recovery-1.ts`
- `lib/trips/guest-plan-delete-recovery-1.test.ts`
- `scripts/trip-plan-editing-placement-recovery-1/**`
- `docs/JETNITY_TRIP_PLAN_EDITING_PLACEMENT_RECOVERY_1_PLAN_2026-10-24.md` — no-op clarification and status only
- `docs/evidence/trip-plan-editing-placement-recovery-1/**`

TASK V1 is byte-identical (`42b124f5f68172aaa51365b028bb22772d362dcc`). Account writers, schemas, readiness and party writers, and the other guest functions are not edited.

## Commands

Repair evidence head: `545cbdf783e75ab82f8d23b5f1533b60e56f06a5`. `origin/main` and merge-base `0c37d318c47a758f06634448d6e0de3856bbc6a6`. Ahead/behind 14/0 before this docs commit. Node v22.23.4. Reviewed head `8d4fe188025515ab3b9b1168b3281f2f0bde39a1` remains the head of CI run 40107587054. That CI result is not a gate for this repair.

| Command | Result |
| --- | --- |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/guest-plan-delete-recovery-1.test.ts lib/trips/gastspeicher.test.ts lib/trips/trip-plan-premium-experience-4.test.ts` on `545cbdf7` | 106 pass, 0 fail. Includes "nach dem Entfernen sind die Reihenfolgen wieder lückenlos" and the premium-4 source contract. |
| `node scripts/trip-plan-editing-placement-recovery-1/run.mjs` | PASS, 77 cases. Chromium 148.0.7778.96. Evidence head `545cbdf783e75ab82f8d23b5f1533b60e56f06a5`. |
| `npm run check:dead && npm run check:exports && npm run check:deps && npm run check:api-schutz && npm run check:schema-bezug` on `545cbdf7` | exit 0. 0 unreferenced files, 0 unexplained exports. Schema check still prints the existing LOCAL/UNAPPLIED RPC notes and exits 0. |
| `npm run typecheck` on `545cbdf7` | exit 0. |
| `npm run lint` on `545cbdf7` | exit 0. 144 warnings, 0 errors. None are in the owned files. The four `gastspeicher.ts` warnings are the pre-existing unused bindings. |
| `npm run build` on `545cbdf7` | exit 0. Production output compiled. |
| `npm test` on `545cbdf7` | exit 1. 7090 tests, 7074 pass, 11 fail, 5 skipped, about 100s. The 11 failures are the same native PostgreSQL proofs listed in the handoff. This is not a pass. |

Historical, not relabeled: on `7b0bcc3b` the same `npm test` count was exit 1, 7074 pass, 11 fail, 5 skipped. The guest delete file on that head was 11 pass. Native CI 40107587054/1 on `8d4fe188` was 7196 tests, 7194 pass, 0 fail, 2 skip, build successful. That run does not cover `545cbdf7`.

## Mounted cases that passed

The earlier 60 cases still pass. Added for this repair: a pending save is unmounted before that exact request resolves, and the resolver counter increases by one with no page error and no success text; same-id content and placement changes keep revision, `updatedAt`, and `rowVersion` and show the conflict for both `null` and error; R1 stays pending while R2 is submitted, and R1 late success or error leaves R2 locked until R2 itself completes; the older Marktbesuch delete error stays visible while the newer title input keeps focus and its draft; guest delete removes the target from the DOM and from storage, keeps the other items, and advances revision by one. Save and Cancel were scrolled into view and measured at 280, 320, 360, 390, 430, 768, 1280, landscape 844×390, and 320 at root 32px. Horizontal overflow was 0. Both buttons were at least 44px tall and inside the viewport after that scroll. While R2 is saving, the disabled submit button leaves focus on `body`; R1 does not move it and does not focus the plan alert.

Screenshots: `docs/evidence/trip-plan-editing-placement-recovery-1/zero-day-closed.png`, `zero-day-delete-error.png`, `editor-390.png`, `older-delete-keeps-editor-focus.png`.

## Database, security, cost

No migration, RLS, Auth, schema, or provider change. Guest delete still writes only `jetnity:reise:v3`, and only after the captured basis matches. It does not broaden who can delete. Account delete and the Account CAS are unchanged. No new dependency or recurring cost.

Traveller context is not collected here. Placement goes through `punktAendern`, which keeps the other item fields. A stored party or readiness change with the same id, revision, and `updatedAt` fails the guest delete compare and writes nothing.

## Limits

- The gap inside frozen `gastreiseSpeichern` between the captured read and `setItem` is still non-atomic. `SpeicherFehler` is a failure, not a claimed rollback.
- Account `null` is still not a refreshed-graph confirmation. The unconfirmed-write error stays an error.
- Item domain comparison is `JSON.stringify` after removing `rowVersion`. It is key-order sensitive. The guest storage compare is key-sorted. A real `planpunktAus` reload is not what the local Account fixture builds.
- The harness is local Playwright with CSS viewport and root-font simulation. It is not a physical device, screen reader, native zoom, hosted account, Preview, or Production pass.
- Exact-head App CI, Auth CI, and Vercel Preview were not run by this author.

## P0–P3

- P0: none found in this slice.
- P1: the disclosed non-atomic localStorage gap remains. This slice does not edit the setter.
- P2: a hosted Account save can still return `null` before the reloaded row is the one the editor sees. The local fixture covers both orders. It is not hosted proof.
- P3: key order in the item JSON compare; CSS simulation rather than a device; CI and Preview not yet on this head.
