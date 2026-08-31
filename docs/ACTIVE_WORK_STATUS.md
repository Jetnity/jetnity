# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B3B CLOSED & POST-MERGE VERIFIED / PRODUCTION EVENT PROVENANCE UNAPPLIED / NO ACTIVE RUNTIME FOLLOW-UP SLICE / LIVE-EVIDENCE WINS**

## 1. Current verified runtime/repository main before this docs closure

`main@9fb1e801fb6f7bf6f5f54fea6763f4b7f784def7`

Commit:
`Merge E5-B3B server-observed provider retrieval timestamp (#345)`

Post-merge evidence:

- Main CI #1537 / Run `33435736002`: **SUCCESS**;
- Vercel Production: **SUCCESS** on exact merge SHA;
- Issue #343: CLOSED / completed;
- Parent #294: OPEN;
- Supabase Production E5-B3A objects remain absent/unapplied.

After this docs-only closure merges, re-read `main` because the canonical SHA advances without Runtime behavior changing.

## 2. E5-B3B final history

Agent:
**`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1

Session:
`bc-1b857acd-7a88-4355-9bc1-4f94ece44f9b`

Pre-agent head:
`d3baa9c7efb5f9ef8ba658b953d752cf6adc130c`

Runtime commit:
`09d5c0e0b46e6cdbb8e08459fe953cbb54f0c433`

Final agent/delivery head:
`6dc59f7e26d77f616cf390db724385b200ba6f2a`

Final integration head:
`fdc41ae9d644c87525f90f932b630c1ac7fa8fd1`

Independent TL result:
**PASS / no open P0-P1-P2.**

Original Draft #344:
CLOSED / NOT MERGED after known `Repository.fullDatabaseId` Ready connector error.

Recovery #345:
MERGED on identical exact head after its own CI/Vercel/thread gates.

Runtime/repository merge:
`9fb1e801fb6f7bf6f5f54fea6763f4b7f784def7`

## 3. Final E5-B3B contract

`FlugProviderTreffer` now requires server-only `retrievedAt: string`.

It is:

- Jetnity server observation time for the successfully read provider snapshot;
- canonical UTC ISO with `Z`;
- minted by the active Duffel adapter from Jetnity server clock after successful HTTP + JSON read;
- never trusted from provider/browser payload;
- not a freshness or availability guarantee;
- not present in `FlugOption`, `FlugSegment`, browser response, route, trip metadata or DB.

E5-B1R timezone evidence and E5-B2A event-instant evidence/issues remain intact.

## 4. Production / trust boundary

Supabase Production remains unchanged.

Still absent:

- `public.trip_item_flight_event_provenance`;
- `jetnity_internal.trip_item_flight_event_provenance_schreiben(jsonb)`;
- `jetnity_internal.flight_event_write_runtime_gate`;
- `jetnity_flight_event_writer`;
- `jetnity_flight_event_runtime`.

No Production migration apply, RLS/grant/role/function mutation, runtime principal, real writer or backfill occurred.

`flugNachweisAusUmgebung()` remains `null`.  
`requirementsProviderAus()` remains `null`.

## 5. Entry Requirements foundation

Present:

- S4-R1 Truth Ops;
- E1 Detail Contract;
- E2 Official Actions;
- E3 Visitor Checklist;
- E4 Official Temporal Rules;
- R1 Workspace Integration;
- E5-A exact event-instant projection;
- E5-B1R ephemeral airport timezone evidence;
- E5-B2A ephemeral airport event-instant resolution;
- E5-B3A repository persistence/security foundation;
- E5-B3B server-observed provider retrieval timestamp core.

Still inactive:

- Production-applied event provenance;
- TypeScript persistence mint;
- real writer/runtime principal;
- occurrence resolver into E5-A;
- automatic E5-A binding;
- deadline/task/reminder runtime;
- real Requirements provider;
- credential ranking.

## 6. Product-Owner boundaries

Explicit approval remains mandatory before any later:

- Production E5-B3A migration apply;
- Production RLS/grant/role/function changes;
- runtime/login principal allocation;
- real application writer or backfill;
- provider/vendor/secret/paid/live activation;
- fundamental Auth/MFA/AAL changes;
- sensitive passport/MRZ/scan/biometric/health storage changes;
- real payments;
- spend outside approved budget;
- public/irreversible external activation.

## 7. Next action

There is **no active runtime follow-up slice**.

Any next slice requires a fresh live reconstruction and Duplicate/Integration/Truth/Security/Persistence precheck against the then-current `main`. Do not assume that the next correct step is a persistence mint merely because E5-B3B is complete.

If a future persistence mint is selected, it must reuse the existing E5-B1R timezone evidence, E5-B2A resolved event instant and E5-B3B exact retrieval timestamp; it must not invent a later observation time.

**Live-Evidence wins always.**
