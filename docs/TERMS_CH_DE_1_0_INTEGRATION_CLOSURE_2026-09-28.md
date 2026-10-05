# Jetnity – Terms CH-DE 1.0 Integration Closure – 28 September 2026

Status: **MERGED / LIVE / PRODUCTION VERIFIED / #587 CLOSED**

## Integrated runtime

- PR #600 merge: `e1f72431a7097744375875fe29cf8f8136f8d7cf`
- GitHub post-merge CI: `36445805345` — SUCCESS
- Vercel Production: `dpl_5tJ2rR9PYCveg4CwpsNpVGPNVZkY` — READY on exact merge SHA
- Production alias: `jetnity.com`

## Live legal surface

`https://jetnity.com/terms`:
- HTTP 200
- title: `Jetnity Nutzungsbedingungen / AGB`
- Version: `CH-DE 1.0`
- Stand: `28. September 2026`
- Inkrafttreten: `28. September 2026`
- canonical: `https://jetnity.com/terms`
- robots: `noindex, nofollow`

Related Production proof:
- `/register`: HTTP 200; links Terms + Privacy
- `/privacy`: HTTP 200
- `/impressum`: HTTP 200
- Footer: Privacy + Terms + Impressum
- `/robots.txt`: `User-Agent: *\nDisallow: /`

## Boundaries retained

- no Terms-consent persistence was introduced;
- no retroactive acceptance is claimed for existing accounts;
- no public indexing/launch activation;
- no Supabase/Auth/RLS/provider/payment/OAuth mutation;
- no provider-specific or paid-subscription terms were added beyond the approved CH-DE 1.0 document.

Issue #587 is CLOSED / completed.

#585 PrivacyBee Infomaniak wording remains a separate open residual.
#395 KAYAK remains WAITING FOR RESPONSE.
