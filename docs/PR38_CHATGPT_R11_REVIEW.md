# PR #38 – ChatGPT Independent Review R11

Stand: 23. August 2026  
Status: **REQUEST CHANGES – R10-Blocker 20–23 substanziell geschlossen, R11-Blocker 24–26 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Base/Main beim R11-Lock: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Geprüfter Runtime-Head R11: `fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072`  
Docs-Lock vor R11: `8f0aaa504f73100445df8e9387ad023fb22a8b7c`  
PR-Zustand beim Review: **open, mergeable, Draft, nicht gemergt**

## 1. R11-Urteil

Der unabhängige R11-Closure-Review wurde nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` auf dem tatsächlichen Runtime-Head `fdcc5c88` durchgeführt. Die Cursor-Screenshots wurden nur als Orientierung verwendet; PR-Zustand, Runtime-Diff, GitHub Actions, Vercel und die betroffenen Route-/Readiness-Codepfade wurden unabhängig geprüft.

R10-Blocker 20–23 sind in ihren geforderten Kernfällen substanziell geschlossen:

- Multi-Leg-Itineraries werden bei eindeutigem Leg-Start kanonisiert und erzeugen in den getesteten Reverse-Roundtrip-Fällen keinen falschen TH-Origin mehr;
- Route-Fingerprints sind `route-v2` und unterscheiden kontinuierliche Übergänge (`>`) von einer nicht kontinuierlichen Grenze (`~`);
- `airportChange=true` entsteht nur bei zwei bekannten unterschiedlichen IATA, Cross-Airport-Lokalzeiten erzeugen keine erfundene Layover-Dauer;
- Readiness verwendet `v4|sha256:…` über kanonisches JSON inklusive aufgelöster Dokument-Citizenship; v2/v3 werden stale;
- keine Passnummern wurden in die Credential-Identität aufgenommen.

Exact-Head-Evidence ist auf exakt `fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072` remote bestätigt:

- GitHub Actions Run `32661394335`: **SUCCESS**
- Vercel Deployment `dpl_6hAk5DvrcSz8BTnsQQfSrKuaKjFd`: **READY**, `githubCommitSha=fdcc5c882b4fb8598b3eb0956b9bdeeb0ef94072`

Der nachfolgende Head `8f0aaa50` enthält gegenüber `fdcc5c88` nur Dokumentation; darunter liegen die zwischenzeitlich verbindlich hinzugefügten Multi-Agent-Policy-Dokumente plus Cursor-Docs-Lock. GitHub Actions `32663261760` ist SUCCESS und Vercel `dpl_D3r4PnRCPFSyjuvJQsMp1dWLqJnx` ist READY auf exakt `8f0aaa50`. Das ist kein zweites Runtime-Gate.

**Noch kein Closure/PASS.** R11 findet drei konkrete Restdefekte in der gemeinsamen Route Truth. Sie sind direkt relevant für Origin/Destination, Country-Rollen, Fingerprint, Anzeige und die darauf aufbauenden Seasonal/Safety/Readiness-Kontexte.

PR #38 bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.

---

## 2. Merge-Blocker 24 – Lokale Flughafen-Uhrzeiten werden als absolute Cross-Airport-Chronologie behandelt

### Betroffene Stellen

- `lib/route/chronologie.ts`
- `lib/flights/domain.ts`
- `lib/flights/zeit.ts`
- `lib/route/ableitung.ts`
- `lib/route/laender.ts`
- `lib/route/fingerprint.ts`
- `lib/route/anzeige.ts`

### Konkretes Problem

Die Flugdomäne definiert `departureDate` / `departureTime` ausdrücklich als **Ortszeit des jeweiligen Flughafens**. `lib/flights/zeit.ts` hält zusätzlich fest, dass solche Ortszeiten ohne Zeitzonen-/Offset-Evidence nicht zwischen verschiedenen Kalenderorten als elapsed/absolute Zeit verglichen werden dürfen.

`lib/route/chronologie.ts` vergleicht für die Reihenfolge jedoch Strings wie `YYYY-MM-DDTHH:mm` direkt:

- `beinStart()` nimmt den ersten Segment-Abflug eines Legs;
- `beineHabenEindeutigeOrdnung()` betrachtet unterschiedliche lokale Datetimes als eindeutige Reihenfolge;
- `itineraryBeineOrdnen()` sortiert danach Legs;
- `startKandidaten()` / `paarOrdnung()` verwenden dieselbe Annahme auch zwischen getrennten Flight-Items.

Damit wird eine lokale Wanduhr verschiedener Flughäfen zur absoluten Chronologie, obwohl das Datenmodell diese Aussage nicht trägt.

### Reproduzierbarer Date-Line-Fall

Eine valide strukturierte Multi-City-Reise kann z. B. enthalten:

1. `NRT → HNL`, Abflug **02. Jan 20:00** Tokio-Ortszeit, Ankunft **02. Jan 08:00** Honolulu-Ortszeit;
2. `HNL → LAX`, Abflug **02. Jan 10:00** Honolulu-Ortszeit.

Die deklarierte/physische Reihenfolge ist NRT → HNL → LAX. Durch die Datumsgrenze ist `10:00` in Honolulu aber als lokaler String kleiner als `20:00` in Tokio. Der aktuelle Sortierer kann deshalb Leg 2 vor Leg 1 stellen und HNL statt NRT als globalen Origin ableiten.

Das ist keine theoretische Provider-Spezialität, sondern folgt direkt daraus, dass Jetnity Ortszeiten ohne IANA-Zone/UTC-Offset speichert.

### Warum merge-blocking

- R10 hat lokale Segmentzeiten gerade zur Source of Truth für Leg-Reihenfolge gemacht;
- dieselben Daten sind laut Flight-Domain nicht als absolute Cross-Airport-Zeit definiert;
- falsche Reihenfolge verändert `RouteFacts.origin`, `destination`, Country-Rollen, Fingerprint und Anzeige;
- Readiness/Safety/Seasonal konsumieren diese Route Truth;
- International-Date-Line-, Open-Jaw- und Same-Day-Multi-City-Fälle sind fachlich legitime Reiseformen.

### Erforderliche Korrektur

Lokale Wanduhrzeiten dürfen nur dann eine Reihenfolge **beweisen**, wenn ihre Vergleichbarkeit belegt ist. Zulässige Strategien sind z. B.:

- strukturelle/topologische Reihenfolge verwenden, wenn sie belastbar ist;
- lokale Zeiten am selben bewiesenen Flughafen vergleichen;
- nur solche groben Datumsabstände als Reihenfolge verwenden, die ohne Offset-Wissen eindeutig sind;
- bei cross-airport/Date-Line-Unsicherheit fail-closed (`chronologieBewiesen=false`) statt eine absolute Reihenfolge zu erfinden;
- später timezone-aware Instants/UTC-Offsets als zusätzliche Evidence nutzen.

Für diesen PR ist **kein neuer Provider und keine Timezone-DB** erforderlich. Ein konservativer fail-closed-/topologischer Fix genügt.

### Pflicht-Regressionen Blocker 24

1. Date-Line-Fall `NRT→HNL` gefolgt von `HNL→LAX` mit lokal `20:00` / `10:00` darf nicht zu HNL-Origin umsortiert werden;
2. dieselbe Route als getrennte Flight-Items darf keine falsche Cross-Airport-Wanduhr-Reihenfolge erfinden;
3. zwei Starts am selben bekannten Airport mit validen lokalen Zeiten bleiben vergleichbar;
4. weit auseinanderliegende, sicher entscheidbare Reisetage bleiben korrekt;
5. unentscheidbare Same-Day-/Date-Line-Konstellation wird fail-closed statt lexikalisch/clock-basiert zur Business-Truth;
6. Fingerprint bleibt deterministisch, auch wenn semantische Chronologie unknown ist;
7. Guest/Account-Parität;
8. bisherige Reverse-Roundtrip-/Open-Jaw-/Multi-City-Regressionen bleiben grün.

---

## 3. Merge-Blocker 25 – Segmentreihenfolge innerhalb eines Legs wird weiterhin ungeprüft als Route Truth übernommen

### Betroffene Stellen

- `lib/route/schema.ts`
- `lib/route/chronologie.ts`
- `lib/route/ableitung.ts`
- `lib/route/verbindung.ts`
- `lib/route/laender.ts`
- `lib/route/pfad.ts`
- `lib/route/anzeige.ts`

### Konkretes Problem

`docs/ROUTE_TRANSIT_INTELLIGENCE.md` beschreibt ein `FlugRouteItinerary` als Legs mit **geordneten Segmenten**. Gleichzeitig dokumentiert `lib/route/schema.ts`, dass die Momentaufnahme aus Browser, Local Storage oder Metadata kommen kann. Das Zod-Schema validiert IATA, Länder, Kalenderdaten und Uhrzeiten, aber **nicht die semantische Segmentreihenfolge innerhalb eines Legs**.

R10 hat die Reihenfolge **zwischen Legs** gehärtet. Innerhalb eines Legs prüft `routeChronologieBewiesen()` jedoch nichts: eine Itinerary mit genau einem Leg gilt nach der Leg-Prüfung als bewiesen, egal wie dessen `segments[]` angeordnet sind.

### Reproduzierbarer Fall

Die reale Verbindung sei:

1. `ZRH → DOH`
2. `DOH → BKK`

Ein strukturell gültiger, aber umgekehrt gespeicherter Segment-Array:

1. `DOH → BKK`
2. `ZRH → DOH`

wird aktuell akzeptiert. Bei nur einem Leg bleibt `chronologieBewiesen=true`. Daraus können entstehen:

- globaler Origin `DOH/QA` statt `ZRH/CH`;
- letzter Destination-Punkt wieder `DOH/QA` statt `BKK/TH`;
- `TH` kann fälschlich als Transit statt Ziel erscheinen;
- `CH` kann als späteres Ziel erscheinen;
- zwischen `BKK` und `ZRH` wird eine künstliche Surface-/Airport-Change-Verbindung modelliert;
- Kompaktanzeige und Route-ID bilden die falsche Array-Reihenfolge ab.

Damit kann dieselbe reale Route je nach Segment-Array-Reihenfolge eine andere kanonische Wahrheit erhalten.

### Warum merge-blocking

- Segmentreihenfolge ist ein Kernbestandteil der Foundation-D-Route-Truth;
- der Snapshot kann aus untrusted Browser-/Local-Storage-/Metadata-Pfaden kommen;
- die falsche Reihenfolge wirkt direkt auf Route, Transit, Readiness, Seasonal und Safety;
- grüne Tests prüfen nur korrekt angeordnete Segmentarrays.

### Erforderliche Korrektur

Die Segment-Order-Invariante muss Teil der kanonischen Route Truth werden. Die konkrete Lösung ist frei, muss aber fail-closed sein:

- eindeutig aus Topologie/Evidence rekonstruierbare Segmentketten dürfen kanonisiert werden;
- eine eindeutig belegte kontinuierliche Kette darf nicht als Surface-Change erscheinen, nur weil das Input-Array verdreht war;
- mehrdeutige, zyklische oder nicht belastbar ordnungsfähige Segmente dürfen keine `chronologieBewiesen=true`-Business-Truth erzeugen;
- echte Airport-/Surface-Change-Fälle müssen weiterhin unterstützt und nicht pauschal als ungültig verworfen werden;
- lokale Cross-Airport-Uhrzeiten dürfen bei dieser Korrektur nicht erneut als absolute Zeit missbraucht werden (Blocker 24).

### Pflicht-Regressionen Blocker 25

1. umgekehrte kontinuierliche Kette `DOH→BKK`, `ZRH→DOH` erzeugt nicht QA-Origin/TH-Transit/CH-Ziel;
2. wenn die Kette eindeutig topologisch rekonstruierbar ist, teilt sie mit `ZRH→DOH→BKK` dieselbe kanonische Route-ID und Country-Truth – alternativ wird sie explizit fail-closed verworfen;
3. normale korrekt geordnete Transitkette bleibt unverändert;
4. echter `CDG ⇢ ORY` Airport Change bleibt gültig;
5. mehrdeutige/zyklische Segmenttopologie erzeugt keine erfundene Reihenfolge;
6. fehlende IATA bleibt unknown, nicht künstliche Kontinuität;
7. Connection-Indizes und Detail-UI folgen der kanonischen Segmentreihenfolge;
8. Guest/Account-Parität;
9. Cross-Domain Seasonal/Readiness/Safety sehen nach der Korrektur dieselbe Länder-/Airport-Truth.

---

## 4. Merge-Blocker 26 – `RouteFacts.destination` ist bei mehreren Flight-Items nicht das Ende der kanonischen Gesamtroute

### Betroffene Stellen

- `lib/route/ableitung.ts`
- `lib/readiness/kontext.ts`
- `lib/safety/kontext.ts`
- `lib/seasonal/kontext.ts`
- Route-/Cross-Domain-Regressionen

### Konkretes Problem

Nach `itinerariesFuerWahrheit()` wird `primaer = wahrheit[0]` gewählt. `origin` wird korrekt aus dem ersten Segment der ersten kanonischen Itinerary gebildet.

`destination` wird aber ebenfalls aus `primaerSegmente` gebildet – also aus dem **Ende der ersten Itinerary**, nicht aus dem Ende der letzten kanonischen Itinerary.

Beispiel mit zwei eindeutig datierten Flight-Items:

1. `ZRH → BKK` am 1. November
2. `BKK → SIN` am 5. November

Die Gesamtroute endet in `SIN/SG`. Aktuell kann `RouteFacts.destination` trotzdem `BKK/TH` sein.

`destinationCountryCodes` ist inzwischen leg-/itinerary-bewusst und kann gleichzeitig `TH` und `SG` enthalten. Dadurch widerspricht der singuläre `RouteFacts.destination` der eigenen `legs`-/`segments`-/Country-Truth.

### Endwirkung

- `RouteFacts` selbst enthält zwei unterschiedliche Aussagen über das Ende derselben Reise;
- `readiness/kontext.ts` exportiert daraus ein singuläres `destinationCountryCode`;
- Safety und Seasonal lesen `route.destination` zusätzlich zu den Country-/Segmentmengen;
- heutige Mengenlogik maskiert den Fehler in mehreren Fällen, aber ein zentraler Source-of-Truth-Wert bleibt falsch und ist für spätere Provider-/Workspace-Consumer gefährlich.

### Erforderliche Korrektur

Bei **bewiesener** Chronologie:

- `origin` = erstes Segment der ersten kanonischen Itinerary/Leg;
- `destination` = letztes Segment der letzten kanonischen Itinerary/Leg.

Bei unbewiesener Gesamtreihenfolge bleiben beide fail-closed leer/unknown.

Die Korrektur muss dieselbe `wahrheit`-Repräsentation verwenden wie Country-Rollen, Fingerprint und Anzeige.

### Pflicht-Regressionen Blocker 26

1. zwei Items `ZRH→BKK` + `BKK→SIN` → `origin=ZRH`, `destination=SIN`;
2. drei sequenzielle Flight-Items → Destination des letzten Items;
3. getrennte Roundtrip-Items `ZRH→BKK` + `BKK→ZRH` → Destination `ZRH`;
4. Open Jaw → korrektes letztes Route-Ende;
5. Input-Array umkehren ändert bei beweisbarer Chronologie weder Origin noch Destination;
6. unbewiesene Chronologie → Origin und Destination null/unknown;
7. eine Multi-Leg-Itinerary bleibt korrekt;
8. Readiness/Safety/Seasonal erhalten dieselbe korrigierte Route Truth;
9. Guest/Account-Parität.

---

## 5. Was R11 ausdrücklich nicht wieder öffnet

R11 öffnet die folgenden bereits geschlossenen Klassen **nicht** erneut:

- R10 Surface-Token `route-v2` für bekannte/erhaltene Grenzen;
- R10 `airportChange`-Tri-State und Cross-Airport-Duration;
- R10 Readiness-v4/Credential-Bedeutung;
- R9 Connection-Leg-Zuordnung;
- R8/R9 Open-Jaw-/Country-Role-Grundfälle;
- frühere Seasonal Evidence-/Provider-/API-Graph-/Zeitfenster-Blocker.

Es wurden außerdem keine neuen Seasonal-Provider, Secrets, DB-Migrationen oder laufenden Kosten im Runtime-Diff gefunden. `seasonalProviderAus()` bleibt `null`.

## 6. Nächster verbindlicher Schritt

Cursor soll **24–26 als einen begrenzten Route-Chronology-/Canonical-End-Block** schließen und danach einen eigenen adversariellen Self-Review durchführen.

Danach:

1. gezielte Regressionen 24–26;
2. breite Route/Seasonal/Safety/Readiness-Regression;
3. kompletter lokaler Gate-Lauf;
4. GitHub Actions + Vercel auf exakt neuem Runtime-Head;
5. Docs-Lock ohne weitere Runtime-Änderung;
6. unabhängiger ChatGPT-Re-Review **R12**.

Für R12 gilt weiterhin das strikte Stop-Kriterium: Wenn nach ausreichend tiefer Prüfung **kein neuer konkreter relevanter Truth-/Security-/Provider-/SoT-/Cross-Domain-/Release-Defekt** gefunden wird, technisches **Closure/PASS** dokumentieren und die Review-Schleife beenden.

PR bleibt Draft. Kein Mark Ready. Kein Merge ohne ausdrückliche Product-Owner-Freigabe.
