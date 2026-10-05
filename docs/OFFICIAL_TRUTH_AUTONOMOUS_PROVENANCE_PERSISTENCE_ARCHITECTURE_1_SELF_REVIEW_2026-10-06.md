# Official Truth autonomous provenance persistence architecture 1 — Self-review

Date: 6 October 2026
Logical writer: **Jetnity Official Truth autonomous provenance persistence architecture 1** · Generation **1**
Issue [#858](https://github.com/Jetnity/jetnity/issues/858) · Draft PR [#859](https://github.com/Jetnity/jetnity/pull/859)
Session: `01a10e26-495a-7340-acd1-c58fdd047aac` · **`gpt-6-astra` / `xhigh`**, evidenced by this session's `turn_context`.
Status: **AUTHOR SELF-REVIEW / NOT INDEPENDENT TL PASS**

## Scope and classification

Reviewed the [architecture](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_2026-10-06.md) against the complete [immutable task](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_1_TASK_2026-10-06.md), merged [#855 semantic contract](OFFICIAL_TRUTH_AUTONOMOUS_PROVENANCE_RECORD_ARCHITECTURE_1_2026-10-05.md) and baseline repository behavior.

**AUTONOMOUS_PROVENANCE_PERSISTENCE_ARCHITECTURE_READY_FOR_IMPLEMENTATION_DESIGN**

Only later TL consideration of a separate implementation/SQL-design slice is supported. No SQL, migration, database, Supabase, apply, retention, F8 or acceptance permission follows. All current producer/origin and later lifecycle gates remain.

## Requirement traceability

| Requirement | Architecture location / self-review result |
| --- | --- |
| What is stored; immutable key; required conceptual fields | §§3–4: exact C(payload), external unchanged fingerprint, strict discriminator projection, optional non-authoritative indexes/metadata. |
| Canonical bytes and later recordFingerprint recheck | §4: exact #855 LF-domain formula; no wrapper self-hash, JSONB re-serialization, Unicode/string/time normalization or new legacy key algorithm. |
| Artifact identity/version/type/bytes and exact lookup | §5: generic store with closed codecs, full Pin, global-definition exception and no current/main/URL fallback. |
| Immutable direct/transitive dependency closure | §6: all 8–11 root slots; profile resolution via exact catalog; parent-committed transitive Pins, complete edge comparison. |
| Idempotency, collisions and mutation prevention | §8: exact equality plus complete closure; id/version and digest conflicts abort; atomic race-safe publication; no semantic update API. |
| Duplicate/cycle/depth/size rules | §§6–7: raw bounds before dedup; shared nodes allowed, duplicate slots forbidden; longest DAG path checked. |
| Missing/corrupt/unsupported artifacts | §9: required closed five-verdict vocabulary; operational read failure stays separate; no silent repair. |
| Historical reader has no side effects or replay authority | §§1,9–10: no extraction/fetch/acceptance/F8/DB write; no now-based freshness; no private seal recreation. |
| Rule reference without Acceptance Authority | §10: exact version relation outside receipt, fact/scope/support binding, sole constructor unchanged. |
| Server/RLS/access | §10: no anon/traveller/browser writes; private reads; separate authorization/custody; minimal grants and privileged-role limitations. |
| No PII or hashes of PII, including artifacts/metadata | §§1,5,11: transitive admission before receipt creation; no personal/request correlation or raw government body archive. |
| Retention/lifecycle left undecided | §11: only reserved questions; append-only while retained; no selected period/deletion/backup/erasure/tombstone policy. |
| Three alternatives and generic vs multiple stores | §§5,12: explicit comparison; Option 1 selected, denormalized-payload extension rejected, current-row-only history fails. |
| Versioning and migration constraints | §§4–5,7,9–10: explicit closed versions/codecs; unsupported fails closed; no historical byte rewrite. |
| Adversarial matrix and future candidate surfaces | §§13–14: future obligations/proposals only, no implementation or tests. |
| Distinct implementation, retention, Development, F8, Production gates | §14: individually stated; exact Development apply still needs explicit Product-Owner approval. |
| Draft/STOP/parallel scope | §15 and report: no Ready/merge/follow-up; only own four delivery docs plus unchanged seeded TASK. |

## Attacks checked in author review

- **Unauthenticated links:** a dependency table alone would not bind historical closure. Parent bytes now commit to all transitive Pins; root pins already live in #855. Links are compared, not trusted as a second source of truth.
- **Semantic hash drift:** wrapping #855's exact global definition would change its declared preimage. The global leaf remains exactly `{id, version, scope}`; receipt H and legacy Evidence/review/scope algorithms remain distinct.
- **JSONB normalization:** a structurally equal parsed object can conceal noncanonical original bytes or duplicate keys. Original canonical B is retained and checked before any projection is used.
- **Current catalog substitution:** actual current RLS/catalog/version safeguards do not archive the whole historical selector or executable profile. Exact complete manifests, not current RPC reads or selected-only snapshots, are required.
- **Hash as origin proof:** an internally consistent invented record can pass checksum checks. The reader's `valid` is explicitly limited; writer admission still requires independent server authorization/custody/privacy, and no caller receipt can enter an acceptance path.
- **Missing preimage overclaim:** no raw source body, full packet, phase-B observations or private seal is persisted. The reader does not claim to re-prove their origin/content or independently recompute the omitted review preimage.
- **Shared-node depth bypass:** first-visit depth is insufficient for a DAG with multiple paths. The longest path and all role edges are bounded; cycles and duplicate raw entries fail separately.
- **Retry as repair:** existing receipt plus absent artifact is not idempotent success. No automatic artifact restoration, lifecycle policy or projection write is smuggled into the reader/retry.
- **Bounds as semantic weakening:** some runtime-valid graphs may exceed storage caps. They are rejected intact; legal fact limits are not widened and historical manifests are never trimmed.
- **Retention via immutability:** no duration follows from append-only integrity, and no cascade/garbage-collection/tombstone default is chosen. These remain explicit later questions.
- **Parallel schema drift:** #857 may add schema-2 runtime support, but cannot silently change this #855-bound receipt/parser contract; all #857 paths remain untouched.

## Verification limits and unresolved implementation work

This is a documentation review. No runtime test, SQL fixture, database mutation, RLS enforcement verification or working persistence proof was performed. The proposed implementation needs exact typed codecs, byte-preserving transport, transaction/race enforcement and later conformance tests under its own approved task. No claim that current registries/return shapes can produce receipts is made.

The report records immutable identity, live-read/overlap evidence and local document checks. Final remote head/CI/Preview/working-tree evidence is delivered after publication. No seed/older-head CI is substituted for the new head. Independent TL review remains outstanding regardless of author checks.

No known receipt-semantic extension is required by this design. If implementation discovers one, the binding task requires STOP and an explicit gap report, not opportunistic fields or fallback logic.

No new running cost, UI/API change, runtime/test/SQL file, DB/apply, retention decision, Evidence/Rule/F8/provider/source activation, CH import/CH-11 or Trip Workspace/B01 work.

PR stays **Draft**. No Ready, merge or follow-up.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**
