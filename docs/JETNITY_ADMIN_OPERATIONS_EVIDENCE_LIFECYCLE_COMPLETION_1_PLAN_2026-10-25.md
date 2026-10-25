# Jetnity Admin Operations Evidence Lifecycle Completion 1 — PLAN

Date: 2026-10-25
Status: PLAN R1 correction after TL PLAN REVIEW V1. Still plan only. No implementation authorization.
Author: **Jetnity Admin Operations Evidence Lifecycle Completion 1 — Cursor Generation 1**
Lane: R106 **O**. Tracking #1004. Finite batch #1003. Canonical index #751.
Branch: `feat/r106-admin-operations-evidence-lifecycle-1`
Draft PR: #1007
Immutable TASK V1: `docs/JETNITY_ADMIN_OPERATIONS_EVIDENCE_LIFECYCLE_COMPLETION_1_TASK_V1_2026-10-25.md` (byte-identical; not edited here)

## Session and model

- Logical name: **Jetnity Admin Operations Evidence Lifecycle Completion 1 — Cursor Generation 1**
- Cursor session: `bc-5996ba4c-88a4-4a2d-b1ce-d7f1a0e4d79d`
- Session URL: https://cursor.com/agents/bc-5996ba4c-88a4-4a2d-b1ce-d7f1a0e4d79d
- Actual model: `grok-4.7-high-fast` (`originalModelName` on this run). Requested Grok 4.7 High Fast. No Auto fallback and no other model.
- Visible UI rename was supported on this run and was applied to that exact logical name. This paragraph is the author attestation. It is not an independent Technical-Lead observation of the Cursor UI.
- Node `v22.23.4`.

## Live read

- Operating mode re-read this session: `NORMAL` (`.jetnity/operating-mode.json`). This bounded admin read-only lifecycle is allowed. Special Product-Owner gates stay in force. This plan does not cross one.
- Live `origin/main` fetched this session: **500fbe40c8c8a70a0fe0d291782289f809d5d5b3**. Merge-base with the reviewed head is that same SHA.
- Seed HEAD **8f6ccf4b2da16795a9ad412c845bd4a1ec88e8b4** was 1 ahead / 0 behind, TASK only. Reviewed PLAN V1 head **83978aaf6cabafe7788bf91658016ca1d8401b22**, PLAN blob **da7f50885ce7bd2fde84c97967e4c4d6a5d67979**, was 2 ahead / 0 behind. TASK blob **e75d3010d861e4047a18f282e5fa03bd74f181dc** stays unchanged.
- This revision answers TL PLAN REVIEW V1 (O-PLAN-01 through O-PLAN-05) on that exact head. It still does not authorize product or test code.
- Board blobs match the task: `SystemHealthBoard.tsx` **bddb6b4fefbe1370ab9721e525a22dd8647049ec**, `ProviderOpsBoard.tsx` **4c16a0d57aaa387247575da8b69bfb49fd4e9360**.
- #751 [TL precheck 6392318194](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6392318194) and #1003 assign this lane O, integration **O → A → T**, first delivery PLAN ONLY. R105 authors stay STOP. Older dated handoffs in `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` were read as history. They do not override #751, #1003, or this fetched main.
- V1 binding build order §9 asks for Admin incident / provider / cost visibility and explicitly does not require full Admin D–K before V1. ADR-0159 and ADR-0162 keep both boards read-only and non-fake-green. This plan stays inside those decisions.
- Startup, Technical-Lead/Cursor operating standard, multi-agent operating and slice-planning standards, continuity and product-quality standards, and the three-phase order were read. No sibling branch is merged, cherry-picked, or rebased.
- Standing exclusions stay binding: #985/#982 HOLD, #917 denied hosted readback, #913/#911 block, #968 PAUSED, #748 CUA SUSPENDED, #626 STOP, #937/#936 PAUSED, Bern #934 HARD-BLOCKED, and the other task exclusions. No hosted database, personal browser, legacy Preview, credential, provider, payment, or launch action.

## Traveller context

Not relevant. These boards show process, platform, provider-foundation, and model-usage evidence. They do not read citizenship, travel documents, residence, or route eligibility. No new identity field.

## Source-confirmed gaps

Read, not yet reproduced in a mounted browser. Both boards (`SystemHealthBoard` lines 109–128 and `ProviderOpsBoard` lines 134–153) do the same thing:

1. `useState(anfang)` commits the server prop with no runtime check. A later render of the same prop is not distinguished from a new prop.
2. Refresh is `fetch(endpunkt, { cache: 'no-store' })`, then `res.json()`, then `setBericht(json as Bericht)`. `!res.ok` throws `json?.message || json?.error` or a German fallback. Malformed JSON becomes `null`, so a 401/403 loses the status and falls through to the generic sentence. `lade()` in `lib/admin/ladezustand.ts` already keeps 401/403 meaning when the body is unreadable, but its `Fehler` result does not retain `status`. The boards do not call it.
3. `laeuft` is React state. The guard `if (laeuft || !aktualisierenErlaubt) return` is not synchronous. Two clicks before paint can start two GETs. `finally` always clears `laeuft`, so an older request can clear a newer pending flag.
4. There is no generation, endpoint, prop revision, permission epoch, or unmount token. A late success or error can still call `setBericht` / `setFehler`.
5. Every failure, including 401/403, keeps the previous cards and says the previous stand remains. The task requires a current 401/403 to suppress protected cards.
6. `freshness` on the accepted object is never aged. A local tick cannot happen. Unknown and stale also cannot be protected from a later local reinterpretation, because nothing local owns age today.
7. `wendeEvidenceAlterAn` in both `bewertung.ts` files recomputes every child with `berechneFreshness({ checkedAt: item.checkedAt, ... })`. `berechneFreshness` uses `Math.max(0, now - checkedAt)`, so a future parent timestamp becomes age 0. Collectors are frozen. `sammeln.ts` for both domains already calls `wendeEvidenceAlterAn` on a cache hit inside the 30-second cache. This client plan must not call that helper in a way that replaces a larger child age with a smaller one.

Adjacent contracts that stay true and must stay visible:

- `healthKarteIstGruen` is `status === 'healthy' && freshness.state === 'fresh'`. Parent `app` is `unknown`. Parent `supabase` is `not_configured`. Process success is not deployment health. An `airports` read is not Supabase platform health.
- Vercel, GitHub, and Infomaniak without a management source stay `not_configured` or the fixture's explicit `unknown`/`stale`. `istUeberzogenerGesamtClaim` forbids a healthy parent `app` or `supabase`.
- `providerOpsKarteIstGruen` is false for `provider-ops`, `kill-switch`, `cost-guard`, and `model-usage`. Those parents stay `foundation_only` or the model-usage status. Empty model usage is not 0 USD. The board copy already says the last 30 days and at most 200 rows, and that cost coverage is incomplete.
- `writeActions` is typed as `[]`. Both collectors emit `[]`.
- TTL ceilings in the frozen maps: app/supabase 60s, vercel 120s, github/infomaniak 300s; provider-ops/kill-switch/cost-guard 60s, model-usage 120s. Stale means `ageMs > ttlMs`. Age equal to TTL stays fresh (`freshness.ts`).
- The provider audit fixture (`lib/admin/provider-ops-board/fixtures.ts`) stamps model-usage with `ttlMs: 60_000`, which is under the 120s contract ceiling, not above it. Validation must accept that fixture. Exact equality with the map would reject a legal current audit page.
- The system-health audit fixture uses `checkedAt` `2026-08-24T03:00:00.000Z` with several `fresh` / `ageMs: 0` nodes, and Infomaniak `stale` at age `3_600_000`. Status `unknown` is not freshness `unknown`. The app card is status `unknown` and freshness `fresh`. Those axes stay independent.
- Existing source tests only assert that the board files contain the API path constants and the label maps, and that they do not contain management URLs, write methods, or token names. Pages and routes stay behind `requireAdminPage` / `requireAdminApi` with `betrieb-lesen`. Those files are frozen.
- `npm test` is `node --test` over `lib/**/*.test.ts` plus two script globs. There is no jsdom or happy-dom dependency. `react-dom/server` cannot run this hook, these timers, or a second click. Playwright and esbuild-via-tsx already exist; the planning-creation harness is the local pattern. No package is added.

## Ownership

Allowed implementation writes, after Technical-Lead plan acceptance in this same session:

- `components/admin/system-health/SystemHealthBoard.tsx`
- `components/admin/provider-ops/ProviderOpsBoard.tsx`
- `components/admin/operations/useOperationsReport.ts`
- `lib/admin/operations-read-lifecycle.ts`
- `lib/admin/operations-read-lifecycle.test.ts`
- `lib/admin/operations-report-validation.ts`
- `lib/admin/operations-report-validation.test.ts`
- `scripts/admin-operations-evidence-lifecycle-completion-1/**`
- `docs/evidence/admin-operations-evidence-lifecycle-completion-1/**`
- later, this lane's STATUS, REPORT, SELF_REVIEW, and HANDOFF only

`lib/admin/operations-evidence-lifecycle-ui.test.ts` is not added. The native runner has no DOM. A node test that skips the browser, or that only matches source text, would not be mounted proof. The mounted runner lives under the owned scripts prefix. Pure tests stay in the two `lib/admin` test files above.

Frozen, including no import that edits them: routes, pages, API handlers, collectors, `sammeln.ts`, both `bewertung.ts` / `freshness.ts` / `typen.ts` / fixtures, `lib/admin/ladezustand.ts`, `OperationsEvidence`, Security/Analyst/Admin shell, provider/S1/cost/model-usage contracts, Auth/capability/AAL/RLS/migrations, `lib/admin/security/refresh-reihenfolge.ts`. The security helper is a pattern only. This lane does not import it. Existing `system-health.test.ts` and `provider-ops-board.test.ts` stay unchanged if the boards keep `SYSTEM_HEALTH_API_PFAD`, `PROVIDER_OPS_BOARD_API_PFAD`, `HEALTH_STATUS_LABEL`, and `FRESHNESS_LABEL` and still contain no write method or secret. Global START_HERE, ACTIVE_WORK_STATUS, ROADMAP, central ADR, build order, mode, workflows, package, and lockfile stay Technical-Lead-owned.

Multi-agent: this writer is O only. T and A are other branches. No trip storage, account registry, or sibling cherry-pick. Integration remains O → A → T after separate Technical-Lead acceptance. A later main move waits for an explicit same-session sync instruction.

## Design

One client hook and two pure modules. The hook is the only `fetch`. The pure modules do not import React, `fetch`, collectors, or `ladezustand`. The hook calls the existing `lade()` so 401/403 text, network text, and unreadable-body text stay that helper's sentences.

### Validation

`operations-report-validation.ts` exports two interpreters, `deuteSystemHealth` and `deuteProviderOps`. Each throws on an invalid body. `lade()` turns that throw into "Die Antwort des Servers war nicht lesbar." and does not surface the thrown text. No default card is synthesized. No `as Bericht` cast remains.

A body is valid only when all of the following hold:

- It is a plain object with `checkedAt`, `items`, and `writeActions`, and no unexpected defined keys. `checkedAt` parses to a finite time. Future is allowed at this gate.
- `writeActions` is an array of length 0.
- `items` contains each required id exactly once: `app`, `vercel`, `supabase`, `github`, `infomaniak`, or `provider-ops`, `kill-switch`, `cost-guard`, `model-usage`. No extra id. Order is preserved.
- Each card has string `id`, `name`, `status`, `source`, `checkedAt`, `summary`, `proves`, `doesNotProve`, all non-blank. `status` is in that domain's existing enum. `checkedAt` parses. `detail`, when its value is a string, is kept. `sourceUpdatedAt`, when its value is a string on a health card, parses. A defined `sourceUpdatedAt` on a provider card is an extra key and is invalid.
- `freshness.state` is `fresh`, `stale`, or `unknown`. `ttlMs` is finite, greater than 0, and **not greater than** the frozen map value for that card id. A smaller positive TTL is accepted and is the TTL used later, so a payload cannot extend freshness. This accepts the provider audit fixture's model-usage TTL of 60s under the 120s ceiling.
- `fresh` requires a finite `ageMs >= 0` and `ageMs <= ttlMs`. `fresh` with a null age, or with `ageMs > ttlMs`, is invalid.
- `stale` requires a finite `ageMs >= 0`. It may be below or above the TTL. The client will not upgrade it.
- `unknown` requires `ageMs === null`.
- `checks`, when its value is an array, has unique check ids. Each check has the same required strings, a domain status, and a freshness value. A check TTL uses the parent card's contract ceiling. Checks have no `checkedAt` of their own. An empty array is valid.
- `metadata`, when its value is a plain object, has only `string` or `null` values.

Optional producer fields are `detail`, `metadata`, `checks`, and, on a health card only, `sourceUpdatedAt`. A value of `undefined` means absent. A missing key means absent. The interpreter reads that and does not delete the key, assign the key, or otherwise write the input object. JSON omits `undefined`, so the same report after `JSON.parse(JSON.stringify(...))` is the JSON form and must also accept. A required field that is `undefined` fails. An unknown key fails even when its value is `undefined`. `detail: null` and `sourceUpdatedAt: null` fail. `metadata` values may still be `null`.

This matches the frozen producers. `bewerteSupabaseAppZugriff` sets `sourceUpdatedAt` to `input.ping.sourceUpdatedAt` when `ping.ok` is true, and an ordinary `{ ok: true }` ping leaves that property `undefined`. `bewerteNichtKonfiguriert` passes `detail: grund.detail`, which is `undefined` when the caller omits it. `wendeEvidenceAlterAn` assigns `checks: item.checks?.map(...)`, so a card without checks gets `checks: undefined` rather than a missing key. Those objects are what RSC can hand the board. Validation accepts them and accepts the JSON form that drops those keys.

Status and freshness stay independent. `unknown` status with `fresh` freshness remains valid. That is the current app parent shape.

Initial props and a 200 body use the same interpreter. The hook passes props through `lade()` with a synthetic 200 response whose `json()` returns the same object, so an invalid prop uses the same unreadable sentence. That call is asynchronous. It gets its own run id and the same instance, endpoint, and permission epoch as a GET. Its success, failure, and `finally` write only while that run is still current. Until the current initial validation finishes, the board shows no cards and does not fetch.

### Age

The stored report is the accepted raw value. `checkedAt`, `sourceUpdatedAt`, `status`, `source`, `proves`, and `doesNotProve` are not rewritten. Display uses a copy. Beside the report, each parent and each check keeps its own age floor and its own non-fresh latch. Those live outside the raw object.

On accept, each node stores its original `state`, `ageMs`, and `ttlMs`, and the parent stores `checkedAt`. Elapsed for that acceptance starts at 0. The age floor starts at the original finite age. A null original age has no numeric floor and displays no age. A render, a tick, a failed request, a prop delivery, or a clock recovery does not create a new anchor. The only new fresh anchor is a new authoritative valid report: the current initial prop validation, or a later owned permitted successful GET.

An accept-time clock sample is usable only when `Date.now()` and `performance.now()` both return finite numbers. A missing clock, a thrown clock, `NaN`, or `Infinity` is unusable. A delta is usable only when it is a finite number and greater than or equal to 0. A negative delta, a non-number, `NaN`, and `Infinity` are unusable. Unusable samples are ignored for the floor. They never reduce it.

Elapsed high water is the max of the previous high water and every usable monotonic or wall delta. Display age for a node is the max of:

- the persisted age floor
- original finite age plus elapsed, when that sum is finite
- a hint age only when that hint age is finite and larger than the floor

The floor is then raised to that display age. It never falls. Original `unknown` keeps a null displayed age. Original `stale` and original `unknown` keep those states. Their meaning does not change. A child's own age and TTL stay that child's. A hint with a smaller age is ignored, so a child at 90s does not become fresh because the parent `checkedAt` is recent.

`wendeEvidenceAlterAn` may supply the hint. It is not written back onto the raw item. A hint state of `stale` or `unknown` can latch a node that is still `fresh`. A hint state of `fresh` cannot clear a latch and cannot replace a larger age.

Non-fresh latches:

- original `unknown` stays `unknown`
- original `stale` stays `stale`
- original `fresh` stays `fresh` only while it has not been latched and the display age is `<= ttlMs`
- display age `> ttlMs` latches `stale`
- an accepted hint of `stale` latches `stale`; an accepted hint of `unknown` latches `unknown`
- an unusable accept-time anchor, or a tick where both deltas are unusable before any safe elapsed exists, latches `unknown` on nodes that were still `fresh`
- validation already rejects an unparseable `checkedAt`. A parent `checkedAt` that parses later than a finite wall clock is untrustworthy, and so is a parent timestamp that cannot be compared because the wall clock is unusable. `Math.max(0, now - checkedAt)` is not used. That parent latches `unknown`. Every check on that parent latches non-fresh too: an originally fresh check latches `unknown`, and an originally stale or unknown check keeps its own state. Checks have no `checkedAt` that can rehabilitate the parent timestamp

A latch never moves back to `fresh`. `unknown` stays `unknown`. `stale` stays `stale`. Clocks becoming finite again, a wall rollback that shrinks the hint, and wall time later passing a future `checkedAt` do not clear it. The reviewed failure is this: original fresh, age 0, `checkedAt` 120s ago, TTL 60s, hint age 120s latches `stale` and raises the floor to 120s; a rollback that makes the hint 10s and `originalAge + elapsed < 60s` still displays `stale` at an age of at least 120s.

Because the audit fixtures' `checkedAt` values are in August 2026, the hint latches their authored `fresh` nodes `stale` on first paint on today's clock, and later clock movement does not restore `fresh`. Infomaniak is already `stale`. Status, claims, green flags, and the words the frozen audit scripts require stay. Those scripts are outside this allowlist. The product pages collect `checkedAt` at request time, so a live report is not stale merely because the fixture date is old.

Local aging reads no network. A one-second interval while the document is visible, plus `visibilitychange` and `pageshow`, recomputes the floor. Hidden time is applied when the tab returns, including a forward wall jump. No interval starts a GET.

### Request ownership

`operations-read-lifecycle.ts` owns a synchronous lock, an integer run id, a prop signature, the endpoint, a permission epoch, a mounted flag, and a denial latch. The hook applies that result. It does not decide ownership inline after an `await`.

The denial latch is report access, not the refresh-permission prop. `aktualisierenErlaubt === false` means this view must not start a GET. A 401/403 means the last authoritative read was denied. Those are different. Permission can stay true while the latch is set, and the latch can stay set while permission is false.

The latch is set only by an owned current 401/403, including a malformed body. It is cleared only by an owned current permitted validated 200 from an explicit GET. Props, rerenders, invalid props, 503, network failure, invalid 200, endpoint change, permission toggle, `finally`, and clock ticks do not clear it. While it is set, the renderable report is null and no cards are rendered. A later unsuccessful read must not take the historical-report branch and put those cards back.

Prop precedence is conservative because this frozen interface has no server revision or authorization correlation:

- The first current prop validation on a mount may establish the initial report, and only when the latch is unset and no GET has been accepted.
- The same signature again is a replay. It does not validate again, does not write, and does not fetch.
- A different signature, a replayed older object, or an invalid object is not proof of a newer authorized source. After a report has been accepted, or after the latch is set, that delivery cannot replace the report, reset its age, show cards, or clear the latch.
- Asynchronous prop validation uses `lade()` and a run id. Success, thrown interpretation, and `finally` are ignored when the instance is gone, the endpoint changed, a newer run exists, or the latch is set. An older `finally` does not clear a newer pending flag. A late valid prop result does not outrank a GET that started after it.

Endpoint change invalidates runs started for the old endpoint. Their later success, error, and `finally` do not write. It does not fetch and it does not clear the latch. If the latch is unset and a report is on screen, that report becomes `historisch` and keeps aging. It cannot remain unqualified `aktuell`. If the latch is set, cards stay hidden.

`aktualisierenErlaubt === false` returns before the lock and before `fetch`. A run already in flight is superseded when permission drops. Turning permission back on shows the control again, does not fetch, and does not clear the latch.

One allowed click sets the lock synchronously, then awaits one `fetch(endpunkt, { cache: 'no-store', signal })`. The click is allowed when the lock is free and `aktualisierenErlaubt` is true, including when the denial latch is set. That is the recovery GET. A second click in the same turn sees the lock and does not fetch. There is no timer fetch, no interval poll, and no second URL.

After every `await`, success, error, and `finally` write only when that run id is still current, the endpoint and permission epoch still match, and the instance is mounted. Abort is best effort and is not proof that a response cannot arrive.

The overlap the tests must force: start A, change the endpoint so A is stale and the lock releases, start B, then deliver A. A's success, 401, throw, and `finally` do not write over B. A prop change is not the event that releases A, because a prop change is not a new authorized read.

Status is read from the `Response` before the body is interpreted. The same `Response` is then passed to `lade()`. `lade()` does not retain status, so the 401/403 branch uses the status captured beside it, including when `json()` throws.

| Current owned response | Visible result |
| --- | --- |
| 401 or 403, JSON or malformed | Set the latch. Drop cards. Phase `verweigert`. Message is `lade()`'s sentence: server `message` or `error` when that string is non-blank, otherwise "Nicht angemeldet." or "Für diese Ansicht fehlt die Berechtigung." |
| Thrown `fetch`, 503, invalid 200, other non-denial HTTP, while the latch is set | Latch stays. Cards stay hidden. The denial sentence stays. No historical report. |
| Those same failures while the latch is unset and a report exists | Phase `historisch`. Keep aging. Show the `lade()` sentence plus the historical sentence. |
| Those same failures when no report exists | Phase `fehler`. No cards. |
| Valid 200 from the explicit GET | Clear the latch. Commit. New age anchor. Phase `aktuell`. |

A stale denial does not close a newer accepted GET. A stale success does not reopen cards after a newer denial. No response is shown as an empty healthy board.

Server text is rendered as React text, trimmed by `lade()`, then capped at 500 characters for layout. No `dangerouslySetInnerHTML`. The historical sentence is: "Die angezeigte Prüfung ist historisch und unbestätigt." It is not used for a denial, and it is not used when there is no report on screen. The current sentence "Angezeigt bleibt der vorherige Prüfstand." is removed because it treats a denial and a failure as the same current stand.

`wiederholbar` is not a second button and does not start a request. The only retry is the existing explicit control.

### Boards

Both boards keep their current card split, copy, `OperationsEvidence`, status classes, and `data-health-*` / `data-ops-*` attributes. Those attributes follow the **display** freshness, so a local stale transition is observable. Added attributes, not new visual claims:

- `data-health-age-ms` / `data-ops-age-ms`
- `data-health-checked-at` / `data-ops-checked-at` with the raw ISO timestamp
- `data-operations-phase` = `prueft`, `aktuell`, `historisch`, `verweigert`, or `fehler`
- `data-operations-pending` = `true` or `false`

The refresh control stays `type="button"`, minimum height 44px, hidden when permission is off, and disabled while the owned run is pending. Its accessible name stays "Erneut prüfen" / "Aktualisiert…". A polite live status repeats the pending sentence. The error and denial use `role="alert"`. The board region uses `aria-busy` while pending. Focus uses the existing outline utilities (`focus-visible:outline`, `focus-visible:outline-2`, `focus-visible:outline-offset-2`) and no new color. No new animation is added, so reduced motion has nothing new to disable.

Long board-owned names and summaries, the card article, and the grid tracks get `min-w-0` and `break-words`. `overflow-wrap` inherits, so a wrapper around the frozen `OperationsEvidence` can wrap its opened text without editing that component and without `overflow: hidden`. The proof opens the existing disclosure ("Datenqualität & Nachweis") at 320, 360, 390, and 320 with root font 32px. Page `scrollWidth` must stay within 1px of `clientWidth`. A concrete overflow that those owned wrappers do not fix is not a pass and is not an accepted residual. Acceptance stays open and this lane asks the Technical Lead for a named addendum. Frozen ownership does not close that P2.

Truth copy stays in the two boards: separated process and deployment, separated airports read and platform health, unconfigured Vercel/GitHub/Infomaniak, foundation-only provider/kill-switch/cost-guard, empty model usage is not a zero-cost proof, incomplete coverage, 30 days, 200 rows. Green still comes only from the existing predicates on the display freshness.

## State transitions

```text
mount                         -> prueft, no cards, no fetch
initial validation still current, valid, latch unset, no GET yet
                              -> aktuell, first anchor
initial validation still current, invalid, nothing accepted, latch unset
                              -> fehler, no cards
same / different / replayed / invalid props after accept or after latch
                              -> no replace, no age reset, no latch clear, no cards during latch
prop validation success, failure, or finally after a newer run, unmount, endpoint change, or latch
                              -> no write
click, lock free, permission true, latch set or unset
                              -> one recovery or refresh GET
click, lock held, or permission false
                              -> no GET
permission false during a run -> that run's later writes ignored; reenable does not GET and does not clear the latch
401/403 owned                 -> latch, verweigert, no cards
503 / network / invalid 200 while latch set
                              -> latch stays, cards stay hidden
those failures, latch unset, report exists
                              -> historisch, age continues
those failures, no report     -> fehler, no cards
owned valid GET               -> clear latch, aktuell, new anchor
endpoint change               -> old runs ignored; denial stays; visible report becomes historisch, not aktuell
unmount                       -> ignore success, error, and finally
visible tick / tab return     -> age floor only, no GET
```

## Acceptance and proof

Pure node tests, in the two new `lib/admin` test files. Validation calls the unchanged `sammleSystemHealth` and `sammleProviderOpsBoard` with local dependencies only: a resolved ping `{ ok: true }` with no `sourceUpdatedAt`, no network, and `leereSystemHealthCache` / `leereProviderOpsBoardCache` so a second call inside the 30-second window returns the `wendeEvidenceAlterAn` object. Assert the JS object validates, including `sourceUpdatedAt === undefined` and `checks === undefined` where the producer sets them. Assert the input object is the same reference and those keys are still `undefined` after validation. Assert `JSON.parse(JSON.stringify(bericht))` validates. Handwritten fixtures do not replace these producer cases. Audit fixtures still accept. Invalid cases still fail closed: `null`, array, `{}`, missing id, duplicate id, extra id, unknown key set to `undefined`, bad status, bad freshness, non-empty `writeActions`, metadata number/object, bad `checkedAt`, `detail: null`, negative age, null age on fresh/stale, numeric age on unknown, fresh with `ageMs > ttlMs`, TTL `0`, negative, non-finite, and TTL above the contract map. Model-usage TTL 60s accepts; 120_001 rejects.

Lifecycle tests:

- age before TTL, exactly TTL, and one millisecond after, for a parent and for an older child whose smaller hint age is ignored
- unknown stays unknown when the hint would be fresh; stale stays stale when the hint would be fresh and when the original age is under the TTL
- the reviewed rollback: fresh, age 0, checkedAt 120s ago, TTL 60s, hint age 120s, then a smaller hint and `originalAge + elapsed < 60`, floor stays at least 120s and state stays `stale`
- unusable accept anchors and unusable deltas (`undefined` clock, throw, `NaN`, `Infinity`, negative delta) latch fresh nodes `unknown` and do not restore `fresh` when later samples are finite
- future parent `checkedAt` latches the parent and its checks non-green; wall time passing that timestamp does not restore `fresh`
- a forward jump and a visibility return raise the floor; they do not fetch
- same-signature rerender, different props, replayed props, and invalid props do not replace a newer report, reset the floor, or clear the latch
- 503, network, and invalid 200 after a 403 do not restore cards
- an explicit permitted GET after that 403 can clear the latch; `aktualisierenErlaubt === false` cannot start that GET
- synchronous second begin returns no run; older finally does not release a newer lock or apply a late prop-validation failure
- older 401 does not beat a newer accepted GET; older 200 does not beat a newer denial
- endpoint mismatch marks the visible report historical, does not clear denial, and drops the old run; unmounted completion does not apply

Mounted script `scripts/admin-operations-evidence-lifecycle-completion-1/run.mjs`, executed in the implementation session, not by `npm test`:

- esbuild through the existing `tsx` dependency bundles the real boards and the real hook
- PostCSS compiles `styles/globals.css` with the project Tailwind setup, same pattern as `scripts/planning-creation-lifecycle-1/run.mjs`
- local Playwright only; Chromium path from an environment variable; missing browser is a failed proof, not a skip
- `fetch` and the synthetic prop `lade()` are deferred so each case can release success, throw, 503, 401, and 403 in order, with JSON and with malformed bodies, and can release prop validation after a GET
- both real boards and the real hook, with scoped local stubs only
- the script records fetch count. Clock movement, tab return, rerender, and prop replay stay at zero GETs
- viewports 320, 360, 390, 768, 1280, plus 320 at root font 32px
- keyboard activation of the refresh control
- reduced motion left on, with no new animation
- opened long evidence, not only closed cards, at the narrow and 200% root layouts
- document `scrollWidth` must not exceed `clientWidth` by more than 1px; overflow is not hidden

Mounted cases, each on both boards:

- initial valid props after async validation; initial invalid props; no cards during `prueft`; zero fetches
- delayed initial validation loses to a GET that finishes first; late prop success, failure, and `finally` do not write
- same signature, different signature, replayed older props, and invalid props do not replace a report, reset age, or clear a denial
- repeated renders do not fetch and do not move the anchor
- endpoint change ignores the old run, marks a visible report `historisch`, and does not clear a denial
- permission disable ignores the in-flight result; reenable does not fetch and does not clear a denial
- unmount ignores late success, error, and `finally`
- two clicks in one turn start one GET
- newer denial beats older success; newer success beats older denial; older error and `finally` do not clear a newer pending flag
- valid report, then 403, then 503, network, and invalid 200, still no cards; one explicit GET with permission true then a valid 200 restores cards and clears the latch; permission false blocks that GET
- TTL before, equal, and one millisecond after; older child stays non-fresh; rollback and unusable clocks do not restore `fresh`; future parent keeps parent and checks non-green after the wall clock passes `checkedAt`; tab return ages and fetches nothing
- screenshots and a result JSON under `docs/evidence/admin-operations-evidence-lifecycle-completion-1/`, including a new directory if a run fails; an older failure is not overwritten

The result JSON records head SHA, source digests, command, exit, case count, the fetch stub boundary, browser and version, viewports, root font, and reduced-motion setting. It states that this is local component evidence, not hosted Account, Next-router, Supabase, RLS, Production, or launch proof.

On the implementation head, also run the new pure tests, the existing system-health and provider-ops board tests, TypeScript, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, and the production build. Report the real counts. The current baseline cited by #1003 is 7213 tests, 2 explicit conditional browser skips, and 181 lint warnings. A skip is not a pass. Eleven dependency advisories stay untriaged and outside this lane. Full App/Auth CI and Vercel Preview remain mandatory after push and are not claimed before they exist.

## Costs and limits

No new dependency, workflow, provider, model call, secret, polling, or server cache change. No new monthly cost. The local timer does not call the network. The author browser run is disposable local proof.

Limits that remain even after a faithful implementation:

- The frozen 30-second collector cache already runs `wendeEvidenceAlterAn` before the board sees a cache hit. A child age that the server has already replaced cannot be restored here.
- Synthetic mounted proof does not sign in, does not hit `/api/admin/*`, and does not prove RLS or Production.
- Opened long-evidence layout is in the acceptance matrix. It is not pre-accepted as a residual. If owned wrappers leave a real overflow, the proof stays open for a named Technical-Lead addendum.
- Audit-fixture `fresh` labels from 2026-08-24 latch `stale` on first paint, and a later clock change does not restore them. Product copy and green rules do not.
- Guest trip and cross-tab limits named in the task are untouched residuals.

## Unknowns before implementation

- Whether this VM's Playwright Chromium launches. If it does not, the mounted script fails and the proof is recorded as failed. It is not replaced with a source-text pass.
- Whether Playwright's clock advances both `Date.now()` and `performance.now()` enough for the mounted TTL boundary. The pure clock tests do not depend on that. The mounted script still has to show the board attribute moving, with no fetch.
- Whether inherited `break-words` on the owned card and grid wrappers is enough for opened evidence at 320px and 200% root text. That is measured. It is not assumed.

## Stop

This correction edits only this PLAN. TASK V1 stays byte-identical. No runtime, test, or other doc is included. The next action is a fresh independent head-bound Technical-Lead re-review. Implementation waits for that authorization in this same session. This author does not Ready, merge, close #1004, write `main`, or open a follow-up.
