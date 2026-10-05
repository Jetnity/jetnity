# Changed-path manifest — V1 Account Graph Read Completeness 1

Owned writes:

- `lib/trips/foundation-e-select.ts`
- `lib/trips/foundation-e-select.test.ts`
- `lib/trips/account-graph-read.ts`
- `lib/trips/account-graph-read.test.ts`
- `lib/trips/daten.ts` — `reiseLaden` orchestration only
- `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_TASK_2026-09-21.md`
- `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_STATUS_2026-09-21.md`
- `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_HANDOFF_2026-09-21.md`
- `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_SELF_REVIEW_2026-09-21.md`
- `docs/V1_ACCOUNT_GRAPH_READ_COMPLETENESS_1_DECISION_2026-09-21.md`
- `docs/evidence/v1-account-graph-read-completeness-1/**` including `consumer-source-review.md`

Not written:

- guest storage/create (`lib/trips/gastspeicher.ts`, `anlegen.ts`, create UI)
- `lib/readiness/reisende.ts` / party mapper semantics
- shared Trip/Traveller/Readiness types
- `app/(public)/reisen/[tripId]/page.tsx` — existing 500 copy already honest
- mutation/action files
- Auth/RLS/schema/SQL/migrations
- package/lockfile/workflows
- `docs/ACTIVE_WORK_STATUS.md` and other global continuity files
- sibling #532 files
