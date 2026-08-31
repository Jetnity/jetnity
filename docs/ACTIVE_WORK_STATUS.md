# Jetnity – Active Work Status

Stand: 31. August 2026
Status: **CURRENT / E5-B1R CLOSED & POST-MERGE VERIFIED / NO ACTIVE ENTRY-REQUIREMENTS RUNTIME SLICE / LIVE-EVIDENCE WINS**

## 1. Current canonical main at closure

`main@4edfb014a5e0e717a0667536600a1bf6bbbe0361`

Commit:
`Merge E5-B1R ephemeral provider timezone evidence (#332)`

Post-merge verification:

- Main push CI #1505 / Run `33414833898`: **SUCCESS** on exact merge SHA;
- Vercel Production: **SUCCESS** on exact merge SHA;
- Issue #330: CLOSED / completed;
- Parent #294: remains open;
- no follow-up runtime slice has been started.

Ruleset `Jetnity main protection` / ID `21875372` remains the canonical main governance: PR required, strict required checks, Conversation Resolution, merge-only, bypass empty.

Final main must still be re-read live before every future action.

## 2. E5-B1R closure

Issue:
**#330 – Entry Requirements E5-B1R – ephemeral provider-observed airport timezone evidence**

Logical Cursor agent:
**`Jetnity entry requirements provider timezone evidence 1`**, Generation 1

Session:
`bc-cc301dee-cb64-42b9-a6e9-9968f3db8a09`

Agent runtime+handoff head:
`ae75178d617271808d8738ff64f81ed54caf7a80`

Final integration head:
`7c7390584228b02b864bca106ccde5e71fe3dd70`

Canonical merge SHA:
`4edfb014a5e0e717a0667536600a1bf6bbbe0361`

Independent TL review:
**PASS / no P0/P1/P2 findings.**

Canonical closure:
`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_CLOSED_2026-08-31.md`

## 3. PR recovery history

Draft PR #331:
**CLOSED / NOT MERGED**.

Reason: known Ready connector GraphQL schema bug `Repository.fullDatabaseId` after exact-head TL PASS.

Protection was not weakened.

Recovery PR #332:
**MERGED**, identical exact head, non-draft, expected-head guarded.

Recovery own gates:

- CI #1504 / Run `33414527677`: SUCCESS;
- Auth: SUCCESS;
- Typecheck/Lint/Tests/Hygiene/Production Build: SUCCESS;
- Vercel: READY / SUCCESS;
- GitHub review threads: 0;
- Vercel unresolved feedback: 0.

## 4. What E5-B1R now provides on main

Only an **ephemeral server-side provider-observed airport timezone evidence** contract at the active `FlugProviderTreffer` seam.

Evidence binds exact normalized flight endpoints through:

- option ID;
- leg index;
- segment index;
- `departure | arrival`;
- exact IATA;
- provider-observed timezone identifier.

Duffel mints it only from structured airport endpoints carrying explicit `time_zone`.

No IATA/country/city/name lookup or numeric-offset fallback.

Identifier recognition is bounded and uses runtime `Intl` only as validation. No local-time conversion occurs.

The adapter filters evidence to retained offers; `fluegeSuchen()` does not expose it to browser/client output.

## 5. Hard non-scope / still missing

Timezone remains absent from:

- `FlugSegment`;
- `FlugOption` / `BewerteteFlugOption`;
- browser response;
- route itinerary;
- trip metadata;
- account adoption / `flugNachweis`;
- Supabase.

Still absent/inactive:

- persistent trusted timezone/event provenance;
- local wall-clock + IANA -> absolute instant resolver;
- DST ambiguity/gap handling;
- Trip/Route -> event occurrence resolver;
- E5-A automatic binding;
- workspace deadline/urgency state machine;
- task persistence/completion;
- reminders/push/e-mail/notifications;
- real Requirements provider;
- credential/passport ranking.

`requirementsProviderAus()` remains `null`.

## 6. Binding provenance rule

Abandoned first attempt remains invalid:

- Issue #327 CLOSED / not_planned;
- PR #328 CLOSED / NOT MERGED;
- discarded head `fdf05f26928dfc556cc3b3b954eb3c61981b29c4` is not an ancestor.

Binding rule:

> **Persisted does not mean provider-proven.**

Owner-writable trip metadata cannot establish provider provenance.

A future persistent timezone/event provenance layer requires technically enforced server-owned write authority. If Production DB/RLS/grants/triggers/write authority must change, stop at the special Product-Owner gate.

## 7. Traveller / product truth remains unchanged

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller → multiple citizenships → multiple travel documents/credentials → context-dependent evaluated options.**

No default/primary/preferred/chosen passport or citizenship. Issuer Country != Citizenship. No Residence -> Nationality inference. No `documents[0]` / `evaluations[0]` as product truth.

Account Registry = reusable current traveller facts.
Trip Snapshot = only current truth for a concrete trip.

## 8. Entry Requirements foundation

Provider-neutral foundation currently present:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence.

E5-A still projects only an already explicitly bound absolute event instant. E5-B1R does not yet resolve one.

## 9. Product-Owner gates

Special gates remain for provider contracts/secrets/paid/live activation, Production migration/RLS/ownership/write-authority changes, fundamental Auth/MFA/AAL, sensitive document/biometric/health data, real payments, running costs outside approved budget, and public launch/irreversible external activation.

## 10. Next action

**No active Entry Requirements runtime slice. No E5-B2 auto-start.**

Before any next runtime work:

1. reconstruct live main/open PRs/issues/CI/Vercel;
2. read E5-B1R closure + target architecture;
3. fresh Duplicate/Integration/Truth/Security/Persistence precheck;
4. determine smallest responsible next slice;
5. stop at PO gate if persistent server-owned timezone/event provenance requires Production DB/Security change;
6. version task and continuity before agent dispatch;
7. independently review/gate every resulting head.

**Live-Evidence wins always.**
