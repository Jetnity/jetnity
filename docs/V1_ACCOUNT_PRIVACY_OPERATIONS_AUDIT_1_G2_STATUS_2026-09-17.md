# Jetnity – V1 Account / Privacy / Operations Minimum Audit 1 (Generation 2) — STATUS

Stand: 17. September 2026
Status: **AUDIT COMPLETE / DOCS-ONLY / DRAFT / NOT READY / NOT MERGED / NO REMEDIATION STARTED / STOP FOR TECHNICAL-LEAD REVIEW**

Canonical issue: #438
Draft PR: #449
Branch: `audit/v1-account-privacy-ops-1-g2`
Binding task: `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_TASK_2026-09-17.md`
Supersedes: failed Draft PR #439 / Generation 1 (persisted no audit output)

---

## 1. Result

The audit requested by #438 is complete. The full evidence-backed gap matrix is persisted in:

`docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md`

All seven required areas were audited: Privacy/Terms/Consent, account data lifecycle, session/MFA/AAL/recovery, support minimum, admin incident/error/provider/cost visibility, revenue/conversion/attribution, and other release-critical trust gaps (recorded as Section 7, cross-cutting).

32 capabilities are classified with evidence, state, V1 necessity, exact gap, severity, gate and smallest responsible next slice.

### V1 blocking set

**P0 (7):** no production email sender, so registration and password recovery break at any real volume (3.8); unproven "DSGVO & CH-DSG konform" claim shown to users at signup and login (1.4); no `/privacy`, `/terms` or imprint while signup links to them (1.1); no data export/access path (2.1); no account deletion (2.2); admin MFA-loss lockout with no recovery path (3.4, operational); no error tracking, alerting or incident process (5.5).

**P1 (8):** terms acceptance not persisted or server-enforced with an OAuth bypass (1.5); no enforced retention for any data class (2.4); Production admin AAL2 state unknown with two contradicting repository documents (3.3); consumer MFA recovery absent (3.4); no defined support process (4.1); no error boundary covering `/account/*` (4.2); nothing writes `security_events` (5.2); system health measures one real signal out of five checks (5.4).

### Three findings the Technical Lead should look at first

1. **3.8 is the most concrete launch blocker found.** There is no own SMTP server — `supabase/config.toml` L216–222 has the entire `[auth.email.smtp]` block commented out — so Supabase's built-in sender is used with a **project-wide** ceiling of two emails per hour (L179). Registration confirmation and password recovery are both email-only, OAuth is disabled, and there is no alternative recovery channel or support process. The repository already says this is insufficient for launch (`docs/AUTH.md` L265, L314); this audit's contribution is to place it in the V1 blocking set and to note that it silently invalidates the assumption, made throughout the rest of this audit, that the auth flows work. It was found during the adversarial self-review pass, not the main sweep — see the self-review for why the main sweep missed it.

2. **1.4 is the cheapest P0 and the only place the codebase overstates to users.** Everywhere else this repository is unusually disciplined about distinguishing "unknown" from "nothing" — yet `components/auth/RegisterForm.tsx` L386 and `components/auth/LoginForm.tsx` L288 assert regulatory conformity that no implemented capability supports. It was already flagged on 29 August 2026 in `docs/AP6A_GATE0_LEGAL_FOUNDATION_STATUS_2026-08-29.md` §3.2 and is still live.

3. **5.2 is the clearest case of a capability that looks complete and is not.** The admin security page, its three API routes and its RLS policies are all real, but no application code ever inserts into `security_events`. Because the empty/error convention is correctly implemented, the page will honestly report "no events" forever — which reads as "nothing happened" rather than "nothing is recorded".

---

## 2. Git evidence

`origin/main` was re-fetched at the end of the audit.

| Item | Value |
|---|---|
| Canonical base (task) | `69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6` |
| Live `origin/main` at handoff | `69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6` |
| Base drift | **none** — live `main` is identical to the canonical base |
| Merge-base `HEAD`…`origin/main` | `69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6` |
| Ahead / behind | **3 ahead / 0 behind** at checkpoint 2; 5 ahead / 0 behind after the final documentation commits |
| Initial task head | `5900ff62fa41c99ac61840b1e808d4358693d9bc` |
| Checkpoint 1 | `5b989a8c` — Sections 1–3 of the gap matrix |
| Checkpoint 2 | `2c2fd792` — Sections 4–7, consolidated blocking set, audit boundaries |
| Exact final head | recorded in §2.1 below |
| Working tree | clean at every checkpoint |

### 2.1 Exact final head

The final content head (STATUS / HANDOFF / SELF_REVIEW) is `b4c86e0` — see the head-recording commit that is the branch tip. The branch tip is the commit that records this SHA; that commit changes no audit content.

### 2.2 Docs-only proof

`git diff --name-status <merge-base> HEAD` against `origin/main` lists only:

```
A	docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_TASK_2026-09-17.md
A	docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md
A	docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_STATUS_2026-09-17.md
A	docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_HANDOFF_2026-09-17.md
A	docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_SELF_REVIEW_2026-09-17.md
```

(The task document was added by the pre-existing initial task head `5900ff62`, not by this agent.)

Every path is under `docs/` and is slice-specific to this audit. Nothing was written to `app/**`, `components/**`, `lib/**`, `types/**`, `supabase/**`, `scripts/**`, package/dependency files, CI or Vercel config, `ROADMAP.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, Assistant Runtime (#435) files or Explicit Visit History (#448) files.

One incidental note for completeness: the workspace arrived with a pre-existing uncommitted modification to the generated file `next-env.d.ts` (a Next.js build artefact changing `./.next/types/...` to `./.next/dev/types/...`, produced by environment setup before this agent started). It was restored with `git checkout --` and never staged, so it does not appear in any commit.

---

## 3. Tests / build / typecheck

**None were run, deliberately.**

This is a docs-only slice that changes no runtime code, and §5 of the binding task instructs: "Do not run the full repository test suite unless a specific audit claim genuinely requires it; this slice changes no runtime." No claim in the gap matrix rests on a test, typecheck, lint or build result produced by this audit.

Where the matrix cites a test file (for example `lib/legal/ap6a-gate0-legal-foundation-inventory.test.ts`), it is cited as **source evidence of an expectation encoded in the repository**, never as a passing result observed here. This distinction is stated in the matrix's own audit-boundaries section.

Per `AGENTS.md` §25, a tool that skips itself does not count as having run — so this is recorded as *not run*, not as *green*.

---

## 4. Security

No security-relevant change was made; nothing was added, removed or reconfigured.

Security-relevant *findings* are recorded in the matrix: 1.4 (false conformity claim), 2.1/2.2 (absent data-subject rights), 3.3 (unknown Production AAL2 state), 3.4 (MFA lockout with no recovery), 5.2 (no security-event ingestion), 5.3 (unenforced IP blocklist), 5.5 (no error/incident observability).

No secret was read, written, logged or included in any document. No credentialed access to Supabase, Vercel or any provider was attempted.

---

## 5. Database

No migration, no schema change, no type regeneration, no RLS change.

The database was read as evidence only, from `supabase/migrations/**` source. `db:rls`, `db:rechte` and `db:sicherheit` were **not** executed; the matrix therefore records ownership and RLS as *declared in migrations* rather than *verified live* (row 2.6).

---

## 6. Documentation

Added by this agent:

- `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_GAP_MATRIX_2026-09-17.md`
- `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_STATUS_2026-09-17.md`
- `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_HANDOFF_2026-09-17.md`
- `docs/V1_ACCOUNT_PRIVACY_OPERATIONS_AUDIT_1_G2_SELF_REVIEW_2026-09-17.md`

Global continuity documents were **not** touched, as required by the binding task. `ROADMAP.md`, `JETNITY_HANDOFF.md` and `docs/ACTIVE_WORK_STATUS.md` therefore do not yet reference this audit; propagating it is a Technical-Lead decision after review, and is listed in the handoff.

Five stale or conflicting repository evidence items were identified and are recorded in matrix Section 7.4. **None of them was edited** — correcting another slice's documents is outside this audit's write scope, and one of them (the Production AAL2 contradiction) cannot be resolved without credentialed access.

---

## 7. Costs

No new recurring cost. No provider was contacted, activated or configured. No paid model call was made by this audit beyond the agent session itself.

Cost-relevant findings: 5.5 (an error-tracking vendor would be a new provider decision under `AGENTS.md` §18), 5.6 (the in-memory cost guard does not bound spend across instances, which is a hard precondition of any provider activation), 6.4 (an analytics vendor would be a new provider decision and would activate the consent obligation).

---

## 8. Open risks

1. **Seven P0 items remain open**; five of the seven cannot be closed by an agent under current governance (see 7.2 / 7.5 of the matrix).
2. **The Production AAL2 contradiction is unresolved** and cannot be resolved from the repository. Until a credentialed read happens, the honest state of a security control is *unknown*.
3. **Line numbers in the matrix are as at this head** and will drift as the repository moves. Symbol and file names are the durable anchors.
4. **No live Production or Preview verification** was performed for any statement in this audit.
5. **This audit is not a Technical-Lead PASS.** The self-review in `..._SELF_REVIEW_2026-09-17.md` is an agent self-review and explicitly does not substitute for independent review.

---

## 9. Governance state

- Ready: **not set.**
- Merge: **not performed, not requested.**
- Remediation: **not started.** No follow-up slice was opened, and no gap was fixed.
- Scope: strictly audit/docs-only; no collision with Assistant Runtime #435 or Explicit Visit History #448.
- Required final state per the binding task: **STOP FOR TECHNICAL-LEAD REVIEW.** That is the current state.
