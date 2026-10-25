# R107-T implementation report — 2026-10-25

Candidate delivery for independent Technical-Lead review. Author review is not acceptance. P1 stays OPEN.

## What landed

The current-trip editor keeps loaded citizenship and document client refs through a residence-only edit. A document relation is checked against the citizenship refs the serializer will actually emit. A supplied child ref or relation that the frozen reader would trim, cut, or replace is rejected and left on the card. Blank new rows with nothing pointing at them can be omitted. A document that points at a citizenship row the serializer would omit is not sent.

Save, remove, conflict, and registry intake state live in the Workspace hook. Section navigation does not drop them. A returned string, throw, rejection, or malformed result after the writer is entered is `unproven`. Nothing is replayed. `null` is the only accepted result. A refresh that throws after `null` stays accepted and says the reload is unknown.

Membership is separate from empty fields. A removed saved profile is not a fresh save until the person chooses “Angaben für diesen Platz neu erfassen”. A canonical delivery at or before settlement is not treated as readback. A later matching delivery can be shown as consistent. That match is not a causal or exactly-once receipt. Dirty drafts stay, and a stale submit waits for “Neu laden” or “Meine Eingaben behalten”.

Guest traveller saves and removals admit one write at a time for the trip. While the graph is usable, the base follows the latest adopted same-trip graph, including an ordinary plan-point add. After an entered traveller write is unproven, later guest successes and prop deliveries do not clear the latch or replace the base. Only the explicit successful same-trip read re-arms save and remove, and it does not replay a payload. The frozen `gastPlanpunktAnlegen` stale-graph check is not mocked. An immediate add from the old React graph after a landed-but-unread write is rejected and is not called a success.

Konto receives the one intake controller through `registrySteuerung`. The legacy audit node keeps its existing `onUebernehmen` stub. The controller calls that same function once. The product path and the legacy path share one ledger.

T-EX1 is applied only to the two obsolete helper-name assertions in `lib/readiness/preparation-premium-experience-5.test.ts` and the same two in `lib/country/ui.test.ts`. `dokument-formular.ts` is unchanged.

## Wiring forced by existing gates

`GastArbeitsbereich` does not call `useRef` or `useLayoutEffect`. `lib/trips/flug-manuell.test.ts` and `lib/trips/unterkunft-manuell.test.ts` invoke that function directly and replace only `useState` and `useEffect`. A real `useRef` throws because there is no renderer dispatcher, and those tests are not on the allowlist. The traveller base and the unresolved latch are a `WeakMap` entry on the stable `setReise` identity. A trip-id change replaces that entry. The ordinary observe effect adopts the loaded graph only while the latch is clear.

`GesteuerteUebernahme` does not assign `writerRef` on the prop during render. `react-hooks/immutability` rejects that write. The hook exposes `writerRegistrieren`, and the component calls it from `useLayoutEffect` before paint. Mounted clicks happen after that effect. The Konto and audit once-counts still pass.

## Evidence

`npm test` and CI will not re-run `scripts/trip-traveller-snapshot-workflow-completion-1/*.test.ts` until a later allowlisted `package.json` change.

| Check | Result |
| --- | --- |
| Mounted RED, original editor | exit 1, head `318fd50821be3c83aa8ec7182ad2e6cd3a4c9dec`, payload `citizenship:CH` / `citizenshipClientRef: null` |
| Mounted GREEN, first fix, residence Enter only | exit 0, head `27102ebae649ceaaab5866a0df6db84f570c507a`, 1 test |
| Mounted matrix + residence + CSS | exit 0, 15 pass / 0 fail, head `00ba5b9124abf1cafe26b711d50b4527f40e70a5`, tree `a8d9f7f938382623622f3adf5bb3500f5fd519ef`, Node v22.23.4, Playwright 1.55.0 |
| `npm test` | exit 1. 7180 tests, 7163 pass, 12 fail, 5 skipped |
| `npm run typecheck` | exit 0 |
| `npx eslint .` | exit 0, 0 errors, 181 warnings |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug` | exit 0 |
| `npm run build` | exit 0 |

The 12 `npm test` failures are not a green gate. Eleven are local PostgreSQL proofs in this environment (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED: local PostgreSQL binaries are required`). One is the frozen suite in `lib/readiness/trip-official-evaluations-server.test.ts`: “account forwards arrays losslessly on repeated renders; existing mutation callbacks refresh” expects `refreshes === 2` and gets `1`. That file is not allowlisted and was not edited. Traveller and intake writers return `null` without calling `router.refresh` inside the writer. The hook requests refresh separately. The two narrow Workspace wiring tests that failed while `useRef` was in `GastArbeitsbereich` pass after the `WeakMap` change and are not in this failure list.

Schema-bezug still prints the existing LOCAL/UNAPPLIED RPC notes and exits 0. `next-env.d.ts` was not left dirty.

## Candidate-review correction

Reviewed head `b443fb13db1e97e0d0d85d51814046349fd7491b` left two card defects. Both are corrected on `a68e6b4a3690decb4b7f21373aa53e86c5f008d1`, tree `4f2165518fdea569afbb63d45efaef13409c276b`.

A held save whose residence changes before the writer returns, or whose intent becomes a removal confirmation, no longer stays `pending` after the writer finishes. The newer draft or confirmation stays. Accepted, returned-string and thrown results are covered. The original payload is not sent again, and that path does not call refresh. On a guest trip, an entered non-null result still latches further traveller writes without replacing the newer intent.

An accepted edit keeps its submitted fingerprint. A later delivery of that same fingerprint, while the draft generation is still that submission, clears the false conflict and can be shown as consistent. The draft is not rebuilt, so the citizenship UUID and passport relation stay. A delivery at or before settlement is still ignored. A later user edit drops the consistent claim. A different canonical graph then conflicts and keeps the newer fields. The match is not an exactly-once receipt.

The mounted command on that tree exits 0 with 18 pass / 0 fail. Node v22.23.4, Playwright 1.55.0. `npm test` on the same tree exits 1: 7181 tests, 7164 pass, 12 fail, 5 skipped. Eleven failures are the same missing local PostgreSQL 16 binaries. One is still `lib/readiness/trip-official-evaluations-server.test.ts:384`, `1 !== 2`. That test calls `onTravellerEntfernen` and then `onUnterkunftZeitraum` directly. `onTravellerEntfernen` in `KontoArbeitsbereich` invalidates and returns `null` without `router.refresh()`. `onUnterkunftZeitraum` still refreshes. The hook refreshes through `onReadinessAktualisieren` only after an accepted result, and this test never mounts the hook. The obsolete assertion is that the traveller writer itself refreshes. The file is not allowlisted. It was not edited, waived, or suppressed. T-EX1 does not include it. `npx eslint .` exits 0 with 0 errors and 181 warnings. Typecheck, the five hygiene checks, and `npm run build` exit 0.

## R1 addendum

`c589266158a4d15f90a952e370435150e45f41d7`, tree `55970376c0e8c08b0bc79610854fc4898355673a`, adds the registry warning correction and T-EX2.

An intake that returns unknown keeps that outcome on the same registry source. Cancel returns the confirmation to idle and leaves both the uncertainty sentence and the duplicate-snapshot warning. A section return does the same. The next explicit request still shows both before confirmation. Confirming calls the writer once more. Nothing retries the first attempt, and the second null is not described as proof that the first attempt did not land.

Root authorized T-EX2 for the single test “account forwards arrays losslessly on repeated renders; existing mutation callbacks refresh”. The removal callback returns null and leaves the refresh count at 0. Calling `onReadinessAktualisieren` raises it to 1 and returns `{ art: 'props' }`. The accommodation callback raises it to 2. Invalidations stay 2 and the write payloads stay the same. The mounted Konto workspace counts one `router.refresh` for accepted save, one for accepted removal, and one for accepted intake, with one writer call each.

The mounted command on this tree exits 0 with 20 pass / 0 fail. Node v22.23.4, Playwright 1.55.0. `npm test` exits 1: 7181 tests, 7165 pass, 11 fail, 5 skipped. All 11 failures are missing local PostgreSQL 16 binaries. The previous `1 !== 2` assertion is the retargeted T-EX2 test and now passes. `npx eslint .` exits 0 with 0 errors and 181 warnings. Typecheck, the five hygiene checks, and `npm run build` exit 0.

## Focus addendum

`6e3ec8b5910cf39f342844b2ccc5198f5a4617b2`, tree `8975beab7ef622a18002692c3435527375b8c8b7`, answers the focus-ownership defect reproduced on `b443fb13`.

The traveller card calls `interaktion` for a trusted focus event. Programmatic status and remove-button focus does not. Completion focus stays on the saving card only when the captured interaction is still current and `document.activeElement` is that card, or body after the disabled save button releases focus. A different card, or a target outside the traveller region, leaves the request empty. The effect depends on the focus request and the phase, not on the fresh controller object. After the status or remove button actually receives focus, `fokusVerbraucht` clears the request without incrementing the interaction count.

The mounted account host holds the writer. A save with no further move focuses the accepted status paragraph. A real pointer click on the second card’s residence country search, with the value left empty, keeps that input focused after null. Tab from “Weitere Staatsbürgerschaft” into that same search does the same. The earlier Escape path and the edited-field path still pass. Konto’s own writer returns null immediately, so this hold is not the Konto product callback. The cards are the Workspace cards.

The mounted command on this tree exits 0 with 21 pass / 0 fail. Node v22.23.4, Playwright 1.55.0. `npm test` exits 1: 7181 tests, 7165 pass, 11 fail, 5 skipped. All 11 failures are missing local PostgreSQL 16 binaries. `npx eslint .` exits 0 with 0 errors and 181 warnings. Typecheck, the five hygiene checks, and `npm run build` exit 0. No new file exception. T-EX1 and T-EX2 are unchanged.

## Boundaries

No migration, RLS, Auth, provider, secret, payment, or new dependency. No passport number, MRZ, biometrics, health, or file field. USD 100 and noindex are unchanged. Frozen writers, `gastspeicher`, `dokument-formular.ts`, and `TripWorkspaceAuditClient.tsx` are unchanged versus `origin/main`.

Stubbed account actions, stubbed refresh, and the audit bundle counter are not hosted, RLS, Auth, or Production evidence. Guest cases that go through `gastspeicher` use browser `localStorage` in the harness. A field match is not exactly-once proof. Cross-tab atomicity is unproved. Atomicity between an unresolved traveller write and a different in-flight guest writer is unproved. Full unmount drops the in-memory ledger. Native device and screen reader were not tested. Two conditional browser skips, 181 lint warnings, and 11 untriaged advisories remain pre-existing limits.
