# Registry Traveller → Preparation Slot Integration 1 — Self Review

Date: 1 October 2026
Issue: #688
Draft PR: #689
Branch: `fix/registry-traveller-preparation-slot-integration-1`

Logical agent: **Jetnity Registry traveller preparation slot integration 1**, Generation 1
Session: https://cursor.com/agents/bc-9ea87fd0-84d7-4c15-9fad-bfa5cc51c53d
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author review. It is not an independent Technical-Lead PASS.

## R1-F1

The first head treated every ref other than in-range `traveller:1..N` as fill material. That included canonical `traveller:4` when the headcount was 3, and the test required it to become `Reisende 1`. R1 correctly rejects that. The corrected split keeps out-of-range canonical refs non-applicable. The replacement test shows `traveller:4` does not take the empty slot even when its `createdAt` is earlier than a UUID snapshot, and three out-of-range canonical refs do not mark the headcount full. UUID snapshots still fill and still reach Requirements, Preparation checks, and Safety.

## What holds

- Applicable slot count stays equal to the clamped headcount. Canonical `traveller:N` is reserved before non-canonical fill.
- Fill order was tested forward and reversed, and for equal `createdAt` by `clientRef`. Label and citizenship are not sort keys.
- The occupied slot keeps the snapshot `clientRef`. Requirements evaluations, derived preparation checks, and the Safety context fingerprint use that ref. An extra beyond headcount is absent from those three.
- A CH snapshot on a synthetic Florence trip makes a traveller-dependent CH safety fact `affected`. The same fact stays `not_affected` when the only CH traveller is beyond headcount, and `insufficient_context` when the applicable slot is empty.
- Import of a third person into a full 3-slot trip, and import into a full 1-slot trip whose party length is 1, both return the limit copy with zero Registry reads and zero writes.
- A free slot still writes only the new snapshot. Existing clientRefs are not in the payload. Freshness versus the Account Registry ref is covered by the existing materialisation tests and by the new orchestration assertion.
- The absolute length check of 20 still rejects before the Registry read. Nineteen persisted travellers on a 20-person trip are not blocked by the headcount gate.
- Diff does not include Source Catalog, freshness/gap policy, migrations, Auth, or `docs/ACTIVE_WORK_STATUS.md`.

## Residual risks

- Headcount-full and the absolute cap of 20 share `REGISTRY_TRIP_COPY.limit`. The sentence says the trip already has the maximum number of travellers and asks to remove a profile first. That is true for both gates. It does not say that raising `Trip.travellers` would also free a slot. This slice must not change the traveller count by itself. A more specific sentence would be a copy change, not a second gate.
- `createdAt` is ordered as a string, not as a parsed instant. ISO timestamps produced by this app sort chronologically. A non-ISO or offset-mixed value would follow code points. The tests use `Z` timestamps.
- Trips that already stored a non-canonical snapshot will change their applicable party, official fingerprints, and safety context on the next read. Readiness rows tied to the old empty `traveller:N` context can become stale. That is the correction of the ignored snapshot, not a silent second person.
- A second import of the same Registry person, while a slot remains, creates another independent snapshot. Same labels are not merged. That matches the task. It can fill two slots with two copies of one saved person.
- `party_schreiben` still receives only the new snapshot. This slice does not re-prove the RPC's upsert behaviour in a database. Existing orchestration tests already require that the write payload excludes current travellers.
- Local `npm test` is not fully green: 4211 pass / 1 fail, `initdb` missing at `/usr/lib/postgresql/16/bin/initdb`. The failing file is the trusted-store throwaway cluster, untouched by this lane. GitHub CI on the R1 tip is the exact-head proof for that test. The 4190/1 count belongs to `98f09deb` and is historical.
- No browser session and no real account trip were exercised. The Production reproduction must not be replayed with real personal data in this slice.

## Verdict

R1-F1 is corrected on this branch, and `main@ed5350e702f2b6b248cf49ae366420cf1b49039a` is merged with the #687 files unchanged. Independent R2 still has to read the new tip. This review does not Ready or merge.
