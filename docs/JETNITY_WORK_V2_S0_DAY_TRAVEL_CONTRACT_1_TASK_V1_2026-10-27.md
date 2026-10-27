# V2-S0 Travel Days and Transfers Contract 1 — IMMUTABLE TASK V1
Date 27 October 2026 (Europe/Zurich). Tracking #1047; parent #1046.
Base actual main d31a16afdac5e97d4b02f4cb5824f5adc290577c, tree df19ecca084c0ee9d4fc0b22314f2254f86e743a, mode NORMAL. Dedicated branch docs/v2-s0-travel-days-contract-1.
Single writer **Jetnity V2 Travel Days and Transfers Contract 1 — Cursor Generation 1**. Actual Cursor Cloud run-info originalModelName MUST be grok-4.7-high-fast, NO Auto/fallback; prove session URL/name/model BEFORE substantive work. No duplicate writer.

## Purpose / scope **READ-ONLY SOURCE CONTRACT DECISION**, NOT implementation
Work independently tested four synthetic Guest trips in Production on product tree b5e0532 (new main is CI-only change). F01: existing 7 calendar days with unknown day→stage ownership, two stages, direct stage duration edit 3+4 proposed **14** days. Source: components/trips/ReiseAenderungManuell.tsx adds desired stage days to existing unassigned total; lib/reiseaenderung/anwenden.ts inserts positive delta. No automatic loss; editor operation means duration change, not reassignment. User additionally requests 22-day case: day1 planned outbound, day22 planned return, shared travel+destination events same date and cross-midnight legs; chronological order. This user example is a **requirement, not independently verified Account Trip bug**.

Read/trace existing models Trip/TripDay/TripStage/TripItem, dayStageAssignmentMode; exact guest and account actions and RPC reise_aendern; stage/day identity, bookings/commit policy; old TW6 truth and R109 initial allocation. Determine whether **allocating already-existing day IDs** (without any day inserts/deletes or false stage dates) can be saved via CURRENT accepted first-party authority for Guest AND Account. If Account lacks supported RPC, say ACCOUNT BLOCKED, propose independently owner-gated server/SQL contract; NEVER issue SQL or fake a write.

Design ONE deterministic, user-facing chronology from original days sorted by dayIndex/date; users designate outbound, transfer, return and/or destination stay without exclusive-day enum. A day can have transfer+stay/activities. Overnight flight can span two existing dates when actual known times permit, never create a duplicate day. Null stage + explicit travel event is not treated as "nothing planned"; null stage without event remains undecided. Never infer user purpose from null stage alone, nor manufacture flight/hotel bookings/destination assignment.

Night accounting: N dated calendar days have N-1 overnight intervals (unless unknown bounds): categories chosen/booked stay, explicit evidenced travel-night, unresolved. Travel label alone is insufficient to mark accommodation covered. Keep user provenance, timezone unknown if not known, local timestamps and async/identity safety. Distinguish stage duration from travel-day labeling; no change to actual content/booking flags without explicit command.

## Exact permitted outputs / forbidden writes
ONLY add task-owned report/status/handoff/decision docs:
docs/JETNITY_WORK_V2_S0_DAY_TRAVEL_CONTRACT_1_{PLAN,DECISION,STATUS,HANDOFF,SELF_REVIEW}_2026-10-27.md.
DO NOT modify any product TS/TSX, schema, SQL, Auth, CI, site indexing, routing, logs or provider. This contract precedes any Agent code on F01/N12.
Report a path ownership matrix, read vs write, Guest/Account evidence, feasible code-only UI slice(s), any precise Owner-special gate with STOP, rejected alternatives, 22-day synthetic acceptance scenarios, 7→7 vs explicitly 7→14, N-1 overnight truth and remaining unknowns.
Issue #1048 S1 owns lodging source files concurrently; S0 is docs-only and must NOT edit S1 paths. #1049 S2 owns personal-preparation and #1050 S3 guest CTA/nav; #1043 owns Activities/GYG only. No conflict.
No private user data, no personal browser/CUA, no hosted Supabase truth readback #917, no #985/#982, no provider contact/payment/cost, noindex. Budget overall USD100/month.
Publish PLAN, exact original model/session, original main/mode, documented findings in same Draft PR and honest CI/Preview. Do not mark Ready; do not merge; do not start a follow-up slice; STOP for independent TL review.