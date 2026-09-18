# Jetnity – OS-2 Daily Automation V2 – Scheduler-Compatible Handoff Contract

Stand: 18. September 2026  
Status: **CANONICAL CONTRACT / NOT IMPLEMENTED / NOT VERIFIED / COS DAILY REMAINS PAUSED**  
Dispatch: PR #491 comment `5736670149`  
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
| `findings` | Array. Empty when `NO_MATERIAL` |
| `sources` | Array of source links or IDs. Never credentials |
| `source_freshness` | Freshness statement for the sources used |
| `errors` | Array. Empty when no error |
| `external_writes` | Must be `[]` |
| `authority_boundary_preserved` | Must be `true` |

Missing, extra-required, or invalid required fields make the envelope **invalid**.

Invalid / missing / stale envelope ⇒ Chief of Staff treats that role as `SPECIALIST UNAVAILABLE` or `SOURCE UNAVAILABLE` and marks the brief `DEGRADED`.

Never silently reuse a prior-day envelope.

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
3. validates schema, freshness, and role identity;
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

Do not skip ahead. Do not clone five more specialist routines before step (c) passes.

| Step | Proof required | State |
| --- | --- | --- |
| a | One specialist can write a valid current-window envelope | **OPEN** |
| b | Chief of Staff can read and validate that envelope cross-bot | **OPEN** |
| c | One specialist **scheduled** routine can refresh that envelope | **OPEN** |
| d | Clone the proven pattern to the remaining five specialists | **OPEN** — blocked on a–c |
| e | Full six-file CoS scheduled aggregation test | **OPEN** — blocked on d |

Until (e) is independently verified, the Daily CoS routine stays PAUSED and HOLD-exit stays **OPEN**.

## 9. What this contract is not

- not a Product Development resume;
- not a HOLD lift;
- not authorization to Ready or merge PR #491;
- not authorization to unpark PR #487;
- not a Cursor order to create, enable, or edit Grok routines;
- not a git-tree path inside this repository;
- not a full Daily Routine PASS.

**STOP.** External Product-Owner / Chief-of-Staff setup implements this later. Cursor documents only.
