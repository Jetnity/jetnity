# Limitations — V1 Guest Active Draft Preservation 1

- Synthetic guest `/planen` only. Not authenticated Preview, Production, hardware, Safari or WCAG.
- Mutation abort recorded **attempts 0 / completed unexpected 0**. That proves no mutation occurred, not that a live POST was observed and blocked.
- Generic list/CTA surfaces (`GastReisen`, `GastCreateLink`) may still see `aktiv: null` for unreadable bytes. They were outside this ownership; they do not authorize `/planen` create.
- `GastCreateLink` still calls `gastspeicherLaden()`. A first paint with missing-v3 + valid or id-less legacy may migrate under the existing loader contract. The owned create gate does not invent a Continue URL from a converter-generated id; mounted handlers after a late inject write nothing and show no `/reisen/` href.
- Broader malformed legacy/queue cleanup is out of scope.
- No reset/delete/export product, no new storage key, no guessed recovery.
- Adoption (`Reiseidee.uebernehmen`) is not reachable in the no-network proof because idea create is blocked before a proposal exists.
- Queue-key access failure is still outside this bounded correction; only the Legacy key after a successful absent active read is newly fail-closed.
- Exact-head CI / Auth / Vercel belong on the frozen head, not this capture SHA alone.
