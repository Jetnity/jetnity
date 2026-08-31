# Entry Requirements E5-B2A – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements airport event instant 1`**, Generation 1  
Session: `bc-2f16caec-271e-4911-ac36-5abc36ab0806`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

## 1. Auftrag gegen Diff

Auftrag: Issue #334 / E5-B2A ephemeral airport event instant resolution auf Draft-PR #335.

Geprüft:

- keine Timezone-/Instant-Felder in `FlugSegment`, `FlugOption`, `BewerteteFlugOption`, Client-/Browser-Response, Route-Itinerary oder Trip-Metadata
- Instant-Evidence nur am serverseitigen `FlugProviderTreffer`
- Zone ausschließlich aus bestehender E5-B1R-`FlugAirportTimezoneEvidence`
- Revalidierung gegen Option + Leg + Segment + Endpoint + IATA
- Departure/Arrival lesen getrennte lokale Felder und Endpunkte
- DST-Lücke und DST-Overlap fail-closed, inkl. 30-Minuten-DST auf Lord Howe
- keine IATA-/Country-/City-/Name-/Server-/Browser-Inferenz
- kein `Z` an lokale Strings, kein `Date.parse`
- `fluegeSuchen()` gibt Timezone- und Instant-Evidence nicht an den Browser
- Offer-Cap entfernt Evidence verworfener Optionen
- unauflösbare Evidence verwirft kein sonst gültiges Offer
- keine neue Dependency
- `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` nicht editiert
- keine Persistenz / Supabase / RLS / E5-A Auto-Bind / `flugNachweis` / Notifications

Traveller-Context-Intelligence: für diesen Slice **nicht relevant**. Es werden keine Citizenships, Dokumente oder Residence gelesen.

## 2. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Sitzt Instant oder Timezone auf `FlugOption` / `FlugSegment`? | Nein. Companion-Arrays am Provider-Treffer. Mapping-Shape-Test serialisiert die Option ohne Zone/Instant. |
| Kann ein Browser-/Client-Feld `trusted`/`providerProven` vortäuschen? | Nein. Es gibt kein solches Label. Herkunft gilt nur durch den Server-Pfad. |
| Kann Evidence nur über passendes IATA auf ein falsches Segment rutschen? | Nein. `optionId` + `legIndex` + `segmentIndex` + Endpoint + IATA müssen alle passen. Reiner IATA-Match reicht nicht. |
| Kann Option-Reordering Evidence vertauschen? | Nein. Lookup läuft über `optionId`, nicht über Array-Index. Ranking-Test bestätigt die Bindung. |
| Wählt DST-Overlap still earlier/later/compatible? | Nein. Zwei beobachtete Instants → `ambiguous_local_time`, leeres Evidence-Array. Explizit gegen `00:30Z` und `01:30Z` geprüft. |
| Wird DST-Lücke auf den nächsten gültigen Zeitpunkt normalisiert? | Nein. 0 Instants → `nonexistent_local_time`. 02:30 am Zurich-Spring-Forward bleibt ohne Instant. |
| Beeinflusst Server-TZ das Ergebnis? | Nein. Nur `Date.UTC` / `getUTC*` / `Intl` mit expliziter Zone. Regression mit `TZ=UTC`, `Pacific/Auckland`, `America/New_York`. |
| Verwirft ungültige Timezone oder unauflösbarer Instant die Flight Option? | Nein. Adapter-Test: Offer bleibt, Departure-Gap wird Issue, Arrival kann trotzdem resolven. |
| Bleibt Browser-JSON evidence-frei? | Ja. Serialisierte `FlugSucheAntwort` enthält weder Timezone- noch Instant-Felder, obwohl der Test-Provider beides liefert. |
| Wurde Route/Trip/Persistenz/`temporal-projection.ts` berührt? | Nein. |
| Wurde eine neue Dependency hinzugefügt? | Nein. `package.json` Diff gegen `origin/main` ist leer. `check:deps` grün. |
| Sind neue Exporte integriert? | Ja. `airportEventInstantsAufloesen` wird vom Duffel-Adapter aufgerufen. Leere Helper und Issue-Konstante werden in Tests/Contract benutzt. `check:exports` = 0 verwaiste Exporte. |
| Wird lokale Zeit durch `+'Z'` oder `Date.parse` zu UTC? | Nein. Kandidaten entstehen aus beobachtetem Offset `localAsUtc - utcMs`. Ausgabe formatiert nur bereits gewonnene UTC-Millisekunden. |
| First-match bei gleicher IATA auf zwei Endpunkten? | Nein. Jeder Evidence-Eintrag trägt eigenen Endpoint/Index. Multi-Segment-Test unterscheidet ZRH/LHR/BKK. |
| Bleiben verworfene Cap-Optionen in der Instant-Evidence? | Nein. 21 Angebote → 20 behalten; beide Evidence-Arten nur für behaltene `optionId`s. |
| Shared mutables leeres Array? | Nein. Helper erzeugen pro Aufruf ein neues Array. |

## 3. Bewusste Schwächen, die bleiben

- Instant-Evidence hat in E5-B2A keinen E5-A-Konsumenten. Ohne späteren server-owned Store oder explizite Bindung bleibt sie flüchtig.
- Eine Wanduhr in einer echten DST-Overlap-Stunde bleibt ohne Instant. Das ist die bindende Semantik, nicht ein stiller Fallback.
- Duffel-Rohstrings dürfen einen numerischen Offset tragen; `ortszeitAus()` behält nur die lokale Uhr. Diesen Offset als zweite Truth zu lesen wäre ein neuer Slice und würde E5-B1R nicht ersetzen.
- `Intl.DateTimeFormat({ timeZone })` hängt an der Plattform-tzdb. Das ist die Task-erlaubte Runtime, keine eigene Zone-Datenbank.
- Evidence-Objekte sind mutierbar. Es gibt kein Deep-Freeze; das war nicht verlangt.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 4. Proaktive Residual-Empfehlung (nicht ausgeführt)

**Beobachtung:** Sobald E5-A später an Flughafen-Ereignisse gebunden werden soll, bleiben Overlap-Stunden ohne Instant. Ein späterer Slice könnte prüfen, ob der aktive Provider zusätzlich zum IANA-Namen einen beobachteten Offset oder bereits einen Instant liefert.

**Empfehlung:** Nicht in E5-B2A nachrüsten. Zuerst unabhängigen TL-PASS dieses fail-closed Cores, dann eigenen versionierten Slice. Keine Library, keine Persistenz, keine E5-A-Autobindung ohne neuen Auftrag.

**Priorität:** später / nach TL-PASS. Kein Product-Owner-Gate jetzt.

## 5. Urteil des Autors

Scope-treue Runtime + komplette Mandatory Regression Matrix + lokale Gates grün: `npm test` 2989/2989, Typecheck, Lint 0/137, Production-Build, Hygiene. `origin/main` unverändert `f7ccdc5b...`, 0 behind.

**Unabhängiger Technical-Lead-Review:** ausstehend auf dem **finalen** Head. PR bleibt Draft. Kein Ready, kein Merge, kein E5-B2B.
