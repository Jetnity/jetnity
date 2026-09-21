# Limitations — V1 Guest Active Draft Preservation 1

- Synthetic guest `/planen` only. Not authenticated Preview, Production, hardware, Safari or WCAG.
- Mutation abort recorded **attempts 0 / completed unexpected 0**. That proves no mutation occurred, not that a live POST was observed and blocked.
- Generic list/CTA surfaces (`GastReisen`, `GastCreateLink`) may still see `aktiv: null` for unreadable bytes. They were outside this ownership; they do not authorize `/planen` create.
- Broader malformed legacy/queue cleanup is out of scope.
- No reset/delete/export product, no new storage key, no guessed recovery.
- Exact-head CI / Auth / Vercel belong on the frozen head, not this capture SHA alone.
