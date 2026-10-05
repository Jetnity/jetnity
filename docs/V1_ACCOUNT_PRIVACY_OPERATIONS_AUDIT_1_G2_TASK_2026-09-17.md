# Jetnity – V1 Account / Privacy / Operations Minimum Audit 1 — Generation 2

Stand: 17. September 2026  
Status: **ACTIVE AUDIT-ONLY / DOCS-ONLY / FRESH SESSION REQUIRED**

Canonical issue: #438  
Supersedes failed Draft PR #439 / Generation 1.  
Canonical base: `main@69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6`  
Branch: `audit/v1-account-privacy-ops-1-g2`

Cursor-Agent: **Jetnity V1 account privacy operations audit 1**  
Generation: **2**  
Required parent model: **Claude Opus 5 High**  
Do not use Auto.

## Goal

Reconstruct the actual Phase-1 V1 state of Account / Privacy / Operations and identify only genuine V1-blocking gaps from live repository evidence.

Audit at minimum:
1. Privacy / Terms / Consent
2. Account data lifecycle: export / deletion / archive / retention
3. Session / MFA / AAL / recovery V1 flows
4. Support minimum
5. Admin incident / error / provider / cost visibility
6. Revenue / conversion / attribution minimum required for V1 operational truth
7. Other release-critical ownership, observability or user-facing trust gaps in this domain

## Required classifications

For each capability record:
- current evidence;
- state: BUILT / PARTIAL / MISSING / BLOCKED / DEFERRED / PO-GATED;
- V1 necessity;
- exact gap;
- severity P0 / P1 / P2 / P3;
- dependency/gate;
- smallest responsible next slice, if any.

Live evidence wins over stale plans. Do not call a historical plan implemented merely because documentation exists. Do not infer compliance from UI copy. Do not claim Production parity without evidence.

## Reliability protocol — mandatory

Generation 1 repeatedly failed in the Cursor/provider/tool runtime after long exploration and persisted no findings. Generation 2 must therefore:

1. Work in bounded passes: Privacy/Consent → Account lifecycle → Auth/MFA/Recovery → Support → Admin/Ops/Cost → Revenue/Attribution.
2. After the first 2–3 sections, commit an **early docs-only checkpoint** containing the partial evidence matrix/status.
3. Commit the remaining matrix in a second bounded checkpoint.
4. Finish STATUS / HANDOFF / SELF_REVIEW in a final small docs-only commit.
5. Do not run the full repository test suite unless a specific audit claim genuinely requires it; this slice changes no runtime.
6. Prefer sufficient repository/live evidence over repeated redundant corroboration.

## Hard write restrictions

The agent may read broadly but may write only slice-specific documentation for this audit.

Do **not** modify:
- `app/**`
- `components/**`
- `lib/**`
- `types/**`
- `supabase/**`
- package/dependency files
- CI / Vercel config
- global `ROADMAP.md`
- global `JETNITY_HANDOFF.md`
- global `docs/ACTIVE_WORK_STATUS.md`
- Assistant Runtime #435 files
- Explicit Visit History #448 files
- any external system

## Product-Owner gates

Classify explicitly as PO-GATED and do not implement if a gap would require Production migration, destructive data change, major RLS/identity/auth/session/MFA/AAL contract change, sensitive document/biometric storage, provider secret/paid live activation, public launch/indexing/domain cutover, or materially new irreversible external commitment.

## Final evidence

Before handoff:
- re-fetch `origin/main`;
- report exact final head;
- report merge-base / ahead / behind / drift;
- prove changed files are docs-only and slice-specific;
- identify stale/conflicting repository evidence;
- persist the complete gap matrix;
- persist STATUS / HANDOFF / SELF_REVIEW;
- perform adversarial self-review.

## Governance

- Do not mark Ready.
- Do not merge.
- Do not start remediation/follow-up slices.
- Agent self-review is not Technical-Lead PASS.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.
