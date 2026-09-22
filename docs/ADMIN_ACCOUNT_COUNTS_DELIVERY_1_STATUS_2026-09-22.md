# Admin Account Counts Delivery 1 — STATUS

Stand: 22. September 2026  
Status: **RESIDUAL R1 EFFECTIVE-TARGET CORRECTION / FROZEN FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD RE-REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO PRODUCTION APPLY**

Draft PR: #553  
Branch: `feat/admin-account-counts-delivery-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_TASK_2026-09-22.md` v1 at seed `6666b02795a080fdb10f73158503e009f7d853c2`  
Reviewed product head that left residual R1: `dcf7bfee497ba3aa2038a43fe4bc2a09e541625f` (review 5284045489)  
Addendum v3: `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_REVIEW_FIX_2_TASK_2026-09-22.md` at `86f5d4847fe3c8779d137ba110b04207c9468577`  
Authorized exact-main sync / live main / merge-base: `ff054f76c14cf1c434890ba342af4df5e536dd05`  
Original task baseline remains recorded: `0d4c871867e7c4daac45af4a737cc032723863ae`

Cursor-Agent: **Jetnity admin account counts delivery 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-3d009635-3ebd-40d6-b47e-dc8328cf309b`  
Observed run-info display name: `Jetnity admin account counts delivery`. UI rename was **not** performed.

This persist is not Technical-Lead PASS, not live statistics, and not Production activation. Reviewed head `dcf7bfee` is **not** this residual fix.

---

## 1. Residual R1 correction

The accepted R2/R3/R4 implementation on `dcf7bfee` is preserved. The remaining defect was a second environment capture in the activation module. That copy was not the earlier captured URL used by `createServerComponentClient`.

This package:

- Adds only `getServerSupabaseUrl()` to `lib/supabase/server.ts`. It returns the existing `SUPABASE_URL` constant. Factories still pass that same constant. No key getter, setter, reconfiguration, new client, cookie, identity, role or AAL change.
- Makes `isAdminAccountCountsRuntimeEnabled()` consume that getter instead of `ADMIN_ACCOUNT_COUNTS_MODULE_SUPABASE_URL`.
- Keeps the runtime loader no-argument. A leftover synthetic env argument still cannot enable the path.
- Rejects before guard / cookies / client / RPC when the current process snapshot or the effective shared target is not local.

This is **not** a Production incident. Normal Production/default-off controls already passed on the reviewed head.

## 2. Activation / security

Runtime enablement still requires the exact flag `true`, `NODE_ENV` `development`|`test`, no Vercel/CI/GitHub Actions marker, a current loopback process URL **and** a loopback effective shared-client URL. Hosted/Production/Preview stay disabled even when the flag is set. Disabled means no new section and no RPC.

## 3. Schema-reference LOCAL/UNAPPLIED coverage (unchanged R3)

`npm run check:schema-bezug` reports generated-schema coverage **and** discloses `LOCAL/UNAPPLIED RPC admin_account_counts_v1 from lib/admin/account-counts-delivery/reader.ts → scripts/db/admin-account-counts-delivery-1-rpc.sql (not in generated schema)`. That remains a reviewed local-reference classification, not installation.

## 4. Verification after the residual R1 correction (this writer)

| Class | Result | Kind |
| --- | --- | --- |
| wrapper checks | 24/24 PASS | **new execution** of the unchanged disposable harness; mixed: 15 SQL + 6 catalog including executed no-argument rejection + 2 source + 1 Node cleanup |
| wrapper runner safety | 2/2 PASS | Node fail-closed + source |
| application/module tests | 36/36 PASS | 6 activation + 6 isolated actual-loader/default-component + 7 parser + 10 reader + 3 Ansicht renders + 4 checker |
| `npm test` | 3893/3893 PASS | full repo unit suite including the 36 delivery tests |
| existing auth/capability | 35/35 PASS | unchanged shared helpers |
| existing SSR factory contract | 3/3 PASS | `lib/next/request-api-compat.test.ts` factories still await cookies and use `SUPABASE_URL` |
| typecheck | PASS | Next 16.3.3 |
| lint (delivery files + shared getter) | PASS | pre-existing unused-arg warnings in cookie adapters unchanged |
| production build | PASS | `/admin` remains dynamic |
| hygiene | PASS | schema-bezug discloses LOCAL/UNAPPLIED; dead/exports include isolated harness files |

Do not collapse those 36 tests into one class:

- Isolated harness tests exercise the **actual** exported `loadAdminAccountCounts()` and the **actual** default `AdminAccountCounts` component with the real shared factory and intercepted `@supabase/ssr` transport.
- Reader helper tests can still inject `runtimeEnabled` and do **not** replace those entrypoints.
- The 3 `render.test.ts` cases render `AdminAccountCountsAnsicht` from a prepared result. They are not the default component and not browser E2E.
- Wrapper 24 remains 15 SQL + 6 catalog + 2 source + 1 Node cleanup. Historical transcripts stay dated evidence; this persist also has a new 24/24 execution.

**Not run / not claimed:** authenticated local PostgREST/browser E2E; hosted Admin session; remote DB read/apply; live statistics PASS.

Engine: PostgreSQL **16.15**, explicitly qualified; not Production 17.6. Author run-info is not TL control-plane model inspection.

## 5. Later activation checklist (not this slice)

1. Keep this exact LOCAL wrapper and the unchanged accepted producer.
2. Fresh Production metadata / owner / ACL review before any apply.
3. Carry the existing banned-profile helper-status observation into that review.
4. Rollback is `DROP FUNCTION public.admin_account_counts_v1()`.
5. Production/hosted enablement needs a separate TL-reviewed plan and Product-Owner Production gate.
6. Production promotion must reconcile the LOCAL/UNAPPLIED schema-reference classification.

**Do not mark Ready. Do not merge. STOP FOR INDEPENDENT TL EXACT-HEAD RE-REVIEW.**
