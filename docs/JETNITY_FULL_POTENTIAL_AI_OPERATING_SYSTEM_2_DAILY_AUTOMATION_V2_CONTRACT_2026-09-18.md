# Jetnity – OS-2 Daily Automation V2 – Scheduler-Compatible Handoff Contract

Stand: 19. September 2026  
Status: **CANONICAL CONTRACT / MARKET + PROVIDER + TRAVEL TRUTH FINAL PASS / GROWTH NEXT / COS DAILY REMAINS PAUSED**  
Origin dispatch: PR #491 comment `5736670149`  
Hardening dispatch: PR #491 comment `5737188145`  
Schema-hardening + novelty dispatch: PR #491 comment `5737237338`  
Novelty-hardening TEST #001: PR #491 comment `5737291119`  
Final Market re-canary: PR #491 comment `5737734991`  
Market restore + Provider manual: PR #491 comment `5737767891`  
Final Provider canary: PR #491 comment `5738078082`  
Travel Truth manual: PR #491 comment `5740522887`  
Final Travel Truth canary: PR #491 comment `5740658975`  
Tracker: `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_EXTERNAL_SETUP_TRACKER_2026-09-18.md`

This file is the repository contract for scheduled Daily Intelligence after native scheduler CANARY #002. It does **not** create routines, write envelopes, or lift HOLD.

The path below is the **shared Grok workspace**, not this git repository. Do not add `/workspace/jetnity/intelligence/daily/` files to Jetnity V2.

## 1. Why V2 exists

Technical-Lead decision after CANARY #002 (`5736636348`, `5736670149`):

- the native Grok scheduler **is verified to fire**;
- a scheduled Chief-of-Staff run **cannot currently perform bot-to-bot specialist messaging**;
- CANARY #002 therefore returned `JETNITY DAILY INTELLIGENCE — DEGRADED / CURRENT TRUTH NOT FULLY VERIFIED` with `SPECIALIST UNAVAILABLE` for the six default specialists;
- that is a scheduler/runtime integration gap, not a failure of no-signal discipline;
- the current Daily Routine is **not full-PASS** and must stay **PAUSED** until the V2 aggregation path is verified.

Manual skill tests #001/#002 remain valid for conversation-triggered bot-to-bot pulses. They do **not** prove the scheduled automation path.

## 2. Architecture

Six specialist-owned **read-only** daily pulse routines write one envelope each. The Chief of Staff Daily routine later **reads** those files and emits one Daily Intelligence Brief.

Do **not** rely on scheduled bot-to-bot messaging for the Daily layer.

```
specialist pulse window
  → six one-writer JSON envelopes in the shared Grok workspace
    → Chief of Staff Daily (after the window)
      → schema / freshness / role-identity validation
      → de-duplicate + conflict-check
      → one Daily Intelligence Brief
```

Conditional roles stay trigger-based and are **not** unconditional daily writers:

- Jetnity Product & UX Explorer
- Jetnity Analytics & Experimentation
- Jetnity Guardian

Legacy `Stabschef` / `Legacy Stabschef — DO NOT USE` is never a writer or Evidence-Bus hop.

## 3. Shared workspace handoff root

Canonical root (Grok shared computer / workspace):

`/workspace/jetnity/intelligence/daily/`

One writer per file:

| File | Writer role |
| --- | --- |
| `market-traveller.json` | Jetnity Market & Traveller Intelligence |
| `provider-commercial.json` | Jetnity Provider & Commercial Intelligence |
| `travel-truth-regulation.json` | Jetnity Travel Truth & Regulation Intelligence |
| `growth-discoverability.json` | Jetnity Growth & Discoverability |
| `finops-reliability.json` | Jetnity FinOps & Reliability |
| `security-privacy.json` | Jetnity Security & Privacy Red Team |

No other identity may overwrite another role’s file. The Chief of Staff is a reader of these six files, not a writer of them.

## 4. Envelope schema v1

Every specialist envelope MUST include exactly these fields:

| Field | Rule |
| --- | --- |
| `schema_version` | `"1"` |
| `run_id` | Unique id for this specialist pulse |
| `generated_at` | ISO-8601 timestamp |
| `timezone` | IANA timezone used for the window, normally `Europe/Zurich` |
| `role` | Exact canonical Jetnity role name |
| `window_start` | Inclusive start of the current daily window |
| `window_end` | Exclusive or documented end of the current daily window |
| `status` | `MATERIAL` \| `NO_MATERIAL` \| `DEGRADED` |
| `summary` | Short role-owned statement |
| `findings` | Array of canonical finding objects. Empty when `NO_MATERIAL` |
| `sources` | Array of canonical source objects with stable `source_id`. Never credentials |
| `source_freshness` | Freshness statement for the sources used |
| `errors` | Array. Empty when no error |
| `external_writes` | Must be `[]` |
| `authority_boundary_preserved` | Must be `true` |

Missing, extra-required, or invalid required fields make the envelope **invalid**.

Invalid / missing / stale envelope ⇒ Chief of Staff treats that role as `SPECIALIST UNAVAILABLE` or `SOURCE UNAVAILABLE` and marks the brief `DEGRADED`.

Never silently reuse a prior-day envelope.

This remains schema **v1**. The finding/source object shapes below are a required hardening inside v1, not a new `schema_version`.

### 4a. Canonical finding object

Every item in `findings[]` MUST use these keys exactly:

| Field | Rule |
| --- | --- |
| `classification` | Required. Role-owned class of the finding |
| `statement` | Required. The claim itself |
| `confidence` | Required |
| `impact` | Required |
| `source_refs` | Required array of `source_id` values that exist in `sources[]` |
| `next_actor` | Optional |
| `novelty` | Optional additive v1 field. `NEW_SIGNAL` \| `NEW_CORROBORATION` \| `MATERIAL_UPDATE` \| `CONTEXT_ONLY`. Do **not** bump `schema_version` for this field. |

Do **not** use `type` or a singular free-text `source` as substitutes. Those keys make the finding **invalid**.

`novelty` is schema-compatible and recommended. Its absence does not invalidate an otherwise valid finding, but a `MATERIAL` finding still must satisfy the §4d novelty / re-reporting gate.

### 4b. Canonical source object

Every item in `sources[]` MUST use these keys:

| Field | Rule |
| --- | --- |
| `source_id` | Required stable id referenced by `source_refs` |
| `title` | Required |
| `url` | Required |
| `date` | Required |
| `source_kind` | Required: `OFFICIAL` \| `FIRST_PARTY` \| `REPUTABLE_SECONDARY` \| `PRESS_RELEASE` \| `COMMUNITY` |
| `notes` | Optional |

A `source_refs` entry that does not match a `source_id` makes that finding **invalid**.

### 4c. MATERIAL discipline

- Marketing / PR copy must not be presented as independently verified product truth.
- One secondary or `PRESS_RELEASE` source alone must not create an overconfident FACT.
- `MATERIAL` means genuinely worth surfacing in the Daily Brief, not merely interesting.
- HOLD may reduce Jetnity actionability; it does not erase legitimate market intelligence.
- The Chief of Staff remains the final consolidator and may downgrade or action-filter a specialist `MATERIAL` item.
- Bounded public-source discovery is acceptable for `NO_MATERIAL` screening. Future `MATERIAL` findings should prefer first-party / high-authority sources or corroborated multi-source evidence before escalation.

### 4d. Novelty / re-reporting gate

Canonical Daily-intelligence quality rule after `JETNITY-MARKET-PULSE-SCHEMA-HARDENING-TEST-001` (`5737237338`). Market writer adoption is **PASS** via `JETNITY-MARKET-PULSE-NOVELTY-HARDENING-TEST-001` (`5737291119`). The final native re-canary plus CoS direct read is **PASS** via `JETNITY MARKET FINAL NATIVE RE-CANARY READ #001` (`5737734991`). That closes the complete Market proof and **opens the clone gate**. Cursor still does not implement the clone.

The schema-hardening test ran at `2026-09-19 01:02 Europe/Zurich` and elevated unchanged announcements dated `2026-09-10` and `2026-09-15` as `MATERIAL` in the current daily envelope. That was a quality defect for a recurring Daily pulse. The novelty-hardening test suppressed those prior Agoda / Meta Muse / ixigo / Travelxp Marco / Trip.Biz items as old/unchanged and returned `NO_MATERIAL`.

1. Track a canonical daily reporting window (`window_start` / `window_end`, normally `Europe/Zurich`).
2. Distinguish every finding as one of:
   - `NEW_SIGNAL` — first report of a development inside the current window;
   - `NEW_CORROBORATION` — independent new confirmation of an already-known item that materially changes confidence or impact;
   - `MATERIAL_UPDATE` — a genuine state change, contradiction, or newly material development on a previously known item;
   - `CONTEXT_ONLY` — historic or background evidence that must not mint a fresh Daily `MATERIAL` signal by itself.
3. A source older than the current reporting window may appear in `sources[]` as context, but **cannot by itself justify `status=MATERIAL`** for the current run.
4. Repeated unchanged announcements must not be resurfaced daily.
5. If all relevant evidence is old or unchanged:
   - `status` = `NO_MATERIAL`;
   - `summary` = the role-specific no-material signal;
   even if the historic context remains strategically interesting.
6. If a newly discovered older source materially changes the assessment, the envelope may be `MATERIAL`, but the finding must explicitly say this is **newly discovered historical evidence**, not a new market event. Prefer `novelty=MATERIAL_UPDATE` and state the discovery explicitly in `statement`.
7. Chief-of-Staff de-duplication remains the final defense. Specialists must suppress re-reporting at source.

Use the optional `novelty` field when emitting findings. Do not treat missing `novelty` as a schema-invalid envelope. Do treat a `MATERIAL` status justified only by old unchanged sources as a **novelty-gate failure**. The Chief of Staff must downgrade that role to `NO_MATERIAL` or mark the brief `DEGRADED` if the specialist cannot be trusted to suppress re-reporting.

This remains schema **v1**. Do not bump `schema_version` for `novelty`.

## 5. Freshness

The Chief of Staff MUST accept only envelopes generated for the **current daily window**.

- `window_start` / `window_end` must match the window the CoS is consolidating;
- `generated_at` must fall inside that window;
- `role` must match the canonical filename writer;
- `schema_version` must be `"1"`.

Prior-day files, empty files, parse errors, role mismatch, or `authority_boundary_preserved !== true` are unavailable, not `NO_MATERIAL`.

`NO_MATERIAL` is a verified current-window statement. Unavailability is the absence of that statement.

## 6. Chief of Staff Daily routine

After the specialist pulse window, `Jetnity Daily Intelligence Brief` (owner: Jetnity Chief of Staff; skill: Jetnity Daily Intelligence Orchestrator):

1. re-fetches live control state immediately before emitting the brief;
2. reads the six canonical files;
3. validates schema, freshness, role identity, the canonical finding/source object shapes, and the §4d novelty / re-reporting gate;
4. de-duplicates and conflict-checks;
5. emits one Daily Intelligence Brief using `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md` §13a;
6. does **not** write GitHub by default;
7. does **not** Ready, merge, mutate Production/Auth/Supabase/RLS, or start product work.

If any of the six envelopes is missing, stale, or invalid, the brief MUST be `DEGRADED` and MUST name the unavailable specialist. It MUST NOT invent `NO MATERIAL CHANGE` for that role.

Keep this routine **PAUSED** until the V2 aggregation path is verified.

## 7. Security

- The shared Grok workspace is **one blast radius**. Separate bot names are not isolation.
- No secrets, tokens, service-role keys, or sensitive raw personal data in handoff files.
- Use source links / IDs, not credentials.
- Least privilege. Read-only. `external_writes` stays `[]`.
- No Production-admin, payment-admin, or broad write token in the shared environment.

## 8. Required testing sequence

Market proof is complete. Sequence (d) is now **authorized** for later external Product-Owner / Chief-of-Staff setup. Cursor documents only and must **not** create, enable, or edit those Grok routines.

| Step | Proof required | State |
| --- | --- | --- |
| a | One specialist can write a valid current-window envelope | **PASS** — Market writer `5736871320` |
| b | Chief of Staff can read and validate that envelope cross-bot | **PASS** — `5736895145` |
| c | One specialist **scheduled** routine can refresh that envelope and CoS can read it without bot messaging | **PASS for transport** — scheduled Market `5737150676` + CoS read `5737188145` (`JETNITY-MARKET-PULSE-20260919-0053`) |
| schema | Canonical finding/source object shapes | **PASS** — `JETNITY-MARKET-PULSE-SCHEMA-HARDENING-TEST-001` (`5737237338`) |
| novelty | Recurring Daily pulse does not re-elevate old unchanged announcements as `MATERIAL` | **PASS for Market writer** — `JETNITY-MARKET-PULSE-NOVELTY-HARDENING-TEST-001` (`5737291119`) |
| re-canary | Native scheduled refresh of the hardened Market skill + CoS direct read of the refreshed file | **PASS** — `JETNITY MARKET FINAL NATIVE RE-CANARY READ #001` (`5737734991`, run `JETNITY-MARKET-PULSE-2026-09-19-6ff494`) |
| d | Clone the proven pattern to the remaining five specialists | **IN PROGRESS** — Market + Provider + Travel Truth **complete**. Growth is next. FinOps and Security writers not created. Cursor must not implement. |
| d-provider | Native scheduled Provider canary + CoS direct read without contacting Provider | **PASS** — `JETNITY PROVIDER NATIVE CANARY READ #001` (`5738078082`, run `JETNITY-PROVIDER-PULSE-2026-09-19-024605`) |
| d-travel-truth | Native scheduled Travel Truth canary + CoS direct read without contacting Travel Truth | **PASS** — `JETNITY TRAVEL TRUTH NATIVE CANARY READ #001` (`5740658975`, run `JETNITY-TRAVEL-TRUTH-PULSE-2026-09-19-1050`) |
| e | Full six-file CoS scheduled aggregation test | **OPEN** — blocked on remaining clones |

Until (e) is independently verified, the Daily CoS routine stays PAUSED and HOLD-exit stays **OPEN**.

### 8a. Clone gate

The proven Market pattern may now be cloned, with role-specific semantics, to:

1. Jetnity Provider & Commercial Intelligence → `provider-commercial.json`
2. Jetnity Travel Truth & Regulation Intelligence → `travel-truth-regulation.json`
3. Jetnity Growth & Discoverability → `growth-discoverability.json`
4. Jetnity FinOps & Reliability → `finops-reliability.json`
5. Jetnity Security & Privacy Red Team → `security-privacy.json`

Preserve exactly:

- one writer per canonical file;
- shared root `/workspace/jetnity/intelligence/daily/` (Grok workspace, not this git repo);
- `schema_version` `"1"`;
- canonical finding/source keys;
- additive `novelty` field;
- strict freshness / current-window behavior;
- no stale re-reporting;
- `MATERIAL` / `NO_MATERIAL` / `DEGRADED` discipline;
- source-quality discipline;
- `external_writes=[]`;
- `authority_boundary_preserved=true`;
- no secrets or sensitive raw personal data;
- no bot-to-bot dependency in scheduled runs;
- Chief of Staff as downstream validator/aggregator only.

This clone gate does **not** lift HOLD, Ready, merge, or authorize Cursor Grok mutation.

### 8b. Clone progress — Provider FINAL PASS

`JETNITY PROVIDER NATIVE CANARY READ #001` (`5738078082`) is **FINAL PROVIDER PASS**. Direct CoS workspace verification:

- canonical file `/workspace/jetnity/intelligence/daily/provider-commercial.json`;
- native scheduled run id `JETNITY-PROVIDER-PULSE-2026-09-19-024605`;
- `generated_at=2026-09-19T02:46:05+02:00`;
- previous manual validation run replaced;
- freshness / schema v1 / exact canonical role valid;
- novelty gate preserved; old unchanged provider/commercial evidence suppressed;
- `status=NO_MATERIAL`;
- provider neutrality preserved; no private commercial terms invented; no provider contact;
- `external_writes=[]`; authority boundary preserved; no sensitive data;
- Provider bot was **not** contacted by CoS.

That closes the Provider & Commercial specialist proof: native scheduled writer → canonical shared workspace file → direct CoS read/validation → novelty → provider-neutrality / commercial-truth boundaries.

Next **external** steps, not Cursor work:

1. restore Provider routine to normal schedule **06:55 Europe/Zurich** and keep it **PAUSED**;
2. restore Travel Truth to **PAUSED** **07:00 Europe/Zurich** (see §8c);
3. then clone Growth, FinOps, and Security.

The earlier Provider manual writer TEST #001 (`5737767891`) remains the paused-routine setup proof and is superseded for completeness by this native canary.

Market after final PASS is restored to its intended pre-production paused state (`5737767891`):

- routine `Jetnity Daily Market & Traveller Pulse`;
- schedule **06:50 Europe/Zurich**;
- state **PAUSED / NOT ACTIVE**;
- skill unchanged: `Jetnity Daily Market & Traveller Pulse Writer`;
- canonical file unchanged.

### 8c. Clone progress — Travel Truth FINAL PASS

`JETNITY TRAVEL TRUTH NATIVE CANARY READ #001` (`5740658975`) is **FINAL TRAVEL TRUTH PASS**. Direct CoS workspace verification:

- canonical file `/workspace/jetnity/intelligence/daily/travel-truth-regulation.json` (Grok workspace, not this git repo);
- native scheduled run id `JETNITY-TRAVEL-TRUTH-PULSE-2026-09-19-1050`;
- `generated_at=2026-09-19T10:55:25+02:00`;
- previous manual validation run replaced;
- freshness / schema v1 / exact canonical role valid;
- novelty gate preserved; old unchanged regulation suppressed;
- `status=NO_MATERIAL`;
- official-source-first discipline preserved;
- effective-date distinction preserved;
- multi-citizenship / multi-document discipline preserved;
- destination vs transit distinction preserved;
- fail-closed discipline preserved;
- no authority contact;
- no sensitive traveller data;
- `external_writes=[]`; authority boundary preserved;
- Travel Truth bot was **not** contacted by CoS.

That closes the Travel Truth & Regulation specialist proof: native scheduled writer → canonical shared workspace file → direct CoS read/validation → official-source-first → effective-date vs active-current → multi-citizenship / multi-document → destination vs transit → fail-closed.

The earlier Travel Truth manual writer TEST #001 (`5740522887`) remains the paused-routine setup proof and is superseded for completeness by this native canary. The UI Erfolgreich observation (`5740619641`) is scheduler-fire evidence only and is not the completeness proof.

Do not invent visa, transit, health, carrier, eligibility or document rules. Preserve `unknown` when evidence is insufficient. Evaluate per traveller and per necessary legal credential option.

Next **external** steps, not Cursor work:

1. restore Travel Truth routine to normal schedule **07:00 Europe/Zurich** and keep it **PAUSED**;
2. proceed to Growth & Discoverability using the same proven transport/schema/novelty pattern, with role-specific ethical-growth, SEO, and AI-search / answer-engine discoverability. Do not invent metrics. Do not use dark-pattern or policy-bypass behavior.

## 9. What this contract is not

- not a Product Development resume;
- not a HOLD lift;
- not authorization to Ready or merge PR #491;
- not authorization to unpark PR #487;
- not a Cursor order to create, enable, or edit Grok routines;
- not a git-tree path inside this repository;
- not a full Daily Routine PASS.

**STOP.** External Product-Owner / Chief-of-Staff setup implements this later. Cursor documents only.
