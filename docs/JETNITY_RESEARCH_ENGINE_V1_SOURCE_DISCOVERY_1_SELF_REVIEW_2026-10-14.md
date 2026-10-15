# Source Discovery 1 — author self-review

**Jetnity Research Engine V1 Source Discovery 1 — Codex Generation 1**, session `01a13c62-4e98-7902-9f90-8ab134a98fb7`.
This is author analysis, not independent TL approval. Same Draft #949, same branch, immutable TASK. The previous scope blocker was independently reviewed and narrowly released in [6179537467](https://github.com/Jetnity/jetnity/pull/949#issuecomment-6179537467).

## Reviewed files and security behavior

- `coordinator.ts`: one offline composition. Reuses canonical request creation, graph reconstruction, routing and URL validation. The only generic preflight validates bounded plain data and exact shapes. It neither invents source trust nor rewrites URL rules. No supplied clock, callback, verifier, plan or trust flag is accepted. Node `util` is used solely for proxy detection before reflection and structural equality on checked data. No server/client transport is introduced.
- Graph reconstruction occurs before every eligible query/candidate result. Conflicting top-level and graph authority copies refuse. Subsequent canonical validators consume only the rebuilt registry. Profile functions are code-owned and always refuse; no content-verification capability is granted by accepting synthetic pins. Complete graph validation is not live provenance or source qualification.
- `query-intents.ts`: typed internal projection of canonical data, source and domain order from the existing plan; maximum six, overflow refused. Contains no free-text input, publisher name, traveller ID or location inference. It does not execute a query or authorize retrieval.
- Candidate intake uses exact pairs and the existing sixteen limit. Bad hits reject atomically; no partially accepted list or rejected URL is exposed. Result identities come only from canonical successful decisions; blocked responses contain no copied identifiers. Outputs remain immutable, unqualified and unknown.
- `coordinator.test.ts`: exercises material behavior, original constructor/router/validator, all outcome classes, mismatch/poisoning/bounds/proxy cases, complete malformed graphs including unused rows, sixteen valid hits, six query intents, and import/cold execution without networking. No production catalog, body, visa fact or database state is fabricated.
- Existing `official-truth-content-identity.test.ts`: nine added lines only, exactly within amendment: one literal importer plus its explanatory comment; five negative suffix/route/traversal/similar-path cases. Existing entries, exhaustive scan and strict equality remain unchanged and pass.
- Four author documents and sanitized JSON: preserve original blocker history, distinguish local/CI/live evidence, record current limitations and new #748 material. No TASK edit, unrelated runtime/test edit or raw evidence artifact.

## Adversarial review conclusions

Untrusted source labels such as government-like domain suffixes never become a registry entry. A valid source with an unregistered content path still fails. A source valid for a different destination/citizenship/document does not enter the current query plan. Explicit fact mismatch blocks; separately canonical fact kinds retain distinct request identity. No inference is made from a passport issuer to nationality.

Malformed graphs cannot hide behind one apparently valid URL: removed items, missing/duplicate/obsolete profiles, duplicated versions, mismatched authority copies and conflicting unused representations fail before intents. Injected functions/proxies/getters never execute; tests count zero trap calls. Constructor and all canonical source/URL semantics are unchanged.

The wrapper's strict shapes are necessary because some existing routing contracts permissively read their fields. Extra metadata is refused, not silently treated as trust. A caller can still construct an internally consistent synthetic fixture; that is intentional for this offline test seam and is **not** a trusted public input path. Repository scan confirms no hosted caller. A future live entry must resolve server-held catalog and profile custody separately; this implementation does not authorize that integration.

Query plans are bounded and repeatable, without runtime state or query logging. Current coverage yields no search. Missing source coverage returns an explicit gap; invalid dependencies return a blocked result. An empty hit list exposes only prepared intents, not false success. Candidate success proves a pre-registered URL/identity relationship only.

## Validation and limitations

Final focused run: **205 pass / 0 fail / 0 skip**, including 30 new acceptance tests and the amended exact importer guard. Typecheck and all five hygiene checks pass; lint has zero errors and 145 existing warnings. Original full suite: **6,775 pass / 10 fail / 1 skip**; all failures are native-PG availability. Setup/build fail at sandbox tsx IPC before Next compilation. Original failures retained; no runner/limit/timeout/test bypass or hosted DB fallback. Actual external CI/Auth/Preview on the new published head must be read separately and is recorded in the final PR handoff; older documentation-only CI is not material-code proof.

The initial two new-test assertion failures and two type errors were repaired in new files, with their original digests retained. No test was skipped or weakened to conceal a runtime failure. Existing canonical tests other than the exact approved importer addition are unchanged.

Open risks: independent TL review; local native-PG/build proof unavailable; new P1 Next.js report [COS-20261015-0757-014](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6185540871), prior compressed-log privacy exposure and historical dependency advisories/warnings. No package/lock change was authorized. Ordinary-passport subtype, tourism and 21 days are not represented in canonical scope and cannot become a legal applicability conclusion. No live availability, body identity verification, rights approval, accepted truth, storage or user-visible research is proven.

No slice-specific correctness defect remains known after this review, but this is not a security clearance or technical completion claim for the failing local gates. The independent TL must assess exact HEAD, full guard diff, original CI results and remaining risks.

**No Ready, merge, deployment, source/provider/DB/Owner-gate action or follow-up. Author STOP after publication.**
