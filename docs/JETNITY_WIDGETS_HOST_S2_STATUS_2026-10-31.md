# Jetnity Widgets Host S2 — STATUS

**Stand:** 31 October 2026. **Status:** 12Go source selection delivered on Draft #1097. Stopped for independent review.

## Current

- The 12Go general row is selected in source: policy `twelvego-general-chf-20261031-r1`, artifact `3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e`. DiscoverCars stays unselected.
- That selection opens the fixed 12Go resource rules only when the full binding matches. It does not deploy `jetnity-widgets`, set the parent sandbox, or accept a CMP. `purposeSeparationVerified` is false. The form has no `data-starget`; a safe new tab is not claimed.
- The DiscoverCars audit remains CHANGES REQUIRED / `BLOCKED_TRANSPORT`. `scripts/widgets-host-s2/audit-preflight.mjs` still expects both rows unselected and is not a current pass gate.

## Earlier R2 note

**Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
**Branch:** `feat/widgets-host-s2`

## True now

- The host shell, handshake, insertion adapter, denied production registry, frozen exports, unit tests, HTTP matrix, and Playwright harness are in this branch.
- Historical at R2: both production selections were denied. 12Go source selection is now the current registry state. DiscoverCars remains denied.
- No deployment, DNS change, Git link, ENV, CMP import, or provider request was made.
- #1096 head `b1408bc679738ae05e691206c90a1e695c927ab1` was not imported. #1084 and #1086 files were not edited. Their frozen commits were fetched read-only and re-hashed before the copies.

## Not true

This is not a live widget origin, not a consent pass, not a provider-form pass, and not a Technical-Lead merge decision. Root CI on the pushed head was not yet observed at authoring time.
