# Admin Audience & Partner Reporting Preflight 1 — Adversarial Self-Review

Date: 2026-09-22  
Agent: **Jetnity admin audience partner reporting preflight 1**, Generation 1  
Session: `bc-ea4a0209-f139-4b47-8943-16ddf78e4270`  
Model: Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — matches required; no Auto/substitution  
This review is **producer evidence**, not Technical-Lead PASS.

---

## 1. Attack questions

| Question | Answer |
| --- | --- |
| Did I reuse #545 / #547 / #548 sessions? | No. New session `bc-ea4a0209-f139-4b47-8943-16ddf78e4270`. Sibling heads observed only. |
| Did I treat unmerged runtime as main truth? | No. |
| Did I implement analytics, tracking, SQL, UI, or a vendor? | No. Docs only. |
| Did I turn TL function metadata into personal-row access or a Production PASS? | No. Quoted; limits stated. |
| Did I claim `last_seen_at` is activity? | No. No writer found. |
| Did I treat Users `count` as audience? | No. Filter/RLS/profile-only. |
| Did I confuse `account_visits` with web visits? | No. |
| Did I treat affiliate columns as clicks/bookings/commission? | No. |
| Did I invent historical traffic or unique humans? | No. |
| Did I reorder V1 or start Growth M0–M6? | No. Proposal is honesty over existing A–C measures. |
| Did I contact a partner or select a vendor? | No. Public Skyscanner FAQ fetch only. |
| Did I mark Ready / merge / start the follow-up? | No. |
| Did I claim UI rename? | No. |
| Did I edit global status/start/roadmap or runtime? | No. |
| Did I require fake runtime tests? | No. Docs path/link checks only. |

---

## 2. Where I could be wrong

| Risk | Severity | Mitigation / residual |
| --- | --- | --- |
| A hidden `profiles` insert exists outside `app/**` + `lib/**` (edge, dashboard hook, later migration). | P1 | Searched those trees, auth callback, SQL triggers on `auth.users`, and scripts (test-only inserts). Residual: a live Production hook **not in this repo** is **NOT VERIFIED**. |
| Hosted DB timezone is not UTC, so rolling 30d / `current_date` buckets differ from operator expectation. | P1 | Labelled `NOT VERIFIED`. First implementation must not print “UTC” as fact. |
| Production `admin_reisen_kennzahlen` body drifted from the migration. | P2 | TL metadata matches the migration shape. Accuracy/exclusions still unverified. |
| Operators already treat Users “Nutzer gesamt” as registrations. | P1 | Documented. First overview must not repeat that number as audience. |
| I under-counted later event tables. | P2 | No versioned marketing event table found; Growth D0/G0 and AP6A agree. Residual: a non-analytics log I did not name. |
| Skyscanner criterion page can change. | P2 | Fetched 2026-09-22; dated pin, not a permanent partner policy. |
| Sibling heads move after this pin. | P3 | Observation only. |

---

## 3. P0 / P1 / P2 / P3

| ID | Sev | Finding |
| --- | --- | --- |
| P0-1 | P0 | Unique visitors, the metric partners actually ask for, have **no producer**. Any current “audience” number that is not a trip aggregate would be a lie. |
| P0-2 | P0 | `last_seen_at` and Users profile counts must not be shipped as active users or registrations. |
| P1-1 | P1 | Auth account and profile are different objects; product does not insert profiles on signup in this repository. |
| P1-2 | P1 | Trip aggregates have no test/Preview/bot exclusion and lose deleted accounts. |
| P1-3 | P1 | Commercial affiliate fields and local `booked`/payments cannot underwrite partner revenue claims. |
| P2-1 | P2 | `reisen_gesamt` exists but is hidden; timezone unlabelled. |
| P2-2 | P2 | `/admin/analytics` still says reports are not built — true, and must stay true until a later honesty slice. |
| P3-1 | P3 | Seed-head Preview/CI are not content-head gates. |
| P3-2 | P3 | Session display name was not renamed. |

No P0 **in this docs delivery** (scope kept). The P0s above are **product-truth risks for any later implementation**, not defects of these files.

---

## 4. Docs-only validation

Checked after writing, before freeze:

- All five owned paths exist; task still present and not rewritten.
- Cited repo paths exist on this checkout: AdminStatsStrip, AdminTimeSeries, analytics page, users page, UsersTable, navigation, ehrliche-zustaende, AP6A inventory test, reise_anlegen migration (RPC), trip schema, commercial provenance migration, datenexport, RegisterForm, auth callback, roles, DATENBANK.md, AUTH.md, remaining-build map, Growth + Admin Marketing standards, Copilot source matrix.
- No `app/` `lib/` `components/` `supabase/` diffs staged.
- Internal doc links among the five files use the exact filenames.

Not a substitute for exact-head CI/Auth/Preview on the content SHA.

---

## 5. Scope fidelity

| Required deliverable | Present |
| --- | --- |
| Source/producer matrix including metric/report proposals | Yes |
| Smallest implementation task PROPOSAL | Yes |
| STATUS | Yes |
| HANDOFF | Yes |
| Adversarial SELF_REVIEW | Yes |

Non-scope held: no runtime/UI/tests/packages/global docs/SQL; no trackers; no sibling edits; no Ready/merge/follow-up.

---

## 6. Verdict

Deliver the five docs and stop. The inventory is strong enough for an independent TL review. The proposed next slice is deliberately smaller than the Product-Owner wish-list: it makes existing trip truth reusable and refuses to mint visitor/account/revenue numbers that do not exist.

I would fail this review if the later implementer used `last_seen_at`, Users `count`, or `0` for unique visitors.
