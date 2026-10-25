# Jetnity Dependency Advisory Triage 1 — Author self-review

Date: 2026-10-25. This is not a Technical-Lead PASS and not acceptance. It records the candidate-review R1 corrections against `01f4f2b97b614c3b16048fa8585e1e635c93286f`. TASK V1 and the accepted PLAN were not edited.

## Resolution map

1. **Uncertainty floor and confidence.** Every matrix row now has `deploymentUnknown: true`, `uFloor: true`, `executionCall: NOT_ASSESSED`, and `executionExposureConfidence: limited`. Deciding bucket is U. The withdrawn summary was 0 / 28 provisional P1 / 12 provisional P2 / 2 P3. The recomputed summary is 0 provisional P0, 40 provisional P1, 2 P2, and 0 P3. Lock-graph confidence stays a separate field and is `high` for these 42 rows because those parent chains reach the root. The import walker keeps relative and `@/` edges and recognizes a directive after leading comments. A stored chain is import evidence only. `zod` has such chains. `ws` and `source-map-js` do not, so they are not given an application class from a parent import. No exploit was demonstrated.

2. **Validator completeness.** `validate-evidence.mjs` builds the expected advisory-by-lock-path set from the retained audit URLs, the pinned inventory, and the primary npm ranges. It checks canonical name and version, severity, primary first-patched version, retained npm-view receipts, the U floor, `NOT_ASSESSED`, and priority against the U cell. Empty rows fail. `validate-evidence.fixtures.mjs` copies the pinned inputs and retained evidence into a temp directory and shows failure for an empty matrix, a false version, `uFloor: false`, the phrase `confirmed by npm view`, and a deleted row. The clean copy passes. The fixture child passes `--during-fixture` so it does not require its own receipt to already be inside the copy. The outer commands file records the observed fixture stdout, including `FIXTURE_RESULT pass`. No fixture contacts a registry or installs a package. Unknown ranges stay unparseable failures rather than forced unaffected rows; this lock's 42 rows were `RANGE_DECIDED`.

3. **npm-view provenance.** Fix text names a primary first-patched version and, separately, a retained receipt. `brace-expansion` `1.1.19`, `1.1.20`, `2.0.3`, `2.1.2`, `2.1.3`, `2.1.4`, `2.1.5`, `2.1.6`, `5.0.10`, and `5.0.11`, `ws@8.20.1`, and `minimatch@9.0.6` are explicitly without a receipt. Retained receipts include `brace-expansion@1.1.21`, `@2.1.7`, and `@5.0.12`, and `ws@8.21.0`. No new `npm view` command was run.

4. **Alias counts.** Inventory keeps `pathSuffix` apart from `canonicalName` (`entry.name`, otherwise the suffix). The same blob is 611 entries, 565 path suffixes, and 562 canonical names. The aliases are `string-width-cjs` → `string-width@4.2.3`, `strip-ansi-cjs` → `strip-ansi@6.0.1`, and `wrap-ansi-cjs` → `wrap-ansi@7.0.0`. The sentence that 562 was not reproduced is withdrawn.

5. **Receipts and wording.** `commands.txt` keeps the original audit argv and adds the observed correction argv, stdout, and exit for inventory, the matrix rebuild, the fixture script, and the validator, with the two input SHA-256 values. Those lines were written from runs in this correction, not from an earlier unrecorded invocation. The report now says four advisory ids across three production-closure packages.

## Checks I actually made

- `node --check` on the five scripts in `scripts/dependency-advisory-triage-1/`.
- Inventory rerun, exit 0, empty stdout. Matrix rerun, exit 0, `MATRIX rows=42 {"provisional P1":40,"P2":2}`.
- Fixture script, exit 0, nine PASS lines and `FIXTURE_RESULT pass`.
- Validator, exit 0, `EVIDENCE_VALID rows=42`, then a confirming run after that receipt was appended. `validation.json` is the confirming run.
- Package and lock SHA-256 values matched the pinned hashes. `next-env.d.ts` stayed at `0f70629890b72a0a82e91972cc032c04b658b26c265373cb711cf576bfbf8fcc` and was not staged.
- `npm test`, lint, typecheck, and `next build` were not run. `next build` rewrites `next-env.d.ts`. This correction does not change application runtime. The applicable local gates are the evidence validator, the fixtures, and `git diff --check`.

## Findings I do not want over-read

- Provisional P1 is a scheduling cell under unknown deployment. It is not demonstrated exploitability.
- A literal `zod` import chain is not a vulnerable parser call.
- `zod@4.6.6` is outside `^3.25.76`. This packet does not authorize that bump.
- The audit body still does not prove the contacted registry host or an unauthenticated transport.
- The CI baseline file remains a transcription of the accepted plan. Run 40202059080 was not re-downloaded.

## Residual

Deployed selection and installed consistency stay unknown. A later lockfile edit invalidates this matrix. Author review does not move the PR to Ready. The new head needs a full independent re-gate.
