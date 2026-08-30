# Legacy Supabase Project Decommission – jetnity-bets

Date: 2026-08-30
Issue: #258
Status at this commit: BEFORE-IMAGE / NOT YET DELETED

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

Verified directly against `jrixsujkzvlvglvcmtia` immediately before decommission preparation:

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

Supabase documentation states that paid projects cannot currently be paused. A project can instead be permanently deleted through the Dashboard, Supabase CLI or Management API.

## Approved execution method

Permanent deletion is allowed only through the official Supabase Management API and only for exact target `jrixsujkzvlvglvcmtia`.

The one-shot executor must:

1. run only in repository `Jetnity/jetnity` on branch `ops/decommission-jetnity-bets-2026-08-30`;
2. use existing GitHub secret `SUPABASE_ACCESS_TOKEN` without printing it;
3. hard-code the target ref and separately hard-code Production ref;
4. fail if target equals Production;
5. GET the target first and verify returned id/ref and name `jetnity-bets`;
6. DELETE only `/v1/projects/jrixsujkzvlvglvcmtia`;
7. verify a subsequent GET returns `404`;
8. never touch `qscbgcdmivbbnzrcyegn` or `yfvbxvijcorffwxbxahl`;
9. be removed from the branch immediately after successful execution.

## Irreversibility / recovery

Project deletion is permanent at Supabase level. Supabase states that database data, Auth data, Storage, backups, Functions and configuration become unrecoverable after deletion.

For this reason deletion was not attempted until the Product Owner explicitly confirmed the project is definitively unused and the final live before-image above showed no current Jetnity application data structures or Storage content.

The repository and issue #258 preserve the decision, target identity, before-image and execution evidence. Current Jetnity Production remains the recovery source for the actual Jetnity product and is explicitly outside this operation.
