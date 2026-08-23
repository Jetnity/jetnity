# PR #38 – ChatGPT Independent Re-Review R7

Stand: 23. August 2026  
Status: **REQUEST CHANGES – R6-Blocker 12 geschlossen; neuer Cross-Domain Merge-Blocker 13 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Main bei R7: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Geprüfter Runtime-Head: `e790a7d224473df2cf999fe7c058a81a5a8e8679`  
R6-Docs-Lock: `1f00101c89cfdd89025884f09406ac526779b495`  
Sync beim R7-Lock: **32 ahead, 0 behind** `main` auf Runtime; PR-Head danach 33 ahead durch Docs-Lock  
PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 1. R7-Urteil

Der unabhängige R7-Closure-Review wurde nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`, dem R6-Stop-Kriterium und der verbindlichen Cross-Domain-Interoperabilitätsregel durchgeführt.

Bestätigt:

- Merge-Blocker 12 ist auf Runtime `e790a7d2` geschlossen.
- `airportContacts` werden jetzt kanonisch in Foundation D erzeugt.
- Getrennte Flight-Items bleiben getrennte Airport-Kontakte.
- Getrennte Legs innerhalb einer Itinerary bleiben getrennte Airport-Kontakte.
- Ein echter Transit innerhalb desselben Legs bleibt ein Layover-Kontakt.
- Seasonal und Safety lesen dieselbe Foundation-D-Kontaktliste; keine zweite Pairing-Wahrheit.
- R6 Exact-Head CI ist auf exakt `e790a7d2` **SUCCESS** (Actions `32650192906`).
- Vercel Preview `dpl_EBQSg5et1wbvKMyvc8ppRfUnRDsX` ist **READY** auf exakt `e790a7d2`.
- Docs-Lock `1f00101c` ist CI-seitig **SUCCESS** und Vercel **READY**; Diff `e790a7d2 → 1f00101c` ist dokumentations-only.
- Keine Seasonal-DB-Migration, kein Live-Provider, keine Secrets, keine neuen laufenden Kosten.

Es gibt trotzdem noch **kein Closure/PASS**. Der Cross-Domain-Abgleich der jetzt ausdrücklich leg-bewussten Route-Topologie zeigt einen konkreten Route-/Readiness-Truth-Defekt: Länderrollen werden weiterhin über Leg-Grenzen hinweg abgeflacht.

---

## 2. Merge-Blocker 13 – Multi-Leg / Roundtrip verliert Ziel-/Transit-Semantik über Leg-Grenzen

### Betroffene Naht

- `lib/route/ableitung.ts`
- `lib/flights/domain.ts` (`FlugTeilstrecke` = zusammenhängende Verbindung, z. B. Hinflug oder Rückflug)
- `lib/readiness/kontext.ts`
- indirekt Readiness-Fingerprints / spätere Official-Provider-Requests
- indirekt Seasonal/Safety dort, wo `transitCountryCodes` / `destinationCountryCodes` Teil der gemeinsamen Route Truth sind

### Verbindliche Semantik

Die Flugdomäne definiert ein `leg` / `FlugTeilstrecke` ausdrücklich als **eine zusammenhängende Verbindung, etwa Hinflug oder Rückflug**. Damit sind Leg-Grenzen fachliche Source-of-Truth-Grenzen.

Ein Land am Ende eines Hin-Legs ist ein belegtes Ziel dieses Legs und darf nicht allein deshalb zum Transitland werden, weil ein späteres Rück-Leg in derselben Itinerary existiert.

### Direkt code-abgeleiteter Repro – Roundtrip in einer Itinerary

Die bereits für Blocker 12 vorhandene Fixture `bangkokGetrennteLegsReise()` enthält exakt:

- Leg 1: `ZRH (CH) → BKK (TH)` am 12./13.09.
- Aufenthalt in Bangkok
- Leg 2: `BKK (TH) → ZRH (CH)` am 20./21.09.

`transitlaenderAus()` macht aktuell pro Itinerary:

```ts
const segmente = segmenteAusItinerary(eintrag.itinerary)
for (const [index, segment] of segmente.entries()) {
  if (index === segmente.length - 1) continue
  merken(laender, segment.destination.countryCode)
}
```

`segmenteAusItinerary()` flacht alle Legs ab. Für den Roundtrip entsteht:

```text
[ ZRH→BKK, BKK→ZRH ]
```

Damit wird beim ersten Segment `TH` als **Transitland** gespeichert, obwohl BKK das Ziel des Hin-Legs und die tatsächliche Reiseetappe ist.

`ziellaenderAus()` flacht dieselben Legs ebenfalls ab und betrachtet nur Anfang und Ende der gesamten Itinerary:

```ts
start = CH
ende = CH
```

Da `ende === start`, wird `TH` aus `destinationCountryCodes` vollständig verloren.

Das Ergebnis der gemeinsamen Route Truth ist damit sinngemäß:

```text
transitCountryCodes = ['TH']
destinationCountryCodes = []
```

für eine Reise, deren belegtes Hinflugziel Thailand ist.

### Zweiter Repro – getrennte Hin-/Rückflug-Items

Bei zwei separaten Flight-Items:

1. `ZRH (CH) → BKK (TH)`
2. `BKK (TH) → ZRH (CH)`

berechnet `ziellaenderAus()` jedes Itinerary isoliert. Dadurch können sowohl `TH` als auch das Rückkehrland `CH` als `destinationCountryCodes` erscheinen.

Readiness ergänzt `route.destinationCountryCodes` zu seinen Zielstaaten. Damit kann das Rückkehr-/Origin-Land als zusätzliches Reiseziel in Entry-/Visa-/Document-Kontext einfließen.

### Warum merge-blocking

- Es ist ein konkreter Source-of-Truth-Fehler, kein UI-/Stilproblem.
- Derselbe Tripgraph, dessen Leg-Grenzen Blocker 12 jetzt korrekt für Airport-Zeitkontakte respektiert, respektiert sie bei Länderrollen noch nicht.
- Readiness konsumiert `destinationCountryCodes` und `transitCountryCodes` aus derselben Foundation-D-Ableitung.
- Falsche Transit-/Destination-Rollen sind besonders kritisch für spätere Visa-/Transit-/Entry-Provider, weil regulatorische Anforderungen genau von dieser Rolle abhängen können.
- Die verbindliche Jetnity-Regel verlangt, dass fachlich abhängige Funktionen über dieselbe kanonische Wahrheit korrekt zusammenspielen.

### Erforderliche Korrektur

Die Route-Länderprojektion muss leg-bewusst werden, ohne neue Heuristik:

1. **Transitländer** nur aus echten Zwischen-Segmenten **innerhalb desselben Legs** ableiten; das letzte Segmentziel jedes Legs ist nicht automatisch Transit.
2. **Zielstaaten** aus belegten Leg-Endpunkten ableiten, aber das globale ursprüngliche Origin-/Rückkehrland nicht allein wegen des Rück-Legs als neues Reiseziel materialisieren.
3. Multi-City muss erhalten bleiben: z. B. `CH→TH`, `TH→SG`, `SG→CH` muss `TH` und `SG` als belegte Reiseziele tragen, nicht als Transits; echtes `DOH` innerhalb eines Legs bleibt Transit.
4. Keine Ableitung aus Titeln/Notizen/LLM-Feldern.
5. Guest/Account und Flight-Item-Reihenfolge müssen dieselbe kanonische Länderrollen-Wahrheit liefern.
6. Bestehende Route-Fingerprints/Stale-Logik nur fachlich korrekt verändern; keine stillen Datenverluste.

### Pflicht-Regressionen

Mindestens:

1. Roundtrip in **einer Itinerary mit zwei Legs** `CH→TH` / `TH→CH`:
   - `TH` **nicht** in `transitCountryCodes`
   - `TH` in `destinationCountryCodes`
   - Rückkehrland `CH` nicht als zusätzliches Reiseziel.
2. Derselbe Roundtrip als **zwei separate Flight-Items** liefert dieselben Länderrollen.
3. Multi-City `CH→TH`, `TH→SG`, `SG→CH`:
   - `TH` und `SG` als Ziele
   - keines davon allein wegen Leg-Grenzen als Transit.
4. Echter Transit innerhalb eines Legs `CH→QA→TH`:
   - `QA` Transit
   - `TH` Ziel.
5. Roundtrip mit echtem Transit pro Richtung behält echte Transitländer und verwechselt Leg-Ziele nicht.
6. `readinessReisekontext()` erhält für Roundtrip die korrekten `destinationCountries` und `transitCountryCodes`.
7. Guest/Account-Parität.
8. Flight-Item-/Graph-Reihenfolge ändert die kanonische Rollenmenge nicht.
9. Blocker-12-Airport-Kontaktregressionen bleiben grün.
10. Safety-/Seasonal-/Readiness-Regressionen, die Foundation-D-Route Truth konsumieren, bleiben grün.

---

## 3. R7 bestätigt ausdrücklich als geschlossen

- Erst-Review-Blocker 1–4
- R2 Blocker 5–6
- R3 Blocker 7 / rejected-acute-Restpfad
- R4 Blocker 8–9
- R5 Blocker 10–11
- R6 Blocker 12 – getrennte Airport-Besuche / Leg-Grenzen

R7 eröffnet **nur Blocker 13**.

---

## 4. R7 Stop-Kriterium / nächster Schritt

Cursor soll ausschließlich Merge-Blocker 13 schließen und die oben genannten Cross-Domain-Regressionen ergänzen. Kein zusätzlicher Produktumbau.

Danach vollständiges Exact-Head-Gate auf dem neuen Runtime-Head und unabhängiger R8-Closure-Check.

Beim R8 gilt das Stop-Kriterium strikt: Wenn kein neuer konkret reproduzierbarer oder direkt code-abgeleiteter Defekt mit relevantem Einfluss auf Truth, Provider-Port, Security, Source-of-Truth, Cross-Domain-Interoperabilität, Release oder zentrale Foundation-Funktionalität verbleibt, soll der technische Closure/PASS erfolgen. Keine theoretische Perfektionsschleife.

PR #38 bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.
