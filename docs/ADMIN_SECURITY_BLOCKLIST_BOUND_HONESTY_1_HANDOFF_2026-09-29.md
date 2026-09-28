# Admin Security Blocklist Bound Honesty 1 — HANDOFF

Stand: 29. September 2026
Issue: #617
Draft PR: #618
Branch: `fix/admin-security-blocklist-bound-honesty-1`
Writer: **Jetnity admin security blocklist bound honesty 1**, Generation 1
Session: https://cursor.com/agents/bc-a178dab6-68c6-4037-bf0a-00d22b971ec4

## Where this stands

The bounded blocklist read is disclosed on the existing Admin Security widget. Review the tip of this branch. Do not review `176d08a3`; that commit only added the task.

`origin/main` remains `b633e5f299389faf7e7de375470aaa309e8ef674`. Operating mode is `NORMAL`.

## What the next reviewer should check

1. A returned blocklist shorter than 200 rows has no bound sentence. The count is the returned count.
2. A returned blocklist of 200 rows shows `securityBlocklisteBegrenzt` and still says `200 Einträge`, not a total of blocked IPs.
3. The event sentence from #614 still uses `securityReadIstAnDerGrenze(data.events.length)` and `data-security-read-bound="events"`.
4. `Blockliste (nicht enforced)`, the amber non-enforcement hint, and the block/unblock request bodies are unchanged.
5. The diff does not include `app/api/admin/security/list/route.ts`, the block or unblock routes, SQL, Auth, users or payments.

Evidence: `docs/evidence/admin-security-blocklist-bound-honesty-1/NOTES.md`.

## Parallel work

PR #616 at `fd73e7e631f8d07e3bc4ce60427f3879f036648b` owns Admin Users created-at honesty. Its files and this diff do not overlap. Do not merge the two slices into one writer.

## Not done here

- No signed-in Admin session and no physical device.
- The list route still returns no total beyond the 200-row cap. The sentence says the read can be incomplete.
- The events search still does not filter the blocklist. That was already true. No follow-up is opened.
- Exact-head CI, Auth and Vercel remain Technical-Lead gates.
- Cursor does not Ready or merge.
