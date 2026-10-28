# UX V1 U3-B — PLAN

28 October 2026. Attested before the first source edit in PR comment https://github.com/Jetnity/jetnity/pull/1071#issuecomment-6457930314.

Session `Jetnity UX V1 Country Empty States 1 — Cursor Generation 1`. `run-info.originalModelName=grok-4.7-high-fast`. `bcId=bc-c9a9425d-101a-4d89-a8b7-d488d8730f3c`. URL https://cursor.com/agents/bc-c9a9425d-101a-4d89-a8b7-d488d8730f3c.

Seed at planning time: HEAD `46083280b896b4256eeb73aa9c9e9c43596c0101`, tree `8347d92fc2bef91e5ca514e9c577480c0db4d8a1`, merge-base and `origin/main` `7ee00c69d38553c5a5778945ba3db3aea6361dd8`, ahead 2 / behind 0, mode NORMAL. The only pre-implementation diff was the immutable task. Its blob `e132b018a7a3cef2fd236bd7ed03a62872d129ac` stayed equal to the seed commit.

## Decision

Group only a contiguous run of two or more stages whose entry domain is the existing neutral empty shape for the same catalog country code and the same country label. Show one sentence: `Einreiseinformationen {countryLabel} noch nicht geprüft`. Keep every stage id, date, safety block, season block, detail and link.

A later country reentry starts a new run. Thailand → Cambodia → Thailand therefore stays two Thai visits. A return that itself has several consecutive empty Thai stages may share copy inside that return only.

`lib/trips/destination-essentials.ts` is not changed. The existing projection already carries the fields the helper needs. A new derived truth field is not required.

The existing all-empty compact path stays the trip-level collapse. It is not reimplemented and does not use the new country sentence.

## Non-goals

No Official Truth decision, no visit merge, no geocoding, no guest/account fork, no network, no shared `ACTIVE_WORK_STATUS.md`, no U1-A shell files, no Ready and no merge.
