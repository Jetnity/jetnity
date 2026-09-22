# Admin Account Counts Delivery 1 — STATUS

Stand: 22. September 2026  
Status: **R1–R4 REVIEW FIX PACKAGE / FROZEN FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO PRODUCTION APPLY**

Draft PR: #553  
Branch: `feat/admin-account-counts-delivery-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_TASK_2026-09-22.md` v1 at seed `6666b02795a080fdb10f73158503e009f7d853c2`  
Reviewed head that required changes: `d1d18daca96bb72c4ed6645c46b765e867bd5615` (review 5283659145)  
Authorized exact-main sync / live main / merge-base: `ff054f76c14cf1c434890ba342af4df5e536dd05`  
Original task baseline remains recorded: `0d4c871867e7c4daac45af4a737cc032723863ae`

Cursor-Agent: **Jetnity admin account counts delivery 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-3d009635-3ebd-40d6-b47e-dc8328cf309b`  
Observed run-info display name: `Jetnity admin account counts delivery`. UI rename was **not** performed.

This persist is not Technical-Lead PASS, not live statistics, and not Production activation.

---

## 1. R1–R4 package

- **R1:** `loadAdminAccountCounts()` accepts no environment snapshot. Synthetic leftover arguments are ignored. Pure `isAdminAccountCountsLocallyEnabled(env)` cannot invoke the session client. Page and loader use `isAdminAccountCountsRuntimeEnabled()`, which requires the current process snapshot **and** the module-captured `NEXT_PUBLIC_SUPABASE_URL`. A later dynamic loopback mutation cannot authorize a remote or empty capture.
- **R2:** Parser now requires the PostgreSQL JSON timestamptz grammar, real calendar days, explicit-zone offsets, and a 720-hour interval at microsecond resolution. Original valid strings are retained. Counts are bounded to the nonnegative signed-bigint range before `BigInt`. Impossible February 30, 720h+1µs, `9223372036854775808`, excess fraction digits and English month-name strings are rejected. Leap-day, non-UTC, equal-microsecond and maximum-bigint rows remain accepted.
- **R3:** The scanner-invisibility lock-in test was removed. Addendum `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_REVIEW_FIX_1_TASK_2026-09-22.md` (`e726b1ac`) authorized a bounded change to `scripts/db/verwendung.mjs` only. The reader now uses a scanner-visible `.rpc('admin_account_counts_v1')`. The checker records that one path-and-RPC pair as **LOCAL/UNAPPLIED**, bound to `scripts/db/admin-account-counts-delivery-1-rpc.sql`, and does not claim generated-schema existence. Unknown names, wrong source paths and missing local SQL still fail. Generated types and migrations were not edited.
- **R4:** RPC classification uses structured codes only (`42883`/`PGRST202` unavailable; `42501`/`42503`/`PGRST301`/`PGRST302`/401/403 forbidden). Message substrings such as `does not exist` no longer imply a missing wrapper; `42P01` is failed. `lookup-failed` and `aal-lookup-failed` are failed; genuine denials and break-glass are forbidden. Gate throws and client-factory throws are failed. The default component uses `containAdminAccountCountsLoad`.

Shared auth/client, #550/#552, central #551 docs, package/lock/CI and operating-mode were not edited.

## 2. Activation / security

Runtime enablement still requires the exact flag `true`, `NODE_ENV` `development`|`test`, no Vercel/CI/GitHub Actions marker, loopback current URL **and** loopback module-captured URL. Hosted/Production/Preview stay disabled even when the flag is set. Disabled means no new section and no RPC.

## 3. Schema-reference LOCAL/UNAPPLIED coverage (R3)

`npm run check:schema-bezug` now reports generated-schema coverage **and** discloses `LOCAL/UNAPPLIED RPC admin_account_counts_v1 from lib/admin/account-counts-delivery/reader.ts → scripts/db/admin-account-counts-delivery-1-rpc.sql (not in generated schema)`. That is an explicit reviewed local-reference classification, not installation. Executable checker regressions live in `lib/admin/account-counts-delivery/schema-reference.test.ts`. Later Production promotion must reconcile this classification separately.

## 4. Verification after the R1–R4 package (this writer)

| Class | Result | Kind |
| --- | --- | --- |
| wrapper checks | 24/24 PASS | mixed: 15 SQL + 6 catalog + 2 source + 1 Node cleanup |
| wrapper runner safety | 2/2 PASS | Node fail-closed + source |
| application/renderer | 30/30 PASS | activation, parser, actual loader, synthetic render, schema-reference |
| `npm test` | 3887/3887 PASS | full repo unit suite including the 30 delivery tests |
| existing auth/capability | 35/35 PASS | unchanged shared helpers |
| typecheck | PASS | Next 16.3.3 |
| lint (delivery files) | PASS | no JSX-in-try regression |
| production build | PASS | `/admin` remains dynamic |
| hygiene | PASS | schema-bezug discloses LOCAL/UNAPPLIED; see §3 |

Wrapper group mix (do not label all 24 as executed SQL):
- SQL: `wrapper-transport-sql` 1, `wrapper-auth-sql` 13, `wrapper-acl-sql` 1
- Catalog (includes executed no-arg rejection): 6
- Static source: 2
- Node cleanup: 1

Historical slice lint: an earlier try/catch JSX construction on this branch produced `npm run lint` exit 1. That was a **slice-introduced** error, later moved out of JSX, and is not a pre-existing baseline defect. This head's delivery-file eslint is exit 0. Repo-wide lint still reports unrelated baseline warnings. Exact-head CI lint after this push is the integration record.

**Not run / not claimed:** authenticated local PostgREST/browser E2E; hosted Admin session; remote DB read/apply; live statistics PASS.

Engine: PostgreSQL **16.15**, explicitly qualified; not Production 17.6. Synthetic renders are not browser E2E. Author run-info is not TL control-plane model inspection.

## 5. Later activation checklist (not this slice)

1. Keep this exact LOCAL wrapper and the unchanged accepted producer.
2. Fresh Production metadata / owner / ACL review before any apply.
3. Carry the existing banned-profile helper-status observation into that review.
4. Rollback is `DROP FUNCTION public.admin_account_counts_v1()`.
5. Production/hosted enablement needs a separate TL-reviewed plan and Product-Owner Production gate.
6. Production promotion must reconcile the LOCAL/UNAPPLIED schema-reference classification.

**Do not mark Ready. Do not merge. STOP FOR INDEPENDENT TL EXACT-HEAD REVIEW.**
