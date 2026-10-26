# R108-A — Activities Search and Selection Lifecycle 1 — PLAN

Date: 26 October 2026. Immutable TASK V1 is not modified.
Baseline seed: `889d91ce9b9979040647c79aec2f073f0a8cdb60`. Parent/merge-base: `cdc5b47163c2f1bb272fb46ed6723e9522489e92`.

## Source-confirmed ownership

| Path | Responsibility |
| --- | --- |
| `lib/activities/suchlebenszyklus.ts` | Local UI identity only: trip, stage, day, semantic request key, monotonic generation/epoch. Synchronous adoption claim, own-lock release, honest outcome text. No fetch, storage, provider, or provenance. |
| `lib/activities/suchlebenszyklus.test.ts` | Reducer and claim proofs, including ignored-abort application, A→B→A, cross-trip, semantic invalidation, reused id, duplicate claim, null/string/throw/malformed. |
| `lib/activities/client-anfrage.ts` | Allowlisted parse of the existing neutral envelope before any render or action. |
| `lib/activities/client-anfrage.test.ts` | Malformed JSON, non-2xx success shape, invalid option, partial/empty/rate-limit, secret drop. |
| `components/trips/AktivitaetenBereich.tsx` | Deliberate search, visible canonical context, render-time invalidation, adoption callback. |
| `components/trips/AktivitaetKarte.tsx` | Neutral label “Preisangabe”. |
| `components/trips/ActivitiesAuditClient.tsx` | Audit-only trip/unmount/callback seam. Not a product route. |
| `scripts/activities-ui-audit.mjs` | Existing layout/keyboard matrix, zero requests until an explicit search, mounted lifecycle at 390 and 1280. |

Frozen files stay untouched, including TripWorkspace, guest/account shells, search route, schema, factory, and provider proof.

## States

Search phase is `idle`, `loading`, or `fertig`, always bound to an epoch and generation.

- Mount, remount, day change, traveller/currency/date/stage change, and unrelated rerenders stay `idle` and issue no request.
- “Für diesen Tag suchen” / “Erneut suchen” is the only dispatch. A second call while `loading` is rejected synchronously.
- A context change increments the epoch during render and clears the visible response before paint. The in-flight browser read is aborted. Abort is not described as cancelling a server write. A late resolution is applied only when epoch and generation still match, so a test double that ignores `AbortSignal` cannot revive A→B→A or another trip’s identical payload.
- Actionable cards exist only for validated `ok` or `partial`. `empty`, `unavailable`, `timeout`, `error`, `invalid`, and `rate_limited` stay non-actionable.
- Missing stage or destination name has no search action. A missing date is shown as “Datum noch offen” and still uses the existing search input, which already allows a null date.

Visible context is the canonical stage name, day title, day date, `trip.travellers`, and `trip.currency`. No ages are inferred.

## Adoption recovery boundary

Search epoch and generation own only the visible result. The adoption operation is separate: trip, stage, day, and the JSON of the existing pure writer snapshot for that day date. That snapshot rounds a rating to one decimal inside its note and omits the rating and the rating count when the rating is absent. Raw 9.01 and 9.02 with the same count are one operation. A null rating with a different count is one operation. A present rating with a different count changes the stored note and is a different operation. The operation does not include epoch, generation, the client option id, description, coordinates, categories, tags, labels, reasons, or konflikt. A different stored snapshot, or a different trip, stage, or day, is a different operation. This is a local lock, not a new provenance or domain model. The full raw card, including an unrounded rating, still belongs only to the stale-handler check.

The handler still sends only when the complete visible card, including ranking fields, is the current result for the captured epoch and generation. That check is separate from the operation lock.

The callback remains `onUebernehmen(etappe, tag, option): Promise<string | null>`.

- The claim is stored in a ref before the callback runs. The same operation cannot be dispatched twice, including in the same tick.
- The handler sends the captured option only when that exact content is still the visible result for the captured epoch and generation. A reused id with different content does not submit the old option. A stale handler does not send the newer content.
- `finally` closes only that operation. `null` becomes callback-accepted and stays closed for this mount. Any other outcome, including a synchronous throw and an empty string, becomes unconfirmed and stays closed. Another operation is left untouched.
- Refresh, a relevant context change, and a guest-like insertion of the selected activity item do not open a pending, callback-accepted, or unconfirmed operation again, even when the new search returns the same snapshot with different labels, reasons, or konflikt. A new search is not reconciliation of an uncertain write.
- Unconfirmed recovery is the explicit control “Erneut anbieten”. It does not call the writer. It does not open a pending or accepted operation. Search and prop changes do not press it.
- `null` is only the callback’s success report. Copy tells the person to inspect the trip and does not say the write did not happen, did happen, or happened once.
- A notice belongs to its operation. On a visible result it renders only beside that operation’s card, because the card names the activity. It does not become the status of a different card on the same day. While no current response is showing, each retained notice names the captured activity and its time when one was captured, including when a newer adoption is still pending. Those sentences do not appear on another day. Settling the older operation does not unlock or finish the newer one. Leaving the workspace section hides the surface; settling the old work does not move focus into that hidden surface.
- Full unmount drops the in-memory register. This does not cancel an entered writer, does not serialize other tabs, and does not prove the trip row. No readback endpoint is added.

## Active response boundary

A present `message` or `coverageNote` that is not a bounded string makes an `ok` or `partial` response non-actionable. Replacing that field with a default does not keep the options. Absent text may still use the existing neutral default. Non-active statuses keep their minimal contract: invalid text is replaced, options are removed, and the status is not upgraded to success.

## Proof commands

- `node --import tsx --test lib/activities/client-anfrage.test.ts lib/activities/suchlebenszyklus.test.ts`
- `npm run audit:activities`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run check:dead && npm run check:exports && npm run check:deps && npm run check:api-schutz && npm run check:schema-bezug`

Native CI on the final head remains outside this session. No Ready, no merge, no follow-up slice.
