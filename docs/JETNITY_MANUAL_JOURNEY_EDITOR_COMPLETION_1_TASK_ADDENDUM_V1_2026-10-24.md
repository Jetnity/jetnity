# Manual Journey Editor Completion 1 — TASK ADDENDUM V1

Date: 2026-10-24. Technical Lead-owned, immutable additive clarification to TASK V1. R105 lane C / issue #998 / Draft PR #1001.
Exact author remains **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**; same Cursor session **bc-02fbe98d-97ba-4c0b-a3b0-10857d784379**, requested/author-attested model grok-4.7-high-fast. No new generation or writer.

## Review basis

TL independently read PLAN head **a5159391fc1872d62e2599302bbf0cb62d521109**, PLAN blob162cd6f1b28a6c5780014cea0d460ae536849c3b, unchanged TASK blobabf6f8f6edc3448b519c9b5370724cfac9b38f10, two-file diff, merge-base main0c37d318c47a758f06634448d6e0de3856bbc6a6,2 ahead/0 behind. Read-only Work review corroborated the following two concrete gaps. No implementation has yet been authorized.

## 1. Honest primary connection error

An unconfirmed create outcome must be communicated in the primary focused/announced error itself. Do not retain the definitive "Die Verbindung konnte nicht gespeichert werden" sentence and contradict it with a separate non-alert paragraph. Keep one accessible primary alert.

For the thrown/rejected case, use clear wording equivalent to:
"Ob die Verbindung gespeichert wurde, konnten wir nicht bestätigen. Deine Eingabe bleibt erhalten. Prüfe deinen Reiseplan vor einem erneuten Versuch. Ein erneuter Versuch kann eine zweite Verbindung anlegen."

This is an uncertainty message, not an assertion that a write failed or was rolled back. No automatic retry, no hidden idempotency contract, no new writer behavior. Existing explicit domain error strings, success wording, input retention, pending lock and deliberate retry behavior remain.

### Additional exact test ownership

In addition to the existing TASK hash-only allowance, this addendum permits only changing the expected connection thrown/rejected text constant in:
- `scripts/organisieren-action-recovery-1/harness.mjs`: `VERBINDUNG_ABGELEHNT` (baseline line29); keep the exact equality assertion near548 and all other behavior/assertions.
- `scripts/manual-mobility-pending-draft-guard-1/harness.mjs`: `THROWN` (baseline line24); keep the exact equality assertion near432 and all other behavior/assertions.

Bind both to the actual new truthful text. Do not weaken equality checks, remove failure/pending/retry/payload/secret-redaction assertions, alter viewports, or change returned-domain/success/rental/booking text. Record this explicit R103/R104 text-lineage migration in the lane's new report. Historical TASKs, reports and evidence are unchanged.

## 2. Preserve historical harness output

Both existing harnesses currently hard-code `EVIDENCE` to their historical evidence folder (baseline line19), with `SCREENS` derived from it. A normal rerun would overwrite historical outputs, which TASK V1 forbids.

This addendum additionally permits **only their EVIDENCE output-path initialization and strictly necessary path handling** to accept an explicit test-only environment override `JETNITY_R105_C_EVIDENCE_DIR`, while preserving the old default and the derived screenshots path. When used for this lane, the override must point below `docs/evidence/manual-journey-editor-completion-1/`, with distinct R103 and R104 subfolders. No arbitrary production route, network target, runtime configuration or dependency change follows.

Run regression proof with that explicit override; preserve every historical report/screenshot/manifest byte-for-byte. New evidence must name the real tested source, changed harness bytes, command/override, exact head, actual cases/exits, browser and limitations. Do not relabel new proof as the old accepted head. A disposable-copy execution with equally exact provenance is also permissible without editing other script behavior.

## 3. Revised PLAN-only gate

The existing TASK V1 remains immutable. First read this addendum, update only the owned PLAN to remove the contradictory-alert proposal and name the exact two text constants plus safe regression output path, commit, post exact head/merge-base/ahead/behind/file list, and STOP.

At this revised gate, the only diff may be TASK V1 + this TL addendum + revised PLAN. Runtime/test implementation still requires a subsequent explicit TL acceptance in this same session. The justified trip-id addition to the existing flight readback wrapper is within the original conditional allowance; it does not authorize booking lifecycle changes.

All other allowlists, acceptance requirements, costs, standing holds and A → C → B integration order remain unchanged. Only TL Ready/merge; no issue closure or follow-up by Cursor.
