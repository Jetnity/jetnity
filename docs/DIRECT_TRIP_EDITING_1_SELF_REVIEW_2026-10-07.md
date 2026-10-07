# Direkte Reisebearbeitung 1 — author self-review

**Author evidence only. Not an independent TL PASS. Final exact-head gates are separately bound in the delivery receipt.**

## Reviewed risks

- P1 wrong trip/owner: Guest expected ID is checked before retry/revision branches and again at the synchronous boundary. Account actions load owner-visible state using the normal authenticated client. Real second-owner/no-session and SQL stale-base probes exist. No client replacement graph or location authority enters the manual path.
- P1 false success/data loss: committed meaning requires independent identity/revision/mutation/full-graph readback. Lost acknowledgement can be confirmed; unavailable readback remains uncertain. Later child edits invalidate retry, even when lastMutationId is unchanged. The localStorage boundary does not claim cross-tab atomicity.
- P1 protected facts: canonical commercial restoration remains unchanged. The shared reindex correction preserves explicit point dates; paired whole-trip shifts remain existing behavior. Native structural tests inspect protected booking/time/price fields after removal and reload.
- P2 hidden consequences: existing concise diff supplemented with all stage/day/normal/protected point consequences and consumer-derived time/Preparation impacts. Pagination avoids one hidden DOM node per item. The maximum-graph browser case checks complete navigation of250 removed and250 protected items within1000 points.
- P2 stale sessions: generation/source/base checks; pending/uncertain locks; returning to edit retains draft; cancel/reopen discards; a later accepted draft gets another seed. Free-text pending/error/generation behavior remains separate and model cost controls remain unchanged.
- P2 dates/locations: baseline counterexample reproduces metadata-only explicit-date overwrite and same-revision wrong Guest trip. Manual Account edits do not invoke catalog resolution; real catalog failure injection is armed with zero catalog requests. Canonical protected route facts have focused regression coverage.
- P2 invalid structural proposal: [TL A09 clarification v1.1](https://github.com/Jetnity/jetnity/pull/905#issuecomment-6044443343) requires refusal of referenced-point removal, complete preservation and continued unrelated edits. Real Guest/Account cases now assert those outcomes alongside positive valid removal. Native SQL23502/full rollback is separate baseline evidence. No dependent cleanup or generic unlink was invented.
- Accessibility: production Chromium widths360/390/768/1440,200% text, reduced motion, linked errors, keyboard flow, focus, pending/error/success and large graph are audit targets. Final execution outcomes are in the report. Physical-device, WebKit and assistive-screen-reader runs are not claimed.

## Scope and hygiene

No package/lock/.github/global governance/#900/readiness implementation/SQL/Auth/RLS changes; no provider/model activation, hosted fixture or real personal data. Audit resources are unique owned local containers/network; no destructive reset of another database. Ephemeral local fixture credentials never enter published evidence. No raw HAR or cookies.

React checklist: canonical derivations stay pure, lazy manual boundary, stable IDs as keys, form values remain controlled, no implicit model generation, visible async state and field association, no direct graph writes from components. Production build/typecheck and the full suite are required evidence; no test deletion or timeout inflation to hide failures.

## Review focus for TL

1. Verify the exact-head receipt and source-bound audit results; distinguish native tests from pure ports/storage doubles and relocated #903 fixture support.
2. Inspect shared temporal correction, Guest identity placement, canonical fact preservation and Account confirmation under races.
3. Independently verify both A09v1.1 paths: valid removal with full preview/readback and invalid linked removal with zero writes, full preservation, retained draft and continued unrelated editing.
4. Check all24 acceptance rows and the full diff. Author confidence does not replace independent acceptance.
