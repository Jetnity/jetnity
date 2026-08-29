# Jetnity – AP-5-S4 Agent Rotation Record

Stand: 29. August 2026  
Workstream: Account / Security  
Slice: AP-5-S4 – Account Security MFA Step-up

## Previous generation

`Cursor-Agent: Account plattform audit vorbereitung 13`

Generation 13 completed AP-5-S3. PR #157 is merged on `main @ 5920860e`. Generation 13 must not be reused for a new logical slice.

Generation 12 completed AP-7-S1. Generation 10 completed AP-5-S2. Generation 9 completed AP-5-S1. None may author S4.

## New generation

`Cursor-Agent: Account plattform audit vorbereitung 14`

Exact Cursor-Session/Run-ID: `bc-d8fd980a-b4e5-43e1-8a38-a1480fd65132`  
URL: https://cursor.com/agents/bc-d8fd980a-b4e5-43e1-8a38-a1480fd65132  
Observed run title: `Ap-5-s4 mfa-step-up abmeldung`

Reason for rotation:

- new logical slice after completed/integrated S3;
- Issue #158 is S4 runtime over the existing User-Auth MFA API, not S3 follow-up authoring;
- independent context reconstruction from live `main @ 5920860e164784040118667091ebcaca79f9b33d`;
- current rotation standard requires a fresh numbered session after a completed slice.

Cursor exponiert in dieser Session keine programmierbare Rename-/Title-Fähigkeit; der UI-Anzeigename wird deshalb nicht als geändert behauptet. Der zugewiesene Name bleibt Repository-/PR-Evidence.

## Scope boundary

Generation 14 is assigned only to **AP-5-S4**.

It is not authorized to:

- add session/device listing (S5);
- require Consumer-AAL2 or change login MFA from skippable;
- push Auth config or activate Passkeys/OAuth;
- start C2 / REVOKE / SECURITY DEFINER;
- change RLS, ownership, identity or schema;
- use Service Role;
- write Production data;
- start AP-6/AP-7, Provider, TW-8, Search, Homepage or Native work;
- mark Ready or merge.

Review-Fixes für denselben S4-PR müssen dieselbe Generation 14 verwenden.
