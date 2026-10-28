# UX V1 U1-A — REPORT

## Umgesetzt

The Trip Workspace header now leads with the stored title, the real route, the real date, and the guest-device or account save sentence. Travellers and budget open from a native disclosure. The four modes stay Übersicht, Reiseplan, Organisieren, and Vorbereitung.

Ordinary phone widths use a fixed text bottom bar with safe-area CSS and 44px targets. At 320px and below, at root font 32px, at browser/page scale >= 1.9, when the visual viewport loses more than 80px, or while a compact detail is open, the bar is an in-flow wrap. From 768px upward, under normal text and zoom, the tabs stay sticky under the site header. Page scale also limits the workspace shell to the visible width so a long title wraps instead of running past the zoomed window.

Overview spacing is tighter. The three-item attention list, further-groups control, audit panel, and per-stage essentials are the existing ones.

## Dateien

- `components/trips/TripWorkspaceKopf.tsx`
- `components/trips/TripWorkspaceModeNavigation.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `components/trips/TripWorkspace.tsx` (shell marker and bottom padding only)
- `lib/trips/ux-u1a-shell-1.ts`
- `lib/trips/ux-u1a-shell-1.test.ts`
- `scripts/ux-u1a-shell-1/audit.mjs`
- `docs/evidence/ux-v1-u1a-shell-1/`
- this PLAN / STATUS / HANDOFF / SELF_REVIEW / REPORT set

## Datenbank

None.

## Tests

- `lib/trips/ux-u1a-shell-1.test.ts`: 4 pass
- `lib/trips/trip-workspace-premium-experience-3.test.ts` and `lib/trips/cross-device-interaction-1.test.ts`: pass (16 together with the new tests on the earlier run)
- `node scripts/erreichbarkeit.mjs`: no orphan files
- `node scripts/exporte.mjs`: no unexplained exports
- ESLint on the touched TS/TSX files: 0 errors. Two existing `react-hooks/set-state-in-effect` warnings in `TripWorkspace.tsx` were already on the branch and were not introduced by the padding edit.
- `tsc -p tsconfig.json --noEmit`: no errors reported for these files
- `npm run build`: success (Next.js 16.4.1). Setup check warned only that no `.env` file is present.
- Browser audit `node scripts/ux-u1a-shell-1/audit.mjs` against `next start` with `JETNITY_UI_AUDIT=1` on 127.0.0.1:3462: pass. Matrix 280/320/360/390/430/768/1440, root 32px at 390 and 768, CDP page scale 2 at layout width 780 with root font still 16px, account disclosure, mode push and three backs, focus not covered by the bottom bar, scripted keyboard stand-in. Provider request count 0. See `docs/evidence/ux-v1-u1a-shell-1/report.json`.

## Build

Production build succeeded before the final browser audit. The audit server served that build.

## Security

No auth, RLS, secret, provider, or write-path change. The audit route stays fail-closed unless `JETNITY_UI_AUDIT` is set, and it stays off when `VERCEL_ENV=production`.

## Kosten

None.

## Offene Punkte

Fresh native App CI, Auth CI, and Vercel Preview on the implementation head. OS keyboard and a non-zero safe-area inset were not reproduced. The loading sentence was not frame-captured.

## Risiken

A later head invalidates this browser pass. U1-B must not start on this branch. The site header is outside the zoom shell cap.

## Empfehlung

Technical Lead reviews this head after CI and Preview. Cursor stops. No Ready, no merge, no follow-up slice.
