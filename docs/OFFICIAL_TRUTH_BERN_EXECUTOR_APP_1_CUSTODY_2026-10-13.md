# B-EXECUTOR-APP-1 — runtime and custody evidence

Author: Jetnity Official Truth Bern Executor App 1 — Codex Generation 1.
TASK blob f4ec0d556ecf4b166903a2600edd244b262448d0. This report incorporates
[TL SEQUENCE-1](https://github.com/Jetnity/jetnity/issues/936#issuecomment-6146679373).
Status: **SYNTHETIC RUNTIME/KEYCHAIN PRIMITIVE PROVED; OPERATIONAL CUSTODY NOT ACCEPTED.**

## Actually inspected and exercised

Existing local Node22.23.3/npm10.9.9 and Docker29.8.2 are available. Existing
`jetnity-r2-validation:local` image ID
`sha256:a184368370116fb675edc535efbfa9be2e913d5a605e046a5e41819c1dd6beaf`
contains native PostgreSQL16.15 and Node22.23.3; its user is postgres/UID999.
Dependency lock SHA256 is
`8dead8237adef171588abd088e25f9be2472a7458121e4198cacd8ece224a7da`.
A disposable probe ran with network NONE, read-only root, no capabilities,
no-new-privileges and temporary memory-backed scratch. No source mount and no
Docker socket were present in the capability probe. Full tests add a read-only
source mount, a disposable copy and a separate test-log output mount; no secret
mount. This is a validation environment, NOT persistent credential custody.

The existing macOS Security framework, `security`, Swift6.4 compiler and local
code-signing utility were tested with an entirely new, unregistered synthetic
RSA2048 key. No existing keychain items were queried. Keychain search-list
metadata was compared without publishing it or reading keys. The reproducible
manual probe is `scripts/official-truth-bern-executor-app-1/custody-probe.mjs`
with `custody-probe.swift`; it is never invoked by CI, build or module import.

Observed in the actual host service:

- New temporary directory mode0700; PEM mode0600; real path matched; neither was
  a symlink; the file had one hard link. Only synthetic bytes entered that file.
- Import with `security import -x -T <dedicated signed probe>` made the private
  key non-extractable through the tested Security API.
- The explicitly authorized, ad-hoc signed probe could sign the fixed synthetic
  message. Private export failed with code -25316.
- A separately signed executable with a different signing identifier could NOT
  sign (code -25293) and could NOT export (-25316). User interaction was disabled,
  so no access-confirmation prompt was approved silently.
- Keychain search list was unchanged during the probe. Synthetic PEM was removed
  immediately after import; the temporary keychain, executable copies and compile
  cache were deleted in cleanup. Only booleans/status codes are retained.

The initial sandboxed KeychainCreate attempt failed; the same bounded synthetic
probe succeeded through the permitted local OS execution boundary. This is not
evidence that a cloud worker or ordinary sandbox has keychain access. No real App
private key, client secret, installation token, PAT or unrelated personal file
was read, generated, imported or exported.

## Concrete proposed custody boundary — still gated

Logical roles/locations (not private host paths):

| Component | Required control | Verified here |
| --- | --- | --- |
| OWNER_LOCAL_BROWSER | Owner-controlled native browser, attended GitHub settings/2FA, local download destination chosen BEFORE generation; never Work/cloud browser, clipboard or chat | NOT PROVED; no key-generation UI used |
| OWNER_IMPORT_STAGING | Dedicated non-synced, non-repo, non-cache, non-artifact local directory;0700 parent/0600 regular file, no symlink/hardlink/path substitution; backup exclusion and browser partial-download/caching handling | Temporary synthetic modes/path/link checks only; persistent path/backup/browser behavior OPEN |
| LOCAL_APP_KEYCHAIN | Dedicated local keychain, non-synchronizing RSA import marked non-extractable; restrictive filesystem controls; attended unlock; only reviewed signer in ACL | OS primitives proved synthetically; no persistent App keychain created |
| LOCAL_REVIEWED_SIGNER | Stable reviewed/signature-pinned executable; no arbitrary signing interface, fixed App JWT claims, five-minute JWT, no raw key export; invoked by dedicated minimal short-lived process | ACL discrimination/signing/export denial proved; production signer packaging/identity and fixed-claim adapter OPEN |
| GITHUB_PREFLIGHT_PROCESS | Clean environment, no gh/PAT/GITHUB_TOKEN fallback, no inherited proxy/CA override, no source mounts/caches containing secrets; only fixed GitHub endpoints; no source/ref writer | Dormant code and offline negative tests; live credential path hard-disabled |

No plain file is claimed to be a non-exportable vault. The brief pre-import PEM
necessarily remains exportable. After import, the tested keychain flag prevents
the tested API export; it is software custody, not a hardware RSA enclave or a
proof against host administrators. Same-user malware, privileged host control,
signer replacement, an unlocked vault, process-memory inspection and owner
approval of an unexpected ACL prompt remain risks requiring TL treatment.

The probe's temporary directory is NOT an operational download recommendation:
the read-only Time Machine check reported that the system temporary location was
included, not excluded. No browser profile, sync configuration, backup policy,
system account or persistent security setting was changed. No persistent
owner-local staging location with proven no-sync/no-backup properties has been
established. This is the precise remaining transfer/custody capability gap; the
existence of Keychain/Docker alone does not close it.

## Later import, lifecycle and stop

After independent TL acceptance, the responsible owner-local operator would
first establish and verify OWNER_IMPORT_STAGING and LOCAL_APP_KEYCHAIN, the exact
reviewed signer identity, unattended-access denial and backup policy with another
synthetic rehearsal. Only a TL-sequenced attended local browser step may then
download the real PEM into that staging boundary and import it without stdout,
clipboard, shell-history or environment-value transfer. Remove the staged PEM
and browser partial files immediately after verified import. Secure physical
erasure on SSD/APFS snapshots is not promised; avoiding backup/sync is essential.

Diagnostics must be fixed booleans/error codes only, with no key, token, JWT,
request headers, response/error body or local-machine identifiers. Key material
must not enter the repository, CI, Vercel, test fixtures, caches or chat tools.
Private JS/OpenSSL memory cannot be guaranteed erased; a short-lived process
limits lifetime. The later real implementation must not log credentials even on
failure. Failed/ambiguous token exchange is never retried automatically.

Revocation remains an attended GitHub owner operation: revoke/remove the App key,
suspend/uninstall the installation if required, terminate the runtime, remove the
dedicated keychain/staging material and check backups according to the accepted
policy. No remote revoke endpoint or broad admin credential is given to this
runner. No backup of the PEM is proposed; loss requires owner-controlled rotation
after a new gate. Already-issued tokens need explicit handling/expiry (at most one
hour), not a claim that deleting a local file revokes them.

**STOP before real provisioning.** TL must accept the code, the witnessed OS
primitive and the remaining exact staging/signer/access/backup plan. A01 actual
installation and A10 real provisioning/authenticated preflight are OPEN. The
Owner's existing scope approval is not requested again. No paid infrastructure.
LIVE B HARD-BLOCKED.
