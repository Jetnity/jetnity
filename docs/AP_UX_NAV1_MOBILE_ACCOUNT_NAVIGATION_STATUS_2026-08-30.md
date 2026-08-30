# Jetnity – AP-UX-NAV1 Mobile Account Navigation Rail Status

Stand: 30. August 2026  
Status: **REVIEW-FIX ON BRANCH / LOCAL GATES GREEN / EXACT-HEAD CI+VERCEL GREEN / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Issue: #228  
Draft-PR: #229  
Cursor-Agent: `Account plattform audit vorbereitung 20`

## Baseline and authorization

- Task: `docs/AP_UX_NAV1_MOBILE_ACCOUNT_NAVIGATION_RAIL_TASK_2026-08-30.md`
- Original slice-cut: `main @ 0ac7296fbd9e348b05a30b4c43cd5fe1815e24d9`
- Reconciled onto: `origin/main @ 20c203f5bee950b43db611f220c7cc5b88699dcb` (TA-DL1 merge)
- Ahead / behind `origin/main`: **AP-UX-NAV1 commits only / 0**
- Three-dot diff vs `origin/main` remains exclusively AP-UX-NAV1 files. TA-DL1 runtime/docs are on `main` and do not appear as this PR's scope.
- Traveller-context check: **nicht relevant**.

## Review-fix

Independent TL-Review: Kern fachlich gut; ein mobiler UX-Blocker.

- Entfernt: `touch-pan-x` auf der Nav-Leiste.
- Beibehalten: natives `overflow-x-auto`, `flex-nowrap`, horizontales `scrollBy` nur für den aktiven Tab.
- Markupvertrag verlangt `touch-pan-x` nicht mehr und weist nach, dass keine restriktive Touch-Action gesetzt ist.
- Computed `touch-action` im Chromium-Audit: **`auto`**.
- Sticky bleibt **nicht** gesetzt.

## Implemented

1. Einzeilige, nativ horizontal scrollbare Account-Tab-Leiste.
2. Reihenfolge: **Übersicht → Reisen → Reisende → Einstellungen**.
3. Aktiver Tab: `aria-current="page"`, nur waagrecht in Sicht.
4. `/reisen` nutzt dieselbe `auth.getUser()`-Aussage für Daten und Nav. Gäste ohne Konto-Leiste.

## Files in PR-Diff vs `origin/main`

- `components/account/AccountNavigation.tsx`
- `lib/account/navigation.ts`
- `lib/account/navigation.test.ts`
- `app/(public)/reisen/page.tsx`
- `scripts/account-ui-audit.mjs`
- `docs/AP_UX_NAV1_MOBILE_ACCOUNT_NAVIGATION_RAIL_TASK_2026-08-30.md`
- this status / self-review / handoff

Nicht im PR-Diff: TA-DL1-Dateien, `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, Migrationen, Auth/MFA/AAL/RLS/Supabase.

## Local gates after review-fix + main reconcile

| Gate | Ergebnis |
| --- | --- |
| Focused `lib/account/navigation.test.ts` | **8/8 pass** |
| `npm test` | **2741/2741 pass, 0 fail** |
| `npx tsc -p tsconfig.json --noEmit` | pass |
| `npm run lint` | **0 errors** (135 bestehende Repo-Warnings) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| `npm run build` | pass; `ƒ /reisen` vorhanden |

## Browser evidence

Chromium/Playwright, **kein Real-Device**.

- 280 / 360: einzeilig, `overflow-x: auto`, `flex-wrap: nowrap`, `touch-action: auto`, min-height 44 px, kein Seiten-Overflow, keine Custom-Swipe-Handler.
- Letzter Tab `Einstellungen` nach nativem Scroll sichtbar.
- Gast-`/reisen`: keine `nav[aria-label="Konto"]`.

Nicht verifiziert: authentifiziertes `/reisen` im Browser; echtes iPhone-Wischen.

## Remote gates

Gated review-fix head: `23e3885f89d0f1f71cd99cf9aef454a78f41ca66`

| Gate | Ergebnis |
| --- | --- |
| GitHub Actions | [`33282430023`](https://github.com/Jetnity/jetnity/actions/runs/33282430023) **SUCCESS** on `23e3885f` |
| Vercel Preview | **Ready / SUCCESS** (`8CaAk3ExeNPiEgbrjjbLo5YXGTNm`, deployment `6161481927`) |
| Preview | https://jetnity-app-git-feat-account-nav-rail-c-e28a65-jetnity-e1b93c82.vercel.app |

`ce535668` ist durch den Review-Fix und den `main`-Reconcile nicht mehr der reviewbare Head. Ein Evidence-Stamp ändert nur Docs; Runtime bleibt `23e3885f` plus dieser Stamp.

## STOP

PR bleibt Draft. Kein Ready, kein Merge, kein Folgeslice, kein Sticky-Ausbau. Unabhängiger Technical-Lead-Re-Review erforderlich.
