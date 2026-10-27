# V2-S2 Traveller and Preparation Clarity 1 — PLAN

Date 27 October 2026. Tracking #1049. Draft PR #1053. Branch `fix/v2-s2-traveller-prep-1`.

Immutable task: `docs/JETNITY_WORK_V2_S2_TRAVELLER_PREP_1_TASK_V1_2026-10-27.md`. This plan does not amend that task.

## Session

- Logical name: Jetnity V2 Traveller and Preparation Clarity 1 — Cursor Generation 1
- `cursor-cloud run-info.originalModelName`: `grok-4.7-high-fast`
- Session: `bc-a62482f0-b662-484a-b2a4-ca39b15ea410`
- Link: https://cursor.com/agents/bc-a62482f0-b662-484a-b2a4-ca39b15ea410
- Display name confirmed by `rename-chat`: Jetnity V2 Traveller and Preparation Clarity 1 — Cursor Generation 1
- Pre-rename `run-info.name`: `V2 S2 traveller preparation`
- This is not the Activities writer.

## Live gate before edits

- `.jetnity/operating-mode.json` mode `NORMAL`
- Fetched `origin/main` `d31a16afdac5e97d4b02f4cb5824f5adc290577c`
- Seed head `d78b39f1bab781ea270cc8fa95b10d08775695b7` was 1 ahead / 0 behind
- #751 current body still names main `d31a16afdac5e97d4b02f4cb5824f5adc290577c` and assigns F04/F10/F11 to the independent people/preparation writer #1049
- No base sync. No CI edit.

## Source-backed change

1. F04. `uebersichtPersonen` counted `party.length` whenever any profile existed, so one partial profile turned a stored headcount of 2 into `1 Reisende Person`. The stored `Trip.travellers` value is the group total. `party.length` is only how many profile records exist. Header text for 2 travellers and 1 profile is `2 Reisende · 1 von 2 Profilen vorhanden`. Names, citizenships and documents are not read. If the profile count exceeds the stored headcount, or the headcount is not a positive integer, the text is `Anzahl der Reisenden und erfasste Profile stimmen nicht überein.` and the count stays unset.
2. F11. `Reisevorbereitung` showed `MEHRERE_REISENDE_HINWEIS` from `summary.individualClaimsForbidden`, which is also true for one traveller with a missing nationality. The hint now follows `mehrereReisendeLage`: only a known headcount above 1. A contradictory snapshot shows the same unsettled sentence and does not claim one person or several.
3. F10. Closed personal rows only offered `Titel bearbeiten`, which hid Offen / Erledigt / Nicht relevant. A sibling `Status ändern` opens the same editor, focuses Offen, and still writes only on `Speichern`. Title editing, optimistic phases, barrier, retry and concurrent isolation stay.

`TripWorkspaceKopf` already prints `uebersicht.personen.text`, so it does not need its own copy change.

## Out of scope

No edits to `lib/readiness/party.ts`, identity, auth, guest CTA/nav, lodging, timeline day writes, native activities / GetYourGuide, CI, providers, secrets, DB, RLS, Official Truth, indexing, or the monthly cost cap. No Ready, no merge, no follow-up slice.
