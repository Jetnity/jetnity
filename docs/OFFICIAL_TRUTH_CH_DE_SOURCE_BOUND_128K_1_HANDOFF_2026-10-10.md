# CH→DE Source-Bound 128 KiB Retrieval 1 — Handoff

## Author delivery

Logical writer: **Jetnity CH-DE Source-Bound 128KiB Retrieval 1 — GitHub Copilot
Takeover Generation 1**.

Repository: `Jetnity/jetnity`; existing branch
`feat/official-truth-ch-de-128k-representation-1`; existing Draft PR #920.
Immutable binding task blob:
`6116b7a90afdcbddc6a46052834a775c19295d47`.

Verified implementation commit: `34cc75b1ee649dd56ab442876e28e02f6860f0a5`,
tree `9abd8b9ead5d1bed53753a9ff89095f0971e31eb`. The handoff/test addendum commit
is `11136c58a7e6c22a6952c54dacdbf254f38d9eec`, tree
`d37015053be6037de142aa5eac43a4fe9956acfd`. The final close-out commit's exact
HEAD/tree are provided in the author delivery comment; a commit cannot include
its own Git object ID. PR #920 must remain Draft. No Ready, merge, hosted
deployment or follow-up is authorized by this handoff.

## Delivery summary

The source-bound transport policy allows an inclusive 131,072 bytes only for the
exact code-owned Bern candidate tuple. All other representations retain the
65,536-byte default. GET length and streamed bytes are both bounded; compression,
invalid media/charset/BOM and unsafe redirects fail closed. Tests use synthetic
content only.

`TRANSPORT_CODE_ONLY_READY_FOR_TL_REVIEW` may be claimed only if exact final
local checks and CI complete successfully. It does not mean source approval.
S3 Bern remains `SOURCE_NOT_QUALIFIED`; no current complete identity/privacy/
legal proof or independently registered code profile exists. No accepted
Official Truth, Evidence/Rule, F8, hosted import or public Requirements
activation is created.

## Verification and remaining blockers

Local verification is recorded in REPORT. The serialized full suite passed
6,264/6,264, including native PostgreSQL 16 R2 semantic, R3, and integrated/storage
proofs. The R2/storage evidence is limited to synthetic test fixtures and does
not qualify the Bern source. Initial implementation-head CI run `38061856864` is
`action_required` with zero jobs; no implementation CI pass is claimed. Seed-head
CI `38038004927` passed but is not evidence for the implementation head.

The implementation-head `Vercel Preview Comments` check succeeded, but does not prove a deployed Preview
or Auth approval. Preview/Auth acceptance and independent Technical Lead review
remain unverified; do not represent unavailable gates as passed. The separate
read-only code review found no significant issues. Bundled Code Review was
unavailable because its configured model was not in the registry; CodeQL was
skipped because the database was too large.

Source title/publisher/canonical identity/current legal statement/whole-page
privacy and operative references are not qualified here. No live source read was
performed. No raw page content, hash, IP, personal data, secret or local path
may be added to the public handoff.

## Stop point

After pushing this author delivery, stop for independent Technical Lead review
of the exact full diff, CI/Auth/Preview and source/legal blockers. The Technical
Lead alone controls Ready/Merge; special Product Owner gates remain reserved.
No writer should begin a follow-up slice from this handoff.
