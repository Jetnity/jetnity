# Jetnity — Manual Mobility Pending Draft Guard 1 — PLAN

Date: 24 October 2026
Status: plan before code
Author: **Jetnity Manual Mobility Pending Draft Guard 1 — Cursor Generation 1**
Issue: #986
Branch: `fix/manual-mobility-pending-draft-guard-1`
PR: #988

## Session and model (before material code)

- Cursor session: `bc-529c718d-03e4-43f9-a8fa-7e555d3f4cbf`
- Session URL: https://cursor.com/agents/bc-529c718d-03e4-43f9-a8fa-7e555d3f4cbf
- Actual model: `grok-4.7-high-fast` (`originalModelName` from this run). Requested Grok 4.7 High Fast. No Auto fallback.
- UI title rename is supported and was applied: **Jetnity Manual Mobility Pending Draft Guard 1 — Cursor Generation 1**.

## Live read

- Operating mode: `NORMAL` (`.jetnity/operating-mode.json`, re-read this session).
- Seed HEAD `bf944b63ed41b73c8c3a78990e663aa8d5d2b112`, merge-base with the dispatch pin `e372f4d830c35a74a235d345c2baaf08ab615e6c`, 1 ahead / 0 behind that pin. TASK V1 stays byte-identical; blob `3e5d971be2234c0bd8adf487bd5ac673021bc07e`.
- #751 precheck [6377421153](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6377421153) and batch ownership [6377454444](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6377454444) assign this lane only.
- Newest #748 comment at this read is `6373407485` (23 October 2026), already inside the precheck's bounded intake. No newer MATERIAL report. #968 stays paused and is not investigated.
- Lane B (`fix/shared-search-keyboard-lifecycle-1`, PR #989) is read-only. No main sync.

## Goal

While `ManuelleVerbindung`'s existing `onAnlegen` promise is pending, every submitted control stays non-editable. Success still applies to captured draft A and still clears only the connection reference and note after success. A returned error string or a rejected promise restores editing, keeps the entered values, and shows failure. The synchronous one-write guard and the per-instance unmount guard stay. Guest/Account props, `vorgabe` prefill, and the payload shape stay contract-identical.

Traveller context is not relevant: this form records a user-entered connection and does not infer citizenship, documents, visas, or route eligibility.

## Implementation

Production write, and only inside exported `ManuelleVerbindung` in `components/trips/MobilitaetBereich.tsx`:

- Set `disabled={laeuft}` on mode, day, origin, destination, both dates, both clocks, connection reference, note, and the existing submit button.
- Set `aria-busy={laeuft}` on that form, the same pending signal already used by `PlanpunktEditor` and the flight/stay editors.
- Leave `schreibt`, `lebendig`, the captured payload, the success copy, and the success reset of `connectionRef` and `note` as they are.
- Do not edit the outer `MobilitaetBereich`, search, booking, tabs, or `MietwagenBereich`. Do not add a shared submission store.

## Proof

New isolated harness under `scripts/manual-mobility-pending-draft-guard-1/`. It bundles and mounts the real `ManuelleVerbindung` with synthetic props, a local disposable HTTP server, and a fresh Playwright context. Unexpected origins are aborted. No public route, account helper, hosted API, or source-string stand-in.

Cases: pending keyboard and pointer attempts, captured payload A, success reset, returned error string, rejected promise, retry, duplicate `requestSubmit` before paint, Enter/click while pending, and late completion after unmount/remount. Viewports 320, 390, and 1280. No new `lib/**/*.test.ts` mirror: the node suite cannot hydrate this component, and a source-text copy would not be behavioral proof.

## Gates and non-scope

On the final head, run the harness plus existing `npm test`, typecheck, lint, setup, operating-mode, API, schema, dead, export, dependency hygiene, and production build. No dependency, workflow, config, timeout, SQL, Auth, RLS, provider, or secret change. No Ready, no merge, no follow-up slice.

## Risks

Disabling controls is a client interaction guard. It does not replace server validation, which this lane does not change. A late keystroke in the same turn as submit is already covered by reading state at submit time plus the existing one-write ref; the disabled state applies on the subsequent render, which is what the pending window exposes.
