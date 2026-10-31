# DiscoverCars rental affiliate linkout 1 — HANDOFF

## Continuation — 28 October 2026

Same session `bc-658ab635-d1c2-4113-9eeb-aaa9eadcbd55`. Amendment 1 is in the branch and was not rewritten. Current main `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc` was merged without force or rebase.

No product defect showed up in the rental entry. `MobilitaetBereich` still renders `MietwagenBereich` on the Mietwagen tab, including manual create. The affiliate call is still only `reiseId` and `stationen`. `rentalCarProviderAus()` still returns null. Main’s TripWorkspace and 12Go changes were kept as merged, not edited.

The only new writer change after the merge is the local browser script: it now checks the visible manual form, the honest unavailable-search sentence, and that no DiscoverCars iframe, script, image or link resource is present. Root font 32px is the repository’s declared text enlargement, not a desktop browser zoom.

Hosted `/planen` QA is still blocked by the known missing public Supabase configuration on the old Preview. This session did not change env or Preview protection. Commission is still unproven.

Next action: independent Technical Lead review of the pushed exact head. Cursor does not mark Ready and does not merge.

**27 October 2026.** For the next reader of Draft PR #1059. This handoff is not a PASS.

## Who

`Jetnity DiscoverCars Rental Affiliate Linkout 1 — Cursor Generation 1`

Session `bc-658ab635-d1c2-4113-9eeb-aaa9eadcbd55`  
https://cursor.com/agents/bc-658ab635-d1c2-4113-9eeb-aaa9eadcbd55  
`originalModelName=grok-4.7-high-fast`

Same session fixes a later CHANGES REQUIRED on this PR. A new head resets CI, Preview and review.

## What the code does

Inside Reise → Organisieren → Mobilität → Mietwagen, under the honest unavailable search and above the manual form, one external DiscoverCars affiliate link.

- Default: `https://www.discovercars.com/?a_aid=jetnity`
- Only after the visitor chooses “Flughafen Suvarnabhumi (BKK)”: the audited URL with `a_aid=jetnity` and `currency=chf`
- A different trip id clears that choice
- Several stages produce a sentence that pickup, dropoff and one-way are not inferred. They do not change the URL
- Bangkok as a stage name does not select BKK

`lib/rental-cars/factory.ts` still returns `null`. No rental search was added. `components/trips/MobilitaetBereich.tsx` was not edited.

## Files

- `lib/providers/discovercars/affiliate/ziel.ts`
- `lib/providers/discovercars/affiliate/ziel.test.ts`
- `lib/providers/discovercars/affiliate/links.test.ts`
- `components/trips/DiscoverCarsAffiliateLinks.tsx`
- `components/trips/MietwagenBereich.tsx` (one import and one element)
- `scripts/discovercars-affiliate-linkout-1/browser.ts`
- this docs set: PLAN, STATUS, HANDOFF, SELF_REVIEW, REPORT

TASK V1 was not edited. `docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md` and `DECISIONS.md` were not edited because the task keeps those shared files read-only. The Technical Lead can record the slice there after review if wanted.

## Gates that remain

Attribution and commission: unknown. Approved account and links: unverified. No paid traffic. No widget. No API key. No Production. #917 hosted readback STOP, #985/#982 HOLD, #748 CUA suspended, prelaunch/noindex and the USD 100/month cap stay.

## First action for review

Read the diff against `origin/main`. Confirm the two URLs are constants. Confirm Mietwagen passes only trip id and stage count. Re-run exact-head CI and Preview. Do not treat this writer's browser note as the independent Work landing check. The affiliate link was not opened.
