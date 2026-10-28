# N12 Chronological Days 1 — HANDOFF

Author stopped after the product commit. Do not start another writer from this file.

## Where

- Session https://cursor.com/agents/bc-76158c10-7a26-4509-86ad-9eac8af04bfa
- Name `Jetnity V2 N12 Chronological Travel Days 1 — Cursor Generation 1`
- Model `grok-4.7-high-fast`
- PR https://github.com/Jetnity/jetnity/pull/1062
- Issue https://github.com/Jetnity/jetnity/issues/1060
- Branch `fix/v2-n12-chronological-days-1`
- Product commit `d57eac4903f3e63ac0ee23eb577ed4fd709e29cc`
- Product tree `111e19a33100571b9570353d7afa0ca09afe8647`
- Main / merge-base `a9b7a45b88347da3cac92965e2c544ec5e1bca67`
- Mode `NORMAL` in `.jetnity/operating-mode.json`
- Plan comment https://github.com/Jetnity/jetnity/pull/1062#issuecomment-6455821866

## What the code does

`lib/trips/n12-chronology-1/laeufe.ts` `chronologischeLaeufe(reise)` sorts a copy by `dayIndex`, then day id. It groups contiguous resolved stages. Adjacent null-stage days split when only one side has a stored `flight` or `transfer`. The original `TripDay` objects are reused. `timeline.etappen` is unchanged and is shown as the secondary Etappen list.

`components/trips/TripWorkspacePlan.tsx` sends those runs through the existing `planTageFolgen`. Previous/next, the phone strips, and the desktop grid use that order. The component does not sort.

## Do not touch

`lib/trips/trip-audit-v1/audit.ts`, `lib/trips/flug-abdeckung.ts`, F05 PR #1063, Guest/Account writers, `ReiseAenderungManuell`, `gastspeicher`, schema, SQL, Auth, package, CI, shared `ACTIVE_WORK_STATUS`, 12Go, DiscoverCars, the nights reader. F01 remains the reserved SECURITY INVOKER gate.

## If review asks for a fix

Stay in this session. A new head needs a new typecheck, the N12 tests, and fresh CI/Preview. Do not mark Ready.
