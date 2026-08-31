# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B2A CLOSED & POST-MERGE VERIFIED / NO ACTIVE ENTRY-REQUIREMENTS RUNTIME SLICE / LIVE-EVIDENCE WINS**

## 1. Current canonical runtime main at closure cut

`main@4b503aa41fec9eaf8119d64fcbbfee9953f169a6`

Commit:
`Merge E5-B2A airport event instant resolution (#336)`

Post-merge verification:

- Main push CI #1515 / Run `33419480637`: **SUCCESS** on exact runtime merge SHA;
- Vercel Production: **SUCCESS** on exact runtime merge SHA;
- Issue #334: **CLOSED / completed**;
- Parent #294 remains open;
- no E5-B2B/follow-up runtime slice has been started.

This file is being updated in a docs-only closure branch. After that closure merges, canonical `main` will advance without changing Runtime behavior and must be re-read live.

Ruleset `Jetnity main protection` / ID `21875372` remains the canonical main governance: PR required, strict required CI/Auth/Vercel, Conversation Resolution, merge-only, bypass empty.

## 2. E5-B2A closure

Issue:
**#334 – Entry Requirements E5-B2A – ephemeral airport event instant resolution**

Logical Cursor agent:
**`Jetnity entry requirements airport event instant 1`**, Generation 1

Session:
`bc-2f16caec-271e-4911-ac36-5abc36ab0806`

Agent runtime + handoff head:
`4d7e1d002eba06490da59cb4416c55229e8cb559`

Independent TL review:
**PASS / no P0-P1-P2 findings.**

Final integration head after TL continuity only:
`20da6d3e3ce087af240d67a6009ff55e01ad0d69`

Canonical Runtime merge:
`4b503aa41fec9eaf8119d64fcbbfee9953f169a6`

Canonical closure document:
`docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md`

## 3. PR / recovery history

Draft PR #335:
**CLOSED / NOT MERGED**.

Reason: known Ready connector GraphQL schema bug `Repository.fullDatabaseId` after independent exact-head TL PASS and green final-head gates.

Protection was not weakened.

Recovery PR #336:
**MERGED**, identical exact head, non-draft, expected-head guarded.

Recovery own gates:

- CI #1514 / Run `33419133410`: SUCCESS;
- Auth: SUCCESS;
- Typecheck/Lint/Tests/Hygiene/Production Build: SUCCESS;
- Vercel: READY / SUCCESS;
- GitHub review threads: 0;
- Vercel unresolved feedback: 0.

## 4. What E5-B2A now provides on main

Only an **ephemeral server-side airport event-instant companion evidence** contract at the active `FlugProviderTreffer` seam.

Input truth is limited to:

- exact normalized airport-local `FlugSegment` date/time;
- exact E5-B1R provider-observed IANA timezone evidence.

Identity is revalidated through:

- option ID;
- leg index;
- segment index;
- endpoint `departure | arrival`;
- exact endpoint IATA.

Civil-time semantics:

- unique mapping -> canonical UTC `...Z` instant;
- DST gap -> explicit `nonexistent_local_time`, no instant;
- DST overlap -> explicit `ambiguous_local_time`, no instant;
- invalid date/time/timezone/identity -> explicit fail-closed issue / no instant;
- no IATA/country/city/name/server/browser timezone inference;
- no silent earlier/later/compatible selection;
- no local-wall-clock `Z` append.

No new npm dependency, provider, secret, paid call or live activation.

## 5. Runtime / client / persistence boundary

Timezone and instant evidence remain absent from:

- `FlugSegment`;
- `FlugOption` / `BewerteteFlugOption`;
- browser/client response;
- route itinerary;
- trip metadata;
- account adoption / `flugNachweis`;
- Supabase.

Duffel resolves only after retained-option filtering. Invalid/unresolvable event evidence does not discard a valid flight offer. `fluegeSuchen()` deliberately exposes neither timezone nor event-instant evidence to ranking/client serialization.

## 6. Entry Requirements foundation

Provider-neutral foundation currently present:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution.

E5-A still is not automatically bound to Trip/Route events. E5-B2A does not create persistent trusted event truth.

## 7. Hard non-scope / still inactive

- persistent server-owned trusted timezone/event provenance;
- Trip/Route -> OfficialTemporalAnchor occurrence resolver;
- E5-A automatic binding;
- workspace deadline/action-window/urgency runtime;
- task persistence/completion;
- reminder/push/e-mail/notification runtime;
- real Requirements provider;
- credential/passport ranking.

`requirementsProviderAus()` remains `null`.

## 8. Binding provenance rule

Issue #327 remains CLOSED / not_planned; PR #328 remains CLOSED / NOT MERGED.

> **Persisted does not mean provider-proven.**

Owner-writable Trip metadata cannot establish provider provenance. Persistent trusted timezone/event provenance requires technically enforced server-owned write authority. Production DB/RLS/grant/trigger/write-authority changes require the special Product-Owner gate.

## 9. Traveller / product truth unchanged

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

No default/primary/preferred/chosen passport or citizenship. Issuer Country != Citizenship. No Residence -> Nationality inference. No `documents[0]` / `evaluations[0]` as Product Truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = only current truth for a concrete trip.

## 10. Product-Owner gates

Special gates remain for provider contracts/secrets/paid/live activation, Production migration/RLS/ownership/grants/triggers/server-owned write authority, fundamental Auth/MFA/AAL, sensitive passport/MRZ/scan/biometric/health data, real payments, running costs outside approved budget and public launch/irreversible external activation.

## 11. Next action

**No active Entry Requirements runtime slice. No E5-B2B auto-start.**

After this docs-only closure is integrated:

1. reconstruct live `main`, open PRs/issues, CI/Vercel before any next work;
2. read the E5-B2A closure + target architecture;
3. run a fresh Duplicate/Integration/Truth/Security/Persistence precheck;
4. determine the smallest responsible next slice;
5. stop at the Product-Owner gate if persistent trusted event/timezone provenance requires Production DB/security changes;
6. version task + continuity before agent dispatch;
7. independently review/gate every resulting head;
8. do not infer or automatically start E5-B2B.

**Live-Evidence wins always.**
