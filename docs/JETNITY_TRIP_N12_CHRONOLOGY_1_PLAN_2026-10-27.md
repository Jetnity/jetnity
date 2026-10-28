# N12 Chronological Days 1 — PLAN

27 Oct 2026. Posted on Draft PR #1062 before any source edit: https://github.com/Jetnity/jetnity/pull/1062#issuecomment-6455821866

## Session

- Name: `Jetnity V2 N12 Chronological Travel Days 1 — Cursor Generation 1`
- Session: `bc-76158c10-7a26-4509-86ad-9eac8af04bfa`
- URL: https://cursor.com/agents/bc-76158c10-7a26-4509-86ad-9eac8af04bfa
- First `run-info.name`: `N12 chronological trip display`
- `originalModelName`: `grok-4.7-high-fast` on the first read and the re-read after `rename-chat`
- Branch `fix/v2-n12-chronological-days-1`
- Seed HEAD `bde358b3821622089a21fa8ef8d064d4a54d87a5`
- `origin/main` and merge-base `a9b7a45b88347da3cac92965e2c544ec5e1bca67`
- Mode `NORMAL`
- Latest #751 comment [6455284869](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6455284869) names that same main

## Decision

Keep `timeline.etappen` as the secondary stage overview. Add `chronologischeLaeufe` and drive the real mobile strips, desktop grid, and previous/next from that projection. `planTageFolgen` still flattens the groups it is given and does not sort them.

A null-stage day with a stored flight or transfer is labeled `Reisetag mit geplantem Flug/Transfer`. A null-stage day without those items keeps the existing mode label. Day index and day title are not read as Hinreise or Rückreise. A cross-midnight flight stays one item on its `dayId`. An existing end date may show a continuation note. No new day, no timezone, no overnight-stay claim.

Duplicate day ids or day indexes fail closed and render no day order.

Nights stay with `unterkunftAbdeckung`. This slice does not change that reader.

## Out of scope

F01, Guest/Account writes, SQL, Auth, provider, 12Go, DiscoverCars, audit files, shared `ACTIVE_WORK_STATUS`. Cursor does not Ready or merge.
