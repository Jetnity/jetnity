# Jetnity 12Go Official Search Widget V2 — STATUS

Date: 29 October 2026 Europe/Zurich
Tracking: https://github.com/Jetnity/jetnity/issues/1085
PR: https://github.com/Jetnity/jetnity/pull/1086
State: **CONSENT_BLOCKED / DRAFT / STOP for independent Technical Lead review**

## Session

- `originalModelName`: `grok-4.7-high-fast`
- bcId: `bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c`
- Session URL: https://cursor.com/agents/bc-2a335d8e-9108-4c0e-a2f2-8d7d499fd49c
- Display name: `Jetnity 12Go Official Search Widget V2 Opt-In 1 — Cursor Generation 1`
- Rename: applied in this run. Previous title was `12Go V2 search widget`.
- Author is not the independent reviewer and does not mark Ready or merge.

## Git

- Branch: `feat/12go-v2-official-search-widget-optin-1`
- Protected main / merge-base: `e462cf7c5910ce75fa6350928326c04e33d94eee`
- Task seed: `421a703b274b489004c0b07e8d392dbc1cec6ed7`
- Plan commit: `b041aacb967e9a0c1b16a6c06f80cbd5e4343264`
- Implementation commit: `e53ac39ce51f85e0a13c51b182f2397ad606ca34`
- Implementation tree: `9e83883a884f885b83a27c28e1705f275f551c57`
- The documentation commit that adds this file is the branch head. A commit cannot store its own hash. The PR comment after push states the exact final HEAD, tree, and ahead/behind.

## Result

The official general export and the Bangkok → Koh Chang reference are stored as exact bytes. The visitor surface in Organisieren → Verbindungen keeps the V1 links and states that the general form is not loaded. There is no load button, no script, no frame, and no prefetch.

Execution stays closed:

- `status: CONSENT_BLOCKED`
- `ausfuehrbar: false`
- `isolation: NOT_ESTABLISHED`

Reason: there is no approved vendor consent policy, and safe isolation was not established. The ephemeral audit showed that pasting the official snippet runs 12Go's loader and jQuery 1.11 from `ajax.googleapis.com` in the host document. An opaque `sandbox="allow-scripts"` frame still contacted the same hosts and did not present a complete form. `app/embed/twelve-go/route.ts` was not added.

## Not done

- No Production deploy, no Ready, no merge.
- No edit to privacy, CMP, DiscoverCars, Viator, UX, affiliate V1 logic, database, Auth, or `docs/ACTIVE_WORK_STATUS.md`.
- No follow-up slice.
