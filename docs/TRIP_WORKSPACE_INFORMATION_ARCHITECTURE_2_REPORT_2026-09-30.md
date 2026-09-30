# Trip Workspace Information Architecture 2 — Report

Stand: 30 September 2026
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TL REVIEW**

Issue: #641
Draft PR: #642
Branch: `feat/trip-workspace-task-modes-2`
Baseline: `main@91ab08bb9163444fcbce4a5303c1522c5ad5498c`
Task seed: `711ea1a0` (docs only; the rendered baseline was this component tree)
Audited runtime head: `5456e3324d9802e8cd726cc92f1db9144802759f`
R1 reviewed head: `50f15bbf9de6af07a31e96f23b675d817fc952b4`
Agent: **Jetnity Trip Workspace information architecture 2**, Generation 1
Session: https://cursor.com/agents/bc-d6c61c03-c9c0-45f4-8764-4fb9ff4b34bf
`originalModelName`: `grok-4.7-high-fast`

## 1. What was already closed

#638 is accepted, merged and Production-verified. It kept domain detail, inventory and explicit search in one context, measured sticky occlusion, one compact back control, and Escape/focus restoration. This slice does not reopen that interaction repair. It changes which task owns the page.

## 2. Reproduced defect

On the seed component tree the default trip page was one long document. At 1440×900 the overview scroll height was 3197px, with the day plan and preparation still inside that page. Opening Flüge on desktop kept that overview in the left column (`toteFlaeche` true, grid `555.672px 652.328px`). The same dead column appeared at 1024, 1280 and 1920.

Baseline JSON: `docs/evidence/trip-workspace-information-architecture-2/audit-baseline.json`
Captured `2026-09-30T13:47:15.970Z` at git `711ea1a0`. The dirty set was the untracked harness and evidence directory. `TripWorkspace.tsx` was not modified yet.

## 3. Repair

One stable shell. Four task modes. Domains stay under Organisieren.

| Mode | Address |
| --- | --- |
| Übersicht | no `ansicht` query |
| Reiseplan | `?ansicht=plan` |
| Organisieren | `?ansicht=organisieren` |
| Organisieren domain | `?ansicht=organisieren&bereich=fluege\|unterkunft\|aktivitaeten\|mobilitaet` |
| Vorbereitung | `?ansicht=vorbereitung` |

`lib/trips/workspace-mode.ts` is the contract. Unknown values, duplicate keys, `?ansicht=uebersicht`, and an unknown `bereich` fail closed to Übersicht. `bereich` is removed unless the mode is Organisieren. Unrelated parameters stay. The shell writes with `pushState` / `replaceState` and reads `popstate`. It does not call `router.push` or `router.replace`. Search-open state and the selected plan item stay out of the URL.

Übersicht keeps the title, Jetzt wichtig, destination essentials, domain coverage and the compact preference summary. The day plan, safety block, seasonal block and Reisevorbereitung are not mounted there. Reiseplan and Vorbereitung use the workspace width. Organisieren shows a domain status rail and, once a domain is chosen, one active domain surface. Below 1024px that domain replaces the rail and keeps the existing sticky return. From 1024px the rail and the domain stay side by side. The old overview is not the left column.

Reise ändern and, on the account shell, Reisebegleiter fragen sit in the action row under the mode navigation. The panels still mount on first open, take focus, close with Escape, and the assistant still changes nothing.

Mode buttons are at least 44px, use `aria-current="page"`, and wrap without horizontal overflow. A pointer activation leaves focus on the control. Keyboard activation and Back/Forward move focus to the mode heading. Opening a domain still focuses the compact return bar or the desktop in-card back control. Escape still closes the domain. If the invoker has unmounted, focus returns to that domain’s rail button.

Attention domain gaps open Organisieren plus that domain. An official/readiness attention action opens Vorbereitung. Neither path starts a provider or model call.

## 4. After measurements

After JSON: `docs/evidence/trip-workspace-information-architecture-2/audit-after.json`
Runtime SHA `bc718c68ac498d8ba6ed9d6d83bfca0172aa715d`, captured `2026-09-30T14:04:41.522Z`. The only dirty path was the still-untracked evidence directory. Chrome via Playwright, through a local proxy that strips `Origin` so the dev server accepts the document and its scripts. Synthetic guest trip in `localStorage`. Provider and assistant routes intercepted as unavailable. No live provider call.

| Viewport | Baseline overview scroll / plan in page / prep in page | After overview scroll / plan in page / prep in page | Plan full width | Flights arrangement / dead column |
| --- | --- | --- | --- | --- |
| 360×800 | 4089 / yes / yes | 2896 / no / no | yes (336px) | one column / no |
| 390×844 | 4021 / yes / yes | 2872 / no / no | yes (366px) | one column / no |
| 768×1024 | 3729 / yes / yes | 2724 / no / no | yes (720px) | one column / no |
| 1024×768 | 3299 / yes / yes | 2362 / no / no | yes (976px) | 381 / 571 rail + domain / no |
| 1280×800 | 3197 / yes / yes | 2280 / no / no | yes (1232px) | 556 / 652 rail + domain / no |
| 1440×900 | 3197 / yes / yes | 2280 / no / no | yes (1232px) | 556 / 652 rail + domain / no |
| 1920×1080 | 3197 / yes / yes | 2280 / no / no | yes (1232px) | 556 / 652 rail + domain / no |

No measured step had horizontal overflow. The network list stayed empty on every viewport, including explicit Flug suchen, attention, edit and assistant.

Compact Flug suchen at 360 and 390: sticky return bottom 134, eyebrow `Flüge` at 142, heading `Verbindungen für diese Reise` at 162, search identity below the measured chrome, search inside the domain context, one sticky back control and zero in-card back controls. Desktop open-domain steps have one in-card back control and zero sticky back controls.

Back from a compact domain, and Escape on desktop, land on `?ansicht=organisieren` with the domain rail focused and no back button left. Reload of `?ansicht=plan` restores Reiseplan. `?ansicht=organisieren&bereich=unterkunft` restores that domain. `?ansicht=unbekannt&bereich=fluege&spur=bleibt` becomes Übersicht and keeps `spur=bleibt`. Keyboard Back/Forward restored Übersicht, Reiseplan and Organisieren/Flüge. Edit focused the textarea and Escape returned to Reise ändern. The assistant audit route focused the question field and Escape returned to Reisebegleiter fragen, with no network request.

The guest route has no assistant control. Guest and account still mount the same `TripWorkspace`.

## 4b. R1 — first visible mode

Technical-Lead review of `50f15bbf` required two changes.

`docs/ACTIVE_WORK_STATUS.md` is back to `main@91ab08bb9163444fcbce4a5303c1522c5ad5498c`. This slice does not own that global pointer.

The URL is applied in `useLayoutEffect`, before the browser paints the task. Until that read finishes, the task body is one non-interactive status: `role="status"`, `aria-busy="true"`, `inert`, and the sentence “Die Reiseansicht wird vorbereitet.” Übersicht, Reiseplan, Organisieren and Vorbereitung are not mounted in that status. A direct or reloaded address therefore cannot show another task first. An empty address still resolves to Übersicht. An invalid query still resolves to Übersicht and keeps unrelated parameters. History still uses `pushState` / `popstate`, not a Next.js navigation.

The after JSON records `erste-sicht` at `2026-09-30T14:35:41.592Z` on `5456e332`. A mutation observer runs before page scripts. On each reload the first `data-workspace-ansicht` is the URL mode, no other mode appears, and the Übersicht section is absent unless that mode is Übersicht. Network stays empty.

| Viewport | Reload | First visible mode |
| --- | --- | --- |
| 360×800 | `?ansicht=plan` | plan |
| 360×800 | no query | Übersicht |
| 390×844 | `?ansicht=vorbereitung` | Vorbereitung |
| 390×844 | `?ansicht=organisieren&bereich=unterkunft` | Organisieren / Unterkunft |
| 768×1024 | `?ansicht=plan` | plan |
| 1440×900 | `?ansicht=unbekannt&bereich=fluege&spur=bleibt` | Übersicht, address `?spur=bleibt` |
| 1440×900 | `?ansicht=organisieren&bereich=fluege` | Organisieren / Flüge |

The HTML sent by the server cannot read `window`. It contains the pending status, not a task. After hydration the layout effect selects the URL mode before paint.

## 5. Gates run here

| Check | Result |
| --- | --- |
| focused workspace-mode, cross-device, preference and assistant surface tests | 42/42 pass |
| `npm test` | 4072/4072 pass, on the R1 source |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors, 149 warnings. The layout read is one existing set-state warning. No unused directive |
| `npm run build` | pass, Next.js 16.3.3 |
| `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `check:operating-mode` | pass |

`check:schema-bezug` still prints the existing local/unapplied `admin_account_counts_v1` note and exits 0. This slice did not touch that path.

Those local checks are not the remote gate. CI and Preview on `50f15bbf` were green and are invalidated by this head. The handoff records the observation for the new tip after it is pushed. That observation is not a Technical-Lead PASS.

## 6. Boundaries held

No provider activation, no automatic commercial search, no commercial truth, no route/trip/traveller truth change, no Supabase/Auth/RLS/schema/function change, no payment, no dependency or lockfile change, no #626 work, no Account/Admin/map/global-nav redesign, no launch or indexing change. Cursor stays Draft. No Ready, no merge, no follow-up slice.
