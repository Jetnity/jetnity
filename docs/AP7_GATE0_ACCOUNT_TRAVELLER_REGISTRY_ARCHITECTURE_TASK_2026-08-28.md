# Jetnity – AP-7 Gate 0 Account-Traveller-Registry Architecture Task

Stand: 28. August 2026  
Status: **AUTHORIZED / AUDIT + ARCHITECTURE ONLY / NO RUNTIME / NO SCHEMA WRITE / STOP FOR TECHNICAL-LEAD REVIEW**  
Workstream: Account / Traveller  
Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 11`**

## 0. Visible Cursor name gate

Binding first requirement: `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md`.

The visible Cursor agent/session title must be exactly:

`Account plattform audit vorbereitung 11`

Do not accept or claim a different visible session name. If the current Cursor session is visibly named differently and no rename/title capability is available, STOP before material work and report the naming blocker. Do not invent a new generation merely because a pure launch attempt was misnamed.

## 1. Live baseline

Repository: `Jetnity/jetnity`

Baseline at task creation:

`main @ 1947285cc4d7d6fb98c77ec60a04c96f96f3f483`

Post-PR143 verification:

- GitHub Actions run `33188008696`: SUCCESS on exact baseline main.
- Vercel Production `dpl_3mhanrnvtDgaQeApjhsx4R6BzPQE`: READY on exact baseline main.
- Branch Protection unchanged: `protected=false`.

Live evidence wins. Re-fetch `origin/main` before final handoff.

## 2. Why this is the next slice

The binding build order puts Traveller / Pass / Multi-Citizenship product completion ahead of simply continuing later Account Platform convenience work.

Current truth:

- Trip Workspace core is integrated through TW7-A, but TW-8 remains blocked by Provider S5 + real Commercial Provenance.
- Foundation E is already Production truth and must not be rebuilt.
- P1-TA-02, P2-TA-06 and P2-TA-04 C1 are integrated.
- Current Traveller identity is trip-scoped.
- Account-wide Traveller Registry is missing and explicitly gated as AP-7.
- AP-5-S3/S4/S5 remain valid normal Technical-Lead slices, but they are not automatically the next global slice.

This Gate 0 does **not** authorize AP-7 implementation. It exists to make the architecture decision precise enough for the Product Owner and Technical Lead to decide responsibly later.

## 3. Binding Traveller truth

Preserve throughout:

> One traveller → multiple citizenships → multiple travel documents / credentials → context-dependent evaluated admissible options.

Never:

- invent a default citizenship;
- invent a default passport/document;
- equate issuer country with citizenship;
- use `documents[0]` or `evaluations[0]` as Product Truth;
- assume residence, locale, language, domain or departure country is citizenship;
- collapse multiple credentials into one preferred credential without explicit context/evidence.

## 4. Required Gate-0 work

Independently reconstruct and document the current live architecture around:

1. trip-scoped `trip_travellers`;
2. `trip_traveller_citizenships`;
3. `trip_traveller_documents`;
4. existing child limits and ownership/RLS boundaries;
5. Guest → Account transfer and current `party[]` semantics;
6. Readiness / credential option generation;
7. official-evaluation option scope;
8. account identity/profile model;
9. privacy/export/delete implications;
10. current Admin/support visibility boundaries;
11. future native-client coherence (`one product, one truth, multiple clients`).

Then produce an architecture comparison for a future account-wide Traveller Registry.

At minimum compare:

- keeping trip-scoped traveller truth as the only canonical identity and adding reusable templates only;
- introducing a true account-scoped canonical Traveller Registry with trip-specific snapshots/participation;
- any materially safer alternative discovered during the audit.

Do not force one of those options if evidence supports a better design.

## 5. Required architectural questions

The audit must answer explicitly:

- What is the canonical identity of an account traveller?
- How are traveller, citizenship and document records keyed without fragile positional identity?
- How do trips reference or snapshot account travellers without retroactively rewriting historical trip truth?
- What happens when an account traveller is edited after a trip was created?
- What is shared vs trip-specific?
- How do multiple citizenships and multiple documents remain first-class?
- How is a document related to a citizenship without assuming issuer = citizenship?
- How is an explicit user choice for a trip represented without becoming a global default passport?
- How do Guest → Account trips behave when no account registry exists yet?
- How would import/deduplication work without silently merging two real people?
- How are delete, detach, archive and historical-trip retention handled?
- How do readiness results become stale when traveller facts change?
- Which fields are safe to persist and which sensitive fields must remain excluded by default?
- What are the minimum RLS/ownership invariants?
- How does collaboration/participation interact with account-owned travellers?
- What are migration/rollback/compatibility risks?
- How would web and future native clients use the same contract?

## 6. Security / privacy boundary

Gate 0 must default to data minimization.

Do not propose storing passport numbers, document scans, MRZ, biometrics or equivalent high-sensitivity payloads as a default requirement.

If the audit believes any such storage could ever be useful, classify it separately as an explicit future Product-Owner + Security/Privacy gate. Do not normalize it into the core registry model.

No secrets. No service-role product path. No production write.

## 7. RLS / Identity boundary

A future true account-wide registry would change Identity / Ownership / RLS semantics and therefore requires a Product-Owner gate before implementation.

Gate 0 may:

- inspect current policies/functions/grants read-only;
- describe proposed ownership invariants;
- identify migration requirements;
- recommend a model.

Gate 0 may not:

- add tables;
- add/alter policies;
- GRANT/REVOKE;
- add SECURITY DEFINER functions;
- apply migrations;
- mutate Supabase;
- implement AP-7 runtime.

## 8. Required deliverables

Create/update only AP-7 Gate-0 evidence needed for this slice, including:

1. `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_STATUS_2026-08-28.md`
2. `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_HANDOFF_2026-08-28.md`
3. `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_SELF_REVIEW_2026-08-28.md`
4. a new ADR only if needed to record **Gate-0 recommendation status**, never to pretend the Product Owner has approved AP-7 implementation;
5. minimal continuity updates necessary to record this active slice and the exact next gate.

The Status/Handoff must contain:

- exact main/baseline;
- branch/PR/exact head;
- exact assigned agent name and visible-name evidence;
- Task/Scope/Non-Scope;
- options considered;
- recommended architecture with reasons;
- unresolved risks;
- Product-Owner decision required before implementation;
- finished vs unfinished;
- exact first unfinished next step.

## 9. Required recommendation quality

Do not merely list options. Recommend the architecture that best preserves:

- user simplicity;
- multi-citizenship/multi-document truth;
- historical trip correctness;
- privacy/data minimization;
- RLS/ownership simplicity;
- Guest → Account correctness;
- provider/readiness compatibility;
- native/web coherence;
- long-term maintainability.

State trade-offs and residual risks explicitly.

## 10. Hard non-scope

No:

- AP-7 runtime implementation;
- schema or migration;
- Supabase mutation;
- RLS/GRANT/REVOKE/SECURITY DEFINER change;
- Auth/Session/MFA/AAL behavior/config change;
- AP-5-S3/S4/S5 implementation;
- AP-6 implementation;
- provider runtime or paid/live calls;
- TW-8/TW-9;
- Search/Homepage issues #109/#110;
- Native implementation;
- Branch Protection change;
- historical cleanup;
- Ready;
- merge;
- follow-up implementation slice.

## 11. Independent-review stop

Agent self-review is not PASS.

When finished:

1. re-fetch `origin/main`;
2. record exact head and ahead/behind;
3. verify the visible Cursor name requirement;
4. stop for independent Technical-Lead exact-head review;
5. do not mark Ready;
6. do not merge;
7. do not start AP-7 implementation or any other slice.
