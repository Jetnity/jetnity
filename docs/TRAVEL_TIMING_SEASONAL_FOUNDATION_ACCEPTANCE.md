# Travel Timing & Seasonal Intelligence – Foundation Acceptance

Stand: 23. August 2026  
Status: **verbindliche Acceptance für die provider-neutrale Foundation – Implementierung gestartet, noch nicht erfüllt**

Policy: `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`  
Ist-Audit: `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ARCHITECTURE_AUDIT.md`

---

## 1. Produktgrenze / Definition of Done

Die Foundation ist erst technisch reviewbereit, wenn Jetnity eine provider-neutrale Seasonal-Evaluation vollständig modellieren, validieren, deterministisch bewerten und im Trip Workspace minimal darstellen kann, **ohne echten Provider und ohne erfundene saisonale Wahrheit**.

Nicht Teil dieses Blocks:

- echter Climate-/Weather-/Seasonal-Provider
- Live-Secrets
- echte Production-Aussagen über konkrete Saisonlagen
- automatisches Ändern von Ziel oder Reisedatum
- persistiertes `Trotzdem so planen`
- großer `Jetzt wichtig`-/Workspace-Umbau
- Provider-backed Preis-/Crowding-/Verfügbarkeitsoptimierung

---

## 2. Harte Truth-Anforderungen

### A. Eigene Domain

- eigene Domain unter `lib/seasonal/`
- keine Umdeutung von `SafetyEvaluation`
- Safety bleibt für acute/active warnings zuständig
- Seasonal bleibt für wiederkehrende/historische/offizielle Seasonal Windows und geeignete Forecast-Outlooks zuständig
- `active_warning` / akute Event-Truth darf Seasonal nicht als Seasonal-Hinweis anzeigen
- `seasonal_pattern` darf Safety weiterhin nicht als Safety-Warnung anzeigen

### B. Source-/Evidence-Klassen

Mindestens getrennt modelliert:

- `seasonal_pattern`
- `official_seasonal_risk_window`
- `forecast_outlook`
- akute Warnung/Event als nicht zulässige Seasonal-Klasse / Weiterleitung an Safety-Grenze

Evidence trennt:

- provider/source/authority
- source URL
- published/updated/checked
- `freshUntil` oder gleichwertige belastbare Freshness-Semantik
- historische/reference period
- travel applicability window

Keine Vermischung von Reference Period, Travel Window und Freshness.

### C. Recurring Window

- jährliches wiederkehrendes Fenster kann Month/Day-basiert modelliert werden
- Jahreswechsel funktioniert (`11-01` → `03-31`)
- mehrere berührte Reisejahre werden korrekt projiziert
- ungültige Month/Day-Werte fail-closed
- Leap-Day-Fälle sind deterministisch und getestet
- absolute Fenster sind getrennt von jährlich wiederkehrenden Fenstern

### D. Geo

- country/admin region/city/place/point/airport/route nur soweit source-backed
- feinere Quelle wird nicht auf ganzes Land hochgestuft
- fehlende Membership/Koordinaten → `insufficient_context`
- title-only Items erzeugen keine Geo-Truth
- Route-/Airport-Truth nur aus Foundation D

### E. Zeit / Zeitzone

- Date-only bleibt lokaler/zonenloser Kalendertag
- Foundation-D-Ortszeit bleibt ohne erfundene Zeitzone
- kein stilles `Z`
- Date/clock ↔ UTC-Instant innerhalb unsicherer globaler Offset-Hülle → `insufficient_context`
- wiederholte Routekontakte bleiben einzelne Fenster

### F. Ergebnis-Semantik

Mindestens:

- Relevanz: `applies`, `not_applies`, `insufficient_context`, `unknown`
- Präsentation: `timing_check`, `timing_notice`, `information`, `unknown`
- source-backed Outcome: `less_favorable`, `mixed_tradeoff`, `favorable_context`, `unknown` oder fachlich gleichwertig

Keine pauschale Ableitung `schlecht`, `gefährlich`, `ungeeignet`.

---

## 3. Provider-Port / Failure Semantics

- eigener `SeasonalProvider`-Port
- Production/Preview Factory bleibt `null`
- Test-Doubles dürfen injiziert werden
- Provider Request enthält nur kanonische Trip-/Stage-/Route-/Datums-Facts
- keine unnötigen Citizenship-/Document-Daten im Foundation-Port
- Provider Timeout mit AbortSignal
- Throw, Timeout, unavailable, malformed, partial malformed und conflict jeweils explizit fail-closed
- `[]` von einem erfolgreich geprüften Provider ist **nicht** automatisch Provider unavailable
- teilweise ungültige Antwort darf niemals `clean` / `favorable` durch Weglassen ungültiger Zeilen erzeugen
- widersprüchliche semantische Duplikate sind order-independent und erzeugen kein clean/favorable Ergebnis
- reine URL-/Evidence-Metadaten-Differenz ohne Outcome-Konflikt soll nicht automatisch semantischer Konflikt sein
- max Facts / Payload Limits deterministisch

---

## 4. Fingerprints / Neubewertung

Seasonal Context-Fingerprint ändert sich mindestens bei relevanter Änderung von:

- Trip start/end
- Stage country/place/geo/dates
- relevantem Route-Fingerprint / Routekontakt
- planrelevanten Item-Refs, soweit Impact davon abhängt

Event/Fact-Fingerprint enthält alle decision-relevanten normalisierten Seasonal-Felder.

Array-/Provider-Reihenfolge darf Fingerprint/Ergebnis nicht verändern.

Änderung von Ziel oder Datum führt zu anderer/neu zu prüfender Evaluation.

---

## 5. Cross-Domain Impact

Konservative Ableitung möglich auf:

- stage
- flight/route
- stay
- activity
- mobility/transfer
- rental car
- day plan

Ein konkretes Item darf nur `affected`/direkt betroffen sein, wenn Stage/Day/Route/Geo-Beziehung belegbar ist. Sonst `needs_recheck`/`unknown`.

Keine erfundenen Preise, Verfügbarkeiten, Öffnungszeiten oder Ausfälle.

---

## 6. API / Security

`POST /api/seasonal/evaluate` oder fachlich gleichwertige geschlossene Servernaht:

- nur `application/json`
- harter UTF-8-Payload-Byteschutz
- strict runtime schema
- serverseitige Providergrenze
- `Cache-Control: private, no-store`
- rate limit mindestens analog Safety für Preview/Dev
- keine Provider-Rohdaten / Secrets im Client
- Browser-/LLM-Felder dürfen keine Evidence setzen
- Response unterscheidet `ok`, `unknown`, `unavailable` fachlich ehrlich
- unknown/unavailable enthält keine Entwarnungs- oder `gute Reisezeit`-Copy

Keine neue offene oder ungeschützte API.

---

## 7. Workspace / UX

- optionale `seasonalEvaluations`-Naht für Guest und Account
- keine permanente leere Seasonal-Karte ohne Evaluation
- relevante Evaluation kann in ruhiger, klarer Karte erscheinen
- klare Abgrenzung zu `Sicherheit & Störungen`
- Copy erklärt typischen/saisonalen Kontext, nicht exakte Vorhersage
- Quelle + Aktualität/Reference Period progressiv sichtbar
- keine automatische Reiseänderung
- keine toten Buttons / nicht funktionierenden Aktionen
- großer `Jetzt wichtig`-Umbau wird nicht vorgezogen
- responsive / touch / keyboard / text scaling darf durch die Erweiterung nicht regressieren

---

## 8. Pflicht-Testmatrix

Mindestens folgende fachliche Fälle als automatisierte Tests:

1. kein Provider → honest unavailable, keine Seasonal-Behauptung
2. Provider timeout / throw → fail-closed
3. erfolgreicher Provider `[]` → checked-empty/neutral, nicht unavailable, keine Garantie-Copy
4. malformed whole response → unknown
5. gemischte valide + malformed Facts → incomplete/unknown guard, kein clean/favorable by omission
6. gleiche Facts in anderer Reihenfolge → identisches Ergebnis/Fingerprint
7. semantischer Conflict → unknown/recheck, kein winner/clean
8. November–März recurring window trifft Dezember/Januar korrekt
9. recurring window trifft nicht außerhalb
10. leap-day valid/invalid deterministisch
11. Reisedatum über Jahreswechsel
12. gleiche saisonale Kategorie, andere Region im selben Land → keine pauschale Betroffenheit
13. feinere Region ohne belegte Membership → insufficient_context
14. country-level fact + passende Stage → applies
15. title-only Activity/Stay → keine erfundene Geo-Betroffenheit
16. Route/Transit nur aus Foundation-D-Routefacts
17. wiederholter Airport/Ort mit getrennten Kontakten → keine Min/Max-Verschmelzung
18. Date-only ↔ UTC instant → keine erfundene UTC-Tagesgrenze
19. lokale `HH:mm` ↔ UTC instant → keine erfundene Zeitzone
20. `active_warning` im Seasonal-Port → nicht als Seasonal-Hinweis anzeigen
21. `seasonal_pattern` bleibt in Safety weiterhin ausgeschlossen
22. stale/recheck-needed → keine current/clean/favorable Copy
23. fehlende Freshness-Semantik → nicht `current`
24. Reference Period wird nicht als Travel Window interpretiert
25. Datumsänderung verändert Context-Fingerprint
26. Ziel-/Stageänderung verändert Context-Fingerprint
27. Item-/Impact-Beziehung: passendes Activity-Item konservativ betroffen/needs_recheck
28. nicht passendes Item nicht betroffen
29. Guest und Account identischer Trip-Graph → identische fachliche Seasonal-Evaluation
30. keine Citizenship-Pflicht / kein Citizenship-Fingerprint für traveller-neutrale Seasonal-Facts
31. mehrere Destinationen mit unterschiedlichen Saisonlagen werden separat bewertet
32. Nutzerentscheidung wird nicht automatisch simuliert oder Reise verändert

Policy-Audit-Szenarien zusätzlich abdecken:

- Monsunzeit
- offizielle Hurrikan-/Zyklonsaison ohne aktive Warnung
- aktive Warnung zusätzlich zum saisonalen Kontext bleibt Safety-separat
- Region unterscheidet sich vom restlichen Land
- fehlende/widersprüchliche Daten

---

## 9. Regression / Full Gate

Vor Review auf **exakt finalem Runtime-Head**:

- `npm test` komplett grün (Baseline vor Block: 1481/1481)
- Typecheck grün
- Lint grün
- Hygiene/exports/dead/deps/API-Schutz/schema-bezug grün, soweit vorhandene Repo-Scripts
- Production build vollständig grün
- bestehende DB-/RLS-/Security-/Parallelitäts-Gates unverändert grün
- Trip Workspace UI audit WebKit + Chromium / 8 Viewports, 0 Fehler
- neue Seasonal-Zustände in UI-Audit aufnehmen
- Safety Regression-Suite vollständig grün
- Branch **0 behind** aktuellem `origin/main`
- GitHub Actions SUCCESS auf exakt finalem Head
- Vercel Preview READY/SUCCESS auf exakt finalem Head

---

## 10. DB / Kosten / Release Gates

- Standardziel: **keine DB-Migration**
- keine Development-/Production-Migration ohne vorherige Architecture-/Product-Owner-Entscheidung
- kein echter Provider
- keine Secrets
- keine neuen laufenden Kosten
- PR bleibt Draft bis unabhängiger ChatGPT-Review abgeschlossen ist
- kein Mark Ready / kein Merge ohne aktuelle ausdrückliche Product-Owner-Freigabe

---

## 11. Stop-Kriterium für unabhängige Reviews

Review muss tief sein, aber nicht endlos.

Merge-blocking sind nach Implementierung nur konkrete/reproduzierbare oder direkt code-derived Defekte mit relevantem Einfluss auf:

- Seasonal Truth / Evidence / Freshness
- falsche saisonale Warnung oder falsche Entwarnung
- Safety-vs-Seasonal-Trennung
- Geo-/Zeit-/Recurring-Window-Wahrheit
- Source of Truth / Datenverlust
- Security / Client-Trust / Secrets
- Guest/Account-Parität
- Production Rollout / Migration / Provider-Gate
- zentrale Foundation-Funktionalität

Stilfragen, theoretische Mikro-Härtung oder provider-spezifische Details, die erst gegen den real gewählten Adapter verifizierbar sind, verlängern die Foundation nicht.
