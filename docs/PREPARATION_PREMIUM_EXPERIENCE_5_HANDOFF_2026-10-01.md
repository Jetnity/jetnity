# Preparation Premium Experience 5 — Handoff

Stand: 30 September 2026
For: ChatGPT / Technical Lead. An older head does not approve a later head.

## Open this

1. Draft PR #665 / issue #664
2. Task: `docs/PREPARATION_PREMIUM_EXPERIENCE_5_TASK_2026-10-01.md`
3. Report: `docs/PREPARATION_PREMIUM_EXPERIENCE_5_REPORT_2026-10-01.md`
4. Self-review: `docs/PREPARATION_PREMIUM_EXPERIENCE_5_SELF_REVIEW_2026-10-01.md`
5. Evidence: `docs/evidence/preparation-premium-experience-5/audit.json` and `screens/`

## Identity

- Agent: **Jetnity Preparation premium experience 5**, Generation 1
- Session: https://cursor.com/agents/bc-37a6cdc4-88dd-4132-8c15-08cda875f94a
- `originalModelName`: `grok-4.7-high-fast`
- Original baseline: `main@2530020dbc6797b17d64c064ca5474cf90804272`
- Integrated live main: `85d730993148b058a2dd3acd19947c025bdcf7f7` (#663 Reiseplan, already containing #669 `/planen`)
- Integration commit: `a289f36a` merges that exact main. `git rev-list --left-right --count origin/main...HEAD` is `0` behind.
- Runtime and audit: `fda7a6685a0bf8cb150ee490079a7cdad7658de3`
- Audit: `2026-09-30T23:23:24.064Z`, JSON sha `fda7a6685a0bf8cb150ee490079a7cdad7658de3`, PASS
- R1 on `db42f6db571574896551b75905904d4ec07f709a`: 200% layout and the shared status-file collision
- `docs/ACTIVE_WORK_STATUS.md` matches `main`. This slice must not edit it. Central continuity stays with the later reconciliation.

Re-fetch the tip before review. The audit sha is the runtime commit. A docs commit after it does not change the preparation UI.

## Changed files against main

Runtime:

- `components/trips/Reisevorbereitung.tsx`
- `components/trips/RegistryReiseUebernahme.tsx`
- `components/trips/TripWorkspaceAuditClient.tsx` (audit fixture only; production workspace shell untouched)
- `lib/readiness/preparation-premium-experience-5.ts`
- `lib/readiness/preparation-premium-experience-5.test.ts`
- `scripts/preparation-premium-experience-5-audit.mjs`

Not edited, parallel owner #663: `TripWorkspace.tsx`, `TripWorkspacePlan.tsx`, `TripWorkspaceDetail.tsx`, `TripWorkspaceDomainNavigation.tsx`, domain search components.

Docs and evidence:

- `docs/PREPARATION_PREMIUM_EXPERIENCE_5_TASK_2026-10-01.md`
- `docs/PREPARATION_PREMIUM_EXPERIENCE_5_REPORT_2026-10-01.md`
- `docs/PREPARATION_PREMIUM_EXPERIENCE_5_HANDOFF_2026-10-01.md`
- `docs/PREPARATION_PREMIUM_EXPERIENCE_5_SELF_REVIEW_2026-10-01.md`
- `docs/evidence/preparation-premium-experience-5/`

`docs/ACTIVE_WORK_STATUS.md` is not a #665 file. The R1 revert restored the `main` copy.

## Look first

| Question | Where |
| --- | --- |
| Are the four sections on a phone? | `screens/open_360x800.png`, `screens/open_390x844.png`. JSON: four `open: true` |
| Does 200% use the shell width without a character column? | `screens/text200_360x800.png`. JSON: `horizontalOverflow` false, `htmlFont` `32px`, section width equals the parent shell |
| Do both citizenships stay visible before edit? | Audit requires Schweiz and Serbien in the closed traveller summary |
| Is the current official row separate from placeholders? | JSON `zeilen`: two `kompakt: true`, one `freshness: current` with “Nicht erforderlich” |
| Does import still confirm? | Interaction clicks “In diese Reise übernehmen: Alex Beispiel”, waits for the copy confirmation, then Abbrechen |
| Any provider call on first paint or during the proof? | Every recorded `netz` is 0 |

## Main integration

Merge of `85d730993148b058a2dd3acd19947c025bdcf7f7` was clean. No file overlapped the Vorbereitung diff. The R1 layout in `Reisevorbereitung.tsx` and `RegistryReiseUebernahme.tsx` is unchanged. #669 `/planen` and #663 Reiseplan arrived as merged on main. `docs/ACTIVE_WORK_STATUS.md` still matches `main`. After the merge, `npm test` was 4118 pass / 0 fail.

## Remote observation

The observation below is for `bc7017f7`, before the #663 main integration. It does not approve `a289f36a` or a later tip. Exact-head CI for the #663 integration is still open.

| Check | Result |
| --- | --- |
| GitHub Actions `36792746037` | SUCCESS |
| Auth-Konfiguration gegen config.toml | SUCCESS |
| Typecheck, Lint & Build | SUCCESS |
| Vercel | SUCCESS, deployment completed, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/5QvQyWozkFxSFdKMPJCKw9QufbZy` |

Combined commit status success on `bc7017f7` only. That head was 0 behind `1930e61a`. It is not the current tip.

| Check | Result |
| --- | --- |
| GitHub Actions `36790909835` | SUCCESS |
| Auth-Konfiguration gegen config.toml | SUCCESS |
| Typecheck, Lint & Build | SUCCESS |
| Vercel | SUCCESS, deployment completed, inspector `https://vercel.com/jetnity-e1b93c82/jetnity-app/A9ssh22GqeAJkvELRn6srNuA7MqE` |

Combined commit status `success`. Draft #665 stayed open. Older SUCCESS runs on `0c76df11` and `db42f6db` do not approve this head.

## Stop

Draft. No Ready. No merge. No follow-up slice. Independent Technical-Lead code, visual, mobile and truth review is required. The table above is an observation of `4e46b318`, not a Technical-Lead PASS.
