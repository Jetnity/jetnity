# Jetnity – AP-5-S5 Agent Rotation Record

Stand: 29. August 2026  
Workstream: Account / Security  
Slice: AP-5-S5 – Honest Current Session / Device View

## Previous generation

`Cursor-Agent: Account plattform audit vorbereitung 14`

Generation 14 completed AP-5-S4. PR #160 is merged on `main @ 934d43da`. Generation 14 must not be reused for a new logical slice.

Generation 13 completed AP-5-S3. Generation 10 completed AP-5-S2. Generation 9 completed AP-5-S1. None may author S5.

## New generation

`Cursor-Agent: Account plattform audit vorbereitung 15`

Exact Cursor-Session/Run-ID: `bc-cccd6820-5dfa-4801-8af9-0659f2e26cf2`  
URL: https://cursor.com/agents/bc-cccd6820-5dfa-4801-8af9-0659f2e26cf2  
Observed run title: `Ehrliche aktuelle sitzungsansicht`

Reason for rotation:

- new logical slice after integrated S4;
- Issue #161 is S5 runtime over the existing User-Auth session boundary, not S4 follow-up authoring;
- independent context reconstruction from live baseline `main @ 934d43dae65235486f1a06a50b592468e3546b1c`;
- current rotation standard requires a fresh numbered session after a completed slice.

Cursor exponiert in dieser Session keine programmierbare Rename-/Title-Fähigkeit; der UI-Anzeigename wird deshalb nicht als umbenannt behauptet. Der zugewiesene Name bleibt Repository-/PR-Evidence.

## Scope boundary

Generation 15 is assigned only to **AP-5-S5**.

It is not authorized to:

- list other sessions via Service Role or privileged session schema (AP-5-P2);
- create a session/device registry or persistence;
- change S3 logout scopes or S4 MFA/AAL reconcile;
- require Consumer-AAL2 or change Auth/MFA config;
- start AP-6/AP-7, Provider, TW-8, Search, Homepage or Native work;
- mark Ready or merge.

Review-Fixes für denselben S5-PR müssen dieselbe Generation 15 verwenden.
