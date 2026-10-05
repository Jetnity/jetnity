# TA-DL1 – Document Lifecycle / Trip-Date Awareness

Stand: 30. August 2026  
Status: **AUTHORIZED / BOUNDED TRAVELLER RUNTIME SLICE / NO MIGRATION**  
Technical-Lead baseline: `main @ 0ac7296fbd9e348b05a30b4c43cd5fe1815e24d9`  
Issue: #226  
Cursor-Agent: **`Account plattform audit vorbereitung 19`**

## 1. Goal

Make existing traveller document expiry metadata useful and honest in Account Registry and Trip Workspace without inventing visa/entry truth or choosing a passport for the user.

Jetnity already stores `expiresOn` for multiple documents. This slice adds deterministic lifecycle/date-context presentation so a traveller can see when a saved document is already expired or will expire before/during a concrete trip.

## 2. Binding truth

- One traveller may have multiple peer citizenships and multiple peer documents.
- No default/primary/preferred/chosen passport or citizenship.
- Issuing country is not citizenship.
- Account Registry = reusable current facts; Trip Snapshot = only current truth for one concrete trip.
- An expiry date is document metadata, not destination-specific entry eligibility.
- Without real official evidence Jetnity must not claim that a document is sufficient for entry, visa-free travel, boarding or transit.

## 3. Required behavior

### 3.1 Pure calendar-date lifecycle helper

Add one small pure/testable helper for ISO `YYYY-MM-DD` document expiry against an explicit date context.

It must be calendar-date based and timezone-safe. At minimum distinguish:

- expiry missing / unknown;
- invalid stored date → fail closed / unknown, never reinterpret;
- expired before a supplied reference day;
- for a trip with dates: expires before trip start;
- expires on or after trip start but before trip end;
- expires on or after trip end.

Boundary semantics must be explicit in tests. Do not add an arbitrary “expires soon in N days” product threshold in this slice.

### 3.2 Account Registry presentation

On `/account/travellers`, keep the exact expiry date and add only evidence-safe lifecycle language, e.g. already expired versus not yet expired relative to an explicit current-day context.

Do **not** say “valid for travel”, “valid passport”, “safe”, “recommended” or similar destination-dependent claims.

Missing expiry remains visibly unknown/not provided; it is not treated as valid.

### 3.3 Trip Workspace presentation

In `Reisevorbereitung`, show document-date context per document when trip dates allow it:

- expires before trip start → clear warning;
- expires during the trip → clear warning;
- expiry on/after trip end → neutral statement that the expiry date is after/not before trip end, **not** a claim that destination validity requirements are satisfied;
- missing/invalid expiry or insufficient trip dates → honest unknown/limited context.

Each of several documents is evaluated independently. Never collapse to `documents[0]` and never select a credential.

### 3.4 UX / accessibility

- status must be expressed in text, not color alone;
- existing edit/delete/add flows remain unchanged;
- mobile layout remains usable;
- no noisy global banner if the warning can stay next to the relevant document.

## 4. Hard non-scope

- no migration/schema/RLS/grant/ownership change;
- no Production/Development Supabase mutation;
- no Auth/Session/MFA/AAL change;
- no Service Role;
- no new persisted lifecycle/status column;
- no archive/default/primary/preferred/chosen credential semantics;
- no automatic “best passport” or score/ranking;
- no visa/entry/transit/boarding decision;
- no Requirements Provider or external API;
- no Provider/TW-8/Payments/Homepage/Collaboration/AP-8+ runtime;
- no Guest→Registry import/dedup;
- no passport/document numbers, scans, MRZ, biometrics, DOB or health data;
- no Supabase migration-history repair.

If safe implementation would require any non-scope item: report **BLOCKED** and STOP.

## 5. Expected code shape

Prefer a small shared pure helper under `lib/traveller/` or another existing traveller/readiness utility boundary, consumed by existing UI. Do not create a second traveller truth model.

Likely touched runtime surfaces are limited to:

- lifecycle/date helper + tests;
- `components/account/AccountReisendeKarte.tsx`;
- `components/trips/Reisevorbereitung.tsx`;
- focused UI/contract tests as needed.

Do not refactor unrelated traveller/readiness/provider code.

## 6. Required tests

At minimum prove:

1. missing expiry → unknown, no positive-validity claim;
2. malformed expiry → fail closed;
3. expiry before reference day → expired;
4. exact reference-day boundary is deterministic;
5. expiry before trip start → warning state;
6. expiry exactly on trip start has explicit tested semantics;
7. expiry during trip → warning state;
8. expiry exactly on trip end has explicit tested semantics;
9. expiry after trip end → neutral post-trip-end state, not travel-validity claim;
10. incomplete trip dates do not fabricate a full-trip conclusion;
11. two or more documents receive independent results; no first-document/default behavior;
12. issuer/citizenship relation is untouched;
13. account and trip UI copy contains no “best”, “preferred”, “chosen”, visa or entry-eligibility inference.

Run complete repository gates: tests, typecheck, lint, hygiene, production build, CI/Vercel exact-head evidence.

## 7. Governance

- PR stays Draft.
- Cursor never marks Ready and never merges.
- No follow-up slice.
- After implementation + adversarial self-review + exact-head evidence, STOP for independent Technical-Lead review.
- Any CHANGES REQUIRED stays in the same `Account plattform audit vorbereitung 19` session.
- Global continuity files remain Technical-Lead-owned unless explicitly requested.
