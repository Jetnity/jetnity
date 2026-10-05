# Admin Account Counts Delivery 1 — Review-Fix 1 / Task Addendum v2

Date: 2026-09-22
Status: TL AUTHORIZED SAME-SESSION R1–R4 CORRECTION / NOT READY / NO LIVE ACTIVATION
Parent: `docs/ADMIN_ACCOUNT_COUNTS_DELIVERY_1_TASK_2026-09-22.md` v1 (unchanged).
Binding TL review: https://github.com/Jetnity/jetnity/pull/553#pullrequestreview-5283659145
Reviewed product head: `d1d18daca96bb72c4ed6645c46b765e867bd5615`.
Accepted main / merge-base: `ff054f76c14cf1c434890ba342af4df5e536dd05`; mode NORMAL.
PR / branch: **#553** / `feat/admin-account-counts-delivery-1`.
Agent: **Jetnity admin account counts delivery 1**, Generation **1**.
Existing session: **bc-3d009635-3ebd-40d6-b47e-dc8328cf309b**.
Required model: **cursor-grok-4.6-high-fast**, no Auto or substitution.

This is the immediate correction of the same delivery, not a new product slice, new agent, Production approval, broad audit or framework upgrade. All parent constraints remain binding except the single explicitly expanded checker ownership below. Both task documents are TL-owned; the agent must not rewrite them. This addendum itself changes the PR head; prior exact-head CI is historical and must be rerun on the final corrected head.

## Required corrections

Implement R1–R4 from review5283659145 as one consolidated package. The review contains exact input/output counterexamples and evidence boundaries. Preserve accepted producer/bootstrap/earlier evidence byte-for-byte and keep all hosted environments disabled.

**R1 — real loader containment.** Remove the runtime loader's ability to replace the actual environment with a caller-supplied local/test environment while invoking real dependencies. Pure environment evaluation may remain injectable for tests. The actual entrypoint must use the real runtime and the effective Supabase target; test it with dependency instrumentation and zero-call assertions in disabled/hosted/remote cases. Do not create another Supabase client implementation, accept browser inputs, or edit shared auth/client modules. If configuration capture cannot be aligned inside owned code, report the precise shared boundary rather than widening it.

**R2 — strict producer transport validation.** Validate timestamp shape and real calendar/time/offset values rather than accepting any string Date.parse normalizes. Preserve valid PostgreSQL JSON timestamps, including explicit non-UTC offsets and fractional seconds through six digits. Reject impossible dates, unsupported excess precision and intervals differing from720hours at microsecond precision. Keep original valid timestamp strings for display. Counts are canonical decimal representations of nonnegative signed PostgreSQL bigint: maximum9223372036854775807, present>=1, window<=present. Bound input length before conversion. Preserve9007199254740993 and the maximum exactly. No accepted SQL changes or caller-supplied clock/filter.

**R3 — explicit schema-reference coverage.** The previous constant-based call is invisible to the literal scanner. Do not preserve a test that requires that invisibility. Restore a scanner-visible literal wrapper call or equivalent explicitly inspected reference; the dependency must appear in inventory. A local expected RPC type remains allowed but is not a live generated-schema claim.

**R4 — honest failure semantics and real entrypoint tests.** Use structured error/denial codes. A missing relation42P01 is failed, not proof that the wrapper is absent. Preserve missing-wrapper unavailable and genuine forbidden separately. Do not use a generic 'does not exist' substring to claim absent producer. Preserve existing lookup-failed/aal-lookup-failed distinctions; contain thrown guard/client/RPC errors without numeric success or loss of other Admin panels. Exercise actual load/component wiring with controlled dependencies, not only the pure reader helper. No shared role/AAL semantics change.

## One limited ownership expansion for R3

The same agent may now additionally modify **`scripts/db/verwendung.mjs` only**, to represent the exact local-unapplied dependency honestly. This supersedes the parent's read-only restriction for this one file and purpose. Keep package.json, lockfile, CI workflows, generated types, operating-mode/guard/rulesets and all other shared files unchanged.

Required properties of this bounded checker change:

1. Keep all existing ordinary unknown-table/RPC checks fail-closed. No directory ignore, generic prefix/name whitelist, catch-all allowance, silent pass or environment-toggle bypass.
2. Record **only** `public.admin_account_counts_v1` (scanner name `admin_account_counts_v1`) from the exact runtime source **`lib/admin/account-counts-delivery/reader.ts`** as **LOCAL/UNAPPLIED**, separately from structures in generated types. Bind it to the expected local SQL path `scripts/db/admin-account-counts-delivery-1-rpc.sql` and documented default-off/hosted-disabled delivery contract. This is an explicit reviewed local-reference classification, not assertion of installation.
3. Missing local SQL, unexpected RPC name, the same local name in another runtime file, or an ordinary unknown table/function must still fail. Inventory and --pruefen output must disclose the local-unapplied reference and must not say that it exists in the live/generated schema. Do not add the function to `types/supabase.ts` or a migration to make checks green.
4. Use existing dependencies only. Do not broaden this into an AST/scanner overhaul or a second schema registry. Keep the exception small and auditable. Later Production promotion must reconcile this local-only classification explicitly; this task cannot authorize that promotion.
5. Add executable regression tests under the already-owned `lib/admin/account-counts-delivery/` test area so the normal unit suite runs them. Test the actual checker with isolated temporary git fixtures or an equivalently honest injectable input boundary. Include positive registered-local classification and negative unknown-name, wrong-source-path and missing-SQL controls. Synthetic fixture types are test-only, never changes to generated production types. Do not hide real application calls from the scanner.

If these properties require another shared file, stop at that exact boundary and report it. No blanket permission to change hygiene or governance.

## Evidence repair within the same delivery

Update owned STATUS/HANDOFF/SELF_REVIEW and existing evidence once. Label the24 prior wrapper checks as mixed categories rather than24 executed SQL assertions. Keep historical results historical. The JSX lint error belonged to this slice; do not label it pre-existing. Distinguish final CI lint success from local commands that were not rerun. Rerun meaningful local SQL, application/renderer, new schema-checker regression, auth/capability and required hygiene/build checks. Keep PostgreSQL16.15 vs Production17.6 and missing authenticated PostgREST/browser E2E explicit.

TL independently ran blob-verified parser/activation/contract/reader sources with instrumented shared dependencies under Node22.16.0. Those are application counterexamples, not SQL or browser evidence. Production was queried only for catalogs in a READ ONLY transaction: all new count objects absent; auth.users RLS unchanged; no account data read. Do not use that receipt as agent permission for remote access.

## Parallelism, freeze and STOP

Decision SINGLE_AGENT: this is one same-session correction touching one coupled delivery contract and one explicitly scoped checker. A second writer would create overlap. No other agent, duplicate session, PR, branch or continuity respin. #550/#552/#551 are closed and must not be reactivated. Main is already synchronized; do not rebase/force/reset/merge later main without an exact new TL instruction.

Freeze one corrected head after the whole package. Report exact main/merge-base/ahead/behind, full changed-path allowlist (including the now-authorized checker), model/session, executable repros and truthful test categories. Then fresh exact-head CI/Auth/Preview and independent TL re-review. No Ready, PR merge, follow-up, remote DB/query/apply, hosted flag/configuration, privileges, providers/secrets/paid calls, new infrastructure, budget increase, legal/identity/launch/domain or money action.

**Do not mark Ready. Do not merge. Do not start another agent or follow-up slice. STOP FOR INDEPENDENT TL EXACT-HEAD RE-REVIEW.**
