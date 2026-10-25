# R107-T author self-review — 2026-10-25

This review is the implementation author’s. It is not an independent Technical-Lead PASS and it does not close P1.

Reviewed addendum head: `c589266158a4d15f90a952e370435150e45f41d7`.
Tree: `55970376c0e8c08b0bc79610854fc4898355673a`.
The card correction remains `a68e6b4a3690decb4b7f21373aa53e86c5f008d1`. This answers review R1 of `b443fb13db1e97e0d0d85d51814046349fd7491b` and the registry/T-EX2 addendum. The earlier implementation head remains `00ba5b9124abf1cafe26b711d50b4527f40e70a5`.
TASK blob `75c59b0851d835560ff4b5562e9fcc52c395b2ad` unchanged.
Plan blob at the authorized head remains `252ae82c9cf1aff34f7f46e16999d50178369dff`.

## What holds

The mounted residence-only UUID case failed on the original editor and the same assertion passes on the fix, including in the later 18-test run. A newer edit during a held save no longer leaves Save pending. A matching later graph of that submission is consistent and does not clear the child refs. A removal confirmation opened during the hold survives the older null. Exact-ref rejection, blank-link rejection, duplicate citizenship, removal, and explicit re-entry are in that run. Outcome classification stays conservative: a string, throw, rejection, or malformed fulfillment after the writer is entered is unproven, with no replay. Guest admission is one traveller write at a time. A usable plan-point add is still present after the later traveller save. After an unproven readback, a second slot does not write, and the frozen plan-point equality check rejects the stale graph instead of being mocked away. Only an explicit successful same-trip read clears the latch. Registry and the legacy audit stub each fire once, on one ledger.

T-EX1 touches only the four named helper assertions. Frozen document, storage, writer, schema, and audit-client sources are unchanged.

## Corrections I would want a reviewer to see

The guest base is not a React ref. The frozen flight and accommodation wiring tests call `GastArbeitsbereich` as a plain function. `useRef` throws there. The base is a `WeakMap` on the `setReise` identity. That preserves the five `useState` slots those tests seed. It is instance-scoped for a stable setter, and a trip change replaces the entry. It is not cross-tab state and not a new storage API.

The legacy writer is registered in `useLayoutEffect`, not during render. Assigning through the prop failed `react-hooks/immutability`. The mounted once-count still passes because the click is after layout. A caller that invoked the intake confirm during the same render, before the layout effect, would see no writer. No product path does that.

T-EX2 now covers the old `1 !== 2` assertion and only that test. The writer still does not refresh. The test calls the separate refresh callback. `npm test` still exits 1 because eleven local PostgreSQL 16 proofs cannot start in this environment. I do not treat those as a pass.

The audit once-count is a test-bundle rewrite. The source file on disk is the frozen component.

`npm test` does not execute the Playwright files. The 20-test result is only the direct command in `mounted-matrix.txt`. An unknown intake keeps `unaufgeloest` across cancel and section return. A later accepted confirm does not claim the first attempt was absent. The duplicate warning stays with that source.

I first moved the draft baseline at accept time. That made a later guest prop carrying the original traveller look like a conflict and disabled Save. The baseline now moves only when a later observation matches the submitted fingerprint and the draft generation is still that submission. I would want a reviewer to check that choice: an accepted edit stays dirty until that matching observation, and a delivery that still equals the pre-edit baseline does not become a conflict.

## Not claimed

No hosted readback, SQL/RLS, Auth, Production, causal exactly-once, cross-tab atomicity, or native-device proof. P1 stays OPEN until an independent review accepts an exact head. Ready and merge stay with the Technical Lead.
