# Entry Requirements E5-B1R – Ephemeral Provider Timezone Evidence – Handoff

Stand: 31. August 2026  
Status: **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / KEIN READY / KEIN MERGE / KEIN E5-B2**  
Cursor-Agent: **`Jetnity entry requirements provider timezone evidence 1`**, Generation 1  
Session: `bc-cc301dee-cb64-42b9-a6e9-9968f3db8a09`  
Issue: [#330](https://github.com/Jetnity/jetnity/issues/330)  
Branch: `feat/entry-requirements-ephemeral-timezone-evidence-e5b1r-2026-08-31`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/331

> Ein Git-Commit kann seinen eigenen finalen SHA nicht im Tree tragen. Exact Head + Ahead/Behind stehen live im PR, nicht self-embedded.

## Zuerst lesen

1. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_TASK_2026-08-31.md`
2. `docs/CHATGPT_TECHNICAL_LEAD_E5B1_TRUST_BOUNDARY_BLOCKER_CLOSED_2026-08-31.md`
3. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_STATUS_2026-08-31.md`
4. `docs/ENTRY_REQUIREMENTS_EPHEMERAL_PROVIDER_TIMEZONE_E5B1R_SELF_REVIEW_2026-08-31.md`
5. Issue #330 und Parent #294

`docs/ACTIVE_WORK_STATUS.md` ist Technical-Lead-owned und wurde vom Agenten nicht geändert.

## Was ein neuer Chat wissen muss

E5-B1R aktiviert **keinen** Provider und persistiert **keine** Timezone.

Harte Wahrheiten:

1. `FlugSegment`, `FlugOption`, `BewerteteFlugOption` und der Browser-Contract bleiben timezone-frei.
2. Evidence lebt nur als Companion-Array `airportTimezoneEvidence` am serverseitigen `FlugProviderTreffer`.
3. Identität ist `optionId` = finale normalisierte `option.id`, plus `legIndex`, `segmentIndex`, `endpoint`, exaktes IATA, Provider-Identifier.
4. Duffel mintet nur aus dem strukturierten Airport-Objekt + explizitem `time_zone`. IATA-String = keine Evidence.
5. Invalid/missing timezone verwirft kein sonst gültiges Offer.
6. Kein IATA-/Country-/City-/Name-/Offset-Fallback. `departing_at`/`arriving_at` bleiben lokale Zeichenketten.
7. `fluegeSuchen()` reicht Evidence nicht an Ranking oder `sucheFuerClient()`.
8. Herkunft gilt durch den Codepfad, nicht durch ein Payload-Label `trusted` / `providerProven` / `source`.
9. **Persisted does not mean provider-proven.** Keine Trip-/Route-Metadata, kein Supabase.
10. PR #328 Head `fdf05f26928dfc556cc3b3b954eb3c61981b29c4` ist Review-Evidence only und kein Ancestor dieses Branchs.
11. `requirementsProviderAus()` bleibt `null`.

## Duplicate-/Integration-Entscheidung

| Baustein | Entscheidung |
| --- | --- |
| `lib/flights/provider.ts` | aktive Runtime-Naht; Contract hier erweitert |
| `lib/flights/domain.ts` / `schema.ts` / `client-sicht.ts` | bewusst unverändert (Schema nur Test-Evidence) |
| `lib/flights/zeit.ts` | Ortszeit ohne Zone; nicht als Instant-/Timezone-Parser missbraucht |
| `lib/providers/flights/*` | offline/fixture foundation; keine zweite Runtime-Welt |
| `trip_item_commercial_provenance` | Commercial-Muster, nicht für Timezone missbraucht |
| `lib/readiness/temporal-projection.ts` | E5-A bleibt unverbunden |

## Dateien

Runtime:

- `lib/flights/provider.ts`
- `lib/flights/airport-timezone.ts`
- `lib/flights/duffel/antwort.ts`
- `lib/flights/duffel/mapping.ts`
- `lib/flights/duffel/adapter.ts`
- `lib/flights/suche.ts` (Discard-Kommentar; keine Evidence-Weitergabe)

Tests:

- `lib/flights/airport-timezone.test.ts`
- `lib/flights/duffel/mapping.test.ts`
- `lib/flights/duffel/adapter.test.ts`
- `lib/flights/suche.test.ts`
- `lib/flights/schema.test.ts`

Delivery-Docs:

- dieser Handoff
- Status
- Self-Review

Nicht angefasst: `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `lib/route/*`, `lib/trips/*`, `supabase/*`, `scripts/db/*`, `lib/providers/*`.

Die Diffs von `JETNITY_START_HERE.md` / `docs/ACTIVE_WORK_STATUS.md` gegen `main` stammen aus den TL-Vorbereitungscommits, nicht aus dieser Agenten-Session.

## origin/main vor Handoff

Erneut gelesen: `origin/main` = `7fdd06f983a47afbbb28313479adf4e81fb9a359`.  
Merge-Base identisch. Behind: 0.  
#328-Head ist kein Ancestor (`git merge-base --is-ancestor` = false).

## Residuals

- Evidence wird in diesem Slice nicht weiterverwendet.
- Kein Browser-/Real-Device-Abnahmebeweis, weil keine UI.
- CI/Vercel müssen live am Exact Head geprüft werden.
- Folgeslice nur nach TL-PASS und neuem versionierten Auftrag.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review auf dem **neuen** Head. Nicht Ready. Nicht mergen. Kein E5-B2/Resolver/Persistenz-Start.
