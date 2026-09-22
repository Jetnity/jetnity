# Admin Account Counts Delivery 1 — STATUS

Stand: 22. September 2026  
Status: **LOCAL DELIVERY IMPLEMENTED / FROZEN FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO PRODUCTION APPLY**

Draft PR: #553  
Branch: `feat/admin-account-counts-delivery-1`  
Binding task: `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_TASK_2026-09-22.md` v1 at seed `6666b02795a080fdb10f73158503e009f7d853c2`  
Authorized / live main / merge-base: `0d4c871867e7c4daac45af4a737cc032723863ae` (#552 evidence-only; **no main drift**)

Cursor-Agent: **Jetnity admin account counts delivery 1**, Generation 1  
Required / actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-3d009635-3ebd-40d6-b47e-dc8328cf309b`  
Session URL: https://cursor.com/agents/bc-3d009635-3ebd-40d6-b47e-dc8328cf309b  
Observed run-info display name: `Jetnity admin account counts delivery`. UI rename was **not** performed.

This persist is not Technical-Lead PASS, not live statistics, and not Production activation.

---

## 1. Goal

Build the local-only application delivery path for the two accepted account measures: SECURITY INVOKER public wrapper, user-session reader, lossless five-field validation, and two accessible measures on existing Admin home. Existing trip panels stay unchanged.

## 2. Implemented

- `scripts/db/admin-account-counts-delivery-1-rpc.sql` — LOCAL/UNAPPLIED `public.admin_account_counts_v1()`, zero-arg, STABLE, SECURITY INVOKER, pinned `search_path`, TEXT transport of the two accepted bigints. PUBLIC/anon/service_role EXECUTE revoked; authenticated only. No migration-directory file.
- `scripts/db/admin-account-counts-delivery-1-local-proof.mjs` plus same-prefix safety test — reuses accepted #550 isolation helpers without editing them.
- `lib/admin/account-counts-delivery/*` — contract, server-only activation, parser, session-bound reader, tests.
- `components/admin/home/AdminAccountCounts.tsx` — server load + isolated Ansicht.
- `app/(admin)/admin/page.tsx` — mounts the section only when the server-side local gate is true.

Incoming #550/#552 files were not edited. Central startup/handoff/status/checkpoint files were not edited (#551 owns them). package/lock/CI/operating-mode/governance were not edited.

## 3. Activation / security

`JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED` must be the exact string `true`, plus `NODE_ENV` `development` or `test`, no Vercel/CI/GitHub Actions marker, and a strictly parsed loopback-only `NEXT_PUBLIC_SUPABASE_URL`. Hosted/Production/Preview/unknown/remote stays disabled even when the flag is set. Disabled means no new section and no RPC. Break-glass is forbidden for counts. Role-backed `konten-verwalten` + current AAL2 is required before the wrapper is invoked. Inner 42501 remains authoritative.

## 4. Schema-reference interaction

`npm run check:schema-bezug` **PASS** (22 tables/views, 25 functions in `types/supabase.ts`). The generated schema does **not** list `admin_account_counts_v1`. Application code therefore calls `client.rpc(ADMIN_ACCOUNT_COUNTS_WRAPPER_RPC)` through a local expected-RPC type extension. A literal `.rpc('admin_account_counts_v1')` **would** fail schema-reference and was not added. The checker and generated types were not weakened. This is not a claim that the unapplied wrapper exists live.

## 5. Verification (this writer)

| Class | Result | Kind |
| --- | --- | --- |
| wrapper SQL | 24/24 PASS | executed disposable PostgreSQL 16.15 |
| wrapper runner safety | 2/2 PASS | Node fail-closed + source |
| application/renderer | 16/16 PASS | activation, parser, reader, synthetic render |
| `npm test` | 3873/3873 PASS | full repo unit suite including the 16 new tests |
| existing auth/capability | 35/35 PASS | AAL2 wiring, capability matrix, DB/app alignment |
| typecheck | PASS | Next 16.3.3 |
| lint (delivery files) | PASS | try/catch JSX construction fixed |
| production build | PASS | `/admin` remains dynamic |
| hygiene | PASS | schema-bezug, dead, exports, deps, api-schutz, operating-mode |

SQL assertion groups: static-source 2, wrapper-transport-sql 1, wrapper-auth-sql 13, wrapper-acl-sql 1, wrapper-catalog 6, cleanup-node 1.

**Not run / not claimed:** authenticated local PostgREST/browser E2E; hosted Admin session; remote DB read/apply; live statistics PASS.

Engine: PostgreSQL **16.15**, explicitly qualified. Major 17 was not in the Ubuntu 24.04 archive. No system cluster was created (`create_main_cluster=false`). Private socket/initdb only.

## 6. Parallelism / drift

#551 remains Draft at observed head `cc1dc599c60adafe5491ecc6fe57417a4cb97b73`, base `0d4c8718`. It still has first integration priority. This writer did not merge, rebase, force-push, or import #551. Live main matches the authorized baseline (**0 behind**).

## 7. Later activation checklist (not this slice)

1. Keep this exact LOCAL wrapper and the unchanged accepted producer.
2. Fresh Production metadata / owner / ACL review before any apply.
3. Carry the existing banned-profile helper-status observation into that review; do not silently change shared semantics here.
4. Rollback is `DROP FUNCTION public.admin_account_counts_v1()`; accepted inner objects stay.
5. Production/hosted enablement needs a separate TL-reviewed plan and Product-Owner Production gate.

**Do not mark Ready. Do not merge. STOP FOR INDEPENDENT TL EXACT-HEAD REVIEW.**
