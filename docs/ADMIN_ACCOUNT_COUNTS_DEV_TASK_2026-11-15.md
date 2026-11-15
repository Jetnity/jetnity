# Admin account counts — isolated Dev activation

## Authority, baseline and ownership

Sasa authorizes all necessary Dev work without another permission question. Production, merges, new costs and login/2FA remain with Sasa. This task applies that current authorization to the existing count feature; historical local-only tasks remain historical evidence, not a new permission gate.

Baseline: main `63544e820e912bd275556588c956a09b99b1cf90`. Independent branch `feat/admin-account-counts-dev-20261115`, beside #1199/#1200/#1201. Root is the sole writer; Admin audit reviews source/SQL and Product audit reviews the resulting proof. Task must be versioned before implementation. Normal operating mode and the already read project vision, architecture, decisions, quality/design and continuity standards apply.

## Product result

The existing two exact account measures can be read in the confirmed Dev environment by the existing authorized moderator-or-higher, active, nonanonymous caller with AAL2. The card shows the database observation time and 720-hour window with honest population caveats. A denied, missing or failed read is never a fabricated zero. This closes a real Admin capability; it adds no customer travel-graph feature.

The accepted producer, public RPC name/signature, parser, counting population and security/caller-status contract stay unchanged. This is not visitor analytics, conversion, active-user measurement or Production activation.

## Confirmed preflight, 15 November

Supabase branch metadata identifies `develop`, non-default `yfvbxvijcorffwxbxahl`, parent `qscbgcdmivbbnzrcyegn`, ACTIVE_HEALTHY. Read-only Dev metadata shows PostgreSQL 17.6; reporting schema/producer/wrapper absent; required Auth/profile columns and constraints present; postgres NOSUPERUSER+BYPASSRLS already has auth.users SELECT, client roles do not.

The existing profile-integrity function is already installed by its owning lane: source SHA256 `b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d`, owner postgres, SECURITY INVOKER, search_path=pg_catalog; trigger `profiles_autoritaet_integritaet_v1`, type 27, enabled O; only postgres EXECUTE. It must be verified, never modified or installed by this task. Existing account capability is moderator-or-higher AND AAL2.

No account identities, user rows, credentials or account counts were read for this preflight. No Auth action or database mutation has occurred.

## Implementation scope

- Add a separate default-off Dev flag to the feature-local activation path. Require an explicitly identified Vercel Preview, the pinned Jetnity project/branch as appropriate, and exact `https://yfvbxvijcorffwxbxahl.supabase.co` equality for both current ENV and captured shared-client target. Production, missing/unknown/conflicting targets and local-flag-only hosted calls stay disabled. Preserve existing local activation.
- Reuse the current reader, caller-status gate, parser and literal RPC call. Do not edit protected shared factories, guards, types, scanners, schemas or #1196/#1197/#1198 paths.
- Update the count-card copy to describe a controlled environment snapshot accurately; no new whole-dashboard redesign or duplicate metrics.
- Add a dedicated Dev installation composer/package outside automatic Production migration discovery. Pin the unchanged producer/wrapper file hashes. Require a fresh namespace/function-name state and the confirmed guard/owner/ACL prerequisites. Install and verify in a single atomic statement/transaction; reject incompatible or pre-existing objects instead of replacing them. Do not use the local fixture bootstrap on a hosted target.
- Use source-body hashes and explicit signature/configuration/ACL checks portable to PostgreSQL 17, not the historical PG16 pretty-printer hash. No new privilege role, client auth.users SELECT, managed-Auth policy change or jetnity_internal grant.
- The original SQL files remain unchanged. The composer changes exactly three DDL heads to strict CREATE (schema, producer, wrapper) so a concurrent creator cannot be overwritten. Bodies remain byte-identical; new object comments identify the actual Dev activation. The same portable SQL supports engines 16/17 for isolated native proof; the actual API call separately requires freshly confirmed Dev PG17.6. Core CI currently proves engine 16, never a PG17 or GoTrue session.
- Apply only after source review and meaningful local/CI evidence, using Supabase apply_migration with the explicit confirmed Dev project_id and a fresh branch identity check. Record the exact SQL hash, migration identity and postconditions. No destructive cleanup or data migration.
- Scope any Vercel configuration exclusively to this new branch's Preview. Reuse only the existing Dev public API configuration. Do not copy Production secrets, enable providers or models, change project-wide variables, touch another branch, create paid services or promote a deployment.

Expected owned paths: feature activation and its tests/harness, AdminAccountCounts presentation and focused render tests, a new feature-local Dev installation/composer/native-proof package, and dedicated task/handoff. Other required changes require explicit scope review, not silent overlap.

## Verification and risks

Test default-off, exact Dev allow, Production and malformed/unknown targets, both captured/current URL mismatches, zero transport on denial, and existing AAL2/active-status/error contracts. Native synthetic SQL proof must execute the exact installer with isolated fixtures, confirm permitted/refused roles and unchanged source privileges, reject stale prerequisites and prove atomic rollback. Fixtures never run on hosted Dev.

Use existing dependencies and existing core CI discovery; no workflow/package/type change. Collect every failure before a correction batch. Do not retry blocked local Chromium/PostgreSQL; normal existing CI supplies those capabilities. Independently review the final published head.

Live Dev validation is limited to metadata and genuine uncredentialed denied calls unless a legitimate already authorized AAL2 session is available. Never forge a hosted JWT/claim or create/login an account. A positive authenticated browser check remains with Sasa; label it not run if unavailable. Existing token-revocation behavior is not changed or newly guaranteed.

Document changes and evidence in the Draft PR/handoff. Draft stays Draft. No merge, Production action, new cost or login/2FA.
