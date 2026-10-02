# Official Truth Rule Acceptance Trust Boundary Architecture 1 — Self-Review

Date: 2 October 2026
Issue: #729
Draft PR: #731
Branch: `docs/official-truth-rule-acceptance-trust-boundary-1`

Logical agent: **Jetnity Official Truth Rule acceptance trust boundary architecture 1**, Generation 1
Session: https://cursor.com/agents/bc-3c2a0ed3-71de-4424-a8a5-f0570830c839
`originalModelName`: `grok-4.7-high-fast`. Not Auto.

This is the author self-review. It is not a Technical-Lead PASS.

## Scope check

The diff against `5e291ed7c4814f034224eda46c3bd62cc9815ea3` is the task seed plus the architecture, report, handoff and this self-review.

The binding task file is unchanged. `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `JETNITY_HANDOFF.md` and `JETNITY_START_HERE.md` were not edited. Continuity for this slice is the architecture, the report and the handoff.

No remote Supabase command was run. No migration file was added. `lib/readiness/rule-claims.ts`, `lib/readiness/official-truth-rule-review-packet.ts`, `lib/readiness/official-truth-rule-review-fingerprint.ts` and `lib/readiness/official-truth-store-server.ts` were not edited.

## Task coverage

| Task requirement | Where it is defined |
| --- | --- |
| Packet binding to an exact #726 key, re-proved at decision time | Architecture §3 |
| Stale or different packet invalidates the decision | Architecture §3 |
| Authenticated session, server role/capability, AAL2 `currentLevel` | Architecture §4 |
| Reviewer identity from verified auth context | Architecture §4 |
| No shared generic token in browser storage | Architecture §4 |
| Three decision states, fact entry separate | Architecture §5 and §6 |
| No auto-copy of the model proposal into `trustedRuleFact` | Architecture §6 |
| Reviewer sees candidate and official support material | Architecture §6 |
| Explicit and composed quality only; gap, stale and conflict stay out | Architecture §5 |
| Re-prove #723, #726, accepted Evidence and scope before acceptance | Architecture §7 |
| `regelKandidatAkzeptieren` remains the only acceptance function | Architecture §1 and §7 |
| Minimal audit fields, no passport/MRZ/biometric/health, no retention choice | Architecture §8 |
| #728 suggestions advisory; no model identity or approval | Architecture §9 |
| OpenAI Developers plugin does not authorize secrets or cost | Architecture §9 |
| Smallest future sequence, not started | Architecture §10 |
| Gate classification; pure contracts are not special gates | Architecture §11 |
| Traveller context stays per cell | Architecture §12 |

## Boundary choices a reviewer should see

1. The server recomputes `reviewPacketKey` from original `{ supports, metadata }`. The human-submitted key must match. The caller's key is not the identity source.
2. `auth.getSession()` and a body `reviewerId` are not authority. The existing `getUser()` plus `profiles.role` path is the authority source.
3. AAL uses `currentLevel === 'aal2'` from `applyAdminAal`. `nextLevel` and a body AAL field do not pass.
4. Break-glass stays surface-only because `reachesDatabase` is false. It cannot open `proceed_to_trusted_fact_entry`.
5. No existing capability is selected. `betrieb-lesen`, `inhalte-moderieren` and `konten-verwalten` are not acceptance authority. Reusing `konfiguration-verwalten` would let every admin with that capability mint Official Truth. Adding a capability is a later special gate, not a choice made here.
6. `proceed_to_trusted_fact_entry` is refused for `research_gap`, `stale_primary_evidence`, `unresolved_conflict`, and for composed support that fails the existing distinct-source rule. Those packets can still be paused or rejected.
7. Fact entry across requests needs a server-held proceed binding. A client flag is not that binding. The store for it is not chosen, because persistent audit storage is a special gate.
8. The fingerprint omits the page snapshot. The review surface still shows the #723 support snapshots before fact entry. The decision still binds to the fingerprint.
9. Pre-fill, if a later UX adds it, stays visibly untrusted until an explicit confirmation that is distinct from first render. The server submits only the human fact-entry value and does not copy `kandidat.proposal`.
10. Minimal audit fields exclude the fact body and the snapshot. #626's 7-day / hourly / 1,000-event figures are not reused. Comment `5908548520` remains the block. This slice does not touch that issue's role path.
11. Persistence stays on `akzeptierteRegelClaimSpeichern`, which already calls `regelKandidatAkzeptieren` and stores the returned claim. Production apply of `official_truth_store_accepted_v1` remains a special gate. The RPC stays LOCAL/UNAPPLIED.
12. No ADR was added. `DECISIONS.md` is outside this task. The decision lives in the architecture file.
13. `requirementsProviderAus()` is still `null`. This slice does not turn research on.

## Tests and gates

This self-review does not claim a local gate pass until the report's validation section names the SHA and the results. Docs-only changes do not add a test file. The required repo gates are still run on the docs tree and recorded there.

## Stop line

This remains a Draft. No Ready, no merge, and no follow-up acceptance, endpoint, Auth, database or model slice from this writer.

**STOP for final Technical-Lead review of the exact pushed tip.**
