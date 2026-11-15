# Account language and saved settings 1 — handoff

Date: 15 November 2026. This is the source package's pre-publication record. Its pull request records the subsequent exact head, complete CI result, Preview identity and remaining human acceptance; this document does not pre-claim those later results.

## Sequence, authority and source ownership

Sasa requested #1199 → #1200 → #1201 → #1203 → #1204, each with green CI, followed by translations/saved settings, CMS and Marketing. All five preceding packages have completed their full normal CI and their final PR acceptance sections were updated in that order. Their current heads are:

| PR | Head | Successful full CI |
| --- | --- | --- |
| [1199](https://github.com/Jetnity/jetnity/pull/1199) | `1ba0c2b45a6a0a89120c240e0e1a89645a6e6355` | [43706627522](https://github.com/Jetnity/jetnity/actions/runs/43706627522) |
| [1200](https://github.com/Jetnity/jetnity/pull/1200) | `ac10784a3bc9f0440cdf0e2a45d8391b1034b0dc` | [43706738463](https://github.com/Jetnity/jetnity/actions/runs/43706738463) |
| [1201](https://github.com/Jetnity/jetnity/pull/1201) | `ef6e3e32debf1dd21f322f41c57d2714d34d9365` | [43706509596](https://github.com/Jetnity/jetnity/actions/runs/43706509596) |
| [1203](https://github.com/Jetnity/jetnity/pull/1203) | `89f8a8904fb713f706f6787085020c8a14d16a37` | [43706738146](https://github.com/Jetnity/jetnity/actions/runs/43706738146) |
| [1204](https://github.com/Jetnity/jetnity/pull/1204) | `1c04adba157709204b860bab58cb881a91305f53` | [43706517319](https://github.com/Jetnity/jetnity/actions/runs/43706517319) |

These remain unmerged Draft PRs. Their green checks and READY Development Previews do not constitute positive signed-in Admin/AAL2 or Account acceptance. No Production or merge action was taken.

This branch is `feat/account-language-settings-20261115`, based on #1200 at `ac10784`. Its [task](ACCOUNT_LANGUAGE_SETTINGS_1_TASK_2026-11-15.md) was persisted **before implementation**, commit `536a17fa943db10d2790a85c6b475920ecf969c6`, tree `4f98ba6a2080c9b5e1f8b8dae7c08b9636d42b0f`. Shared Content and Analytics navigation changes are retained.

Fresh protected-path inventory immediately before publication: #1196 `8cf2b71863c34ee48e7d1a4bac6d3e3a0a001587` / 102 files; #1197 `5af8f1d018555605005732e4eba44f98334a2f26` / 415 files; #1198 `bae95fb27062d5e041ad38755bd05fe7f00fe312` / 98 files. The entire new package has zero overlap. #1197 is still unmerged; #1202 remains HOLD. Main remains `63544e820e912bd275556588c956a09b99b1cf90` and the operating mode is NORMAL.

ARCHITECTURE.md, DECISIONS.md, ROADMAP.md, global schema types/scanner, shared shells and Auth configuration belong to the protected lane. This dedicated handoff is the package's architecture/decision/continuity addendum. Their eventual index update must preserve that lane's work.

## Delivered product behavior

- `/account/settings` reads the authenticated user's stored UI language on the server. The customer can preview German or English, explicitly save, discard the unsaved choice, or read the stored value again.
- A save succeeds visibly only after the Auth server has returned the same verified user and the exact stored language. Reloading uses the same server reader, rather than a component cache or Local Storage.
- `/admin/settings` exposes that same personal account preference under the existing Admin gate. It makes no claim to edit global company configuration, credentials or provider settings.
- `/admin/localization` displays the actual typed DE/EN catalog, its exact entry count, both values and a search. It explicitly states its scope and that catalog editing is not available there.
- The Settings content, language status/errors, account-export presentation and account-deletion presentation have German and English entries. Each translated subtree receives its own `lang` attribute.
- Missing/unsupported stored language is an **unsaved** German fallback. A failed read is unavailable, not a fabricated default. A selection is visibly an unsaved preview until verified storage succeeds.
- A write/read timeout, unexpected reply, request failure or mismatched identity cannot become success. Writes are never automatically retried. After uncertain storage, the user must explicitly read again before another save. An account change locks the editor until a page reload.
- Generation, unmount and identity checks discard late results, including replies arriving while a newer read is pending. In-flight duplicate submits are blocked synchronously.

The shared navigation, security pages, travel pages, provider widgets and entry display remain outside this first catalog. The UI states this; there is no global translation-completion percentage. Existing theme/sidebar choices remain browser-local, and the page explains that distinction. Further locale expansion should extend this real typed catalog and explicit server-loaded preference, not rewrite DOM text.

## Storage and security decision

Only the flat display preference `jetnity_ui_locale_v1: "de" | "en"` is sent to the existing own-session `auth.updateUser({ data: ... })` API. No raw metadata object is forwarded. Supabase merges the supplied metadata keys; unrelated keys are not deliberately replaced. The server verifies the user before writing, compares the write reply, and verifies a fresh user readback afterwards.

The input's expected user ID is solely a stale-context guard. It cannot select another target account. Input parsing rejects extra keys, accessors, prototypes, symbols, unsupported languages and malformed IDs. User-editable metadata never grants roles, AAL, permissions or official/travel facts. Concurrent explicit preference saves retain the ordinary Auth last-writer-wins contract; this is not presented as transactional compare-and-swap.

Deployed Preview calls require the exact Jetnity Vercel project, matching Preview environment markers and the exact Development Supabase URL, with captured factory URL and runtime URL in agreement. Normal product code recognizes the existing exact Production target only in an actual Production deployment; no such deployment or call is made here. Local deterministic adapters require an explicitly enabled loopback fixture. Unknown/mixed targets fail before client construction or writes. Configuration is rechecked across asynchronous boundaries.

There are no database migrations, DDL, grants, new roles, RLS/ACL changes, BG1 rebases, service-role clients, new dependencies, new services, costs, real emails, logins or MFA actions in this package.

Primary implementation references:

- [Supabase own-user updates](https://supabase.com/docs/reference/javascript/auth-updateuser).
- [Auth metadata merge implementation](https://github.com/supabase/auth/blob/master/internal/models/user.go), `UpdateUserMetaData`.
- [Supabase user-metadata trust boundary](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables).

## Existing export and deletion contracts

The export remains `jetnity.account-export.v1`, with the same thirteen row collections, validation and download behavior. Its UI explicitly excludes personal UI language and browser appearance from this account/travel-row export. Raw Auth metadata is not exported or described as a complete legal data export.

Export status is retained as a semantic code so an already visible or delayed success/error/cancellation message translates with the selected language. Request, validation, abort, generation and object-URL cleanup behavior is unchanged.

Account deletion retains its exact `KONTO LÖSCHEN` confirmation in both languages; the English label explains that literal. Environment gates, fresh password, MFA, ownership, state machine, destructive request, session cleanup and redirect are unchanged. Only presentation and wrapping of the existing controls change. No deletion was performed.

## Review and verification

The backend review covers all new contracts, own-user storage, target binding and actions. Its 53 cases pass with no skip. The complete affected local batch passes **136/136**, with no failure, cancellation, skip or todo; this includes the existing export, deletion, security-navigation and gate-inventory contracts plus catalog parity and every deletion phase/error.

Full TypeScript passes. Full ESLint reports **0 errors / 193 existing warnings**. All five static checks pass: Admin API protection, schema references, reachability, unused exports and unused packages. No guard, selector, package script or old test was disabled. Directly affected source-location assertions were updated to follow the real extracted component and typed catalog.

The independent UI review found a material Admin dark-theme contrast regression. The package fixes it using the existing semantic foreground, muted, card, input, primary and destructive tokens only within its own components. The Account language card uses the existing darker ink token. No global palette or protected shell was edited. A follow-up source review confirms the correction.

The mounted suite contains **68 cases** using actual production components and production CSS. It controls only explicit identity/action/export fixtures and a Node-owned preference store. A real document reload proves that the fixture's persisted value is reread; it does **not** establish real Supabase persistence or real session authorization. Tests cover both languages, save/readback/retry, malformed and delayed results, account replacement/unmount, timeout without auto-retry, export/deletion labels, catalog search, keyboard access, 320/390/1280 widths and 200% text size. Admin light/dark contrast is measured in the rendered fixture. Mobile cards stack their icon above text so the language selector and translated controls retain usable width. Flexible text controls allow long translated words to wrap without imposing an oversized intrinsic minimum width.

The local container cannot run native sockets/Chromium. Those attempts are not repeated. The mounted suite is selected by the existing normal Core glob and must run successfully in complete normal CI; missing Chromium or a layout/interaction failure is not skipped. The final PR record binds all final job logs and Preview evidence to the published head. Existing baseline optional Workspace skips are disclosed separately.

## Development Preview and remaining acceptance

### First complete CI and grouped correction

The first full run [43710252490](https://github.com/Jetnity/jetnity/actions/runs/43710252490), on source `af21f99e1c9cc6219daea3465ccb63e8a2f5c0b6`, completed before corrections began. Core recorded **8,941 tests: 8,868 passed, 71 failed, 2 existing optional Workspace skips**. All seven other verification jobs succeeded; the aggregate correctly failed with Core. This failed run is retained, not described as acceptance.

All 68 new browser failures shared one fixture bootstrap error: the bare component bundle imported `next/link` without replacing its Next build-time environment constants. The browser has no Node `process` global. The correction supplies the exact constants for the existing configuration, checks the resulting bundle for unresolved environment expressions, and emits bounded browser/boot/document diagnostics. It does not replace production components, add a process shim, loosen assertions, increase timeouts or skip a case.

The three remaining failures were corrected in the same batch: Admin search expectations now include the real personal Settings and Localization routes; the two asynchronous Supabase factory adapters explicitly await their result; and the reviewed own-session Server Action is registered by its exact source blob `72a82c4303b00cbca55cbff6b32fb47a1ae12f3f` in the existing action inventory. The only inventory addition is `lib/account/ui-einstellungen-1/aktionen.ts`. All twenty previous action hashes and all other values in `historical-control.json` remain unchanged. The historical executable, protected current checker and its negative tests, source selectors, configuration and dependency pins are unchanged. The new file remains subject to exact hash validation rather than a wildcard or audit exception.

This narrow inventory update and the directly affected navigation test are recorded as necessary CI repair under Sasa's existing Development authorization. Neither belongs to the protected entry-path inventory. The immutable original task remains intact. The corrected local non-browser batch passes **123/123**, including the existing security audit negative cases, with no skips. For this offline check only, Node preserves workspace dependency symlinks and disables the container's optional proxy startup; otherwise the container's unrelated `EnvHttpProxyAgent` warning would contaminate the historical subprocess's required empty stderr. No repository or CI setting suppresses warnings. The subsequent complete CI and real mounted outcomes remain required and are recorded on the final PR head.

The final expanded affected batch passes **190/190** across fourteen files, with zero failures, skips or cancellations. Full TypeScript and all five static gates pass; full ESLint again has zero errors and the same 193 baseline warnings. An independent read-only review verifies the two adapters, navigation expectations and exact inventory addition. The corrected browser bundle and production CSS compile with no unresolved environment access; its 68 real mounted cases still require actual CI execution. The fresh entry-path check sees #1197 at `4845dc7f547d784c4c31d9dd2108c2119411e7ad`, still open/unmerged with 415 protected paths, and no overlap with this repair. #1196/#1198 and main retain their earlier identities.

Only this branch's two public Supabase variables are added to Vercel target `["preview"]`: the exact existing Development URL `https://yfvbxvijcorffwxbxahl.supabase.co` and its existing public anon key. Project `prj_wTTVawPItEO7a4HihEmaU3PsuaXM`, team `team_fgOHJvth4GbXnyclxk95GQul`. Readback confirms exactly these two keys with branch scope and no Production target. No secret is recorded in this repository.

Vercel rejected the first environment creation because the new branch did not yet exist. The branch was then created at the already persisted **task-only** commit, the scoped variables were created and checked, and only then was the implementation published. The failed attempt made no environment change.

Protected Vercel access for the five preceding packages is repaired and independently returns real Jetnity HTML at `/admin/login` and `/login`, with their exact READY Development deployment heads. This is transport evidence, not a positive authenticated page result.

The connected browser was unavailable in this ChatGPT context. No login or 2FA was attempted. Sasa retains the following concrete acceptance step on this package's exact READY Preview after green CI:

1. Sign into a legitimate Development account, open `/account/settings`, save English, reload, verify English, then choose the preferred final language and reload once more.
2. Enter Admin via `/admin/login` and its existing MFA flow, verify `/admin/settings` shows the same preference and `/admin/localization` shows the real catalog. Check the available light/dark theme.
3. Review and merge the desired packages in their stated dependency order. Production deployment remains a separate Sasa action.

## Next work and launch boundary

CMS follows with real versioned editorial entries, immutable revisions, atomic writes, preview/publish/archive/restore and native PostgreSQL proof. The live BG1 catalog guard currently covers shared role dependencies; new CMS table/function privileges, including existing default grants, alter its protected fingerprint. A native **UNAPPLIED** candidate can be prepared now. Hosted installation and application wiring require coordinated guard/types/scanner integration; the entry lane must not be silently changed or bypassed. Marketing follows that real persistence contract and must distinguish content approval from publication or spend.

#1202 remains blocked until #1197 is merged. Real-money refunds remain disabled until Sasa explicitly approves them. Entry requirements stay wholly owned by #1196–#1198: visa, ETA, passport validity, vaccinations, health, forms/costs/scam warnings, fees, return/onward ticket, transit, children, customs, exceptions, source/date, notice and official link must be visible from the start; unconfirmed information says “derzeit nicht verfügbar”.

The 30 November 2026 target still requires the remaining integration work, actual authenticated acceptance, Sasa's merges and Production release. This package is neither a whole-system launch attestation nor a claim that CMS, Marketing or the entry database is already live.
