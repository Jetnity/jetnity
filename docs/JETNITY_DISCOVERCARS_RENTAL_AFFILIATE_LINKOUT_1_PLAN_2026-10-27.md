# DiscoverCars rental affiliate linkout 1 — PLAN

**27 October 2026.** Draft PR [#1059](https://github.com/Jetnity/jetnity/pull/1059). Tracking [#1058](https://github.com/Jetnity/jetnity/issues/1058). Immutable task: `docs/JETNITY_DISCOVERCARS_RENTAL_AFFILIATE_LINKOUT_1_TASK_V1_2026-10-27.md`. This plan was posted on the PR before source changes. It is not a Technical Lead PASS.

## Session

Cursor-Agent: `Jetnity DiscoverCars Rental Affiliate Linkout 1 — Cursor Generation 1`

- Session: `bc-658ab635-d1c2-4113-9eeb-aaa9eadcbd55`
- URL: https://cursor.com/agents/bc-658ab635-d1c2-4113-9eeb-aaa9eadcbd55
- `originalModelName`: `grok-4.7-high-fast`
- Display name after `rename-chat` matches the logical name above. The name before rename was `DiscoverCars rental affiliate linkout`.

## Preflight before code

Fetched `origin/main` and this branch.

- `origin/main`: `0cb3e372188553b0e374199a5dd779cc79426981`
- Seed HEAD: `bb1b6ecf2b22287e657e19267bbd303a866a5526`
- Merge-base with main: `0cb3e372188553b0e374199a5dd779cc79426981`
- Ahead 1 / behind 0. Diff was only the immutable task.
- `.jetnity/operating-mode.json`: `NORMAL`
- Main CI [40570228891](https://github.com/Jetnity/jetnity/actions/runs/40570228891): `success`, head SHA equals that main.
- Issue #751 still named an older main. Live `origin/main` was used. #751 and `docs/ACTIVE_WORK_STATUS.md` were not edited.
- Parallel drafts #1052, #1053, #1054 and #1057 were left untouched. `components/trips/MobilitaetBereich.tsx` was not edited.

## Shape

1. `lib/providers/discovercars/affiliate/ziel.ts` returns only two reviewed https constants on `www.discovercars.com`. The generic URL is `https://www.discovercars.com/?a_aid=jetnity`. The BKK URL is the audited generator example, including `currency=chf`. BKK is returned only when the caller sets explicit intent and passes the closed station identity IATA `BKK`, ICAO `VTBS`, name `Suvarnabhumi Airport`, type `large_airport`. City Bangkok, partial IATA, stages, coordinates and any extra field fall back to the generic URL and are not copied into it.
2. `components/trips/DiscoverCarsAffiliateLinks.tsx` is inserted in `components/trips/MietwagenBereich.tsx` between the unavailable search and the manual form. The parent passes only `reise.id` (to clear the choice) and `reise.stages.length` (for the multi-stop sentence). The link is `target="_blank"` and `rel="noopener noreferrer sponsored"`.
3. Tests cover hostile URLs, identity, guest/account sameness, markup, and the preserved rental sections. `scripts/discovercars-affiliate-linkout-1/browser.ts` checks the real Mietwagen tab on the local UI-audit route.

## Continuation — 28 October 2026

The pre-code plan for amendment 1 was posted before this merge. Live main was `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc`, mode NORMAL, same session and model. The merge did not require a product fix. Privacy protection on the link stays. Hosted QA and commission stay open.

## Still closed

Direct-link account and click evidence is recorded by Work and is no longer a blanket provider block. Commission, separate document confirmation and hosted Jetnity rental QA are still open. No widget, API, provider contact, paid traffic or Production activation. Cursor does not mark Ready and does not merge.
