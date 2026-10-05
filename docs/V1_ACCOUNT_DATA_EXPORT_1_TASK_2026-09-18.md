# Jetnity – V1 Account Data Export 1 Task

Stand: 18. September 2026
Status: **ACTIVE / V1 P0 REMEDIATION / PARALLEL BOUNDED SLICE**

Issue: #474
Source audit: #438 / merged PR #449 / finding 2.1
Canonical base: `main@854045a0f37e07d783115dd3a0ee6b302f79bfa1`
Branch: `feat/v1-account-data-export-1`

Cursor-Agent: **Jetnity V1 account data export 1**
Generation: **1**
Required parent model: **Cursor Grok 4.6 High Fast**

Do not use Auto. If unavailable, STOP/report.

## Live TL precheck already completed

Production `qscbgcdmivbbnzrcyegn` was inspected read-only. Relevant private tables are RLS-enabled and have authenticated owner-scoped SELECT policies.

The slice MUST use the normal session-bound Supabase server client and existing RLS. It MUST NOT use service role or any privileged bypass.

## Goal

Provide the signed-in account with one direct machine-readable JSON download containing the Jetnity account/travel rows owned by that user.

## Required export scope

Explicitly include only current owner-scoped rows from:
- `profiles`
- `account_travellers`
- `account_traveller_citizenships`
- `account_traveller_documents`
- `account_visits`
- `trips`
- `trip_stages`
- `trip_days`
- `trip_items`
- `trip_travellers`
- `trip_traveller_citizenships`
- `trip_traveller_documents`
- `trip_readiness_items`

Do not add unrelated tables merely because they contain a `user_id`.

## Runtime contract

- route/download path must be authenticated;
- call `auth.getUser()` server-side and fail closed when not authenticated;
- do not accept a user id from query/body/path;
- use `createRouteHandlerClient()` or an equally session-bound existing helper;
- no service role, no admin client, no raw privileged SQL;
- query through existing RLS;
- any required table-query error fails the complete export rather than silently dropping a section;
- empty owned tables export as empty arrays;
- response JSON has a stable explicit schema version and generated-at timestamp;
- JSON is sent directly, not persisted;
- Content-Type JSON, Content-Disposition attachment, Cache-Control no-store;
- filename must not expose email/name or other PII;
- no secrets/tokens/cookies/password/MFA material;
- no security/admin/provider/payment/model internals;
- do not invent passport scans/MRZ/biometric/health data.

## Account settings UX

Add an accessible data-export entry point to `/account/settings`.
Copy must:
- state this downloads the current account/travel data;
- warn that the file may contain sensitive travel/traveller information;
- not claim legal completeness beyond the implemented Jetnity-owned scope;
- not call this account deletion.

## Rate / abuse boundary

First inspect the live codebase for an already existing suitable route-throttling primitive.
- Reuse it only if genuinely applicable.
- Do not create a DB table, migration, external service or cost for this slice.
- Do not use an in-memory limiter as if it were globally reliable across serverless instances.
- If no suitable existing reliable primitive exists, document the gap honestly; authenticated/no-store direct export is preferable to inventing false rate-limit guarantees.

## Allowed write scope

Primary runtime:
- `app/api/account/export/route.ts`
- `app/account/settings/page.tsx`
- optional one focused helper under `lib/account/**`
- focused tests directly supporting this export contract

Slice docs only:
- `docs/V1_ACCOUNT_DATA_EXPORT_1_TASK_2026-09-18.md`
- `docs/V1_ACCOUNT_DATA_EXPORT_1_STATUS_2026-09-18.md`
- `docs/V1_ACCOUNT_DATA_EXPORT_1_HANDOFF_2026-09-18.md`
- `docs/V1_ACCOUNT_DATA_EXPORT_1_SELF_REVIEW_2026-09-18.md`

If another runtime file appears necessary, STOP/report before widening scope.

## Hard exclusions

No migration.
No Production/Development database mutation.
No service role.
No Storage bucket/archive.
No account deletion.
No legal/privacy page content.
No SMTP/provider.
No Auth/MFA/AAL/RLS semantic changes.
No global continuity files.
No files from #475.

## Validation

At minimum:
- focused export tests;
- full tests;
- typecheck;
- lint;
- Production build;
- admin API/schema/dead/export/dependency repo checks;
- exact-head CI;
- exact-head Vercel Preview;
- live merge-base/ahead/behind;
- GitHub/Vercel thread state;
- grep/source evidence proving no service-role usage in the slice.

No Ready. No merge. No follow-up slice.

Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.
