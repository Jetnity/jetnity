# Jetnity – AP-5-S2 Agent Rotation Record

Stand: 28. August 2026  
Workstream: Account / Traveller  
Slice: AP-5-S2 – eingeloggte Passwortänderung über Reauthentication

## Previous generation

`Cursor-Agent: Account plattform audit vorbereitung 9`

Generation 9 completed AP-5-S1. PR #133 is merged; Issue #132 is completed. Generation 9 must not be reused for a new logical slice.

## New generation

`Cursor-Agent: Account plattform audit vorbereitung 10`

Reason for rotation:

- new logical slice after completed S1;
- Issue #136 is S2 runtime over the existing Auth contract, not S1 follow-up authoring;
- independent context reconstruction from live `main @ 0256905cee3e6705156ce642839983daf8b0709a`;
- current rotation standard requires a fresh numbered session after a completed slice.

## Scope boundary

Generation 10 is assigned only to **AP-5-S2**.

It is not authorized to:

- change logout semantics (S3);
- add MFA challenge/verify step-up (S4);
- add session/device listing (S5);
- require Consumer-AAL2;
- push Auth config or activate Passkeys/OAuth;
- invent a current-password submit;
- start C2 / REVOKE / SECURITY DEFINER;
- change RLS, ownership, identity or schema;
- write Production data;
- start AP-6/AP-7, Provider, TW-8, Search, Homepage or Native work.
