# Public Evidence Privacy Hygiene 1 — Binding Implementation TASK

Date: 9 October 2026
Issue: #911 https://github.com/Jetnity/jetnity/issues/911
Branch: `fix/public-evidence-privacy-hygiene-1`
Agent: **Jetnity Public Evidence Privacy Hygiene 1 — Generation 1**, NEW independent Codex Desktop session/worktree (NOT STARTED at seed).
Baseline: `main@b00e5b29f6c523f6e3b10f82f3032d90c503a251`, Operating Mode NORMAL.
State: **PREPARED TASK SEED / NOT CODE DELIVERY / NOT TL PASS / NOT READY / NOT MERGED**.

## Purpose and actual evidence

Guardian/CoS MATERIAL #748 comment 6032030807, TL triage 6036558748, historic merged PR #871 (`docs/evidence/trip-workspace-integrated-acceptance-audit-1/**`) reported P2 public machine/account metadata leakage. At this precheck the TL independently read publicly committed current-tree evidence and confirmed that `session.json` contains at least one local user-home path. Some other metadata pattern matches were observed; identity, relevance, historical extent, potential email and image pixels remain **UNVERIFIED** and MUST NOT be called exposed credentials or sensitive traveller data without proof. Do not put raw matching values into GitHub comments, reports, tests, or model transcript excerpts.

`main@b00e5b29f6c523f6e3b10f82f3032d90c503a251` has post-merge GitHub Actions 37961185365 SUCCESS (5,888/5,888 / 816 suites, Auth55/243), Vercel Production `dpl_5aoZKTEcmHbPDFEoNLaYAH8PguWS` READY with jetnity.com exact alias, no active implementation PR. #907/#909, #908/#910 finished; do not reopen. #748 has no newer MATERIAL beyond TL receipt 6036558748 at this precheck.

## Authorized owner and file scope

One writer owns ONLY: existing `docs/evidence/trip-workspace-integrated-acceptance-audit-1/**` text/metadata where independently justified; task-owned `docs/PUBLIC_EVIDENCE_PRIVACY_HYGIENE_1_{PLAN,REPORT,SELF_REVIEW,STATUS,HANDOFF,CONTRACTS}_2026-10-09.md`; optionally a NEW narrow test/validator under `scripts/public-evidence-privacy-hygiene-1/**`. This TASK file is immutable after seed.

No writes outside these prefixes without a NEW TL scope decision. In particular do NOT touch Trip Workspace runtime/UI, new #909 evidence, Official Truth source/qualification code or evidence, shared contracts, package/lockfiles, CI workflow, Supabase, Auth/RLS, any Production service, providers, secrets or launch configuration.

## Acceptance criteria

A01. Re-read `JETNITY_START_HERE.md`, TL Operating Standard, live mode/main/#751/#748, #871 and this TASK. Check branch actual head/merge-base/ahead/behind and parallel #912 ownership. Stop and report drift or collisions rather than overwriting.
A02. Independently inventory all public current-tree evidence of #871: 160 PR changed paths including 120 PNG screenshots, 40 non-PNG files; reconcile present files. Distinguish current tree from immutable git history.
A03. Use bounded sensitive-pattern scanning of logs/JSON/text/metadata (local `/Users/` or OS account paths, organizational emails, session IDs, model names, hostnames, secret patterns, CLI output). Do not include raw matches in committed evidence, PR prose, job output, or screenshots. False positives classified as test fixtures vs. genuine private identifiers.
A04. Assess each suspected finding's exposure class, reproducibility, and whether source is public. Do not classify "credentials exposed" merely from a hostname-like token or benign fixture.
A05. Remove or deterministically redact only verified private/machine-specific information from the **current branch tree** using non-reversible placeholders. Do not destroy semantic test evidence, change pass/fail results or invent original results. Avoid preserving original identifiers in diffs, commit messages, test fixtures, derived hashes or generated report body.
A06. Treat old evidence as historical: if a derived report says `sanitized` inaccurately, amend the current-tree claim with an explicit scope/time limitation, not a false retroactive test assertion. Keep proof traceability (test name, machine-neutral timestamp, status, counts) and reviewer-readable redaction rationale.
A07. For PNG assets inspect metadata read-only using available tools and report whether pixels were or were not inspected. Strip only proven metadata with pixel-content preservation verified, or leave unchanged with precise limitation. Never declare images free of sensitive content without testing.
A08. Add a repeatable bounded validator/test for the affected current-tree scope (not a whole-repository sweeping cleanup) demonstrating reproducible RED before / GREEN after for relevant patterns and no accidental test-fixture violations. Ensure original raw patterns are NOT baked into the validator or source control.
A09. Compare representative evidence objects before/after semantically; ensure test status, viewport, route, product claims, and report citations remain meaningful. Document exactly what reproducibility can no longer be guaranteed after redaction, if any.
A10. Explicitly evaluate residual exposure in **existing git history** and whether removal there would be desirable. DO NOT rewrite/force-push/expire history, delete PR review evidence, rotate credentials, contact external parties or act on that residual. Escalate history rewrite and any substantive data-incident judgment to PO/Security/Privacy separately.
A11. Run available relevant local validators/tests and `git diff --check`; verify output/log hygiene and no raw values exposed by tooling. Run normal typecheck/lint/tests only if changed executable validator integration makes it necessary. No skipping or changing unrelated tests.
A12. Publish PLAN, CONTRACTS, REPORT (bounded sanitized counts/classifications), SELF_REVIEW (adversarial threat model), STATUS/HANDOFF and an exact changed-file list. No raw personal data, local user paths or session identifiers in reports.
A13. Confirm hard non-scope and no paid/external network or hosted writes. All identified P0/P1 security risks must halt work for TL triage; P2 residuals precisely identified.
A14. Commit and push only to this branch, leave Draft, stop. Provide exact author head/tree, diff summary, local validation evidence and unresolved decisions to TL. Author self-review NEVER equals TL PASS. **DO NOT mark Ready, DO NOT merge, DO NOT start a follow-up slice.**

## Multi-Agent Suitability

**MULTI_AGENT** across two independent tasks; THIS is Writer A. Writer B in #912 exclusively owns bounded Official Truth qualification scripts/tests/docs. Ownership and output do not overlap. Branches both start at b00e5b29f6c523f6e3b10f82f3032d90c503a251. Independent TL exact-head review; integrate A first as an unresolved public privacy hygiene risk, then recheck B's merge-base/gates. No changes to central shared contracts are authorized by either task; if needed STOP for TL arbitration.

## Reserved Product-Owner gates and stop conditions

No credential reads/revocation, destructive git history rewrite, Production/Dev database or identity operations, sensitive retention/legal decision, source acceptance, F8, provider activation, live payments or indexing/launch. The USD100/month infrastructure ceiling remains. Stop with explicit BLOCKED evidence if safe current-tree redaction is incompatible with retaining auditable proof. Nothing here asserts a retrospective purge of the publicly cloned git history.

**Seed creation is not a started agent session. STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW AFTER CODEX DELIVERY.**
