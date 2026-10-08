# Direkte Reisebearbeitung 1 — contracts

Issue #904 / Draft #905. Immutable TASK v1.0, blob `46d71cc4840d4a45b89459ee9e7e38e5632a6616`. Author contract reconciliation, not TL acceptance.

## Input and operations

| Direct field | Existing operation | Meaning and boundary |
| --- | --- | --- |
| Title | `stammdaten.titel` | Nonempty literal title, existing maximum; no silent truncation or whitespace normalization. |
| Budget target | `stammdaten.budgetziel` | 0–1,000,000, at most two decimals, existing currency; no clearing, FX or booking total. |
| Pace/interests/wish | `stammdaten.tempo/interessen/reisewunsch` | Existing enums; empty interest array supported; nonempty literal wish including amounts/newlines, no model price stripping. |
| Start date | `stammdaten.startdatum` | Existing first-date/absolute-shift operation, valid civil date; no timezone or availability authority. |
| Total days | `dauer_aendern.tageDelta` | Existing ±30 bound, graph maximum and minimum one day. Changes last days. |
| Stage duration | `etappe_dauer` | Existing stable stage ID and ±30; actual graph order. |
| Stage removal | `etappe_entfernen` | Existing stable ID; last-stage removal rejected; normal contained content removed and protected content unplanned. |

The strict input schema rejects extras, replacement graphs, location/ownership claims, null clearing, duplicate/foreign stage identities, unsupported values, no-ops and contradictory totals. Compatible edits form one operation set (maximum20). New day IDs derive deterministically from a validated fresh UUID seed, so preview and commit IDs match; collisions with surviving identities are rejected. No operation kinds, schema limits or SQL payload contracts changed. The form visibly chooses total-duration or stage-duration input; inactive duration inputs have no authority.

## Consequences and preserved facts

The production preview uses actual accepted before/after graphs. It shows basic changes, complete stage/day placement, every removed normal point, preserved unplanned protected points, fixed protected dates, and changed explicit noncommercial dates/times. Groups render20 rows per visible page; all rows remain reachable. Temporal conflicts/coverage use the existing consumer. Preparation dependencies reuse #903 `planSnapshot` / `aenderungsAuswirkung`; these are impacts, not new completion or official-truth conclusions.

Shared `reindex` no longer replaces explicit item dates with container dates. Metadata-only operations skip the unrelated final structural reindex. Whole-trip shifts retain the existing paired eligible civil-date shift, preserving nulls and protected content. Structural operations still reindex positions and containers under the existing rules. No new date-repair algorithm.

Manual Account actions read canonical owner-visible facts and perform no place resolution. Stored places, coordinates and routes therefore do not depend on catalog availability. The model path retains its existing canonicalization. Account candidates retain the authoritative day-stage-assignment mode because the unchanged RPC does not write that field; Guest retains its established read normalization.

## Session, transaction and confirmation

An in-memory session binds source, trip ID, base revision, draft generation, strict input, deterministic day seed and expected semantic hash. Editing/back invalidates acceptance; cancel/reopen discards an ordinary draft. Pending/uncertain state disables competing mode/close/edit actions. Generation/source checks prevent delayed callbacks updating a replaced session. Drafts are not written to a new store, URL, log or telemetry.

The Account boundary validates the session and strict input, independently loads the current Trip, recomputes the candidate and checks the accepted fingerprint. Only the normal authenticated RLS client calls unchanged `reise_aendern`. Its SQL compare/transaction remains decisive, including real child-trigger revision changes. The Guest boundary checks expected active trip ID immediately after reading storage and checks revision again synchronously at mutation. This also binds the existing free-text caller. No claim of globally atomic multi-tab localStorage transactions.

One content-bound SHA-256 mutation ID binds seed, trip, base and accepted meaning. Same-request retries first read actual stored state and require exactly base+1, matching last mutation and full semantic hash. A later edit prevents claiming historical success. A resolved write acknowledgement is insufficient: independent authoritative readback must verify the actual committed graph, stable identities and protected facts. Only revision/last mutation/update timestamps and item row versions are excluded from semantic comparison. New day IDs match exactly.

A lost acknowledgement still triggers readback. Unavailable/mismatching confirmation stays uncertain; accepted proposal and ID remain available for read-only verification or same-proposal retry. Validation, conflict, lost access, unavailable read and uncertain write are distinct outcomes. No guessed next revision is returned to the Workspace. Account callback installs the confirmed graph, then refreshes; Guest installs the independently read storage result. Existing free-text apply also returns an independently read Account graph and uses content-bound mutation IDs.

## A09 valid removal and impossible-graph refusal — TL v1.1

Native isolated GoTrue/PostgREST/PostgreSQL reproduction found that deleting a normal item referenced by `trip_readiness_items.trip_item_id` fails with SQLSTATE23502. The existing composite foreign key in `20260822010000_trip_readiness_items.sql` uses `ON DELETE SET NULL` across `(trip_item_id, trip_id, user_id)`, while trip_id/user_id are NOT NULL. The entire macro transaction rolls back and retains the point/revision. This is not a transport failure or permission inference.

The existing canonical Trip schema also rejects orphaned preparation references in both sources. Such direct proposals fail before a save action is offered, with a linked-preparation diagnostic. Unrelated metadata/date changes and removal of unreferenced points remain available. Guest has the same canonical reference constraint; no dependent cleanup is invented. The editable input and discard control remain available. There is no generic unlink promise. Separate existing Preparation actions, where allowed by their current kind/state, remain deliberate separate actions followed by authoritative reload and a new proposal.

[TL A09 clarification v1.1](https://github.com/Jetnity/jetnity/pull/905#issuecomment-6044443343) resolves the scope: this invalid proposal must refuse; it is not a cleanup deliverable. Both production Guest and Account tests assert zero writes, complete unchanged graph/Preparation records, retained draft and a subsequent supported unrelated save/reload. Positive valid removal and protected-unplanned preservation remain independently required and covered. The baseline SQL probe is expected rejection/full rollback, not product permission to bypass canonical validation. TASK§9 contracts and immutable TASK are unchanged.

## Unchanged authority

No hosted application write, migration, new secret, dependency, model/provider activation, quota use, traveller/registry/document change, currency/clear contract, new place/stage/reorder/rename semantics, launch or retention decision. All Account fixtures and fault injection use disposable, run-owned local containers with synthetic users. Neither #900 nor any global governance file is edited. No main synchronization, Ready, merge or competing writer.

## TL R1 presentation clarification

Under [TL R1 review5448280929](https://github.com/Jetnity/jetnity/pull/905#pullrequestreview-5448280929), temporal results in direct-edit effects describe the **proposed** graph. The underlying proven/possible classification stays unchanged. “Gespeichert” remains appropriate for the unchanged existing Preparation record and for success only after independent committed-graph readback. This is a wording correction within A10/A11/A23, with no operation, temporal-engine, storage, SQL or authority contract change.
