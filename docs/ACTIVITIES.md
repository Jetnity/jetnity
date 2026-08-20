# Jetnity – Aktivitäten

**Stand:** 20. August 2026 · Phase 3.3  
**Gilt für:** die interne Aktivitätsdomäne, die tagesgebundene Suchpipeline, den Trip-Workspace und die serverseitige Vertrauensgrenze der `activity`-Übernahme.

Diese Datei beschreibt den **tatsächlichen** Aktivitätsweg. Produktprinzip: [JETNITY_VISION.md](../JETNITY_VISION.md) und [JETNITY_HANDOFF.md](../JETNITY_HANDOFF.md). Entscheidungen: ADR-0078 bis ADR-0085 in [DECISIONS.md](../DECISIONS.md).

---

## 1. Was Phase 3.3 ist – und was nicht

Eine Aktivität ist dann gut, wenn sie zur **konkreten Reise und zum konkreten Reisetag** passt – nicht als beliebige Ticketliste.

Gebaut:

- provider-unabhängige Aktivitätsdomäne
- Tageskontext nur aus vorhandenen Reisedaten
- deterministisches, provisionsneutrales Ranking
- reine Zeit-/Konfliktlogik für lokale `HH:MM` am selben Kalendertag
- geschlossene Suchpipeline und Client-Sicht
- Aktivitätsbereich im bestehenden Reise-Arbeitsbereich, wählbar je Reisetag
- Übernahme-Abbildung auf das bestehende `trip_items`-Schema (`kind = activity`)
- serverseitige Vertrauensgrenze: Konto-Übernahme nur über `ActivityNachweis`
- Reisegraph-Prüfung für Etappe, Tag und Timeslot
- API-Härtung von `POST /api/activities/search` (Content-Length, Stream-Cap 16 KB, Content-Type, `Retry-After`)
- `ActivityNachweis` gebunden an Ziel, Datum, Teilnehmer, Währung und den Timeslot der Option

Nicht gebaut:

- ein echter Activity-Provider oder Affiliate-/Booking-Deeplink
- ein produktiver Nachweis; `activityNachweisAusUmgebung()` gibt `null` zurück
- Production-Aktivitätensuche
- eine neue Migration
- Routing-/POI-/Öffnungszeitdaten
- Wegezeiten oder minutengenaue Lücken ohne belastbare Uhrzeiten
- eigene Aktivitätsbuchung
- ein globales, gespeichertes Rate-Limit

Keine Aktivität in der Oberfläche ist erfunden. Fixtures leben nur in Tests.

---

## 2. Schichten

```
Reise-Arbeitsbereich
  → POST /api/activities/search
    → Zod (untrusted input)
      → Tageskontext aus Etappe, Tag, vorhandenen Punkten
        → Zustand (Production, Kill Switch, fehlender Provider)
          → Rate-Limit
            → ActivityProvider.suchen()
              → Normalisierung + Jetnity-Kontext
                → Konfliktprüfung
                  → deterministisches Ranking
                    → Client-Sicht (ohne Score, ohne Rohdaten)
```

| Schicht | Datei | Aufgabe |
| --- | --- | --- |
| Domäne | `lib/activities/domain.ts` | Suchanfrage, Option, Timeslot, Evidenz, Status |
| Prüfung | `lib/activities/schema.ts` | Zod, untrusted input |
| Zeit | `lib/activities/zeit.ts` | lokale `HH:MM` und Kalenderdaten, ohne Zeitzone |
| Konflikt | `lib/activities/konflikt.ts` | Überschneidung nur bei vollständigen Tagesfenstern |
| Tageskontext | `lib/activities/tageskontext.ts` | nur vorhandene Reisedaten |
| Anreicherung | `lib/activities/anreichern.ts` | Interessen-/Zeit-/Preis-/Dauer-/Lage-Fit; unbekannt bleibt `null` |
| Interface | `lib/activities/provider.ts` | `ActivityProvider` – ein späterer Adapter ohne UI-Rewrite |
| Zustand | `lib/activities/zustand.ts` | Production aus, Kill Switch, ohne Provider unavailable |
| Ranking | `lib/activities/ranking.ts` | provisionsneutral, deterministisch, kein Modell |
| Orchestrierung | `lib/activities/suche.ts` | Kontext → Limit → Provider → Ranking |
| Client-Sicht | `lib/activities/client-sicht.ts` | keine Tokens, kein Score, keine Rohfelder |
| Übernahme | `lib/activities/uebernahme.ts` | nachgewiesene Option → kommerzieller `activity`-Planpunkt |
| Nachweis | `lib/activities/nachweis.ts` | Auswahlbestätigung gegen `ActivityNachweisKontext`, heute `null` |
| Reisegraph | `lib/activities/reisegraph.ts` | Etappe, Tag und Timeslot aus der Reise |
| Konto-Kern | `lib/activities/konto-uebernahme.ts` | identifiers + Nachweis + Graph, fail closed |
| Factory | `lib/activities/factory.ts` | Phase 3.3 gibt `null` zurück |

Die UI (`components/trips/AktivitaetenBereich.tsx`) spricht nur die interne Domäne.

---

## 3. Tageskontext statt isolierter Liste

Verbindliche Frage:

> Welche Aktivität passt zu genau diesem Reisetag?

Der Kontext nutzt nur belastbare Reisedaten:

- Etappenname, `place_id` und Koordinaten, soweit vorhanden
- konkreter Reisetag und Datum, falls vorhanden
- bereits eingeplante Punkte dieses Tages
- Start-/Endzeiten vorhandener Punkte, soweit vorhanden
- Reiseinteressen und Tempo
- Budget und Währung der Reise
- Teilnehmerzahl aus `trip.travellers`

Nicht erfunden:

- Öffnungszeiten
- Wegezeiten oder „5 Minuten entfernt“
- Nähe nur weil zwei Punkte in derselben Stadt liegen
- minutengenaue Lücken ohne konkrete Uhrzeiten

Ohne belastbare Daten bleibt die jeweilige Evidenz `false` bzw. der Fit `null`. Die UI darf daraus keine Scheingenauigkeit machen.

Lage-Fit entsteht nur bei Koordinaten von Option **und** Etappe. Die Distanz ist Luftlinie (`lib/hotels/geo.ts`), keine Wegezeit. Über 25 km gilt die Option nicht als Tagesort-Fit.

---

## 4. Ranking

Gewichte als benannte Konstanten (`ACTIVITY_RANGLISTE_GEWICHTE`), Summe 100:

| Faktor | Gewicht |
| --- | ---: |
| Interessen-Fit | 22 |
| zeitliche Passung / Konfliktfreiheit | 20 |
| Preis / Budget-Fit | 16 |
| Qualität / Bewertung | 14 |
| Evidenz / Bewertungsbasis | 8 |
| Flexibilität / Stornierbarkeit | 8 |
| Dauer-Fit zum Tempo | 8 |
| Lage-Fit (nur mit Koordinaten) | 4 |

Unbekannt bleibt unbekannt. Fehlende Signale bekommen **keinen** Neutralwert 0,5. Vorhandene Evidenz wird nur über bekannte Dimensionen gewichtet und renormalisiert.

Providername und Provision fliessen nicht ein. Der günstigste Preis ist nicht automatisch die Jetnity-Empfehlung.

Labels, nur mit Evidenz:

- `jetnity` – Jetnity empfiehlt
- `best_value` – Best Value (Preis und Bewertung müssen beide vorliegen)
- `best_rating` – Beste Bewertung
- `flexible` – Flexibel (nur bei belegter Stornierbarkeit)
- `compact` – Kurz und gut integrierbar (Dauer höchstens 120 Minuten, kein eindeutiger Zeitkonflikt)

Eine eindeutige Überschneidung wird im Ranking hinter konfliktfreien Optionen sortiert und trägt das sichtbare Label „Zeitkonflikt“. Die Client-Antwort enthält höchstens fünf Optionen. Interne Scores verlassen den Server nicht.

---

## 5. Konflikt- und Zeitlogik

Sicher beurteilbar in dieser Phase:

- zwei vollständige lokale `HH:MM`-Fenster am **selben** Kalendertag
- eindeutige Überschneidung: Start vor fremdem Ende und Ende nach fremdem Start

Nicht beurteilt, Ergebnis `unbekannt`:

- fehlende Start- oder Endzeit
- mehrtägige Optionen (`startsOn !== endsOn`)
- Fenster über Mitternacht (Ende vor oder gleich Start am selben Tag)
- Zeitzonen aus Ortskoordinaten
- Wegezeiten zwischen zwei Punkten

Fehlende Zeiten gelten **nicht** als konfliktfrei. Die Konstante `ACTIVITY_ZEIT_HINWEIS` hält diese Grenze fest.

---

## 6. Sicherheit und Kosten

- Nur serverseitig, geschlossener Endpunkt, kein Provider-Proxy
- Eingaben begrenzt: Teilnehmer 1–20, Timeout 12 s, max. 40 Providerangebote, Request höchstens 16 KB UTF-8
- `Content-Length` über dem Limit wird **vor** dem Lesen mit 413 abgewiesen. Der Body wird zusätzlich streamend mit hartem Byte-Cap gelesen; ein irreführendes `Content-Length` hilft nicht
- nur `application/json`; sonst 415. Zu gross: 413. Ungültiges JSON: 400
- Rate-Limit im Prozess: 8 Suchen / 10 min und 24 / Tag je IP-Kennung. Bei 429 setzt die Route `Retry-After`
- Die IP-Kennung ist **kein** Authentizitätsbeweis. Das In-Memory-Limit schützt nur Preview/Development
- Production hart aus (`VERCEL_ENV=production`), auch wenn `JETNITY_ACTIVITY_AKTIV` gesetzt ist
- `JETNITY_ACTIVITY_AKTIV` muss `true` oder `1` sein, **und** ein Provider muss existieren
- Phase 3.3 hat keinen Provider und keinen Nachweis; Suche und Konto-Übernahme sind `unavailable` / fail closed
- Client-Antwort ohne Score, Rohdaten, Secrets, Stacktraces oder Umgebungsdaten; `cache-control: no-store`
- keine `NEXT_PUBLIC_*`-Activity-Secrets
- keine kommerziellen Fakten aus dem Sprachmodell
- Tests rufen keinen echten Activity-Provider auf

---

## 7. Übernahme in die Reise

Ein später ausgewähltes Angebot wird als kommerzieller `trip_item` mit `kind = activity` gespeichert. Dafür reicht das bestehende Schema. **Keine neue Migration.**

### Konto

Der Browser darf nur `tripId`, `stageId`, `dayId` und `optionId` schicken. Kommerzielle Fakten (Preis, Provider, External-Ref, Timeslot, …) kommen **nicht** aus dem Request.

Die persistierte Momentaufnahme entsteht nur, wenn:

1. die Reise dem angemeldeten Konto gehört (RLS über `reiseLaden`)
2. Etappe und Tag zum Reisegraphen passen (`trip_days.stage_id`)
3. der Tag ein belastbares Datum hat, sobald die Option einen Timeslot trägt
4. ein serverseitiger `ActivityNachweis` die `optionId` **und** den erwarteten Kontext bestätigt

Der Nachweis-Kontext kommt nur aus dem Reisegraphen:

| Feld | Quelle |
| --- | --- |
| `destinationPlaceId` | kanonische `placeId` der Etappe, sonst `stage:{etappenId}` – kein Client-Ortsname |
| `dayDate` | Datum des gewählten Reisetags |
| `participants` | `trip.travellers` |
| `currency` | `trip.currency` |
| `timeslot` | Timeslot der nachgewiesenen Option, nicht aus dem Browser |

Eine Option, die zu einem anderen Ziel, Datum, einer anderen Teilnehmerzahl oder Währung gehört, wird als `geaendert` abgelehnt. Trägt die Option einen Timeslot, muss er zum Tag passen; sonst `timeslot-tag`.

Heute gibt es keinen Nachweis. Eine authentifizierte, selbst gebaute Server-Action speichert deshalb keinen erfundenen `activity`. Tests dürfen einen Fake-Katalog injizieren.

`ActivityNachweis` ist bewusst getrennt von `ActivityProvider.suchen()`. Der spätere Suchadapter oder ein Jetnity-eigener serverseitiger Nachweis implementiert diese Naht. Search-Provider und Affiliate-/Booking-Partner müssen nicht identisch sein. Keine Secret-Signatur.

### Gast

LocalStorage ist vom Nutzer manipulierbar. Die Oberfläche übernimmt nur Optionen aus der letzten Jetnity-Suche. **Gastdaten sind nicht serverseitig verifiziert.**

Gespeicherte Momentaufnahme:

| Feld | Inhalt |
| --- | --- |
| `title` | Aktivitätsname |
| `note` | Ort, Dauer, Bewertung, Storno, Termin, Preis – nur gelieferte Fakten |
| `starts_on` / `starts_at` | Timeslot oder, ohne Timeslot, das Tagesdatum ohne Uhrzeit |
| `ends_on` / `ends_at` | Timeslot-Ende, sonst `null` |
| `price_amount` / `price_currency` | Preis der Option; beide zusammen oder beide leer |
| `provider` / `external_ref` | Suchanbieter und dessen Angebots-ID |
| `booking_url` | immer `null` |
| `stage_id` / `day_id` | Etappe und Tag der Aktivität |

Was niemals aus dem Modell stammen darf: Preis, Währung, Provider, External-Ref, Booking-URL, Bewertung, Storno, Verfügbarkeit, Timeslot.

Spätere Preis- oder Verfügbarkeitsänderungen ändern die gespeicherte Zeile nicht still. Modelloperationen dürfen kommerzielle `activity`-Punkte nicht verändern (`istKommerziell` – gemeinsamer Schutz mit Flug und Hotel).

---

## 8. Oberfläche

Im bestehenden Trip Workspace, nicht als Demo:

- ein Aktivitätsbereich für die Reise, Tagwahl über Chips
- belegbarer Tageskontext (Etappe, Datum, bereits geplante Punkte) auch ohne Provider
- Loading / Empty / Unavailable / Timeout / Error / Rate-Limit als getrennte Zustände
- `unavailable` ruhig, nicht als Fehler der Reise
- Aktivitätskarten nur bei echten Optionen
- mobile-first, 44 px Trefferflächen, Status über `aria-*` / `role`
- Requests per `AbortController` abbrechbar beim Tagwechsel; keine Fake-Karten

Solange kein Provider konfiguriert ist, erklärt die Fläche das ehrlich und zeigt höchstens den belegbaren Tageskontext aus der Reise.

### Browser-Abnahme (Phase 3.3b)

Gemessen mit `npm run audit:activities` (Playwright WebKit + Chromium, PR-7-Regeln). Die Audit-Seite `/ui-audit/activities` antwortet ohne `JETNITY_UI_AUDIT=1` mit 404 und liegt nicht im produktiven Weg. Karten-Fixtures nur im Harness per Request-Interception.

| Messung | Umfang | Ergebnis |
| --- | --- | --- |
| Layout, 13 Zustände × 7 Viewports × 2 Engines | 182 | 0 Fehler |
| Tagwechsel, Fokus, Tastatur, Request-Zählung | 2 (WebKit + Chromium, 390 px) | 0 Fehler |
| Summe | **184** | **0** |

Viewports: 280, 320, 360, 390, 430, Landscape 667×375 und 844×390.

Zustände: keine Tage, Tag ohne Etappe, leerer Tag, Tag mit Punkten/Uhrzeiten, 12 Tag-Chips, lange Texte, Loading, reales `unavailable` ohne Provider, Empty, Error, Timeout, Rate-Limit, Karten mit langen Providerinhalten.

Interaktion: 4 Suchen je Engine beim schnellen Chipwechsel, keine Schleife. Nach dem Wechsel bleibt nur die Antwort des gewählten Tags. `aria-checked` stimmt. Fokus über `:focus-visible` nach Tastatur-Tab. Interne Scores nicht im DOM.

Bekannte Ausnahme wie bei PR #7: Die Chip-Zeile darf intern waagrecht scrollen (`ScrollRow`). Die Seite selbst hat kein Overflow. Programmatisches `.focus()` ohne Tastatur zeigt keinen Ring – das ist `focus-visible`, kein Defekt.

---

## 9. Aktivierung (später, nicht jetzt)

1. Genau einen Activity-Datenanbieter entscheiden (eigene Freigabe). GetYourGuide ist eine mögliche Quelle, keine festgelegte Architektur.
2. Adapter gegen `ActivityProvider` und `ActivityNachweis` bauen. Keine Booking-URL erfinden.
3. `JETNITY_ACTIVITY_AKTIV=true` nur in Development/Preview.
4. Niemals Production, kein Live-Token ohne eigene Freigabe.

---

## 10. Weiterhin offen

1. Genau einen ersten Activity-Datenanbieter entscheiden und `ActivityProvider` plus `ActivityNachweis` implementieren · **eigene Freigabe**
2. Preview mit echtem Provider-Key verifizieren
3. Affiliate-/Redirect-Pfad, getrennt von der Suche
4. Globales/gespeichertes Rate-Limit, bevor Production überhaupt zur Debatte steht
5. Reale Routing-/POI-/Öffnungszeitdaten, soweit später fachlich nötig
6. Production-Aktivierung nur nach separater Freigabe
