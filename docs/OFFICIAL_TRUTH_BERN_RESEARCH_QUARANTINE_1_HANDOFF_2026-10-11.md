# Bern research quarantine 1 — author handoff

Author: **Jetnity Official Truth Bern Research Quarantine 1 — GitHub Copilot Generation 1**.
Draft #933 / Issue #932 / Parent #917 OPEN.

## Branch and authority boundary

- Started from seed HEAD `c9a5bd73db42b4e270cd7d6613ff3172e2933f2f`.
- Local Codex unpublished changes were not available in this sandbox clone.
- Work kept on the existing PR branch only.
- No Ready, no merge, no follow-up PR.

## Delivered paths

- `lib/readiness/official-truth-bern-research-quarantine-1/offline.ts`
- `lib/readiness/official-truth-bern-research-quarantine-1/offline.test.ts`
- `scripts/official-truth-bern-research-quarantine-1/run.ts`
- Task-owned docs with prefix `docs/OFFICIAL_TRUTH_BERN_RESEARCH_QUARANTINE_1_*_2026-10-11.md`
- Evidence under `docs/evidence/official-truth-bern-research-quarantine-1/`

## Key review checks for TL

1. Quarantine contract stays non-authoritative and cannot produce trusted retrieval fields.
2. Fixed Bern target is immutable and caller cannot provide URL/profile authority.
3. Retrieval security internals are reused via `decideOfficialTruthServerOwnedRetrieval`
   with offline-injected transport only.
4. 65,536 default retrieval bound remains unchanged; 131,072 is only modeled offline.
5. One-shot future permit semantics show refusal + consumed state + second refusal.
6. Script remains offline-only and does not expose a live launcher.
7. `REAL_NETWORK_ATTEMPTS=0`, no persistent HTML storage, no hosted writes.

## STOP

Await independent ChatGPT Technical-Lead review on exact author HEAD.
