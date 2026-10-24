# Jetnity — Shared Search Keyboard Lifecycle 1 — PLAN

Date: 24 October 2026
Status: plan before code; Draft only; not Technical-Lead PASS
Author: **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**
Issue: #987
Branch: `fix/shared-search-keyboard-lifecycle-1`
PR: #989

## Session and model (before material code)

- Cursor session: `bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e`
- Session link: https://cursor.com/agents/bc-f17cfe4a-c64f-420f-980c-59c8d82cb19e
- Actual model: `grok-4.7-high-fast` (`originalModelName` from this run). This is the requested Grok 4.7 High Fast. Not Auto. No fallback.
- UI title: rename is supported. This run renamed the chat to **Jetnity Shared Search Keyboard Lifecycle 1 — Cursor Generation 1**. The rename call returned that title.

## Verified baseline

- Machine mode: `NORMAL` (`.jetnity/operating-mode.json`, re-read this session).
- `origin/main` and merge-base: `e372f4d830c35a74a235d345c2baaf08ab615e6c`
- Seed HEAD: `2e6aea450031946518ba92b5e2e40287b908e888`
- Seed tree: `ea90d46c974beaf813c19aab66c2c2d7dc80607f`
- Ahead/behind against `origin/main`: 1 / 0
- TASK V1 blob: `2e1a966a23bbc302bb59bd367740f2425060f445` (byte-identical; this plan does not edit it)
- Ownership comment: #751 comment `6377454444`. Precheck `6377421153` authorizes this lane only. #748 has no newer material after that precheck's bounded read. Lane A is not touched.
- Startup reads: `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md` (not edited; Technical Lead owns it), operating standard, slice-planning standard, binding precheck, `AGENTS.md`, operating mode. Live evidence wins over the historical writer paragraphs.

## Outcome

Both existing comboboxes close on Escape and on actual focus exit. After close, and whenever the rendered option set cannot contain the old index, `aria-activedescendant` names only a currently rendered option or is absent. Explicit Place-ID and confirmed-IATA selection, search cancellation, and result truth stay as they are. `components/suche/Suchliste.tsx` stays read-only. Its option `mousedown` `preventDefault` is what keeps pointer selection from blurring the input.

## Implementation

1. `lib/suche/tastatur.ts`: add `sucheAktiveOption(aktiv, anzahl)`. It returns the index only when that index is an integer inside the current rendered-option count; otherwise `-1`. Extend `lib/suche/tastatur.test.ts` for in-range, empty, short, and non-integer cases. No query, debounce, ranking, or id/code change.
2. `components/places/OrtSuche.tsx` and `components/airports/FlughafenSuche.tsx`, same lifecycle:
   - Rendered option count is `treffer.length` only while `lage === 'results'`. Loading, empty, error, and unavailable render a popup without options, so the active descendant is absent.
   - Bind `aria-activedescendant` and `Suchliste`'s `aktiv` to that derived index.
   - Escape, outside pointer, and blur whose next focus is outside the combobox root set `offen` false and `aktiv` to `-1`. Do not clear the typed text, do not call `onChange`, and do not handle Tab, so native Tab and Shift+Tab keep moving focus.
   - A pointer that starts on a rendered option suppresses blur-close until the click can run. If focus is still inside afterward, leave the open list to the existing click selection. This stays in the owned components so `Suchliste` need not change.
   - Arrow and Enter use the derived index. Enter does nothing when the popup is closed or when no rendered option is active. An out-of-range index is reset to `-1` and is not wrapped onto another row.
   - A parent text/value adoption that actually replaces the field text also clears the highlight. An echoed `initialText` equal to the current text does not, so a keystroke echo cannot wipe a highlight. `ortSucheAnzeigetextAbstimmen` and the airport `value.name` sync stay in place.
3. If the real-component harness shows that mouse or touch selection still requires a `Suchliste` change, stop and request a minimal amendment. Do not edit it in this plan.
4. New `scripts/shared-search-keyboard-lifecycle-1/` harness imports the real components through the existing `tsx`/`esbuild` bundle path and Playwright. Local disposable context only. Synthetic `/api/search/places` and `/api/search/airports` responses. Abort every other request. No public route, account, personal profile, or hosted API. Scenarios for both components: ArrowDown then Escape; active result then Tab and Shift+Tab with focus-target assertion; outside click; refocus, Arrow, Enter; mouse choice; touch choice at 390px; short, empty, error, unavailable, and loading responses; parent value change. Assert `document.getElementById` for the active descendant, popup presence, callback count, and canonical id or IATA. Keyboard and pointer context is 1280px. Touch context is 390px.
5. After the harness is honest, write STATUS, SELF_REVIEW, HANDOFF, REPORT, and sanitized evidence under `docs/evidence/shared-search-keyboard-lifecycle-1/`. Handoff pins runtime head plus docs delta; the PR comment carries the final exact HEAD. No edit to TASK, `ACTIVE_WORK_STATUS`, `JETNITY_START_HERE`, or central handoffs.

## Gates

Relevant existing `lib/suche` tests, place-selection synchronization, and airport canonicalization, then the new harness. On the final head: `npm test`, typecheck, lint, `check:setup`, `check:operating-mode`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`, and production build. Ordinary existing CI/Preview from this branch push is allowed. No dependency, lockfile, workflow, config, or timeout edit. No database, Auth, provider, secret, or production action.

## Boundaries

Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not sync `main`. Lane A and held #985/#982, #917, #748 personal-browser, #968, #913/Bern/#937, #626, and #957 stay untouched. Self-review is not Technical-Lead PASS. A new head invalidates earlier gates.
