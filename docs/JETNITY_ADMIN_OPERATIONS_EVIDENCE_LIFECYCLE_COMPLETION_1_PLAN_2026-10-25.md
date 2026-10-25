# Jetnity Admin Operations Evidence Lifecycle Completion 1 — PLAN

Date: 2026-10-25
Status: plan before product code. Stop for independent Technical-Lead review.
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
- Live `origin/main` fetched this session: **500fbe40c8c8a70a0fe0d291782289f809d5d5b3**. Merge-base with HEAD is that same SHA. **1 ahead / 0 behind**. Tree at the seed matches the task pin for the two boards.
- Seed HEAD **8f6ccf4b2da16795a9ad412c845bd4a1ec88e8b4**. Complete seed diff is one file, the TASK. TASK blob **e75d3010d861e4047a18f282e5fa03bd74f181dc**.
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

- It is a plain object with `checkedAt`, `items`, and `writeActions`, and no unexpected keys. `checkedAt` parses to a finite time. Future is allowed at this gate.
- `writeActions` is an array of length 0.
- `items` contains each required id exactly once: `app`, `vercel`, `supabase`, `github`, `infomaniak`, or `provider-ops`, `kill-switch`, `cost-guard`, `model-usage`. No extra id. Order is preserved.
- Each card has string `id`, `name`, `status`, `source`, `checkedAt`, `summary`, `proves`, `doesNotProve`, all non-blank. `status` is in that domain's existing enum. `checkedAt` parses. `detail`, when present, is a string. `sourceUpdatedAt`, when present on a health card, parses. Provider cards have no `sourceUpdatedAt` in the type; an extra key is invalid.
- `freshness.state` is `fresh`, `stale`, or `unknown`. `ttlMs` is finite, greater than 0, and **not greater than** the frozen map value for that card id. A smaller positive TTL is accepted and is the TTL used later, so a payload cannot extend freshness. This accepts the provider audit fixture's model-usage TTL of 60s under the 120s ceiling.
- `fresh` requires a finite `ageMs >= 0` and `ageMs <= ttlMs`. `fresh` with a null age, or with `ageMs > ttlMs`, is invalid.
- `stale` requires a finite `ageMs >= 0`. It may be below or above the TTL. The client will not upgrade it.
- `unknown` requires `ageMs === null`.
- `checks`, when present, is an array of unique check ids. Each check has the same required strings, a domain status, and a freshness value. A check TTL uses the parent card's contract ceiling. Checks have no `checkedAt` of their own. Absent or empty `checks` is valid.
- `metadata`, when present, is a plain object whose values are only `string` or `null`.

Status and freshness stay independent. `unknown` status with `fresh` freshness remains valid. That is the current app parent shape.

Initial props and a 200 body use the same interpreter. The hook passes props through `lade()` with a synthetic 200 response whose `json()` returns the prop, so an invalid prop uses the same unreadable sentence and does not render cards.

### Age

The stored report is the accepted raw value. `checkedAt`, `sourceUpdatedAt`, `status`, `source`, `proves`, and `doesNotProve` are not rewritten. Display uses a copy. Only the copy's freshness state and age change.

On accept, each parent and each check stores its own original `state`, `ageMs`, and `ttlMs`, plus the parent's `checkedAt`. Elapsed for that acceptance starts at 0. A render, a tick, or a failed request does not create a new anchor. A newer accepted report does.

Elapsed is a high-water mark:

- monotonic delta is `performance.now()` minus the accept sample, when that delta is finite and positive
- wall delta is `Date.now()` minus the accept sample, when that delta is finite and positive
- elapsed becomes the max of the previous high water and those positive deltas
- a negative or non-finite delta does not reduce elapsed
- if both clocks are non-finite, originally fresh evidence displays non-green (`unknown`, age null) until a finite clock returns

Display age for one node is `originalAgeMs + elapsed` when the original age is a finite nonnegative number. State rules, applied after that, and never in the upgrade direction:

- original `unknown` stays `unknown` with age null
- original `stale` stays `stale`
- original `fresh` stays `fresh` while display age `<= ttlMs`, and becomes `stale` when display age `> ttlMs`
- a parent `checkedAt` that parses later than the current finite wall clock forces that parent to `unknown`. `Math.max(0, now - checkedAt)` is not used. Checks do not borrow the parent timestamp to become fresh.

`wendeEvidenceAlterAn` may run as an extra hint. Its result is used only when its age is finite and **greater** than the display age, or when its state is worse while the display state is `fresh`. Worse means `stale` or `unknown`. A hint that is `fresh`, or that has a smaller age, is ignored. That is what stops a child with original age 90s from becoming fresh because the parent `checkedAt` is recent. The hint is not added on top of `originalAge + elapsed`. The larger age wins.

Because the audit fixtures' `checkedAt` values are in August 2026, this downgrade marks their authored `fresh` nodes `stale` on first paint on today's clock. Infomaniak is already `stale`. Status, claims, green flags, and the words the frozen audit scripts require stay. Those scripts are outside this allowlist and are expected to keep passing. The product pages collect `checkedAt` at request time, so a live report is not stale merely because the fixture date is old.

Local aging reads no network. A one-second interval while the document is visible, plus `visibilitychange` and `pageshow`, recomputes elapsed. Hidden time is applied when the tab returns, including a forward wall jump. No interval starts a GET.

### Request ownership

`operations-read-lifecycle.ts` owns a synchronous lock, an integer run id, a prop signature, the endpoint, a permission epoch, and a mounted flag. The hook applies that result. It does not decide ownership inline after an `await`.

- Prop signature is a stable serialization of the validated raw report. The same signature on a new object is unmodified. Unmodified props do not clear a denial, do not reset the age anchor, and do not start a GET.
- A new signature that validates is a new authoritative source. It supersedes any in-flight run, commits the report, clears a denial, and sets a new age anchor. It does not fetch.
- A new signature that does not validate does not commit, does not clear a current denial, and does not move the age anchor. If a valid report is already on screen, it stays as historical and unconfirmed. If nothing valid is on screen, the unreadable sentence is shown and no cards are shown.
- Endpoint change supersedes an in-flight run for the old endpoint and does not fetch. The visible denial or report stays.
- `aktualisierenErlaubt === false` cannot start a run. A run already in flight is superseded when permission drops, and its later success, error, and `finally` do not write. Turning permission back on does not fetch.
- Unmount sets the mounted flag off and aborts the current `AbortController`. Abort is not treated as proof that a response cannot arrive. The completion is ignored because the run id no longer owns the view.
- One click sets the lock synchronously, then awaits one `fetch(endpunkt, { cache: 'no-store', signal })`. A second click while the lock is held returns before `fetch`. Disabled permission returns before the lock. There is no timer fetch, no interval poll, and no second URL.
- After every `await`, success, error, and `finally` write only when that run id is still current, the endpoint and permission epoch still match, and the instance is mounted. An older `finally` must not clear a newer pending flag.
- The overlap the tests must force: start A, supersede A with a new valid prop or an endpoint change so the lock releases, start B, then deliver A. A's body is ignored whether it is success, 401, or a throw.

Status is read from the `Response` before the body is interpreted. The same `Response` is then passed to `lade()`. `lade()` does not retain status, so the 401/403 branch uses the status captured beside it, including when `json()` throws.

| Current response | Visible result |
| --- | --- |
| 401 or 403, JSON or malformed | Denial. No detail cards. Message is `lade()`'s sentence: server `message` or `error` when that string is non-blank, otherwise "Nicht angemeldet." or "Für diese Ansicht fehlt die Berechtigung." |
| Thrown `fetch`, 503, invalid 200, other non-denial HTTP | If a valid report is already accepted, keep it, mark it historical and unconfirmed, keep aging it, and show the `lade()` sentence. If none exists, show that sentence and no cards. |
| Valid 200 | Commit. New age anchor. Clear denial and historical. |

A stale denial does not close a newer accepted report. A stale success does not reopen cards after a newer denial. A later permitted valid read recovers. No response is shown as an empty healthy board.

Server text is rendered as React text, trimmed by `lade()`, then capped at 500 characters for layout. No `dangerouslySetInnerHTML`. The historical sentence is: "Die angezeigte Prüfung ist historisch und unbestätigt." It is not used for a denial, and it is not used when there is no report on screen. The current sentence "Angezeigt bleibt der vorherige Prüfstand." is removed because it treats a denial and a failure as the same current stand.

`wiederholbar` is not a second button and does not start a request. The only retry is the existing explicit control.

### Boards

Both boards keep their current card split, copy, `OperationsEvidence`, status classes, and `data-health-*` / `data-ops-*` attributes. Those attributes follow the **display** freshness, so a local stale transition is observable. Added attributes, not new visual claims:

- `data-health-age-ms` / `data-ops-age-ms`
- `data-health-checked-at` / `data-ops-checked-at` with the raw ISO timestamp
- `data-operations-phase` = `aktuell`, `historisch`, `verweigert`, or `fehler`
- `data-operations-pending` = `true` or `false`

The refresh control stays `type="button"`, minimum height 44px, hidden when permission is off, and disabled while the owned run is pending. Its accessible name stays "Erneut prüfen" / "Aktualisiert…". A polite live status repeats the pending sentence. The error and denial use `role="alert"`. The board region uses `aria-busy` while pending. Focus uses the existing outline utilities (`focus-visible:outline`, `focus-visible:outline-2`, `focus-visible:outline-offset-2`) and no new color. No new animation is added, so reduced motion has nothing new to disable.

Long board-owned names and summaries get `break-words` and `min-w-0`. `OperationsEvidence` stays frozen. If a long token inside that frozen disclosure overflows, the evidence record says so and this lane does not patch it.

Truth copy stays in the two boards: separated process and deployment, separated airports read and platform health, unconfigured Vercel/GitHub/Infomaniak, foundation-only provider/kill-switch/cost-guard, empty model usage is not a zero-cost proof, incomplete coverage, 30 days, 200 rows. Green still comes only from the existing predicates on the display freshness.

## State transitions

```text
mount + valid props        -> aktuell, anchor = those ages, no fetch
mount + invalid props      -> fehler, no cards, no fetch
same prop signature        -> no write
new valid props            -> aktuell, new anchor, in-flight ignored
new invalid props          -> denial unchanged; else historisch if a report exists; else fehler
click, lock free, allowed  -> one GET, pending
click, lock held or denied -> no GET
401/403 owned              -> verweigert, no cards
other owned failure        -> historisch if a report exists, else fehler
owned valid 200            -> aktuell, new anchor
supersede / unmount        -> ignore success, error, and finally
visible tick / tab return  -> age only, no GET
```

## Acceptance and proof

Pure node tests, in the two new `lib/admin` test files:

- both audit fixtures and one collector-shaped fresh report accept
- invalid bodies: `null`, array, `{}`, missing id, duplicate id, extra id, bad status, bad freshness, non-empty `writeActions`, metadata number/object, bad `checkedAt`, negative age, null age on fresh/stale, numeric age on unknown, fresh with `ageMs > ttlMs`, TTL `0`, negative, non-finite, and TTL above the contract map
- model-usage TTL 60s accepts; 120_001 rejects
- age before TTL, exactly TTL, and one millisecond after, for a parent and for an older child
- unknown stays unknown when the parent-clock hint would be fresh
- stale stays stale when the hint would be fresh and when the original age is under the TTL
- future `checkedAt` stays non-green
- wall rollback does not reduce the high water; a forward jump and a visibility return increase it
- failed apply and same-signature rerender do not replace the anchor
- synchronous second begin returns no run; older finally does not release a newer lock
- older 401 does not beat a newer accepted report; older 200 does not beat a newer denial
- endpoint mismatch and unmounted completion do not apply

Mounted script `scripts/admin-operations-evidence-lifecycle-completion-1/run.mjs`, executed in the implementation session, not by `npm test`:

- esbuild through the existing `tsx` dependency bundles the real boards and the real hook
- PostCSS compiles `styles/globals.css` with the project Tailwind setup, same pattern as `scripts/planning-creation-lifecycle-1/run.mjs`
- local Playwright only; Chromium path from an environment variable; missing browser is a failed proof, not a skip
- `fetch` is deferred inside the page so the test can deliver success, throw, 503, 401, and 403 in order, with JSON and with malformed bodies
- the script records fetch count, including zero during clock movement
- viewports 320, 360, 390, 768, 1280, plus 320 at root font 32px
- keyboard activation of the refresh control
- reduced motion left on, with no new animation
- long unbroken board-owned text, empty/error/pending/denial
- document `scrollWidth` must not exceed `clientWidth` by more than 1px; overflow is not hidden
- screenshots and a result JSON under `docs/evidence/admin-operations-evidence-lifecycle-completion-1/`, including a new directory if a run fails; an older failure is not overwritten

The result JSON records head SHA, source digests, command, exit, case count, the fetch stub boundary, browser and version, viewports, root font, and reduced-motion setting. It states that this is local component evidence, not hosted Account, Next-router, Supabase, RLS, Production, or launch proof.

On the implementation head, also run the new pure tests, the existing system-health and provider-ops board tests, TypeScript, lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, and the production build. Report the real counts. The current baseline cited by #1003 is 7213 tests, 2 explicit conditional browser skips, and 181 lint warnings. A skip is not a pass. Eleven dependency advisories stay untriaged and outside this lane. Full App/Auth CI and Vercel Preview remain mandatory after push and are not claimed before they exist.

## Costs and limits

No new dependency, workflow, provider, model call, secret, polling, or server cache change. No new monthly cost. The local timer does not call the network. The author browser run is disposable local proof.

Limits that remain even after a faithful implementation:

- The frozen 30-second collector cache already runs `wendeEvidenceAlterAn` before the board sees a cache hit. A child age that the server has already replaced cannot be restored here.
- Synthetic mounted proof does not sign in, does not hit `/api/admin/*`, and does not prove RLS or Production.
- Frozen `OperationsEvidence` may still overflow on a pathological token inside the disclosure.
- Audit-fixture `fresh` labels from 2026-08-24 become `stale` on first paint under the downgrade rule. Product copy and green rules do not.
- Guest trip and cross-tab limits named in the task are untouched residuals.

## Unknowns before implementation

- Whether this VM's Playwright Chromium launches. If it does not, the mounted script fails and the proof is recorded as failed. It is not replaced with a source-text pass.
- Whether Playwright's clock advances both `Date.now()` and `performance.now()` enough for the mounted TTL boundary. The pure clock tests do not depend on that. The mounted script still has to show the board attribute moving, with no fetch.
- Whether `break-words` on the board-owned nodes is enough at 320px and 200% root text. Any overflow fix stays inside the two board files.

## Stop

No product or test file is part of this commit. The next action is independent head-bound Technical-Lead review of this plan. Implementation waits for that authorization in this same session. This author does not Ready, merge, close #1004, write `main`, or open a follow-up.
