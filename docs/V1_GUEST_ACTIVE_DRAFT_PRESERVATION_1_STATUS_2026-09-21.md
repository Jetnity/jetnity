# Jetnity – V1 Guest Active Draft Preservation 1 STATUS

Stand: 21. September 2026  
Status: **IMPLEMENTING / DRAFT / NOT READY / NOT MERGED**

Issue: #530  
Draft PR: #532  
Branch: `fix/v1-guest-active-draft-preservation-1`  
Binding task: `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_TASK_2026-09-21.md`  
Seed: `9292ac5eb587acb5256cff156ac8cf2ecf326766`  
Baseline main: `e818c13ed009932bc06be1382a89467866699995`

Cursor-Agent: **Jetnity V1 guest active draft preservation 1**, Generation 1  
Required and actual model: **Cursor Grok 4.6 High Fast** (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-7b2ee7bd-2aa2-4b83-bbf0-4d88eb19bfad`

This file is a point-in-time working plan. Exact-head CI / Auth / Vercel IDs belong in the final PR receipt after freeze. Agent self-review is not Technical-Lead PASS.

Traveller context: not relevant. This slice does not collect or interpret citizenship, documents, residence or route credentials.

---

## 1. Residual (not a #517 restart)

On `e818c13`, independent TL probe: active v3 raw `{bad-json` plus valid legacy. `aktiveGastreiseVorpruefen()` correctly returns `ungueltig`, but `gastspeicherLaden()` still runs legacy migration, treats invalid active as free capacity, writes the valid legacy onto the active key and performs three writes/deletes. `gastreiseAnlegen` / `gastreiseAblegen` inherit that via the loader. The existing test `nach Korrektur liest die Vorprüfung frisch` currently creates over invalid raw; that fixture will be corrected.

#517 adoption preflight remains unchanged and is not reopened.

## 2. Concrete implementation plan

### Loader / storage (`lib/trips/gastspeicher.ts`)

- Reuse `aktiveGastreiseVorpruefen()` before any migration or write.
- `gastspeicherLaden`: if `ungueltig` or `speicher_unlesbar` / `nicht_im_browser`, skip `legacyUebernehmen`, return existing `{ aktiv: null, warteschlange }` shape, zero writes/deletes. Do not throw into generic readers.
- `legacyUebernehmen` itself refuses to write when the active key is occupied-unusable or unreadable.
- `gastreiseAnlegen` and `gastreiseAblegen` re-preflight immediately before persistence and reject occupied-unusable / unreadable with own errors. Valid same-`clientRef` Ablegen retry stays. Confirmed `fehlend` still migrates / creates.
- No new storage key, backup, repair, reset, delete or export product.

### Create contract (`lib/trips/create-entry.ts`)

- Add a bounded guest-create belegung (`nicht_beobachtet` / `speicher_unlesbar` / `ungueltig` / `gueltig` / `fehlend`).
- Keep `{ erlaubt: true }` and existing `aktiveReiseId` fallback so older helper tests and the account path stay compatible.
- Authenticated create never inspects guest localStorage.
- Fresh `gastCreateJetztPruefen(angemeldet)` for action-time observation.

### Gate + callers

- `PlanenCreateGate`: pending / invalid / unavailable distinct from the existing valid one-trip gate. Non-destructive recheck. No continue-to-unknown-id, no lost/recoverable/no-draft claim, no destructive fix. Reuse #528 section/button classes.
- `TripPlanner` / `Reiseidee`: replace `gastspeicherLaden().aktiv?.id` preflight with action-time `gastCreateJetztPruefen`. Handle the new errors. No layout/class, validation, model or provider change.

### Tests / evidence

- Adjust the correction fixture; add `lib/trips/guest-active-draft-preservation.test.ts`.
- Extend gastspeicher + create-entry tests for bytes-identical reject paths and before-network gates.
- Compiled-CSS synthetic screenshots at 390 (invalid / unavailable / retry / valid gate) and 360/200% readability. Abort unexpected mutations before interaction.

## 3. Files in exclusive ownership

Runtime: `lib/trips/gastspeicher.ts`, `lib/trips/create-entry.ts`, `components/trips/PlanenCreateGate.tsx`, `components/trips/TripPlanner.tsx`, `components/trips/Reiseidee.tsx`.  
Tests: existing gastspeicher/create-entry tests + own preservation test.  
Docs/evidence: own `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_*` and `docs/evidence/v1-guest-active-draft-preservation-1/**`.

Not touched: types/trips, schema/mappers/readiness/credentials, uebernahme/GastreiseBruecke, account graph (#531), Auth, SQL, global continuity files, sibling branches.

## 4. Next step in this session

Implement the plan, then commit/push a pre-testing head, run gates, capture evidence, freeze, STOP.
