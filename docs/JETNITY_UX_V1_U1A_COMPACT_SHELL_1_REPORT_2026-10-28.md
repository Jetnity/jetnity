# UX V1 U1-A — REPORT

## Umgesetzt

The Trip Workspace header now leads with the stored title, the real route, the real date, and the guest-device or account save sentence. Travellers and budget open from a native disclosure. The four modes stay Übersicht, Reiseplan, Organisieren, and Vorbereitung.

Ordinary phone widths use a fixed text bottom bar with safe-area CSS and 44px targets. At 320px and below, at root font 32px, at browser/page scale >= 1.9, when the visual viewport loses more than 80px, or while a compact detail is open, the bar is an in-flow wrap. From 768px upward, under normal text and zoom, the tabs stay sticky under the site header. At 320px, root 32px, page scale >= 1.9, or a keyboard gap, the four labels stack one per row under the site header. They are not a fixed bottom bar. Page scale does not resize the site header; a long title can extend past the visual window until the user pans. That limit is measured, not passed off as full zoom accessibility.

Overview spacing is tighter. The three-item attention list, further-groups control, audit panel, and per-stage essentials are the existing ones.

## Dateien

- `components/trips/TripWorkspaceKopf.tsx`
- `components/trips/TripWorkspaceModeNavigation.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `components/trips/TripWorkspace.tsx` (shell marker and bottom padding only)
- `lib/trips/ux-u1a-shell-1.ts`
- `lib/trips/ux-u1a-shell-1.test.ts`
- `scripts/ux-u1a-shell-1/audit.mjs`
- `docs/evidence/ux-v1-u1a-shell-1/report.json` only. The earlier PNG blobs are removed.
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
- Browser audit `node scripts/ux-u1a-shell-1/audit.mjs` against a fresh `next start` of this fix: pass. Every measured label rect has `enthalten: true`. At 320px, Organisieren text is 114.39–205.59 inside button 21–299. At 390px and root 32px, Organisieren text is 103.80–286.20 inside button 41–349. Page scale 2 kept root font 16, nav `flow`/`sticky`, and `shellMarker: false`. Provider request count 0.
- `lib/trips/guest-nav-text-1.test.ts` was not modified. System Chrome 148 passed the mounted suite, including the case that failed in CI job 122576123475.

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
