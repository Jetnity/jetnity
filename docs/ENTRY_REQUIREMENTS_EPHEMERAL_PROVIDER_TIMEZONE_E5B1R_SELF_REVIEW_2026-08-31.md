# Entry Requirements E5-B1R – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements provider timezone evidence 1`**, Generation 1  
Session: `bc-cc301dee-cb64-42b9-a6e9-9968f3db8a09`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #330 / E5-B1R ephemeral provider-observed airport timezone evidence auf Draft-PR #331.

Geprüft:

- keine Timezone-Felder in `FlugSegment`, `FlugOption`, `BewerteteFlugOption`, Client-/Browser-Response, Route-Itinerary oder Trip-Metadata
- Evidence nur am serverseitigen `FlugProviderTreffer`
- Bindung an finale normalisierte `option.id` + Leg + Segment + Endpoint + IATA
- Duffel nur strukturiertes Airport-`time_zone`; kein IATA-String; kein Offset-/Ort-Fallback
- invalid/missing timezone verwirft kein sonst gültiges Offer
- `fluegeSuchen()` gibt Evidence nicht an den Browser
- `lib/providers/flights/*` nicht ausgebaut
- kein Cherry-Pick von #328 / `fdf05f26...`
- `docs/ACTIVE_WORK_STATUS.md` nicht editiert
- keine Persistenz / Supabase / RLS / UTC-Resolver / E5-A Auto-Bind / `flugNachweis` / Notifications

Traveller-Context-Intelligence: für diesen Slice **nicht relevant**. Es werden keine Citizenships, Dokumente oder Residence gelesen.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Sitzt Timezone auf `FlugOption` / `FlugSegment`? | Nein. Companion-Array am Provider-Treffer. Shape-Test serialisiert die Option ohne Zone. |
| Kann ein IATA-String Evidence minten? | Nein. `duffelTimeZoneRohAus('ZRH')` ist `undefined`. |
| Wird aus Land/Stadt/Name/Offset geraten? | Nein. Nur explizites strukturiertes `time_zone` + Identifier-Reader. |
| Verwirft ungültige Zone das Offer? | Nein. Offer bleibt; Evidence-Array bleibt leer. |
| Wird Evidence an Array-Index statt Option-ID gebunden? | Nein. `optionId` ist die finale `option.id`. Reihenfolge/Ranking ändert die Zuordnung nicht. |
| Multi-Leg Cross-Talk? | Nein. Getrennte `legIndex` für Hin- und Rückflug. |
| Gleiche IATA an zwei Endpunkten first-match? | Nein. Jeder Endpunkt hat eigenen Evidence-Eintrag. |
| Leak in die Browser-Antwort? | Nein. Serialisierte `FlugSucheAntwort` enthält keine Timezone-/Evidence-Felder, obwohl der Test-Provider Evidence liefert. |
| Wurde `clientEnthaeltGeheimnis` als Architekturgrenze missbraucht? | Nein. Contract selbst koppelt Evidence nicht an die Option. |
| Trusted-Label im Payload? | Nein. Kein `trusted` / `providerProven` / `source`. |
| Shared mutables leeres Evidence-Array? | Nein. `leereFlugAirportTimezoneEvidence()` erzeugt pro Aufruf ein neues Array. |
| Wird Identifier still auf eine IATA-Zone umgeschrieben? | Nein. Gültiger Wert kommt unverändert zurück. |
| `Z` / `+02:00` / Whitespace / `..` / Control? | Abgelehnt. |
| `America/Argentina/Buenos_Aires` durch künstliche Region-City-Regex verworfen? | Nein. Plattform-`Intl` akzeptiert den Namen. |
| Domain/Schema/Client/Route/Trip/Supabase/Providers geändert? | Nein, außer Schema-**Test** für Extra-Field-Strip. |
| #328 cherry-picked? | Nein. Verworfener Head ist kein Ancestor. |
| Persistenz / E5-B2 / Ready / Merge gestartet? | Nein. |

## 3. Bewusste Schwächen, die bleiben

- Evidence hat in E5-B1R keinen Konsumenten. Ohne späteren server-owned Store oder Resolver bleibt sie flüchtig.
- `Intl.DateTimeFormat({ timeZone })` hängt an der Plattform-tzdb. Das ist die Task-erlaubte Prüfung, keine eigene Zone-Datenbank.
- Evidence-Objekte sind mutierbar. Es gibt kein Deep-Freeze; das war nicht verlangt.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 4. Urteil des Autors

Scope-treue Runtime + Regressionen + lokale Gates grün: `npm test` 2965/2965, Typecheck, Lint 0/137, Production-Build, Hygiene. `origin/main` unverändert `7fdd06f9...`, 0 behind.

**Unabhängiger Technical-Lead-Review:** ausstehend auf dem **finalen** Head. PR bleibt Draft. Kein Ready, kein Merge, kein E5-B2.
