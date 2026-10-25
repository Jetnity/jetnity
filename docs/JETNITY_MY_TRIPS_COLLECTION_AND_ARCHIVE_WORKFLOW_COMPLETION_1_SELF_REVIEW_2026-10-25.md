# R107-M self-review — 2026-10-25

Author: **Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1**. This note is not an independent Technical-Lead review and not a PASS.

Reviewed tree for the runtime proof: `d734a39f5f97228f076a8d12e37e02b71257a0ae` at `96715e43f9c979a542a1b7bd5acc2b15ef494c5d`.

## What I checked

- `kanonischeAdresse` and `leerUngueltig` both use `ungueltigeAdresse`. Repeated `q=a&q=b`, `archiv=offen&archiv=archiv`, and `cursor=x&cursor=y` stay invalid and make zero `from('trips')` calls. Their address string is the same on both sides. Present empty `archiv=` and `cursor=` stay `/reisen?archiv=` and `/reisen?cursor=`. They are not `/reisen`. A valid empty `q` still commits as `/reisen`.
- The mounted proof opens those three addresses, plus `archiv=` and `cursor=`, as a first paint and as an in-place snapshot. The invalid heading replaces Alpha only after the matching envelope. A later `/reisen` object does not bring Alpha back and does not remove the heading. The deep-link location search stays `?archiv=` or `?cursor=`.
- `beobachtungAnwenden` with `nicht-gelesen` or a problem leaves `observation` and `write` unchanged. A successful empty read still sets `row-absent`. An acknowledgement after the unread envelope stays `unread`. The mounted copy says “keine Liste gelesen” and does not say “nicht sichtbar”. Late `{ ok: true, wert: null }` and late `{ ok: true }` both keep that distinction. `setzeAdresse` during the pending write does not increase the action count.
- The fail-closed sentence stays when the same id is archived and `archivePreviousStatus` is null. Pending, unknown, and acknowledged feedback stay visible beside it. Wiederherstellen is absent until a later snapshot supplies a previous status. That later snapshot does not drop the acknowledgement.
- The displayed rows remain the last adopted envelope whose address equals the live URL. The visible line names that search and archive selection. While a different address is pending, the retained line stays and the pending search and selection are named. A continuation says `weitere Seite` and the cursor token is not in the visible text. Typing in the field still shows `Der Entwurf ist noch nicht die Suche.` and does not change the owner line. The earlier A → B → A, lease, and stable-envelope cases still pass.
- `KontoReisenGruppen.tsx`, `archiv-aktionen.ts`, `suchfilter.ts`, `liste-grenze.ts`, and the TASK file are unchanged.

## What I will not claim

I did not run hosted SQL, RLS, a signed-in browser session, Production, or a physical device. The mounted page is esbuild plus the project CSS, not the Next router. `npm test` and full `eslint .` were last run on `7c997103` and were not repeated after the owner line or this empty-address fix. `npm test` is not green in this VM. I did not mark Ready and I did not merge.

## Residual risk

The visible navigation intent is state so render does not read a ref. A history `url` intent is opened in an effect on the next paint. The mounted proof waits two animation frames and sees it.

`router.refresh()` follows the live URL. The UI disables that control while the adopted result is a different address. A forced click returns before `refresh`. That is a client guard, not a server lock.

`listenlieferung` is client provenance for the adopted props object. It is not a server receipt and it does not prove that a database read happened beyond the envelope's `ungueltig` and `problem` fields.

## Main-sync1

This self-review stays bound to `96715e43` / `d734a39f`. The later history-preserving merge with main `70b878a8fbe23f0dd455175a53de74175b2b976d` does not replace it and does not create a new mounted run. Collection sources in that merge match `444a8c25`. Tracking remains open pending root post-merge acceptance.
