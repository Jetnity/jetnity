# R107-D — Admin User Directory Completion 1 — STATUS

Date: 2026-10-25. Author: Jetnity Admin User Directory Completion 1 — Cursor Generation 1. Session `bc-cc48889b-f8c5-4cce-9892-1daa0eab7fc6`. Runtime model `grok-4.7-high-fast`.

## State

Candidate review R1 corrections are on `feat/r107-admin-user-directory-1`, Draft PR #1020. This is not a product PASS, not Ready, and not a merge. TASK blob `704b63dc2f0da1df30db73988cf7e3bb4ed6cbfb` and accepted PLAN blob `888407e808559463e22b0dbc2392bef09d01f48d` are unchanged. Machine mode: `NORMAL`.

- Reviewed head: `43aafe5628e95060632d4192368aa4d43e75cfd4` (tree `0e9a8b4d0540dc1bb5a91a9e84ff97a925d41ea4`)
- Correction commit: `fb3f13cf9667c0af42d7d1fbf11667e8c292ac66` (tree `2bddf04f9adafe6bc3f8fece2bed6955024e6536`)
- `origin/main` and merge-base at the correction: `a74c443c6be3f064f150fcf021ab6154bda325e5`
- Ahead / behind before the documentation commit: **6 / 0**
- The documentation commit adds no product-file change beyond the rebound mounted screenshots and `mounted.json`.

## R1 resolutions

- D-R1.1. Retry compares `usersDirectoryLiveMatchesQuery`. Omitted page, `?q=anna`, padded `page=%201%20`, and explicit `page=1` each call refresh once. Repeated `page=1&page=2` stays an invalid address with no retry. Literal `usersListHrefMatches` still treats omitted page and `page=1` as different strings.
- D-R1.2. Clear keeps outstanding own acknowledgements and still dispatches when the clear target is the current URL. The delayed `anna` replace is committed, does not restore the field, and does not settle as current. The queued clear replace then lands on page 1.
- D-R1.3. `keyboard-tab-and-activation` presses Tab and Enter. Disabled Erste/Vorherige are skipped on page 1. Enter on Nächste Seite goes to page 2. On the error view, disabled Nächste is skipped and Enter on Erneut versuchen calls refresh once. The old `element.focus()` enumeration is retired under `css-error-layout`.

## Proof boundary

Authoritative mounted run: `docs/evidence/admin-user-directory-completion-1/mounted.json`, 42/42, exit 0, Node `v22.23.4`, Playwright `1.55.0`, recorded head `fb3f13cf9667c0af42d7d1fbf11667e8c292ac66`. At capture, that same run had rewritten `error-mobile.png` and `mobile-directory.png`. Local component evidence only.

`npm test` exit 1: 7193 tests, 7177 pass, 11 fail, 5 skipped. The 11 failures are the same local PostgreSQL environment limits. Focused directory, navigation, provenance, request-compat, and role tests: 69 pass, exit 0. Typecheck, lint (0 errors, 181 warnings), five hygiene checks, and the production build exited 0.

## Next actor

Root Technical Lead, independent exact-head re-gate. Cursor does not Ready, merge, close #1015, write `main`, or start a follow-up.
