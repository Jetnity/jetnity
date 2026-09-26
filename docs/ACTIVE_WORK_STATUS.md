# Jetnity – Active Work Status

Stand: 26. September 2026
Status: **NORMAL / DRAFT PR #563 CLI EFFECT USAGE FIX 1 FROZEN FOR TL REVIEW / NOT READY / NOT MERGED**

> This file is a current-state continuity aid, not a substitute for live reconstruction. Every new chat must re-fetch GitHub/Vercel and relevant Supabase truth before acting. Mutable heads below are observation pins, not permanently current.

## 0. Current work boundary — 26 September 2026

**Live `main` machine mode is `NORMAL`.** Special Product-Owner gates remain. Cursor does not Ready or merge.

| Field | Value |
| --- | --- |
| Arbeitsblock | Admin Account Counts CLI Effect Usage Fix 1 |
| Branch / PR | `fix/admin-account-counts-cli-effect-usage-1` / Draft https://github.com/Jetnity/jetnity/pull/563 |
| Base | `4beaca99586c4f7f1a25e0ab90ed37a3eae965fb` |
| Implementation persist | `9e094128da4044bc9e01f8d35a80f2d42ed4c93d` |
| Status | technisch review-bereit / wartet auf unabhängigen Technical-Lead exact-head Review |
| Agent | Jetnity admin account counts CLI effect usage fix 1, Gen 1, session `bc-cd3af49c-ac29-4834-a409-907aa3342058` |
| Model | cursor-grok-4.6-high-fast |

#562 Effect short-description parser is **MERGED** on this base. Fourth authorized real-Mac preflight plus direct SHA-verified v2.117 binary capture proved Docker / archive / version / start-help still good; remaining fail is `cliVerified=false` because the release binary emits `supabase <subcommand> [flags]`, not the previously modelled `supabase [flags]`.

Bereits umgesetzt: primary Effect root usage identity now requires `supabase <subcommand> [flags]`; previously modelled `supabase [flags]` remains only a separate compatibility alternative and still needs all three Effect command entries; historical Cobra remains only as a separate complete alternative; mixed Effect usage + Cobra-only start description fails closed for both Effect usage forms; start-help and arbitrary sentences fail closed; CLI 2.117.0 pins unchanged; Docker endpoint / start-help / archive provenance unchanged; controlled tests 46/46 PASS (prior 46 preserved); default no-start receipt `aaclr1-20260926T102641Z` is `BLOCKED_ENVIRONMENT`.

Noch offen: independent TL exact-head review; fresh exact-head CI/Auth/Preview after this persist; authorized later real-Mac preflight. No Production/hosted mutation.

DB / RLS / Production-Grenze: none crossed. Kosten / Provider / Secrets: none added. Docker credentials were not copied. Official CLI was not downloaded or executed.

Exakter nächster Schritt: Technical Lead reviews the exact current head of Draft PR #563. Cursor starts no follow-up.

Zuerst lesen: `docs/ADMIN_ACCOUNT_COUNTS_CLI_EFFECT_USAGE_FIX_1_TASK_2026-09-26.md`, STATUS / HANDOFF / SELF_REVIEW of this slice, then `cli-identity.mjs` under `scripts/e2e/admin-account-counts-local-runtime-1/`.

The 22 September Continuity Refresh 3 checkpoint below is historical observation, not this writer.

Canonical current-work checkpoint:

`docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-22.md`

That dated file already exists on `main` from #546. Branch fallback depends on **PR #551 merge / content-version state**, not mere file existence. While Draft #551 is open, read the corrected Refresh-3 content from branch `docs/v1-continuity-refresh-3`. If #551 is merged, read it from `main` and do not reactivate session `bc-e268a98c-10c1-428f-94ae-99f3246f460a`. The 21 September checkpoint remains historical Continuity Refresh 1 capture. The 18 September checkpoint remains historical OS-2 / HOLD-exit evidence.

## 0. Current work boundary — 22 September 2026

**Live `main` machine mode is `NORMAL`.** Issue #440 historical override remains recorded. Special Product-Owner gates remain in force. Historical HOLD / exclusive OS-2 writer / parked-#487 prose below this section is historical evidence, not the current writer. `.jetnity/operating-mode.json` `activeMetaScope` still names #511/#512; that descriptive metadata is historical and was **not** edited here.

Re-fetch live #551. If still open, continue independent review/fixes of the exact current head. If merged, do not reactivate this session; reconstruct the next unfinished work. This persist owned only named global startup/status files. It did not own or edit #550 SQL/proof/docs, #552 evidence, runtime, operating-mode or gates. After #551, account-count Production/exposure remains separately gated and is not auto-dispatched.

### 22 September 2026 Continuity Refresh 3 C1–C3 observation (dated pin)

| Stream | Issue / PR | Branch | Observation (re-fetch) | Agent / session | Classification |
| --- | --- | --- | --- | --- | --- |
| Admin account counts local proof 1 | #550 | `feat/admin-account-counts-local-proof-1` | accepted `b5bbe211bc82c16da34bc8f48b58f39920af5f5a`; TL PASS [5282850421](https://github.com/Jetnity/jetnity/pull/550#pullrequestreview-5282850421); merge `34686af3a12317d5eb40ab12056a1188298e04c6`; closure [5782888984](https://github.com/Jetnity/jetnity/pull/550#issuecomment-5782888984); post-merge CI `35775349060` SUCCESS (fresh API); Production `dpl_AVsTBxQRgymFUo6ocTZnLripADgL` READY (dated TL receipt). Intermediate R1–R4 / intake `5782510116` historical | **Jetnity admin account counts local proof 1**, Gen 1, `bc-49dd67e9-5979-44af-9476-1df8bcdfff93`; display name `Admin account counts local proof`; UI rename not performed | **CLOSED / MERGED / POST-MERGE VERIFIED**; **LOCAL / UNAPPLIED**; session completed, do not restart |
| Independent account-count verification 1 | #552 | `audit/admin-account-counts-independent-verification-1` | accepted `3bb98706cb70383f8e9dd41b7250009e1d99ebd1`; TL PASS [5283137155](https://github.com/Jetnity/jetnity/pull/552#pullrequestreview-5283137155); merge / current main `0d4c871867e7c4daac45af4a737cc032723863ae`; closure [5783340076](https://github.com/Jetnity/jetnity/pull/552#issuecomment-5783340076); post-merge CI `35777992016` SUCCESS (fresh API); Production `dpl_8tg95sUyqkVE6Hw96ra1smAvdbvZ` READY (dated TL / Vercel receipt). Intermediate `cbba1264` historical | **Jetnity admin account counts independent verification 1**, Gen 1, `bc-4a3288b3-eb42-480b-9c37-f74b584e2419`; footer **verified** in comment `5782508582` HTML | **CLOSED / MERGED / POST-MERGE VERIFIED**; Cursor specialist, **not Guardian**; session completed, do not restart |
| Continuity refresh 3 | #551 | `docs/v1-continuity-refresh-3` | task seed `096272cc…`; authorized main sync `0d4c8718`; this C1–C3 persist | **Jetnity V1 continuity refresh 3**, Gen 1, `bc-e268a98c-10c1-428f-94ae-99f3246f460a`; model from run-info `cursor-grok-4.6-high-fast`; footer **verified** in comment `5782480321` HTML; display name `Jetnity V1 continuity refresh`; UI rename not performed | remaining assigned current work / this persist / not a permanent current-writer claim after merge |

Last completed (do not restart):

- Independent account-count verification #552 — **MERGED / POST-MERGE VERIFIED** on current main `0d4c8718`; accepted `3bb98706`; TL PASS `5283137155`; closure `5783340076`; CI `35777992016` SUCCESS (fresh API). Cursor specialist evidence, not Guardian. Do not reactivate session `bc-4a3288b3-eb42-480b-9c37-f74b584e2419`.
- Admin account counts local proof #550 — **MERGED / POST-MERGE VERIFIED** on `34686af3`; accepted `b5bbe211`; TL PASS `5282850421`; closure `5782888984`; CI `35775349060` SUCCESS (fresh API). **LOCAL / UNAPPLIED** only; no live counts. Do not reactivate session `bc-49dd67e9-5979-44af-9476-1df8bcdfff93`.
- Audience/partner metric inventory #549 — **MERGED / POST-MERGE VERIFIED** on historical `e28ab43b`; accepted `877f1d88`; CI `35765366096` SUCCESS (historical). Docs-only. Internal raw-ops ≠ clean partner-audience reporting.
- HBX offline hotel adapter foundation #548 — **MERGED / POST-MERGE VERIFIED** on `e71218b4`; accepted `125f2936`; CI `35764518842` SUCCESS; Production `dpl_RV1LUx7XMCQDN8S23tdNgHowGWwU` READY. **Offline code only; no live provider activation.** Latest application-runtime-changing merge.
- Admin navigation search #545 — **MERGED / POST-MERGE VERIFIED** on `8fcccd64`; accepted `43720a65`; CI `35761281074` SUCCESS; Production `dpl_7qg2UUWu5xMFTCiwAj6SVrAQvd5P` READY.
- Read-only Admin indexing configuration #547 — **MERGED / POST-MERGE VERIFIED** on `88bf3a07`; accepted `ed25bd07`; CI `35758420028` SUCCESS; Production `dpl_CJxLPjWNzodxTJoznL16UEiZK8Cf` READY. Not public indexing activation.
- Continuity refresh 2 #546 — **MERGED / POST-MERGE VERIFIED** on `9dc8926e`; accepted `092978ac`. Do not reactivate session `bc-a65f0017-f2c2-4617-a825-7197c4409c44`.
- Homepage confirmed route entry #543 — **MERGED / POST-MERGE VERIFIED** on `d03a0486`; #110 NL remainder open.
- Remaining-build-map #544 — **MERGED**; report Draft header is historical source evidence. Use that report for remaining programme; later #545–#549 closures prevail. Do not repeat audits.
- Continuity refresh 1 #511 / #512 — **MERGED**.
- Visual UX #506, Trip/Account #509, Admin foundation spec #510 — **MERGED**, with later accepted implementation repairs. Not current writers.
- MFA existing-factor step-up #542 — **MERGED** with PO device acceptance.

Binding current tasks:

- Continuity refresh 3: `docs/V1_CONTINUITY_REFRESH_3_TASK_2026-09-22.md` (v1; TL-owned, not rewritten) — remaining assigned current work
- Closed #550 / #552 tasks remain historical slice records on main; do not restart those sessions

Do not restart, wake or create completed prior docs/runtime sessions from this file. Incoming #550/#552 files from the authorized main merge are read-only. Uncommitted local work is not claimed backed up. After #551, account-count Production/exposure remains separately gated and is not auto-dispatched.

First unfinished action: independent Technical-Lead exact-head review of **this #551 C1–C3 persist**. After #551 closure, the account-count Production migration / privilege exposure / live activation decision remains a separately scoped and gated later step — not a blanket Product-Owner gate on every later local UI/RPC design, and not automatically dispatched. Cursor does not Ready, merge or start a follow-up.

Sections 1+ below are **historical closures** and remain valid as dated evidence. They are not the current writer. Current work is reconstructed live from §0 plus GitHub.

Closed later integrations that must not be reconstructed as active writers:

- #492 HOLD closure **MERGED**; live mode is NORMAL
- #487 architecture **MERGED**, not parked; finding 5.2 / release-gate G / persistent ingestion remain OPEN
- #494 local disposable PostgreSQL proof **MERGED**; author-reported 67-of-67; Guardian count qualification is nonblocking P3; no remote DB apply
- #498 Core Regression Hunter and #497 Live Gap Reconciliation **MERGED** evidence
- #502 Mobility Canonical Stage Order, #500 Auth Lookup Failure Truth, #504 Security KPI Taxonomy **MERGED** fixes

OS-1 / PR #489 is **MERGED / POST-MERGE VERIFIED** and must not be reconstructed as the active writer. Issue #488 is closed. Merge/current main at that closure: `ff0df56ae32e3f28e0f9c160a40fa75de81ba133`. Post-merge CI `35376407897` SUCCESS. Vercel Production success / READY. Technical-Lead PASS `5733949233` and post-merge verification `5733986499`. GitHub Ruleset `21875372` is live-verified as the already-active non-lockout baseline.

Historical HOLD-exit checklist and OS-2 accepted limitations remain: `native_scheduled_pass=false`; `native_material_archive_proof=false`; permission visibility SATISFIED BY EXPLICIT ACCEPTED LIMITATION `5757763756`. Tracker: `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_EXTERNAL_SETUP_TRACKER_2026-09-18.md`. Historical closure status: `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_HOLD_CLOSURE_STATUS_2026-09-21.md`. Acceptance matrix: `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_ACCEPTANCE_MATRIX_2026-09-20.md`. NORMAL grants no reserved Product-Owner gate and no native-proof promotion. The in-repo guard is not tamper-proof. Cursor must not activate GitHub settings. `no automatic follow-up slice` binds Cursor/Guardian/reviewers, not Technical-Lead slice selection.

Assistant Runtime 1 and the Multi-Agent Operating System are **CLOSED / MERGED / POST-MERGE VERIFIED**.

V1 Legal Claim Hygiene 1 is **CLOSED / MERGED** via PR #457.

V1 Admin MFA Loss Recovery Runbook 1 is **CLOSED / MERGED** via PR #460.

V1 Incident Process 1 is **CLOSED / MERGED** via PR #464.

Parallel V1 remediation group is also **CLOSED / MERGED / POST-MERGE VERIFIED**:
- PR #472 / issue #469 — Admin Revenue Truth 1;
- PR #471 / issue #468 — Account Error Boundary 1;
- PR #470 / issue #467 — Support Process 1.

Dated historical #480 evidence (original wording; not the current runtime baseline — later #548 `e71218b4` is the latest application-runtime-changing merge; current `main` is later #552 evidence `0d4c8718`, see §0):

Latest verified product/runtime closure baseline is now `main@581e8ad1f0d3f80e2631b967568fec51e67555af` after PR #480. Accepted exact head `b7a9764331ec813361f850c52129f624c42c45ca` had CI `35348781454` SUCCESS, Auth job `105611618459` SUCCESS, Preview `dpl_EHxhGsfhLBpbJVimzmryaw2RL9hb` READY and external Guardian exact-head PASS. Accepted head -> merge has 0 changed files; exact-merge Production `dpl_C58unv1yazveBQ1v7MjdUAiQEaSE` is READY. The available GitHub connector does not expose push-triggered main workflow runs, so no unseen post-merge Actions run is claimed. A later continuity-only merge may advance repository `main` without changing this runtime closure truth.

V1 Production Auth Verification 1 is **CLOSED / MERGED / POST-MERGE VERIFIED** via PR #480 / issue #479. Production AAL2 truth and requested HIBP/rate-limit fields are verified. Residual **P0 SMTP** and **P2 redirect** remediation remain separate gated work; no Production Auth write occurred in #480.

Dated historical last-completed wording from the #480-era persist (later completed slices include #542 and #543; reconstruct current writers live from §0):

Last completed Cursor slice: **Jetnity V1 production auth verification 1**, Generation 1, session `bc-1d490756-eed2-4390-a8bf-04645bf58082`, model Cursor Grok 4.6 High Fast. It is completed/not active.

Latest verified governance integration baseline:
- PR #453 accepted head: `afc09b378676d7350101f2ee7b5b2dfd2f93d934`;
- merge/main baseline: `30855fbb91e11e19f74afbaf1578dc67828714f2`;
- exact-head CI #1800: SUCCESS;
- post-merge CI #1801: SUCCESS;
- exact-head Preview and post-merge Production Vercel: READY.

Normal bounded work may be selected by the Technical Lead while mode is NORMAL and no special Product-Owner gate is crossed. Reconstruct live #551, #550 and #552 before treating any as the current writer. Direct Cursor UI/session state must still be re-fetched when accessible. Scheduled Technical-Lead automation remains disabled. Product-Owner primary domain is `jetnity.com` with no implied cutover.

Current Product-Owner Cursor model preference: **Cursor Grok 4.6 High Fast**. Do not use Auto. If that model is unavailable, stop/report instead of silently substituting. This supersedes prior Opus requirements until the Product Owner changes it.

Always reconstruct live state before acting. A later continuity-only merge may move `main` without changing runtime truth.

## 1. Assistant Runtime 1 — CLOSED

**CLOSED / MERGED / POST-MERGE VERIFIED**

| | |
| --- | --- |
| Product-Owner Preview/Development gate | #433 |
| Coding issue | #434 |
| PR | #435 |
| Accepted exact product head | `8915ef45849b6544fe6fea201fb1450392c15f83` |
| Merge commit / post-merge main at closure | `fdbd3735c0bfd4993bd78d41a3ab70edd895988c` |
| Accepted-head CI | #1794 / `35277776782` — SUCCESS |
| Post-merge CI | #1795 / `35286865941` — SUCCESS |
| Post-merge Vercel Production | `dpl_Dni4i6FZDYKvabhEshEra4VDQUa7` — READY |
| Guardian | exact-head GUARDIAN PASS |
| Cursor agent | `Jetnity assistant runtime 1`, Generation 1, session `bc-c94275d6-9625-464f-9cbb-ea932c703043` — COMPLETED / NOT ACTIVE |

Accepted runtime contract:
- in-trip, account-trip-only Assistant;
- accepted privacy-minimized Assistant truth projection reused;
- no guest Assistant;
- generated/advisory only;
- no trip auto-apply;
- no provider/live official/safety/seasonal fetch;
- no hidden fallback/retry;
- visible content is server-rendered from closed Jetnity-owned catalogues selected by the model;
- truth classes remain structurally separate;
- Multi-Traveller / Multi-Citizenship / Multi-Document remain peer options;
- no default/primary/preferred credential inference.

## 2. Paid Preview/Development smoke — PASS

Exactly one successful bounded paid call was executed:
- model: `gpt-5.6-terra`;
- function: `reisebegleiter`;
- kind: `konto`;
- result: `erfolg`;
- input: **2196 tokens**;
- cached: **0**;
- output: **102 tokens**;
- total: **2298 tokens**;
- runtime: **3387 ms**;
- cost: **5616 micro-USD = USD 0.005616**;
- persisted Development usage ID: `70608b03-dbcd-4d16-8ad3-95a350ed48ba`;
- reservation-before-call and completion persistence verified.

After the call:
- Preview model kill switch returned to fail-closed / inactive;
- final diagnostic: HTTP 425 / `model-inactive`;
- temporary smoke routes/workflows removed;
- temporary smoke branches had 0 file differences versus the accepted product head after cleanup.

## 3. Supabase / Production truth after #435

Development:
- ref `yfvbxvijcorffwxbxahl`;
- Assistant migration `20260917090000_modell_reisebegleiter` applied;
- contains the one accepted smoke `reisebegleiter` usage row.

Production:
- ref `qscbgcdmivbbnzrcyegn`;
- `model_usage`: **0 total / 0 reisebegleiter** at post-merge verification;
- Assistant migration `20260917090000_modell_reisebegleiter`: **NOT applied**;
- later `20260917120000_account_visits`: applied;
- no Production Assistant call;
- no Production model activation;
- merge to `main` did not auto-apply the Assistant migration.

Any future Production Assistant migration/model activation remains a special Product-Owner gate and requires a forward-only migration/history decision.

## 4. Multi-Agent Operating System — CLOSED

`docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` is canonical on `main`.

PR #453:
- accepted exact head `afc09b378676d7350101f2ee7b5b2dfd2f93d934`;
- merge commit `30855fbb91e11e19f74afbaf1578dc67828714f2`;
- post-merge CI #1801 / `35289213441`: SUCCESS;
- Vercel Production `dpl_G2DWAPB8c2NaThE7FmnQy1Ydfyhd`: READY;
- docs/governance only; no runtime, Supabase, Auth/RLS, provider, secret, model, paid-call or cost mutation.

The new document is in the mandatory startup path. PR #453 must not be reopened as unfinished work.

No automatic product follow-up is implied.

## 4a. V1 Legal Claim Hygiene 1 — CLOSED

PR #457 / issue #456:
- accepted exact head `f132ac092ff1bd78e22dde0055a45fe74dab7d24`;
- merge commit `e534e0f55cb4da5ebdc5222351e4e29e608b1007`;
- exact-head CI run `35292084238`: SUCCESS;
- Vercel Preview `dpl_GnzRuwcv5oMktSbSajh6W8kycaL3`: READY on the accepted head;
- Vercel Production `dpl_6hpZrab1QPVk1o7m4nNPw4PhZUiX`: READY on the exact merge SHA;
- merge commit has 0 changed files relative to the accepted head;
- unsupported standalone `Datenschutz: DSGVO & CH-DSG konform.` copy removed from Login/Register;
- registration terms/privacy checkbox, links, validation and submit gating preserved;
- no legal text generation, Auth semantics change, Supabase mutation, provider activation, secret change or new cost.

The available GitHub connector only exposes PR-triggered workflow runs through commit lookup, so the main push run is not independently visible here and is not falsely claimed.

## 4b. V1 Admin MFA Loss Recovery Runbook 1 — CLOSED

PR #460 / issue #459:
- accepted exact head `f0f6c892dc22cfc1cf2cf00093f8740b36155c03`;
- merge/current continuity baseline `6f79b45a70374518aef0b6f1a9ab4479f0798827`;
- exact-head CI run `35294323671`: SUCCESS;
- exact-head Vercel Preview `dpl_FY7MzpD7mEAuMQeyncdnbCPW9PJJ`: READY;
- exact-merge Vercel Production `dpl_doA4VePRj6BAuAvQXWqQerHUdHqc`: READY;
- accepted head -> merge: 0 changed files;
- independent Guardian session: GUARDIAN PASS, no P0/P1/P2 finding;
- TL P2 correction preserved: post-recovery data-plane validation is read-only/non-mutating;
- runbook preserves app-user-vs-platform-MFA separation, exact identity/factor verification, permanent AAL2, fail-closed compromise handling and later Product-Owner gate for any live Production factor deletion;
- no live Auth/Supabase mutation, factor deletion, provider/secret/cost change.

Guardian review issue #461 is closed as completed.

## 4c. V1 Incident Process 1 — CLOSED

PR #464 / issue #463:
- accepted exact head `eeff277e319b6ea5d4fb4a202b900652030c7506`;
- merge/current continuity baseline `3fcebbb128a1fd3c157073ed903518b6ad3f6566`;
- exact-head CI `35325063544`: SUCCESS;
- exact-head Vercel Preview `dpl_GFuvVfHmVBqFdeSE4MUW7BbxKec8`: READY;
- external Jetnity Guardian targeted recheck: **PASS — P3 resolved — no new P0/P1/P2/P3**;
- exact-merge Vercel Production `dpl_EK8FfncRZA2nknr7zM7sMRZrdQ48`: READY;
- accepted head -> merge: 0 changed files;
- process half of audit finding 5.5 is documented;
- automated error-tracking/alerting/log-aggregation tooling half remains OPEN / Product-Owner-gated;
- no runtime/Auth/RLS/Supabase/provider/secret/env/cost mutation.

### Guardian activation — binding correction

Jetnity Guardian / Grok Bot is the **separate Jetnity-Guardian app used by the Product Owner**, not a Cursor agent/session and not Cursor Grok 4.6 High Fast. When Guardian review is needed, the Technical Lead supplies a complete ready-to-paste prompt; the Product Owner runs it in Jetnity Guardian. `@cursor` must never be used as a Guardian substitute.

## 4d. Parallel V1 remediation group — CLOSED

### V1 Admin Revenue Truth 1 — PR #472 / issue #469
- accepted exact head `cb5ec6601e10ad9ec421a6a960dcead957b4afef`;
- merge `b051b2c2c08572b8948d24deb013d930d77ec503`;
- exact-head CI `35328619930`: SUCCESS;
- exact-head Preview `dpl_vQraWALQNEYvR7pWU3fqci97FFoS`: READY;
- exact-merge Production `dpl_2mo4Zm77Z8PiBr863ck16miEhc5E`: READY;
- accepted head -> merge: 0 changed files;
- unsupported revenue/order/refund/payout/conversion truth removed from the admin overview;
- only independently grounded trip/account operational aggregates remain;
- no payment/provider/schema/RPC/database mutation.

### V1 Account Error Boundary 1 — PR #471 / issue #468
- accepted exact head `93ae93d727560c0154fb0dba6d3c8a032a73b71b`;
- merge `d0a940c28b46f6435f9215a4fe428fa09fd4cf2d`;
- exact-head CI `35333116999`: SUCCESS;
- exact-head Preview `dpl_9uDsTGWVotFGDE7uHfk3i1ATV4L9`: READY;
- exact-merge Production `dpl_HWeaF4BdegEB9koDEoPfEecFJtpx`: READY;
- accepted head -> merge: 0 changed files;
- account-scoped error recovery surface added;
- TL P2 fixed before merge: raw Error objects are not logged in Production;
- no Auth/session/MFA/AAL/RLS/Supabase mutation.

### V1 Support Process 1 — PR #470 / issue #467
- accepted exact head `992148303700c2abcb181875edb994eb865e8554`;
- merge/current continuity baseline `9a3fe265dc47864897ab9f7da1c0ae7e9765a778`;
- exact-head CI `35334515586`: SUCCESS, including Auth configuration;
- exact-head Preview `dpl_5mGwk2ptmy1rsCPgyU59zayLkhB9`: READY;
- external Jetnity Guardian exact-head verdict: **PASS — prior P1 resolved — no P0/P1/P2/P3**;
- exact-merge Production `dpl_A9QFhq6hrj5pXohE1tMX2nd2UDhV`: READY;
- accepted head -> merge: 0 changed files;
- TL P1 fixed before merge: ordinary email cannot be used as an account-existence/status oracle; `/admin/users` is internal AAL2 triage only;
- no runtime/Auth/RLS/Supabase/provider/secret/env/cost mutation.

Audit findings **4.1 process half, 4.2 and 6.3 are therefore closed**. Do not reconstruct them as open remediation work.

No next product slice is selected by this continuity update. The previously identified credentialed Production Auth verification item may be a future candidate only after fresh live reconstruction and gate review.

## 4e. V1 Data Portability / Cookie Hygiene group — CLOSED

### V1 Cookie Consent Hygiene 1 — PR #477 / issue #475
- accepted exact head `f4bdd74626a0c079f8395bcdabe06c1765ea5565`;
- merge `ac3539d9ceff4e96308a48c51d2d317927245b54`;
- exact-head CI `35337224693`: SUCCESS;
- exact-head Preview `dpl_BGBN6ChgFpURWBZK5xihJ8nVezPy`: READY;
- exact-merge Production `dpl_DGH3PW31YhX6Ge4nX7JTBAXVBw7E`: READY;
- accepted head -> merge: 0 changed files;
- stale orphaned `CookieConsent.tsx` and its false processing claim were removed;
- no replacement banner, tracker, legal text, Supabase/Auth/RLS/provider/secret/cost mutation.

### V1 Account Data Export 1 — PR #476 / issue #474
- accepted exact head `f58a3902382c2bbf458bf0be0d977eaa2aadaef0`;
- merge/runtime closure baseline `57efdb2b796e5d99e0bf0010c5d1ef5af3842af7`;
- exact-head CI `35342076752`: SUCCESS including Auth configuration;
- exact-head Preview `dpl_AVzFSpwuCc2gJRLDk8qwvAn3R3nH`: READY;
- external Jetnity Guardian exact-head verdict: **GUARDIAN PASS — prior P2 resolved — no P0/P1/P2/P3**;
- exact-merge Production `dpl_7DRw8h3PQ3zU2FyzaNiGECJ5Wx1q`: READY;
- accepted head -> merge: 0 changed files;
- authenticated direct JSON download added under existing session-bound RLS;
- no service role, admin client, privileged SQL, DB mutation, migration or export persistence;
- export scope is exactly 13 reviewed owner-scoped account/travel tables;
- explicit per-table column allowlists replaced wildcard selects after TL P2;
- UI truthfully warns about sensitive data and does not claim legal DSAR completeness or deletion;
- residuals remain honest: no durable cross-instance throttle and no transactional legal-snapshot guarantee.

Audit finding **2.1 data export is closed for the scoped V1 product export**. Audit finding **1.2(a) stale CookieConsent artefact is closed**. This does **not** close separate legal-content, account-deletion/retention, Production-auth-verification or automated-observability gates.

No next product slice is selected by this continuity update.

## 5. Current broader product state

Closed/core surfaces include:
- Flight Multi-Leg;
- Flight 0..N Multi-Provider orchestration;
- Destination Essentials 1;
- World Map planned-account truth foundation;
- Realistic World Cartography 1;
- Assistant Truth Context 1;
- Assistant Runtime 1;
- Mobile Accessibility 1.

Product directive #441 is **CLOSED / COMPLETED**. Explicit Visit History 1 is already implemented and Production-backed via `20260917120000_account_visits`; prior live verification confirmed RLS/grants/RPC boundaries and real Production usage. Do not reconstruct #441 as future implementation.

Planned ≠ visited remains a hard semantic invariant.

## 6. Provider / Production gates

Provider inquiries remain deferred by Product Owner.

Still closed unless explicitly approved:
- provider application/signup/contact/partner engagement;
- Terms/DPA/contract acceptance;
- real provider/live secret activation;
- paid/live provider calls;
- Production S6 runtime/HMAC/>0 budget;
- Commercial Provenance runtime writer;
- final Production provider activation;
- Production Assistant migration/model activation;
- public indexing/domain cutover;
- sensitive passport/MRZ/scan/biometric/health expansion.

Generic `weiter`, `bauen`, `start` or Cursor authorization does not approve a special gate.

## 7. Hard Traveller truth

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.**

Never infer default/primary/preferred citizenship or passport, array order as truth, Residence → Citizenship or Issuer Country → Citizenship.

## 8. Truth architecture

> **OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.**

`unknown ≠ not_required`. `unavailable ≠ not_required`. `stale ≠ current`. LLM ≠ Official Truth.

Planned/account-trip evidence ≠ visited.

## 9. Agent / review governance

- ChatGPT is the overarching Technical Lead.
- Cursor agents implement bounded versioned slices.
- Grok/Guardian is an independent challenge/evidence layer.
- Many readers / one writer.
- Agent self-review is never Technical-Lead PASS.
- Changed heads invalidate previous exact-head gates.
- CHANGES REQUIRED returns to the same logical agent/session.
- Cursor and Guardian do not mark Ready and do not merge.
- Technical Lead may merge normal, fully reviewed, scope-faithful work under standing authorization.
- Product-Owner special gates remain explicit.
- Cursor, Guardian and reviewer agents start no automatic follow-up slice. After HOLD exit the Technical Lead may autonomously select the next bounded slice unless a Product-Owner HOLD or special gate says otherwise.
- Relevant continuity must be persisted in GitHub/repository evidence. Agent UI state alone is never continuity.
- Read `.jetnity/operating-mode.json` before any dispatch.

## 10. First action for a new chat

Read:
0. `.jetnity/operating-mode.json`;
1. `JETNITY_START_HERE.md`;
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`;
3. `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`;
4. `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`;
5. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-22.md` (file already exists on `main` from #546; while #551 is open, read the corrected Refresh-3 content from this branch);
6. this file and `JETNITY_HANDOFF.md`;
7. historical `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-21.md` and `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-18.md` only as dated capture / OS-2 accepted-limitation evidence.

Then reconstruct live:
- current `main`;
- all open PRs/issues;
- active/relevant branches and exact heads;
- merge-base/ahead/behind/diffs;
- Actions/Vercel/review/toolbar evidence;
- current Cursor/Guardian evidence;
- Supabase only when selected scope requires it.

Do not treat historical Draft PRs as active work merely because they are open. Do not reconstruct merged #487 as a parked live writer. Do not invent a third product writer from this file. Do not reconstruct closed #512/#506/#509/#510/#545/#546/#547/#548/#549/#550/#552 as current. Do not label #552 Cursor reviewer output as Guardian evidence. Do not restart completed #550/#552 sessions.

**LIVE-EVIDENCE WINS. MACHINE MODE NORMAL ON LIVE MAIN. CURRENT CHECKPOINT 22 SEP 2026. RE-FETCH LIVE #551. MAIN 0d4c8718 = #552 EVIDENCE-ONLY. LATEST RUNTIME-CHANGING MERGE #548 OFFLINE HBX, NOT LIVE PROVIDER. #545–#550 #552 CLOSED. #550 LOCAL/UNAPPLIED CLOSED. #551 REMAINING ASSIGNED CURRENT WORK. #512/#506/#509/#510 CLOSED. #492 HOLD CLOSURE MERGED. #487 ARCHITECTURE MERGED NOT PARKED. #494 LOCAL PROOF MERGED; FINDING 5.2 / GATE G OPEN. JETNITY.COM IS PO PRIMARY DOMAIN, NO CUTOVER. HISTORICAL OS-2 LIMITATIONS UNCHANGED: ALL SIX DAILY SPECIALISTS FINAL PASS / DAILY V2 ACTIVE / WEEKLY ACTIVE / GUARDIAN EVENT ASSURANCE SETUP COMPLETE / BOUNDED NATIVE PR-PUSHED TRANSPORT ACCEPTED FOR e0524311 / NATIVE SCHEDULED PASS FALSE / NATIVE MATERIAL ARCHIVE PROOF FALSE / PATH C OFF-SESSION BLOCKED / SCHEDULED ROUTING REPORTED CONFIGURED NOT NATIVE PASS. TL AUTOMATION DISABLED. ASSISTANT RUNTIME 1 CLOSED. MULTI-AGENT OPERATING SYSTEM CANONICAL. EXPLICIT VISIT HISTORY / #441 CLOSED. V1 LEGAL CLAIM HYGIENE 1 / #457 CLOSED. V1 ADMIN MFA LOSS RECOVERY RUNBOOK 1 / #460 CLOSED. V1 INCIDENT PROCESS 1 / #464 CLOSED. V1 SUPPORT PROCESS 1 / #470 CLOSED. V1 ACCOUNT ERROR BOUNDARY 1 / #471 CLOSED. V1 ADMIN REVENUE TRUTH 1 / #472 CLOSED. V1 COOKIE CONSENT HYGIENE 1 / #477 CLOSED. V1 ACCOUNT DATA EXPORT 1 / #476 CLOSED. V1 PRODUCTION AUTH VERIFICATION 1 / #480 CLOSED. JETNITY GUARDIAN = SEPARATE PRODUCT-OWNER GUARDIAN APP, NEVER CURSOR. CURRENT CURSOR MODEL PREFERENCE: CURSOR GROK 4.6 HIGH FAST, NO AUTO. PRODUCTION ASSISTANT MIGRATION/MODEL ACTIVATION CLOSED. CURSOR/GUARDIAN START NO AUTOMATIC FOLLOW-UP SLICE.**
