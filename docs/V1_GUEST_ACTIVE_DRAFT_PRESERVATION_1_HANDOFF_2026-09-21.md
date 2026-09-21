# Jetnity – V1 Guest Active Draft Preservation 1 HANDOFF

Stand: 21. September 2026  
Status: **IMPLEMENTED / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE**

Binding task: `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_TASK_2026-09-21.md`  
Status: `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_STATUS_2026-09-21.md`  
Self-review: `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_SELF_REVIEW_2026-09-21.md`  
Decision: `docs/V1_GUEST_ACTIVE_DRAFT_PRESERVATION_1_DECISION_2026-09-21.md`

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #530 |
| Draft PR | #532 |
| Branch | `fix/v1-guest-active-draft-preservation-1` |
| Baseline main | `e818c13ed009932bc06be1382a89467866699995` |
| Seed | `9292ac5eb587acb5256cff156ac8cf2ecf326766` |
| Agent | **Jetnity V1 guest active draft preservation 1**, Generation 1 |
| Session | `bc-7b2ee7bd-2aa2-4b83-bbf0-4d88eb19bfad` |
| Required and actual model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |

Exact freeze SHA, ahead/behind, CI/Auth/direct Preview and thread counts belong in the PR receipt.

## 2. What a reviewer should verify first

1. Diff stays inside gastspeicher / create-entry / PlanenCreateGate / TripPlanner / Reiseidee, their tests, this prefix’s docs and evidence. One smallest expansion: `lib/trips/uebernahme.test.ts` fixture only (explicit correction). No `uebernahme.ts` / GastreiseBruecke runtime edit. No #531 files.
2. `gastspeicherLaden` and both create persistence functions reuse `aktiveGastreiseVorpruefen()` and do not write/delete when the active key is occupied-unusable or unreadable. Raw active/legacy/queue stay byte-identical.
3. Confirmed absence still migrates valid legacy. Valid active still blocks a second draft. Same-`clientRef` Ablegen retry stays idempotent.
4. The old `nach Korrektur` fixtures now simulate external correction; they no longer create over invalid raw.
5. `/planen` distinguishes pending / invalid / unavailable from the existing valid one-trip gate. No continue-to-unknown-id, no lost/recoverable/no-draft claim, no destructive fix. #528 section/button classes reused.
6. TripPlanner / Reiseidee re-observe at action time via `gastCreateJetztPruefen`. Signed-in create does not inspect guest localStorage.
7. #517 adoption tests remain green. Synthetic screenshots in `docs/evidence/v1-guest-active-draft-preservation-1/`.
8. This self-review is not Technical-Lead PASS.

## 3. What this slice does not mean

- No reset/delete/export/repair product and no new storage key.
- Generic list/CTA may still show `aktiv: null` for unreadable bytes. They do not authorize `/planen` create.
- Parallel #531 owns the account read boundary. Do not merge/rebase this PR onto main or the sibling. TL integration order is #531 then this PR after explicit authorization.
- Screenshots are synthetic compiled-CSS, not Preview/hardware/Safari/WCAG.

## 4. Next action

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE / CONTRACT / VISUAL REVIEW.** No Ready. No merge. No follow-up slice.
