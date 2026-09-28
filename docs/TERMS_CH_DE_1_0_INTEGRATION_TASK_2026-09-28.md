# Jetnity – Terms CH-DE 1.0 Integration – Task

Stand: 28. September 2026  
Issue: #587  
Branch: `feat/terms-ch-de-1-0-2026-09-28`

## Product-Owner authority

The Product Owner superseded the prior #587 HOLD and approved the final public CH-DE 1.0 Nutzungsbedingungen / AGB for integration.

Approved public identity:
- title: Jetnity Nutzungsbedingungen / AGB
- version: CH-DE 1.0
- stand: 28. September 2026
- effective date: 28. September 2026
- operator: Feirov Global Trading, Einzelunternehmen
- address: Meilipromenade 14, 6032 Emmen, Schweiz
- UID: CHE-432.441.385
- email: info@jetnity.ch
- website: https://jetnity.com

## Scope

1. Add `/terms` in the existing public Jetnity layout.
2. Preserve the approved wording and section structure.
3. Add the Terms link to the public footer.
4. Keep the existing Register link.
5. Update AP-6a inventory tests from the historical 404 truth to the approved live-route truth.
6. Keep `/terms` out of the sitemap and explicitly `noindex, nofollow`.

## Hard boundaries

- no persistent Terms-consent storage;
- no registration-flow semantic change;
- no public indexing/launch activation;
- no provider/payment/subscription/OAuth changes;
- no Supabase Production/Auth/RLS/migration changes;
- no new legal clauses beyond the approved CH-DE 1.0 document;
- no claim that existing accounts retroactively accepted this version.

## Acceptance

- `/terms` builds and serves successfully;
- visible title/version/stand/effective date are correct;
- Register + Footer point to `/terms`;
- `/privacy` and `/impressum` remain untouched;
- Legal inventory tests reflect the new truth;
- sitemap/indexing boundary remains unchanged;
- full CI and Vercel Preview PASS before integration;
- post-merge Production readback verifies `/terms` plus the existing legal routes.
