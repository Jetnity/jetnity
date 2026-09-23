# Admin account counts browser acceptance 1 — harness / runbook

Independent local application proof for accepted `main@f0237baf8809e5528b5f73e918f0e37a7d9b4477`.
This is not Production activation, hosted parity, Guardian evidence, or a second product writer.

## Selected supported free route

Official Supabase local development only:

1. A container manager compatible with Docker APIs (Docker Desktop, Rancher Desktop, Podman, or OrbStack).
2. Official CLI: `npx supabase --version` then `npx supabase start --help`.
3. Real browser via Playwright `chromium.launchPersistentContext` and the system Chrome channel.

References actually used:

- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/changelog
- installed `npx supabase --help` / `npx supabase start --help` (CLI 2.117.0 in this agent environment)

Do not invent historical Compose or Kong defaults. Exact self-hosted gateway/image versions are recorded only after an owned `supabase start` succeeds.

## Forbidden substitutes

- Hosted Production `qscbgcdmivbbnzrcyegn` or hosted Development
- Parent process `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` connector values
- Privileged Docker daemon setup, remote Docker context, or disabling host security
- Overlaying `scripts/db/admin-account-counts-1-bootstrap.sql` on real GoTrue `auth.users`
- Forged JWT/AAL2, injected session cookies, mocked Auth/UI responses labelled as browser acceptance
- Repeating the isolated #554 signed-token HTTP proof and calling it E2E
- Importing unmerged #555 files
- `pkill`, Docker prune of unrelated resources, or public binds (`0.0.0.0`)

## Reproduce on a machine that has the official stack

From the repository root, on this branch, after confirming Docker and Chrome:

```bash
# 1. Pins and unit checks (no stack required)
node --test scripts/e2e/admin-account-counts-browser-acceptance-1/test.mjs

# 2. Preflight + orchestrator. Exit 2 means BLOCKED / not a full-stack PASS.
node scripts/e2e/admin-account-counts-browser-acceptance-1/run.mjs
```

When G0 is PASS, the same orchestrator is the only supported start path. It will:

1. Rebuild a child environment with synthetic loopback URL/key and `JETNITY_ADMIN_ACCOUNT_COUNTS_LOCAL_ENABLED=true`.
2. Create a run-owned workdir overlay. Disclosed test-only differences: unique `project_id`, loopback ports, Studio off, seed off. Password, confirmation, anonymous-sign-in, captcha and TOTP settings stay as in accepted `supabase/config.toml`.
3. `npx supabase start --workdir <owned> --network-id <owned-loopback-network> --yes` and exclude unused services listed in `stack.mjs`.
4. Apply **only** the unchanged producer and wrapper SQL. Never the #550 bootstrap.
5. Provision synthetic `@aacba1.invalid` users through the local Auth Admin API; add `public.profiles` roles/status in the owned database.
6. Start the accepted Next.js application on loopback with the clean child environment.
7. Drive `/admin/login` → password → `/admin/mfa` AAL1 denial/step-up → `/account/security` TOTP enroll (secret in memory only) → AAL2 `/admin` counts.
8. Repeat with a fresh browser context against the existing factor. No forced duplicate enrollment.
9. Observe `/rest/v1/rpc/admin_account_counts_v1` read-only. OFF must make no such call. Unknown/failure must not render `0`.
10. Exercise ordinary/creator, unauthenticated, role downgrade, banned/disabled privileged profiles, and missing-wrapper unavailable copy.
11. Capture desktop (1280×800) and mobile (390×844) screenshots of the non-secret counts section only.
12. Stop owned children first, then remove owned directories. Prove no delete while a process is active.

Per-run passwords, TOTP secrets, JWTs, cookies, QR/otpauth strings stay in a `0700` private directory outside Git and are deleted after confirmed stop.

## This agent environment (23 September 2026)

Preflight result: **BLOCKED**.

| Prerequisite | Observed |
| --- | --- |
| Docker / Podman / nerdctl / Docker socket | Absent. `command -v docker` → not found. No `/var/run/docker.sock`. |
| Privileged daemon install | Forbidden by the task. Not attempted. |
| `npx supabase` | 2.117.0. `start --help` verified: starts **containers**. |
| Node | v22.14.0 |
| Chrome | 148.0.7778.96 |
| Playwright isolated Chrome | PASS (`about:blank`, 341 ms) |
| Hosted connector names in parent env | Present by name. Values unused. Not a fallback. |

Application gates G2–G19 are **NOT RUN**. That is the honest result, not a product PASS or FAIL.

## Expected counts

Identified from the owned Auth inventory after fixtures, not assumed `10` / `0`. Anonymous sign-in remains disabled; deleted/no-subject identities stay NOT RUN unless already present source-faithfully.
