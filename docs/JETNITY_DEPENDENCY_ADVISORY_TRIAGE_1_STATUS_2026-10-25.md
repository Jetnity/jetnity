# Jetnity Dependency Advisory Triage 1 — Status

Date: 2026-10-25. Lane: R107-S. State: corrected audit packet ready for a new independent Technical-Lead candidate review. This is not candidate FINAL PASS, Ready, or merge.

## Binding

- Logical agent: Jetnity Dependency Advisory Triage 1 — Cursor Generation 1.
- Runtime: `grok-4.7-high-fast`. Session: `bc-ace2870d-6fe3-4d6f-9213-676752ad3b9b`.
- Accepted plan parent: `1fcb220a03bb895e3a6609ad81b9a9f7fedb992b`. PLAN blob `436fc2561289baa2da9583c070662a6b8c9ad82b`. TASK blob unchanged `4a4b686fbcc429a4041012f3d967b3f5d1767bc0`.
- Corrects candidate `b905f89eafa0a2c614ca125316497716db27eb91`. The earlier candidate `01f4f2b97b614c3b16048fa8585e1e635c93286f` remains the head whose priority summary was withdrawn. The delivery head is the commit that adds this revision; this file does not contain its own hash.
- Package blobs unchanged: `e6187432cb8f224c10281b7b476bb24eb8ef1c1b`, `4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe`.
- Main at the start of this correction: `a74c443c6be3f064f150fcf021ab6154bda325e5`. No rebase in this packet.
- Draft PR #1021. Tracking #1016 stays open.

## Audit state

The registry commands were not repeated. Retained state remains `REGISTRY_AUDIT_OK` for both explicit dependency sets and `ADVISORY_PRIMARY_OK` for the 23 GHSA payloads. Every current matrix row is `RANGE_DECIDED`. `EVIDENCE_VALID` is the validator result in `docs/evidence/dependency-advisory-triage-1/validation.json` when that command exits 0.

The numerical summary from `01f4f2b9` (0 / 28 provisional P1 / 12 provisional P2 / 2 P3) is withdrawn. The corrected matrix is 0 provisional P0, 40 provisional P1, 2 P2, and 0 P3. Bucket U is the floor on every row. Execution of the vulnerable function is `NOT_ASSESSED`. No remediation group is activated.

Candidate review R2: `retrievedAt` is null and `acquisitionState` is `UNAVAILABLE` on every row. `primaryPublished` and `primaryUpdated` stay the payload times. The validator parses the raw lock, requires the row fields, rejects a retained candidate from another major than the primary patch, and reads the omit-dev audit. The retained omit-dev output still names `source-map-js`, `ws`, and `zod`.

Four advisory ids cover three production-closure packages: GHSA-mrhx-c7xc-m3w5 (`zod@3.25.76`), GHSA-96hv-2xvq-fx4p and GHSA-58qx-3vcg-4xpx (`ws@8.18.3`), and GHSA-68fv-2mgg-jv7q (`source-map-js@1.2.1`). Those rows are an advisory-to-lock concern. They are not an exploit finding and not a deployed-bundle finding.

Lock counts on the same blob: 611 entries, 565 path suffixes, 562 canonical names. Installed consistency: **UNVERIFIED**. Deployed selection: unknown. No package, lock, runtime, workflow, or config edit. `next-env.d.ts` stayed at its pre-command dirty bytes and is not staged.

## Holds

#985/#982, #917, #913/#911, #968, #748, #626, #937/#936, Bern #934, and the other recorded holds are unchanged. No Production, provider, secret, payment, legal, or launch action. Integration order remains T → S → D → W → M. No sibling merge.

## Next step

Independent Technical-Lead re-gating of the new exact head. Cursor does not Ready, merge, close #1016, write `main`, or start a fix slice.
