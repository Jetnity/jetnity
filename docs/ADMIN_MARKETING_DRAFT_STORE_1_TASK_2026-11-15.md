# Admin Marketing Draft Store 1 — approved Task

Status: **TL APPROVED for bounded Development implementation after this immutable Task commit and Root start signal.** The user has already authorized this work. Root authorizes the own native workflow below, with existing dependencies and PostgreSQL 17; existing CI and protected entry paths remain unchanged.

## Goal and honest delivery boundary

Build the first durable internal campaign/link draft contract as an isolated,
native PostgreSQL candidate plus a strict TypeScript domain boundary. A saved
draft has a stable campaign identity, closed link configuration, immutable
history, compare-and-swap protection and repeat-safe commands. This is useful
independent work while the user signs into Dev and the entry lane owns shared
database integration.

This slice is **UNAPPLIED and not a usable hosted campaign editor**. Do not add a
successful-looking Save button, claim Dev persistence or claim campaign UI
acceptance. Runtime installation/callers require coordinated BG1 catalog,
generated types and scanner integration, followed by an actual authenticated
Dev flow. No alternative metadata or browser-storage implementation is allowed.

## Live baseline and evidence

- Repository: Jetnity; parent Root owns publication/integration. Actual proposed
  writer is `/root/campaigns_2`, with a separate worktree and single-writer branch
  `feat/admin-marketing-draft-store-20261115` after assignment.
- Base: Draft PR #1207, `feat/admin-marketing-links-20261115`, head
  `bf93a20efd486712a8fb38b123a01cb20f11cac9`, tree
  `d3ed3c08c230c173e3f4dac06538baff87eb9e11`. Its description and latest comments
  were read live on 15 November 2026. Only the Vercel deployment comment follows
  the description; there is no newer human scope instruction.
- #1207 already has green full normal CI (run 43718907657) and the closed local
  DE/EN link-generator browser proof. Reuse that evidence; do not rerun its
  review/test matrix as a separate workstream. Positive signed-in Admin/Account
  acceptance remains Root/user work.
- Existing source of URL truth is
  `lib/admin/marketing/links.ts`: targets `home`, `planning`, `inspiration` map to
  `/`, `/planen`, `/entdecken` at `https://jetnity.com`; channels are `newsletter`,
  `instagram`, `partner`, `qr`. Campaign/content markers use lowercase RFC4122
  UUIDv4 values prefixed `cmp-`/`cnt-`.
- Read-only Dev `pg_catalog` inspection on project `yfvbxvijcorffwxbxahl` found no
  public campaign/marketing table or matching campaign/marketing schema/table.
  Matching private content structures are Official Truth tables, not CMS or
  marketing storage. No user, Auth, trip, event or payment rows were read.
  Current migrations/generated schema contain no marketing/campaign contract.
- #1206 is an independent, unapplied editorial CMS candidate. Its private store
  is not an installed generic content store. Its guarded writer and native-test
  patterns may inform this implementation; its tables/files are not owned here.
- Latest inspected #1197 head is
  `d48197f84e992c3b3615c1ed5360bd22c1dfd43b`, unmerged. Protected changed-path sets
  from #1196/#1197/#1198 have no collision with the allowlist below. They do own
  `scripts/db/verwendung.mjs`, `types/supabase.ts` and the existing normal CI
  workflow. Recheck the changed-path intersection immediately before publishing.

## Exclusive allowlist

Only these new paths belong to this Task:

- `lib/admin/marketing/drafts/contract.ts`
- `lib/admin/marketing/drafts/contract.test.ts`
- `scripts/db/admin-marketing-drafts-1/README.md`
- `scripts/db/admin-marketing-drafts-1/schema-candidate.sql`
- `scripts/db/admin-marketing-drafts-1/functions-candidate.sql`
- `scripts/db/admin-marketing-drafts-1/readback.sql`
- `scripts/db/admin-marketing-drafts-1/fixture.ts`
- `scripts/db/admin-marketing-drafts-1/native.test.ts`
- `.github/workflows/admin-marketing-drafts-native.yml`
- `docs/ADMIN_MARKETING_DRAFT_STORE_1_TASK_2026-11-15.md`
- `docs/ADMIN_MARKETING_DRAFT_STORE_1_HANDOFF_2026-11-15.md`

Root approves the separate native workflow as part of this Task publication; it
uses existing repository dependencies and a pinned PostgreSQL 17 service. No
package/lockfile change, migration, existing workflow edit, CMS edit, auth/role
edit, entry file, generated schema or scanner edit is in scope. Do not modify
Root's worktree. Keep execution evidence in the own handoff/PR, not user chat.

## Product/domain contract

1. A draft is shared internal Admin content. `draftId` is a lowercase UUIDv4 and
   never changes. Its public campaign marker is exactly `cmp-<draftId>`. IDs are
   created by an explicit secure creation action, never by rendering/remounting.
2. The editable payload has exactly `label`, `destination`, `channel`,
   `contentId`. Label is trimmed plain text, 1–80 Unicode code points, without
   control characters. It is internal and never enters the generated URL. It is
   a business label; do not claim arbitrary free text is inherently PII-free.
   Destination/channel are the existing closed enums. Content ID is either null
   or an existing-valid `cnt-<UUIDv4>` marker. No arbitrary origin, URL, path,
   query, source/medium, email or customer/trip identifier is accepted.
3. State is only `draft` or `archived`. There is no publish/send/approved state,
   scheduler, spend, provider activation, attribution, consent substitute or
   customer tracking. A draft represents one current link configuration;
   multiple-channel orchestration is outside this slice.
4. Use private current-entry, immutable full-revision and immutable successful
   operation-receipt tables. Every accepted mutation adds exactly one revision
   and advances a positive bigint version once. Keep exact server timestamps
   and verified actor IDs. Version values cross JS/JSON as canonical decimal
   strings, never unsafe numbers. Current data must be reconstructible from its
   immutable revision and ledger; orphaned/mismatched records fail readback.
5. Public URLs are computed using the unchanged existing validated builder.
   Adapt null content ID by omitting the optional existing field. No stored URL
   or new independent URL-building contract becomes authoritative.

## Closed API candidate

Reserve public wrappers `admin_marketing_drafts_read_v1(jsonb)` and
`admin_marketing_drafts_apply_v1(jsonb)`. SQL candidates define them, but this
slice adds no `.rpc()` caller, generated-type claim or scanner exception.

Mutation envelope has exactly `schemaVersion: 1`, `requestId`, `draftId`,
`expectedVersion`, `action`, `payload`. UUIDs are lowercase UUIDv4. Actions:

| Action | Expected version | Payload | Result |
| --- | --- | --- | --- |
| `create` | `"0"` | exact editable payload | new draft revision `"1"` |
| `save` | positive current version | exact editable payload | new draft revision; archived entries reject |
| `archive` | positive current version | `{}` | new archived revision; already archived rejects |
| `restore` | positive current version | `{ "revision": "<positive decimal>" }` | copy that historical configuration to a new draft revision |

Read envelopes use exact action-specific fields: `list` with limit (default20,
max50), optional state and a closed cursor; `get` with draft ID; `history` with
draft ID, limit and optional version cursor. List ordering/cursors preserve full
database timestamp precision plus UUID tie-breaker. History orders by version.
Return strictly validated detached values; no unknown keys, accessors, proxies,
SQL NULL truthiness or unchecked JSON casts establish validity. Empty results
and unavailable storage are different outcomes. The runtime follow-up must use
the existing database-read/Admin load-state convention.

## Rights and durable-write requirements

- Reuse the existing `inhalte-moderieren` capability (moderator or higher) and
  current AAL2; add no role. Establish verified current actor identity, a present
  non-deleted/non-anonymous Auth account and active persisted profile. User
  metadata, client actor values and stale JWT role strings never authorise.
- Reject anonymous/user/creator/AAL1, inactive/blocked/pending/missing profiles,
  deleted/missing Auth accounts and attempted actor substitution. Admin UI
  break-glass does not grant database write authority. Read and replay paths
  recheck current authority too.
- Recheck authority after waiting for the draft lock. Hold appropriate account
  and profile SHARE locks for the mutation so role/status withdrawal serialises
  correctly; KEY SHARE alone does not protect ordinary role/status updates.
- Private tables have RLS enabled and forced, default deny, with no direct
  anon/authenticated/service_role grants. Guarded wrappers have exact grants,
  revoked default PUBLIC execution, fixed `search_path = pg_catalog, pg_temp`,
  schema-qualified names and no dynamic SQL. Model the real trusted owner as
  non-superuser with existing BYPASSRLS; do not add live role attributes or claim
  protection against the trusted owner. Check required existing lock privileges
  read-only before a future hosted activation.
- CAS is exact: two different mutations using one version cannot both commit.
  Entry/revision/receipt writes are one transaction. Rollback leaves none of the
  mutation durable. Returning inside an uncommitted transaction is not success.
- Bind each request ID to actor, action, entry, expected version and the complete
  canonical payload. Identical authorised retry returns the original receipt
  without a second revision. Reuse with any changed bound field rejects. Replay
  after later edits cannot overwrite current data or mislabel its historic
  receipt as the current entry. Concurrent duplicate creates/operations must
  serialize consistently. No hash-only binding.
- Archive/restore never rewrite or delete history. Receipts and revisions are
  immutable; constraints/readback reject missing, inconsistent or invalid chains.

## Validation and evidence

Use one batched correction cycle: collect all failed checks, fix together, then
run the required affected gates. No repeated review rounds on the old green
link generator. No local socket/browser workaround, new service or dependency.

The new mandatory native workflow must execute real PostgreSQL tests, with no
optional skip path. Cover durable read from a fresh connection; closed TS/SQL
inputs and marker/enum parity; direct ACL/RLS and AAL/role/account denial;
forged metadata; post-lock authority withdrawal; concurrent CAS; identical and
different request-ID replays; retry after lost acknowledgement/later advance;
transaction rollback/deferred constraints; immutable complete history and
receipt chain; archive/restore; bounded deterministic pagination; and fixed
search-path protection in a fresh backend. Use the existing proved CMS native
fixture patterns where appropriate without claiming their proof covers new SQL.

Run the normal repository gates once for the completed grouped changes and the
new native workflow on the same final source head. Record actual outcomes and
any skipped checks accurately. Green native CI proves the candidate contract;
it does not prove hosted installation or signed-in campaign acceptance.

## Integration gate and STOP conditions

BG1 globally fingerprints role dependencies. New wrappers/grants require a
coordinated expansion of that protected contract before Dev installation.
Generated types and DB scanner integration are also reserved by the entry lane.
The merge of #1197 alone does not establish compatibility or permission to alter
#1198-owned types. Do not evade any gate with dynamic RPC names, raw HTTP,
service-role use, fake types, Auth/profile metadata, customer/event tables,
Official Truth tables or browser persistence.

Stop and report the concrete collision if the allowed paths, existing identity
helper semantics, permissions, pinned native harness or necessary shared
contract differ. Continue independent contract/docs/native work only within the
published scope. Any expanded file/API/ownership scope requires Root's updated
Task first; this does not require asking Sasa for routine Dev work.

No production, merge, cost, login/2FA, genuine refund, newsletter/ad send or
entry-database change is authorised. No Ready/merge/follow-up writer is implied.
The deliverable is a reviewable Draft candidate with an explicit next step:
coordinated Dev integration, then one authenticated save/reload/history flow.

## Sources consulted before implementation

- Live #1207 description/comments and #1196/#1197/#1198 changed-path inventories.
- Repository AGENTS.md, JETNITY_START_HERE.md and NORMAL operating mode; relevant
  TL/multi-agent Task and ownership contract; current roles/admin guard/scanner.
- #1206 CMS native handoff for the established authority/transaction/BG1 boundary.
- Supabase skill and primary RLS/Auth/security-definer documentation; current
  Supabase changelog, https://supabase.com/changelog.md (15 November 2026 read).
  No new dependency or hosted configuration follows merely from these reads.

## Root publication decisions — 15 November 2026

Root reviewed this concrete Task once before implementation and authorizes only its stated paths on the exact green #1207 base. The shared catalog and coverage copy remain Root-owned; no author edits another workstream. Before each final source publication, compare current #1196–#1198 changed paths. No data, policy, scanner, workflow or permission boundary is weakened to obtain green CI. Runtime blocks stay explicit.

For new mounted browser fixtures, use the already established actual-component setup: replace all required Next build constants and install any tsx name-preservation helper before serialized init callbacks in a single ordered script, including reload. Keep network/storage guards and assertions active. Do not repeat the previously diagnosed bootstrap mistake or re-review old green packages. Collect all actual failures before one grouped correction.

Code authors stop at the owned handoff; Root publishes final source/Draft PRs and performs one bounded independent review plus the required green CI and relevant real execution. User login is never simulated, copied or bypassed. No Production or genuine refund action.
