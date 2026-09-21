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
| Original baseline | `e818c13ed009932bc06be1382a89467866699995` |
| Authorized main merge | `65db24b6dda2ab0830b88fa749838ee298e243a0` once, merge not rebase |
| Seed | `9292ac5eb587acb5256cff156ac8cf2ecf326766` |
| Agent | **Jetnity V1 guest active draft preservation 1**, Generation 1 |
| Session | `bc-7b2ee7bd-2aa2-4b83-bbf0-4d88eb19bfad` |
| Required and actual model | Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`) |

Exact freeze SHA, ahead/behind, CI/Auth/direct Preview and thread counts belong in the PR receipt.

## 2. What a reviewer should verify first

1. Diff stays inside gastspeicher / create-entry / PlanenCreateGate / TripPlanner / Reiseidee, their tests, this prefix’s docs and evidence. Account files arrived only via the authorized main merge; they were not edited on this branch. One smallest expansion: `lib/trips/uebernahme.test.ts` fixture only. No `uebernahme.ts` / GastreiseBruecke runtime edit. No #534 homepage files.
2. Invalid/unreadable active is checked **before** any loader/migration. Missing active + valid legacy occupies create at render and `gastCreateJetztPruefen` without `gastspeicherLaden`. Missing active + **throwing Legacy-key read** is `speicher_unlesbar`, not empty — before network and both persistence functions. Missing active + migration-accepted Legacy **without persisted id** is `belegt_ohne_kennung`: occupied, no Continue URL, both persistence functions throw without writing.
3. Mounted `/planen` handlers: empty start, inject valid legacy, submit idea + planner → 0 model/place/create. Same for active-absent + Legacy getItem throw **and** Legacy without persisted id (no `/reisen/` href). Start-with-legacy hides both forms.
4. Confirmed absence still migrates valid legacy when a loader runs. Valid active still blocks a second draft. Same-`clientRef` Ablegen retry stays idempotent. Invalid+legacy remains byte-identical.
5. `/planen` distinguishes pending / invalid / unavailable from the existing valid one-trip gate. 360/200% viewport PNGs are 360px wide; inspect images, not element crops.
6. `gastCreateVorNetzschritt` only forwards passed state. Fresh observation is `gastCreateJetztPruefen`.
7. Signed-in create does not inspect guest localStorage. #517 adoption tests remain green.
8. This self-review is not Technical-Lead PASS.

## 3. What this slice does not mean

- No reset/delete/export/repair product and no new storage key.
- `GastCreateLink` still uses the loader; first paint with valid or id-less legacy may migrate under the existing loader contract. Out of ownership. The owned gate still refuses a converter-generated Continue URL.
- Do not merge this PR. Do not start a follow-up slice. Do not import a later main or sibling branch.
- Screenshots are synthetic compiled-CSS, not Preview/hardware/Safari/WCAG.

## 4. Next action

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE / CONTRACT / VISUAL REVIEW.** No Ready. No merge. No follow-up slice.
