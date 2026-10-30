# Jetnity White Mint Home and Workspace 1 — REPORT

30 October 2026. Local evidence only. Not a Technical Lead PASS and not a Production change.

## What changed

`styles/white-mint.css` sets the approved pairs on two scopes:

- `[data-white-mint="home"]` for the homepage wrapper and main.
- `.workspace-shell[data-workspace-theme="light"]` for the light workspace.

Canvas `#F7FCF9`, cards `#FFFFFF`, navigation `#EFF7F2`, text and primary actions `#143E33`, selected surfaces `#E1F1E8` with an inset bar, decorative edges `#DCE9E1`. Control borders and focus use `#2F5A4E` / `#143E33` because `#DCE9E1` on white is about 1.25:1. Muted text that previously used ink-700 (`#6F827D`, about 4.07:1 on white) is `#3A564C` inside these scopes (about 7.7:1 on the canvas). Homepage footer labels that were white at 45% on brand-900 were about 4.08:1; they are white at 78% inside the homepage only.

Green rules are not retargeted. Grain and document overscroll change only while the homepage marker or a light shell is present, via `:has()`.

## Measured colors

Chrome 148, channel `chrome`, loopback fixture. Full table: `docs/evidence/white-mint-home-workspace-1/computed-colors.json`.

Mint homepage at 320, 390, 768 and 1440:

- document and main `rgb(247, 252, 249)`
- header `rgb(239, 247, 242)` with text `rgb(20, 62, 51)`
- a white card `rgb(255, 255, 255)`
- footer remains `rgb(15, 48, 42)`
- hero heading remains white
- grain opacity `0`
- horizontal overflow `0`

The same homepage without `white-mint.css` still measures main as the old beige `#F5F4EE`. That is the counterexample. A class name alone does not pass.

Light workspace shell `rgb(247, 252, 249)`, sidebar and bottom nav `rgb(239, 247, 242)`, selected link `rgb(225, 241, 232)` plus `inset 3px` of `rgb(20, 62, 51)`. Overflow `0` at the four widths. Account path `/account/settings` selects Einstellungen. The unscoped shell is still beige.

Green shell background stays `rgb(16, 31, 27)`, not the mint canvas. Toggle Hell → Grün → Hell writes `jetnity:workspace-theme:v1` and restores the mint shell. A `.dark` probe stays `rgb(10, 20, 18)`. A local provider frame stays `#123456`. No non-loopback request was made.

A synthetic guest trip `trip-white-mint` (Lissabon, 2–4 November 2026) saves a note, reloads it, edits it, and reloads the edit through the real plan storage helpers. Focus on the note field is ink outline, control border and white fill. An empty new point shows the real danger alert after the native `required` attribute is removed so the component validation can run.

Root font 32px on the homepage does not overflow more than the unscoped page at 320 and 1440. That is root-font enlargement, not browser zoom.

## Screenshots

`docs/evidence/white-mint-home-workspace-1/`:

- `before-homepage-1440.png`, `after-homepage-1440.png`, `after-homepage-1440-full.png`, `after-homepage-390.png`
- `before-workspace-1440.png`, `after-workspace-1440.png`, `after-workspace-390.png`, `after-workspace-note-390.png`

## Commands run here

- `npx tsx --test lib/ui/white-mint-home-workspace-1/palette.test.ts lib/ui/white-mint-home-workspace-1/browser.test.ts` — 9 pass, 0 fail.
- `npm run typecheck` — pass.
- `npx eslint` on the owned TypeScript and the three edited sources — 0 warnings.
- `node scripts/erreichbarkeit.mjs` and `node scripts/exporte.mjs` — no orphan, no unused export.
- `npm run build` — pass. Setup check warned only that no `.env` file is present. Static homepage still generated.

## Limits

Other public pages keep the warm canvas. The single root `themeColor` is `#F7FCF9` for the whole app, including admin. The fixture shims `next/link`, `next/image`, `next/navigation`, sign-out and the browser Supabase client. It does not open a hosted account, the real settings form, or flight/hotel/activity search. #1082 is not merged into this branch, so green and BackToTop behaviour are this branch's current sources. Browser zoom, physical devices and VoiceOver were not run. Native CI and Preview exist only after the push and are not a UI acceptance.
