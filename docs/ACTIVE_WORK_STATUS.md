# Jetnity – Active Work Status

Stand: 31. August 2026  
Status: **CURRENT / E5-B3A CLOSED / E5-B3B AGENT HEAD TL-PASS / FINAL INTEGRATION GATES PENDING / NO PRODUCTION APPLY / LIVE-EVIDENCE WINS**

## 1. Current canonical main

`main@ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8`

Commit:
`Close Entry Requirements E5-B3A continuity (#342)`

Verified:

- Main CI #1529 / Run `33430799991`: **SUCCESS**;
- Vercel Production: **SUCCESS** on exact main;
- Issue #338 closed/completed;
- Parent #294 open;
- E5-B3A Production migration still unapplied.

## 2. Active slice – E5-B3B

Issue:
**#343 – server-observed Flight provider retrieval timestamp evidence**

Draft PR:
**#344**

Branch:
`feat/entry-requirements-provider-retrieval-time-e5b3b-2026-08-31`

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

Independent TL result on that exact head:
**PASS / no open P0-P1-P2 findings.**

External evidence on `6dc59f7e...`:

- CI #1532 / run `33432418195`: SUCCESS;
- Auth, Typecheck, Lint, full Tests, hygiene and Production Build: SUCCESS;
- Vercel: SUCCESS;
- review threads: 0;
- `main` unchanged `ad7fb1fa...`;
- branch 0 behind;
- Supabase Production E5-B3A objects remain absent/unapplied.

A TL-owned continuity update is now being added. Therefore `6dc59f7e...` is a reviewed agent head, **not** the final merge head. The new integration head requires fresh exact-head gates.

## 3. What E5-B3B implements

`FlugProviderTreffer` now has required server-only:

`retrievedAt: string`

Meaning:

- Jetnity server observation time for the successfully read provider snapshot;
- canonical UTC ISO with `Z`;
- one timestamp per provider result;
- never trusted from provider/browser payload;
- no freshness or availability claim;
- not part of `FlugOption` / `FlugSegment`;
- not forwarded to ranking, browser, route or trip metadata.

The active Duffel adapter mints the value after successful HTTP and JSON read. Tests may inject a deterministic clock; Production uses the server clock.

## 4. Independent review highlights

Confirmed:

- no optional/nullable soft contract for `retrievedAt`;
- payload lookalikes cannot source it;
- HTTP 401/403/500, timeout and unreadable JSON do not return a successful timestamped hit;
- invalid mapped payload remains invalid;
- fake/test providers explicitly satisfy the required result contract;
- serialized browser response contains no retrieval/observation timestamp keys or fake timestamp value;
- E5-B1R timezone evidence, E5-B2A instant evidence/issues and offer cap are unchanged;
- `lib/flights/domain.ts`, client contract, route, trips, readiness, API, Supabase, DB scripts, `lib/providers/*` and Commercial Provenance runtime are unchanged;
- no dependency, secret, provider activation or paid call.

P3 only:

- host clock is the observation source;
- no persistence consumer yet;
- future mint must reuse this exact snapshot time and not generate a later `Date.now()`.

## 5. Production / trust boundary

Supabase Production remains unchanged and does not contain the E5-B3A event provenance objects.

No:

- Production migration apply;
- RLS/grant/role/function mutation;
- runtime principal;
- real DB writer/backfill;
- Flight Event persistence TypeScript mint;
- `flugNachweis` activation;
- provider/secret/paid/live activation;
- browser/route/trip timestamp persistence.

`flugNachweisAusUmgebung()` remains `null`.  
`requirementsProviderAus()` remains `null`.

## 6. Entry Requirements foundation

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
- E5-B3B provider retrieval timestamp core, pending final integration gates.

Still inactive:

- Production-applied event provenance;
- TypeScript persistence mint;
- real writer/runtime principal;
- occurrence resolver into E5-A;
- automatic E5-A binding;
- deadline/task/reminder runtime;
- real Requirements provider;
- credential ranking.

## 7. Product-Owner boundaries

Explicit approval remains mandatory before any later:

- Production E5-B3A migration apply;
- Production RLS/grant/role/function changes;
- runtime/login principal allocation;
- real application writer or backfill;
- provider/vendor/secret/paid/live activation;
- fundamental Auth/MFA/AAL change;
- sensitive passport/MRZ/scan/biometric/health storage;
- real payments;
- spend outside approved budget;
- public/irreversible external activation.

## 8. Next action

1. read the new final integration head after TL continuity commits;
2. compare it against agent head `6dc59f7e...` and require only three TL docs;
3. run fresh CI/Vercel/threads/main-drift gates on that exact head;
4. Ready/Merge only after those gates, using documented recovery if the known Ready connector bug recurs;
5. post-merge verify main CI/Vercel and Production remains unapplied;
6. close #343 and update #294;
7. create/gate a docs-only closure checkpoint;
8. no Production apply or follow-up runtime slice without a new authorized instruction.

**Live-Evidence wins always.**
