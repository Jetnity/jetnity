# Homepage Confirmed Route Entry 1 — STATUS

Date: 2026-09-22  
Status: **R4+R5 ADDRESSED AND MAIN-SYNCED / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**  
Parent issue: #110 (bounded partial; must not auto-close)  
Draft PR: #543  
Branch: `feat/homepage-confirmed-route-entry-1`  
Agent: Jetnity homepage confirmed route entry 1, Generation 1  
Required and actual model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`)  
Session: `bc-63084de2-f351-4c8c-be85-c36cda45935e`  
Operating mode re-read: `NORMAL`

This is not a Technical-Lead PASS and is not Ready. Self-review is not TL PASS. Do not merge. Do not start a follow-up slice.

## Review fixes in this session

- **R1/R2/R3:** independently accepted on `0a66982c`.
- **R4:** OrtSuche no longer wipes a post-confirmation origin edit. Omitted `initialText` is not an empty reset. Previous false origin-no-wipe claim remains withdrawn.
- **R5:** After primary↔extra remount, keyboard focus returns to a reorder control on the moved occurrence (`ziel-reihenfolge-1-runter` / `ziel-reihenfolge-2-hoch`). Hydrated test asserts `document.activeElement` tag/id/aria-label, not BODY and not merely nonempty textContent.

## Main sync

TL authorized a normal merge of exact docs-only `main@0b0c7bccae4a8803d780bec798dae3e49b6bba5a` (#544). Performed with `git merge`, no rebase/force. Imported remaining-build-map documents were not edited. Merge-base is now `0b0c7bcc`. Ahead/behind before this persist: **11 ahead / 0 behind**.

## Local gates before persist

| Check | Result |
| --- | --- |
| Owned + related node:test | 148 pass / 0 fail |
| Hydrated | 10 PASS |
| `npm run typecheck` | pass |
| Auth / Production / provider / DB | not mutated |

Exact-head CI/Auth/Preview must be re-read on the freeze SHA after this persist.

## Remaining #110

Arbitrary sentence interpretation such as "Lima und Cusco" remains a later gated model slice. Physical-device acceptance remains pending.
