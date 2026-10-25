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

## Boundaries

No migration, RLS, Auth, provider, secret, payment, or new dependency. No passport number, MRZ, biometrics, health, or file field. USD 100 and noindex are unchanged. Frozen writers, `gastspeicher`, `dokument-formular.ts`, and `TripWorkspaceAuditClient.tsx` are unchanged versus `origin/main`.

Stubbed account actions, stubbed refresh, and the audit bundle counter are not hosted, RLS, Auth, or Production evidence. Guest cases that go through `gastspeicher` use browser `localStorage` in the harness. A field match is not exactly-once proof. Cross-tab atomicity is unproved. Atomicity between an unresolved traveller write and a different in-flight guest writer is unproved. Full unmount drops the in-memory ledger. Native device and screen reader were not tested. Two conditional browser skips, 181 lint warnings, and 11 untriaged advisories remain pre-existing limits.
