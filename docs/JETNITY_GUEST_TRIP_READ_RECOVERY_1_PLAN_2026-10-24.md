# Jetnity — Guest Trip Read Recovery 1 — PLAN

Date: 24 October 2026
Status: plan before product code; Draft only; not Technical-Lead PASS
Author: **Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1**
Issue: #991
Branch: `fix/guest-trip-read-recovery-1`
PR: #994

## Session and model (before material code)

- Cursor session: `bc-2806475d-7ee4-40d0-980e-1d26bcb5b270`
- Session link: https://cursor.com/agents/bc-2806475d-7ee4-40d0-980e-1d26bcb5b270
- Actual model: `grok-4.7-high-fast` (`originalModelName` from this run). This is the requested Grok 4.7 High Fast. Not Auto. No fallback.
- UI title: rename is a real supported capability. This run renamed the chat to **Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1**. The rename call returned that title.

## Verified baseline

- Machine mode: `NORMAL` (`.jetnity/operating-mode.json`, re-read this session). Product work is allowed. Special Product-Owner gates stay in force. This UI slice does not cross one.
- `origin/main` and merge-base: `913cf9353fd33491d2bd3130b3c430cc88990200`
- Seed HEAD: `de51604c832061ffd18f5742766d5da83cd7caae`
- Seed tree: `13a8c56ac2a250aa3b3cfbbd7b2f7f997f496d18`
- Ahead/behind against `origin/main`: 1 / 0
- TASK V1 blob: `9a089b26a6892ede8f235692b92f72dc225df147` (byte-identical; this plan does not edit it)
- Runtime blobs match the task: GastReisen `c58076ec5237ae56c9af28a579034ca7e7c431b0`; GastArbeitsbereich `dba4274dc448cc452b9ed657e68cdc6b1636f727`; gastspeicher `1964cfc9b78f7361e23ff6fb9ccd64dbd3491399`; create-entry `eac2e408a74bf9b8174b6e3d5b74c5da80c02651`
- Node: v22.23.4
- Live #751 body still records R103 complete at main `913cf935`. The dispatch checkpoint is [R104 V1 / 6382797662](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6382797662). Lane B is this writer. Integration order is B → A → C. No sibling branch is integrated. Historical startup pins do not override that live assignment.
- Startup reads completed before this plan: `JETNITY_START_HERE.md`, Technical Lead / Cursor operating standard, #751 body, R104 comment `6382797662`, `AGENTS.md`, multi-agent slice planning standard, binding slice precheck, V1 binding build order §8 (dependency-free product-surface reliability), product quality standard, traveller-context policy (not applicable: no credential collection), operating mode, and the guest list/workspace/storage/create-entry sources named below. `docs/ACTIVE_WORK_STATUS.md` is not edited. Technical Lead owns global current state.

## Observed source defects

These are source findings, not a claimed Production incident.

1. `gastspeicherLaden()` keeps its compatible shape. Unreadable storage and a missing active key both come back as `aktiv: null`. Invalid active bytes also come back as `aktiv: null`, with a still-readable queue when the queue itself parses. `gastreiseLadenNach()` then returns `null` for invalid, unreadable, absent, and a different active trip alike.
2. `GastReisen` treats every empty loader result as "Deine erste Reise beginnt hier" and offers a create link. An unverified or unreadable empty result is shown as genuine absence.
3. `GastArbeitsbereich` collapses `null` into "Diese Reise ist auf diesem Gerät nicht verfügbar" plus `GastCreateLink`. There is no distinct recheck. A different valid trip is not identified, so the screen can offer create while the one guest slot is occupied. A previous `tripId` stays on screen until the effect replaces it.
4. `PlanenCreateGate` already separates not-yet-observed, unreadable, invalid, occupied-without-id, and a valid draft through `gastCreateBelegungLesen()` / `gastspeicherCreateBelegungLesen()` / `aktiveGastreiseVorpruefen()`. The list and workspace do not use that contract.
5. A valid legacy read may write the existing migration inside `gastspeicherLaden()`. A successful read is therefore not always zero-write. Invalid and unreadable paths must stay zero-write and must keep the raw bytes.

## Allowed paths

Runtime:

- `components/trips/GastReisen.tsx`
- `components/trips/GastArbeitsbereich.tsx` — initial read, loading, error, unavailable, and recheck presentation only. Mutation callback signatures and wiring stay as they are.
- `components/trips/gast-reise-lesezustand.ts` — readonly reconciliation of the existing occupancy/preflight result with one `gastspeicherLaden()` result.
- `components/trips/GastReiseLesefehler.tsx` — loading, recoverable read failure, other-trip, and queue presentation.

Proof and delivery:

- `lib/trips/guest-trip-read-recovery-1.test.ts`
- `scripts/guest-trip-read-recovery-1/**`
- `docs/evidence/guest-trip-read-recovery-1/**`
- this plan, plus STATUS, REPORT, SELF_REVIEW, and HANDOFF for this slice.

Readonly, not edited: `lib/trips/gastspeicher.ts`, `lib/trips/create-entry.ts`, `PlanenCreateGate.tsx`, `GastCreateLink.tsx`, workspace mutation callbacks, traveller/readiness/commercial wiring, adoption, account workspace, server/Auth/DB, dependencies, workflows, config, and global styles. Lane A owns creation forms. Lane C owns inventory actions. TASK V1 stays immutable.

## Implementation

1. Observe with the existing readonly contract first: `gastCreateBelegungLesen()`. Then call `gastspeicherLaden()` once. Then read the occupancy again. Compare the three known keys only to report whether that one loader call changed bytes. No new storage API, no delete, no reset, no adoption, no generated continue id.
2. Classify:
   - not yet observed, before the effect and whenever the requested `tripId` changes;
   - unreadable storage, including a missing active key whose legacy key cannot be read;
   - invalid active bytes, including a still-valid queue listed beside the failure;
   - occupied without a stored id, when the loader cannot persist a legacy migration;
   - a disagreement between the pre-load occupancy and the post-load occupancy/load pair, as a recoverable mismatch rather than absence;
   - genuine absence;
   - queue only, with the existing create link, because the active slot is confirmed empty;
   - one valid active trip, including a legacy migration that actually persisted.
3. A post-load valid trip whose id matches the later occupancy is shown. A valid active trip with a different id is not a storage error and is not substituted into the requested workspace. The workspace links to that stored id and does not offer create.
4. "Erneut prüfen" only runs the same observation again. Copy comes from `GAST_CREATE_ERHALTUNG_TEXTE` and `gastCreateGateMeldung` where those already describe the case. No exception text and no raw bytes in the UI.
5. Loading copy is visible, not only a pulse. Error and recheck controls use existing brand focus rings, min-h-11 targets, wrapping text, and a stacked layout. Create is withheld while the draft's existence is unknown, invalid, unreadable, mismatched, or already another trip.
6. `GastArbeitsbereich` resets to not-yet-observed during render when `tripId` changes, so the previous trip cannot paint as the next one. Mutation handlers stay mounted only for a matching valid trip and keep their current signatures.

## Synthetic proof

- Node tests drive the real helper through the real storage and create-entry functions with an in-memory `localStorage`. Cases: absent, valid match, valid other id, invalid active, throwing reads, restored access, invalid→valid, invalid→absent, tripId mapping, valid legacy migration and its write, failed legacy migration without a continue id, valid queue, and a preflight/load disagreement. Each controlled case records raw key bytes and write/remove counts.
- `scripts/guest-trip-read-recovery-1/` bundles and mounts the real `GastReisen` and `GastArbeitsbereich` with esbuild and isolated local Playwright. Synthetic fixtures only. The harness may shim `next/link` and `next/navigation` so the real components render outside Next. It does not stub `gastspeicher` or create-entry. A mutation observer records the loading frame. Recheck, restored access, and tripId change run in the page. Viewports 320, 390, and 1280, plus 200% root font-size reflow, assert no horizontal overflow and a reachable recheck button. Screenshots and a sanitized JSON result go under `docs/evidence/guest-trip-read-recovery-1/`.
- This does not claim hosted-account, physical-device, screen-reader, Production, or Preview behavior.

## Gates

Focused `guest-trip-read-recovery-1` tests, guest storage/create-entry regressions, the mounted harness, typecheck, lint, and the local hygiene checks that do not need hosted credentials. Full exact-head App/Auth CI and Vercel Preview remain mandatory Technical-Lead gates. No workflow, timeout, dependency, or config edit. If a local check cannot run, the report says NOT VERIFIED and the exact reason.

## Unknowns

- Whether the real workspace bundle pulls a `server-only` module when the matching trip renders `TripWorkspace`. If it does, the harness will alias only the package throw so the real component still mounts, and the report will name that boundary. Product files stay inside the allowlist.
- Exact-head CI, Auth, and Preview are not yet run for the implementation head. They are TL gates after the push.
- `next-env.d.ts` is dirty in this environment and is not part of the slice. It will not be committed.

## Boundaries

Do not mark Ready. Do not merge. Do not close #991. Do not start a follow-up slice. Do not sync `main` or edit #751. #985/#982 scoped HOLD, #917 denied hosted readback, #968 cleanup PAUSE, and #748 personal-browser suspension stay untouched. Self-review is not Technical-Lead PASS. A new head invalidates earlier gates.

## Review correction after de65696c

Technical Lead review of this plan, same session, two acceptance points. The steps above stay as the pre-code proposal. The implementation follows the correction:

1. Invalid and unreadable occupancy does not call `gastspeicherLaden()`. That loader can migrate if the key changes before its own preflight, and a later error cannot undo the write. The queue beside an invalid draft is only returned from inside that loader. No readonly contract returns it, so the error screen does not list that queue. The raw queue bytes stay. A later observation whose occupancy confirms an empty active slot still lists the queue through the ordinary loader path.
2. A legacy draft that already has a stored id stays a usable trip when the migration write fails. Post-occupancy remains valid for that same id, and the legacy bytes stay. A legacy draft without a stored id, whose migration write fails, stays occupied-without-id and gets no continue link.
