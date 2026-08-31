# Jetnity – Active Work Status

Stand: 31. August 2026
Status: **CURRENT / E5-A CLOSED / E5-B1 BLOCKER CLOSED / E5-B1R RUNTIME REVIEW PASS / PR #331 FINAL INTEGRATION GATES PENDING / LIVE-EVIDENCE WINS**

## 1. Current main during review

`main@7fdd06f983a47afbbb28313479adf4e81fb9a359`

Commit:
`Close E5-B1 trust-boundary blocker continuity (#329)`

Ruleset `Jetnity main protection` / ID `21875372` is active with:

- PR required;
- strict up-to-date required checks;
- Conversation Resolution;
- `Typecheck, Lint & Build`;
- `Auth-Konfiguration gegen config.toml`;
- `Vercel`;
- merge-only;
- bypass empty.

Main must still be re-read immediately before merge.

## 2. Active integration slice

Issue:
**#330 – Entry Requirements E5-B1R – ephemeral provider-observed airport timezone evidence**

Parent:
**#294 – Entry Requirements Detail Architecture**

Draft PR:
**#331**

Branch:
`feat/entry-requirements-ephemeral-timezone-evidence-e5b1r-2026-08-31`

Binding task:
`docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_TASK_2026-08-31.md`

Logical Cursor agent:
**`Jetnity entry requirements provider timezone evidence 1`**, Generation 1

Session:
`bc-cc301dee-cb64-42b9-a6e9-9968f3db8a09`

Agent status:
**DELIVERED / STOPPED FOR TL REVIEW / NO READY / NO MERGE / NO FOLLOW-UP**.

## 3. Independent Technical-Lead review

Canonical review:
`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_REVIEW_2026-08-31.md`

Agent runtime+handoff head reviewed:
`ae75178d617271808d8738ff64f81ed54caf7a80`

Verdict:
**PASS for bounded E5-B1R runtime scope. No P0/P1/P2 findings.**

Verified on that exact reviewed head:

- CI #1500 / Run `33411397098`: SUCCESS;
- Auth job SUCCESS;
- Typecheck/Lint/Tests/Hygiene/Production Build job SUCCESS;
- Vercel SUCCESS / READY;
- GitHub review threads 0;
- Vercel unresolved feedback 0;
- branch 5 ahead / 0 behind current main;
- abandoned #328 head not an ancestor.

The TL-owned continuity updates after that review create a newer docs-only head. Therefore the old exact-head CI/Vercel results are review evidence only. The newest PR head must be fully re-gated before Ready/Merge.

## 4. What E5-B1R adds

Only a server-side ephemeral companion evidence contract on the active `FlugProviderTreffer` seam.

Evidence is linked by:

- final `optionId`;
- `legIndex`;
- `segmentIndex`;
- `departure | arrival` endpoint;
- exact IATA;
- provider-observed timezone identifier.

Duffel mints evidence only from a structured airport object with explicit `time_zone`.

No IATA/country/city/name/offset fallback.

Identifier validation is bounded and uses runtime `Intl` recognition without performing timezone conversion.

Adapter filtering keeps evidence only for options retained by the existing offer cap.

`fluegeSuchen()` deliberately ignores evidence before ranking/client serialization.

## 5. Hard non-scope / no false completion

Timezone is still not part of:

- `FlugSegment`;
- `FlugOption` / `BewerteteFlugOption`;
- browser response;
- route itinerary;
- trip metadata;
- `flugNachweis` / account adoption;
- Supabase.

Still absent/inactive:

- persistent trusted timezone/event provenance;
- local wall-clock + IANA -> absolute instant;
- DST ambiguity/gap resolution;
- Trip/Route→event occurrence resolver;
- E5-A auto-binding;
- concrete workspace deadline/urgency runtime;
- task persistence/completion;
- reminder/push/e-mail/notification runtime;
- real Requirements provider;
- credential ranking.

`requirementsProviderAus()` remains `null`.

## 6. Abandoned first E5-B1 attempt

Issue #327: CLOSED / not_planned.

PR #328: CLOSED / NOT MERGED.

Discarded head:
`fdf05f26928dfc556cc3b3b954eb3c61981b29c4`

Independent comparison against E5-B1R shows the branches diverged from merge-base `6928ea637133ff91cfb207cfd5b1175fecbc9699`; the discarded head is not an ancestor.

Binding rule:

> **Persisted does not mean provider-proven.**

Owner-writable `trip_items.metadata` cannot become provider provenance merely because it was later read from the database.

Persistent server-owned timezone/event provenance is future DB/Security architecture and triggers a Product-Owner gate if Production schema/RLS/grants/triggers/write authority are changed.

## 7. Traveller / product truth remains unchanged

> **1 Traveller → multiple citizenships → multiple travel documents/credentials → context-dependent evaluated options.**

No default/primary/preferred/chosen passport or citizenship. Issuer Country ≠ Citizenship. No Residence→Nationality inference. No `documents[0]` / `evaluations[0]` as product truth.

Account Registry = reusable current traveller facts.
Trip Snapshot = only current truth for a concrete trip.

Jetnity remains a Travel Operating System for the concrete trip, not a set of isolated search tools.

## 8. Entry Requirements foundation

Provider-neutral foundation currently present:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence pending integration through PR #331.

E5-A still requires an already explicitly bound absolute event instant. E5-B1R does not yet resolve one.

## 9. Product-Owner gate assessment

No special PO gate is triggered by E5-B1R itself because it adds no Production DB/RLS/Auth/secret/provider activation/paid call/persistence/new infrastructure/public launch.

Stop before any later persistent server-owned timezone/event provenance if it needs Production DB/Security changes.

## 10. Next action

1. Read PR #331 newest exact head.
2. Verify changes after reviewed runtime head `ae75178d...` are only TL continuity/review docs.
3. Verify newest head is 0 behind current main.
4. Require exact-head CI Auth + Typecheck/Lint/Build + Vercel SUCCESS.
5. Require zero unresolved review threads.
6. If all green: Technical Lead may Ready + merge #331 using expected-head guard.
7. Post-merge verify main CI and Vercel Production.
8. Close #330 only after post-merge verification and persist closure continuity.
9. **Do not auto-start E5-B2 or any follow-up.**

**Live-Evidence wins always.**
