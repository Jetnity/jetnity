# Admin Account Counts Browser Acceptance 1 — REPORT

Date: 2026-09-23  
Status: **BLOCKED_ENVIRONMENT / NOT A LOCAL FULL-STACK PASS / NOT PRODUCTION APPROVAL**  
Agent: **Jetnity admin account counts browser acceptance 1**, Generation **1**  
Required and actual model: **Cursor Grok 4.6 High Fast / `cursor-grok-4.6-high-fast`**. No Auto. No substitution.  
Session: `bc-7a3a3769-52a4-4d68-863e-4e750246fb64`  
URL: https://cursor.com/agents/bc-7a3a3769-52a4-4d68-863e-4e750246fb64  
Observed display name: `Jetnity admin account counts acceptance`. UI rename was **not** performed.  
Task: `docs/ADMIN_ACCOUNT_COUNTS_BROWSER_ACCEPTANCE_1_TASK_2026-09-23.md` v1, seed `74e939882e9e9bfe94f1f3e032d397ca0b2bbe50`  
Branch: `audit/admin-account-counts-browser-acceptance-1`  
Historical product snapshot (original tested sources): **main@f0237baf8809e5528b5f73e918f0e37a7d9b4477**  
Current integration baseline (authorized after #555 closure): **main@87cdc1e6858ff0fb57481dd9c3d56fd618f1e03b**  
This is not a Technical-Lead PASS, not Guardian, not hosted parity, and **not** a new browser-acceptance PASS.

## 1. Verdict

| Class | Result |
| --- | --- |
| Bounded capability preflight | **RUN / BLOCKED** — no Docker-compatible runtime |
| Source pins | **PASS** |
| Official local Auth + app login → TOTP/AAL2 → Admin render | **NOT RUN** |
| Isolated #554 HTTP proof repeated as browser E2E | **Not done** (forbidden) |
| #550 bootstrap over GoTrue | **Refused** |
| Hosted Production / Development fallback | **Not used** |
| Full local execution | **false** |

Exact blocker: `command -v docker` / `podman` / `nerdctl` not found; `/var/run/docker.sock` absent. Official local-development documentation names a Docker-API container manager as a prerequisite. `npx supabase start --help` says it starts **containers**. Privileged daemon setup, remote Docker context and hosted Supabase are forbidden, so this run stopped after one supported route.

## 2. Preflight (this environment)

Run id `aacba1-20260923T020045Z`. Receipts in `docs/evidence/admin-account-counts-browser-acceptance-1/`.

| Check | Observed |
| --- | --- |
| Docker / Podman / nerdctl / local socket | Absent |
| `npx supabase --version` | **2.117.0** |
| `npx supabase start --help` | Verified: “Start containers for Supabase local development”; `--workdir`, `--network-id` present |
| Official docs | https://supabase.com/docs/guides/local-development ; TOTP https://supabase.com/docs/guides/auth/auth-mfa/totp ; changelog https://supabase.com/changelog |
| Node | v22.14.0 |
| Chrome | 148.0.7778.96 |
| Playwright isolated persistent Chrome | **PASS** (`about:blank`, ~341 ms) |
| Shared Chrome user-data-dir CLI screenshot | Hung; **not** used as the acceptance browser path |
| Parent hosted connector **names** | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` present. Values unused. Not a fallback. |
| `VERCEL` / `CI` / `GITHUB_ACTIONS` | Unset in this process |
| Self-hosted gateway / image versions | **NOT RUN** — no owned `supabase start` |

Selected route remains the official free local stack. No second provisioning loop.

## 3. Source / runtime pins actually used

Compared to the immutable task. No silent target change.

| Object | Pin | Observed |
| --- | --- | --- |
| Producer SHA256 | `dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420` | match |
| Wrapper SHA256 | `13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb` | match |
| Contract blob | `6826eeea70aecc0507d05624daaeac47af0be9b8` | match |
| Parser blob | `6205ecbba621b048fff479856c5523fab5ec4f6d` | match |
| Activation blob | `10f1bf99ac3d71eca6b1c69f04325947d0786c20` | match |
| Reader blob | `02dcafd80502067935eee78f3d8a7b21e417d720` | match |
| `lib/supabase/server.ts` | blob `1d394cfb6cc158ad0f979d7cd5bfe6526ece8f18` | read-only |
| `lib/auth/admin-guard.ts` | blob `b650a5e25a4db6572bbb7267e3735a746649497b` | read-only |
| `supabase/config.toml` | blob `4f029b9abdaef85951a8a4d948a6dd7044f899bf` | read-only |
| #550 bootstrap SHA256 | `0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2` | identified only to refuse overlay |

Accepted config facts used for the overlay contract (not inferred-only): `db.major_version = 17`; password length 12 + four classes; `enable_confirmations = true`; `enable_anonymous_sign_ins = false`; captcha off; TOTP enroll/verify on; phone/WebAuthn MFA off; `[local_smtp]` enabled. Test-only overlay, if a later stack run happens: unique `project_id`, loopback ports, Studio off, seed off. Those differences do not weaken Auth behavior under test.

## 4. Gate matrix

| Gate | Result |
| --- | --- |
| G0 preflight | **BLOCKED** (container-runtime) |
| G1 source pins | **PASS** |
| G2 owned stack | NOT RUN |
| G3 Auth schema ≠ #550 bootstrap | NOT RUN |
| G4 fixtures via GoTrue | NOT RUN |
| G5 app boot loopback | NOT RUN |
| G6 login UI password | NOT RUN |
| G7 AAL1 denied / step-up | NOT RUN |
| G8 TOTP enroll via UI | NOT RUN |
| G9 AAL2 Admin counts ON | NOT RUN |
| G10 existing factor, fresh session | NOT RUN |
| G11 default OFF, no section / no RPC | NOT RUN |
| G12 zero-window / recent delta | NOT RUN |
| G13 ordinary user / creator, no disclosure | NOT RUN |
| G14 unauthenticated, no disclosure | NOT RUN |
| G15 role downgrade, no disclosure | NOT RUN |
| G16 restricted privileged status | NOT RUN |
| G17 missing wrapper unavailable ≠ 0 | NOT RUN |
| G18 desktop / mobile scoped UI | NOT RUN |
| G19 same-session HTTP boundary | NOT RUN |
| G20 owned cleanup control | **PASS** (nothing started; dry-run refuses delete while a process would still be active) |

`applicationRan=false`. A cleanup dry-run is not application acceptance.

## 5. Fixture plan (not executed)

Synthetic `@aacba1.invalid` accounts only. Expected counts stay `pending-owned-stack`. This is **not** the isolated HTTP proof’s 10/0 assumption. Anonymous sign-in stays off; deleted/no-subject identities stay NOT RUN unless already present source-faithfully.

## 6. Findings

**P0 — environment.** No Docker-compatible runtime in this isolated agent VM. Blocks every Auth/app gate. Not a product defect.

**P1 — source-read rollout blocker (not empirically tested this run).** `lib/auth/admin-guard.ts` `loadRole` selects `role` only. `public.profiles.status` (`active|pending|disabled|banned`) is not part of that lookup. SQL producer authorization is `darf_konten_verwalten()` = minimum moderator **and** current AAL2; it is not a blanket profile-status guarantee. The harness plans a banned/disabled privileged account and will record actual behavior when a stack exists. Missing denial would be a **future rollout blocker**, not permission to change source here.

**P2 — browser tool limitation.** A shared Chrome user-data-dir CLI screenshot hung. Isolated Playwright persistent context works. The runbook requires the isolated path.

**P3 — parent connector names.** This process has hosted Supabase name keys. The harness classifies names only, never reads values, never uses them.

No product/Auth/SQL/config file was edited by this writer. No Ready. No merge to main. Incoming #555 artifacts arrived only through the authorized exact-main merge and stay read-only; they are **not** a substitute for the browser-acceptance path.

## 7. Tests run here

- `node --test scripts/e2e/admin-account-counts-browser-acceptance-1/test.mjs` — **10/10 PASS** (original freeze and again after the authorized main merge)
- `node scripts/e2e/admin-account-counts-browser-acceptance-1/run.mjs` — exit **2**, verdict `BLOCKED_ENVIRONMENT`, receipt `aacba1-20260923T020045Z` (not re-run after sync)
- Production app build — **NOT RUN** (no product files changed)
- Hosted CI/Auth/Preview of the sync freeze head — record after this content freeze; do not treat Vercel Preview or a green CI as local browser acceptance

## 8. Reproduction

See `scripts/e2e/admin-account-counts-browser-acceptance-1/README.md`. On a machine with an official Docker-API runtime, the same commands are the only supported continuation. Do not start another agent from this report.

## 9. Authorized exact-main synchronization (same session, 23 September 2026)

TL instruction: one normal merge of exact `87cdc1e6858ff0fb57481dd9c3d56fd618f1e03b` after #555 CLOSED/MERGED (TL PASS `5289076013`; post-merge CI `35842183345`; Production `dpl_4UDqvtGwJYtKdtRgVYnf1rUY1zeX` READY). Fetched `origin/main` equalled that SHA before merge. No later-head drift. No rebase/force/reset/cherry-pick.

| Pin | Role | SHA |
| --- | --- | --- |
| Historical product snapshot | original tested sources for this lane | `f0237baf8809e5528b5f73e918f0e37a7d9b4477` |
| Integration baseline | authorized #555 merge on main | `87cdc1e6858ff0fb57481dd9c3d56fd618f1e03b` |
| Previous freeze head | harness + BLOCKED evidence | `9ccf32c8509959236fdd9e035b0fe0cf6aa83749` |
| Merge commit | `merge: integrate authorized main 87cdc1e6 after #555 closure` | `edf99dad1bc7107625de0a6bada1f97a257509d5` |
| Existing environment receipt | unchanged; not re-executed | `aacba1-20260923T020045Z` |

Producer/wrapper/parser/contract/activation/reader and `lib/supabase/server.ts` / `lib/auth/admin-guard.ts` / `lib/auth/admin-aal.ts` / `lib/auth/admin-access.ts` / `supabase/config.toml` blobs are **identical** at HEAD, `87cdc1e6` and `f0237baf`. The immutable TASK blob is unchanged (`b049ddcda8b6f351a58ccb6b684e9bb7c2fa0fc7`). Incoming #555 files have **zero** post-merge diff versus `87cdc1e6`.

The missing local Docker/Auth stack is **unchanged**. Login → TOTP/AAL2 → Admin rendering remains **NOT RUN**. This sync and any later green CI/Preview do **not** promote that path.
