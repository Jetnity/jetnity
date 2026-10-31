# B-EXECUTOR-APP-1 — author self-review

This is author evidence, NOT independent TL acceptance.
Writer: Jetnity Official Truth Bern Executor App 1 — Codex Generation 1.

The implementation stays inside the four TASK-owned path families. Protected
source, legacy authorization, reader and CLI are byte-identical; package, lock,
workflow, routes, operating mode and policies are unchanged. The old User-only
contract is not broadened. Actual App/installation configuration is absent.

Adversarial checks cover wrong App/client/slug/owner/installation/repository,
all-repo or extra-repo scope, suspension, wider permissions, supplied bearer
strings, wrong signing key, malformed/scoped/expired tokens, modified Owner grant,
missing unused authority, old935-only main, wrong author/tree/merge/review,
unknown/edited/duplicate/foreign/stale witnesses, omitted vs explicit bypass,
changed main/tag policy and version, missing/extra/paginated inventories, every
HTTP300–399, request allowlist, UTF8/JSON/full-framing limits, deadline cancellation,
secret-bearing errors and import/CLI hard gates. RSA signatures are checked with
the corresponding synthetic public key, not merely decoded claims. Mock success
is labelled SYNTHETIC_PREFLIGHT_PASS and explicitly denies live authentication,
capability and attempt consumption.

Self-review corrections before publication: rejected duplicate/escaped JSON keys;
rejected unknown rule fields; rechecked witness expiry after policy reads;
restricted error output to a closed code list. The first full local run found an
extra caller introduced by my redundant direct-source test. That new caller was
removed, preserving the existing protected caller-inventory assertion. Two other
failures were caused by omitting .git from the disposable test checkout; the
validation invocation was corrected to retain Git metadata. No shared assertion,
timeout or implementation was weakened. Failed logs remain private evidence and
are not represented as PASS. Fresh final gates are in the publication receipt.

Material limitations to review:

- The existing OS Keychain can enforce the tested non-extractable RSA/ACL
  primitive, but a persistent owner-local staging/backup/browser transfer and
  production signer are still unverified. The manual probe uses deprecated
  macOS Keychain APIs; long-term signer choice/packaging requires TL acceptance.
- No real key reader or live exchange is enabled. Production activation is a
  deliberate separate code/custody gate, not a hidden environment flag.
- Scoped installation-token repository inventory cannot establish the App's
  complete installed repository selection. That and private/OAuth/webhook settings
  require the exact authenticated administrator configuration-readback receipt.
- Authenticated Owner/TL receipts retain a trusted-administrator assumption.
  The shared GitHub Owner account does not prove independent human/logical roles.
  A witness is not immutable governance or evidence of historical non-use.
- Inventories are bounded and conservative.>=100 records or any pagination/duplicate
  record blocks. No automatic latest-receipt, supersession or main-drift policy is
  invented. The exact merge contract must be re-reviewed if main advances.
- Request/response checks are exercised through offline wire mocks, not a live
  TLS exchange. Live App authentication, GitHub schema compatibility and actual
  effective App permissions are unproved. JavaScript/OS memory and SSD erasure
  cannot be guaranteed.

No remaining finding is represented as a security PASS. Existing P2 nativePG16
timing variance, G7 dependency advisories and #913 privacy block remain. No new
recurring cost. TL must independently inspect all changed files, original CI/
Preview evidence and custody limitations before deciding. No Ready/merge/follow-up.

## R1 correction self-review

The independent R1 review5505320406 correctly identified two gaps missed by the
original short-token/frozen-clock fixtures. Same writer/session correction only:
opaque bounded header-safe exchange credentials and exchange-relative expiry.
Original TASK, baseline history and all protected blobs remain unchanged.

Checked both boundaries share one predicate and the synthetic case selector cannot
inject a bearer; the mock still authenticates the App assertion before replacing
its exact noncredential sentinel. Long-token contents carry no authority. Checked
normal delayed one-hour expiry, receipt-relative minimum, one-second skew ceiling,
remaining reserve on both sides of a read, request/overall deadline on response,
clock anomalies, redaction, scope/identity and all existing live hard gates.

The deterministic clock is confined to the already synthetic-only harness. Live
transport remains an unconditional refusal. The1000ms issuer-clock/serialization
budget and4096-byte resource bound are explicit policies for independent review,
not claims of observed live GitHub compatibility. No actual credential exchange
or TLS handshake occurred. Unchanged custody evidence was not rerun or promoted
to operational acceptance. Final new-HEAD full checks are in the R1 publication
receipt; author testing is not independent TL acceptance.

## CUSTODY-2 self-review (not independent TL acceptance)

- R2 accepted both token findings; authentication/evidence/transport are unchanged.
- Default native build refuses before lookup; only explicit manual synthetic
  build receives fresh internal public pin + disposable path. No real issuer,
  raw private key input, arbitrary signing message, supplied clock or lifetime.
- Actual independent signature verification and native ACL/export/locked-key/
  wrong-key/missing-key/invalid-input/failed-import cleanup evidence pass.
  Different binary re-signed with the same identifier remains denied.
- O_NOFOLLOW, restrictive ownership/modes, hardlink rejection, bounded read and
  matching snapshot import prevent the tested path/content substitutions.
  Same-user/host-admin takeover is not claimed solved.
- All diagnostic/public evidence values are controlled fields; no JWT/private
  bytes, actual private paths or unrelated keychain metadata. Clear env/fixed
  absolute programs, no shell, no network or Owner-token fallback.
- Backup Included is a blocker for genuine staging. Exact proposal6150498189
  is NOT applied; unrelated settings/files are untouched. Browser and arbitrary
  third-party sync remain unproved. No hardware/SSD erasure claim.
- Native first compile/package failures and cleanup are retained privately;
  historical R1 CI failure remains explicit. All new-HEAD gates must be fresh.
- No external API/product/DB/cost surface. A01/A02/A09/A10 remain OPEN.
- Remaining native API deprecation, clock, same-user/admin/memory/snapshot and
  final production binary/ACL/attended-provisioning risks belong to TL review.
- Fresh gates exposed a schema-scanner collision in a fake file marker, fixed
  only in the owned fixture string. First container full run's inherited PG
  image-variable refusals and initial tsx IPC failure are retained; rerun uses
  clean PG environment without changing guards, workflows or timeout budgets.
