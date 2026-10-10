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

The 131,072-byte byte-collector boundary is tested only by a bounded,
non-authoritative utility that returns bytes and cannot produce a source result.
Server-owned retrieval remains at 65,536 bytes for every current path: the
compiled registry has no Bern profile, injected profile/catalog seams cannot
elevate the cap, and the live authorization path requires the exact compiled
profile object. All source hashes use canonical `evidenceQuellenFingerprint`;
there is no direct-SHA fallback or trusted envelope when that contract refuses a
snapshot. Header ambiguity, compression, unknown media parameters, and
oversized streams fail closed.

`TRANSPORT_CODE_ONLY_READY_FOR_TL_REVIEW` may be claimed only if exact final
local checks and CI complete successfully. It does not mean source approval.
S3 Bern remains `SOURCE_NOT_QUALIFIED`; no current complete identity/privacy/
legal proof or independently registered code profile exists. No accepted
Official Truth, Evidence/Rule, F8, hosted import or public Requirements
activation is created.

## Verification and remaining blockers

Local verification is recorded in REPORT. Focused correction tests pass 93/93,
the full serial suite passes 6,268/6,268 across 818 suites, and typecheck/lint/
build/hygiene checks pass. The corrected full suite includes native PostgreSQL
16.15 R3 and R2 proof outcomes; structural proof passed while its separate
integrated receipt roundtrip remained `NOT_VERIFIED` and full semantic publication
remained `BLOCKED`. Exact correction-head GitHub Actions run `38064852781` is
`action_required` with zero jobs; its log query confirms no jobs executed. This is
not a CI pass, and no retry or authorization bypass was attempted. Seed-head CI
`38038004927` passed but does not validate implementation changes.

The prior correction head `167bb9e4bb1ee613b1757934e67dbf52d51158f4` had a
successful `Vercel Preview Comments` check, but that does not prove a deployed
Preview or Auth approval. Preview/Auth acceptance for the final head and
independent Technical Lead review remain unverified; do not represent unavailable
gates as passed. The previous separate read-only code review is stale for these
corrections. Current parallel validation results must be recorded before delivery.

Source title/publisher/canonical identity/current legal statement/whole-page
privacy and operative references are not qualified here. No live source read was
performed. No raw page content, hash, IP, personal data, secret or local path
may be added to the public handoff.

## Stop point

After pushing this author delivery, stop for independent Technical Lead review
of the exact full diff, CI/Auth/Preview and source/legal blockers. The Technical
Lead alone controls Ready/Merge; special Product Owner gates remain reserved.
No writer should begin a follow-up slice from this handoff.
