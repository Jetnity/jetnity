# Isolated Production runtime provisioner

Prepared only. This directory has not connected to or changed Production.
No live or local tests have been executed by its author. Root must review before
the one explicit provisioning build; previously accepted core/Dev tests are not repeated.

Files under `ops/official-truth-production-runtime-provision-20261115/` are intended
only for the existing isolated `ops/official-truth-production-install-20261115`
branch. `root-vercel.json` is that branch's harmless default configuration, not a
global Vercel project setting. It defaults to `--prepare` and never connects to DB.

## Inputs

Both inputs must be Sensitive/Secret variables scoped only to that exact preview
branch. Do not add them to general Preview or Production and never log their values.

- `JETNITY_PROD_INSTALL_POSTGRES_PASSWORD`: user's existing creator password.
- `JETNITY_PROD_INSTALL_RUNTIME_BUNDLE`: JSON object with exactly
  `{schema:1,target:"qscbgcdmivbbnzrcyegn",credentials:{...},hmac:"..."}`.
  `credentials` contains the six exact `JETNITY_V3_PG_*_PASSWORD` names in the
  original Production manifest. Each password and `hmac` must be an independently
  generated 32-byte base64url value (43 characters); all seven must differ.
  The runner accepts 43–128-character base64url secrets.

The six same credential values must first be stored in their six Production-only
Vercel Secrets; `hmac` in Production-only `JETNITY_PROD_IMPORT_CRON_SECRET`.
No secret transfer, generation or Vercel mutation is performed by this runner.
The root agent supplies them programmatically without displaying plaintext.

## One explicit invocation

Only `node ops/official-truth-production-runtime-provision-20261115/runner.mjs --provision`
admits the secrets and connects. Dependency installation uses `pg@8.23.1` and a
minimal lockfile extracted unchanged from the approved repository lock. `npm ci`
runs with `--ignore-scripts`, a sanitized environment, explicit public registry,
no user/global npm config and no audit request. No credentials enter child processes.

The fixed host, pinned CA, verified TLS/SCRAM, `postgres` identity, PG17 and exact
project/repository/preview branch are mandatory. There is no URL, host, role or
secret-name override, no new role and no Owner/source/automation operation.

The original `configure-credentials.sql` is unchanged and hash checked. Parameters
transport the transaction-local GUC values separately from SQL text. One transaction
executes all six existing-role changes and creates the sole named Vault HMAC secret.
The absent Vault name plus empty job/projection/scheduler state is the one-use
precondition; at most one method is allowed and its complete HMA chain is checked,
so real Owner recovery can precede credential setup. Fresh BG1 remains mandatory.
The committed Vault name is the receipt. No `pg_authid` or `rolpassword`
is queried and password absence is not falsely inferred from `pg_roles`.

Error confinement adds a non-secret outer DO with generic replacement errors,
including cancellation and assertion errors. Inner failure rolls back the original
credential DO and Vault call. The runner requires `pg_stat_statements.track=top`,
no pgAudit, no duration/sample logging, no error bind parameters, and no normal
SELECT logging before loading values into SQL. It does not change logging settings.
The outer statement has no secrets and replaces dynamic ALTER ROLE error context.
These prerequisites must be reviewed: provider logs have not been probed with a
synthetic failure here. Any unsupported logging configuration is refused.

After COMMIT, six sequential real native connections each verify TLS, session login,
bounded SET role and exact role flags/connection limit. No source call or approval is
implied by success. On any failure or unknown outcome there is no automatic retry;
read the named Vault receipt, catalog and actual state independently first.

After successful provisioning, remove both branch-only temporary Secrets, freeze
the Ops configuration back to `--prepare`, and deploy the original reviewed `main`
with the new Production-only runtime environment through the normal release path.

## Remaining live path

1. `/admin/official-truth/method`: real Owner/AAL2, `Entwurf hinterlegen`,
   `Gespeicherten Vorgang bestätigen`, `Methode freigeben`, confirm original again.
2. `/admin/official-truth/import`: `Quellenimport für Production starten`; continue
   its retained request until actual publication, then inspect guest `/einreise`.
3. Execute unchanged scheduler `activate.sql` with its fixed target and observe
   real signed automatic publication, next due time and subsequent regular BG1.
4. Arm the existing monitor repository variables after acceptance; one alarm
   delivery probe and normal recovery check, without another Dev/CI proof cycle.

No Admin files, main, cloud settings, secrets or live data were changed by authoring.
