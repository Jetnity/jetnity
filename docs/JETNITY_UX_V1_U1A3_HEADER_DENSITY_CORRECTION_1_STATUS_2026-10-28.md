# UX V1 U1-A3 header density — status

**28 October 2026. Draft. Not Ready. Not merged.**

Session `bc-7fd58f05-dda1-453a-acf4-0ae3afd382c0`, `originalModelName=grok-4.7-high-fast`, branch `fix/ux-v1-u1a3-header-density-1`. Parent seed `5b1b65e8db247de17466f8f02eb466222de08310`. Merge-base `71e07c71d06e7c4ef26ed6e8d40080bb9ea24382`. Mode NORMAL.

Implementation and the mounted before/after audit are in this delivery commit. `after.json` records `sha` as the seed because the audit reads `git HEAD` before the commit. The measured components are the ones this commit adds. No product edit followed that audit.

## Same-trip guest, scroll 0, system Chrome headless

| Viewport | Heading y | Attention y | First attention row | Pixels saved (heading / attention / row) |
| --- | --- | --- | --- | --- |
| 390×844 | 639 → 572 | 739 → 632 | 833 → 725 | 67 / 107 / 108 |
| 1440×1000 | 645 → 529 | 745 → 589 | 758 → 602 | 116 / 156 / 156 |

Work on Production of this main: desktop heading about y670, first Jetzt wichtig about y807; phone heading about y643. This harness phone heading before was 639. Desktop before was 645, about 25px higher than Work, so the absolute after y is not a Production pixel claim. The deltas are on one harness and one trip.

## Stop

Independent Technical Lead review of the exact commit on this branch. Same session for any CHANGES REQUIRED. No Ready, no merge, no follow-up slice. #1076 still owns navigation.
