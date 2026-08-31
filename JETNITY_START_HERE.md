# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 31. August 2026
Status: **KANONISCHER CURRENT-STATE-EINSTIEG / E5-A CLOSED / E5-B1 BLOCKER CLOSED / E5-B1R RUNTIME REVIEW PASS / PR #331 INTEGRATION PENDING / LIVE-EVIDENCE WINS**

> **Vor jedem neuen Slice zuerst Live-Stand, Duplicate-/Integration-/Truth-/Security-Grenzen und betroffene Persistenz verifizieren. Kein relevanter Fortschritt darf nur im Chat oder in einer Cursor-Session stehen. Continuity ist Definition of Done.**

> **Audit first. Reuse before add. Integrate before duplicate. Persisted does not mean provider-proven.**

## 1. Zuerst lesen

1. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5B1R_REVIEW_2026-08-31.md` ← aktueller unabhängiger TL-Review
2. `docs/ACTIVE_WORK_STATUS.md`
3. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_TASK_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_STATUS_2026-08-31.md`
5. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_HANDOFF_2026-08-31.md`
6. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`
7. `docs/CHATGPT_TECHNICAL_LEAD_ENTRY_REQUIREMENTS_E5A_CLOSED_2026-08-31.md`
8. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`
9. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
10. `docs/JETNITY_BINDING_BUILD_ORDER.md`
11. `JETNITY_HANDOFF.md`

Danach GitHub/CI/Vercel live neu verifizieren. Bei DB-/Security-/Storage-/Migration-/Persistenzannahmen zusätzlich Supabase live prüfen.

## 2. Live Main beim E5-B1R Review

`main@7fdd06f983a47afbbb28313479adf4e81fb9a359`

Commit:
`Close E5-B1 trust-boundary blocker continuity (#329)`

Verifiziert während E5-B1R Review:

- Main unverändert gegenüber dem Task-Cut;
- Ruleset `Jetnity main protection` / ID `21875372`: active;
- PR erforderlich, strict up-to-date Required Checks, Conversation Resolution;
- Required Checks: `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`;
- merge-only;
- bypass leer.

Finalen Main trotzdem bei jeder Fortsetzung live neu lesen.

## 3. E5-B1R – aktueller Integrationsstand

Issue:
**#330 – Entry Requirements E5-B1R – ephemeral provider-observed airport timezone evidence**

Draft PR:
**#331**

Branch:
`feat/entry-requirements-ephemeral-timezone-evidence-e5b1r-2026-08-31`

Fresh logical Cursor Agent:
**`Jetnity entry requirements provider timezone evidence 1`**, Generation 1

Session:
`bc-cc301dee-cb64-42b9-a6e9-9968f3db8a09`

Agent runtime+handoff head independently reviewed:
`ae75178d617271808d8738ff64f81ed54caf7a80`

Independent Technical-Lead result:
**RUNTIME REVIEW PASS – no P0/P1/P2 findings.**

Exact reviewed-head evidence:

- CI #1500 / Run `33411397098`: SUCCESS;
- Auth job: SUCCESS;
- Typecheck/Lint/Tests/Hygiene/Production Build job: SUCCESS;
- Vercel: SUCCESS / READY;
- GitHub review threads: 0;
- Vercel unresolved feedback: 0;
- branch on reviewed runtime head: 5 ahead / 0 behind;
- abandoned #328 head is not an ancestor.

The TL continuity update after this review creates a newer docs-only head. Therefore the reviewed-head gates above are evidence for the runtime review, **not** the final merge gate. The final integration head must be re-gated completely before Ready/Merge.

## 4. Was E5-B1R technisch liefert

E5-B1R adds only **ephemeral provider-observed airport timezone companion evidence** on the active server-side `FlugProviderTreffer` seam.

Evidence is linked to one exact normalized endpoint by:

- `optionId`;
- `legIndex`;
- `segmentIndex`;
- endpoint `departure | arrival`;
- IATA;
- provider-observed timezone identifier.

Duffel mints it only from a structured airport object carrying explicit `time_zone`.

No IATA/country/city/name lookup. No raw offset fallback.

Identifier validation is bounded and uses platform `Intl` recognition only as validation. No local-time→UTC calculation happens.

The Duffel adapter filters evidence to the options retained by the existing offer cap.

`fluegeSuchen()` deliberately does not pass the evidence into ranking or the browser response.

## 5. Hard Non-Scope remains binding

E5-B1R does **not** add timezone to:

- `FlugSegment`;
- `FlugOption` / `BewerteteFlugOption`;
- client/browser response;
- route itinerary;
- trip/route metadata;
- account adoption / `flugNachweis`;
- Supabase.

It also does not add:

- persistent trusted timezone/event provenance;
- local-time + IANA → absolute instant;
- DST ambiguity/gap resolution;
- Trip/Route→event occurrence selection;
- E5-A automatic binding;
- workspace deadline/urgency runtime;
- task persistence/completion;
- reminders/push/e-mail/notifications;
- Requirements provider activation;
- credential ranking / automatic best-pass selection.

`requirementsProviderAus()` remains `null`.

## 6. Warum der erste E5-B1-Versuch verworfen bleibt

Issue #327: CLOSED / not_planned.

PR #328: CLOSED / NOT MERGED.

Discarded head:
`fdf05f26928dfc556cc3b3b954eb3c61981b29c4`

The first attempt incorrectly tried to treat timezone persisted in owner-writable `trip_items.metadata` as trusted provider provenance.

Production-live Supabase verification proved:

- `trip_items` owner rows are directly INSERT/UPDATE writable by `authenticated` under RLS;
- ownership does not prove provenance of individual metadata fields;
- current route metadata canonicalization does not preserve timezone fields.

Therefore the binding rule remains:

> **Persisted does not mean provider-proven.**

A later persistent timezone/event provenance layer needs technically enforced server-owned write authority. If it requires Production DB/RLS/trigger/grant changes, stop at the special Product-Owner gate.

## 7. Product / Traveller Truth remains unchanged

> **Jetnity = Travel Operating System für die konkrete Reise.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = reusable current traveller facts.
Trip Snapshot = only current truth for the concrete trip.

Never infer a default/primary/preferred/chosen passport or citizenship. Issuer Country ≠ Citizenship. No Residence→Nationality inference. No `documents[0]` / `evaluations[0]` as product truth.

## 8. Entry Requirements foundation

Provider-neutral foundation present:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A Exact Event-Instant Projection Core;
- E5-B1R ephemeral provider-observed airport timezone evidence, currently in PR #331 integration.

E5-A remains only:

> `OfficialTemporalRule + explicitly bound absolute event instant -> deterministic projection`.

E5-B1R does not yet create that absolute event instant.

## 9. Product-Owner gates

E5-B1R itself triggers no special PO gate: no Production DB/RLS/Auth/secret/provider activation/paid call/persistence/new infrastructure/public launch.

Special PO gates remain for provider contracts/secrets/paid/live activation, Production migration/RLS/ownership/write-authority changes, fundamental Auth/MFA/AAL, sensitive passport/MRZ/scan/biometric/health data, real payments, running costs outside approved budget, and public launch/irreversible activation.

## 10. FIRST NEXT ACTION

1. Read PR #331 live and determine its newest exact head.
2. Confirm the newest changes after `ae75178d...` are TL continuity only.
3. Re-run/verify exact-head CI + Vercel + review-thread gates on that newest head.
4. If all green and main remains merge-base/up to date: Technical Lead may Ready + merge #331 under normal autonomy.
5. Post-merge verify canonical main CI + Production deployment.
6. Close #330 only after post-merge verification.
7. Persist a post-merge closure checkpoint.
8. **Do not auto-start E5-B2 or any follow-up.**

**Live-Evidence wins always.**
