# Legacy Supabase Project Decommission – jetnity-bets

Date: 2026-08-30
Issue: #258
Status: COMPLETED / PROJECT PERMANENTLY DELETED

## Product Owner decision

The Product Owner explicitly confirmed that the standalone Supabase project `jetnity-bets` is definitively unused and is not part of current Jetnity.

## Hard scope

Target project only:

- name: `jetnity-bets`
- project ref/id: `jrixsujkzvlvglvcmtia`
- region: `eu-central-1`
- created: `2026-01-02T23:44:08.464872Z`
- before status: `ACTIVE_HEALTHY`

Hard non-scope:

- current Jetnity Production: `qscbgcdmivbbnzrcyegn`
- current Production develop branch: `yfvbxvijcorffwxbxahl`
- any other Supabase project, branch, database, Storage bucket or Auth tenant

## Final live before-image

Verified directly against `jrixsujkzvlvglvcmtia` immediately before deletion:

- public base tables: `0`
- public views: `0`
- public functions: `0`
- Auth users: `1`
- Storage buckets: `0`
- Storage objects: `0`
- Edge Functions: `0`
- database size: `12,094,611` bytes

No user e-mail, token, API key or secret value is recorded in this evidence.

## Pause attempt

A reversible pause was attempted first and Supabase rejected it before any state change because the project belongs to a paid organization:

`Project is not free-tier. Please downgrade it to free-tier first and try again.`

No state change occurred from this failed pause attempt.

## Permanent deletion

Permanent deletion was executed only through the official Supabase Management API and only for exact target `jrixsujkzvlvglvcmtia`.

One-shot GitHub Actions execution:

- workflow run: `33319410943`
- workflow head: `71c9de2e9fe2b96f2c884f0094242b4d7b0d9caa`
- repository guard: `Jetnity/jetnity`
- branch guard: `ops/decommission-jetnity-bets-2026-08-30`
- target guard: `jrixsujkzvlvglvcmtia`
- target name guard: `jetnity-bets`
- Production exclusion: `qscbgcdmivbbnzrcyegn`
- credential source: existing GitHub secret `SUPABASE_ACCESS_TOKEN`; secret value was never printed or committed
- pre-delete Management API GET: exact target/name required
- delete endpoint: only `/v1/projects/jrixsujkzvlvglvcmtia`
- post-delete Management API GET: required `404`
- job conclusion: `success`

The one-shot workflow file was removed immediately after successful execution and is not part of the final documentation-only branch state.

## Independent after-image

After the Management API deletion, Supabase was queried independently through the connected project API.

Result:

- `jetnity-bets` / `jrixsujkzvlvglvcmtia`: absent from project list
- remaining Supabase projects: exactly current `Jetnity's Project` / `qscbgcdmivbbnzrcyegn`
- current Production status: `ACTIVE_HEALTHY`
- Production main branch/ref remains `qscbgcdmivbbnzrcyegn`
- Production develop branch remains `yfvbxvijcorffwxbxahl`, `ACTIVE_HEALTHY`

Therefore the legacy standalone project is deleted and current Jetnity Production/develop were not targeted by the operation.

## Irreversibility / recovery

Project deletion is permanent at Supabase level. Supabase states that database data, Auth data, Storage, backups, Functions and configuration become unrecoverable after deletion.

Deletion was performed only after the Product Owner explicitly confirmed the project is definitively unused and the final live before-image showed no current Jetnity application data structures or Storage content.

The repository and issue #258 preserve the decision, target identity, before-image, failed pause evidence, exact execution mechanism, workflow run, and independent after-image.
