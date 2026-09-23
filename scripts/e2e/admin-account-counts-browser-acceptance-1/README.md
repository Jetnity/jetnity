# Admin account counts browser acceptance 1 — harness / runbook

Independent local application **plan** for accepted `main@f0237baf8809e5528b5f73e918f0e37a7d9b4477`, reconciled to integration baseline `87cdc1e6858ff0fb57481dd9c3d56fd618f1e03b`.
This is not Production activation, hosted parity, Guardian evidence, a second product writer, or a ready-to-run full browser harness.

## What this command actually does

`node scripts/e2e/admin-account-counts-browser-acceptance-1/run.mjs` implements only:

1. Isolated capability preflight (usable local daemon, **pinned** `supabase` binary, isolated browser close-always).
2. Working-tree source identity for the full applicable Auth/shared/client/UI/config/SQL set.
3. Allowlisted child environments with a private HOME. No inherited connector/provider credentials. No security-sensitive passthrough.
4. Confirmed owned-process / browser shutdown before any directory removal.

It does **not** start containers, apply SQL, provision GoTrue, boot the app, or drive login → TOTP/AAL2 → Admin rendering. Docker installation alone cannot make this command execute that path. Those steps are **NOT IMPLEMENTED**. A later authorized writer must implement them; this runbook is the continuation plan, not a hidden execution path.

Missing Docker is an **execution blocker**, not a Production P0 incident.

## Selected supported free route (later implementation)

Official Supabase local development only:

1. A **usable** Docker-API daemon (`docker info` or equivalent), not a version-only binary.
2. A **pinned** local `supabase` binary. Unpinned `npx --yes supabase` / remote latest install is forbidden.
3. Real browser via Playwright `chromium.launchPersistentContext`, explicit child `env`, and `close()` on every path before profile removal.

References:

- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/changelog

Do not invent historical Compose or Kong defaults. Exact self-hosted gateway/image versions are recorded only after an owned `supabase start` is implemented and succeeds.

## Forbidden substitutes

- Hosted Production `qscbgcdmivbbnzrcyegn` or hosted Development
- Parent process `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` connector values
- Privileged Docker daemon setup, remote Docker context, or disabling host security
- Overlaying `scripts/db/admin-account-counts-1-bootstrap.sql` on real GoTrue `auth.users`
- Forged JWT/AAL2, injected session cookies, mocked Auth/UI responses labelled as browser acceptance
- Repeating the isolated #554 signed-token HTTP proof and calling it E2E
- Importing unmerged sibling files or treating #555 rehearsal as the browser path
- `pkill`, Docker prune of unrelated resources, or public binds (`0.0.0.0`)
- Treating Playwright page requests as proof of server-side RPC absence

## Reproduce the implemented checks

From the repository root, on this branch:

```bash
# Helper / lifecycle / source / environment checks (no stack required)
node --test scripts/e2e/admin-account-counts-browser-acceptance-1/test.mjs

# Implemented preflight + source identity + cleanup dry-run.
# Exit 2 means BLOCKED / NOT IMPLEMENTED — never a local full-stack PASS from this command.
node scripts/e2e/admin-account-counts-browser-acceptance-1/run.mjs
```

Historical environment receipt `aacba1-20260923T020045Z` stays dated and is never overwritten.

## Continuation plan (NOT IMPLEMENTED)

When a later authorized writer implements stack/provision/browser execution, the intended path is:

1. Rebuild a child environment with synthetic loopback URL/key and `JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED=true`. Validate the final effective URL/keys after composition.
2. Create a run-owned workdir overlay. Disclosed test-only differences: unique `project_id`, loopback ports, Studio off, seed off. Password, confirmation, anonymous-sign-in, captcha and TOTP settings stay as in accepted `supabase/config.toml`.
3. Start the official CLI against that workdir on a verified local daemon. Do not equate CLI child exit with Docker service teardown.
4. Apply **only** the unchanged producer and wrapper SQL. Never the #550 bootstrap. Migration replay is inventoried and remains unimplemented here.
5. Provision synthetic `@aacba1.invalid` users through the local Auth Admin API; add `public.profiles` roles/status in the owned database.
6. Start the accepted Next.js application on loopback with the clean child environment.
7. Drive `/admin/login` → password → `/admin/mfa` AAL1 denial/step-up → `/account/security` TOTP enroll (secret in memory only) → AAL2 `/admin` counts.
8. Repeat with a fresh browser context against the existing factor. No forced duplicate enrollment.
9. Observe the **server/HTTP** boundary with a positive-control call. Page request events cannot prove server-side OFF/no-RPC. Unknown/failure must not render `0`.
10. Exercise ordinary/creator, unauthenticated, role downgrade, banned/disabled privileged profiles, and missing-wrapper unavailable copy.
11. Capture desktop (1280×800) and mobile (390×844) screenshots of the non-secret counts section only.
12. Stop owned children with bounded TERM/KILL and confirmed exit, close the owned browser, then remove owned directories. Refuse removal when still active or unknown.

Per-run passwords, TOTP secrets, JWTs, cookies, QR/otpauth strings stay in a `0700` private directory outside Git and are deleted after confirmed stop.

## This agent environment (23 September 2026)

Original preflight result: **BLOCKED_ENVIRONMENT** (`aacba1-20260923T020045Z`). That receipt is preserved.

Review-fix H1–H4 keeps the same environmental blocker and labels G2–G19 **NOT IMPLEMENTED**.

| Prerequisite | Observed |
| --- | --- |
| Docker / Podman / nerdctl / Docker socket | Absent. Execution blocker, not a Production P0 incident. |
| Privileged daemon install | Forbidden. Not attempted. |
| Pinned `supabase` binary | Absent. Unpinned `npx --yes` is no longer used. |
| Isolated Playwright + Chrome | Available for `about:blank` preflight only. Not login/MFA. |
| Hosted connector names in parent env | Present by name. Values unused. Child env rebuilt. |

Application gates G2–G19 remain **NOT IMPLEMENTED**. Login → TOTP/AAL2 → Admin render is **NOT RUN**. That is the honest result, not a product PASS or FAIL.

## Expected counts

Identified from the owned Auth inventory after fixtures, not assumed `10` / `0`. Anonymous sign-in remains disabled; deleted/no-subject identities stay NOT RUN unless already present source-faithfully.
