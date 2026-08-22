# Cursor-Auftrag – PR #32 Human Review Fixes

Stand: 22. August 2026  
Branch: `feat/travel-readiness-foundation`  
PR: `#32 – Foundation C – Travel Readiness & Dokumente`  
Ausgangs-Head des Reviews: `57d6c4d857e817e3242e1a1684dff0818bd475b6`

## Status

Foundation C ist funktional weit fortgeschritten, CI und Preview sind grün. Der PR bleibt dennoch **Draft**. Vor `Mark Ready` müssen die folgenden Human-/Architecture-Review-Punkte behoben werden.

Dieser Auftrag ist verbindlich. Bestehende Arbeit nicht verwerfen, sondern gezielt korrigieren. Keine Production-Migration, kein echter Provider, kein Timatic-Vertrag.

---

## 1. Provider-API muss wirklich provider-ready sein

Aktuell verwendet `POST /api/readiness/requirements` die Legacy-Hülle `officialRequirementsPruefen()`. Diese gibt nur ein einzelnes `OfficialRequirementEvidence` zurück und zwingt das `result` weiterhin auf `unknown`.

Damit könnte selbst nach späterer Provider-Anbindung die API nicht die neue strukturierte Domain vollständig ausgeben.

### Fix

Die API muss die **provider-neutrale strukturierte Evaluation** aus der neuen Requirements Engine liefern können, mindestens pro:

- Traveller
- Destination
- Transit
- Requirement Type.

Ohne Provider bleibt jede Evaluation fail-closed bei `unknown` / `provider_unavailable` / `insufficient_context`.

Die Antwort darf keine Browser-/LLM-Behauptung übernehmen.

Falls Legacy-Kompatibilität benötigt wird, separat und ausdrücklich dokumentieren; die neue API-Antwort darf nicht auf einen einzelnen ersten Treffer reduziert werden.

### Tests

Mindestens:

- 2 Traveller × 2 Destinationen → getrennte strukturierte Evaluations
- mehrere Requirement Types sichtbar
- ohne Provider alles unknown/fail closed
- injizierter Testprovider kann strukturierte required/not_required/conditional Resultate liefern
- kein erster-Treffer-Collapse.

---

## 2. Official Evidence vor required/not_required/conditional streng validieren

In `engine.ts` kann eine Provider-Zeile derzeit ein offizielles Resultat setzen, obwohl wichtige Evidence-Felder fehlen oder ungültig sind. Besonders `checkedAt` kann fehlen; `sourceUrl` oder `authority` können ebenfalls fehlen, während das Resultat trotzdem `required`/`not_required`/`conditional` bleiben kann.

Das widerspricht dem Truth-Prinzip: regulatorische Aussagen brauchen belastbare Provider-Evidence.

### Fix

Definiere eine klare Trust-Grenze für Provider-Evidence.

Bevor ein Provider-Resultat als `required`, `not_required` oder `conditional` akzeptiert wird, müssen mindestens die im Automations-Auftrag als verpflichtend definierten Evidence-Fakten sauber validiert sein. Mindestens:

- Provider-Identität
- `checkedAt` als gültiger Zeitstempel
- Authority/Source entsprechend der Domainentscheidung
- sichere/validierte Source URL, wenn die Domain sie für belastbare Evidence voraussetzt
- gültige Destination-/Traveller-Zuordnung
- Context-Fingerprint passend zur aktuellen Anfrage.

Fehlt belastbare Evidence, **fail closed**:

- `result = unknown`
- Status/Freshness passend zu `unknown` / `never_checked` / `recheck_needed` / anderer ehrlicher Semantik
- keine Official Action.

Keine Scheinsicherheit durch Testprovider.

### Tests

- `required` ohne checkedAt → unknown
- invalid checkedAt → unknown
- required mit ungültiger Source URL → keine belastbare Official Action und gemäß Trust-Regel kein fälschlich bestätigtes Resultat
- vollständige valide Evidence → Resultat darf übernommen werden
- temporär unavailable → unknown.

---

## 3. Multi-Transit darf nicht auf eine Provider-Zeile kollabieren

In `requirementsAuswerten()` wird derzeit pro Traveller/Destination/Requirement Type mit `.find()` genau eine Provider-Zeile ausgewählt.

Wenn ein Provider für dieselbe Destination mehrere Transitländer liefert, z. B.:

`Zürich → Doha → Singapur → Bangkok`

und sowohl Qatar als auch Singapur eigene Transit-Requirements haben, kann aktuell nur eine Zeile übernommen werden.

Die spätere Dedupe-Key-Logik enthält zwar `transitCountryCode`, aber die Auswahl davor kollabiert die Daten bereits.

### Fix

Transit-Evaluations müssen vollständig pro relevantem Transitland erhalten bleiben.

- keine `.find()`-Reduktion, wenn mehrere fachlich verschiedene Provider-Zeilen gültig sind
- deterministische Deduplizierung
- keine Vermischung von Destination- und Transit-Scope
- Fingerprint muss den konkreten Transitkontext korrekt abbilden.

### Tests

Mindestens:

- zwei Transitländer → zwei getrennte Transit-Evaluations
- unterschiedliche Resultate pro Transitland bleiben getrennt
- kein Duplikat bei identischer Provider-Zeile
- Multi-Country + Multi-Transit Kombination.

---

## 4. Provider muss `insufficient_context` / `missingFacts` ausdrücken können

Die Foundation verspricht progressive Missing-Facts-Logik. Der aktuelle Provider-Port kann aber nur Requirement-Zeilen mit Resultat liefern; provider-spezifische fehlende Fakten kann er nicht strukturiert zurückgeben.

Die Engine selbst fordert aktuell nur einen festen Teil der Fakten. Ein späterer echter Provider kann aber je Regel zusätzlich z. B. benötigen:

- residence
- document_type
- document_issuing_country
- document_expiry
- origin_country
- transit_itinerary
- weitere künftig bewusst freigegebene strukturierte Fakten.

### Fix

Erweitere die provider-neutrale Schnittstelle so, dass ein Provider eine Evaluation ehrlich als `insufficient_context` mit strukturierten `missingFacts` zurückgeben kann.

Jetnity soll diese Missing Facts in die bestehende progressive UX übernehmen können, ohne freie Providertexte als Truth zu verwenden.

`origin_country` ist bereits als MissingFact definiert, wird aktuell aber praktisch nicht verwendet. Die Semantik muss konsistent sein.

Keine pauschale Pflicht aller Traveller-Felder für jede Regel; nur tatsächlich notwendige Fakten anfordern.

### Tests

- Provider fordert `residence` → UI/Domain erkennt genau diesen fehlenden Fakt
- Provider fordert `document_expiry` → kein required/not_required bis vorhanden
- origin_country / transit_itinerary können strukturiert fehlen
- bekannte Fakten werden nicht erneut verlangt.

---

## 5. UI darf Provider-Verfügbarkeit nicht hartcodieren

`Reisevorbereitung.tsx` und `readinessZusammenfassungText()` schreiben aktuell sinngemäß immer:

`Automatische Einreiseprüfung derzeit nicht verfügbar.`

Das ist heute korrekt, wäre nach späterer Provider-Anbindung aber falsch. Damit wäre die Foundation nicht ohne UI-Umbau provider-ready.

### Fix

Copy ausschließlich aus tatsächlichem Official Status/Freshness ableiten.

Mindestens unterscheiden:

- provider_unavailable
- insufficient_context
- current
- recheck_needed
- stale
- source_temporarily_unavailable.

Wenn Provider-Evidence current ist, darf die UI nicht weiterhin „nicht verfügbar“ behaupten.

Keine globale „Reise bereit“-Erfolgssprache, solange relevante unbekannte Anforderungen existieren.

### Tests / UI Audit

- Provider unavailable → bisherige ehrliche Meldung
- Missing Facts → gezielte Aufforderung statt „Provider nicht verfügbar“
- current Evidence → keine unavailable-Meldung
- stale/recheck → erneut prüfen
- temporär unavailable → Quelle derzeit nicht erreichbar.

---

## 6. Strukturierter Origin-/Transit-Kontext als dokumentierte Abhängigkeit

`readinessReisekontext()` setzt `originCountryCode: null` und `transitCountryCodes: []`, weil der aktuelle Reisegraph diese Informationen nicht belastbar strukturiert liefert. Das ist korrekt fail-closed und darf **nicht** durch Ortsnamen-Raten ersetzt werden.

Aber die automatische Produktvision verlangt später echte Route-/Transit-Prüfung.

### Fix / Entscheidung

In diesem Review entweder:

A. eine kleine saubere strukturierte Route-Facts-Naht ergänzen, falls sie ohne Architekturbruch möglich ist,

oder

B. ausdrücklich und dauerhaft als nächste technische Provider-/Route-Abhängigkeit dokumentieren, inklusive genauer Stelle, welche strukturierten Fakten später aus Flight/Itinerary-Daten in `RequirementsAnfrage` fließen müssen.

Keine Ableitung aus freiem Titel/Ortsnamen.

Die Foundation darf nicht so dokumentiert werden, als sei automatische Transit-Erkennung aus dem aktuellen Tripgraph bereits vollständig vorhanden, wenn sie faktisch noch `[]` liefert.

---

## 7. Verifikation nach Fix

Nach den Korrekturen erneut vollständig:

- `npm test`
- Typecheck
- Lint
- Hygiene Checks
- Production Build
- Auth Config
- relevante DB/RLS/Security Checks, falls Schema/DB-Code berührt wird
- WebKit Workspace Audit
- Chromium Workspace Audit
- Activities Regression
- GitHub CI
- Vercel Preview.

Jeder gefundene Logic-Bug bekommt einen Regressionstest.

Dokumentation/Handoff/Roadmap müssen den neuen Head und die tatsächlichen Grenzen widerspiegeln.

---

## Harte Grenzen

- PR bleibt Draft
- nicht `Mark Ready`
- nicht mergen
- keine Production-Migration
- kein echter Provider
- kein Timatic-Vertrag
- keine neuen Secrets
- keine Fake-Regeln
- kein LLM als regulatorische Quelle.

Am Ende klar berichten:

1. welche Review-Blocker behoben wurden
2. welche Tests neu hinzugekommen sind
3. genaue Test-/Audit-Zahlen
4. finaler Head
5. CI/Preview
6. ob strukturierter Origin-/Transit-Kontext umgesetzt oder bewusst als nächste Abhängigkeit dokumentiert wurde
7. verbleibende Risiken.