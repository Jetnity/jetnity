# Jetnity Final Homepage Product 1 — SELF-REVIEW

Stand: 30. September 2026  
Status: **AUTHOR SELF-REVIEW / NOT A TECHNICAL-LEAD PASS**

Session: https://cursor.com/agents/bc-051f68b2-ac7c-4bbc-9055-e63466e955a2  
`originalModelName=grok-4.7-high-fast`

## What I checked

- The H1 and the required section headlines are the spec strings.
- The visible definition and the JSON-LD descriptions are the same string.
- Planned capabilities use `In Vorbereitung`, `Kommt später` or `Produktvorschau`.
- The product window has no price, availability, official result or booking confirmation.
- Inspiration links still use `zielHref` and the four confirmed place IDs in the same order.
- `GastCreateLink` and `#entdecken` / `#pro` remain, so navbar and create-entry tests still match `app/(public)/page.tsx`.
- Homepage source does not set `index: true`. The production build emits `noindex, nofollow` and `robots.txt` `Disallow: /`.
- JSON-LD has no `sameAs`, rating, review, offer or award.
- 360 and 390 first screens show the real form. Controls in that screen are at least 44px. The place input is 16px.
- 200% text on 360×800 does not overflow horizontally after `break-words`.
- Owned files stay inside the task allowlist plus `docs/ACTIVE_WORK_STATUS.md`, which the persistence rule requires and which is not a runtime path.
- `StartzielForm` was not edited.

## What I did not prove

- Physical device, VoiceOver/TalkBack, or a signed-in account with an active guest draft.
- That every workspace area behind the homepage copy behaves as the inventory says, beyond reading the current main surfaces and not touching PR #642.
- Exact-head GitHub CI, Auth and Vercel Preview. Those start after the tip is pushed.

## Judgement

I would not merge this on the author's review. The page matches the approved story and the local gates I ran passed. The next decision belongs to an independent Technical-Lead review of the exact head.
