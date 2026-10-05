# Jetnity – V1 Trip Workspace & Account Revalidation 1 – Next Slices

Stand: 21. September 2026  
Status: **SPECIFICATION ONLY / NOT DISPATCHED / NOT IMPLEMENTED**

Source report: `docs/V1_TRIP_ACCOUNT_REVALIDATION_1_REPORT_2026-09-21.md`  
Product SHA this specification is bound to: `main@c7fb9f0f693ba9f020add7b26a041263aa7e3b07`

Technical Lead selects, versions and dispatches. Cursor does not start these slices from this PR.

These three are the first useful **ungated** trip/account honesty repairs. They are not a substitute for PO-gated V1 launch work (legal pages, SMTP, deletion, official/commercial providers, TW-8).

None of them depends on #506 visual findings or #508 admin foundation.

---

## TA-R1 — Guest invalid-draft honesty

**User outcome:** If a guest draft exists in the browser but is not a valid trip, the account home tells the user that the draft cannot be adopted. It does not look like “there was never a trip.”

**Source residual:** RH-2.1, revalidated. `gastreisenUebernehmen` → `{ art: 'nichts' }` (`lib/trips/uebernahme.ts` L79–80). `GastreiseBruecke` treats `nichts` as `ruht` (`components/trips/GastreiseBruecke.tsx` L73–75).

**Acceptance cases:**

1. Valid guest draft still adopts; retry / `client_ref` / abort-on-first-error unchanged.  
2. Impossible/unreadable active key: new bericht art (example: `ungueltig`) distinct from `nichts` (no draft) and `fehler` (server failed).  
3. UI shows a dedicated invalid-draft message; raw `localStorage` is not deleted without an explicit user action.  
4. Empty storage still yields `nichts` and stays silent.

**Proposed file ownership:**

- `lib/trips/gastspeicher.ts`  
- `lib/trips/uebernahme.ts`  
- `components/trips/GastreiseBruecke.tsx`  
- `lib/trips/uebernahme.test.ts`  
- `lib/trips/gastspeicher.test.ts`

**Contracts that must not change:** ADR-0042 happy-path adopt; one active guest trip; no silent overwrite; no account create without valid Nutzlast; no Auth/RLS/schema change.

**PO gate:** None, unless product later changes guest-model semantics.

**V1 vs later:** V1 guest→account honesty. Small.

**#506 / #508 dependency:** None. Visual audit may later restyle the message; it must not own the art.

---

## TA-R2 — Protected-item date-mismatch attention

**User outcome:** After a trip date shift, a protected commercial item that kept its old `startsOn` is visibly stale/mismatched. The item dates are not rewritten.

**Source residual:** TA-N1 (new). `zeitraumVerschieben` skips commercial dates (`lib/reiseaenderung/anwenden.ts` L172–175). Attention has no item-date signal (`lib/trips/attention.ts`).

**Acceptance cases:**

1. Existing `anwenden.test.ts` commercial-date assertions still pass.  
2. A protected item with `startsOn !==` owning `dayDate` produces an attention point (`stale` or equivalent named lage).  
3. Non-commercial items whose dates moved with the trip do not get that signal.  
4. No provenance write, no provider call, no price invention.

**Proposed file ownership:**

- `lib/trips/attention.ts`  
- `lib/trips/attention.test.ts`  
- optional tiny helper next to `lib/reiseaenderung/geschuetzt.ts` if needed for `istKommerziell` reuse  
- copy only if an existing workspace attention list is the display surface (`components/trips/` already rendering attention)

**Contracts that must not change:** Commercial field freeze; no TW-8; no S5-B writer; no selected-state rewrite.

**PO gate:** None for the signal. Any later “move the commercial date” product would be a different, gated discussion.

**V1 vs later:** V1 change-honesty. Does not unlock TW-8.

**#506 / #508 dependency:** None. #506 may later check contrast of the new signal; it does not specify it.

---

## TA-R3 — Foundation-E fallback degraded honesty

**User outcome:** If an account trip graph cannot load citizenship/document children, readiness is marked degraded / incomplete. The UI does not silently present one nationality/document as the traveller.

**Source residual:** RH-4.1 + RH-12.2. `TRIP_GRAPH_SELECT_LEGACY` + `travellerAusZeile` singular columns (`lib/trips/daten.ts` L189–196; `lib/readiness/reisende.ts` L81–102). Header comment still claims Production lacks children (`lib/trips/foundation-e-select.ts` L1–5).

**Acceptance cases:**

1. Happy-path canonical select unchanged.  
2. When `foundationERelationFehlt`, result carries an explicit degraded flag (or readiness fail-closed), not a quiet singular traveller.  
3. File header cites fallback-on-missing-relation only; does not claim Production children are absent.  
4. No migration, no expand/contract removal, no Production SQL.

**Proposed file ownership:**

- `lib/trips/foundation-e-select.ts`  
- `lib/trips/daten.ts`  
- `lib/readiness/reisende.ts`  
- `lib/trips/foundation-e-select.test.ts`  
- existing reisende/party tests as needed

**Contracts that must not change:** Dual-Authority; peer credentials on the happy path; expand/contract safety net may remain; no new identity model.

**PO gate:** None for comment + degraded flag. Yes for any Production schema/apply change.

**V1 vs later:** V1 traveller-truth honesty on the degraded path. Production children are already documented as applied; this is belt-and-braces.

**#506 / #508 dependency:** None.

---

## Explicitly not next slices

Do **not** dispatch from this document:

- Legal `/privacy` `/terms` (needs PO content)  
- Account deletion, retention cron, SMTP, backup codes, observability vendor  
- Persistent `security_events` writer (5.2; local proof already merged via #494)  
- TW-8 / TW-9 / real providers / official requirements provider  
- AP-8 preferences, AP-9 favourites, AP-11 notifications, AP-12 entitlements  
- Registry live-sync or in-place snapshot refresh  
- First-class day→stage editor (needs a provenance contract; TW6 `unassigned` is accepted)  
- Global continuity rewrite of `ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` (TL-owned)  
- RH-5.1 / RH-6.1 unless an official provider slice is about to land  
- Any #506 visual redesign or #508 admin Copilot foundation

If Technical Lead decides none of TA-R1–R3 is worth a slice before the PO-gated launch blockers, say so. That is a valid close of this revalidation.
