# Editorial CMS native candidate — SQL/domain handoff

Status: **UNAPPLIED CANDIDATE; SOURCE AND INDEPENDENT REVIEW COMPLETE;
NATIVE AND COMPLETE NORMAL CI PENDING.** No working CMS, hosted installation or Admin/public
runtime feature is claimed.

## Identity and file ownership

- Base: #1200 `ac10784a3bc9f0440cdf0e2a45d8391b1034b0dc`.
- Task secured before implementation: commit
  `56037fb4d1c45f9419d3ef720b2b5a52cfda4532`, tree
  `aa9fc713a2194f7495ba5bb4b6ab1d2e38004968`.
- Local branch: `feat/admin-editorial-cms-native-20261115`.
- SQL/domain/docs: `/root/product_audit`; independent fixture/native-test/new
  workflow: `/root/journey_audit`; read-only SQL review: `/root/admin_audit`.
- Root is the sole publisher/integrator. This writer created no remote ref or PR.

The task, package README, two SQL candidates, catalog readback and
`lib/admin/content/cms/{contract.ts,contract.test.ts}` are the implementation
scope. Native files are separately owned and are not represented as reviewed
or executed by the SQL writer merely because they share this worktree.

## Implemented contract

Three private structures preserve the existing four inspiration identities,
immutable complete revisions and immutable successful operation receipts.
Only description, planning idea and ordered themes are editable. Reference
identity does not approve source authority, image rights or travel facts.

Commands save a draft, publish exactly its current revision, archive without
deleting history, or restore a historical version as a new draft. State version
CAS, an entry lock, full global request-ID binding and one transaction protect
concurrent writes and retries. A new receipt is inserted before the entry
pointer advances, so both deferred and immediate FK checking are compatible.
No tentative return inside an open transaction is called a durable success.

Operations CHECKs require closed JSON key sets, exact field types, fixed
schema/status, full identity/version binding, action-specific revision pointers
and exact database receipt time. Checks must evaluate TRUE; missing keys and
SQL NULL do not establish valid evidence. Immutable triggers reject history
UPDATE/DELETE/TRUNCATE. Composite FKs bind draft/public/last-operation pointers
to their own entry and state.

Admin reads support exact previews and bounded revision keyset pagination.
The public reader exposes only explicit non-archived published snapshots and
their actual publication time, never draft history, actor IDs or receipts.
Confirmation returns only the caller's own receipt or unknown.

## Security and database boundary

The unchanged existing capability proves persisted role and current AAL2.
Feature-local checks additionally require the same present non-deleted,
non-anonymous account and persisted active profile. Writers recheck after an
entry-lock wait and hold account/profile SHARE locks; KEY SHARE would not
protect role/status updates. Replay is never historical authorization.

The trusted execution-owner assumption is explicit: **postgres is not a
superuser and does have BYPASSRLS**. Root's read-only Dev role metadata confirmed
exactly this on 15 November 2026; anon/authenticated have neither property and
service_role has BYPASSRLS without superuser. The synthetic fixture must model
these distinctions. This is not a new live role attribute or proof that a
superuser fixture is equivalent. Client ACL denial remains required even for
service_role; private RLS is enabled/forced/default-deny. All function names are
qualified, search_path is fixed and no dynamic SQL is introduced.

On **15 November 2026**, Root separately confirmed by read-only Dev metadata
that the existing postgres owner has SELECT on auth.users,
UPDATE(auth.users.id), and SELECT on public.profiles. No grants changed. These
are prerequisites for the candidate's account/profile SHARE locks, not proof
that the candidate was installed or exercised on a hosted target.

No live DDL, grant, role, guard, Auth configuration, provider or Production
action occurred. No service-role key/client is used. The package is outside
`supabase/migrations/` and has no runtime RPC caller or generated-schema claim.
Existing protected #1196/#1197/#1198 files remain untouched.

Hosted activation remains BLOCKED by the exact shared BG1 role-dependency
catalog, including the latest REFRESH-RETIREMENT1 comparison, and reserved
types/scanner integration. A coordinated reviewed expansion, Dev installation
and later actual mounted UI acceptance are still required. This package does
not restore the removed blog platform or bypass that dependency.

## Local check record and complete correction groups

Initial source: 10/10 domain tests, full TypeScript and scoped ESLint passed.
Root review then identified NULL-tolerant operation comparisons. The grouped
correction replaced them with strict request/receipt validators and IS TRUE,
and added descriptor-based input snapshots/accessor refusal/proxy containment.

After that correction:

- Domain tests: 12/12 pass, zero skips/cancellations.
- Scoped ESLint: zero errors/warnings.
- All five API/schema/dead-code/export/dependency gates passed.
- Diff whitespace check passed.
- Full TypeScript found one descriptor-array inference error at contract.ts:54:
  the mapped descriptor array gave `length` a number type.

Independent source review by `/root/admin_audit` completed the correction group:
the descriptor call now receives the truthful object type; initial caller
authorization precedes nontrivial JSON validation; and every new routine uses
explicit `search_path = pg_catalog, pg_temp`. The last change prevents implicit
temporary-schema precedence for unqualified PL/pgSQL body types. The actual
existing authority functions remain unchanged. The independent native writer
adds a fresh-backend temporary-domain regression, qualifying only its explicitly
synthetic Auth-claims primitives so those fixture helpers do not introduce a
separate type-shadowing artifact. This is not a change to hosted Auth.

After that complete correction group, the affected local checks passed:

- Domain contract: 12/12 tests, zero failures/skips/cancellations.
- Full TypeScript: `tsc --noEmit --incremental false`, exit 0.
- Scoped ESLint: exit 0, no errors or warnings.
- Diff whitespace check: exit 0.

The five static gates above passed before the final descriptor/auth-order/search
path correction; Root's integrated gates still bind the eventual published head.

The parser tests prove exact existing catalog reuse, all action shapes, closed
inputs, exact bigint text, scalar/UTF-8 boundaries, malformed Unicode/control
refusal, canonical themes, detached values, never-invoked accessors and contained
throwing/revoked proxies. They are not SQL transaction/RLS evidence.

No local PostgreSQL/socket/browser process was started. No native PASS,
integrated CI PASS or Production build is claimed by this checkpoint.
The independent native group and Root's integrated gates remain pending.

## Final SQL/domain source identity

The local working-tree bytes after the collected correction are:

| File | SHA256 |
| --- | --- |
| `scripts/db/admin-editorial-cms-1/schema-candidate.sql` | `91be00d0ee8302887632d3f0e283b5a61407bb2be059a44d5cd073d0ab8e72b0` |
| `scripts/db/admin-editorial-cms-1/functions-candidate.sql` | `64c809ec41d5ed1484b555b7f730d347ddf40db019ba3cd707ba267182da4f1f` |
| `lib/admin/content/cms/contract.ts` | `78e7239e5ff0b375e499a3e883043068d157f90c8764af1e57203398a32f8031` |
| `lib/admin/content/cms/contract.test.ts` | `f5c46a5e4a5c6ed01c907a33815e9fe73a1492371c4c4ee088b7b1875f55ecc6` |

The independent source review identified the correction group; Root performs
the final comparison against these corrected bytes. No review of an earlier
source identity is represented as approval of a later commit.

## Remaining work and stop boundary

Root has completed the source comparison described below and must bind the published candidate to its
complete native PostgreSQL17 CI. Native failures must be reported and corrected together;
missing PostgreSQL is not a successful skip. Root owns publication and final
verification. No Ready, merge, hosted activation, new costs, login/2FA or
follow-up slice is authorized here.

## Root integration checkpoint before publication

The immutable task matches its original SHA256
`0ad55e316089333d5d6ad3fde4ca2a92d48346d6fdc56c284baebe1e54372973`.
Review clarifications remain in this handoff rather than changing that task.
Root independently read the corrected SQL/domain bytes above and the native
regressions below. No material source finding remains in this review.

The native suite has **25 independent scenario groups**. In addition to actual
transaction, lock-wait, replay, privilege, lifecycle, paging and cleanup cases,
it checks every candidate routine's exact safe search path and four fresh
authenticated backends with deliberately shadowing temporary domains. Each
trap is positively exercised before the real candidate calls. Synthetic claim
primitives and test argument casts are qualified; existing extracted authority
definitions stay byte-identical. The late-failure probe runs after the final
entry UPDATE, observes its revision and operation inside the transaction,
requires the specific injected error, and then proves full three-table rollback
and an unknown receipt before explicit retry. Unauthorized callers with
semantically malformed input are denied before feature validation; PostgreSQL's
native input-parser boundary is separately acknowledged.

| Additional source | SHA256 |
| --- | --- |
| `scripts/db/admin-editorial-cms-1/fixture.ts` | `800a28401f35f924cbd1b50d845ea784b4dccb347a143d8478d3976269b64712` |
| `scripts/db/admin-editorial-cms-1/native.test.ts` | `1f1d111ac2c8e82914617b7450ee49e9d771d3bcb4476586b90154bb469ec22a` |
| `.github/workflows/admin-editorial-cms-native.yml` | `279d4ebbb510d5a8af3b040dd20c64421452ab98562d143a890c6a964a3922a3` |

Both native TS files have passed explicit TypeScript checking and scoped lint;
the workflow YAML is valid. Its complete PostgreSQL17 provisioning step is
byte-identical to the existing reviewed CI step (9,913 bytes). The new workflow
uses read-only repository permission, the actual local PostgreSQL17 binary,
all 25 groups and ownership-bound cleanup. No existing workflow, required-test
selector or entry file is altered. The normal Core selector includes the pure
domain tests; the new workflow separately requires actual native execution.
All five static gates were rerun successfully on the corrected integrated
source. Full ESLint also completed with zero errors and the same 193 baseline
warnings. Full normal CI/build and the separate native workflow must both pass;
static checks are not native or Hosted acceptance.

Root created only the task-backed feature branch and its two existing Dev
public Supabase variables, scoped to this branch and Vercel target `preview`.
Readback verified exactly those two keys, the existing Jetnity project and no
Production target. No new service or cost was introduced. The automatic
Preview must be bound to the eventual source head; it contains no active CMS
writer because the candidate is deliberately not wired or installed.

Fresh protected-lane review finds #1197 at
`4845dc7f547d784c4c31d9dd2108c2119411e7ad`, still open and unmerged with 415
protected paths. Its intervening change does not alter the BG1 catalog or
Refresh-Retirement comparison; global protected-role dependencies still block
an uncoordinated CMS installation. #1196/#1198 remain at their earlier heads
and main remains `63544e820e912bd275556588c956a09b99b1cf90`. There is no path
overlap with this candidate. #1202 and real-money refunds retain Sasa's holds.

The next concrete activation package must integrate the guarded schema,
generated types and scanner, then add actual authenticated Admin editing and
public published reads with full UI acceptance. That work requires the entry
lane's coordinated integration; this native candidate is not a finished CMS or
a whole-system release for 30 November. Root's current user authorization
continues to cover independent Development follow-on work, with merges,
Production, logins/2FA and new costs remaining with Sasa.
