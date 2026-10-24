# Trip Plan Editing and Placement Recovery 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Trip Plan Editing and Placement Recovery 1 — Cursor Generation 1**
Session: `bc-ddd91109-9dd1-4ed0-b554-c9c9d5b3888d`
Model: `grok-4.7-high-fast`
Issue: #996. Draft PR: #999.

This report is author evidence. It is not Technical-Lead PASS, Ready, or merge.

## Implemented

Existing items with null, one, or several days can be edited. Explicit placement sends the captured original and the selected `dayId`, including `null` for unassigned. A zero-day trip opens the editor. Protected flights stay placement-only. New-item creation still requires a real day and stays inside `#plan-tag-kontext`.

Delete errors render on the plan section as `[data-plan-meldung]`, outside `#plan-tag-kontext`, so the premium-4 locator for the new-item validation alert is unchanged. Focus moves to that alert only while the delete trip, item, and operation still match. A later trip does not keep the alert, and a late resolution does not alert or lock the newer trip.

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

Runtime tree for the mounted evidence: `aa594b18a0d827b9dcae1b607bfefa4b45764d06`. `origin/main` and merge-base `0c37d318c47a758f06634448d6e0de3856bbc6a6`. Ahead/behind 10/0 before the docs commit. Node v22.23.4. That head only drops an unused harness import from `7b0bcc3b49844d6244d5c98e4de8bae174031475`.

| Command | Result |
| --- | --- |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/guest-plan-delete-recovery-1.test.ts lib/trips/gastspeicher.test.ts lib/trips/trip-plan-premium-experience-4.test.ts` | 106 pass, 0 fail. Includes "nach dem Entfernen sind die Reihenfolgen wieder lückenlos" and the premium-4 source contract. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/guest-plan-delete-recovery-1.test.ts` on `7b0bcc3b` | 11 pass, 0 fail. That file is unchanged in `aa594b18`. |
| `node scripts/trip-plan-editing-placement-recovery-1/run.mjs` | PASS, 60 cases. Chromium 148.0.7778.96. Evidence head `aa594b18a0d827b9dcae1b607bfefa4b45764d06`. |
| `npm run check:dead && npm run check:exports && npm run check:deps && npm run check:api-schutz && npm run check:schema-bezug` | exit 0. 0 unreferenced files, 0 unexplained exports. Schema check still prints the existing LOCAL/UNAPPLIED RPC notes and exits 0. |
| `npm run typecheck` | exit 0 after the party fixture used a real `TripTraveller`. |
| `npm run lint` on `aa594b18` | exit 0. 144 warnings, 0 errors. None are in the owned files. |
| `npm run build` | exit 0. Production output compiled. Later commits are the test fixture and the unused harness import. |
| `npm test` on `7b0bcc3b` | exit 1. 7090 tests, 7074 pass, 11 fail, 5 skipped. The 11 failures are native PostgreSQL proofs, listed in the handoff. |

## Mounted cases that passed

Zero-day edit with null date and time, domain error, thrown error, cancel focus, protected flight, Escape, day move, unassigned move, double submit, old completion, unmount, both Account callback orders with a changed `rowVersion`, guest no-op with the same version, domain no-op with a new version, no further graph, draft edits after recovery, unrelated graph, version-only null and error, removed and duplicated target, real `gastPlanpunktEntfernen`, visible stale-delete alert and focus, alert cleared on a new trip, pending delete error not applied to the newer trip, newer delete not left locked, and the unconfirmed-write callback kept as an error. Viewports 280, 320, 360, 390, 430, 768, 1280, landscape 844×390, and 320 at root 32px had no horizontal overflow and a reachable control.

Screenshots: `docs/evidence/trip-plan-editing-placement-recovery-1/zero-day-closed.png`, `zero-day-delete-error.png`, `editor-390.png`.

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
