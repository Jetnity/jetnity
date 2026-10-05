# S4 Residual – Multi-Document Traveller Parser Order Independence

Stand: 1. September 2026  
Status: **BINDING RUNTIME TASK / SINGLE_AGENT / NO PROVIDER OR PRODUCTION MUTATION**

Parent issue: #370  
Parent S4 closure: #365  
Baseline: `main@6dc5a153d1dd7b934f2f23db5a19fbd89a3a1663`

## 1. Problem

`lib/readiness/traveller-anfrage.ts::travellerAnfrageStriktLesen()` strictly validates raw documents, then calls `travellerLegacyLesen()`, whose canonical normalization sorts documents. The subsequent citizenship-link integrity check compares the sorted result positionally against the original unsorted `documentsRoh[index]`.

A semantically valid mixed document set can therefore be rejected only because input order differs from canonical sort order.

This violates Phase-1 Traveller truth:

`1 traveller -> n citizenships -> n documents / credentials -> context-aware evaluation`.

No document, citizenship or option may become a default, primary or preferred truth implicitly.

## 2. Multi-Agent suitability

**SINGLE_AGENT.**

One central parser truth boundary plus its directly related tests. A second runtime writer would collide on the same contract. The independent Agent-B audit already provides external evidence and acceptance criteria.

## 3. Objective

Remove positional coupling from strict Multi-Document citizenship-link validation while preserving all existing fail-closed validation.

Preferred minimal implementation:

1. validate raw documents exactly as today;
2. establish an order-independent lookup from validated document identity (`clientRef`, or an equivalent existing stable validated identity if the code proves that is required);
3. compare each normalized/canonically sorted document against its matching validated source by identity, never by array index;
4. reject if identity, cardinality, duplicate integrity or citizenship-link integrity cannot be proven;
5. do not add a second normalization or inferred traveller/document truth.

## 4. Required acceptance

Must prove with tests:

- mixed `passport` + `national_id` with valid citizenship links is accepted;
- at least two different input permutations of the same semantic document set are accepted and yield equivalent normalized semantics;
- citizenship links remain attached to the correct document after canonical sorting;
- unknown `citizenshipClientRef` remains rejected;
- duplicate document `clientRef` remains rejected;
- malformed child document remains rejected;
- existing sensitive/untrusted extra-field rejection remains intact, including passport-number/MRZ/scan-like claims where covered by the current strict contract;
- missing/invalid document identity fails closed if the current contract cannot establish an unambiguous match;
- no residence -> citizenship inference;
- no issuer country -> citizenship inference;
- no default / primary / preferred citizenship or passport;
- all existing strict traveller parser tests remain green.

## 5. Expected owned files

Runtime owner may edit only what is necessary, expected:

- `lib/readiness/traveller-anfrage.ts`
- `lib/readiness/traveller-anfrage.test.ts`
- one immediately related traveller parser test file only if necessary;
- versioned status / self-review / handoff docs for this slice.

If a required fix would extend beyond this boundary, STOP and report the evidence rather than silently broadening scope.

## 6. Hard non-scope

No DB/migration/RLS/grant/role/function mutation.  
No provider selection/adapter/contract/DPA/secret/API key/paid/live call/activation.  
No Readiness body-cap changes.  
No Safety/Seasonal activation-flag work.  
No S6/S7/S8.  
No TW-8/TW-9.  
No Auth/MFA/AAL change.  
No new sensitive passport number/MRZ/scan/biometric/health storage.  
No Account/Traveller schema redesign.  
No `ACTIVE_WORK_STATUS.md` or `JETNITY_START_HERE.md` edit by the Cursor agent.  
No follow-up slice.

## 7. Validation

At minimum:

- targeted traveller parser tests;
- full `npm test`;
- typecheck;
- lint;
- production build;
- repository hygiene checks required by CI.

Cursor evidence is self-review only. Technical Lead independently reviews the exact final head, CI, Vercel and review threads.

## 8. Exit

Agent stops after implementation + tests + versioned status/self-review/handoff. Do not Ready. Do not merge. Do not begin S6.

After merge/post-merge verification, Technical Lead performs a fresh S4 final closure/recheck. S6 remains blocked until S4 is canonically closed.