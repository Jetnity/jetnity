# Admin security refresh ordering 1 — evidence notes

Captured: 29 September 2026

Writer: **Jetnity admin security refresh ordering 1**, Generation 1.
Session: https://cursor.com/agents/bc-793ea096-8fef-4cc6-967e-79aca80c981f
`originalModelName=grok-4.7-high-fast` from cursor-cloud `run-info`. Dispatch required Grok 4.7 High Fast. Not Auto. The session title is `Admin security refresh ordering`. No programmable rename was used, so the UI title is not claimed to be the exact logical name.

This folder renders the repository `SecurityWidget`. It is not a signed-in Admin session, not a physical device, and not Production acceptance.

## Live reconstruction

Operating mode is `NORMAL`. Special Product-Owner gates remain.

`origin/main` at reconstruction and again before STOP is `6b267186bd8f8261b76583cc3a20af4ddc4fbf89` (merge #618). This branch is based on that commit and was 0 behind it. The task commit `0d4c427c` was the previous tip.

Open product writers: this Draft #620 and Draft #616 (`fix/admin-user-created-timestamp-honesty-1` at `fd73e7e631f8d07e3bc4ce60427f3879f036648b`). #616 changes Admin Users created-at files only. None of those paths are in this diff. Historical Drafts #52, #50, #40, #39 and #28 stayed open and were not resumed. #614 and #618 are merged.

## What is real

- The bundled component is the repository `SecurityWidget`.
- Rows use documentation addresses `203.0.113.0/24` and ids `synthetic-event-*` only. No security event or blocklist row was read from or written to a database.
- `fetch` is held until the harness releases it. List, block and unblock calls stay in the page. Nothing reaches a Jetnity server.
- The page clock is installed at `2026-09-28T12:00:00.000Z` before render. The 15-second poll is the widget's own `setInterval(refresh, 15000)`, advanced once with `page.clock.fastForward(15000)`.
- This harness used system Chrome at `/usr/bin/google-chrome`. The re-run of the #614 and #618 scripts used Playwright's Chromium after `npx playwright install chromium`. That install is outside the repository.
- Auth, AAL and `requireAdminApi` are not exercised. The widget source still calls the same list, block and unblock routes.

## Baseline defect

`node scripts/admin-security-refresh-ordering-1-verify.mjs --baseline` ran before `refreshIstAutoritaer` existed (`before.json`, `sourceHasGuard: false`).

Sequence on the actual widget: start read A, start read B from the 15-second poll, resolve B, then resolve A.

- After B: `synthetic-newer-read` / `203.0.113.22` was visible and the refresh button was enabled.
- After A: `synthetic-older-read` / `203.0.113.11` replaced it. The newer row was gone.
- Two GET list calls, no POST, one interval of 15000 ms.
- `defectReproduced: true`.

Screenshots: `admin-security-refresh-before-newer.png`, `admin-security-refresh-before-overwritten.png`.

On the fixed head that probe is expected to throw, because `--baseline` refuses to run once the guard exists.

## Fixed head

`node scripts/admin-security-refresh-ordering-1-verify.mjs` passed (`after.json`, `sourceHasGuard: true`):

- B success then A success: `synthetic-newer-read` stays; `synthetic-older-read` never appears.
- One further 15-second tick adds exactly one GET (2 gets, then 3) and does not clear the newer row. The interval list stays `[15000]`.
- B failure then A success: `synthetic-newer-failure` and `Diese Ansicht konnte nicht geladen werden.` stay. The older success does not clear them. KPIs stay `—`.
- B success then A failure: the newer row stays and `synthetic-older-failure` is not shown.
- A success while B is still in flight: the refresh button stays disabled, the spin class stays on, and the older row is not shown. B then publishes `synthetic-newer-read`.
- Manual `Aktualisieren` after a settled read starts one new GET and replaces the previous row.
- A settled success followed by a failed current refresh keeps `synthetic-kept-read` and the blocklist row, and shows `Die Aktualisierung ist fehlgeschlagen.` plus `Die angezeigten Daten sind älter.`
- A filter with no match still says `Keine aufgezeichneten Events passen zu diesem Filter.` and does not say `in diesem Zeitraum`.
- 200 events show only the #614 event bound sentence. 200 blocklist rows show only the #618 blocklist sentence and the period-empty event sentence.
- Synthetic block POST body is `{"ip":"203.0.113.42","reason":"synthetic-reason"}` and is followed by one list GET. Synthetic unblock POST body is `{"ip":"203.0.113.42"}` and is followed by one list GET. No extra GET appears after those refreshes resolve.

`node scripts/admin-security-filter-honesty-1-verify.mjs` and `node scripts/admin-security-blocklist-bound-honesty-1-verify.mjs` were re-run on this head and passed. They did not change their committed evidence.

## Checks on this implementation

- `lib/admin/security/refresh-reihenfolge.test.ts`: 3 pass.
- `lib/admin/security/filter-ehrlichkeit.test.ts`: 5 pass, inside the full suite.
- this actual-widget harness: pass.
- #614 and #618 actual-widget harnesses: pass.
- `npm test`: 4040 pass, 0 fail.
- `npm run typecheck`: pass.
- `npm run lint`: 0 errors, 144 warnings. The widget's existing effect, `any` and `Date.now` warnings remain. This slice adds none.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode`: pass. Schema check still prints the existing local/unapplied `admin_account_counts_v1` note.
- `npm run build`: pass. `check:setup` warned that no `.env` / `.env.local` is present.

`npm ci` was not re-run. The existing install was used. `db:rechte`, `db:rls`, `db:sicherheit` and `auth:pruefen` were not run: this slice does not change SQL, RLS or Auth.

## Limitations

- The overlapping reads are the initial GET and the widget's 15-second callback. Playwright's clock advances that callback. Wall-clock waiting of 15 seconds was not used.
- A block or unblock click that overlaps an in-flight list read was not rendered as its own race. Both paths call the same `refresh`, and the synthetic settled block/unblock cases still send the existing bodies and start one follow-up list read.
- The harness is not a signed-in `/admin/security` session, so `requireAdminApi` was not exercised.
- No Production security row was read or written.
