# Official Truth Bern G3-RQ-FETCH-1 — A03 Arbitration Proposal

Date: 2026-10-12
Scope: protected shared retrieval security internals

## 1) Why A03 is triggered

Current protected retrieval code (blob `43492d1bfd5a326b7a6a44f78bcfa4aaffd2b746`) keeps default `BODY_MAX=65536` and only allows the 131072 source-budget branch behind the private live authorization gate where `abhaengigkeiten.catalog == null`.

Relevant code location:

- `lib/readiness/official-truth-server-owned-retrieval.ts:888-891`

Current condition:

```ts
authorization === LIVE_PRIVILEGED_TRANSPORT && abhaengigkeiten.catalog == null
  ? officialTruthChDeSourceBudget128k1(...) ?? BODY_MAX
  : BODY_MAX
```

The approved developer-side Bern research path needs an injected isolated catalog/profile (not production source registration), so it cannot satisfy `catalog == null`. Without a protected change, the isolated path remains capped at 65536 and cannot legally implement A07 (131072 exact Bern research cap) without cloning network code (forbidden).

## 2) Security-preserving minimal change proposal (not applied)

### Proposed protected file edits

1. `lib/readiness/official-truth-server-owned-retrieval.ts`
   - Add a second private authorization symbol for a developer-only isolated research budget branch.
   - Keep existing live branch unchanged.
   - Extend `maxBytesForMediaType` selection to:
     - preserve live-only path exactly as today,
     - optionally allow one exact Bern research tuple budget (131072) under the new isolated authorization gate.

2. Add one new exported loader from the same file:
   - `retrieveOfficialTruthIsolatedResearchSource(...)`
   - Uses identical `serverUhr`, `serverDns`, `serverHttp` internals.
   - Passes the new isolated authorization symbol.
   - Accepts only injected isolated catalog+profiles (developer seam), no caller URL authority expansion.

3. Keep all existing exports and call sites behavior-equivalent:
   - `loadOfficialTruthServerOwnedRetrieval`
   - `loadOfficialTruthServerOwnedRetrievalWithCatalogTransport`
   - `retrieveOfficialTruthIsolatedPilotSource`

### Proposed policy constraints for the new isolated budget branch

- Budget eligible **only** for exact immutable tuple:
  - sourceId `de-bern-embassy-research-only`
  - content item `bern-visa-entry-2611474` v1
  - representation `bern-visa-entry-html-de` v1
  - exact request/final URL `https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474`
  - exact media type `text/html`
  - max bytes `131072`
- All non-exact cases remain at `BODY_MAX=65536`.
- No redirect-follow broadening.
- No caller-supplied byte override.
- No second HTTP implementation.

## 3) Call-graph impact (proposed)

Current:

- `run(Bern path)` -> isolated script -> `retrieveOfficialTruthIsolatedPilotSource` -> `decideOfficialTruthServerOwnedRetrieval` -> `hopLesen` -> `serverDns/serverHttp`.

Proposed:

- `run(Bern path)` -> isolated G3 script -> `retrieveOfficialTruthIsolatedResearchSource` (new) -> same `decideServerOwnedRetrieval` -> same `hopLesen` -> same `serverDns/serverHttp`.

No app/api route, cron, CI hook, or public runtime call path introduced.

## 4) Regression obligations (if approved)

- Preserve all existing official retrieval semantics/tests.
- Add exact Bern-only 131071/131072 pass and 131073 fail tests for isolated authorized branch.
- Prove all non-Bern and non-exact tuple paths remain 65536.
- Re-prove 3xx no-follow behavior and abort/cancel behavior under larger bound.
- Keep source qualification blocked (`content_identity_mismatch` / research-only categories), no accepted truth.

## 5) Explicit non-goals

- No source registration `current=true`.
- No accepted Evidence/Rule.
- No Provider/F8 activation.
- No Auth/RLS/Supabase hosted changes.
- No phase B network execution in this slice.

## 6) Decision requested

Independent Technical-Lead written arbitration is required before any edit to:

- `lib/readiness/official-truth-server-owned-retrieval.ts`

Current slice status: **STOPPED_AT_A03_PENDING_TL_ARBITRATION**.
