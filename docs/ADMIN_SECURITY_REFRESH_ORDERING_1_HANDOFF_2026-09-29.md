# Admin Security Refresh Ordering 1 — HANDOFF

Stand: 29. September 2026
Issue: #619
Draft PR: #620
Branch: `fix/admin-security-refresh-ordering-1`
Writer: **Jetnity admin security refresh ordering 1**, Generation 1
Session: https://cursor.com/agents/bc-793ea096-8fef-4cc6-967e-79aca80c981f

## Where this stands

The Admin Security list read now keeps the newest started refresh authoritative. Review the tip of this branch. Do not review `0d4c427c`; that commit only added the task.

`origin/main` remains `6b267186bd8f8261b76583cc3a20af4ddc4fbf89`. Operating mode is `NORMAL`.

## What the next reviewer should check

1. Start read A, start read B, resolve B, then resolve A. B stays visible for success/success, newer failure, and newer success.
2. If A resolves while B is still in flight, loading stays on and A's payload is not shown.
3. A failed current refresh after a successful one still keeps the previous rows and shows `Die Aktualisierung ist fehlgeschlagen.`
4. The poll argument is still `15000`. One tick adds one list GET.
5. Block and unblock bodies stay `{ ip, reason }` and `{ ip }`. Each successful synthetic write starts one list refresh.
6. #614 filter-miss copy and #618 200-row notices still come from the existing helpers.
7. The diff does not include security API routes, SQL, Auth, users or payments.

Evidence: `docs/evidence/admin-security-refresh-ordering-1/NOTES.md`.

## Parallel work

PR #616 at `fd73e7e631f8d07e3bc4ce60427f3879f036648b` owns Admin Users created-at honesty. Its files and this diff do not overlap. Do not merge the two slices into one writer.

## Not done here

- No signed-in Admin session and no physical device.
- The 15-second poll was advanced with Playwright's clock, not a wall-clock wait.
- A block click overlapping an in-flight list read was not a separate rendered race. It uses the same `refresh` guard.
- Exact-head CI, Auth and Vercel remain Technical-Lead gates.
- Cursor does not Ready or merge. No follow-up slice is started.
