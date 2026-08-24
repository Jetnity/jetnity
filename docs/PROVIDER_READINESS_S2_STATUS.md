# Jetnity – Provider Readiness S2 Status

Stand: 24. August 2026  
Status: **Runtime implementiert / Gates und Technical-Lead-Review ausstehend**  
Branch: `feat/provider-flight-evidence-s2`  
Draft-PR: `#51`  
Auftrag: `docs/PROVIDER_READINESS_S2_FLUGNACHWEIS_TASK.md`

## 1. Was S2 ist

S2 hebt die Flug-Kontoübernahme und jede kommerzielle Flug-Persistenz auf dieselbe Trust-Grenze wie Hotels: **Browserdaten dürfen keine kommerzielle Flugwahrheit persistieren.**

Kein Mark Ready. Kein Merge. Kein Live-Duffel. Keine Provideraktivierung. Keine Secrets. Keine kostenpflichtigen Calls. Keine DB-/Production-Migration. Kein Start von S3.

## 2. Runtime-Head

Noch nicht gegatet. Der Exact Head wird nach den Pflichtgates in diesem Dokument nachgetragen.

## 3. Umgesetzt

- `FlugNachweis` analog `HotelNachweis`: optionId plus Legs, Passagiere, Kabine, Währung, Gültigkeit
- Konto-Schema nur `tripId`, `dayId`, `optionId`
- `flugNachweisAusUmgebung()` = `null`; Server Action übergibt keinen Client-Suchkontext
- Guest-Übernahme fail-closed
- Guest → Account streicht unbewiesene Flug-Handelsfelder
- `booking_url` bleibt `null`
- Route Truth bleibt Foundation D

## 4. Bewusst nicht geändert

- kein Live-Duffel / kein echter Adapter
- kein persistenter Suchkontext-Speicher (S5)
- kein Mobility-/Rental-Nachweis (S3)
- kein persistenter Cost Guard (S6)
- keine Homepage-/Account-/Admin-Featurearbeit
- keine DB-/RLS-/Auth-Änderung

## 5. Gates

Ausstehend. Nach Exact-Head-Lauf werden die Ergebnisse hier eingetragen.

## 6. Empfehlung

Nach grünen Exact-Head-Gates: STOPP für unabhängigen Technical-Lead-Review. Nicht Mark Ready, nicht mergen, nicht S3 starten.
