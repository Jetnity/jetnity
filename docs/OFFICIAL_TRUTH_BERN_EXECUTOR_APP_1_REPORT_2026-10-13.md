# B-EXECUTOR-APP-1 — dormant implementation report

Writer: Jetnity Official Truth Bern Executor App 1 — Codex Generation 1.
Baseline main0b7c5034389f74d32075027109ef506b9e463cd8; seed8257c10aa562c772c7d2ac5a0e465538a665a07f;
TASK blobf4ec0d556ecf4b166903a2600edd244b262448d0. Latest sequencing clarification:
[#936/6146679373](https://github.com/Jetnity/jetnity/issues/936#issuecomment-6146679373).

## What is implemented

`policy.ts`, `authentication.ts` and `evidence.ts` form a separate server-only
App-installation protocol. `scripts/.../github.ts` contains the fixed GitHub
request/framing boundary; `run.ts` is a separately named developer-only entry.
The real CLI remains unconfigured and its live transport has an independent hard
gate. No environment switch, caller-provided bearer, gh fallback, production key
reader, public route or real token mint is available. The only protocol caller is
the explicit offline harness: it creates an unregistered temporary in-memory RSA
key, verifies its signed JWT against the corresponding synthetic public key and
uses synthetic responses. Its result is always marked non-live/non-capability.

This is the reviewed-code preparation stage requested by SEQUENCE-1, **not a
working live executor**. Real signer/custody binding and independently read-back
App configuration will require a separately sequenced reviewed change within the
same issue. No fixture identity can be used as actual configuration.

Authentication checks pinned App/client/slug/owner, exactly one installation,
selected-only repository access, unsuspended installation, complete exact
permission map and zero events. Only Contents-write plus Metadata/Issues/PR-read
is accepted, without an unknown/extra permission. A token can originate only in
the protocol's App-authenticated scoped exchange, requesting exactly repo1020187087
and that permission map. Response scope/expiry and effective accessible repository
inventory are checked; authentication and evidence are checked again before a
result. Token prefixes/bot names/decoded claims are not live identity proof.

The scoped token proves its OWN accessible repository set, not the App's full
installation repository inventory. Private visibility, OAuth/webhook settings and
the installation's selected repository set require an explicit authenticated TL
configuration-readback receipt; they are not inferred from a narrowed token. This
trusted-administrator limitation is retained, not solved with Administration or an
unscoped token. GitHub installation identity and the readback must agree.

## Reviewed integration and witness contract

Preflight requires actual merged PR937 (correct repository, branch and base), its
current author head, exact author tree equal to the local clean checkout/main
tree, ordinary two-parent merge from the task baseline and that author head, and
an authenticated Owner/TL review on that head. PR935 baseline success cannot
satisfy it. A different integration head/tree/main invalidates the receipt.
Main advancing past this exact merge blocks intentionally and needs re-gating.

All receipt bodies are complete canonical JSON (sorted keys); no prose fragment,
duplicate key, unknown field or latest-wins selection. Four separately versioned
records are required:

1. PR937 `BERN_APP_CODE_REVIEW_V1`, pinned review ID/head/tree/task, independent
   code/security and custody acceptance. COMMENTED is allowed because the same
   Owner GitHub account may record independent TL activity; this is not claimed
   as a second GitHub principal.
2. Issue936 `BERN_APP_INTEGRATION_ACCEPTED_V1`, exact App and integration binding,
   review-body digest, actual-main postmerge verification, private App/config
   readback and exactly one selected repository/installation.
3. Issue934 `BERN_APP_UNUSED_AUTHORITY_V1`, preserved exact original B source,
   method, one request,131072 bytes,10s,no-follow/no-retry scope, Owner authority
   distinct from App execution identity, explicit initial-unused/audit attestation.
   Original Owner A+B grant6114368313 is independently fetched and hash-checked.
4. Issue936 `BERN_APP_PROTECTION_WITNESS_V1`, Owner/TL-authored unedited canonical
   record, exact repository/App/installation/main/acceptance, observed policy plus
   versions for main21875372 and tag24998411, complete including-parent inventory,
   empty bypass and executor-never-bypass observation. Maximum lifetime five
   minutes; no future, expired or changed observation. Expiry is checked again at
   completion of policy reads.

Both policies are re-read and compared with the witness and pinned baseline
policy/version. Explicit bypass always fails. Omitted privileged fields require
the witness; missing never becomes empty. Unknown policy fields, changed rule,
extra creation restriction, wildcard, changed version, foreign observer or
incomplete/ambiguous inventory all block. Pagination is deliberately conservative:
any Link header, a100-entry inventory, duplicates or ambiguity blocks, rather
than claiming completeness. These machine receipts have NOT been issued in reality.
The fixture documents their exact shape, without being usable live configuration.

Authenticated comments prove which GitHub account supplied the assertion, not
independent logical authorship or immutable administrator governance. Administrators
can change policies or issue false attestations. The witness bridges visibility
under explicit trusted administration and fresh readback; it is not an immutable
ledger. Present404 plus a separately authenticated unused attestation is required,
but this code never consumes the attempt or creates a tag.

## Transport and unchanged boundaries

Only api.github.com HTTPS443, strict built-in certificate/hostname validation,
TLS>=1.2, fixed headers, no custom proxy/CA options and a closed method/path list.
Only POST is the scoped installation exchange. Read bodies are fully bounded to
262144 bytes, JSON/UTF8 validated, duplicate JSON keys rejected (including escaped
duplicates), no BOM, malformed/duplicate/conflicting framing or pagination, depth
and value limits, five-second per-request cancellation and60-second protocol
deadline. HTTP300–399 never follows. Errors/results use fixed redacted codes.
No generic writer, ref mutation, Bern HTTP stack or source invocation exists here.

Protected source5998fdea54d3337fb68cd7111460b59e43a3cef7, legacy authorization
9ef5d6c420124987cfbefd4278ca70f103f3e022, reader2784a3afc2fb5176b14bf90e2c1328832abf696a
and old CLIa31766ea91bb7cb1dd3c7c70d4d7bf6ca17163dd are unchanged. No shared-code
arbitration was needed because no protected/shared path was edited. Existing
source TLS/DNS/trust/65536-default/131072-Bern/10s/no-follow controls and global
claim simulation remain unchanged. Existing direct and CLI tests are rerun.

## Evidence and limits

The accompanying CUSTODY report and `docs/evidence/official-truth-bern-executor-app-1/`
contain sanitized synthetic runtime/keychain evidence. Full logs stay local;
only log-integrity hashes and test summaries are published. The final publication
receipt supplies exact author HEAD/tree/parent, changed paths, merge-base/ahead/
behind, fresh local gates, original Verify/Auth CI job logs and matching Preview.
That post-commit receipt avoids embedding a commit's own hash in its content.

Work reports App5300986/slugjetnity-bern-research-executor, UI-only. Installation
was blocked by GitHub's key requirement; client/installation IDs are unverified.
All live configuration remains null. A01/A10 and independent A02/A09 acceptance
are OPEN. No source qualified, provider activated, visa decision, historical
non-use certification, real credential/ref/Bern/DB/Auth/RLS/Production change or
new recurring cost. #913/P2/G7 remain. Draft only; STOP for TL review.

Primary mechanics checked: [GitHub Apps REST](https://docs.github.com/en/rest/apps/apps),
[App JWT](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app),
[ruleset read](https://docs.github.com/en/rest/repos/rules#get-a-repository-ruleset).
Those references do not prove this App or this runtime is accepted.

## R1-F1 / R1-F2 correction — same writer/session

[TL review5505320406](https://github.com/Jetnity/jetnity/pull/937#pullrequestreview-5505320406)
and [checkpoint6148167645](https://github.com/Jetnity/jetnity/issues/936#issuecomment-6148167645)
reviewed HEAD372f063f52aed2a6c8e6f00d004b46897dfbd0bb. Both compatibility findings
are corrected within owned files; independent re-review remains required.

R1-F1: the same `headerSafeAppCredential` predicate now protects exchange output
and Authorization serialization: nonempty, at most4096 visible ASCII bytes
(0x21–0x7e). This finite resource bound is not a token-layout/identity check.
Whitespace/control/DEL/non-ASCII/non-string/over-limit values fail closed. There
is no prefix, JWT decoding, format override or legacy-token request. Only the
App-authenticated exchange supplies the installation credential; API identity,
permissions, repository inventory and all evidence checks remain mandatory.

The offline harness accepts only a closed synthetic-case selector, never a raw
bearer. Internally generated520- and1200-byte stateless-shaped cases intentionally
contain foreign unsigned claims: the protocol neither trusts nor interprets them.
One-byte/punctuation/4096-byte opaque values pass the same header-safety boundary;
4097 bytes and unsafe controls fail before token-authenticated reads/socket use.
Wrong authenticated permissions still fail for a long token. Output remains
redacted and non-live/non-capability. This proves local opaque handling, not that
any particular string is a valid GitHub credential.

R1-F2: time is anchored once, then advanced by monotonic elapsed time. Immediately
before and after the exchange, the code records a bounded creation interval.
Maximum expiry is receipt-time plus one hour plus at most1000ms of tolerated
issuer/local clock discrepancy or second-granularity serialization. The interval
itself must stay below5000ms. One second is an explicit conservative compatibility
budget, not a GitHub guarantee of clock synchronization; larger disagreement
blocks. A future approved runtime must supply its own trusted clock anchor, never
a caller-provided timestamp. No such live runtime is activated by this correction.

Minimum remaining life stays strictly above60000ms measured on receipt. The5000ms
remaining reserve is checked both before and after token reads. Request5000ms and
overall60000ms bounds remain, including actual abort timers; elapsed deadlines
are checked after responses as well. Nonfinite/backward monotonic samples and
invalid anchors block. Evidence snapshots receive the progressed time. Only the
strictly synthetic entry accepts a deterministic elapsed clock; it cannot provide
real credentials, a live requester or access through the production hard gates.

New regressions exercise2s/20s delayed creation with normal one-hour expiry,
creation during an in-flight exchange, second-resolution timestamps, exact
minimum/skew/excessive-lifetime boundaries, delayed-response remaining life,
progressing reads, request/overall/final-response deadlines and clock anomalies.
Fresh complete task/regression/full/nativePG/static/build/original CI/Auth/Preview
results and exact publication identifiers are in the new post-commit R1 handoff;
the previous green run is historical evidence only.

Primary contract: [GitHub installation-token format notice](https://github.blog/changelog/2026-04-24-notice-about-upcoming-new-format-for-github-app-installation-tokens/),
[completed rollout notice](https://github.blog/changelog/2026-10-02-stateless-github-app-installation-tokens-rolled-out/),
and [expiry from creation](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app).
Operational custody, real App installation/configuration and A01/A02/A09/A10
remain OPEN. No real secrets, App changes, source/ref action, shared-code edit,
new dependency/cost, Ready/merge or follow-up. LIVE B HARD-BLOCKED.

## CUSTODY-2 continuation — current author delivery

R2 review5506773206 ACCEPTED R1-F1/F2 and closed their threads on95d5552a.
Those accepted source blobs remain unchanged. Scope is existing #936
comment6150274275, same writer/branch/Draft937, not a new task/framework.

Added the default-disabled Swift signer, a foreign executable denial probe,
an explicit offline preparation/rehearsal script and27 portable negative/
boundary tests. Fixed internal synthetic issuer, RS256 claims, five-minute
expiry, OS clock and process deadline; no claims/key/path/clock/real-App input.
Actual macOS run independently verified signatures, restrictive ACL including
same-identifier replacement, nonextractability, refusal/error cleanup, locked/
wrong/missing keys and unchanged search list. The new task-only owner-local
0700 candidate remains empty after cleanup.

Time Machine reports Included. Exact one-leaf proposal6150498189 awaits TL;
no exclusion applied. Third-party sync and actual attended browser transfer
are unproved. See CUSTODY's current section and custody-2-synthetic.json.
This is a concrete preparation/proof, not operational acceptance.

Fresh published-HEAD task/regression/full/nativePG16/static/build and original
CI/Auth/Preview results, exact SHA/tree/diffs and log hashes are attached in the
post-commit CUSTODY-2 handoff; no earlier-head success substitution.
Historical CI38421167519 attempt1 Verify failure (240111.161869/240000ms,
6979 pass/2 cancelled) and same-head attempt2 success (6981/6981,
PG222641.661284ms) remain evidence. Auth55/243 executed once and was carried
forward, not rerun. Any new failure is retained too; P2 timing is not fixed.

No TASK/shared/accepted-auth/package/lock/workflow/config/route/legacy changes,
migration/RLS/hosted Auth, product flow or recurring cost. A01/A02/A09/A10 OPEN.
No genuine key/token/App/ref/Bern operation. AUTHOR STOP; LIVE B HARD-BLOCKED.
