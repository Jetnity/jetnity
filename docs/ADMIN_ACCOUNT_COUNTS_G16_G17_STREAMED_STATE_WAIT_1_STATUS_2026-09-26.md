# Admin Account Counts G16/G17 Streamed State Wait 1 — STATUS

Stand: 2026-09-26  
Slice: **IMPLEMENTATION FROZEN FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT A TECHNICAL-LEAD PASS / DRAFT / NOT READY / NOT MERGED / NO REAL MAC/BROWSER RUN / NO PRODUCTION MUTATION**

## Live pins (reconstruct if they move)

| Item | Value |
| --- | --- |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Product / integration baseline | `a82aa92dc9b5f06582e88e21c2e50453042256fa` (Merge #572) |
| Binding task | `docs/ADMIN_ACCOUNT_COUNTS_G16_G17_STREAMED_STATE_WAIT_1_TASK_2026-09-26.md` |
| Branch | `fix/admin-account-counts-g16-g17-streamed-state-wait-1` |
| PR | https://github.com/Jetnity/jetnity/pull/573 (Draft) |
| Task seed | `c99ff902a9e792d47a5fdad897d5aa3a24687a08` |
| Frozen contract | `jetnity.account-counts.local-acceptance.v1` (unchanged) |

Reconstruct live HEAD after this persist; a later commit invalidates older gates. CI/Auth/Preview are not claimed on the implementation head from this writer.

## This writer

| Field | Value |
| --- | --- |
| Agent | Jetnity admin account counts G16 G17 streamed state wait 1 |
| Generation | 1 |
| Required / actual model | cursor-grok-4.6-high-fast |
| Session | `bc-b06cf43d-9f72-4e03-8aa1-6cb4b8972676` |
| URL | https://cursor.com/agents/bc-b06cf43d-9f72-4e03-8aa1-6cb4b8972676 |
| Display name | `Admin account counts G16/G17` — UI rename not performed |

## Product truth inspected first (read-only)

Authoritative current source, not a guessed wait:

| Path | Streamed-state fact |
| --- | --- |
| `app/(admin)/admin/page.tsx` | `/admin` shell renders async `AdminAccountCounts` inside the normal Steuerzentrale / Operative Lage page. |
| `components/admin/home/AdminAccountCounts.tsx` | Forbidden copy: `Für diese Kontenzahlen fehlt eine rollengebundene Berechtigung „konten-verwalten“ mit aktueller AAL2. Notzugang über die Oberfläche reicht nicht.` Unavailable copy: `Die lokale Zählfunktion ist in dieser Umgebung nicht vorhanden. Das ist keine leere Statistik.` Both are async server-component states, not page-level redirects. |
| `lib/admin/account-counts-delivery/reader.ts` | Non-active caller status => forbidden. Missing RPC function => unavailable. |
| Current harness before this slice | G16/G17 navigate with `waitUntil: 'domcontentloaded'` and classify immediately. G9/G11 already settle before async count assertions. G15 can PASS from page-level denial/redirect without the nested count component. |

No product mutation. Timeouts were not increased. The real-Mac G16/G17 failures at `generic unknown page cannot become a denial PASS` match an immediate body read of the /admin shell or an intermediate streamed state before the exact forbidden/unavailable copy is committed.

## What this head implements

- `waitForAccountCountsTerminalState(page, { kind, expectedOrigin, response, timing })` waits only for the exact requested Account-Counts terminal kind (`forbidden` or `unavailable`) on `/admin`.
- G16 waits for exact forbidden, then keeps existing `assertNoCountDisclosure`.
- G17 waits for exact unavailable, then keeps existing `assertUnavailableNotZero`.
- Optional bounded `waitForRequestsToSettle` is inside the same action/timeout budget. Polling observes exact product copy; no sleep-as-proof.
- Immediate FAIL on available aggregates, failed copy, wrong origin/path, mismatched terminal kind, unready navigation, abort, or timeout. Generic shell / unknown / blank stay intermediate and cannot PASS.
- G13/G14/G15/G18/G19 denial and viewport/HTTP semantics are unchanged.

Allowed files only: browser-flow `counts.mjs`, `flows.mjs`, lane tests, own STATUS/HANDOFF/SELF_REVIEW, `docs/ACTIVE_WORK_STATUS.md`, task status line.

## Authoritative real-Mac trigger (not re-run here)

Authorized Apple-Silicon Mac full run `aaclr1-20260926T204346Z`:

- cleanup fully PASS (processes/reaped/Docker/network/container/volume absent; artifacts exported)
- G6–G15 PASS
- G16 FAIL: `generic unknown page cannot become a denial PASS`
- G17 FAIL: `generic unknown page cannot become a denial PASS`
- G18/G19 PASS
- matrix 19 PASS / 2 FAIL / no BLOCKED / no UNKNOWN

This writer did not run a real Mac/browser lane.

## What was executed here

| Class | Result | Kind |
| --- | --- | --- |
| `node --test scripts/e2e/admin-account-counts-browser-flows-1/test.mjs` | **52/52 PASS, 0 FAIL** (2.4s) | controlled helpers only |
| Artifact | `/opt/cursor/artifacts/aacbf1-g16-g17-streamed-state-wait-controlled-tests.log` | local agent evidence |
| Real Mac / Playwright / Docker / hosted Supabase / Production | **NOT RUN / NOT MUTATED** | forbidden by task |

Prior browser-flow suite remained green. Ten G16/G17 streamed-state proofs were added (42 prior + 10 new = 52).

## What is not done

- No real Mac/browser/Playwright execution
- No product, Docker cleanup, SQL/Auth, npm/cache, artifact export, root-dep or CI change
- Independent Technical-Lead exact-head review has not happened
- Authorized later real-Mac full acceptance run after integration remains a later TL step

## First unfinished action

Technical Lead reviews the exact current head of Draft PR #573. Cursor does not Ready, merge, or start a follow-up.
