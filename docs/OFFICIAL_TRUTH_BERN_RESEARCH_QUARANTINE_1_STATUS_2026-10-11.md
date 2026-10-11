# Bern research quarantine 1 — author status

Author: **Jetnity Official Truth Bern Research Quarantine 1 — GitHub Copilot Generation 1**.
Draft #933 / Issue #932. Parent #917 stays OPEN.

| Workstream | Disposition | Limit |
| --- | --- | --- |
| Quarantine contract | PASS (offline code path only) | Distinct `research_only_quarantine` result type; never trusted retrieval/evidence/rule/provider output. |
| Response completeness | PASS (R3 correction) | Bounded stream gate (max 65,536) plus task-owned abort-listener cancellation on timeout/abort; overrun (`response_too_large`) and short-stream mismatch (`content_length_mismatch`) keep `bodyByteCount=null` + conservative flags. |
| Network execution | NOT_RUN | `networkAttempted:false`, no real HTTP in this task. |
| Security reuse | PASS | Uses `decideOfficialTruthServerOwnedRetrieval` internals with offline-injected DNS/HTTP mocks. |
| 65,536 default bound | PASS | Existing protected retrieval path unchanged. |
| 131,072 proposal | MODELED_OFFLINE_ONLY | Separate mock-body policy only; no live activation path. |
| One-shot permit | RESERVED_REFUSAL_ONLY | First refused attempt consumes permit, second call refused. |
| Hosted writes/migrations | NONE | No Supabase schema or hosted operation changes. |

Sanitized verification/evidence files are under
`docs/evidence/official-truth-bern-research-quarantine-1/`.

Current author branch HEAD:
latest push on `copilot/featofficial-truth-bern-research-quarantine-1`.

Latest collected exact-head gate proof (pre-R3-F1 push) is
`feat/official-truth-bern-research-quarantine-1@3365eb3`:
CI run `38172983300` success (including Auth job), Vercel Preview Ready.

Open gates remain unchanged: #917 SOURCE_NOT_QUALIFIED, #913 blocked, G7 advisories,
P2 timing variance. No Ready, no merge, no follow-up slice.
