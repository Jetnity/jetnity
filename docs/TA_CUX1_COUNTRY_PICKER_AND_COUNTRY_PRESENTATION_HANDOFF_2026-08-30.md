# TA-CUX1 – Country Picker Handoff

Stand: 30. August 2026  
Status: **IMPLEMENTATION COMPLETE / STOP FOR INDEPENDENT TL REVIEW**  
Cursor-Agent: `Account plattform audit vorbereitung 21`

## Transport

| Fakt | Wert |
| --- | --- |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/234 |
| Issue | #233 |
| Branch | `feat/ta-cux1-country-picker-2026-08-30` |
| Baseline | `main @ 7b85e683f39cf42762cac5b6aa7a8eb45b2728db` |
| Implementation Head | `aafc1464c0c09f5e61a1249db8edcc5fa114fec9` |
| Overflow-Fix Head | `7d802c72686ecf223cda9b810d9f6e658ce23e95` |
| Evidence Head | `7f31ac107b2184556a2519fe836fd45126a4ffc2` |
| Exact Head | der Docs-Commit dieses Stamps; live am PR prüfen. Kein weiterer Stamp. |

## Wahrheit

Persistenz bleibt Country-Code. Die UI der beiden Traveller-Flächen zeigt Flagge + lokalisierten vollständigen Namen. Neue Auswahl nur aus dem offiziellen ISO-3166-1-alpha-2-Katalog. Legacy-Codes bleiben ehrlich sichtbar. Issuer ≠ Citizenship. Kein Defaultland.

Das Control ist bewusst ein natives Select plus Filter, nicht eine Custom-Combobox.

## Dateien dieses Agenten (gegen Task-Commit `c2b38596`)

- `lib/country/katalog.ts`
- `lib/country/copy.ts`
- `lib/country/darstellung.ts`
- `lib/country/darstellung.test.ts`
- `lib/country/land-feld.ts`
- `lib/country/land-feld.test.ts`
- `lib/country/ui.test.ts`
- `lib/country/scope.test.ts`
- `components/country/LandFeld.tsx`
- `components/account/AccountReisende.tsx`
- `components/account/AccountReisendeKarte.tsx`
- `components/trips/Reisevorbereitung.tsx`
- `lib/traveller/account-registry-copy.ts`
- `lib/traveller/account-registry-eingabe.ts`
- `lib/traveller/account-registry-ui.test.ts`
- `docs/ADR_0203_TA_CUX1_SHARED_COUNTRY_PRESENTATION.md`
- dieser Handoff / Status / Self-Review

## Lokale Evidence

- Tests: 2759/2759
- Typecheck, Lint 0 errors, Hygiene, Production-Build: pass
- Account-UI-Audit: 48/48
- Fokussierte Reisevorbereitungs-Verifikation: Schweiz/Serbien, keine ISO-2-Labels
- 280px-Recheck nach Overflow-Fix: kein Overflow
- Trip-Workspace-UI-Audit: 1017/1018; Restfehler WebKit-Tabwechsel/sticky header, nicht Country-Felder
- CI #1323 / Run `33285896324` SUCCESS auf exact `7f31ac10`
- Vercel Preview SUCCESS, Deployment `B5DnsqWF5vVUdYZL2LrbSjg63cfJ`

## Review protocol

1. Global Continuity darf in diesem Agent-Diff nicht stehen.
2. Keine Migration/RLS/Auth/Supabase-Mutation.
3. Keine neue npm-Abhängigkeit.
4. UI sendet Codes, keine Ländernamen.
5. GitHub Actions + Vercel Preview auf dem live exact Head prüfen.
6. PASS nur durch unabhängigen Technical Lead. Cursor markiert nicht Ready und merged nicht.

## Nächster Schritt

Unabhängiger Technical-Lead-Review. Kein Folgeslice.
