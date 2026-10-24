# Jetnity — Manual Mobility Pending Draft Guard 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Manual Mobility Pending Draft Guard 1 — Cursor Generation 1**
Session: `bc-529c718d-03e4-43f9-a8fa-7e555d3f4cbf`
Model: `grok-4.7-high-fast`

## Status

Partly finished for author delivery. The component behavior is implemented and proved locally. Technical-Lead PASS, Ready, and merge are not done.

## Umgesetzt

`ManuelleVerbindung` disables every submitted control while its existing save is pending and marks the form `aria-busy`. Success, failure, one-write, and unmount behavior stay on the previous instance-local path. An isolated harness mounts the real component and exercises keyboard, pointer, duplicate submit, both error paths, retry, prefill, and unmount/remount.

## Dateien

See the handoff file list. Production ownership stayed inside exported `ManuelleVerbindung`.

## Datenbank

No migration, RLS, type, or schema change.

## Tests

Harness PASS. Evidence `docs/evidence/manual-mobility-pending-draft-guard-1/result.json`.
Screenshots: `narrow-320-pending.png`, `narrow-390-pending.png`, `wide-1280-pending.png`, `narrow-390-error-then-retry.png`.
The last screenshot is the settled retry after the returned-error path, not a picture of the alert. The alert text was asserted before that retry.

`npm test`: 7044 tests, 7028 pass, 11 fail, 5 skipped, exit 1.
Failed tests, all native PostgreSQL and none in this slice:

- catalog hardening: disposable PostgreSQL upgrade, raw RPC and eligibility proof
- native PG16 accepted-store projection bypass proof
- S1 disposable PostgreSQL 16 cutover
- current-version lookup on native PostgreSQL 16
- R3 native canonical URL publication
- real disposable PostgreSQL structural proof
- primary and composed v2 bundle SQL proof
- R5 native legacy and typed SQL consumers
- M1–M4 synthetic atomic custody
- throwaway PostgreSQL proof for the source catalog gateway
- throwaway PostgreSQL proof for the trusted store gateway

Observed skip markers include T09 without `TRIP_AUDIT_UI_URL`, shared responsive layout without `SHARED_LAYOUT_AUDIT_BASE`, and native PostgreSQL/CI-only skips. Runner total is 5 skipped. No new skip was added.

## Build

`npm run build` exit 0, including `prebuild` / `check:setup`.

## Security

No new route, secret, Auth, RLS, or service-role path. The pending lock is a client interaction guard for one form. Server-side validation of a manual connection is unchanged.

## Kosten

No new recurring cost.

## Dokumentation

Plan, status, self-review, handoff, report, and synthetic evidence. Central `ACTIVE_WORK_STATUS` and `JETNITY_START_HERE` were not edited. Traveller-context collection is not relevant: the form stores a user-entered connection and does not infer citizenship, documents, or visas.

## Offene Punkte

Independent exact-head review. GitHub CI and Preview for the final head. Local PostgreSQL proofs remain environment-blocked and are not part of this acceptance.

## Risiken

P0 none. P1 none. P2 local native PostgreSQL suite is red in this environment for the eleven proofs above. P3 Chrome channel was used because downloaded Playwright Chromium was missing; disabled date/time fields can show a format hint; 146 existing lint warnings remain.

## Empfehlung

Technical Lead reviews the final head independently. Cursor does not Ready, merge, or open the next slice. Integration stays A then B when the Technical Lead instructs it.
