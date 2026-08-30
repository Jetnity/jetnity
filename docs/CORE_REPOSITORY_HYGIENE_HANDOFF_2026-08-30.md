# Core Repository Hygiene Handoff – 2026-08-30

For: independent Technical-Lead review  
From: Cursor-Agent `Jetnity core repository hygiene audit 1`  
Issue: [#273](https://github.com/Jetnity/jetnity/issues/273)  
Draft-PR: [#277](https://github.com/Jetnity/jetnity/pull/277)

## What is being handed over

A **non-destructive** classification of the current Jetnity repository. No cleanup was executed.

Read in this order:

1. `docs/CORE_REPOSITORY_HYGIENE_AUDIT_TASK_2026-08-30.md`
2. `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`
3. `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`
4. `docs/evidence/CORE_REPOSITORY_HYGIENE_INVENTORY_2026-08-30.json`
5. `docs/CORE_REPOSITORY_HYGIENE_STATUS_2026-08-30.md`
6. `docs/CORE_REPOSITORY_HYGIENE_SELF_REVIEW_2026-08-30.md`

Historical clues (do not treat as current truth): `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md`, ADR-0184.

## Exact head to review

Review the **exact PR head after the deliverable commits**, not this prose alone.

Audit start HEAD (task file only): `c895d16b5c1f42cdb0bed5b44aaaf188d07c5024`  
Task baseline: `d4a2bba21e9a247594272adb2a13d6cf0620ff48`

Expected diff vs baseline: task file + the six deliverables. If runtime/config/migration/asset files appear, that is a defect.

## One-sentence verdict

The V2 runtime tree is current; Creator/MediaStudio screens are gone; three mechanical leftovers are delete candidates; legal pages/CookieConsent and cloud/branch-unique-docs remain decision-gated; green hygiene CI is not a cleanliness proof.

## What the Technical Lead may do after independent Exact-Head review

- Accept, reject, or demand changes to classifications.
- Keep the PR Draft until convinced.
- Later, and only as a **new** numbered slice/session: authorize a leftover-untrack/asset/config micro-PR that also updates the sanitation lock test.

The Technical Lead must **not** infer from this handoff:

- Ready or merge by the author-agent;
- permission to delete migrations, mount CookieConsent, invent legal text, or touch Auth/Traveller/Provider contracts;
- permission to close/delete remaining historical PRs/branches from this packet;
- a live re-proof of Production Storage or branch protection.

## Suggested later cleanup order (not started)

Only after PASS on this audit and a fresh slice:

1. Untrack `supabase/.temp/*` and `supabase/.branches/_current_branch`; update `lib/project-sanitation/closure-invariants.test.ts`.
2. Remove `public/images/prague.jpg`; update the same lock test.
3. Drop unused V1 image hosts in `next.config.js`; update the lock test.
4. Small config/comment hygiene (`components.json` hooks alias, `pakete.mjs` zod exception, optional Mega Pro / Tailwind `content/` glob).
5. Legal/PO slice for `/privacy`, `/terms`, CookieConsent — not a mechanical delete.

Branch/PR retention and cloud gates stay on their existing workstreams.

## Product-Owner gates that this packet does not open

- User-visible legal/cookie text
- Auth capability/role retirement
- Production Storage / recovery-bucket changes
- `jetnity-bets` or any cloud decommission
- History rewrite
- Public launch / provider live activation

## STOP

Ready for independent Technical-Lead review.

Do not mark Ready. Do not merge. Do not start the next slice from this agent.
