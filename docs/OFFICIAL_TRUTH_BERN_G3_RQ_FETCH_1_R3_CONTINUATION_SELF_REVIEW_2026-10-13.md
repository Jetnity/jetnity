# R3 continuation author security self-review

This is author review of CODE ONLY, not independent Technical-Lead acceptance.

| Finding | Implemented evidence | Remaining boundary |
| --- | --- | --- |
| F1 numeric or forged receipt | Authenticated fixed-host reader; exact #934 origin, immutable owner, canonical record/scope/current main and original grant; hostile API tests | No valid future consumption/protection receipt created; actual future principal/API access must be independently verified |
| F2 clone/process replay | Shared mocked create-only 201 protocol; exact protected tag and non-admin role checks; two real child processes, committed-but-lost-response and replay tests | No real create-ref writer, protection deployment or unprivileged execution identity; live B hard-off |
| F3 uncommon redirects | All 100 statuses cancel and yield redirect_detected without headers/body or second request | Trusted shared redirect behavior intentionally unchanged |
| Direct export bypass | Export always refuses, including forged inputs and repeat calls; production CLI success-preflight test still refuses | Requires separate reviewed activation code before any live attempt |
| Response limits | Existing synthetic 131071/131072 success, 131073 refusal, short/long framing, stream/error/timeout/cancellation tests retained | No physical Bern response observed or claimed |

## Adversarial reasoning

- Caller-controlled comment IDs are lookup selectors only. The authentic server response and exact immutable author/body binding decide validity. Login alone, old owner grant, wrong issue/repository, anonymous/bot, edited comment, duplicate JSON keys, larger budget or stale main cannot authorize.
- API data and exceptions never become executable input or logs. Credential stdout is constrained and then authenticated remotely, not parsed as a grant. Absolute binaries and fixed TLS host remove PATH/URL authority selection. Trusted local OS/code/CA and GitHub remain assumptions.
- Ref absence is not proof of historic non-use. Separate owner/audit attestation is necessary even in the simulation. Single atomic creation and immutable tag protection jointly model consumption; local locks are no longer presented as global authority.
- Admin accounts can change rules. The runner proof rejects owner/admin/maintainer/custom/App roles and checks the effective collaborator role in addition to token-visible permissions. Remaining privileged administrators are an explicit trusted governance domain. No cryptographic immutability or continuous protection claim is made.
- A response loss or failed post-claim check cannot trigger a retry, cleanup, ref replacement/deletion or reinstate the grant. No production writer exists to accidentally exercise this logic.
- Current active GitHub inventory contains only main branch rule #21875372. Proposed tag protection is absent. Current connector owner/admin is unsuitable. Neither condition was changed or silently accepted.

## Residual risks and explicit limitations

1. F2 operational guarantee is **not deployed**. No live B readiness claim. Owner-approved exact protection, existing non-admin principal, auditable unused baseline and future independent review are still mandatory.
2. The authenticated reader requires existing gh at its fixed supported platform path; unsupported installations fail closed. Test mocks prove validation/ordering, not actual future credential permissions. Production write integration is intentionally absent.
3. Strict unedited canonical records and exact merge/main match favor refusal: a later main commit or edited approval requires fresh reviewed evidence. Unknown roles/fields/API failures also stop.
4. GitHub administrators, GitHub service consistency and local trusted runtime remain dependencies; a malicious admin can alter protection between checks. No silent extension to organizations or custom roles.
5. Existing G7: 19 known advisories (17 high, 2 moderate; three production high: sharp/source-map-js/ws); reachability unresolved. No dependency remediation scope was added.
6. Existing P2 native PostgreSQL16 M1–M4 timing variance remains; the 240000ms test deadline was neither raised nor skipped. CI timing is separately reported on the publishing head.
7. Five R2 review threads remain open; only the independent TL may accept closure. Phase B NOT_RUN, source NOT_QUALIFIED, no database import approval.

STOP after publication and exact-head checks for independent ChatGPT Technical-Lead security review. No Ready, merge or follow-up slice.
