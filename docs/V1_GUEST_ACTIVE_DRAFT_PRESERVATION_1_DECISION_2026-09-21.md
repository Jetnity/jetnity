# V1 Guest Active Draft Preservation 1 — Implementation decision

Date: 21 September 2026  
Agent: **Jetnity V1 guest active draft preservation 1**, Generation 1  
Session: `bc-7b2ee7bd-2aa2-4b83-bbf0-4d88eb19bfad`  
Model: Cursor Grok 4.6 High Fast

## Decision

Treat a present but unreadable/invalid active v3 key as **occupied capacity**, not free space. Ordinary reads and rejected creates must leave raw active / legacy / queue bytes identical. Creation is blocked until a later observation sees confirmed absence or a valid trip.

## Alternatives rejected

1. **Repair / migrate invalid active onto valid legacy** — this is the reproduced defect (three writes/deletes). Forbidden.
2. **New storage key or backup copy** — out of scope; would invent recovery data.
3. **Throw from `gastspeicherLaden`** — would break every read-only guest consumer. Loader keeps `{ aktiv: null, warteschlange }` and create-specific state lives in the gate / create contract.
4. **Let signed-in create inspect guest localStorage** — account create stays independent.

## Consequences

- `aktiveGastreiseVorpruefen()` remains the single read-only observation of the **active** key.
- Loader skips legacy normalization when the active key is occupied-unusable or the storage getter/getItem fails.
- Both persistence functions recheck at write time.
- `/planen` distinguishes pending, invalid and unavailable from the existing valid one-trip gate.
- Generic list/CTA surfaces may still see `aktiv: null` for unreadable bytes; that is an accepted residual, not a silent “no draft” create authorization.

## Follow-up decision (GP-R1, same date)

Create occupancy is not active-v3-only. After the active-key preflight, a missing active key plus a valid legacy draft is occupied capacity. Detection reuses `ausLegacy` inside gastspeicher, newest `updatedAt` first, and does **not** write or migrate. Invalid/unreadable active is still decided before any legacy parse. PlanenCreateGate must not call `gastspeicherLaden()` to read a title, because that would migrate a legacy-only draft during observation.

Rejected alternative: keep the gate on active-v3 only and rely on `gastreiseAnlegen` to throw after the loader migrates. That is the TL counterexample — the guest can already start model/place work.

`gastCreateVorNetzschritt` only forwards passed state. Fresh storage observation is `gastCreateJetztPruefen`.

## Follow-up decision (GP-R3, same date)

A successful absent active-key read plus a **throwing** Legacy-key read is storage-unavailable, not a free slot. `rohLesen` still swallows parse/access errors for generic loader consumers; create occupancy and both persistence preflights use `schluesselRohLesen`, which keeps access failure distinct from absent or schema-invalid Legacy bytes. No new storage key and no malformed-Legacy cleanup.

## Follow-up decision (GP-R4, same date)

A migration-accepted Legacy record whose `id` is missing, empty or not a string occupies create as `belegt_ohne_kennung`. Observation reuses `ausLegacy` only for acceptance; the Continue destination uses only a persisted non-empty string id (`legacyPersistierteKennung`). Converter-generated ids stay in-memory for the loader and are not exposed as `/reisen/…`. Repeated observations stay occupied without an id and write nothing. The loader still generates an id when it actually migrates. No UUID cache, no new key, no cleanup.
