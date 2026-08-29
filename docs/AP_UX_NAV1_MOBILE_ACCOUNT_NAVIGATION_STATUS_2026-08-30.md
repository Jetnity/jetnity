# Jetnity – AP-UX-NAV1 Mobile Account Navigation Rail Status

Stand: 30. August 2026  
Status: **IMPLEMENTED ON BRANCH / LOCAL GATES GREEN / EXACT-HEAD CI+VERCEL GREEN / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**  
Issue: #228  
Draft-PR: #229  
Cursor-Agent: `Account plattform audit vorbereitung 20`

## Baseline and authorization

- Task: `docs/AP_UX_NAV1_MOBILE_ACCOUNT_NAVIGATION_RAIL_TASK_2026-08-30.md`
- Slice-cut baseline: `main @ 0ac7296fbd9e348b05a30b4c43cd5fe1815e24d9`
- Parallel slice: TA-DL1 / PR #227 remains untouched
- Traveller-context check: **nicht relevant**. Die Navigation ändert keine visa-/dokument-/staatsangehörigkeitsabhängige Aussage.

## Implemented

1. Mobile Account-Navigation ist eine **einzeilige, nativ horizontal scrollbare Tab-Leiste**. Kein `grid-cols-2`, kein `flex-wrap`, keine eigene Swipe-to-Navigate-Geste.
2. Reihenfolge: **Übersicht → Reisen → Reisende → Einstellungen**.
3. Aktiver Tab bleibt `aria-current="page"` und wird bei Bedarf nur **waagrecht** in die Leiste geholt (`scrollBy`, `block` nie).
4. `/reisen` bleibt dieselbe Route. Dieselbe serverseitige `auth.getUser()`-Aussage steuert Daten **und** die gemeinsame `AccountNavigation`. Gäste sehen keine Konto-Leiste.

## Files

Runtime:

- `components/account/AccountNavigation.tsx`
- `lib/account/navigation.ts`
- `app/(public)/reisen/page.tsx`

Tests / audit:

- `lib/account/navigation.test.ts`
- `scripts/account-ui-audit.mjs` (einzeilige Reihenfolge/Row-Messung)

Slice docs:

- this status
- `docs/AP_UX_NAV1_MOBILE_ACCOUNT_NAVIGATION_SELF_REVIEW_2026-08-30.md`
- `docs/AP_UX_NAV1_MOBILE_ACCOUNT_NAVIGATION_HANDOFF_2026-08-30.md`

Nicht geändert: TA-DL1 Traveller-/Document-Lifecycle-Dateien, `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, Migrationen, Auth/MFA/AAL/RLS/Supabase.

## Local gates

Verified in this authoring environment before this stamp:

| Gate | Ergebnis |
| --- | --- |
| Focused `lib/account/navigation.test.ts` | **8/8 pass** |
| `npm test` | **2718/2718 pass, 0 fail** |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| `npm run lint` | **0 errors** (135 bestehende Repo-Warnings, keine in den AP-UX-NAV1-Dateien) |
| `check:dead` | nur begründete CookieConsent-Ausnahme |
| `check:exports` | 0 unbegründete Exporte |
| `check:deps` | pass |
| `check:api-schutz` | 12 Admin-Routen, alle `requireAdminApi()` |
| `check:schema-bezug` | pass |
| `npm run build` | pass; Routen `ƒ /reisen`, `ƒ /account`, `ƒ /account/travellers`, `○ /account/settings` vorhanden |

## Browser evidence in this environment

Chromium/Playwright gegen lokalen Dev-Server. **Kein Real-Device.**

- 280 / 360 / 1280: eine Zeile, Reihenfolge Übersicht → Reisen → Reisende → Einstellungen, `overflow-x: auto`, `flex-wrap: nowrap`, Touch-Höhe 44 px, kein Seiten-Overflow.
- 360 nach nativem Scroll: letzter Tab `Einstellungen` erreichbar und sichtbar.
- Gast-`/reisen`: HTTP 200, Titel „Meine Reisen“, Gast-Copy, **keine** `nav[aria-label="Konto"]`.
- `/ui-audit/account` hat bewusst **keinen** aktiven Tab, weil der Audit-Pfad keinem Account-Ziel entspricht.

Nicht in diesem Environment verifiziert:

- authentifiziertes `/reisen` im Browser (keine echte Session);
- echtes Finger-Wischen auf Hardware.

## Remote gates

Gated implementation head: `d23758f64d11ab3479294ac1a4b354a3d219d8f0`

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions | [`33281797775`](https://github.com/Jetnity/jetnity/actions/runs/33281797775) **SUCCESS** on `d23758f6` |
| Vercel Preview | **Ready / SUCCESS** (`9ymUnYwBAzUi9iT5vANXNsEoewPs`, deployment `6161374151`) |
| Preview | https://jetnity-app-git-feat-account-nav-rail-c-e28a65-jetnity-e1b93c82.vercel.app |

Ein späterer Evidence-Stamp-Commit ändert nur diese Docs. Runtime bleibt `d23758f6`. Der live PR-Head muss nach dem Stamp erneut grün sein.

## STOP

PR bleibt Draft. Kein Ready, kein Merge, kein Folgeslice. Unabhängiger Technical-Lead-Review erforderlich.
