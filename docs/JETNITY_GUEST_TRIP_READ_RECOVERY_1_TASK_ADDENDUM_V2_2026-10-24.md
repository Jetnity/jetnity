# Guest Trip Read Recovery 1 — TASK ADDENDUM V2

Date: 24 October 2026. Technical-Lead-owned immutable addendum to TASK V1; V1 remains unchanged.

## Authority and exact evidence

Same owner-authorized finite R104 lane B, issue #991, Draft #994.
Author remains **Jetnity Guest Trip Read Recovery 1 — Cursor Generation 1**, actual Cursor session **bc-2806475d-7ee4-40d0-980e-1d26bcb5b270**, model grok-4.7-high-fast.
Base main remains 913cf9353fd33491d2bd3130b3c430cc88990200; integration B → A → C.

TL R1 [6383118170](https://github.com/Jetnity/jetnity/pull/994#issuecomment-6383118170) remains binding. At 8f954a46475fc4666593d6fd2667d3ef979f88e9 the author correctly stops invalid/unreadable occupancy before the migration-capable loader, but replaces the existing invalid-active-plus-valid-queue visibility assertion with an empty queue. The accepted baseline displayed that queue with zero writes. Root inspected the source delta and independent baseline evidence.

The existing public APIs cannot return the queue independently of the migration-capable loader. The private bestandWarteschlange() already owns the accepted read/parse/filter/normalization/limit semantics. Duplicating those semantics in a component or suppressing existing queue visibility is not the chosen solution.

## Narrow additional write permission

In addition to V1's runtime allowlist, permit **one additive, narrowly named exported readonly wrapper in lib/trips/gastspeicher.ts**, for example gastspeicherWarteschlangeLesen(): Trip[], whose implementation only returns the existing private bestandWarteschlange() result.

The existing private reader, all existing exports, parser/validation/normalization, keys/formats/limits, occupancy, loader, legacy migration and every mutation/adoption function must remain behaviorally and textually unchanged. No new storage authority, parser, schema, persistence contract, write option, global storage interception, cached fallback or server operation. This is an additive consumer seam exposing unchanged local read logic.

The new wrapper may read only through that existing queue implementation. It must not inspect active or legacy storage, call gastspeicherLaden(), migrate, set, remove, clear or adopt anything.

Use it in the lane's error-state reconciliation to preserve valid queue presentation after a known invalid active observation, while retaining the early stop before any migration-capable loader. An unreadable active observation remains honestly unreadable; do not relabel unobserved storage as absent.

No other V1 readonly path is opened. This addendum file itself is TL-owned; the author must not change it.

## Required acceptance, without weakening V1

- Restore the invalid-active-plus-valid-queue test to require the actual queued ID/title, no create permission, unchanged raw active/legacy/queue bytes and zero mutation calls.
- Mounted list evidence must display the valid queued draft beside the invalid-active error, with no fabricated active continuation or first-trip create CTA.
- Keep deterministic failed-initial-observation/later-key-change tests: a later active change must not cause the failed observation to enter migration.
- Prove the new wrapper uses only the queue key and makes no set/remove/clear/adoption call; existing queue normalization/filter/limit behavior must remain the existing implementation's responsibility.
- Preserve queue-only, valid matching/different active, stored-ID legacy migration/write-failure and no-ID continuation controls.
- Finish all other R1 findings: unrelated optional diagnostic read faults must not hide a valid active trip; unchanged-error keyboard retry retains meaningful local focus; error copy and diagnostic claims are honest; author proof enforces its local-only network boundary.
- Existing accepted tests must not be weakened. Dedicated lane tests and mounted proof may be extended within V1.
- Update PLAN/REPORT/STATUS/SELF_REVIEW/HANDOFF to cite this V2 and disclose exact new facade scope. Re-run meaningful focused and mounted checks, typecheck/lint and required gates. Every new head requires fresh TL review.

## Integration and stops

This is a TL scope decision inside the same ordinary product task, not another lane or a Product-Owner activation decision. No hosted/Supabase/Auth/RLS/migration/provider/model/credential/budget/Production change follows. Standing holds in V1 remain unchanged.

Fetch and incorporate this TL documentation commit without force-pushing or discarding existing work before the facade implementation. Continue only in the same original author session. Do not Ready, merge, close #991 or start a follow-up. Complete the delivery and stop for independent TL review.
