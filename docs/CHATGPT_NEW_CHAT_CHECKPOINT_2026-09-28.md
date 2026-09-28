# Jetnity – ChatGPT New Chat Checkpoint – 28. September 2026

Stand: 28. September 2026  
Status: **NORMAL / CLEAN CHAT HANDOFF / V1 ACCOUNT ERASURE DEVELOPMENT CLOSED / NEXT: PROVIDER ACCESS READINESS REFRESH / NO EXTERNAL PROVIDER ACTION YET**

> Live evidence wins. This checkpoint is the canonical handoff for the next ChatGPT Technical Lead, but it never replaces fresh live reconstruction.

## 1. Startzustand für den nächsten Chat

Repository: `Jetnity/jetnity`

Live `main` at handoff:

`f611235aeb8cf224dd43a2018e3976b160567d17`

This is Merge #591, the docs-only closure after V1 Account Erasure Development acceptance.

Vercel Production on this exact SHA:

- deployment `dpl_Cgo5twZAURgjGBNn7q72qSVv8xyJ`
- state: **READY**
- target: Production

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

## 4. Next Technical-Lead action after fresh reconstruction

The preferred next work is a **read-only Provider Access Readiness Refresh**.

Reason:

- Jetnity now has a real Production website/domain and substantially more product evidence than at the 1 September provider prechecks;
- the provider-neutral Flight architecture already exists;
- provider access conditions, thresholds and application requirements may have changed;
- Jetnity needs a path to real travel inventory before adding more speculative provider-neutral infrastructure.

Required refresh scope:

- re-check current public access conditions for KAYAK, Skyscanner, Wego, Duffel and Travelfusion, and add another serious candidate only if current evidence justifies it;
- compare each provider's current requirements to Jetnity's actual live/prelaunch state;
- identify what can truthfully be supplied now: website, product screenshots/features, user/account metrics available in Admin, legal/company details, technical integration readiness;
- distinguish API access, affiliate/referral access, sandbox/demo access and production access;
- identify fees, traffic thresholds, commercial/attribution constraints, privacy/legal blockers and contact/application steps;
- recommend the smallest external Product-Owner gate that would unlock the best candidate.

Hard boundary for this refresh:

- **no provider application submission**
- **no external contact**
- **no Terms acceptance**
- **no API key/secret creation**
- **no paid/sandbox/live call**
- **no provider selection presented as already binding**
- **no Production activation**
- **no new recurring cost**

The refresh may use current public web evidence and repository/Admin truth. It should end with a concrete PO decision package, not with a speculative implementation.

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
