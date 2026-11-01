# Activities Destination First 1 — QA notes

Fixture screenshots under `/opt/cursor/artifacts/activities-destination-first-1/` use synthetic native cards and fixture frames. They are not provider evidence.

| Check | Result |
| --- | --- |
| Bangkok with unassigned arrival day selects Bangkok and loads both widget URLs without a native search | browser test |
| Ko Chang and Phuket switch the public Viator `name` and do not add a native request | browser test |
| Date-free explicit native search sends `day: null` and `items: []` | browser test |
| Adoption uses the Bangkok day, not the unassigned arrival day | browser test |
| Repeated Bangkok visits stay two options; Ausblenden blocks the next Viator frame until re-show | browser test |
| Country-only trip does not call the native search | browser test |
| Conflicting place loads no Viator name | browser test |
| 1440 and 390, light and green, 320 at 32px root, landscape 844×390, no horizontal overflow | browser screenshots |
| Official loader alone keeps `display:none` and a 0px box; bridge applies synthetic 480px only | `bruecke.browser.test.ts` |
| Live Viator widget documents | 4 loads, 0 clicks, 0 HTTP 403, outer pixels white |

Live detail is in `docs/ACTIVITIES_DESTINATION_FIRST_1_HANDOFF_2026-11-01.md`.
