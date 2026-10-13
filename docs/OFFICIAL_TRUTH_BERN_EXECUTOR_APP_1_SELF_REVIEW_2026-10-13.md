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
