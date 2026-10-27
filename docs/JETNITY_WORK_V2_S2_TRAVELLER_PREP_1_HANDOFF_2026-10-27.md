# V2-S2 Traveller and Preparation Clarity 1 — Handoff

Date 27 October 2026. Tracking #1049. Parent #1046. Draft PR #1053.

Logical agent **Jetnity V2 Traveller and Preparation Clarity 1 — Cursor Generation 1**.  
`cursor-cloud run-info.originalModelName`: `grok-4.7-high-fast`.  
Session `bc-a62482f0-b662-484a-b2a4-ca39b15ea410`.  
https://cursor.com/agents/bc-a62482f0-b662-484a-b2a4-ca39b15ea410  
Display name confirmed by `rename-chat`.

This handoff is the author packet. It is not an independent Technical Lead PASS, not Ready, and not a merge.

## Heads

- Live `origin/main` at the pre-edit fetch and at the harness run: `d31a16afdac5e97d4b02f4cb5824f5adc290577c`. Branch was 0 behind. No base sync.
- Mode `NORMAL` in `.jetnity/operating-mode.json`. #751 still named that main and assigned F04/F10/F11 to #1049.
- Product implementation: `739fb017b4c2551ed9694e65d8abbb521194ee31`.
- Harness attribution: `397dbeef601b7061606001d8947cf71bf4044045`.
- `kopfzahl` kept internal so `check:exports` passes: `d7ca07a9ca1e12d7e02a376234a43c287a7950fd`, tree `618c571e006aa97699a1c8322751a486f1fec888`. The CSS report observes this head.
- The evidence commit that adds this file does not change product source. Review the branch tip. A newer head invalidates this packet.

## What changed

- F04. `uebersichtPersonen` uses stored `Trip.travellers` as the group total. One saved profile on a 2-person trip renders `2 Reisende · 1 von 2 Profilen vorhanden`. Zero profiles keep `Angaben noch offen`. A full profile list renders the headcount only. Names, citizenships and documents are not read. If `party.length` exceeds the headcount, or the headcount is not a positive integer, the count is unset and the text is `Anzahl der Reisenden und erfasste Profile stimmen nicht überein.`
- F11. `Reisevorbereitung` no longer shows `MEHRERE_REISENDE_HINWEIS` from `individualClaimsForbidden`. `mehrereReisendeLage` shows that sentence only for a known headcount above 1. A contradictory snapshot shows the unsettled sentence instead. One traveller, including one traveller with a missing nationality, does not get the multi-person sentence. The summary flag itself is unchanged and is not displayed.
- F10. A closed personal row has `Status ändern` beside `Titel bearbeiten`. It opens the existing editor, focuses Offen, and still persists only on `Speichern`. Saved `data-readiness-status` stays unchanged until that save. Barrier, retry, pending and concurrent behaviour are the existing lifecycle.

`TripWorkspaceKopf` already displays `uebersicht.personen.text`.

## Local gates on `d7ca07a9`

- `lib/trips/uebersicht.test.ts`: 17 pass, 0 fail, re-run after `kopfzahl` stopped being exported.
- `scripts/trip-personal-preparation-workflow-completion-1/personal-preparation-workflow-ui.test.ts`: 20 pass, 0 fail. Includes Guest and Account status keyboard at 320 and 390 with a 32px root font, without production CSS. Choice does not call `onSetzen` until `Speichern`.
- `lib/readiness/preparation-identity.test.ts`: 8 pass, 0 fail.
- `scripts/trip-personal-preparation-workflow-completion-1/arbeitsbereich.test.ts`: 6 pass, 0 fail. Guest and Account workspace paths, including the existing title-edit status save.
- `npx eslint` on the touched product and harness files: exit 0, `--max-warnings 0`.
- `npm run build`: exit 0. Production CSS present under `.next/static`.
- CSS harness `ablauf.ts` on `d7ca07a9`: exit 0. Report `docs/evidence/work-v2-s2-traveller-prep-1/ablauf.json`. `status-390` document 390/390, list 366/366, button height 44. `status-320-root32` root font 32px, document 320/320, list 272/272, button height 80. Keyboard selected Erledigt and did not write. Chromium 140.0.7339.16. This is a local CSS font-size simulation, not a device, zoom, or screen-reader pass.
- `npm run check:exports`: 1287 files, 0 uncalled exports. `npm run check:dead`: 0 unwarranted orphans. `npm run check:deps`: 0 unused checked dependencies. Run on the `d7ca07a9` tree before that commit; the commit is that same one-line change.
- Not run: the full `npm test` lib suite, hosted Preview, post-push CI, private account, CUA, or Production.

## Boundaries

No DB, SQL, RLS, Auth, identity, party-slot, or schema change. No Official Truth activation. No #917 hosted readback. No #985/#982 hold bypass. No provider, payment, secret, booking, indexing, or cost change. No S0/S1/S3 or #1043 activity/GetYourGuide edits. No CI edit. No Ready. No merge. No follow-up slice.

## Next step

Independent Technical Lead exact-head review of the branch tip. Do not treat this author packet or the harness screenshots as that review.
