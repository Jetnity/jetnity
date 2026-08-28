# Jetnity – AP-5 Gate 0 Agent Rotation Record

Stand: 28. August 2026  
Workstream: Account / Traveller  
Slice: AP-5 Gate 0 – Account security capability audit

## Previous generation

`Cursor-Agent: Account plattform audit vorbereitung 7`

Generation 7 completed P2-TA-04 C1. PR #126 is merged; Issue #122 is completed. Generation 7 must not be reused for a new logical slice.

## New generation

`Cursor-Agent: Account plattform audit vorbereitung 8`

Reason for rotation:

- new logical slice after completed C1;
- Issue #128 is a Gate-0 audit, not C1 follow-up;
- independent context reconstruction from live `main @ 0bca31b5de06bcee74c5436122b1685b6d2092f6`;
- current rotation standard requires a fresh numbered session after a completed slice.

## Scope boundary

Generation 8 is assigned only to **AP-5 Gate 0**.

It is not authorized to:

- implement AP-5 runtime;
- start C2;
- REVOKE authenticated table DML;
- introduce SECURITY DEFINER;
- push Auth config;
- require Consumer-AAL2;
- activate OAuth/Passkeys;
- change RLS, ownership or identity;
- write migrations or Production data;
- persist passport numbers, scans, MRZ or biometrics;
- start AP-6/AP-7, Provider, TW-8, Search, Homepage or Native work.
