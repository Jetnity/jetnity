# V2-S1 Nights and Hotel Truth 1 — PLAN

Date 27 October 2026. Draft PR #1052. Branch `fix/v2-s1-overnight-hotel-truth-1`.
Writer: Jetnity V2 Nights and Hotel Truth 1 — Cursor Generation 1.
Model metadata: `cursor-cloud run-info.originalModelName` = `grok-4.7-high-fast`.
Session: `bc-eafe2d65-2a92-47d4-b18e-d73539d11eca`.
Link: https://cursor.com/agents/bc-eafe2d65-2a92-47d4-b18e-d73539d11eca.
Display name after `rename-chat`: Jetnity V2 Nights and Hotel Truth 1 — Cursor Generation 1.

## Preflight

Seed `0b3076badc5dd068bb68895ac1aa8ffc30726c2f`. Fresh `origin/main` `d31a16afdac5e97d4b02f4cb5824f5adc290577c`, 1 ahead / 0 behind. Mode NORMAL. Post-merge main CI 40531046407 completed success on that main. #751’s 15:37Z checkpoint predates this 16:14Z owner dispatch and does not move main, mode, or the seed. S0 #1047 stays untouched.

## F02

`benoetigteZeitraeume` keeps every complete stage interval and then appends the trip calendar `[startDate, endDate)` when that calendar is valid. Stage intervals stay first, so overlaps stay with the first stage and are counted once. Nights inside the calendar but outside every stage are gaps with `stageId: null`. They are not given to the neighbouring stage and are not called required hotel nights. Holes outside the trip calendar, including a century between two explicit stage spans, are not filled in. Missing stage dates on a multi-stage trip stay `bekannt: false` with no definitive gap list. The lodging audit is `partial` when transition nights or incomplete stage dates remain, and `complete` only for a fully qualified lodging balance.

## F03

For more than one stage, `hotelZeitraumAusEtappe` returns a period only when that stage itself has both bounds. Otherwise HotelBereich shows „Hotelzeitraum für diesen Ort noch offen“, does not render the trip dates, and returns before `fetch('/api/hotels/search')`. `checkInAus` / `checkOutAus` read only the stage fields. A single stage with no own span still copies the trip dates into the search payload. No provider, booking, price, or persistence change.

## Owned paths

`lib/trips/naechte-abdeckung.ts` and its nearest tests, the lodging section of `lib/trips/trip-audit-v1/audit.ts` and `audit.test.ts`, `lib/hotels/quartier-kontext.ts`, `lib/hotels/reisegraph.ts` and their tests, `components/trips/UnterkunftBestand.tsx`, `components/trips/HotelBereich.tsx`, `lib/trips/nights-hotel-truth-1.test.ts`, and the task PLAN/STATUS/HANDOFF/SELF_REVIEW. No flight or mobility audit edit, no #1043 activity files, no CI, no schema or SQL.
