# Bern research quarantine 1 — author status

Author: **Jetnity Official Truth Bern Research Quarantine 1 — GitHub Copilot Generation 1**.
Draft #933 / Issue #932. Parent #917 stays OPEN.

| Workstream | Disposition | Limit |
| --- | --- | --- |
| Quarantine contract | PASS (offline code path only) | Distinct `research_only_quarantine` result type; never trusted retrieval/evidence/rule/provider output. |
| Response completeness | PASS (R1 correction) | Declared `Content-Length` mismatch/short stream now blocks with `content_length_mismatch`, `bodyByteCount=null`, conservative flags. |
| Network execution | NOT_RUN | `networkAttempted:false`, no real HTTP in this task. |
| Security reuse | PASS | Uses `decideOfficialTruthServerOwnedRetrieval` internals with offline-injected DNS/HTTP mocks. |
| 65,536 default bound | PASS | Existing protected retrieval path unchanged. |
| 131,072 proposal | MODELED_OFFLINE_ONLY | Separate mock-body policy only; no live activation path. |
| One-shot permit | RESERVED_REFUSAL_ONLY | First refused attempt consumes permit, second call refused. |
| Hosted writes/migrations | NONE | No Supabase schema or hosted operation changes. |

Sanitized verification/evidence files are under
`docs/evidence/official-truth-bern-research-quarantine-1/`.

Open gates remain unchanged: #917 SOURCE_NOT_QUALIFIED, #913 blocked, G7 advisories,
P2 timing variance. No Ready, no merge, no follow-up slice.
