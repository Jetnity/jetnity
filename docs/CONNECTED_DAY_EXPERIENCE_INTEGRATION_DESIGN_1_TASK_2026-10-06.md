# Connected Day Experience integration design 1 — Task

Date: 6 October 2026
Issue: #886
Repository: Jetnity/jetnity
Baseline: `main@fc2734ca60ae3c578fbcd414055fe983773d74d2`
Branch: `docs/connected-day-experience-integration-design-1`
Execution lane: Codex Desktop
Parallel-safe docs-only with #884/#885/#887.

## Objective

Design the connected operational day experience around Jetnity's Trip Timeline.

This layer should connect the Reiseplan to facts already present elsewhere in the Travel Operating System without turning the timeline into a noisy dashboard.

Design only:
- booking state;
- Preparation/Readiness;
- day map / route;
- weather context;
- opening hours / reservation windows;
- day cost;
- Change Impact.

Do not implement or activate external providers.

## Required principles

- One Trip graph; no shadow itinerary.
- Stored user truth, verified external fact, estimate and suggestion remain visually/semantically distinct.
- Missing data never becomes a green success state.
- External facts need source/freshness/provenance before they may affect decisions.
- Recommendations never silently reorder/change the itinerary.
- Smartphone is the primary interaction surface; desktop must remain professional.

## Required design

Define:

1. **Day item status composition**
   - planned/selected vs explicitly booked;
   - confirmation missing;
   - avoid conflating plan presence with booking.

2. **Preparation/Readiness bridge**
   - which existing readiness/OfficialEvaluation/Preparation signals can appear inline;
   - severity/deduplication;
   - exact deep-link target back to Preparation;
   - no Official Truth fabrication.

3. **Day map / route**
   - minimum location proof needed to place a pin;
   - stage/place coordinates vs user-entered free text;
   - route order follows timeline presentation but does not become new graph truth;
   - routing/travel-time provider is optional future dependency, not assumed.

4. **Weather**
   - source/freshness/location/time requirements;
   - advisory only;
   - outdoor relevance must be explicit or conservatively unknown;
   - never auto-move activities.

5. **Opening hours / reservation windows**
   - distinguish verified venue hours, reservation time and user note;
   - confidence/source display;
   - no broker/search snippet treated as hard truth.

6. **Daily cost**
   - stored confirmed/selected price;
   - estimates separately labeled;
   - currency handling and no silent FX;
   - relation to future True Trip Cost.

7. **Change Impact**
   - dependency edges from flights/stays/transfers/activities/readiness;
   - “3 Punkte betroffen” style summary;
   - no cascading mutation without confirmation;
   - stale-result invalidation.

8. **Progressive disclosure**
   - what belongs directly in timeline row;
   - day-level summary;
   - detail drawer/page;
   - avoid warning/icon overload.

9. **Source/provenance model**
   - for each connected feature specify source class, freshness, failure state and UI fallback.

10. **Provider/plugin boundary**
    - what can work with current Jetnity data;
    - what later requires maps/weather/opening-hours/commercial APIs;
    - no paid call or secret assumption.

11. **Cross-device contract**
    - 360/390/768/1440;
    - one-handed mobile;
    - map must not dominate small screens.

12. **Adversarial matrix**
    - stale weather, closed venue with stale hours, missing coordinates, mixed currencies, cancelled booking, changed flight, provider outage, partial readiness, offline/no-network.

13. **Reconciliation**
    - #884 and #885 are parallel; document abstract interfaces and an explicit reconciliation checklist against their merged contracts before runtime work.

## Required recommendation

End with a staged implementation sequence after Timeline Core + the necessary Timeline Intelligence contract, identifying which pieces can run without any new provider.

## Allowed files

TASK immutable:
- `docs/CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_TASK_2026-10-06.md`

Create only:
- `docs/CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_2026-10-06.md`
- `docs/CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_REPORT_2026-10-06.md`
- `docs/CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_HANDOFF_2026-10-06.md`
- `docs/CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_SELF_REVIEW_2026-10-06.md`

## Non-scope

No runtime.
No provider/API activation or paid call.
No DB/Supabase.
No map/weather/opening-hours live data.
No Official Truth/F8 mutation.
No global continuity edit.
No follow-up.

## Delivery

Repository-grounded design, commit + push, stay Draft.
Report exact head, merge-base/ahead/behind, files, TASK blob, risks and Codex session/model.

Classification:
- `CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_READY`
or
- `CONNECTED_DAY_EXPERIENCE_INTEGRATION_DESIGN_1_NOT_READY`

STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.
