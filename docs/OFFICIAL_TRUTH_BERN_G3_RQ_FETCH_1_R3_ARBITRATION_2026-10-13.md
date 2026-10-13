# Bern G3-RQ-FETCH-1 R3 — global reservation security arbitration

Date: 13 October 2026. Author: **Jetnity Official Truth Bern G3 RQ Fetch 1 — Codex Generation 1 / R3 Remediation**.

**STOP / BLOCKED BEFORE REMEDIATION IMPLEMENTATION. No R3 fix or security PASS is claimed.** Existing Draft PR #935 and Issue #934 only. Phase B remains NOT_RUN / NOT_AUTHORIZED_FOR_EXECUTION. This packet is a proposed decision, not an authorization receipt.

## Binding stop and exact baseline

The [R3 task](OFFICIAL_TRUTH_BERN_G3_RQ_FETCH_1_R3_SECURITY_REMEDIATION_TASK_2026-10-13.md), blob `08a1e1a230e0a60f109e38a17dc600ed93bab25b`, requires: “If a new Github write/credential model or repo ruleset change would be required, STOP for a separate precise TL security arbitration rather than silently bypass this P1.” The user independently requires STOP if the global guarantee cannot safely be established.

- Input/unchanged code seed: `69fad122fd5f243ac20d6a1351d8991f05d2eb2a`; tree `a222434482f72f4f7e5f45e3391d3b4028d72212`.
- Live main / merge-base: `f48b01eba499186bdf52e13b2d7b398383507f84`; mode NORMAL; seed 14 ahead / 0 behind.
- Branch: `feat/official-truth-bern-g3-rq-fetch-1`. No other writer identified by the current #751 index; no agent delegated.
- Original task blob remains `fc4a2db0fd9a3ee552ce6da212d696ee38ef8135`.
- [Independent TL R2](https://github.com/Jetnity/jetnity/pull/935#pullrequestreview-5489328147): P1/F1, P1/F2, P2/F3 remain CHANGES REQUIRED. Five review threads remain unresolved.

## Facts checked read-only on 13 October 2026

1. [Ruleset inventory including parents](https://api.github.com/repos/Jetnity/jetnity/rulesets?includes_parents=true&per_page=100) returned one active ruleset, ID `21875372`.
2. [Ruleset 21875372](https://api.github.com/repos/Jetnity/jetnity/rulesets/21875372) has target `branch`, include exactly `refs/heads/main`, no exclusions and no bypass actors. It does not cover the proposed consumed tag or a new consumed branch. There is no verified tag deletion/update protection in this evidence.
3. Read of `GET /repos/Jetnity/jetnity/git/ref/tags/jetnity-official-truth-bern-g3-rq-fetch-1-consumed` returned 404. This proves no readable reference now; it does **not** prove it never existed or was never consumed.
4. The existing owner grant is [#917 comment 6114368313](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6114368313), author immutable ID `217454461`, conditional A+B. It is not an executable #934 main-bound consumed receipt. All six current #934 comments were read; no standalone executable consumed record was established.
5. [GitHub's reference API](https://docs.github.com/en/rest/git/refs) documents create as 201, conflict/validation failures as 409/422, and supports update and delete with Contents write permission. A permission capable of creating a ref is not inherently create-only. No GitHub write was used to test these semantics.
6. [GitHub ruleset documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) documents separate creation, update and deletion restrictions and bypass permissions.

## Why create-only alone is insufficient here

A successful create on one fixed ref can arbitrate concurrent creators while that ref remains present. It is not an immutable, lifetime consumed ledger. Consider this **logical counterexample, not a live experiment**:

1. Process A verifies receipt R and main SHA S, creates the fixed ref at S, receives 201 and consumes the attempt.
2. A Contents-write actor deletes that unprotected ref, deliberately or during cleanup.
3. Process B in another clone sees the same still-valid R and S, creates the now-absent ref, receives another 201 and could fetch again.

Before B, “never created” and “created then deleted” have the same readable ref state. Neither a fresh local marker, a new receipt ID, a pre-read, nor a post-create SHA check distinguishes them. Successful readback also cannot prove continuous retention. An API timeout after a committed create must consume the opportunity without permitting GET or retry, regardless of whether the response was received.

This is the exact deleted-ref failure branch required by R3, not a claim that GitHub's initial concurrent create operation is broken. The APIs reviewed do not provide a separate irreversible consume operation. No equivalent durable authority within the allowed scope has been demonstrated. The author must not silently assume that Contents-write actors can never delete the marker.

## Finite decision proposed to the independent Technical Lead

**Recommended decision: keep B blocked; separately authorize and establish a protected fixed consumed ref before resuming R3 implementation.** This packet does not authorize the configuration change.

Requested protection specification, for the authorized repository administrator to review:

| Field | Exact proposed value |
| --- | --- |
| Repository | `Jetnity/jetnity` (repository ID `1020187087`) |
| Target | `tag` |
| Included ref | `refs/tags/jetnity-official-truth-bern-g3-rq-fetch-1-consumed` only |
| Exclusions | none |
| Enforcement | active |
| Required restrictions | update and deletion |
| Bypass actors | none, including the eventual runner identity |
| Creation | permitted; do not pre-create the real consumed ref |
| Credentials | an existing authenticated credential; no new secret or grant silently introduced |

Do not alter main ruleset `21875372`. Do not create, reset, delete, or force-update the consumed ref as validation. Review effective rules and the actual existing runner permissions read-only. If an administrator must obtain a new credential or broader access, stop again for that separate decision.

The TL must explicitly define the trust boundary: repository administrators able to disable protection or rewrite the execution code remain trusted and must never reopen this one-shot. A ruleset is not protection against a malicious administrator controlling the repository. If that boundary is insufficient, **reject this design and leave B disabled** until a separately reviewed immutable consumption authority exists. No new database/service/framework is proposed by this author.

If any consumed state/history is discovered, preserve it and refuse B. Do not interpret 404 or a subsequently installed ruleset as proof that an old attempt was unused. Establish the unused initial condition separately before enabling the reviewed implementation. Never make a new ref name per SHA, receipt or process.

## Conditions for resuming the same R3 correction

1. TL records the exact accepted protection/authority model and verifies it; the author re-reads live main/mode/#751/#748/#934/#935 and resumes the same branch only after that decision.
2. Implement authenticated code-owned GitHub reads: exact #934 issue/comment/API and HTML URL, owner ID `217454461`, strict record `G3_RQ_FETCH_1_ATTEMPT_CONSUMED`, B/one attempt, fixed Bern scope, reviewed checkout and current remote main 40-hex SHA. Verify the existing PO approval binding; reject its ID as a substitute consumed receipt. Reject malformed, stale, forged, ambiguous, unauthenticated and unverifiable responses before DNS/HTTPS. No arbitrary remote body or credential logging, public caller injection or caller-selected host/author/ref.
3. Require proven protection and a newly acknowledged authenticated POST create: status 201, exact fixed ref, object type commit and exact reviewed main SHA. Existing/conflicting ref, wrong response, permission/rate-limit/API error, timeout, unknown/deleted state or failed post-claim recheck blocks. Never convert readback into a winning create receipt. Never retry a claim or reinstate an opportunity after a claim succeeds or has an uncertain outcome.
4. Enforce the gate at the actual live transport boundary: the current zero-argument exported live seam at `official-truth-server-owned-retrieval.ts:1109` must not remain a route around the new gate. Any necessary shared change stays within R3's minimal one-shot allowance and preserves the trusted Official Truth path. Local file/process locks remain additional safeguards only.
5. Fix research-only 300–399 classification and cancellation without changing `UMLEITUNG`, `hopLesen`'s trusted decisions, the normal 65536-byte limit, or the official catalog/profile path.
6. Add synthetic independent-process/shared-service races and all R3 negative cases, including deletion/unknown protection, response loss after committed create, forged stdout, wrong repo/issue/author/scope/SHA, 3xx, framing, 131073 bytes, stream error and deadlines. No actual GitHub reservation or Bern request in any test. Mocks prove application ordering, not GitHub live enforcement.
7. Run all required local checks and new exact-head original CI/Auth/PG16/Build/Preview, then independent TL R3 security review. Only the TL can later consider Ready/Merge and postmerge gates. This author does not execute B.

**Alternative decision:** do not approve any protection/authority change; retain `BLOCKED / B_NOT_RUN` and stop this remediation. Treating a mutable tag or manual comment as equivalent to an immutable global claim is not an acceptable alternative under the current task.

## Remaining risk and non-actions

F1/F2/F3 remain unfixed. Existing G7 19 dependency advisories (17 high/2 moderate; three high production packages reported), unassessed reachability and PG16 M1–M4 timing variance remain historical unresolved risks, not newly measured results. The 240-second threshold stays unchanged.

No real Bern DNS/HTTPS request; no consumed-ref create/update/delete; no ruleset/branch-protection, credential, package, workflow, database, source trust, Rule, Provider, Visa, #913 or main change. No new recurring service. `requirementsProviderAus()=null`; parent #917 remains SOURCE_NOT_QUALIFIED. This is an author STOP packet, not an independent security signoff.
