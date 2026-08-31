# Entry Requirements E5-B3C – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements flight event persistence mint 1`**, Generation 1  
Session: `bc-8579f2af-62df-45f3-b15b-d9a1d2d4c180`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

Runtime-Head dieser Review-Runde: `f2499d9a`  
Pre-agent Head: `0175d1564527f66868a84c86b8ea2ebc017efcde`  
Baseline / `origin/main`: `8868f91319f2747ca6f3dc8cb46ab0a40cba417b`

## 1. Auftrag gegen Diff

Auftrag: Issue #347 / E5-B3C server-only Flight Event persistence payload mint auf Draft-PR #348.

Geprüft:

- server-only / DB-freier TypeScript-Mint im bestehenden Domainordner `lib/flight-event-provenance/`
- Eingabe nur `tripItemId` + selected `optionId` + vollständiger `FlugProviderTreffer`
- selected Option wird in `treffer.options` gesucht; Duplikate fail-closed, kein first-match
- Occurrence-Rebinding über `optionId + leg + segment + endpoint + IATA`
- `local_date` / `local_time` nur vom selected Segment-Endpunkt
- `time_zone` nur aus exakter B1R-Evidence, `event_instant` nur aus exakter B2A-Evidence
- B1R/B2A-Zonen müssen exakt übereinstimmen
- `retrieved_at === observed_at === treffer.retrievedAt`; kein `Date.now()`
- `fresh_until = null`
- keine TypeScript-`occurrence_event_ref`
- kein Client-/Browser-Provenance-Trust
- typed fail-closed Result
- SQL Deny-/Allow-List für Rohclient-Reject
- `FlugOption` / `FlugSegment` / Browser / Route / Trip unverändert
- `flugNachweisAusUmgebung()` bleibt `null`
- kein Supabase/API/private-writer invocation
- E5-B1R/B2A/B3B- und E5-B3A-SQL-Tests bleiben grün
- `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` nicht editiert

Traveller-Context-Intelligence: für diesen Slice **nicht relevant**. Es werden keine Citizenships, Dokumente oder Residence gelesen.

## 2. Exact changed files

Agent-Diff gegen Pre-agent-Head `0175d156...`:

| Datei | Art |
| --- | --- |
| `lib/flight-event-provenance/persistenz.ts` | Runtime-Mint + Rohclient-Grenze |
| `lib/flight-event-provenance/persistenz.test.ts` | Pflichtregressionen |

Nach diesem Review kommen die drei Delivery-Docs hinzu. Der finale Head steht live im PR.

Proof `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` gegen Pre-agent-Head: leer.

## 3. Observation- / Evidence-Provenance

| Frage | Beweis |
| --- | --- |
| Woher kommt `retrieved_at`? | Nur `treffer.retrievedAt` nach Muster `YYYY-MM-DDTHH:mm:ss.sssZ` und `toISOString()`-Kanon. |
| Wird ein zweiter Zeitpunkt gemintet? | Nein. `observed_at` ist derselbe String. `fresh_until` ist `null`. |
| `Date.now()` / `new Date()`? | Source-Scan ohne Kommentar-Treffer plus Runtime-Mock: 0 Calls; identische Eingabe = identische Nutzlast. |
| Können Payload-Felder die Observation ersetzen? | Nein. Extra `retrieved_at` / `observedAt` / `freshUntil` auf Treffer oder Option bleiben wirkungslos. |
| Wird Zone oder Instant neu gerechnet? | Nein. Kein Import von `airportEventInstantsAufloesen`, kein `Intl.DateTimeFormat`, kein `Z` an lokale Strings. |
| Bindet falsche Identität? | Nein. Falsches Leg/Segment/Endpoint/IATA oder fremde Option erzeugt keine Occurrence. |
| First-match bei Duplikaten? | Nein. Doppelte Option-Id, doppelte B1R- oder B2A-Zeilen → `ok: false`. Auch identische Duplikate. |
| Konflikt vs. Fehlen? | Konflikt/Mismatch/invalid wall clock → keine Nutzlast. Nur fehlende Evidence → `ok: true` + `unresolved`. |

## 4. Client- / Writer-Grenze

| Beweis | Ergebnis |
| --- | --- |
| Rohclient ohne `vertrag`/`mint` | `flightEventPersistenzNutzlastIstRohclient` = true |
| CamelCase `retrievedAt` / `eventRef` / `occurrence_event_ref` | reject, analog SQL |
| Validierte Mint-Nutzlast | reject = false |
| `occurrence_event_ref` in der TS-Nutzlast | nicht vorhanden, weder top-level noch je Occurrence |
| Writer-Aufruf | Source enthält keinen `trip_item_flight_event_provenance_schreiben`-Call |
| Supabase / fetch / Next / Duffel-SDK | nicht importiert |
| Commercial-Provenance | nicht importiert |

## 5. Proof unveränderter Verträge

`git diff origin/main...HEAD` für die folgenden Pfade ist leer:

- `lib/flights/domain.ts`
- `lib/flights/provider.ts`
- `lib/flights/schema.ts`
- `lib/flights/client-sicht.ts`
- `lib/flights/airport-timezone.ts`
- `lib/flights/airport-event-instant.ts`
- `lib/flights/duffel/*`
- `lib/flights/suche.ts`
- `lib/flights/nachweis.ts`
- `lib/route/*`
- `lib/trips/*`
- `lib/readiness/*`
- `app/api/*`
- `supabase/*`
- `scripts/db/*`
- `types/supabase.ts`
- `lib/providers/*`
- `lib/commercial-provenance/*`
- `package.json`
- `ARCHITECTURE.md`
- `DECISIONS.md`

Zusätzlich:

- `flugNachweisAusUmgebung()` bleibt `return null`
- `requirementsProviderAus()` bleibt `return null`
- E5-B3A SQL-Vertragstests 16/16 grün
- E5-B1R/B2A/B3B-Fokus 42/42 grün (Timezone 4 + Instant 22 + Adapter 16)

## 6. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Kann eine Browser-`FlugOption` allein Provenance begründen? | Nein. Ohne `treffer.retrievedAt` und Evidence-Arrays kein gültiger Mint. |
| Kann Option B die Evidence von Option A erben? | Nein. Pflichttest 3: 0 Occurrences, 4 unresolved auf B. |
| First-row-wins bei doppelter Option-Id? | Nein. `selected_option_ambiguous`. |
| First-row-wins bei doppelter B1R-Zeile mit gleicher Zone? | Nein. `duplicate_timezone_evidence`. |
| Wird lokale Wanduhr mit `Z` zum Instant? | Nein. Instant kommt nur aus B2A; lokale Felder bleiben zonenlos. |
| Wird IANA aus IATA/Land/Stadt geraten? | Nein. Kein Airport-/Country-Lookup. |
| Wird E5-A in den Mint importiert? | Nein. Abhängigkeit bleibt Event-Provenance → späteres Binding, nicht umgekehrt. |
| Wird `occurrence_event_ref` clientseitig geadelt? | Nein. Weder akzeptiert noch gemintet. SQL Deny-List analog. |
| Wird `provider_belegt` vom Client gesetzt? | Nein. Feld existiert im TS-Payload nicht. Writer bleibt Owner dieser Invariante. |
| Kann ein ungültiger Provider-Name (`user`, `jetnity`) durch? | Nein. SQL-Deny-Liste analog, `invalid_provider_identity`. |
| Wird Production oder der Writer erreicht? | Nein. Kein Apply, kein RPC, kein Client. |
| `ACTIVE_WORK_STATUS` / Ready / Merge / Folgeslice? | Nein. |

## 7. P0 / P1 / P2 / P3

| Stufe | Fund |
| --- | --- |
| **P0** | Keiner. Kein Client-Trust, kein first-match, kein Writer, keine Production-Mutation. |
| **P1** | Keiner. Observation kommt nur aus E5-B3B. Konflikte verhindern die Nutzlast. |
| **P2** | Keiner in diesem Slice. Offener späterer Writer-Vertrag: partial/empty `ok: true` darf nicht blind geschrieben werden. |
| **P3** | Mint ohne Runtime-Caller. `retrievedAt` strenger als SQL-Instant-Muster. Mutierbare Treffer-Objekte. Self-Review ≠ TL-PASS. |

## 8. Bewusste Schwächen, die bleiben

- Der Mint konstruiert nur eine zukünftige Writer-Nutzlast. Ohne späteren kontrollierten Write bleibt der Fakt flüchtig.
- `ok: true` mit leerer oder partieller Occurrence-Menge ist absichtlich snapshot-clear-fähig. Das ist kein Freibrief für einen automatischen Write.
- Die Observation ist genau so wahr wie der bereits gemintete E5-B3B-Wert. Der Mint erfindet keine zweite Uhr.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 9. Proaktive Residual-Empfehlung (nicht ausgeführt)

**Beobachtung:** Ein späterer Full-Current-Snapshot-Write löscht zuerst alle Occurrences des Items. Der Mint darf deshalb ehrlich leer/partial sein.

**Warum relevant:** Würde ein künftiger Caller jedes `ok: true` blind schreiben, könnten fehlende Endpunkte stale Zeilen löschen, obwohl nur Evidence fehlte – nicht, weil die Occurrence widerlegt wurde.

**Empfehlung:** Nicht in E5-B3C nachrüsten. Nach TL-PASS einen eigenen versionierten Writer-Slice mit expliziter complete-vs-partial Policy bauen. Kein Production-Apply und kein Runtime-Principal ohne Product-Owner-Gate.

**Priorität:** später / nach TL-PASS. Kein Product-Owner-Gate jetzt.

## 10. Full repository gates

Lokale Gates auf Runtime-Head `f2499d9a`:

| Lauf | Ergebnis |
| --- | --- |
| `npm test` | **3044/3044 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 139 warnings** vor Import-Cleanup; Cleanup entfernt die zwei Mint-Warnungen |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| `origin/main` | `8868f913...`, **0 behind** |

## 11. Urteil des Autors

Scope-treue Runtime + komplette Mandatory Regression Matrix + lokale Gates grün. `origin/main` unverändert `8868f913...`, 0 behind.

**Unabhängiger Technical-Lead-Review:** ausstehend auf dem **finalen** Head. PR bleibt Draft. Kein Ready, kein Merge, kein Folgeslice.
