# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B1R CLOSED & POST-MERGE VERIFIED / NO ACTIVE ENTRY-REQUIREMENTS RUNTIME SLICE / LIVE-EVIDENCE WINS**

> **Vor jedem neuen Slice zuerst Live-Stand, Duplicate-/Integration-/Truth-/Security-Grenzen und betroffene Persistenz verifizieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_CLOSED_2026-08-31.md` ← **aktuellster Entry-Requirements Closure-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_REVIEW_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_TASK_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_HANDOFF_2026-08-31.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md`
8. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
9. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Storage-/Migration-/Persistenzannahmen zusätzlich Supabase live prüfen.

## 2. Canonical main at E5-B1R closure

`main@4edfb014a5e0e717a0667536600a1bf6bbbe0361`

Commit:
`Merge E5-B1R ephemeral provider timezone evidence (#332)`

Post-merge evidence:

- Main push CI #1505 / Run `33414833898`: **SUCCESS** on exact merge SHA;
- Vercel Production: **SUCCESS** on exact merge SHA;
- Issue #330: **CLOSED / completed**;
- Parent #294 remains open;
- no E5-B2/follow-up auto-started.

Final main must still be re-read live at every continuation.

## 3. E5-B1R final history

Issue:
**#330 – Entry Requirements E5-B1R – ephemeral provider-observed airport timezone evidence**

Logical Cursor Agent:
**`Jetnity entry requirements provider timezone evidence 1`**, Generation 1

Session:
`bc-cc301dee-cb64-42b9-a6e9-9968f3db8a09`

Agent runtime+handoff head:
`ae75178d617271808d8738ff64f81ed54caf7a80`

Final integration head:
`7c7390584228b02b864bca106ccde5e71fe3dd70`

Independent TL verdict:
**PASS / no P0/P1/P2 findings.**

Original Draft PR #331:
**CLOSED / NOT MERGED** after the known GitHub Ready connector `Repository.fullDatabaseId` failure.

Identical non-draft recovery PR #332:
**MERGED** with expected-head guard after its own gates.

Recovery CI #1504: SUCCESS. Vercel: READY/SUCCESS. Review threads: 0. Vercel unresolved feedback: 0.

## 4. What E5-B1R delivers

Only **ephemeral provider-observed airport timezone companion evidence** on the active server-side `FlugProviderTreffer` seam.

Evidence is deterministically linked by:

- option ID;
- leg index;
- segment index;
- endpoint `departure | arrival`;
- exact airport IATA;
- provider-observed timezone identifier.

Duffel mints it only from a structured airport object with explicit `time_zone`.

No IATA/country/city/name lookup. No numeric-offset fallback. `Intl` is used only for bounded timezone-identifier recognition, not conversion.

The adapter filters evidence to retained offers. `fluegeSuchen()` deliberately does not expose evidence to ranking or the browser.

## 5. Hard non-scope still binding

Timezone is still not part of:

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
- DST ambiguity/gap resolver;
- Trip/Route -> event occurrence resolver;
- E5-A auto-binding;
- workspace deadline/urgency state machine;
- task persistence/completion;
- reminder/push/e-mail/notification runtime;
- real Requirements provider;
- credential/passport ranking.

`requirementsProviderAus()` remains `null`.

## 6. Binding provenance rule

The abandoned first attempt remains invalid:

- Issue #327: CLOSED / not_planned;
- PR #328: CLOSED / NOT MERGED;
- discarded head `fdf05f26928dfc556cc3b3b954eb3c61981b29c4` is not an ancestor of E5-B1R.

Production-live verification established:

> **Persisted does not mean provider-proven.**

Owner-writable `trip_items.metadata` does not establish provider provenance.

Future persistent timezone/event provenance requires technically enforced server-owned write authority. Production DB/RLS/grant/trigger/write-authority changes trigger the special Product-Owner gate.

## 7. Product / Traveller truth unchanged

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller → multiple citizenships → multiple travel documents/credentials → context-dependent evaluated options.**

No default/primary/preferred/chosen passport or citizenship. Issuer Country != Citizenship. No Residence -> Nationality inference. No `documents[0]` / `evaluations[0]` as product truth.

Account Registry = reusable current traveller facts.
Trip Snapshot = only current truth for a concrete trip.

## 8. Entry Requirements foundation now present

Provider-neutral foundation:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence.

E5-A still requires an already explicitly bound absolute event instant. E5-B1R does not resolve one.

## 9. Product-Owner gates

Special PO gates remain for:

- provider/vendor/DPA/contracts/secrets/paid calls/live activation;
- Production migrations/RLS/ownership/grants/triggers/server-owned write-authority changes;
- fundamental Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health data;
- real payments;
- running infrastructure cost outside approved budget;
- public launch / irreversible external activation.

## 10. FIRST NEXT ACTION

**No Entry Requirements runtime slice is active.**

Before any next slice:

1. reconstruct final live main, PRs/issues, CI/Vercel;
2. read the E5-B1R closure and Entry Requirements target architecture;
3. run fresh Duplicate-/Integration-/Truth-/Security-/Persistence precheck;
4. determine smallest responsible next slice and its differentiation/enabler justification;
5. if persistent server-owned timezone/event provenance is required, stop at the Production DB/Security Product-Owner gate;
6. version task + continuity before any agent dispatch;
7. do not infer E5-B2 or another follow-up automatically.

**Live-Evidence wins always.**
