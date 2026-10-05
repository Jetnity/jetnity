# Applicability schema 2 dormant runtime foundation 1 — Self-review

Date: 6 October 2026 · Issue #856 · Draft PR #857
Status: **SELF-REVIEW COMPLETE / INDEPENDENT EXACT-HEAD REVIEW REQUIRED**

This is the implementing writer's review, not independent Technical-Lead PASS. The binding task and merged #851 architecture determine the scope.

## Conformance review

| Area | Adversarial coverage / result |
| --- | --- |
| Activity | All four characteristics: true/false/missing, NOT, independence, purpose-no-inference, contradictory assertions before unrelated OR, 8 raw duplicates accepted/9 rejected, wrong provenance rejected. |
| Duration | 89/90/91 thresholds; inclusive/exclusive and same-day dates; leap-year/year-range validity; direct declaration with unknown dates; conflict under the declaration's own convention; open-ended unknown/conflict; exact gaps; months direct only; no conversion; quantity and derived candidate bounds. |
| Provenance | Equal date and assertion candidates retain both date dependencies and the assertion; a decisive assertion produces `context_asserted`. Decision trace has only predicate kind/provenance/polarity, no personal values. |
| Passport | Full conjunction, non-passport and explicit false, unknown/missing limbs, absent positive citizenship, wrong link, unrelated issuer, ordinary-class independence, categorical national-ID/refugee/laissez-passer conflicts. |
| Logic | v1 operators, NOT without assertion-polarity rewriting, otherwise only after all expressions false, equal/different true outcomes, disturbing unknown outcome, no-applicable-branch, explicit version and visit-scope checks. |
| Bounds / raw input | Raw and normalized depth/node/operand/branch/support checks, raw activity and visa-option bounds, complete-tree value/container/UTF-8 bounds, accessors never invoked, cycles/symbols/prototypes/extra keys/nonfinite/noninteger/negative-zero/PII rejected. |
| Fingerprints | V1 baseline goldens, v2 version domains, ASCII recursive key ordering, normalization and support-free locator separation; outcome/unit/counting/deadline differences remain distinct; unconditional complete facts include their outcome. |
| Event deadline | T<E, T=E, T>E; date-only precision; unknown/not-yet-granted/recorded-without-expiry; wrong scope; missing or malformed observation; strict instant/civil validation; unchanged relative temporal tests. |
| Fact carriers | All four kinds; exclusive unconditional/branch shapes; exact keys; mixed schema rejection; quantity/event preservation; deadline/authority jurisdiction; max-total consistency; support-set bound; existing acceptance rejects v2. |
| Store | All four carriers, unconditional and branches; direct/trusted/proposal entry routes; deterministic `schema2_not_persistable` before dependency getters or transport. Legacy success and schema-1 refusal tests preserved. |

## Implementation checks

- Only eight authorized code/test paths change, plus three delivery documents and the unchanged TASK addition relative to main.
- The old applicability source prefix matches baseline after only dispatch naming/private parameter type changes. Old relative temporal source matches after excluding new imports.
- No v1 serializer/normalizer/evaluator body, negative-provenance semantics or otherwise behavior changed. Two baseline hashes are fixed test assertions.
- The explicit v2 canonical-reader overload avoids broadening existing extractor/acceptance interfaces. No out-of-scope registry edit is needed.
- Source-specific rules, free text, generic attribute paths and personal identifiers are absent from the new contract. Test inputs are synthetic contract cases.
- No Date/clock call exists in the new planned-stay/event evaluator code. Local civil dates use ordinal arithmetic; canonical UTC instants are compared directly.
- No producer, route, UI, account/trip storage, SQL, migration, Supabase action, source registration or production integration was added.
- `schema2_not_persistable` happens before environment/client/payload/RPC; the defensive persistability branch also refuses v2.

## Validation evidence

Focused suite: **117 passed / 0 failed / 0 skipped**. Full suite: **5,418 passed / 0 failed / 0 skipped**. Typecheck, production build and hygiene checks pass. Lint has **0 errors / 144 existing warnings**, with none in the changed files. The REPORT records the discarded environment-only test/build attempts and the successful final environment.

Live main/mode/#751/#748/#856/#857 were reread before delivery. Main remains the baseline; mode is NORMAL; TASK bytes are unchanged. The active docs writers #859/#861 are explicitly disjoint in #751 and their live changed paths do not overlap this slice.

## Remaining limitations and decision

No known in-scope defect remains from this review. External exact-head CI/Vercel readback is a separate post-push check, recorded in the final delivery receipt rather than presumed here.

Dormancy, absent producer/binder/registry integration and unconditional non-persistability are required boundaries. A pure parse/evaluate result supplies no accepted-Evidence or Rule authority. Serialized duplicate-key rejection belongs to any later byte-ingestion boundary; no such boundary is introduced here. Date-only expiry deliberately cannot produce a deadline window. No source family becomes ready.

Actual session: `01a10e1c-6994-73e0-ac3b-f5e2031f49c7`; actual model/effort: `gpt-6-astra` / `xhigh`.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.** Draft retained; no Ready, merge or automatic follow-up.
