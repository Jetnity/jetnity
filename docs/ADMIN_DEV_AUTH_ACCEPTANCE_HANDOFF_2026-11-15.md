# Admin Dev Auth repair — implementation handoff, 15 November 2026

## Scope and source

Task committed before implementation: `059e7131b92da174e1737a503656e44d6f560a0c`, initially above #1199 `1cd49ada9c46ed9e9dcdfd627a9c11ba018ce257`. The same bounded correction is intended for #1199 → #1200 → #1201 → #1203 → #1204. Sasa retains merges, Production, new costs and login/2FA. #1202 is untouched and HOLD until #1197 is merged. #1196–#1198 and their changed files remain reserved.

## Actual Auth cause and correction

The existing Development Auth configuration already contains the Owner-approved password-reset URL recorded by #1197. Our older raw TOML contains only the historic callback. The last five package Auth jobs fail on precisely `uri_allow_list`; their log formatter truncates the differing values to the same prefix.

The strict compatibility contract is anchored to #1197@`70a3cb09204e74f6bcd4a5b481e942e526a6102f`, its `supabase/config.toml` and `docs/AUTH.md`, and its successful [Auth job](https://github.com/Jetnity/jetnity/actions/runs/43689220907/job/132736086443), 56 expected values / 244 observed keys. It applies solely to the existing Develop ref `yfvbxvijcorffwxbxahl`.

The new pure composer accepts only the exact historic callback list or the exact already-integrated two-address list, preserving order and the callback's literal backslash. It returns the integrated expectation without modifying input or learning expected values from live service data. Missing, extra, duplicate, reordered, broadened or malformed raw addresses and other targets are rejected.

`auth:pruefen` retains the existing remote branch-identity check, complete 56-value comparison, unknown-key classification, provider/hook guard, password policy and failing exit. Text/JSON include the reviewed provenance. Drift is fixed by representing the approved Dev state, not by suppressing a comparison.

`auth:anwenden` checks the same contract before Auth reads, subprocesses or PATCH. It refuses stale raw TOML because the existing CLI would otherwise remove the active entry-lane URL. It may proceed through the unchanged CLI only when raw TOML already contains the exact integrated list. No Auth write, raw TOML edit or remote configuration change was performed for this repair.

## Collected verification and fixes

1. The entire first affected Auth/config/production-read suite completed: **119 tests / 118 pass / 1 fail / 0 skip**. The only failed assertion expected the standalone-project diagnostic, but its synthetic transport incorrectly answered both identity endpoints with HTTP 200. The existing guard correctly rejected the ambiguous target before Auth reads or writes. TypeScript also required explicit `NODE_ENV` in the isolated child environment; scoped lint passed.
2. Both findings were fixed together: a standalone project is now modeled as 200/404; the ambiguous 200/200 remains a separate refusal counterexample. The child explicitly receives `NODE_ENV=test` and no inherited credentials.
3. The complete second run passed **120/120**, including **29 new cases**, with no skips. TypeScript and scoped lint passed. Static reachability found one real Node preload whose constructed import filename was not a static module edge. The executable fixture was moved to `scripts/auth/testing/auth-dev-cli-register.mjs`, its actual caller updated, and the scanner remained unchanged.
4. Final affected suite: **120/120 pass, 0 fail/skip**. All five static gates and diff checks passed; no orphan or unused export and no new lint warning.
5. Independent source review by `/root/admin_audit` found no blocking issue. The CLI-entry tests execute the actual reader/writer files with isolated synthetic HTTP/subprocess ports. Writer refusal proves zero subprocess/PATCH calls. The positive writer case proves only the offline execution path, not a live write.

No local native database or browser attempt was added. Full normal CI for each newly published package head remains required; final run/deployment IDs and results are recorded in its PR.

## Dev Preview configuration and access

Before new source publication, the existing public Develop URL and existing public legacy Anon key were configured only for the four previously unconfigured own branches (#1199, #1200, #1201, #1204), only with Vercel target `preview`. #1203 already had those two branch-specific values. Readback confirmed all five exact branch/target scopes, the Dev URL and encrypted key records. No new/rotated key, global/Production ENV, additional service key, paid resource, schema, grant, Count activation or entry-lane configuration was changed.

An independent source trace confirms the ordinary Admin, Account and manual-trip flows use the shared session/browser clients and those two values, without another Supabase URL fallback. Model quota and separate Official Truth service paths are not activated by these settings.

On #1203's preceding exact Preview `dpl_9eVZg6hZ3BJTA5aV2yXY4h3fV7Wc`, independent live reads established:
- `/admin/login`: HTTP 200, Jetnity Admin login and matching route header.
- `/login`: HTTP 200, actual Account login and private/no-store response.
- `/admin/payments`: anonymous navigation reaches Jetnity and redirects to its Admin login without exposing payment data.

Deployment access therefore works. The earlier API fetch's 401 was very plausibly the expected Jetnity anonymous API denial misclassified by the connector; its missing raw body is not retroactively claimed as observed. No Vercel protection reduction or alternative API bypass was needed.

For actual Dev acceptance use the existing **/admin/login password form → /admin/mfa → /admin** and the ordinary Account login. That Admin-specific same-origin path needs no new redirect Allowlist entry. `/login?next=/admin` is not an Admin route; it intentionally falls back to /reisen. The optional Admin Magic-Link path uses `NEXT_PUBLIC_SITE_URL` and is not the acceptance path for these isolated Previews.

## What remains a real acceptance boundary

New builds must be bound to their exact reviewed source heads and Dev Preview scopes. Login and 2FA remain with Sasa. Neither public login-page reachability nor synthetic mounted tests establish successful authenticated Admin/AAL2 or Account persistence. No existing account/session was fabricated, altered or promoted.

The five PRs remain Draft and unmerged until their evidence and Sasa's requested release decision are complete. This handoff does not activate real-money refunds or claim complete CMS, Marketing, global localization or a Production launch.

