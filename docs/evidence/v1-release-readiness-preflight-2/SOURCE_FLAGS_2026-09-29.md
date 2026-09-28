# Source flags read on this branch

Read against `audit/v1-release-readiness-preflight-2`, which at this note contained `main@e213fa3a4cf08ee3364c4a8d3dc11bafb9373772` plus the preflight task commit. These are repository facts. They are not a Production environment read.

| Fact | Where | What it says |
| --- | --- | --- |
| Flight search hard-off in Production | `lib/flights/zustand.ts` | `providerOpsIstProduction` returns `{ aktiv: false, grund: 'production' }` even if a credential exists |
| Hotel search hard-off in Production | `lib/hotels/zustand.ts` via `lib/provider-ops/zustand.ts` | same Production kill switch |
| Activity search hard-off in Production | `lib/activities/zustand.ts` via `lib/provider-ops/zustand.ts` | same Production kill switch |
| Consent not persisted | `lib/legal/ap6a-gate0-vertrag.ts` | `keineConsentPersistenz: true` |
| Indexing fail-closed | `lib/seo/oeffentlicher-origin.ts` | `darfIndexieren` requires production, explicit `NEXT_PUBLIC_ALLOW_INDEXING`, and the canonical public origin |
| Robots deny-all when indexing is off | `lib/seo/robots-regeln.ts` | disallow `/` and no sitemap |
| Assistant/model calls default off | `lib/modell/konfiguration.ts` | `JETNITY_MODELL_AKTIV` must be exactly `true` or `1`, and a key must be present |
| No application security-event insert | `app/api/admin/security/*/route.ts` read `security_events`; `supabase/functions/account-delete-v1/index.ts` deletes by `user_id` | no product INSERT was found. Disposable proof SQL in `scripts/account/kontoloeschung-nachweis.ts` is not a persistent ingestion pipeline |
| Operating mode | `.jetnity/operating-mode.json` | `mode` is `NORMAL` |

No Production Supabase query was run for this note.
