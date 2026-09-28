# Jetnity – ChatGPT New Chat Checkpoint – 28. September 2026

Stand: 28. September 2026  
Status: **NORMAL / ADMIN F RECONCILIATION #606 DELIVERED FOR TL REVIEW / V1 PREFLIGHT #603 MERGED / KAYAK + SHERPA + IATA RESPONSES PENDING / NO FOLLOW-UP WRITER**

> Live evidence wins. This checkpoint is the canonical handoff for the next ChatGPT Technical Lead, but it never replaces fresh live reconstruction.

## 0. Latest current handoff — Admin F reconciliation 1

Draft PR #606 / Issue #605 reconciles continuity only. The bounded Admin area palette shipped in #545 and is unchanged on `main@6d5299f73e8da1b8eec7604686e5d272b70fd256`. Accepted #545 head `43720a65ca5296e2009158ccd0bce6b30796ca95`; merge `8fcccd6475f41703bd2a31deecb3067391f330b4`. Do not rebuild it and do not treat the 22 September remaining-build-map F row as current.

Writer: **Jetnity admin F reconciliation 1**, Generation 1. Session https://cursor.com/agents/bc-ef444eaa-ff16-4737-97a8-2a5c11e8aa83. `originalModelName=grok-4.7`. Dispatch states Grok 4.7 High Fast was visibly selected; that qualifier is not a separate run-info field.

Fresh evidence is `docs/evidence/admin-f-reconciliation-1/` (24 unit pass, 12 Chromium harness pass). Not signed-in Admin and not a physical device. Delivery CI must be read on the delivery head, not on seed `ef866098`.

Direction: while KAYAK, Sherpa and IATA responses remain pending, safe provider-independent useful residuals may be considered only after a fresh precheck. No second Admin F, no Phase-2 bulk rollout, no new API/data/permission contract, no special gate.

Exact next unfinished step: independent Technical-Lead review. Cursor does not Ready, merge, or start the next slice.

Canonical report: `docs/ADMIN_F_RECONCILIATION_1_REPORT_2026-09-28.md`.

The section below remains the V1 preflight / external-response record.

## 0b. Previous current handoff — V1 preflight closure / external response wait

Immediately before this continuity persist, live `main` was:

`d961a5402fc363a481918f1a5830aff22dcc878e` — Merge #603, V1 Release Readiness Preflight 1.

Accepted exact head:
`5c2f0ef25c90ccdbda5bef06ff38db7a38420fcc`

Technical-Lead FINAL PASS:
review `5343161510`

Verification:
- exact-head CI `36466410801`: **SUCCESS**;
- exact-head Vercel Preview `dpl_Fd6xxmKdbUtQPi2F3aYMFN8MS7N8`: **READY**;
- post-merge CI `36467497747`: **SUCCESS**;
- Vercel Production `dpl_HjBdggZpQx79CvPjdrTeigxtJf3M`: **READY** on exact merge SHA with alias `jetnity.com`;
- Issue #602: **CLOSED / completed**.

Independent Technical-Lead Production readback after agent delivery:
- migration `20260927230000_reise_graph_kaskade_tiefe` present;
- `account-delete-v1`: **ACTIVE v1**, `verify_jwt=true`, expected bundle hash;
- Supabase Security Advisor currently reports WARN-only schema-visibility / authenticated SECURITY DEFINER findings; independent catalog readback confirms RLS on the flagged tables and reviewed ownership/role+AAL2 checks. These warnings remain final-security-gate evidence and do **not** close finding 5.2 or Security Gate B.

Current external waits:
- **KAYAK #395** — inquiry sent / waiting;
- **Sherpa #294** — inquiry sent / waiting;
- **IATA Timatic #294** — business enquiry sent / waiting.

No provider or Official Truth source is selected. No signup, additional Terms/DPA/commercial acceptance, credentials, API calls, spend, runtime adapter or Production provider activation follows automatically.

#585 remains deferred and is not a current engineering task. Public indexing remains disabled.

The accepted A–O preflight concludes that there is **no justified ungated V1-critical implementation slice while these three external responses are pending**. This is not a final Release Readiness PASS.

**Exact first unfinished step:** wait for the first material KAYAK/Sherpa/IATA reply; Technical Lead reviews the full response and every linked term before any subsequent action.

No current Cursor/runtime writer is authorized.

Canonical report:
`docs/V1_RELEASE_READINESS_PREFLIGHT_1_REPORT_2026-09-28.md`

Canonical closure:
`docs/V1_RELEASE_READINESS_PREFLIGHT_1_CLOSURE_2026-09-28.md`

A later docs-only continuity merge may advance `main`; always fetch live before asserting the current SHA.

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

Production Supabase at this checkpoint's task-creation state:

- ref `qscbgcdmivbbnzrcyegn`
- Edge Functions: **0**
- `20260927230000_reise_graph_kaskade_tiefe.sql`: **NOT applied** at the time of this checkpoint
- no real Production user was deleted
- deletion UI remained fail-closed for the Production environment at that time

Later live fact, 28 September 2026, Technical Lead: the Production migration is **APPLIED**. Current history version is `20260927230000`, name `reise_graph_kaskade_tiefe`. The remote history was repaired to that repository filename. `reise_graph_geaendert()` remains SECURITY INVOKER. Trigger count remains 9. After TL FINAL PASS on PR #597 exact head `1b5e2b708c26e294c7216b4cd65559ff7d0d34aa`, the Technical Lead deployed Production `account-delete-v1`: **ACTIVE v1**, `verify_jwt=true`, Function id `58a3892d-2743-4a6d-a301-acd311ad7fa7`, bundle SHA256 `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`. No real Production account has been used or deleted. Cursor did not apply the migration, repair history, or deploy the Production Function.

PR #591: **MERGED**

Merge:

`f611235aeb8cf224dd43a2018e3976b160567d17`

Purpose: repository continuity closure so old NOT-PASS wording does not become current truth.

## 3. Separate gated follow-ups — do not auto-start

### #592 — Production account erasure activation

**COMPLETE / PRODUCTION E2E DELETE PASS**

Integrated runtime:
- PR #597 merge: `929d671edbcd673d336f97b9b6734ba9f0babe89`;
- migration: `20260927230000 reise_graph_kaskade_tiefe`;
- `account-delete-v1`: ACTIVE v1, `verify_jwt=true`, bundle SHA256 `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`.

Final Production E2E:
- Product Owner authorized a disposable Production test account;
- UI deletion completed and redirected to `/konto-geloescht` with signed-out state;
- Function log: `kontoloeschung klasse=geloescht schritt=fertig`;
- Auth residues: users/identities/sessions/MFA/one-time tokens = 0;
- Jetnity/Storage residues: profiles/trips/travellers/visits/security events/owned objects = 0.

The prior smoke-blocked residual is superseded. #592 is closed. No unrelated Production configuration changed.

### #587 — Jetnity Nutzungsbedingungen / AGB

**CLOSED / CH-DE 1.0 LIVE / PRODUCTION VERIFIED**

- Product Owner superseded the earlier HOLD for the exact approved CH-DE 1.0 document.
- PR #600 merge: `e1f72431a7097744375875fe29cf8f8136f8d7cf`.
- Post-merge CI `36445805345`: SUCCESS.
- Vercel Production `dpl_5tJ2rR9PYCveg4CwpsNpVGPNVZkY`: READY on exact merge SHA.
- `/terms`: HTTP 200; title/version/Stand/Inkrafttreten verified; canonical `https://jetnity.com/terms`; `noindex, nofollow`.
- `/register`: HTTP 200 and links `/terms` + `/privacy`.
- `/privacy` and `/impressum`: HTTP 200.
- Footer links all three legal surfaces.
- `robots.txt` remains disallow-all.
- No consent persistence was added and no retroactive acceptance by existing accounts is claimed.
- Public indexing remains disabled.

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

### Gate execution update — `A-KAYAK-INQUIRY-1` SENT

The Product Owner explicitly approved the bounded inquiry and sent it from `info@jetnity.ch` to KAYAK's published `partnerships@kayak.com` contact with subject `Jetnity – Pre-launch inquiry for KAYAK Flights API Sandbox access`.

The inquiry states Jetnity's pre-launch status truthfully, expresses interest in a possible long-term partnership, and asks for Flights Sandbox eligibility plus Production traffic/cost/rate-limit/cache/attribution/Swiss-market/privacy terms.

Current state: **WAITING FOR KAYAK RESPONSE**.

The executed gate does **not** authorize:

- public KAYAK form submission;
- KAYAK Terms/Privacy acceptance;
- affiliate/API account creation;
- provider secrets;
- Sandbox or live API calls;
- fees or recurring cost;
- KAYAK adapter/runtime coding;
- Production S6 or Commercial Provenance writer activation;
- public launch/indexing.

Do not start a Cursor writer while this is the exact current boundary. When KAYAK replies, review the complete response and any linked terms first. No signup, Terms acceptance, credential creation, API call, spend or implementation follows automatically.

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
