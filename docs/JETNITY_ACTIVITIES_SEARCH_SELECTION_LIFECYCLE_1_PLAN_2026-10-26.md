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

The callback remains `onUebernehmen(etappe, tag, option): Promise<string | null>`.

- The claim is stored in a ref before the callback runs. The same captured trip/stage/day/epoch/generation/option-content key cannot be dispatched twice, including in the same tick.
- The handler sends the captured option only when that exact content is still the visible result. A reused id with different content does not submit the old option.
- `finally` removes only that claim from the in-flight set and records it as settled. Another claim is left untouched. Context changes, new searches, and unrelated props do not delete settled claims and do not replay them.
- `null` is only the callback’s success report. A string, throw, rejection, or any other value is unconfirmed. Copy tells the person to inspect the trip and does not say the write did not happen, did happen, or happened once.
- A newer explicit search on the same day hides the older notice. A notice never renders on a different day. Returning to the same day can show it again, without restoring cards and without calling the callback.
- Another attempt is a new explicit search plus a new click. That is a new claim, not a replay.
- Full unmount drops the in-memory register. This does not cancel an entered writer, does not serialize other tabs, and does not prove the trip row. No readback endpoint is added.

## Proof commands

- `node --import tsx --test lib/activities/client-anfrage.test.ts lib/activities/suchlebenszyklus.test.ts`
- `npm run audit:activities`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run check:dead && npm run check:exports && npm run check:deps && npm run check:api-schutz && npm run check:schema-bezug`

Native CI on the final head remains outside this session. No Ready, no merge, no follow-up slice.
