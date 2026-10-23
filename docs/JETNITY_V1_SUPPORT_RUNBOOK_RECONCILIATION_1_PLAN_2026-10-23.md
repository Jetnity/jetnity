# Jetnity V1 Support Runbook Reconciliation 1 — implementation plan

Date: 23 October 2026
Writer: Jetnity V1 Support Runbook Reconciliation 1 — Cursor Generation 1
Issue: #971
Branch: `docs/v1-support-runbook-reconciliation-1`
Draft PR: #974
Immutable TASK: `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_TASK_2026-10-23.md` (blob `989457863f58bde5264e8974459780b95a615ac3`, left unchanged)
Source baseline read before edits: `main` `5269b9192a2300c6c03fc8659964583130d2d1d1`, merge-base equal, seed head `054fce6dba06897ea7f4b7212e2cc6941c2ac965`, ahead 1 / behind 0. Mode `NORMAL`.

## Goal

Correct the canonical support runbook so current-state text no longer says self-service export, account deletion, legal pages and own SMTP are absent. Keep three layers distinct: implemented in the baseline source, accepted runtime evidence on a named date and scope, and not checked or still open. Do not create support authority, mailbox access, external replies, or new legal policy.

## Files

- Edit: `docs/V1_SUPPORT_PROCESS_RUNBOOK_2026-09-18.md` only among existing files. Affected sections: 0, 1, 3, 8, 10 (promise versus description), 11, 12, 13, 14, 15.
- Add: this plan, then `docs/JETNITY_V1_SUPPORT_RUNBOOK_RECONCILIATION_1_{STATUS,SELF_REVIEW,HANDOFF}_2026-10-23.md`.
- Do not edit the immutable TASK, global status, governance, roadmap, or any runtime file.

## No DB or API change

No migration, route, server action, Auth, RLS, SMTP, provider, or legal-page text change. The product contract is unchanged. Operators gain an accurate description of paths that already exist.

## Decisions inside the task

- Historical creation date 18 September 2026 stays. Reconciliation date and the exact source baseline are added.
- Public support contact remains `info@jetnity.ch`. Transactional Auth sender in the accepted #582 closure is `no-reply@jetnity.com`, not `no-reply@jetnity.ch`. #581 is the earlier site-URL gate and recorded custom SMTP still off.
- `/privacy`, `/terms` and `/impressum` exist in source. `/datenschutz` remains without an app page. #585 stays open. PrivacyBee vendor text is not rewritten.
- Export is authenticated JSON of 13 owner-scoped tables, not a legal DSAR. Deletion is the signed-in password path with exact confirmation, fresh password and conditional TOTP. Support mail does not execute either path.
- The 28 September 2026 Production deletion closure proved an empty disposable account only. Populated trip/traveller/visit/security/storage deletion and a verified-MFA account were not proven. #626 stays blocked and is not repeated.
- Current source and those dated closures do not prove mail delivery today.

## Risks

- Overstating dated closures as today’s live health.
- Treating page existence as legal completeness or as a controller/SLA proof for `info@jetnity.ch`.
- Model identity: requested Claude Opus 5.5 High; this session’s exposed `originalModelName` is `grok-4.7-high-fast`. No alternative model was selected. Technical Lead decides whether that limitation blocks acceptance.

## Security, privacy, cost

No new authority. No mailbox read, no external send, no account export or deletion executed, no secret, no Production or Development call. No new cost.

## Tests

No new test file. After the edit: read the whole runbook, check internal consistency and that named routes and repository paths exist, and review the full diff. Repository CI on the pushed head is recorded only after it is observed. A missing or still-running check stays explicit.
