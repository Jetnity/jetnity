# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026  
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-B2A CLOSED & POST-MERGE VERIFIED / NO ACTIVE ENTRY-REQUIREMENTS RUNTIME SLICE / LIVE-EVIDENCE WINS**

> **Vor jedem neuen Slice zuerst Live-Stand, Duplicate-/Integration-/Truth-/Security-Grenzen und betroffene Persistenz verifizieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_CLOSED_2026-08-31.md` ← **aktuellster Entry-Requirements Closure-Checkpoint**
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B2A_REVIEW_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_HANDOFF_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_AIRPORT_EVENT_INSTANT_E5B2A_TASK_2026-08-31.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_CLOSED_2026-08-31.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md`
8. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
9. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Storage-/Migration-/Persistenzannahmen zusätzlich Supabase live prüfen.

## 2. Canonical runtime main at E5-B2A closure

Runtime main before this docs-only closure:

`main@4b503aa41fec9eaf8119d64fcbbfee9953f169a6`

Commit:
`Merge E5-B2A airport event instant resolution (#336)`

Post-merge evidence:

- Main push CI #1515 / Run `33419480637`: **SUCCESS** on exact runtime merge SHA;
- Vercel Production: **SUCCESS** on exact runtime merge SHA;
- Issue #334: **CLOSED / completed**;
- Parent #294 remains open;
- no E5-B2B or other runtime follow-up auto-started.

After this docs-only closure PR is merged, re-read `main` live because the canonical main SHA will advance without changing runtime behavior.

## 3. E5-B2A final history

Issue:
**#334 – Entry Requirements E5-B2A – ephemeral airport event instant resolution**

Logical Cursor Agent:
**`Jetnity entry requirements airport event instant 1`**, Generation 1

Session:
`bc-2f16caec-271e-4911-ac36-5abc36ab0806`

Agent runtime + handoff head:
`4d7e1d002eba06490da59cb4416c55229e8cb559`

Independent Technical-Lead verdict:
**PASS / no P0-P1-P2 findings.**

Final integration head after TL continuity only:
`20da6d3e3ce087af240d67a6009ff55e01ad0d69`

Original Draft PR #335:
**CLOSED / NOT MERGED** after the known GitHub Ready connector `Repository.fullDatabaseId` failure.

Identical non-draft recovery PR #336:
**MERGED** with expected-head guard after its own gates.

Recovery CI #1514: SUCCESS. Vercel: READY/SUCCESS. GitHub review threads: 0. Vercel unresolved feedback: 0.

## 4. What E5-B2A delivers

E5-B2A provides only **ephemeral server-side airport event-instant companion evidence**.

It resolves:

> **exact local airport wall clock + exact E5-B1R provider-observed IANA timezone evidence -> exactly one canonical UTC instant or an explicit fail-closed issue.**

Exact binding is revalidated through:

- option ID;
- leg index;
- segment index;
- endpoint `departure | arrival`;
- exact endpoint IATA.

DST semantics:

- nonexistent local time / spring gap -> no instant;
- ambiguous local time / fall overlap -> no instant;
- never silently choose earlier/later/compatible.

No IATA/country/city/name/server/browser timezone inference. No local-wall-clock `Z` append. No new timezone dependency.

Timezone and event-instant evidence remain outside `FlugSegment`, `FlugOption`, ranking, browser/client response, route itinerary, trip metadata, account adoption and Supabase.

## 5. Entry Requirements foundation now present

Provider-neutral foundation currently includes:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution.

E5-A still is not automatically bound to Trip/Route events. E5-B2A still has no persistent trusted event source or occurrence resolver.

## 6. Hard non-scope / still inactive

- persistent server-owned trusted timezone/event provenance;
- Trip/Route -> OfficialTemporalAnchor occurrence resolver;
- E5-A automatic binding;
- workspace deadline/action-window/urgency runtime;
- task persistence/completion;
- reminder/push/e-mail/notification runtime;
- real Requirements provider;
- credential/passport ranking.

`requirementsProviderAus()` remains `null`.

## 7. Binding provenance rule

The abandoned first E5-B1 attempt remains invalid:

- Issue #327 CLOSED / not_planned;
- PR #328 CLOSED / NOT MERGED.

Binding rule:

> **Persisted does not mean provider-proven.**

Owner-writable Trip metadata cannot establish provider provenance. Persistent trusted event/timezone provenance later requires technically enforced server-owned write authority. Production DB/RLS/grant/trigger/write-authority changes require the special Product-Owner gate.

## 8. Product / Traveller Truth unchanged

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller -> multiple citizenships -> multiple travel documents/credentials -> context-dependent evaluated options.**

No default/primary/preferred/chosen passport or citizenship. Issuer Country != Citizenship. No Residence -> Nationality inference. No `documents[0]` / `evaluations[0]` as Product Truth.

Account Registry = reusable current traveller facts.  
Trip Snapshot = only current truth for a concrete trip.

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

1. reconstruct final live main, open PRs/issues, CI/Vercel;
2. read the E5-B2A closure + Entry Requirements target architecture;
3. run a fresh Duplicate/Integration/Truth/Security/Persistence precheck;
4. determine the smallest responsible next slice rather than inferring E5-B2B automatically;
5. stop at the Product-Owner gate if persistent trusted event/timezone provenance needs Production DB/security changes;
6. version task + continuity before agent dispatch;
7. independently review and exact-head gate every resulting implementation;
8. **do not auto-start a follow-up.**

**Live-Evidence wins always.**
