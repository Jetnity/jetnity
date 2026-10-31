# Jetnity Widgets Host S2 — HANDOFF

**Stand:** 31 October 2026. **Stop.**
**Writer:** Jetnity Widgets Origin Isolation Foundation 1 — Cursor Generation 1.
**Session:** https://cursor.com/agents/bc-fd77a5a3-17dd-4479-9594-f6238f61583f
**Model:** `grok-4.7-high-fast`
**Branch:** `feat/widgets-host-s2`
**Draft PR:** https://github.com/Jetnity/jetnity/pull/1097
**Task:** `docs/JETNITY_WIDGETS_HOST_S2_TASK_V1_2026-10-31.md` blob `e4ae6b5d6291792d1fe798029849d66119fcf3f5`
**Seed:** `640efc7f7d784905e5a479f9c3e66c0aaceb7638`
**Base at implementation start:** `b7ebc399b92303eacda9afdaa1786f245492051f`

`docs/ACTIVE_WORK_STATUS.md` was not updated. This handoff is the continuity delta.

## Current — 12Go source selection

The amendment is `docs/JETNITY_WIDGETS_HOST_S2_12GO_SELECTION_AMENDMENT_V1_2026-10-31.md`, blob `b5380cf9451b2a13573ecff572f98f46d12be080`. Only the 12Go registry row is selected. DiscoverCars stays unselected. The DiscoverCars audit is still CHANGES REQUIRED / `BLOCKED_TRANSPORT`; its policy, preflight, and nested-contract files were not changed. `audit-preflight.mjs` fails on `twelvego.selected === false` and is a historical check, not this delivery's pass gate.

Source selection is not a widget launch. Dedicated-host deployment, parent sandbox, CMP acceptance, search/form behavior, and revocation remain open. `hostSelectionCommit` is not set here. `allow-popups-to-escape-sandbox` and top navigation are not selected.

## What an earlier reader trusted

Read the protocol, then the report. The host has a real shell. The R2 note below described a fully denied registry; that sentence is historical for 12Go.

## Do not do next

- Do not mark Ready or merge.
- Do not deploy `jetnity-widgets`, connect Git, write DNS, or add ENV.
- Do not set either registry `selected` flag without a new Root selection of the artifact, processing policy, network policy, and frame allowlist.
- Do not import #1096, #1084, or #1086 into this host. Parent teardown duties are in the protocol for those writers.
- Do not treat `scripts/widgets-origin-foundation-1/source-scan.mjs` as a failing S2 gate. It is the historical S1 scan.
- Do not use a personal browser or a real provider account.

## First unfinished step

Independent Technical-Lead review of the exact pushed head, including the new native CI result. After that, Root still owns project linkage, TLS and redirect verification, the production cookie-attribute read, and any decision to select a registry entry. Parent integration remains unfinished until #1096, #1084, and #1086 mount this protocol and destroy the iframe themselves.
