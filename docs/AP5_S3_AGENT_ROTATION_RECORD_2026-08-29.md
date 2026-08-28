# Jetnity – AP-5-S3 Agent Rotation Record

Stand: 29. August 2026  
Workstream: Account / Security  
Slice: AP-5-S3 – Account Security Logout Scopes

## Previous generation

`Cursor-Agent: Account plattform audit vorbereitung 12`

Generation 12 completed AP-7-S1. PR #145 is merged. Generation 12 must not be reused for a new logical slice.

Generation 10 completed AP-5-S2. Generation 9 completed AP-5-S1. Neither may author S3.

## New generation

`Cursor-Agent: Account plattform audit vorbereitung 13`

Reason for rotation:

- new logical slice after completed S2 and later Account/Ops work;
- Issue #153 is S3 runtime over the existing Auth-Logout-Scopes, not S2 follow-up authoring;
- independent context reconstruction from live `main @ 3c3079defb4eb5bcea4b8cb0ec8d73eff7806c9a`;
- current rotation standard requires a fresh numbered session after a completed slice.

Cursor exponiert in dieser Session keine programmierbare Rename-/Title-Fähigkeit; der UI-Anzeigename wird deshalb nicht als geändert behauptet. Der zugewiesene Name bleibt Repository-/PR-Evidence.

## Scope boundary

Generation 13 is assigned only to **AP-5-S3**.

It is not authorized to:

- add MFA challenge/verify step-up (S4);
- add session/device listing (S5);
- require Consumer-AAL2;
- change default logout from `global` to `local` (P1);
- push Auth config or activate Passkeys/OAuth;
- start C2 / REVOKE / SECURITY DEFINER;
- change RLS, ownership, identity or schema;
- use Service Role;
- write Production data;
- start AP-6/AP-7, Provider, TW-8, Search, Homepage or Native work;
- mark Ready or merge.
