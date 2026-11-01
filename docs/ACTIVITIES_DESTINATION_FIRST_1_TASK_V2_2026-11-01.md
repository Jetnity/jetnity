# Jetnity Activities Destination First 1 — TASK V2

Date: 2026-11-01, Europe/Zurich. Amendment to TASK V1. V1 remains the historical task file and is not rewritten.

## Authority

Owner selection, recorded on PR #1100 in comment 6557071884: show both providers first with their official widgets, and keep the Viator API. Same branch `codex/activities-destination-first-20261101`, same Draft PR #1100, same Cursor session `bc-b961dce1-751e-403e-ade6-52d2c56a648b`.

Comment 6557209826 is the Technical Lead compatibility finding for this same task: the exact official `widget-main.js` applies `vi-wm` only when `event.origin` is the script origin. Inside the required opaque sandbox that origin is `null`, so the wrapper stays `display:none` and the nested frame stays `0px`.

## What this amendment adds

- A canonically confirmed destination opens both official displays: the existing manual GetYourGuide widget and the dynamic Viator widget `P00328015` / `W-a3c98184-2fae-4bf6-919e-1c32bc42d788`.
- The Viator document sends only the public destination name plus the fixed partner, widget reference, `de`, and `CHF`. It does not send trip identifiers, dates, or party details.
- The native activities API stays in the product and still runs when the visitor explicitly searches. Opening Activities does not call it.
- The Viator frame stays an opaque sandbox without `allow-same-origin`. A Jetnity-owned bridge accepts only `vi-wm` from the generated child frame whose address is the expected Viator widget URL, then sets that wrapper’s display and height. It does not navigate the child and it does not treat a loaded script as an offer list.

## What this amendment does not do

No S6 transport or SQL, no new provider key, no native Production activation, no shared CMP edit, no sandbox widening, no fifth live widget render after the four attempts already used.
