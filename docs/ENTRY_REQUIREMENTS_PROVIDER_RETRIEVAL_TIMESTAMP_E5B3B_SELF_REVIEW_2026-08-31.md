# Entry Requirements E5-B3B – Adversarial Self-Review

Stand: 31. August 2026  
Autor-Agent: **`Jetnity entry requirements provider retrieval timestamp 1`**, Generation 1  
Session: `bc-1b857acd-7a88-4355-9bc1-4f94ece44f9b`  
Typ: adversarial Self-Review, **kein** unabhängiger Technical-Lead-PASS

Runtime-Head dieser Review-Runde: `09d5c0e0b46e6cdbb8e08459fe953cbb54f0c433`  
Pre-agent Head: `d3baa9c7efb5f9ef8ba658b953d752cf6adc130c`  
Baseline / `origin/main`: `ad7fb1fa5d0bd6ac3fe2a7085a65fb8d56cecbb8`

## 1. Auftrag gegen Diff

Auftrag: Issue #343 / E5-B3B server-observed Flight provider retrieval timestamp auf Draft-PR #344.

Geprüft:

- required `retrievedAt: string` auf `FlugProviderTreffer`; kein weicher Optional/nullable Vertrag
- Semantik: Jetnity-Serverzeit nach erfolgreichem Response+JSON-Read, canonical UTC ISO mit `Z`
- kein Timestamp aus Providerpayload, auch bei `retrievedAt` / `retrieved_at` / `observedAt` / `observed_at`
- kein erfolgreicher Treffer auf HTTP 500/401/403/Timeout oder unlesbarem JSON
- invalid Mapping liefert keinen Treffer, nur um einen Timestamp zu liefern
- Fake/Test-Provider explizit auf den required Vertrag aktualisiert
- `fluegeSuchen()` gibt den Zeitfakt nicht an Ranking oder Browser
- serialisierte `FlugSucheAntwort` ohne `retrievedAt` / `retrieved_at` / `observedAt` / `observed_at`
- `FlugOption` / `FlugSegment` unverändert
- E5-B1R/E5-B2A Evidence + Angebots-Cap unverändert
- keine Änderung an Domain/Client/Route/Trip/API/DB/`lib/providers/*`/`lib/commercial-provenance/*`
- `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` nicht editiert
- kein Persistenz-Mint, kein `flugNachweis`, keine Provider-/Secret-/paid activation

Traveller-Context-Intelligence: für diesen Slice **nicht relevant**. Es werden keine Citizenships, Dokumente oder Residence gelesen.

## 2. Exact changed files

Agent-Diff gegen Pre-agent-Head `d3baa9c7...`:

| Datei | Art |
| --- | --- |
| `lib/flights/provider.ts` | Runtime: required `retrievedAt` |
| `lib/flights/duffel/adapter.ts` | Runtime: Clock-Port + Mint nach JSON-Read |
| `lib/flights/duffel/adapter.test.ts` | Tests |
| `lib/flights/suche.ts` | Kommentar; Discard-Pfad unverändert |
| `lib/flights/suche.test.ts` | Fake-Provider + No-Leak |
| `lib/flights/schema.test.ts` | Extra-Key-Strip-Proof |

Nach diesem Review kommen die drei Delivery-Docs hinzu. Der finale Head steht live im PR.

Proof `docs/ACTIVE_WORK_STATUS.md` / `JETNITY_START_HERE.md` gegen Pre-agent-Head: leer.

## 3. Clock- / Timestamp-Provenance

| Frage | Beweis |
| --- | --- |
| Wann wird gemintet? | Erst nach `antwort.ok` und erfolgreichem `antwort.json()`. Davor `throw`, keine Uhr. |
| Woher kommt der Wert? | `retrievedAtAusUhr(uhr)` → `uhr().toISOString()`. Nicht aus `roh`. |
| Production-Clock? | Default dritter Parameter `() => new Date()`. `factory.ts` unverändert. |
| Test-Clock? | Optional `DuffelAdapterUhr`. Feste Uhr `2026-08-31T15:04:05.123Z` → exakt derselbe String. |
| Canonical form? | Regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$`. Kein Offset, kein lokales ISO. |
| Payload-Trust? | Fixture mit `retrievedAt`/`retrieved_at`/`observedAt`/`observed_at` auf Root, `data` und Offer. Adapter-`retrievedAt` bleibt der Clock-Wert. Optionen enthalten die Payload-Zeiten nicht. |
| Fehlerpfade? | 500/401/403/Timeout/unlesbares JSON: 0 Clock-Ticks, reject, kein Treffer. |
| Invalid Mapping? | Clock tickt nach JSON, aber `FlugProviderFehler('invalid')` – kein zurückgegebener Treffer. |
| Leere Evidence? | Erster Adapter-Test: leere Timezone/Instant-Arrays, trotzdem genau ein `retrievedAt`. |

## 4. Browser-No-Leak

| Beweis | Ergebnis |
| --- | --- |
| `optionenBewerten(treffer.options, ...)` | Source-Test in `suche.test.ts` |
| `sucheFuerClient(...)` ohne `retrievedAt` | Source-Test + Runtime |
| Serialisierte `FlugSucheAntwort` | enthält weder `retrievedAt` noch `retrieved_at` noch `observedAt`/`observed_at` noch den Fake-Wert `2026-08-31T12:00:00.000Z` |
| `'retrievedAt' in koerper` | false |
| Option-Objekte | kein `retrievedAt` / `observedAt` |
| Bestehender Timezone/Instant-No-Leak | bleibt grün und prüft jetzt zusätzlich Retrieval-Keys |

`client-sicht.ts` wurde nicht geändert. Die Grenze sitzt in der Orchestrierung, nicht in einem nachträglichen Key-Filter.

## 5. Proof unveränderter Verträge

`git diff origin/main...HEAD` für die folgenden Pfade ist leer:

- `lib/flights/domain.ts`
- `lib/flights/schema.ts`
- `lib/flights/client-sicht.ts`
- `lib/flights/airport-event-instant.ts`
- `lib/flights/duffel/factory.ts`
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

Zusätzlich:

- `flugOptionLesen` strippt injiziertes `retrievedAt`/`observedAt` von Option und Segment.
- E5-B3A Persistenzvertragstests 16/16 grün; SQL unverändert.
- Adapter-Cap-Test: 21 Angebote → 20 Optionen; Timezone- und Instant-Evidence nur für behaltene IDs; ein `retrievedAt` für den ganzen Treffer.

## 6. Adversarial Fragen

| Frage | Ergebnis |
| --- | --- |
| Sitzt `retrievedAt` auf `FlugOption` / `FlugSegment`? | Nein. Nur am Provider-Treffer. Domain unverändert. Schema-Test strippt Extra-Keys. |
| Kann ein Payload-Feld Trust erzeugen? | Nein. Clock-only. Expliziter Payload-Kontaminationstest. |
| Wird bei HTTP-Fehler trotzdem ein Treffer gebaut, damit ein Timestamp existiert? | Nein. Reject vor der Uhr. |
| Wird invalid JSON als Erfolg mit Timestamp verkauft? | Nein. `json()`-Throw → `invalid`, 0 Clock-Ticks. |
| Wird nach ungültigem Mapping ein Treffer nur wegen der Uhr zurückgegeben? | Nein. Mapping-invalid bleibt `invalid`. |
| Kann der Browser den Wert setzen oder wieder einspeisen? | Nein. Kein Client-Feld, kein Schema-Feld, kein Roundtrip. |
| Weicher `retrievedAt?:` Vertrag? | Nein. Required `string`. Test-Fakes setzen ihn explizit. |
| Zweite Provider-Architektur unter `lib/providers/*`? | Nicht berührt. |
| Commercial-Provenance-Mint wiederverwendet? | Nur als gelesenes Pattern. Kein Import, kein Writer. |
| Factory braucht eine Clock-Konfiguration? | Nein. Default-Serverzeit. |
| Freshness-/Availability-Claim? | Nein. Kommentar und Task verbieten das. Der Wert ist Observation, nicht Gültigkeit. |
| Angebots-Cap / E5-B1R / E5-B2A regressiert? | Nein. Bestehende Adapter-Tests bleiben und prüfen `retrievedAt` zusätzlich. |
| Shared Default-Timestamp als Produktionsfallback? | Nein. Kein Helper-Default im Runtime-Pfad. |
| `ACTIVE_WORK_STATUS` / Ready / Merge / Folgeslice? | Nein. |

## 7. P0 / P1 / P2 / P3

| Stufe | Fund |
| --- | --- |
| **P0** | Keiner. Kein Trust aus Payload, kein Treffer auf Fehlerpfaden, kein Browser-Leak, keine DB-/Provider-Aktivierung. |
| **P1** | Keiner. Required Vertrag, Clock erst nach JSON, Discard vor Ranking/Client. |
| **P2** | Keiner in diesem Slice. Offener späterer Mint-Vertrag: `retrieved_at` und `observed_at` müssen denselben Snapshot-Zeitpunkt tragen; das ist Folgeslice, nicht dieser Diff. |
| **P3** | Host-Uhr ohne NTP. Millisekunden in `toISOString()`. Kein Persistenz-Konsument. Mutierbare Treffer-Objekte. Self-Review ≠ TL-PASS. |

## 8. Bewusste Schwächen, die bleiben

- `retrievedAt` ist in E5-B3B nur in-memory. Ohne späteren server-owned Mint bleibt der Fakt flüchtig.
- Die Beobachtungszeit ist genau so wahr wie die Host-Uhr. Das ist die Task-erlaubte Quelle, kein zweiter Time-Service.
- Ein späterer Persistence-Mint darf diesen Wert kopieren, aber nicht durch einen neuen `Date.now()` ersetzen.
- Dieses Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

## 9. Proaktive Residual-Empfehlung (nicht ausgeführt)

**Beobachtung:** E5-B3A verlangt `retrieved_at` und `observed_at` mit `observed_at = retrieved_at`. E5-B3B liefert jetzt genau einen vertrauenswürdigen Snapshot-Zeitpunkt an der Provider-Naht.

**Empfehlung:** Nicht in E5-B3B nachrüsten. Zuerst unabhängigen TL-PASS dieses in-memory Cores, dann eigenen versionierten Slice für den TypeScript-Mint. Kein Production-Apply, kein Runtime-Principal, kein Writer ohne Product-Owner-Gate.

**Priorität:** später / nach TL-PASS. Kein Product-Owner-Gate jetzt.

## 10. Full repository gates

Lokale Gates auf Runtime-Head `09d5c0e0...`:

| Lauf | Ergebnis |
| --- | --- |
| `npm test` | **3015/3015 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 137 warnings** |
| `npm run build` | pass (Next.js 16.3.3 Turbopack) |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | pass |
| `origin/main` | `ad7fb1fa...`, **0 behind** |

## 11. Urteil des Autors

Scope-treue Runtime + komplette Mandatory Regression Matrix + lokale Gates grün. `origin/main` unverändert `ad7fb1fa...`, 0 behind.

**Unabhängiger Technical-Lead-Review:** ausstehend auf dem **finalen** Head. PR bleibt Draft. Kein Ready, kein Merge, kein Folgeslice.
