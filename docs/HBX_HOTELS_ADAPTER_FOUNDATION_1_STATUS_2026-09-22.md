# HBX Hotels Adapter Foundation 1 — STATUS

Date: 2026-09-22  
Status: **IMPLEMENTED / FROZEN / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW / NOT READY / NOT MERGED**  
Draft PR: #548  
Branch: `feat/hbx-hotels-adapter-foundation-1`  
Binding task: `docs/HBX_HOTELS_ADAPTER_FOUNDATION_1_TASK_2026-09-22.md`  
Task seed: `91270eafc00887bc24b345924b22239af3cc94a4`  
Baseline main: `9dc8926ef859bcde2dc31dc8b96f2e61e1948f74`

Agent: **Jetnity HBX hotels adapter foundation 1**, Generation 1  
Required and actual model: Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-c538c2b5-3cc6-4f9f-8f00-2ccac1bb9cf1`  
Run URL: https://cursor.com/agents/bc-c538c2b5-3cc6-4f9f-8f00-2ccac1bb9cf1  
UI rename: not performed. TL start evidence: comment `5779757780`.

This is not a Technical-Lead PASS and is not Ready. Agent self-review is not TL PASS. Do not merge. Do not start a follow-up slice, including Viator.

Operating mode re-read: `NORMAL`. Product-Owner special gates remain closed.

---

## 1. Result

A pure offline fixture mapper now lives only under `lib/providers/hotelbeds/hotels/*`.

- `hbxHotelsFixtureNormalisieren(unknown, unknown)` accepts untrusted shapes and never throws.
- Invalid top-level / schema / stay-pricing context → empty fixture result, `partial=false`.
- Valid offers map explicitly onto existing `HotelOption` via `hotelOptionLesen`. Incoming fields are never spread.
- `providerId=hotelbeds`, `evidenceMode=fixture` only.
- `partial=true` only when at least one option is kept and at least one offer is rejected.

Pricing (fixture-declared model only; not commercial-relationship evidence):

| Model | Display price |
| --- | --- |
| `unknown` | no `HotelOption`, even if `sellingRate`/`net`/`commission` exist |
| `commissionable` | `sellingRate` only; missing/invalid → reject |
| `net` | `sellingRate` only when `hotelMandatory === true`; otherwise reject |

Never display `net`, never derive markup, never infer the business model from field presence. `packaging` must be the boolean `false`. Currency is the hotel-schema / `commercialWaehrungLesen` rule implemented locally (trim, uppercase, `^[A-Z]{3}$`); mismatch rejects, no FX. Nightly price = rounded `sellingRate / UTC-calendar nights`.

Other truth cuts for this slice:

- `stornierbar` and `stornierungBis` stay `null` (a single date/amount is not a complete policy).
- address, stars, rating/count, quartier, breakfast stay `null` (no category/board heuristics).
- `taxesAllIncluded` passes only a real boolean.
- `rateKey` stays opaque; Jetnity IDs are `hbx:{hotelCode}:{sha256(rateKey)[0:32]}`. Raw keys do not appear in IDs, user-facing fields or serialized output.
- `retrievedAt` must be an offset-bearing real-calendar ISO instant and is not copied onto `HotelOption`.
- No factory/import wiring, HTTP, env, secrets, UI or Production changes.

Traveller-context intelligence does not apply: fixture mapping only, no eligibility/document/visa rules.

---

## 2. Git evidence (at this persist)

| Item | Value |
| --- | --- |
| Live `origin/main` re-fetched | `9dc8926ef859bcde2dc31dc8b96f2e61e1948f74` |
| Merge-base | `9dc8926ef859bcde2dc31dc8b96f2e61e1948f74` |
| Implementation commit | `f4413cd4b01730702c14d4954367ab1766ceb778` |
| Ahead / behind vs live main before this persist | **2 ahead / 0 behind**. This persist adds named docs/evidence. |
| Rebase / sibling merge | **not done** |
| Review threads | none |

Exact-head CI / Auth / Vercel Preview must be re-read on the freeze SHA after this persist and reported in a PR comment. Vercel Ready on a pre-freeze or implementation-only SHA is not the freeze gate.

---

## 3. Local gates

See `docs/evidence/hbx-hotels-adapter-foundation-1/commands-results.txt`.

| Check | Result |
| --- | --- |
| Focused adapter tests | 20 pass / 0 fail |
| Unchanged hotel schema/suche/anfrage + Skyscanner fixture tests | 25 pass / 0 fail |
| `npm run typecheck` | pass |
| `npm run lint` | 0 errors; 135 pre-existing warnings, none in owned files |
| `check:dead` / `exports` / `deps` / `api-schutz` / `schema-bezug` / `operating-mode` | pass |
| `npm run build` | pass; setup warning = missing `.env/.local` in this environment |
| Auth / Production / provider / DB | not mutated and not probed |

Fixture tests are not a live HBX compatibility claim.

---

## 4. Remaining limitations

- No HotelProvider registration. `hotelProviderAus()` remains `null`.
- External HBX API/contract/mTLS/certification/pricing/redirect feasibility stays unresolved.
- Historical audit docs still carry DRAFT/PROPOSAL labels; this task is the implementation authorization.
- Parallel #545 and #547 remain independent TL-review-pending writers.
- Exact-head CI/Preview are asynchronous after this persist.
