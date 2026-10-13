# R4-CORRECTION-1 author handoff

Same author/session: Jetnity Official Truth Bern G3 RQ Fetch 1 — Codex Generation 1 / R3 Remediation. Existing Draft PR #935 only. This is an author handoff, not an independent security approval.

Binding authority: [TL R4 5502418180](https://github.com/Jetnity/jetnity/pull/935#pullrequestreview-5502418180) and [continuity 6143968406](https://github.com/Jetnity/jetnity/issues/934#issuecomment-6143968406). Scope is solely R4-F1 and its explicit protected-diff permission.

Input HEAD `5f3869bf284bf63c991db26b2e296373644cbbaf`, tree `b2e8445b11f12850baacef0fe4b53b29687692d5`. Main/merge-base `f48b01eba499186bdf52e13b2d7b398383507f84`, NORMAL. The new publishing commit descends directly from this input on `feat/official-truth-bern-g3-rq-fetch-1` with no force. Its exact SHA/tree/diff and new original CI/Auth/Preview evidence are provided in the final publication receipt; previous-head gates are not adopted.

## Review entry points

- `lib/readiness/official-truth-server-owned-retrieval.ts`, private `bernResearchIndicators`: only replace external src/href classification. Quoted/unquoted references resolve against fixed BERN_RESEARCH_URL via URL; parsed host comparison handles scheme-relative references, prefix-lookalikes and userinfo. Non-default ports are conservatively distinct. Invalid/ambiguous/unsupported values set the finite indicator rather than implying absence.
- `lib/readiness/official-truth-bern-g3-rq-fetch-1/research-only.test.ts`: 29 appended synthetic cases, including all four R4 counterexamples, external/same-host/relative controls and conservative malformed-value cases. Every case uses the existing mock seam, exactly one mock request to the fixed Bern URL, boolean-only indicators and no fixture URL/HTML in the report. No fixture host is requested.
- Companion PLAN and RESULT: scope approval, red-to-green proof, complete fresh local gates, protected-diff evidence and limitations.

All shared-file content outside bernResearchIndicators is byte-identical to the input head. Other indicator fields are unchanged. Trust/auth/TLS/DNS/public pinning/SSRF, 65536 default, Bern 131072/10000ms bounds, every-3xx blocking, offline one-shot protocol and permanent live refusal remain unchanged. Original task blobs remain fc4a2db0fd9a3ee552ce6da212d696ee38ef8135 and 08a1e1a230e0a60f109e38a17dc600ed93bab25b.

## Limits and preserved blockers

The detector remains a bounded research heuristic, not a full HTML parser, security certification or privacy/rights clearance. Entity/backslash/control/broken-quote/unsupported-scheme cases may conservatively over-report. Negative results do not prove absence of external resources, tracking or personal data; srcset, CSS, script execution and arbitrary HTML recovery are not added to this correction. No actual source observation was made.

LIVE B remains HARD-BLOCKED, including the direct export. TL R4 reports the separate owner tag-protection approval in #934 comment 6142528968, but effective installation, suitable non-admin execution principal and historical non-use remain unverified operational gates. This correction neither installs protection nor introduces a productive claim writer or activation mechanism. Do not treat the earlier R3 documents' pending owner decision as overriding the newer TL checkpoint; no protected change is authorized in this author turn.

Existing G7 19 dependency advisories and P2 native PG16 timing variance remain open; the 240s limit is unchanged. Six review threads remain for independent disposition. No package/lockfile, migration, Supabase, Production, secret, rule/provider, #913 or recurring-cost change; no tag reservation or Bern network. #917 remains SOURCE_NOT_QUALIFIED, Provider NULL, visa UNKNOWN.

STOP for independent Technical-Lead re-review of the corrected exact head. No Ready, merge, own security PASS, new agent or follow-up slice.
