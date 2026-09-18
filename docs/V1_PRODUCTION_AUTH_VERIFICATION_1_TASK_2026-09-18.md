# Jetnity – V1 Production Auth Verification 1 Task

Stand: 18. September 2026
Status: **ACTIVE / PHASE A / READ-ONLY PRODUCTION EVIDENCE**

Issue: #479
Canonical base: `main@d67529a297a5de8c5a2e83b8d80caf4d34755384`
Branch: `verify/v1-production-auth-verification-1`

Cursor-Agent: **Jetnity V1 production auth verification 1**
Generation: **1**
Required parent model: **Cursor Grok 4.6 High Fast**

Do not use Auto. If unavailable, STOP/report.

## Purpose

Close the information gap behind audit findings:
- 3.3 Production Admin AAL2 truth contradiction;
- 3.6 Production redirect allow-list unknown;
- 3.7 Production auth rate-limit / HIBP unknown.

This is **verification only**. It must not change Production Auth, database state, users, secrets or runtime behavior.

## Technical-Lead live DB evidence already obtained

Production project: `qscbgcdmivbbnzrcyegn`.

Read-only evidence:
- project ACTIVE_HEALTHY;
- migration `20260827170000_admin_aal2_data_plane_alignment` is applied;
- `public.aktuelles_admin_aal2()` exists and evaluates the JWT `aal` claim for `aal2`;
- all current five `darf_*` helpers require `public.aktuelles_admin_aal2()`:
  - `darf_betrieb_eingreifen`
  - `darf_betrieb_lesen`
  - `darf_inhalte_moderieren`
  - `darf_konfiguration_verwalten`
  - `darf_konten_verwalten`

Therefore the stale statement in `docs/AUTH.md` that Production lacks `aktuelles_admin_aal2()` is already disproved by current live evidence. **Do not edit that doc in Phase A yet.**

## Existing primitives to reuse

Read fully before changing anything:
- `scripts/auth/ziel.ts`
- `scripts/auth/pruefen.ts`
- `lib/supabase/auth-bericht.ts`
- `lib/supabase/auth-erwartung.ts`
- `.github/workflows/ci.yml`
- `docs/AUTH.md`
- `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_STATUS_2026-08-27.md`

Important:
- `produktionsZiel(bestaetigterRef)` already proves fail-closed that the ref is an independent project.
- `authKonfiguration(ziel)` is GET-only.
- `authKonfigurationSetzen()` is write-capable and is **forbidden** in this slice.

## Phase A required implementation

Create the smallest auditable Production Auth snapshot reader.

Preferred shape:
- `scripts/auth/produktion-lesen.ts`
- optional pure helper/test under `lib/supabase/**`
- package script such as `auth:produktion:lesen`
- minimal `.github/workflows/ci.yml` change for exact-branch evidence on this PR only.

### Reader contract

Invocation must require:
`--produktion --projekt-ref qscbgcdmivbbnzrcyegn`

It must:
1. require `SUPABASE_ACCESS_TOKEN`;
2. require `SUPABASE_PROJECT_REF` to equal the confirmed ref;
3. call existing `produktionsZiel()` so a branch is rejected;
4. call existing GET-only `authKonfiguration()`;
5. emit **only an explicit safe allowlist** of audit values;
6. never emit the raw config response or unknown key values.

Safe audit fields for Phase A:
- `site_url`
- `uri_allow_list`
- `password_hibp_enabled`
- `rate_limit_email_sent`
- `rate_limit_otp`
- `rate_limit_verify`
- `rate_limit_token_refresh`
- `mfa_totp_enroll_enabled`
- `mfa_totp_verify_enabled`
- `mfa_allow_low_aal`
- `mailer_allow_unverified_email_sign_ins`

Additional fields require an explicit code comment proving relevance to 3.3/3.6/3.7 and that they are non-secret.

The reader may fail if one of the required audit fields is absent, because incomplete evidence is not PASS.

### Forbidden output / access

Never print or return:
- `SUPABASE_ACCESS_TOKEN`;
- `jwt_secret`;
- SMTP host/password/user/secret values;
- captcha secret;
- OAuth client ids/secrets;
- API keys;
- raw unknown auth values;
- full JSON config.

Do not call:
- `authKonfigurationSetzen()`;
- `projektSchluessel()`;
- Supabase Admin Auth;
- account creation/removal;
- password reset/registration flow;
- any DB mutation.

### CI evidence path

Use the existing same-repo PR CI, not a new external service.

In `.github/workflows/ci.yml`, add the narrowest Phase-A step to the existing auth job:
- only on `pull_request`;
- only when `github.head_ref == 'verify/v1-production-auth-verification-1'`;
- reuse existing `SUPABASE_ACCESS_TOKEN` repository secret;
- override `SUPABASE_PROJECT_REF` **at step scope only** to `qscbgcdmivbbnzrcyegn`;
- invoke the GET-only reader with explicit `--produktion --projekt-ref qscbgcdmivbbnzrcyegn`;
- no mutation command before or after.

Do not alter the normal Development auth check.

The purpose of the temporary exact-branch condition is to produce one controlled audit log. It is **not** the final permanent workflow shape. Phase B will clean it after TL reviews the evidence.

## Tests

Add focused tests proving:
- safe output allowlist only;
- no raw/full config serialization;
- known secret-like keys are excluded even when present in fixture input;
- required safe fields missing => fail closed;
- Production target confirmation is mandatory;
- no source reference to `authKonfigurationSetzen`, `projektSchluessel`, PATCH/POST/PUT/DELETE in the new reader;
- temporary CI step is exact-branch-only and does not replace/skip the normal Development auth check.

## Allowed Phase-A write scope

- `scripts/auth/produktion-lesen.ts`
- optional focused helper/test under `lib/supabase/**`
- `package.json`
- `.github/workflows/ci.yml`
- task/status/handoff/self-review docs for this slice

Do **not** edit in Phase A:
- `docs/AUTH.md`
- `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_STATUS_2026-08-27.md`
- audit matrix/handoff
- global continuity files
- Supabase migrations/config
- runtime Auth/UI code.

If another file is needed, STOP/report before widening scope.

## Validation

Before Phase-A handoff:
- focused tests;
- full tests;
- typecheck;
- lint;
- Production build;
- repo checks;
- exact-head CI;
- **capture exact Production Auth reader output from the CI job log**;
- exact-head Vercel Preview;
- merge-base/ahead/behind;
- GitHub/Vercel thread state.

Persist:
- `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_STATUS_2026-09-18.md`
- `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_HANDOFF_2026-09-18.md`
- `docs/V1_PRODUCTION_AUTH_VERIFICATION_1_SELF_REVIEW_2026-09-18.md`

Do not copy secrets or raw config into docs.

## Stop condition

After Phase-A evidence is available:

**STOP FOR TECHNICAL-LEAD REVIEW**

Do not edit Production-truth docs yet.
Do not mark Ready.
Do not merge.
Do not start Phase B or a follow-up slice.
