# Official Truth same-request request provenance capture 1 — Handoff

Issue #887 / Draft PR #891. Technical head `71020a5418d42fb6f4dfc982ec746656d11333e0`; baseline/merge-base `fc2734ca60ae3c578fbcd414055fe983773d74d2`, NORMAL, technical head 2 ahead / 0 behind. Branch `feat/official-truth-same-request-request-provenance-capture-1`. Immutable TASK blob `b55a922a200d067041d4472b7ed40e0d8257acb0`.

Classification: **OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_READY** for Step 2A; see [REPORT](OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_REPORT_2026-10-06.md) for exact evidence and [SELF_REVIEW](OFFICIAL_TRUTH_SAME_REQUEST_REQUEST_PROVENANCE_CAPTURE_1_SELF_REVIEW_2026-10-06.md) for findings. The final delivery identifies the enclosing documentation head and its own remote gates.

Successful retrieval captures canonical validated first-hop `requestUrl`, separately from final `canonicalUrl`; same-request provenance retains the captured value and checks it against the selected permitted request. Redirects cannot overwrite it. No later request permission comes from historical provenance. The strict extractor input and composed `{status, seal}` result are unchanged; request provenance is kept beside the extractor projection.

Local: 93/93 retrieval/extraction/R2; 69/69 foundation/v3; broad Official Truth 963 pass with four unavailable local PostgreSQL tests; typecheck, lint (145 existing warnings), Production build and all hygiene/mode/diff checks pass. Technical-head CI `37506903392` SUCCESS, full suite 5,548/5,548 without skips, both jobs successful; Preview `dpl_6EWgTAba3P5j3zN7oxRzZ8p1FsKn` READY on exact SHA, `aliasError=null`. This resolves the local PostgreSQL delivery-gate limitation. No Content Identity/import guard or registry/root changes.

Independent reviewer should verify the exact final remote head, current main/merge-base/ahead/behind, all eight allowed paths and TASK hash; inspect capture-before-HTTP, final-only selection, query fidelity, multi-hop separation, narrowed immutable projection and historical replay refusal. The multi-support material-projection test uses explicit test seams; real production primary extraction still requires one support, and real composition still returns its existing seal. Do not infer full phase-A/B context capture from that test.

**Step 2A only.** Remaining: executable pins, original-observation/validity-origin/accepted-origin issuer contracts and resolution, complete phase-A/B artifact context, receipt/custody emission and closure. Persistence and F8 remain separate. Zero new DB/Supabase, acceptance, writes, provider/model calls or activation. Do not start receipt emission or another slice.

Codex Desktop session `01a1124e-b4a5-7cf3-be82-0747c1e2bdab`, `gpt-6-astra` / `xhigh`, verified in local session metadata. PR stays Draft. Only the independent Technical Lead decides PASS/CHANGES REQUIRED/Ready/Merge.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
