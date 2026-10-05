# Jetnity – AP-5-S1 Agent Rotation Record

Stand: 28. August 2026  
Workstream: Account / Traveller  
Slice: AP-5-S1 – ehrliche Security-UI Zustände und Fehlerhygiene

## Previous generation

`Cursor-Agent: Account plattform audit vorbereitung 8`

Generation 8 completed AP-5 Gate 0. PR #129 is merged; Issue #128 is completed. Generation 8 must not be reused for a new logical slice.

## New generation

`Cursor-Agent: Account plattform audit vorbereitung 9`

Reason for rotation:

- new logical slice after completed Gate 0;
- Issue #132 is S1 runtime hygiene, not Gate 0 follow-up authoring;
- independent context reconstruction from live `main @ eaa03ad71509d281990e0d34ca359e0750eb9591`;
- current rotation standard requires a fresh numbered session after a completed slice.

## Scope boundary

Generation 9 is assigned only to **AP-5-S1**.

It is not authorized to:

- implement AP-5-S2 password change or `reauthenticate()` / nonce;
- change logout semantics (S3);
- add MFA challenge/verify step-up (S4);
- add session/device listing (S5);
- require Consumer-AAL2;
- push Auth config or activate Passkeys/OAuth;
- start C2 / REVOKE / SECURITY DEFINER;
- change RLS, ownership, identity or schema;
- write Production data;
- start AP-6/AP-7, Provider, TW-8, Search, Homepage or Native work.
