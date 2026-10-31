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

## CUSTODY-2 actual continuation — 13 October 2026

This section supersedes the earlier "no persistent candidate / signer missing"
observations for the concrete work below; earlier primitive evidence remains
historical. R2 review5506773206 accepted R1-F1/F2 at95d5552a and resolved their
threads. Scope: [CUSTODY-2](https://github.com/Jetnity/jetnity/issues/936#issuecomment-6150274275),
same actual writer/session/PR937. No accepted production custody receipt exists.

### Actual owner-local candidate

One NEW task leaf, owner-relative
`Library/Application Support/Jetnity/bern-executor-app-1-custody-2`, now exists.
The Jetnity parent was absent and was created only for this leaf. No actual
private absolute path or username is published. Canonical ancestor metadata
was inspected up to root: expected owner/root, directories, no symlink,
no group/world write and no allow ACL. New parent and leaf are0700; neither
adopts pre-existing/shared data. The rehearsal leaves the leaf empty.

This is outside the repository, known iCloud/CloudStorage roots, build/cache
and public artifacts by canonical placement. That is NOT proof that arbitrary
third-party agents cannot synchronize/back it up. Time Machine explicitly
reports **Included**. No backup policy, general system setting, browser profile,
TCC/privacy permission, account, firewall or unrelated keychain item was changed.

**Required exact TL arbitration, proposed but NOT applied:** [6150498189](https://github.com/Jetnity/jetnity/issues/936#issuecomment-6150498189).
After repeating canonical/owner/0700/ACL/empty checks on that exact leaf resolved
from the OS account home (never an env/caller override), the proposed one-item
operation is `/usr/bin/tmutil addexclusion <exact leaf>`, default sticky form;
then `/usr/bin/tmutil isexcluded <same leaf>` must report Excluded. No -p/-v,
sudo, global change or new Full Disk Access. Rollback after verified emptiness:
`tmutil removeexclusion <same leaf>`, require Included, rmdir the leaf, then
rmdir only its newly created parent if still empty. No recursive cleanup of
unrelated data. A sticky exclusion follows a moved/copied item: movement/copying
is prohibited for this custody boundary. It covers neither third-party backup
nor historical snapshots, browser partial files/caches or physical SSD erasure.
The manual script deliberately has NO backup-mutation command.

### Implemented bounded signer / package contract

`custody-signer.swift` is a separate, short-lived macOS Security executable.
Its default build refuses before any key lookup. Only the explicit manual
rehearsal compiles CUSTODY_SYNTHETIC_REHEARSAL plus a generated configuration
containing its fresh RSA2048 PUBLIC pin and exact disposable keychain path.
There is no private-key, App ID, keychain path, clock, arbitrary message/claims
or lifetime input. Invocation is exactly `--synthetic-sign`, empty stdin.
Production invocation and real configuration remain absent/disabled. Work's
UI-only5300986/client ID and absent installation ID are never accepted pins.

The signing identifier is
`org.jetnity.bern-executor-app-1.signer.synthetic.v1`. Packaging uses the existing
Swift compiler with a private module cache and ad-hoc codesign with hardened
runtime, no entitlements. The parent records/verifies exact binary SHA256,
CDHash, identifier and strict codesign validity before import/sign. The signer
independently checks its executable identity/validity. An identifier string
alone is NOT trusted publisher identity: the imported key's ACL authorizes
only the exact signed executable. The native negative test also re-signs a
different binary with the SAME identifier and observes access denial.
Each run has a different generated public pin/path and thus binary/CDHash;
the stable source/identifier/recipe does not assert a stable production CDHash
or Developer-ID identity. Any later production package requires exact TL review
and new ACL/pin verification; no rebuild silently inherits acceptance.

The exact dedicated keychain is queried, never a global key lookup. Exactly
one private key and its freshly generated pinned public key are required.
The staged file is0600, regular, current-owner, one link, canonical, nonempty
and <=8192 bytes. Open uses O_NOFOLLOW; inode/device/mode/link/size/change
checks bracket a bounded8193-byte maximum read and verify the internally
generated synthetic digest. Import consumes that checked snapshot through
stdin with fixed `security import -x -T <verified signer>`, rather than
reopening a mutable PEM path. No private material in argv/env. The short-lived
PEM is removed immediately even when import fails. The temporary keychain
requests lock-on-sleep plus30s auto-lock; explicit locked-vault denial is tested.

Claims are generated inside the executable: RS256/typ JWT, issuer exactly
SYNTHETIC-UNREGISTERED-BERN-APP, iat=host-now−60s, exp=host-now+300s.
No registered identity or usable GitHub token is created. Clock source is OS
Date epoch time, sampled inside the process, with a monotonic uptime deadline
and a5s process alarm; caller time cannot override it. Host UTC accuracy,
administrator clock control and future GitHub skew compatibility remain
external assumptions, not an NTP/clock-synchronization attestation.
All children use fixed absolute tools/argument arrays, a clean minimal
environment and bounded execution/output; no shell/PATH/Owner-token fallback.
User interaction is disabled for signing and negative-access probes.

### Actual coherent rehearsal and evidence

Manual entry: `node scripts/official-truth-bern-executor-app-1/custody-2.mjs --synthetic-rehearsal`.
It is not run by import, build, CI or Preview. Portable CI tests exercise closed
non-secret staged-file adversaries and manual-argument/import boundaries.
Existing App authentication/harness and all accepted protections are unchanged.

The final native run passed independent Node public-key verification of the
Swift JWT/claims, wrong-public-key/tampered-signature rejection, export denial
for the authorized signer, foreign signer denial (-25293) and export denial
(-25316), same-identifier/different-binary denial, wrong/extra arguments,
nonempty stdin, inherited synthetic Owner-token sentinel refusal, changed
executable identity, locked vault without prompt, wrong/missing key and a real
invalid-synthetic-PEM import failure. Failure output contains fixed codes only.
No private bytes, JWT, paths, personal identifiers or unrelated keychain
metadata are in the evidence. Keychain search-list equality was checked in
memory during and after cleanup; no unrelated keychain contents were queried.

Final temporary keychain, synthetic files, binaries and compiler cache were
deleted; persistent candidate is empty. A failed early compiler/package run
and its cleanup are retained privately, not erased. First compiler attempt
needed parse-as-library/SDK flag fixes; second package query used insufficient
codesign verbosity for CDHash. Both failed before import and cleaned up.
The final evidence JSON records observed checks, source/binary hashes and
CDHash; these are code-package provenance, not secret or real-App identity.

### Exact remaining attended sequence / residuals

1. TL independently reviews the changed exact HEAD/package/OS proof and decides
   the directory-scoped backup proposal. Before any genuine material, verify
   accepted no-backup/no-sync handling and owner-controlled browser destination,
   including partial downloads and cache behavior. Current included status
   prevents declaring the staging path ready. A synthetic import is not proof
   of actual browser configuration.
2. Obtain independent authoritative registration/installation identifiers in
   the paused Work lane only when TL sequences it; executable real pins stay
   null. Resolve registration's real-key-before-installation sequencing without
   an unsafe cloud-browser transfer.
3. After explicit TL acceptance only, an attended owner-local browser can
   provision directly into the accepted boundary. No clipboard/chat/tool value,
   shell history, source mount, CI or cloud worker transfer. The default signer
   and App transport remain technically closed in this delivery: activating
   reviewed real configuration/lookup is a later TL-controlled operation.
4. Attended import must verify the exact accepted executable/hash/ACL and
   nonextractability, remove staging/partial files, verify cleanup, then lock.
   No backup of PEM; loss requires owner-controlled rotation through the gate.
5. Rollback/revocation: terminate runtime, lock/remove the dedicated vault,
   remove only verified task-owned material; owner revokes the App key and
   suspends/uninstalls if needed. Already issued tokens require explicit
   expiry/revocation handling; deleting a local file does not revoke them.

No software ACL is a hardware enclave. Same-user malware can replace tools,
alter the calling process/clock or request permitted signatures; host-admin,
memory/swap, APFS/SSD snapshots, prior backup/sync and unexpected owner-approved
ACL prompts remain risks. JS/Swift/OS allocations and SSD erasure are not
guaranteed. Legacy Security keychain APIs emit deprecation warnings; this is
a tested existing-host primitive, not future OS support assurance.

A01/A02 acceptance/A09 exact new review/A10 remain OPEN. No real credential,
App install/settings, Bern/ref, DB/Auth/RLS, provider/visa or Production action.
No new cost. **STOP for independent TL; LIVE B HARD-BLOCKED.**

Primary mechanics: [GitHub JWT contract](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app)
and [Apple SecAccess](https://developer.apple.com/documentation/security/secaccess).
Backup semantics were checked in the installed tmutil manual; these references
do not establish this machine's operational readiness.
