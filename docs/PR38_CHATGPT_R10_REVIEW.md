# PR #38 – ChatGPT Independent Review R10

Stand: 23. August 2026  
Status: **REQUEST CHANGES – R9-Blocker 16–19 substanziell geschlossen, R10-Blocker 20–23 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Base/Main beim R10-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Geprüfter Runtime-Head R10: `263c2f842d2287da652b27cc9660c28db68c6750`  
Docs-Lock vor R10: `081896abc4e84a2ff009b145e89a1fb11b7cb94e`  
Sync beim R10-Lock: **0 behind** `main`  
PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 1. R10-Urteil

Der unabhängige R10-Closure-Review wurde nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` auf dem tatsächlichen Runtime-Head `263c2f84` durchgeführt. Die Cursor-Screenshots wurden nur als Hinweis benutzt; PR, Runtime-Diff, GitHub Actions, Vercel und die betroffenen Codepfade wurden unabhängig geprüft.

R9-Blocker 16–19 sind in ihren geforderten Kernfällen substanziell geschlossen:

- spätere Segment-Origins werden in Kompaktanzeige und Pfadpunktfolge erhalten;
- Cross-Country-Gaps tragen das zweite Origin-Land in die Country-Truth;
- Connections haben globale Segmentindizes und die UI hängt den Umstieg am belegten Segment ein;
- Cross-Itinerary-Chronologie nutzt date-only nicht mehr künstlich als `00:00` und bleibt bei widersprüchlicher Evidenz fail-closed;
- Readiness-Fingerprints verwenden `v3|sha256:…` über den vollständigen Rohkontext statt Prefix-Truncation;
- alte v2-Fingerprints werden dadurch stale.

Das Exact-Head-Gate ist auf exakt `263c2f842d2287da652b27cc9660c28db68c6750` remote grün:

- GitHub Actions Run `32657741587`: **SUCCESS**
- Vercel Deployment `dpl_6SEMJak1nD6KxpJ5C6uib9VqE7pZ`: **READY**, exact Git SHA `263c2f842d2287da652b27cc9660c28db68c6750`

Der nachfolgende Docs-Lock `081896ab` ist genau ein Dokumentations-Commit ohne Runtime-Dateien. Dessen GitHub Actions Run `32658442601` ist **SUCCESS** und Vercel `dpl_4Ti2HJjXCBAQaj5g5uUy7M18uCyh` ist **READY** auf exakt diesem Docs-SHA. Das ist kein zweites Runtime-Gate.

**Noch kein Closure/PASS.** Der adversarielle R10-Durchgang findet vier konkrete Restdefekte, die vorhandene grüne Tests nicht abdecken.

PR #38 bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.

---

## 2. Merge-Blocker 20 – Chronologie wird innerhalb einer einzelnen Multi-Leg-Itinerary nicht auf Widerspruch geprüft

### Betroffene Stellen

- `lib/route/chronologie.ts`
- `lib/route/schema.ts`
- `lib/route/ableitung.ts`
- `lib/route/laender.ts`
- `lib/route/anzeige.ts`
- `lib/route/fingerprint.ts`

### Konkreter Fall

Eine einzelne `FlugRouteItinerary` darf mehrere Legs enthalten. Das Runtime-Schema validiert einzelne Datums-/Zeitwerte, prüft aber weder die chronologische Leg-Reihenfolge noch einen Widerspruch zwischen Leg-Reihenfolge und Segmentdaten.

Beispiel einer strukturell gültigen Itinerary:

1. Leg 0: `BKK → ZRH`, Abflug `2026-11-12 23:00`
2. Leg 1: `ZRH → BKK`, Abflug `2026-11-01 09:15`

Die Segmentdaten beweisen, dass Leg 1 zeitlich vor Leg 0 liegt. Die Array-Reihenfolge behauptet das Gegenteil.

`routeChronologieBewiesen()` gibt bei `itineraries.length <= 1` jedoch pauschal `true` zurück. Damit wird die interne Leg-Reihenfolge gar nicht auf Widerspruch geprüft.

### Endwirkung

`routeFactsAusItineraries()` nimmt das erste Segment der ersten Leg als globale Origin-Truth. Im Beispiel wird daher `TH`/BKK zum Reise-Origin, obwohl die eigenen strukturierten Segmentdaten `CH`/ZRH als früheren Start beweisen.

`laenderrollenAus()` übernimmt denselben ersten Leg-Origin. `routeKompakt()` zeigt die widersprüchliche Leg-Reihenfolge als normale, bewiesene Reiseabfolge. Die gleiche semantische Reise kann damit andere Country-Rollen erhalten, je nachdem ob sie als **eine Multi-Leg-Itinerary** oder als **mehrere Flight-Items** persistiert wurde.

Das ist genau die Fehlerklasse, die R8/R9 zwischen getrennten Flight-Items geschlossen haben – innerhalb einer Itinerary bleibt sie offen.

### Erforderliche Korrektur

Die kanonische Chronologie muss auch die Leg-Ebene berücksichtigen.

Mindestens gilt:

- explizite Segmentchronologie, die die deklarierte Leg-Reihenfolge widerspricht, darf nicht als `chronologieBewiesen=true` enden;
- bei einem echten Widerspruch fail-closed: kein erfundener globaler Origin und keine normal dargestellte Reihenfolge;
- eine konsistente normale Multi-Leg-Itinerary bleibt unverändert;
- die Implementierung darf eine widersprüchliche Provider-/Browser-Reihenfolge nicht still über lexikographische Airport-Pfade reparieren;
- wenn eine sichere kanonische Reihung aus belastbarer Segmentchronologie gewählt wird, muss dieselbe SoT von Origin, Country-Rollen, Fingerprint und Anzeige verwendet werden.

### Pflicht-Regressionen Blocker 20

1. eine Itinerary mit zwei zeitlich umgekehrt angeordneten Legs und klaren Segmentzeiten → **kein falscher TH-Origin**;
2. dieselbe Reise als korrekt datierte separate Flight-Items → gleiche fachliche Country-Truth wie die sichere/fail-closed Multi-Leg-Auswertung;
3. normal geordneter Roundtrip bleibt `CH` Origin, `TH` Ziel;
4. Open Jaw und 3-Leg-Multi-City bleiben korrekt;
5. gleichzeitige/ambigue Leg-Starts erzeugen keine erfundene Reihung aus Airport-Text;
6. Guest/Account-Parität;
7. Anzeige kennzeichnet unbewiesene Reihenfolge statt sie normal zu behaupten.

---

## 3. Merge-Blocker 21 – Surface-/Airport-Change-Grenze wird in der Anzeige erhalten, aber aus dem Route-Fingerprint wieder gelöscht

### Betroffene Stellen

- `lib/route/pfad.ts`
- `lib/route/fingerprint.ts`
- `lib/route/vergleich.ts`
- `lib/readiness/kontext.ts`
- indirekt Readiness-Stale

### Konkrete Kollision

`pfadSchritteAusSegmenten()` erkennt inzwischen korrekt, ob zwischen zwei Segmenten ein Airport-/Surface-Wechsel liegt, und setzt `surfaceChange=true`.

`pfadAusSegmenten()` serialisiert danach aber **nur die Punkte** und verwirft dieses Flag wieder.

Dadurch kollidieren zwei unterschiedliche Topologien:

**A – Surface/Airport Change**

- `ZRH → CDG`
- danach `ORY → BKK`

Anzeige: `ZRH → CDG ⇢ ORY → BKK`

**B – kontinuierliche Flugkette**

- `ZRH → CDG`
- `CDG → ORY`
- `ORY → BKK`

Anzeige: `ZRH → CDG → ORY → BKK`

Beide werden aktuell im Fingerprint sinngemäß zu:

`route-v1|ZRH:CH>CDG:FR>ORY:FR>BKK:TH`

Die wichtige Information **„zwischen CDG und ORY gibt es keinen Flugsegment-Kontakt, sondern einen Surface-/Airport-Wechsel“** fehlt in der Route-ID.

### Warum das fachlich relevant ist

Die beiden Routen haben dieselben Origin-/Destination-/Transit-Country-Mengen, aber nicht dieselbe Topologie. Ein Surface-/Airport-Wechsel kann für Einreise, Landside-Transfer, Zeitpuffer und spätere Providerlogik erheblich anders sein als eine kontinuierliche Segmentkette.

`routeAenderungZwischen()` kann diese Änderung verpassen, weil Fingerprint und Transitländer gleich bleiben. Readiness kann aus demselben Grund einen alten Check als current behandeln, obwohl die Route von einer normalen Verbindung auf einen Surface-/Airport-Wechsel geändert wurde.

Die UI sieht den Unterschied bereits – die kanonische Identität nicht. Das verletzt „eine Reise, eine Wahrheit“.

### Zweiter Rand: unbekannte IATA darf keine bewiesene Kontinuität werden

`airportGleich()` liefert derzeit `true`, wenn **beide** Airport-Codes fehlen. Damit kann ein späterer Segment-Origin still verschwinden, obwohl gar nicht bewiesen ist, dass vorheriges Ziel und nächster Start derselbe Airport sind.

Fehlende Identität ist `unknown`, nicht „gleich“.

### Erforderliche Korrektur

- Route-Fingerprint muss die Übergangsart erhalten, z. B. kanonisch unterschiedliche Tokens für kontinuierlichen Segmentkontakt und Surface-/Airport-Change;
- `pfadSchritteAusSegmenten()` und Fingerprint dürfen nicht zwei unterschiedliche Topologien auf dieselbe Zeichenfolge abbilden;
- fehlende IATA auf beiden Seiten darf keine erfundene Airport-Gleichheit erzeugen;
- Route-Change und Readiness-Stale müssen dieselbe Topologie-ID lesen;
- falls die Fingerprint-Semantik versioniert persistiert/weitergereicht wird, Versionierung sauber anpassen oder nachweisen, warum kein alter Wert überleben kann.

### Pflicht-Regressionen Blocker 21

1. `ZRH→CDG`, `ORY→BKK` ≠ `ZRH→CDG`, `CDG→ORY`, `ORY→BKK` im Route-Fingerprint;
2. `routeAenderungZwischen()` erkennt Surface ↔ kontinuierliche Kette;
3. Readiness-Fingerprint wird bei diesem Wechsel stale;
4. Kompaktanzeige bleibt bei Surface `⇢`, bei kontinuierlich `→`;
5. gleicher Airport `ZRH→DOH`, `DOH→BKK` bleibt kontinuierlich;
6. beide Airport-Codes unbekannt → keine erfundene Kontinuität;
7. Guest/Account-Parität;
8. Open Jaw/Leg-Grenzen aus R8/R9 bleiben unverändert korrekt.

---

## 4. Merge-Blocker 22 – Connection-Truth erfindet Airport-Change bei nur einem bekannten IATA und berechnet Zeitdifferenzen über unterschiedliche Ortszeiten

### Betroffene Stellen

- `lib/route/verbindung.ts`
- `lib/flights/zeit.ts`
- `components/trips/FlugRoute.tsx`
- `lib/route/anzeige.ts`

### Teil A – ein bekannter Airport reicht aktuell fälschlich für `airportChange=true`

Aktuell gilt sinngemäß:

- beide IATA bekannt → vergleichen;
- nur einer bekannt → `airportChange=true`;
- beide unbekannt → `null`.

Wenn beispielsweise der Ankunfts-Airport unbekannt ist, der nächste Abflug aber `ORY`, ist ein Flughafenwechsel **nicht bewiesen**. Der unbekannte Airport könnte ORY sein. Das Domain-Modell hat bereits `boolean | null`; dieser Fall muss `null` bleiben.

Sonst zeigt Jetnity „Flughafenwechsel erforderlich“, obwohl die Daten das nicht belegen.

### Teil B – `umstiegMinuten()` wird außerhalb seines eigenen Gültigkeitsbereichs benutzt

`lib/flights/zeit.ts` dokumentiert ausdrücklich, dass Ortszeiten **ohne Zeitzonen-Umrechnung** geführt werden und Minuten zwischen zwei Ortsangaben nur vergleichbar sind, wenn sie am selben Kalenderort gemeint sind – ausdrücklich: „für Umstiege am selben Flughafen gilt das“.

`verbindungenAusSegmenten()` berechnet `durationMinutes` jedoch auch dann, wenn Ankunfts- und nächster Abflug-Airport verschieden sind.

Konkretes bereits vorhandenes R9-Fixture:

- Ankunft `CDG` am `2026-11-01` um `08:30` Pariser Ortszeit;
- nächster Abflug `LCY` um `12:40` Londoner Ortszeit.

Die aktuelle Funktion zieht die Uhrzeiten direkt voneinander ab und erhält **4 h 10 min**. Paris und London liegen an diesem Datum aber in unterschiedlichen Zeitzonen. Ohne Timezone-/Instant-Evidence ist diese elapsed duration nicht belastbar.

Dasselbe Problem gilt allgemein für Cross-Country-Surface-Gaps und potenziell für Airport-Changes in unterschiedlichen Zeitzonen.

### Erforderliche Korrektur

- `airportChange=true` nur wenn beide kanonischen IATA bekannt und verschieden sind;
- nur einer/keiner bekannt → `airportChange=null`, sofern keine andere belastbare Airport-Identität existiert;
- `durationMinutes` aus lokalen Segmentzeiten nur dort berechnen, wo beide Zeitangaben sicher am **selben Airport/Ort** gelten;
- bei Surface-/Airport-Change ohne timezone-aware Instants oder explizite Provider-Dauer: `durationMinutes=null` statt einer scheinpräzisen Zahl;
- ein späterer echter Provider darf eine belastbare elapsed duration liefern, aber lokale Uhrzeiten allein dürfen sie nicht erfinden.

### Pflicht-Regressionen Blocker 22

1. gleicher IATA + valide Zeiten → Layover-Dauer bleibt berechenbar;
2. zwei verschiedene bekannte IATA → `airportChange=true`, aber lokale Uhrzeiten allein erzeugen keine Cross-Airport-Dauer;
3. `CDG→LCY` Surface-Gap → keine naive `4 h 10 min`-Behauptung;
4. nur Ankunfts-IATA bekannt → `airportChange=null`;
5. nur Abflug-IATA bekannt → `airportChange=null`;
6. beide IATA unbekannt → `airportChange=null`;
7. UI zeigt keine erfundene Dauer/kein erfundenes „Flughafenwechsel erforderlich“;
8. R9-Multi-Leg-Segmentzuordnung bleibt korrekt.

---

## 5. Merge-Blocker 23 – Readiness-v3 hasht den vollen Text, aber nicht die vollständige Credential-Bedeutung

### Betroffene Stellen

- `lib/readiness/traveller-kontext.ts`
- `lib/readiness/kontext.ts`
- `lib/readiness/fingerprint.ts`
- `lib/readiness/schema.ts`
- Traveller-/Readiness-Regressions

### Konkrete semantische Kollision

R9 Blocker 19 hat die 800-Zeichen-Truncation korrekt durch SHA-256 ersetzt. Das löst aber nur die **Längen-/Prefix-Kollision**. Die Daten, die vor dem Hash serialisiert werden, müssen trotzdem die vollständige fachliche Bedeutung tragen.

Aktuell besteht ein Dokument-Fingerprint aus:

- `documentType`
- `issuingCountryCode`
- `expiresOn`
- `citizenshipClientRef`

Die tatsächliche Staatsbürgerschaft, zu der dieses `citizenshipClientRef` **heute** auflöst, wird nicht in diesem Dokument-Fingerprint gespeichert.

Gleichzeitig enthält der Traveller-Fingerprint nur die **Menge der Citizenship-Country-Codes**, nicht die Abbildung `clientRef → countryCode`.

### Reproduzierbarer Fall ohne exotische Daten

Traveller hat zwei Staatsbürgerschaften:

- `c1 → CH`
- `c2 → RS`

Ein Pass ist mit `citizenshipClientRef = c1` verknüpft.

Später werden die beiden Country-Zuordnungen unter denselben stabilen Refs getauscht:

- `c1 → RS`
- `c2 → CH`

Die Country-Menge bleibt `CH,RS`.

Der Dokument-Fingerprint bleibt ebenfalls identisch, weil er weiterhin nur `…:c1` enthält.

Der Readiness-v3-Rohkontext und damit der SHA-256 können deshalb identisch bleiben.

`credentialOptionsAus()` löst `c1` aber über `documentCitizenshipCode()` auf. Die effektive Dokument-Zuordnung hat sich fachlich von **CH zu RS** geändert. Genau diese Änderung kann Einreise-/Visa-/Dokument-Eligibility verändern.

Ein zuvor als erledigt gespeicherter Check kann dadurch fälschlich `current` bleiben.

### Zweiter Identitätsrand – delimiterbasierte Rohserialisierung

Der v3-Hash schützt nur, wenn der Rohkontext eindeutig serialisiert ist. `clientRef`-Felder sind zulässige opaque Strings bis 64 Zeichen; die Schemas verbieten `,`, `:`, `|` nicht. Gleichzeitig werden Dokument-Fingerprints mit `:` und mehrere Dokumente mit `,` zusammengefügt.

Damit ist die Serialisierung nicht grundsätzlich injektiv: ein einzelner opaque Ref kann dieselben Trennzeichen enthalten, die auch die Listen-/Feldstruktur markieren.

Für eine Stale-Identität sollte der SHA über eine **kanonische strukturierte Repräsentation** gehen (z. B. stabil geordnete JSON-Struktur oder eindeutig length-prefixed Felder), nicht über potentiell mehrdeutige String-Konkatenation.

### Erforderliche Korrektur

- pro Dokument muss die **aufgelöste Citizenship-Country-Bedeutung** in die Readiness-Identität eingehen;
- alternativ muss die vollständige kanonische Abbildung `citizenshipClientRef → countryCode` Teil der Credential-Identität sein;
- Reordering ohne Bedeutungsänderung bleibt fingerprint-invariant;
- die vor SHA-256 gehashte Struktur muss für erlaubte opaque Refs eindeutig serialisiert sein;
- keine Passnummern/Scans/MRZ aufnehmen.

### Pflicht-Regressionen Blocker 23

1. `c1=CH,c2=RS`, Dokument→`c1`; danach `c1=RS,c2=CH` → Readiness-Fingerprint **ändert sich**;
2. dieselben Citizenship-Zuordnungen nur in anderer Array-Reihenfolge → Fingerprint bleibt gleich;
3. Dokument wechselt seine verknüpfte Citizenship CH→RS → stale;
4. mehrere Pässe/Dokumente bleiben order-invariant;
5. opaque `clientRef` mit `,`, `:` oder `|` kann nicht dieselbe Identität wie eine strukturell andere Dokument-/Citizenship-Menge erzeugen;
6. Guest/Account-Parität;
7. v2 bleibt stale und v3 bleibt innerhalb DB-Limit;
8. keinerlei sensible Dokumentnummern werden Teil des Hash-Inputs.

---

## 6. Nicht wieder geöffnet

R10 öffnet **nicht** erneut:

- R9 Blocker 16 für das reine Sichtbarhalten späterer Segment-Origins;
- R9 Blocker 17 für globale Connection-Segmentindizes;
- R9 Blocker 18 für Cross-Itinerary date-only/Segmentzeit-Ordnung;
- R9 Blocker 19 für Prefix-Truncation und v2→v3-Stale;
- frühere Acute-/Seasonal-/Stage-/Day-/Provider-Normalisierungsfixes;
- Live-Provider, Secrets, Seasonal-DB oder Kosten;
- bewusst später geplante Provider-Readiness-/Adapter-Gaps, soweit sie nicht für diese vier konkreten Truth-Fehler nötig sind.

Die neuen Findings sind jeweils **konkrete noch reproduzierbare Restpfade derselben gehärteten SoT-/Cross-Domain-Klassen**, keine theoretische Scope-Erweiterung.

---

## 7. R10 Stop-Kriterium / nächster Schritt

Cursor soll Blocker 20–23 **als Fehlerklassen** schließen, nicht nur die Beispielwerte hartcodieren.

Danach:

1. neue gezielte Regressionen;
2. kompletter lokaler Gate-Lauf;
3. GitHub Actions + Vercel auf exakt neuem Runtime-Head;
4. genau ein Docs-Lock ohne Runtime-Änderung;
5. unabhängiger ChatGPT-Re-Review **R11**.

Für R11 gilt strikt das Stop-Kriterium: Wenn die vier Fehlerklassen geschlossen sind und der erneute adversarielle Review **keinen weiteren konkreten relevanten Truth-/Security-/Provider-/SoT-/Cross-Domain-/Release-Defekt** findet, wird PR #38 technisch auf **Closure/PASS** gesetzt. Keine künstliche Verlängerung nur für theoretische Perfektion.

Bis dahin: **REQUEST CHANGES. PR bleibt Draft. Kein Mark Ready. Kein Merge.**
