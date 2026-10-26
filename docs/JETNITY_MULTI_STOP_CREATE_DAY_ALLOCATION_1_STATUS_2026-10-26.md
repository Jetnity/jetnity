# R109-T — Multi Stop Create Day Allocation 1 — STATUS

Date: 26 October 2026.

Writer: **Jetnity Multi Stop Create Day Allocation 1 — Cursor Generation 1**.  
Session: https://cursor.com/agents/bc-a0a82333-7855-4ba7-b641-39af97c78458  
Model: `grok-4.7-high-fast`. Not Auto.

## State

Implementation is on `feat/r109-multi-stop-create-day-allocation-1`, Draft PR #1030. Accepted main `68435f012f27f599a1092699f5635aa88312ea67` is merged with history preserved. The integrated proof commit is `cdd2282ba5c82e492ce17cd0bc741d7fc4bfa58d`. No TL PASS. Not Ready. Not merged to main.

Guest and Account create can assign existing calendar days to confirmed destination occurrences. Without that choice, several destinations stay unassigned and one destination stays `single_destination`. Known days follow occurrence order. Null gaps stay null. Hotel nights and transfers are not inferred.

An interval longer than 366 inclusive calendar days is rejected before the capped day builder and before any create writer. The Rückreise field shows `Eine Reise umfasst höchstens 366 Kalendertage, einschließlich Abreise und Rückreise.` and receives focus. A real 366-day interval is described as 366 days. The stored-reader sentence stays `Eine Reise dauert höchstens 365 Tage`. The allocation summary does not describe a shortened interval as the whole journey.

Create and import entry points reject oversized known collections before Zod `safeParse`. Zod is not claimed to be remediated anywhere else. Package files were not edited.

Operating mode is NORMAL. Re-read of `origin/main` before the merge was exactly `68435f012f27f599a1092699f5635aa88312ea67`, tree `9f05dce58c9ad800c324db014e98a8aeb5039481`. It had not moved past that accepted pin. The merge-base after the merge is that pin. This branch is ahead of it by the existing task commits plus the merge. Package files were not edited. `package.json` matches accepted main. The installed lock is ws 8.21.0 and source-map-js 1.2.2.

## Not verified

Hosted `public.reise_anlegen()` was not called. Account proof is the payload `TripPlanner` passes into `reiseAnlegen`, then `createKontoTage` and the frozen `alsNutzlast` mapping. Full post-create Account stage mutation remains out of scope because `reise_aendern` does not update the assignment mode.

Local PostgreSQL 16 binaries are absent in this session, so the existing suite's disposable-database proofs fail closed. That is an environment limit, not a hosted readback.

## Next actor

Root's independent review of the integrated head. Hosted CI and Preview for that head are pending. Do not mark Ready. Do not merge. Do not start a follow-up slice.
