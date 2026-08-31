# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B3C PRE-AGENT PREP ACTIVE / SERVER-ONLY PERSISTENCE MINT / NO PRODUCTION APPLY / LIVE-EVIDENCE WINS**

## 1. Current live baseline

`main@8868f91319f2747ca6f3dc8cb46ab0a40cba417b`

Commit:
`Close Entry Requirements E5-B3B continuity (#346)`

Fresh Technical-Lead verification before E5-B3C branch cut:

- Main CI #1539 / Run `33436658462`: **SUCCESS**;
- CI jobs `Auth-Konfiguration gegen config.toml` and `Typecheck, Lint & Build`: **SUCCESS**, including full tests/hygiene/Production Build;
- Vercel Production: **READY/SUCCESS** on exact `8868f913...`;
- Vercel unresolved toolbar threads: **0**;
- main ruleset `Jetnity main protection` / ID `21875372`: active; strict required CI/Auth/Vercel; review-thread resolution; merge-only; bypass empty;
- current open PRs are historical Drafts #52/#50/#40/#39/#28; no competing current runtime PR;
- current relevant open parent Issue #294 remains target-only / do-not-auto-start except through a newly versioned bounded slice.

## 2. Active slice E5-B3C

Issue:
**#347 – Entry Requirements E5-B3C – server-only Flight Event persistence payload mint**

Branch:
`feat/entry-requirements-flight-event-persistence-mint-e5b3c-2026-08-31`

Binding task:
`docs/ENTRY_REQUIREMENTS_FLIGHT_EVENT_PERSISTENCE_MINT_E5B3C_TASK_2026-08-31.md`

Baseline:
`main@8868f91319f2747ca6f3dc8cb46ab0a40cba417b`

Pre-agent preparation currently contains Technical-Lead-owned task/status/continuity work only. No E5-B3C runtime implementation is accepted yet.

Planned fresh Cursor agent:
**`Jetnity entry requirements flight event persistence mint 1`**, Generation 1

Session:
**not yet established — do not invent; persist only after live Cursor evidence exists.**

Agent is forbidden to mark Ready, merge, mutate Production, edit this file or `JETNITY_START_HERE.md`, or start a follow-up slice.

## 3. Why E5-B3C was selected

Fresh Duplicate/Integration/Truth/Security/Persistence precheck found:

- E5-B3A repository SQL already defines `jetnity.flight_event_persistence.v1` / `e5b2a_validated_snapshot` but no TypeScript mint exists;
- E5-B1R already provides exact provider-observed Airport timezone evidence;
- E5-B2A already provides exact resolved Airport event-instant evidence;
- E5-B3B already provides required server-observed `FlugProviderTreffer.retrievedAt`;
- `lib/commercial-provenance/persistenz.ts` is a reusable security/mint **pattern**, not the Flight Event domain;
- no existing Trip/Route → `OfficialTemporalAnchor` occurrence resolver exists;
- account flight adoption remains fail-closed because `flugNachweisAusUmgebung()` is still `null`;
- therefore activating DB persistence or deadline auto-binding now would cross an unsafe boundary.

The selected E5-B3C slice is consequently **pure/server-only/DB-free**: it may construct a deterministic validated future writer payload from one server-side provider snapshot, but may not invoke any writer or Production database path.

## 4. Binding E5-B3C truth

The mint must use:

- future server-known `tripItemId`;
- exact selected `optionId` found inside the same `FlugProviderTreffer`;
- exact E5-B1R timezone evidence;
- exact E5-B2A event-instant evidence;
- exact E5-B3B `treffer.retrievedAt`.

No browser/client source, actor, eventRef, timestamp, timezone or instant may establish provenance.

`retrieved_at === observed_at === treffer.retrievedAt`.

No `Date.now()` / second observation timestamp.  
No invented freshness: `fresh_until = null`.  
No TypeScript `occurrence_event_ref`: E5-B3A SQL owns that identity.

Only fully proven exact occurrences may enter the future persistence payload; missing/ambiguous/conflicting evidence remains explicit and fail-closed.

## 5. Production / trust boundary live truth

Supabase Production project:
`qscbgcdmivbbnzrcyegn`

Read-only verification immediately before E5-B3C confirmed all still absent/unapplied:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- role `jetnity_flight_event_writer`;
- role `jetnity_flight_event_runtime`;
- migration version `20260831190000`.

Production was **not mutated**.

Existing Supabase branches remain:

- `main` / `qscbgcdmivbbnzrcyegn`;
- `develop` / `yfvbxvijcorffwxbxahl`.

## 6. E5-B3B closed history

Last completed Cursor agent:
**`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1

Session:
`bc-1b857acd-7a88-4355-9bc1-4f94ece44f9b`

Final agent/delivery head:
`6dc59f7e26d77f616cf390db724385b200ba6f2a`

Final integration head:
`fdc41ae9d644c87525f90f932b630c1ac7fa8fd1`

Recovery runtime merge:
`9fb1e801fb6f7bf6f5f54fea6763f4b7f784def7`

Continuity merge/current main:
`8868f91319f2747ca6f3dc8cb46ab0a40cba417b`

Independent TL result for E5-B3B:
**PASS / no open P0-P1-P2.**

The old E5-B3B branch is now **ahead 0 / behind current main** and has no unmerged diff.

## 7. Entry Requirements foundation

Present on main:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A exact event-instant projection;
- E5-B1R ephemeral provider-observed airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution;
- E5-B3A repository persistence/security foundation, **not Production-applied**;
- E5-B3B server-observed provider retrieval timestamp.

Still inactive:

- E5-B3C runtime mint until independently reviewed/merged;
- Production-applied Flight Event Provenance;
- real writer/runtime principal;
- `flugNachweis` account-adoption path;
- Trip/Route → OfficialTemporalAnchor occurrence resolver;
- automatic E5-A binding;
- deadlines/action-window/urgency;
- task persistence/completion;
- reminders/push/email;
- real Requirements provider;
- credential ranking.

## 8. Product-Owner boundaries

No special Product-Owner gate is crossed by E5-B3C while it stays DB-free, invocation-free, provider-activation-free and cost-neutral.

Explicit Product-Owner approval remains mandatory before:

- E5-B3A Production migration apply;
- Production RLS/grant/role/function mutation;
- runtime/login principal allocation;
- real application writer/backfill;
- provider/vendor/DPA/secret/paid/live activation;
- fundamental Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health storage changes;
- real payments;
- spend outside approved budget;
- public/irreversible external activation.

## 9. Current risks

### P0

None proven.

### P1

None proven in the current E5-B3C repository-only scope.

### P2

- Flight account adoption is intentionally unavailable because `flugNachweisAusUmgebung()` is `null`.
- Flight Event Provenance is repository-only and absent in Production.
- Automatic occurrence binding/deadline runtime therefore must remain inactive.

These are known gated/incomplete capabilities, not Production incidents.

### P3

- historical Draft PRs/branches remain visible but are not current work;
- host clock trust for E5-B3B has no independent NTP attestation; E5-B3C must not strengthen the claim beyond server-observed time.

## 10. First unfinished action

1. finish TL pre-agent preparation;
2. open dedicated Draft PR for Issue #347;
3. verify clean pre-agent diff / merge-base / ahead-behind;
4. dispatch **`Jetnity entry requirements flight event persistence mint 1`**, Generation 1;
5. persist the real Cursor session id only after live evidence exists;
6. after agent STOP, perform independent full exact-head review;
7. every changed head invalidates prior gates;
8. no Ready/merge unless TL PASS and exact-head CI/Vercel/thread gates are green.

**Live-Evidence wins always.**
