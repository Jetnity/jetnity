# Admin Marketing Links 1 — handoff

Date: 15 November 2026. This document records the source package before its final publication. The pull request will record the exact published head, complete CI and READY Preview; no future result is pre-claimed here.

## Authority, sequence and continuity

Sasa requested completion of #1199 → #1200 → #1201 → #1203 → #1204, then translations/saved settings, CMS and Marketing. The five initial packages are implemented with complete green CI. Their PR descriptions and all latest discussion comments were reread live after the user's continuation message; the comments contain Vercel deployment updates and no intervening human change request. All remain Draft and unmerged. #1202 remains explicitly HOLD until #1197 is merged.

The language/settings package [#1205](https://github.com/Jetnity/jetnity/pull/1205) is complete on `304900d4e4d9587bcbed075409e730227fe7cecf`, tree `5652431571c8d9f24e36cd8a1d090c44f155a591`. [CI 43714257605](https://github.com/Jetnity/jetnity/actions/runs/43714257605) is fully successful, including every new mounted Settings case. No further repeat run was requested after success. This Marketing branch is based on that exact source.

The [immutable task](ADMIN_MARKETING_LINKS_1_TASK_2026-11-15.md) was committed before implementation: `aa501073595d1943edea0e03ed523f039cc7c1ae`, tree `7502290b4b1549b7e3b09bc0fd8aae707291414e`, task SHA256 `8e6efb6d0b58f5865a857e5ccdd61443969f92bd7b493182b7d78f98a51c3196`. The task was published only after the Settings complete CI was green. Main remains `63544e820e912bd275556588c956a09b99b1cf90`; operating mode NORMAL.

Actual fresh implementation sessions are `/root/marketing_links_1` on `feat/admin-marketing-links-20261115` and `/root/marketing_browser_1` on separate local branch `test/admin-marketing-links-20261115`. The latter owns only the new harness/browser test. Root integrates those two files explicitly and publishes a fast-forward source commit. No Git merge, history rewrite, Cursor session or Guardian review is claimed.

Shared architecture, decision, roadmap, schema and entry files belong to the parallel entry lane. This handoff is the package's architecture/decision/continuity addendum; those protected indices are not changed.

## Product boundary

The Marketing placeholder is replaced by an explicit local incoming-link generator. The bounded output is a marked URL for the existing canonical public domain, selected existing destination and a fixed channel. Campaign/variant IDs are opaque markers created only by deliberate actions. They are not saved campaign records.

This package does not supply campaign persistence, approval, newsletter sending, ad publication, attribution, advertising spend, provider activation or customer tracking. These remain separate product work. Neither the UI nor this handoff may call the whole Marketing system complete.

## Development configuration and real acceptance boundary

Only two branch-scoped variables were created for `feat/admin-marketing-links-20261115`, target `["preview"]`, on Vercel project `prj_wTTVawPItEO7a4HihEmaU3PsuaXM`, team `team_fgOHJvth4GbXnyclxk95GQul`: the existing Development Supabase URL `https://yfvbxvijcorffwxbxahl.supabase.co` and its existing public anon key, stored encrypted. The branch was created before those variables. Readback confirms exactly those two keys and their branch/Preview scope. No key was created or rotated; no global or Production variable was changed. No credential or temporary access token is included in this repository.

Protected connector fetches for the five initial packages and Settings now return actual Jetnity login pages. This establishes deployment transport, not a signed-in Admin/Account acceptance. The connected Browser plugin was unavailable in this context. A later Cloud Browser check of the exact Settings Preview reached the ordinary Vercel sign-in page. No Vercel login, Jetnity login, MFA code, copied session or invented Owner session was used. Existing unrelated browser work was left untouched. Positive hosted acceptance still requires Sasa's legitimate login/2FA.

## CMS and launch dependencies

[#1206](https://github.com/Jetnity/jetnity/pull/1206) contains the separate native CMS candidate. Its corrected native PostgreSQL run [43714871972](https://github.com/Jetnity/jetnity/actions/runs/43714871972) passes all actual candidate scenarios on source `233c7fba0867eace4fcd32fcd06a91d1128d627d`; the complete normal [CI 43714871926](https://github.com/Jetnity/jetnity/actions/runs/43714871926) is also green. That candidate remains **UNAPPLIED**: the shared BG1 role-dependency fingerprint and reserved types/scanner integration must be coordinated with the entry lane. A green isolated candidate is not an installed CMS, a publishing UI or live public content.

For the 30 November 2026 visitor launch, the remaining critical path includes Sasa's package merges, actual authenticated Admin/Account acceptance, integration with the entry lane, installed and wired CMS, combined travel-flow acceptance and Sasa's Production release. Entry data and rights remain strict. The current work does not guarantee that every planned future feature, global translation, saved campaign/approval or real-money refund function is ready for that date.

The entry lane retains all first-display requirements from Sasa's latest message: visa, ETA, passport validity and free pages; mandatory and recommended vaccinations and health measures; named forms, costs and scam warnings; fees; return/onward ticket and funds; transit; minors and consent; customs; dual citizenship and ID-card cases; sources, dates, recent changes, official completion links and "bitte vor der Reise prüfen". Unconfirmed information is "derzeit nicht verfügbar". Marketing contains no separate entry-data source or completeness claim.

Production, merges, new costs, logins/2FA and real-money refunds remain reserved to Sasa. #1196–#1198 and their changed files remain excluded. No user permission is requested for the already authorized Development implementation.

## Implementation and verification record

### Implemented behavior

- The closed URL builder admits only the three existing public destinations `/`, `/planen`, `/entdecken`, four fixed channel/medium pairs and strict opaque `cmp-` / optional `cnt-` UUID v4 identifiers. The canonical public origin is reused from the unchanged SEO source. Arbitrary origins, paths, extra parameters, personal identifiers, getters and malformed input cannot pass through. Public routes were read once to confirm that these UTM parameters do not cause a booking or other automatic action.
- Identifiers are created only after a deliberate user action through secure browser randomness. Changing destination/channel retains identifiers while invalidating the previous URL and copy confirmation. New campaign, new/remove variant and reset are explicit. Reload discards all transient state. The feature performs no network request, navigation, browser storage, Auth write or provider call.
- Clipboard transport is serialized within the document, including real component unmount/remount. A UI deadline never cancels a pending operating-system write or releases its lock; an edited generation cannot receive an older result. Missing/rejected/synchronously failing Clipboard support stays unconfirmed and allows exact manual text selection. There is no automatic retry or queued second write.
- The actual component, explanatory text and feedback are available in German and English and use the saved per-account language through the existing settings reader. The combined Admin catalog preserves every Settings key/value and adds the explicitly namespaced Marketing strings. The navigation entry now says Marketing links and is ready; the existing outer Admin admission/AAL2 gate and role filters remain unchanged.

### Source ownership and review

The production writer completed its assigned files; the independent proof writer supplied only `scripts/admin-marketing-links-1/harness.tsx` and `lib/admin/marketing/browser.test.ts`. Root read production and proof once, then copied exactly those two proof files into the implementation worktree. There is no Git merge or shared-file writer overlap. Existing Settings browser tests and harness are unchanged.

The collected local pre-publication batch found one structural issue: replacing the last placeholder consumer left `components/admin/AdminFolgtSeite.tsx` unreachable. Root removed that obsolete component as a necessary small correction under Sasa's standing Development authorization. This is the sole additional cleanup beyond the task's enumerated existing files. The immutable Task was not rewritten. The file is outside the current changed-file inventories of #1196–#1198; no reachability exception or gate weakening was added. The existing shared state helpers and their tests remain unchanged.

### Actual pre-publication checks

- The affected pure/contract batch passed all 94 cases, with no failure or skip. Full TypeScript passed. Full ESLint passed with zero errors and the existing 193 warnings. The actual new production component/harness and production Tailwind CSS bundle successfully, with no unresolved `process.env` build constants.
- All five static gates ran in the same collected batch. API protection, database usage, exports and package usage passed. Reachability alone failed for the obsolete component described above; its focused correction/readback is recorded in the PR. No unrelated failure was hidden and no CI selector, script, dependency or exception list was changed.
- The new mounted suite defines 66 non-optional cases using the actual production component and styles, an independent URL oracle, and explicit synthetic randomness/Clipboard ports. It covers both languages, every destination/channel, stable/reset/reloaded identifiers, missing randomness, exact/manual copying, rejection/timeout/late results, document-local pending locks, keyboard use, full URL visibility, contrast, 44px controls and 320/390/1280 widths at 100%/200% text. Network and storage attempts are denied before mount and retained across reload. This is not a real Admin login or operating-system Clipboard acceptance.
- No local Chromium, socket or PostgreSQL process was started in the already restricted workspace. Actual mounted execution belongs to the normal full CI run on the published source. Its exact head, complete results and same-head READY Preview are recorded in the PR body; no future outcome is pre-claimed in this source commit.

### First full CI: collected failures and one grouped correction

The first published source was `bcf082e0a49ab8d1aa326cb79188669190e84798`, tree `e961288f5e93fe396c37e22f399f7cd35ea96ada`. Its complete [CI 43717214958](https://github.com/Jetnity/jetnity/actions/runs/43717214958) was collected before any correction: all seven parallel Auth/native/isolated-UI jobs passed, TypeScript and ESLint passed, and Core reported 9,082 tests / 9,014 passed / 66 failed / 2 existing optional Workspace skips. The only failures were all 66 new Marketing browser cases. The downstream five static gates and CI build were skipped after that test failure; neither is falsely counted as a CI pass. The aggregate job consequently failed.

The complete logs identify two distinct failure groups, collected together:

1. **62 hook failures:** `ReferenceError: __name is not defined` in transferred browser JavaScript. The two reload cases also expose the same helper failure. The fixture bundle's existing esbuild banner does not supply a helper before an independently injected init script. This is a fixture bootstrap defect, not a reason to hide runtime errors or relax isolation assertions.
2. **4 real layout failures:** the selected destination labels `Reiseplanung` and `Travel planning` overflow a 252px native select at 320px width and 200% text in both themes. Their measured requirements were 263.703px and 292.156px. The product wording is shortened to the equally clear `Planung` and `Planning`; the `planning` value and `/planen` destination remain identical. Font size, keyboard behavior, 44px controls and all geometric/contrast assertions remain unchanged.

These two corrections are published together. The original 66 test bodies, timeouts, selectors and assertions remain intact, as do the existing Settings cases and all CI gates. The corrected source's one full CI run and same-head Preview results belong in the PR description; this handoff does not pre-claim its outcome. No repeated review or optional rerun of already successful older packages was performed.

The browser correction installs `globalThis.__name=(target)=>target` and the unchanged serialized IO monitor as a single ordered init script. It runs before every document bundle, including reload; separate unordered init scripts are avoided. The proof writer reproduced the original ReferenceError with actual tsx serialization in a Node VM, then verified first-load/reload installation and the IO denials without starting a browser. Focused TypeScript and lint passed. Root compared the exact delta and confirmed every original browser test body, the harness and immutable Task are unchanged. No runtime error, storage/network assertion or accessibility measurement was suppressed.

The first source already produced a READY Preview. Protected `/login` and `/admin/login` returned actual Jetnity forms, and an unauthenticated `/admin/marketing` request correctly reached the Admin login without rendering the Marketing form. This proves deployment transport and unauthenticated admission behavior, not a positive signed-in Admin acceptance.
