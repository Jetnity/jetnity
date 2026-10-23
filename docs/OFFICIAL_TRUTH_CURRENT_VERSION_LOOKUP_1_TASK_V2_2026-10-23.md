# Official Truth Current-Version Lookup 1 — TASK V2 pre-dispatch correction

Date: 23 October 2026 (Europe/Zurich)
Issue: #975
Branch: `feat/official-truth-current-version-lookup-1`
Writer: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**
Status: immutable TL amendment BEFORE any implementation dispatch or assigned session.
Read together with TASK V1; V2 governs the two points below. All other scope, model, authority, review and STOP boundaries are unchanged.

## 1. Preserve the actual existing synthetic admission

TASK V1 section 6 mistakenly named `example.invalid` as the fixture domain. The existing unchanged custody admission permits the conformance corpus at:

`https://regulations.example/rules/{primary_rule|composed_effect|composed_mode}`

Use this existing admitted synthetic corpus unchanged, with newly constructed synthetic receipt versions through the existing codecs. Preserve its source, profile, version and media-type restrictions. No new domain/source/profile admission. No network access to these example URLs.

This correction does not authorize changing an existing admission, custody module, migration or test.

## 2. Define the exact completeness set

The exact accepted-event ↔ binding ↔ review ↔ receipt relation is required for the **accepted bound corpus**:

- Every accepted event has exactly its corresponding binding, protected synthetic review and retained receipt.
- Every accepted binding has exactly the corresponding accepted event and matching review/receipt identity.
- Detect missing, duplicate, corrupt, mismatched and orphan accepted associations; no false unique or false empty lookup.
- Separately committed unpublished reviews and unbound provenance receipts may exist. Their mere existence is not a completeness failure and they must not count as accepted/current candidates.

The required review-only regression must demonstrate this distinction. A caller cannot supply a partial accepted corpus to avoid completeness checks.

**NOT DISPATCHED. STOP before code until actual Claude Opus 5.5 High model and session evidence are verified. No Ready, merge or follow-up authority.**
