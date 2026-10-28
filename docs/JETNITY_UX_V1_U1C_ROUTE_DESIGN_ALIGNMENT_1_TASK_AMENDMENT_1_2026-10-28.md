# U1-C TASK V1 — Technical Lead amendment 1 and implementation acceptance

28 October 2026, Europe/Zurich. PR #1082, tracking #1081. This adds to, and does not rewrite, immutable TASK V1. The original Work references remain unchanged.

## Independent plan review
Reviewed exact plan head `57f3207f28375ed0d96259592c37f265e5d2f1df`, tree `129fd4e84fd97d6d22d76091cdbd8f3e80503378`, baseline/main `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc`.
Read full PLAN and STATUS, inspected all five PR paths (task, two references, plan, status); no runtime change at the reviewed plan head.
Actual Cursor session is linked by cursor[bot]: `bc-4904589f-a8f0-4106-a65a-507bc53e084a`. Model `grok-4.7-high-fast` and rename read-back are author-reported from cursor-cloud run-info, not independently queried by TL. The reported UI name differs from the exact assigned logical name. Correct it to **Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1**, then read back and record. No new session.

Verdict: **PLAN ACCEPTED WITH THIS BOUNDED AMENDMENT; implementation may begin in the same session after reading this commit.** This is neither implementation acceptance nor Ready/Merge/Production approval.

## A — Presentation tests
Approved to edit only these additional existing test files to replace obsolete all-day-chip and duplicate-summary expectations with equivalent or stronger behavior checks:
- `lib/trips/n12-chronology-1/laeufe.test.ts`
- `lib/trips/n12-chronology-1/browser.test.ts`
- `lib/trips/trip-plan-premium-experience-4.test.ts`
- `lib/trips/ux-u1b-route-detail-1/browser.test.ts`

All day IDs must remain reachable through visit selection and day selection; all 22 days must be traversable. Preserve chronology, six item kinds, no-day, drafts, invalid IDs, history and no-passive-provider-request assertions. Do not weaken tests simply to obtain a green run. Runtime N12 readers remain read-only. If a harness outside the existing allowlist truly needs an edit, identify the exact edit before extending scope.

## B1 — Selectable existing connections
Approved additional runtime path `lib/trips/workspace-mode.ts` and corresponding `lib/trips/workspace-mode-2.test.ts` for one optional plan query key `kante`, using an existing canonical internal connection ID only. This is a presentation selection, not persisted travel intent and not a booking/search parameter.
- Validate against the live canonical edge AND live adjacent N12 destination-run pair on every read/change.
- Only `art === connection`. Reject outbound, return, arbitrary, removed and no-longer-adjacent edges.
- **Uniqueness is mandatory:** a stage-pair edge ID can occur at multiple run boundaries if the same stage IDs recur non-contiguously. A single `kante` cannot identify these different occurrences. If more than one live adjacent run pair matches the same edge, do not arbitrarily choose first/last or reuse one date/booking for both. Keep those rows honest and non-selectable with a concise ambiguity explanation; keep each visit independently selectable. Add a repeated A→B→A→B same-stage-ID fixture as well as repeated city names with distinct stage IDs.
- Invalidated selection must give an observable unavailable-section message without silently substituting another edge/visit. Sanitizing the URL must not erase the reason before the user can see it. Preserve an existing return day if valid.
- Test reload and back/forward, unknown value, stage reorder/removal, day removal and editor drafts. No second selection store or shadow route model.
- Existing planned/booked markers are user-plan state, not provider confirmation. Use labels such as “als gebucht markiert” where appropriate.
- A stored local-time difference is not automatically a verified real elapsed travel duration. Keep null unknown; if exposing existing duration, identify its actual basis rather than upgrading certainty.
- No scoped Organisieren handoff is claimed in this slice. If a generic navigation link is useful, label it honestly as opening all connections; no automatic query/provider call and no fake context-bearing CTA. #1068 remains queued.

## C — Destructive options placement
Approved two additional paths:
- `components/trips/GastArbeitsbereich.tsx`
- `components/trips/KontoArbeitsbereich.tsx`

Only split the already existing destructive action into the optional `reiseoptionen` slot. Keep save errors/storage status visible. Preserve existing confirmations, routing, handlers and storage calls verbatim in behavior. Native accessible disclosure, no nested interactive button inside its summary. No account-write test on Production.

## D — Continuity
Approved `docs/ACTIVE_WORK_STATUS.md` for a concise active-writer/task/PR pointer only. Preserve unrelated owners, holds and prior evidence. The canonical #751 handoff remains authoritative. Do not rewrite global continuity or claim later gates passed.

## Additional acceptance details
- Planned-day formatting must not fabricate a continuous date span when actual assigned day dates are missing, invalid, duplicated or discontinuous. Use a truthful list/ranges/count/unknown presentation; no implicit hotel nights or arrival/departure inference.
- Use existing public brand/theme. Preserve the already-built four modes, measured layout and compact header. Do not style from the dark screenshot alone.
- BackToTop clearance reads the live fixed bottom navigation, including resize/text changes. If fixed-nav measurement is unknown, hiding is acceptable. Do not double-add safe-area padding and do not alter non-Workspace behavior. Add actual hit-test and intersection evidence.
- Add before/after screenshots for the same reference fixture at desktop and mobile, including 200% root text. Record actual method; root text is not browser zoom or physical-device acceptance.
- Keep the original duration/allocation behavior as separate triage, not an opportunistic domain fix.

## Author delivery
Same Cursor session only. Re-read updated branch after this TL commit. Record baseline/head/tree and exact write set. Update plan/status for this acceptance without rewriting immutable TASK or this amendment. Implement, run meaningful focused and required checks, self-review and deliver exact-head REPORT/SELF_REVIEW/HANDOFF with sanitized browser evidence. Then STOP for independent TL review. Same-session fixes only.

No Ready, merge, manual deployment, next slice, provider activation, Auth/DB/config/secret changes, no lifting special PO/STOP/HOLD gates. #1067 broader acceptance, #1068, F01 and provider gates remain open. Noindex and <=USD100/month unchanged.
