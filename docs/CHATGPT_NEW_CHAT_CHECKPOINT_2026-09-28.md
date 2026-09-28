# Jetnity – ChatGPT New Chat Checkpoint – 28. September 2026

Stand: 28. September 2026  
Status: **NORMAL / PROVIDER ACCESS READINESS REFRESH COMPLETE / A-KAYAK-INQUIRY-1 PRODUCT-OWNER GATE / NO EXTERNAL PROVIDER ACTION YET**

> Live evidence wins. This checkpoint is the canonical handoff for the next ChatGPT Technical Lead, but it never replaces fresh live reconstruction.

## 1. Startzustand für den nächsten Chat

Repository: `Jetnity/jetnity`

Application/closure baseline immediately before the handoff-docs merge:

`f611235aeb8cf224dd43a2018e3976b160567d17`

This is Merge #591, the docs-only closure after V1 Account Erasure Development acceptance.

PR #593 subsequently merged this handoff documentation. Therefore **do not treat the baseline SHA above as the permanently current `main`**; fetch the exact current `main` live at startup.

The #593 merge received a **READY** Production deployment. Later docs-only continuity merges may move `main` again without changing the application runtime.

Machine mode:

- `.jetnity/operating-mode.json` => `NORMAL`
- normal bounded product slices are allowed
- special Product-Owner gates remain in force
- historical HOLD-era metadata inside the JSON is not a live HOLD

No current Cursor/runtime writer is authorized by this checkpoint. A new writer must be selected only after fresh live reconstruction.

## 2. Most recent closed work — V1 Account Erasure

Issue #588: **CLOSED / completed**

PR #590: **MERGED**

Accepted exact head:

`8d1755e926756776bd6f62e0e042bfb3169844e3`

Merge:

`84356ba1830adf1d1ebd5c84a29df355ff8f2b30`

Final Development acceptance:

- disposable proof: **11/11 PASS**
- `status=pass`
- `grund=pass`
- `Proof exit=0`
- exact-head CI `36359427168`: **SUCCESS**
- exact-head Vercel Preview `dpl_8o4EHxvjFutr2ZFLbbypsTZC2afV`: **READY**
- branch behind main at acceptance: 0
- unresolved GitHub/Vercel review threads: 0

Passed Development cases:

1. wrong typed confirmation rejected;
2. missing session rejected;
3. wrong password rejected;
4. MFA bypass rejected;
5. AAL2/TOTP deletion succeeds;
6. owned Storage object removed;
7. linked `security_events` removed;
8. account/trip/traveller/visit graph cascades;
9. stale JWT has no account authority;
10. second deletion is not a false success;
11. unrelated synthetic user data remains untouched.

Final cleanup after proof:

- proof users: 0
- proof events: 0
- proof buckets: 0
- proof objects: 0
- proof policies: 0
- temporary `account_visits` service-role SELECT: absent

Development Supabase:

- ref `yfvbxvijcorffwxbxahl`
- `account-delete-v1`: **ACTIVE v2**
- `verify_jwt=true`
- bundle sha256 `3719e8762717d05cb5cb89db0f4f8c7f8bdf70f78c1c2b0b12a83cfccc2586e6`
- Development-only migration `reise_graph_kaskade_tiefe` applied and verified

Production Supabase:

- ref `qscbgcdmivbbnzrcyegn`
- Edge Functions: **0**
- `20260927230000_reise_graph_kaskade_tiefe.sql`: **NOT applied**
- no real Production user was deleted
- deletion UI remains fail-closed for Production environment

PR #591: **MERGED**

Merge:

`f611235aeb8cf224dd43a2018e3976b160567d17`

Purpose: repository continuity closure so old NOT-PASS wording does not become current truth.

## 3. Separate gated follow-ups — do not auto-start

### #592 — Production account erasure activation

**OPEN / PRODUCT-OWNER GATE / NOT AUTHORIZED YET**

A future explicit approval must separately authorize:

- Production application of `20260927230000_reise_graph_kaskade_tiefe.sql`;
- Production deployment of `account-delete-v1`;
- Production UI activation;
- bounded Production smoke design.

Never use an existing real Production account as acceptance evidence.

### #587 — Jetnity Nutzungsbedingungen / AGB

**OPEN / HOLD**

The currently identified external legal option is considered too expensive by the Product Owner. Do not purchase or generate substitute final AGB. Registration currently references `/terms`; public launch remains blocked until approved legal content exists.

### #585 — PrivacyBee Infomaniak legal-basis wording

**OPEN / legal/vendor-text residual**

Do not hand-edit PrivacyBee vendor text in Jetnity code. Non-blocking for continued prelaunch engineering, but must be resolved/accepted before public legal sign-off.

### #395 — First real Flight provider access

**OPEN / PRODUCT-OWNER GATE**

No real Flight provider is selected or activated. No application/contact, terms acceptance, provider secret, fee, paid call, Production S6, or final provider activation is authorized merely by this checkpoint.

## 4. Provider Access Readiness Refresh — COMPLETE / next action is a Product-Owner gate

Canonical report:

`docs/PROVIDER_ACCESS_READINESS_REFRESH_2026-09-28.md`

Task:

`docs/PROVIDER_ACCESS_READINESS_REFRESH_TASK_2026-09-28.md`

The refresh was completed read-only. It performed **no** provider contact, application, Terms acceptance, credential action, API call, spend or Production mutation.

Fresh current public evidence:

- **KAYAK**: API publicly positioned for startups and enterprises; free Sandbox request is available; reviewed API pages publish no numeric traffic threshold. Production approval and provider-specific commercial/licence/privacy truth remain external.
- **Skyscanner**: Travel API still requires at least **100K MAU**; separate affiliate programme requires **>5,000 unique visitors/month**, complete HTTPS site, current travel content and other acceptance conditions.
- **Wego**: current developer API remains metasearch/referral capable, but public company material still states **USD 1,000/year**; 5% Search-to-Click and material user/data contract language remain.
- **Duffel**: accessible test mode, but sandbox fares are not real; live route is transactional Search-to-Book with published order/search economics.
- **Travelfusion**: serious enterprise/meta candidate, but registration/licence/sales-led and contract-fee based.
- **Amadeus** extra check: current portal states Self-Service was decommissioned on 17 July; not promoted into the active shortlist.

Jetnity itself can truthfully present a live prelaunch product at `jetnity.com`, a real Production deployment, a provider-neutral Flight architecture and official privacy/imprint surfaces. It must **not** claim public launch, 5K unique visitors, 100K MAU, booking/conversion/revenue metrics, a live provider or Production API access without evidence. `/terms` remains separately gated in #587 and indexing remains disabled.

### Exact first unfinished step

**Product-Owner gate `A-KAYAK-INQUIRY-1`.**

Recommended authorization is deliberately smaller than a KAYAK application:

> Allow exactly one non-binding inquiry to KAYAK's published partnership contact, identifying Jetnity truthfully as a Switzerland-first prelaunch product and asking for Flights Sandbox eligibility plus Production traffic/cost/rate-limit/cache/attribution/Swiss-market/privacy terms.

This gate does **not** authorize:

- public KAYAK form submission;
- KAYAK Terms/Privacy acceptance;
- affiliate/API account creation;
- provider secrets;
- Sandbox or live API calls;
- fees or recurring cost;
- KAYAK adapter/runtime coding;
- Production S6 or Commercial Provenance writer activation;
- public launch/indexing.

Do not start a Cursor writer while this is the exact current boundary. Wait only for the Product Owner's explicit approve/reject of `A-KAYAK-INQUIRY-1`.

## 5. Open PR hygiene at handoff

PR #589 `feat: V1 account deletion hard-delete flow`: **CLOSED / superseded by #590**. Do not resume.

Remaining old open Draft PRs observed at handoff:

- #52 — old 24 Aug ChatGPT handoff
- #50 — old Provider Ops S1 merge-status docs
- #40 — old Admin Platform audit
- #39 — old Account Platform audit
- #28 — old Trip Collaboration foundation

These are historical/stale drafts, not active writers. Do not merge or resume any of them merely because they are open. If one becomes relevant, first compare it to current `main`, current product truth and newer merged work.

## 6. Persistent product targets — not automatic next slices

- #294 Entry Requirements Detail Architecture remains binding target / do not auto-start.
- #236 Strategy Register remains a persistent opportunity register / do not auto-start.
- #20 Collaboration remains future product work; old PR #28 is not current authority.

## 7. Public/release posture

- `jetnity.com` is live as a prelaunch Production deployment.
- Public indexing remains disabled.
- Do not interpret a successful Vercel Production deploy as public-launch approval.
- Provider, legal, account-erasure Production activation and other reserved external gates remain separate.

## 8. How the next ChatGPT must resume

Read in this order:

1. `JETNITY_START_HERE.md`
2. `.jetnity/operating-mode.json`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. this checkpoint: `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-28.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. live GitHub main / open PRs / open issues / Actions / Vercel
7. only then choose or dispatch work

Do not trust this checkpoint blindly for mutable state. Re-fetch live evidence before asserting that a PR, issue, SHA, deployment or provider condition is still current.

## 9. Product-Owner working contract

The Product Owner is not expected to make technical implementation choices that the Technical Lead can resolve professionally.

The Technical Lead should:

- choose the best bounded technical path;
- challenge agent work independently;
- use same-session fix loops;
- merge only after exact-head PASS;
- persist every meaningful handoff in the repository;
- ask the Product Owner only at true reserved gates or material business/legal/cost decisions.

No Cursor agent may Ready or merge on its own.
