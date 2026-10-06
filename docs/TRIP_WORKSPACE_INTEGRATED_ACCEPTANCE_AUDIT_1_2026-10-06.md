# Trip Workspace integrated acceptance audit after B01/B03/U02/U03 1

Date: 6 October 2026. Issue #869 / Draft PR #871. Codex Desktop, single audit writer.

**Overall: FAIL for unrestricted integrated product acceptance.** The four merged slices work in their bounded data/navigation contracts, but current flight coverage can assert the wrong itinerary is the required flight. Authenticated Account E2E remains **NOT_VERIFIED**. This is an audit, not an implementation or release approval.

## 1. Live reconstruction and product standard

- Live `origin/main`: `9adfc04ffe90693dedc059f07a396751a0625157`, re-fetched during the audit.
- Audit checkout/task seed: `640cb7c112343a0ac749c4e820779a34347ce91a`; merge-base is that main; seed ahead/behind = 1/0.
- Mode: **NORMAL**. No activation authority follows from this.
- TASK blob: `258c058187bec13f48d7fd6814dbadca219bb04b`, unchanged.
- #751 live body confirms the Codex execution lane, parallel docs-only slices, and no F8/DB/provider/Production ownership.
- #832/#833, #836/#837, #840/#841, #846/#847 were re-read live. Merges: `4242da13`, `90cd9eb2`, `8fc0e140`, `96110294`, respectively; all are ancestors of audited main.
- Binding differentiation doctrine, both the general Build Order and the later V1 Critical Build Order were read. The latter qualifies older broad sequencing; neither authorizes a follow-up here.
- Premium workspace, preparation, navigation and manual completion reports are historical context. Their earlier green runs are not counted as this audit's executed checks.

Live receipts: [live-reconstruction.json](evidence/trip-workspace-integrated-acceptance-audit-1/live-reconstruction.json). Audited source blobs: [provenance.json](evidence/trip-workspace-integrated-acceptance-audit-1/provenance.json).

The product test is **Planen → Entscheiden → Reisebereit sein**. The four-mode shell and explicit unknown states support that progression. The P1 below undermines it: a date coincidence becomes evidence that a required part of the journey is covered. Removing that false confidence strengthens the coherent travel-truth layer; adding planner breadth would not.

There is no claim that the current product supplies live commercial or official requirements truth. Provider absence is an intentional gate, not a request to activate it.

## 2. Method and evidence boundaries

1. Existing focused tests and audit scripts first.
2. Real Next.js 16.3.8 development render on loopback `127.0.0.1:3487`.
3. Existing `/ui-audit/trip-workspace` for shared UI/navigation, plus the actual `/reisen/trip-integrated-audit-869` Guest page with real Guest persistence callbacks.
4. Synthetic local trips only. No real user, provider offer, price, availability, official source or positive Official Truth was supplied.
5. Custom browser harnesses abort external origins, all `/api/` requests and all non-GET requests. Their recorded blocked-request arrays are empty: no such requests were attempted.
6. No real account cookies or credentials. The Guest render requires the existing client factory to receive syntactically usable configuration; deliberately nonfunctional `http://127.0.0.1:9` and `local-audit-placeholder` were used. This is not authentication and does not bypass an Account gate.
7. Account actions/page orchestration were exercised by existing tests with mocked Auth/RLS/DB transport; shared UI can display an Account-style fixture. Neither is authenticated E2E.
8. Chromium/Chrome viewport emulation, not physical devices. Root-font 200% is text scaling, not native browser zoom, OS text scaling or Safari/iOS keyboard behavior.
9. Full production build, hosted Preview acceptance, hosted DB/RLS, physical hardware and actual screen-reader speech were not executed.

One mistakenly broad test command also selected four local PostgreSQL fixtures. Each failed at missing `/usr/lib/postgresql/16/bin/initdb` before a database could start. No DB was provisioned, queried or mutated. The command, failure and recovered complete TAP are retained, not hidden: [broader-attempt.txt](evidence/trip-workspace-integrated-acceptance-audit-1/broader-attempt.txt), [broader-attempt.log](evidence/trip-workspace-integrated-acceptance-audit-1/broader-attempt.log).

## 3. Acceptance matrix

PASS means the specifically stated layer was proved, not a global release gate. PARTIAL means useful coverage exists but an identified limitation or defect remains. NOT_VERIFIED is not a pass.

| Area | Classification | Fresh evidence / limitation |
| --- | --- | --- |
| Authenticated Account Trip open/load/save/reload end to end | NOT_VERIFIED | No genuine session/test account/data; no DB access authorized. |
| Account page → exact Trip snapshot → canonical evaluations → KontoArbeitsbereich → TripWorkspace | PASS | B01 executable orchestration tests, full array identity and all peers; mocked page/Auth/transport. `trip-official-evaluations-server.test.ts:81–381`. |
| Account manual stay action | PARTIAL | Actual action module tested with mocked transport; exact item/trip/manual guards, date-only writes and refresh. Hosted save/recompute not verified. |
| Account manual flight action | PARTIAL | Actual action/airport reader with mocked transport; 1–4 segments, server canonicalization, compare-and-set, guarded write, refresh. Hosted airport lookup/save not verified. |
| Overview / Plan / Organize / Preparation shared navigation | PASS | 57 existing browser cases; additional real Guest transitions at all four target widths. |
| Item → visible Back / browser Back / Forward / Escape | PASS | Existing rendered cases preserve item/day/query and restore focus; direct/deleted/unplanned links included. Newly created Guest items return to day-1. |
| Gap / Attention → contextual return | PASS | Existing visible/browser/Escape gap cases plus exact traveller/section Attention targeting. |
| Guest manual stay create/edit/reload | PASS | Actual plan creation at 390/1440; actual stay edit at 360/390/768/1440; invalid equal dates rejected without a write. |
| Nights/readiness-presentation recompute | PASS | Guest unknown → 4/4 → 2/4 nights; overview changes from canonical graph. Domain tests cover unknown/partial/full/outside/overlap. This is planning coverage, not official clearance. |
| Guest manual flight create/edit 1–4 segments | PASS | Actual plan creation at 390/1440; save/reload at all four widths; four-segment cap and invalid connection rejection. |
| Exact local clocks / cross-timezone / date-line data | PASS | Earlier local arrival date and clock retained in itinerary; legacy unrepresentable end fields null; same-airport reverse connection rejected. No UTC instant/duration invented. |
| Flight coverage / required-section association | FAIL | F-01: date-only match makes NRT→LAX into Zürich→Florenz; two wrong flights suppress flight coverage Attention. |
| Post-save focus/result visibility when flight changes coverage bucket | FAIL | F-02: editor remount loses focus and success status; body/offset retained, mobile footer visible. |
| Direct-flight schedule readback | PARTIAL | F-03: data persists and editor restores it, but read-only flight card hides all segment dates/clocks for direct flights. |
| Manual-editor validation recovery | PARTIAL | F-04: invalid submit is safe but every input is marked invalid; focus remains on Save. |
| Preparation deep-link / section persistence / keyboard | PASS | Exact traveller, stale-ref fallback, repeated target and preserved disclosure state; Guest section reload at four widths. |
| B01 provider disabled/null fail-closed | PASS | Real state gate and null factory tests; Production hard-off and exception/timeout semantics tested. No active provider or live official result claimed. |
| No OfficialEvaluation persistence/cache side effect in B01 | PASS | Compute-on-read helper; dynamic page; no graph writes/localStorage/cache in this handoff; fresh snapshot recompute and no persistence tests. Browser Guest graph has no evaluation payload. |
| Guest IATA-only/null country/city | PASS | Exact persisted segment points checked after each 1–4 segment save at four widths. No country inferred from IATA. |
| No Account Official-Truth authority in Guest | PASS | Guest has no B01 prop/helper/API path; existing tests confirm boundary, browser requests/storage checked. |
| Four target viewports / page overflow / primary touch controls | PASS | All target-width measurements have zero page-horizontal overflow; owned primary controls ≥44px, inputs ≥16px at normal scale. Inline prose links are separately recorded, not automatically treated as button violations. |
| Cross-device overall accessibility and polish | PARTIAL | F-02/F-04/F-05 remain; no physical-device or screen-reader speech proof. |
| 30-day / six-stage trip | PARTIAL | Selected day 30 and long labels render at four widths without page overflow. Not an exhaustive maximum-size/performance or device audit. |
| 200% text | PARTIAL | Preparation and manual flight editor at four widths, plus existing premium 360px text case; no page overflow. Native date/time segment readability and true browser/OS zoom not fully verified. |
| F8 / real providers / live official sufficiency | NOT_VERIFIED | Explicitly outside this audit; not activated. |

Primary executed artifacts: [focused tests](evidence/trip-workspace-integrated-acceptance-audit-1/focused-tests.log), [additional tests](evidence/trip-workspace-integrated-acceptance-audit-1/additional-tests.log), [navigation](evidence/trip-workspace-integrated-acceptance-audit-1/navigation/result.json), [integrated Guest](evidence/trip-workspace-integrated-acceptance-audit-1/integrated-browser.json), [create flow](evidence/trip-workspace-integrated-acceptance-audit-1/create-flow.json), [targeted findings](evidence/trip-workspace-integrated-acceptance-audit-1/targeted-findings.json), [coverage reproduction](evidence/trip-workspace-integrated-acceptance-audit-1/coverage-repro.json).

## 4. Findings

### F-01 — P1 — A matching date falsely proves required flight coverage

**Status: FAIL.** A user enters NRT→LAX on 1 November into a trip whose required outbound section is Zürich→Florenz on 1 November. The UI says “Hinflug ausgewählt” and nests NRT→LAX under “Zürich → Florenz”. Marking that local item booked yields “Hinflug gebucht”. With two unrelated flights on outbound/return dates, `bereichStatus` becomes `belegt` and flight coverage Attention disappears.

Reproduced in the real Guest UI at 390×844 and 1440×900, and through the shared pure function both with null-country Guest points and explicit JP/US account-like fixture points. Account-like is synthetic input, not authenticated E2E.

Cause: [flug-abdeckung.ts:192](https://github.com/Jetnity/jetnity/blob/9adfc04ffe90693dedc059f07a396751a0625157/lib/trips/flug-abdeckung.ts#L192) filters only `startsOn === abschnitt.date`; lines 193–197 promote the unique match. No route endpoint/trust proof is consulted. [arbeitsbereich.ts:112](https://github.com/Jetnity/jetnity/blob/9adfc04ffe90693dedc059f07a396751a0625157/lib/trips/arbeitsbereich.ts#L112) promotes aggregate coverage; [attention.ts:662](https://github.com/Jetnity/jetnity/blob/9adfc04ffe90693dedc059f07a396751a0625157/lib/trips/attention.ts#L662) suppresses the coverage hint when `belegt`.

Evidence: [wrong outbound selected](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-false-outbound-selected.png), [wrong outbound booked](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-false-outbound-booked.png), [coverage-repro.json](evidence/trip-workspace-integrated-acceptance-audit-1/coverage-repro.json), [two-flight impact](evidence/trip-workspace-integrated-acceptance-audit-1/coverage-impact.json).

The booking mark itself is an honest user declaration about that item. Its attribution to a different required journey section is false. This is planning truth corruption, not a demonstrated OfficialEvaluation authority leak.

### F-02 — P2 — Flight reclassification drops save feedback and focus

**Status: FAIL.** Saving a route with a date that moves it between `unzugeordnet` and a required-section card remounts the editor. After save the active element is BODY, the success status is absent, and the viewport can remain beyond the result. At 390px the result can be above the sticky return bar and the footer dominates. Simple saves that keep the same bucket preserve focus/status; the targeted control case proves this is conditional.

Code: local editor state and immediate focus in [FlugBestand.tsx:45–83](https://github.com/Jetnity/jetnity/blob/9adfc04ffe90693dedc059f07a396751a0625157/components/trips/FlugBestand.tsx#L45); separate keyed parents at lines 211–274. Guest replaces canonical graph after save at `GastArbeitsbereich.tsx:157–168`.

Evidence: [coverage-repro.json](evidence/trip-workspace-integrated-acceptance-audit-1/coverage-repro.json) `runs[].afterSameDaySave/afterDateMovesToUnassigned`; [390px reclassification](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-save-reclassification-focus.png). The broader 1→4→1 flow also reproduces this at all four widths: [390px footer after save](evidence/trip-workspace-integrated-acceptance-audit-1/integrated/390-dateline-saved.png). Data was retained; loss of data is not claimed.

### F-03 — P2 — Direct-flight local schedule is hidden in the read view

**Status: PARTIAL.** The stored direct flight NRT→LAX has exact departure 2026-11-02 23:30 and arrival 2026-11-01 12:00. Its flight card shows only route and “Direktflug”; no read-only segment-time disclosure exists. Reopening the editor reveals the correct values. Multi-segment disclosure shows them.

Code: [FlugRoute.tsx:42](https://github.com/Jetnity/jetnity/blob/9adfc04ffe90693dedc059f07a396751a0625157/components/trips/FlugRoute.tsx#L42) gates the entire time-bearing disclosure on `!sichtbar.direkt`; exact-time renderer is lines 78–82. `FlugBestand.tsx:219–221,252–256` relies on that component.

Evidence: [targeted-findings.json](evidence/trip-workspace-integrated-acceptance-audit-1/targeted-findings.json) `runs[].readView.bodyText/multiReadText`; [390px direct read view](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-direct-read-view.png). Reproduced at all four widths. No incorrect clock conversion was found; the issue is discoverability/readback.

### F-04 — P2 — Invalid manual route gives no field-level recovery

**Status: PARTIAL.** With four valid segments except the first empty IATA input, submit marks all 24 inputs invalid, keeps focus on “Speichern”, and leaves the actual problem several screens above on mobile. Correcting the one input leaves all 24 `aria-invalid` values until another submit. A general alert does not identify each field. Stay uses the same all-fields flag pattern for two inputs.

Code: `FlugBestand.tsx:69–73,125–134`; `UnterkunftBestand.tsx:155–159,209–224`. This fails the existing `DESIGN_SYSTEM.md:243–251` field-error/focus contract. Schema paths already exist at `lib/trips/schema.ts:676–690`; no schema expansion is implied.

Evidence: [targeted-findings.json](evidence/trip-workspace-integrated-acceptance-audit-1/targeted-findings.json) `invalidFirstOfFour` and `afterCorrectionInvalidCount=24` at all four widths; [390px validation](evidence/trip-workspace-integrated-acceptance-audit-1/targeted/390-four-segment-error.png). Invalid data is correctly refused; this is recovery/accessibility, not a persistence bypass.

### F-05 — P3 — Accessible Attention names expose internal state tokens

**Status: PARTIAL.** The accessibility tree names include “unknown” and “insufficient_context” after German user-facing messages. These are internal machine states, not helpful spoken explanations.

Code: [TripWorkspaceJetztWichtig.tsx:146](https://github.com/Jetnity/jetnity/blob/9adfc04ffe90693dedc059f07a396751a0625157/components/trips/TripWorkspaceJetztWichtig.tsx#L146), `<span className="sr-only">{punkt.lage}</span>`.

Evidence: [integrated-browser.json](evidence/trip-workspace-integrated-acceptance-audit-1/integrated-browser.json) `runs[].accessibilitySnapshot`, observed at all four widths. Actual screen-reader speech was not tested.

### V-01 — P3 — Existing premium audit selector predates contextual return labels

This is an audit-maintenance finding, not a demonstrated navigation failure. The unchanged premium script fails waiting for “Zurück zur Reise” at `scripts/trip-workspace-premium-experience-3-audit.mjs:421`; U02/U03 intentionally supplies “Zur Organisation”. The current navigation script and Guest flows pass that return behavior.

Evidence: [premium-local/audit.json](evidence/trip-workspace-integrated-acceptance-audit-1/premium-local/audit.json), one reported error / 12 measured viewport steps. The first run was interrupted at Guest rendering without placeholder config and has no final result; retained screenshots are partial evidence only. The second run completed with the single stale-selector failure. Neither is labelled PASS.

**Severity inventory: P0 = 0 observed; P1 = 1; P2 = 3; P3 = 2 (one product, one audit maintenance).** Coverage gaps below are not fabricated defects. “0 observed” is not exhaustive security certification.

## 5. One next bounded slice

**Recommendation: `TRIP_WORKSPACE_FLIGHT_COVERAGE_PROOF_GUARD_1` — Trip Workspace flight coverage proof guard 1.**

- **User problem:** a traveller can be told the required outbound/return flight is selected or booked even when the actual saved route is unrelated. The corresponding Attention can disappear.
- **Differentiation Impact / Enabler Justification:** protect the link between the real trip graph, contextual decisions and readiness. This makes the travel-truth layer reliable; it adds no generic planner feature.
- **Smallest boundary:** stop date coincidence alone from minting required-section coverage. Keep the item and its user booking status. Match a required section only when existing canonical route/endpoint facts positively prove that association; otherwise preserve unassigned/unknown state. If current facts cannot prove a positive mapping, the safe outcome is unknown, not a new resolver or guessed IATA/city/country.
- **Likely changed files:** `lib/trips/flug-abdeckung.ts`, `lib/trips/flug-abdeckung.test.ts`; focused regression cases in `lib/trips/arbeitsbereich.test.ts`, `lib/trips/attention.test.ts`. Read-only contracts: `types/trips.ts`, `lib/route/domain.ts`, `lib/route/ableitung.ts`, existing canonical route identity/chronology helpers. Expand the runtime allowlist only if the TL proves that a consumer actually needs a bounded correction.
- **Acceptance cases:** same date/wrong route; same date/null-country Guest; legacy no-route items; ambiguous duplicate flights; two wrong flights cannot yield `belegt` or suppress Attention; proven positive route coverage; booked status cannot create association proof; date-line/local clocks unchanged; Account/Guest use one projection.
- **Gates:** fresh TL task/allowlist and exact-head review; explicit route-to-section proof contract using only existing trusted facts; relevant deterministic tests plus local 390/1440 UI evidence. Real Account E2E remains a separately recorded coverage gate where credentials/data/authorization exist.
- **Independent of F8/provider activation:** **yes**. This is a pure read projection over existing facts. It requires no provider, DB query/schema, Auth/capability, Official Truth, F8 or Production action.
- **Excluded:** F-02/F-03/F-04/F-05 fixes, new assignment UI, search, new airport/geography lookup, packing/social/AI breadth and global continuity edits. These findings are retained for TL prioritization, not bundled into this smallest slice.

No alternate recommendation is made. This audit did not start the recommendation.

## 6. Remaining coverage gaps

- Genuine authenticated Account open/save/reload, real server airport lookup and Account error/race behavior over live transport: NOT_VERIFIED.
- Physical 360/390 devices, iOS Safari/Android keyboard, screen-reader speech, browser-native 200% zoom and OS scaling: NOT_VERIFIED.
- Runtime performance/load on maximum-size trips, multi-tab Guest concurrency and all traveller/document combinations in a real browser: not exhaustively verified; existing unit coverage is separately attributed.
- Full production build and hosted Preview on the delivery head: not executed for this docs-only audit.
- No live Official Truth, F8, provider availability/pricing or Production acceptance.
- Local browser success cannot close any of those gates.
