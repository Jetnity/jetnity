# Cursor Agent Prompt — Provider Adapter Core Foundation

Cursor-Agent: `Jetnity provider adapter core 1`

Work only on Draft PR for branch `feat/provider-adapter-core-foundation-2026-08-29`.

Read first and follow exactly:
1. `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_TASK_2026-08-29.md`
2. `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_HANDOFF_2026-08-29.md`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. existing provider foundation under `lib/providers/`
5. relevant Commercial Provenance contracts, but do not modify/mint them in this slice.

Implement the provider-neutral adapter transport core at production quality, with deterministic offline tests and the hard security/truth boundaries in the task.

Before handoff:
- re-check `origin/main` and report ahead/behind/drift;
- run all applicable quality gates;
- complete `docs/PROVIDER_ADAPTER_CORE_FOUNDATION_SELF_REVIEW_2026-08-29.md`;
- update workstream status/handoff with exact head and evidence.

Hard STOP:
- do not mark Ready;
- do not merge;
- do not start any follow-up slice;
- no real provider calls, credentials, paid calls, Supabase/Production mutation, runtime activation, `live_api`, `persisted_snapshot` or Commercial-Provenance mint.

Stop for independent ChatGPT Technical-Lead review after implementation/self-review/tests.
