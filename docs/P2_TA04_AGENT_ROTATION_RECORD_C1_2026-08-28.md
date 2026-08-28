# Jetnity – P2-TA-04 C1 Agent Rotation Record

Stand: 28. August 2026  
Workstream: Account / Traveller  
Slice: P2-TA-04 C1 – Traveller write-contract integrity hardening

## Previous generation

`Cursor-Agent: Account plattform audit vorbereitung 6`

Generation 6 completed P2-TA-04 Gate 0. PR #120 is merged; Issue #119 is completed. Generation 6 must not be reused for a new logical slice.

## New generation

`Cursor-Agent: Account plattform audit vorbereitung 7`

Reason for rotation:

- new logical slice after completed Gate 0;
- Product-Owner-approved C1 implementation;
- independent context reconstruction from `main @ 4549846bbbc106cb0a921203e343af6e681ec055`;
- current rotation standard requires a fresh numbered session after a completed slice.

## Scope boundary

Generation 7 is assigned only to **P2-TA-04 C1**.

It is not authorized to:

- start C2;
- REVOKE authenticated table DML;
- change RLS or ownership;
- introduce SECURITY DEFINER;
- change Auth/MFA/AAL;
- start AP-5/AP-6a/AP-7;
- persist passport numbers, scans, MRZ or biometrics;
- apply Production migrations;
- write Production test data;
- start Provider/TW-8/Search/Homepage/Native work.
