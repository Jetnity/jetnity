# PR #38 – ChatGPT Independent Review

Stand: 23. August 2026  
Status: **REQUEST CHANGES – vier konkrete Merge-Blocker**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Base bei Reviewbeginn: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Runtime-Head laut Gate-Lock: `2dfec9bc2ae7336d7ca4e918a25c186efa2cecab`  
Docs-/PR-Head bei Reviewbeginn: `8df39f7b647e800a9938b15471693893cbd2a6e3`

## 1. Review-Urteil

Die Foundation ist insgesamt stark aufgebaut: eigene `lib/seasonal/`-Truth-Domäne, klare Trennung von akuter Safety, provider-neutraler Port, Evidence/Freshness, wiederkehrende und absolute Reisezeitfenster, Geo-/Zeit-Fail-closed-Logik, getrennte Presentation-/Impact-Schicht, geschützte API-Naht, Guest/Account-Modellparität, kein Live-Provider und keine DB-Migration.

Der formale Gate-Stand ist ebenfalls stark: 1540/1540 Tests, Typecheck/Lint/Hygiene grün, Production-Build grün, UI-Audit 1014/1014 auf WebKit + Chromium und acht Viewports, DB-Gates unverändert sowie GitHub Actions/Vercel auf Runtime- und Docs-Head grün.

**Trotzdem ist PR #38 noch nicht mergefähig.** Der unabhängige Code-Review hat vier konkrete, direkt aus dem Runtime-Code ableitbare Truth-/Fail-closed-Defekte gefunden. Sie können falsche oder zu saubere Seasonal-Aussagen erzeugen und fallen damit unter das verbindliche Merge-Blocking-Kriterium.

---

## 2. Merge-Blocker 1 – gemischte Unsicherheit kann von einem gültigen Seasonal-Fact überdeckt werden

### Betroffene Dateien

- `lib/seasonal/status.ts`
- `lib/seasonal/anzeige.ts`
- indirekt `lib/seasonal/praesentation.ts`
- Tests in `lib/seasonal/status.test.ts`, `lib/seasonal/anzeige.test.ts` und/oder `lib/seasonal/engine.test.ts`

### Problem

Die Aggregation entscheidet derzeit zuerst, ob irgendein sichtbarer Seasonal-Hinweis existiert (`has_timing`), und prüft erst danach `unknown`/unaufgelöste Zustände. Gleichzeitig wird `summary.complete` im Wesentlichen nur durch den speziellen `partial_invalid`-Sentinel auf `false` gesetzt.

Dadurch kann ein gültiger Fact eine separate unsichere Wahrheit überdecken.

Konkretes Beispiel:

1. Fact A ist aktuell, vertrauenswürdig und `favorable_context` → Presentation `information`.
2. Fact B betrifft einen anderen Seasonal-Key, ist aber `stale`, konfliktbehaftet, `recheck_needed` oder anderweitig `unknown` und könnte einen Nachteil darstellen.
3. Die Gesamtansicht kann dennoch `has_timing`, `complete=true` und API-Status `ok` liefern.
4. Die UI kann daraus sinngemäß ableiten: „beobachtenswerter saisonaler Kontext ohne belastbaren Nachteil“, obwohl ein zweiter entscheidungsrelevanter Fact gerade **nicht belastbar aufgelöst** ist.

Das widerspricht ausdrücklich der Acceptance-Regel, dass ein stale/unresolved Fact keine saubere bzw. günstige Gesamtaussage erzeugen darf.

### Erforderliche Korrektur

Die Summary muss alle entscheidungsrelevanten Evaluation-Zustände aggregieren. Mindestens `stale`, `recheck_needed`, `unknown`, `insufficient_context`, Konflikte und unvollständige Providerantworten dürfen nicht von einem anderen gültigen Fact zu einer clean/favorable Gesamtwahrheit überstimmt werden.

Ein vorhandener gültiger Nachteil darf weiterhin sichtbar bleiben. Die Gesamtaussage muss dann aber neutral/incomplete bleiben, wenn parallel ein weiterer relevanter Fact ungeklärt ist.

### Pflicht-Regressionen

Mindestens:

- aktueller `favorable_context` + separater stale `less_favorable` → **kein** clean/favorable Gesamtstatus, kein irreführendes API-`ok`.
- aktueller Timing-Hinweis + separater Konflikt → Hinweis bleibt sichtbar, Gesamtstatus bleibt unvollständig/unknown.
- aktueller Timing-Hinweis + separater `insufficient_context` → keine vollständige Gesamtwahrheit.
- zwei vollständig aktuelle, konsistente Facts → normaler bestehender Status bleibt erhalten.

---

## 3. Merge-Blocker 2 – absolute Travel Windows akzeptieren unmögliche Kalenderdaten

### Betroffene Dateien

- `lib/seasonal/fenster.ts`
- ggf. gemeinsame strikte ISO-Helfer in `lib/seasonal/evidence.ts`
- `lib/seasonal/fenster.test.ts`

### Problem

Absolute Travel Windows werden aktuell im Wesentlichen über `Date.parse(...)` validiert, solange ein `Z` vorhanden ist.

JavaScript normalisiert jedoch bestimmte unmögliche Kalenderdaten statt sie abzulehnen. Beispielsweise wird ein Datum wie `2026-02-30T00:00:00.000Z` von `Date.parse` als gültiger Zeitpunkt Anfang März interpretiert.

Damit kann malformed Provider-Truth ein anderes reales Zeitfenster bekommen und anschließend eine scheinbar belastbare zeitliche Relevanz erzeugen.

Für Seasonal-Truth ist das nicht zulässig. Die vorhandene striktere Kalender-/ISO-Prüfung darf hier nicht umgangen werden.

### Erforderliche Korrektur

- Start und Ende eines absoluten Seasonal-Fensters müssen mit einer **strikten Kalender-/Instant-Validierung** gelesen werden.
- unmögliche Daten, falsche Laufzeitformen und nicht unterstützte Zeitzonenformen müssen fail-closed verworfen werden.
- danach weiterhin `start <= end` prüfen.
- keine stille Normalisierung durch `Date.parse` als Validierungsmechanismus.

### Pflicht-Regressionen

Mindestens:

- `2026-02-30T...Z` → invalid / kein Seasonal-Fact.
- unmöglicher 31. April → invalid.
- gültiger Leap-Day 2028-02-29 → gültig.
- 2027-02-29 → invalid.
- gültiges absolutes Fenster bleibt unverändert funktional.

---

## 4. Merge-Blocker 3 – Geo-Fingerprints runden stärker als die Entscheidungslogik

### Betroffene Dateien

- `lib/seasonal/fingerprint.ts`
- `lib/seasonal/scope.ts`
- indirekt `lib/seasonal/relevanz.ts`
- Tests für Context-/Fact-Fingerprint, Conflict/Dedup und Point-Radius-Relevanz

### Problem

Die Relevanzberechnung für `point_radius` arbeitet mit der vollen Latitude-/Longitude-Präzision. Die Fingerprints bzw. Scope-Identität serialisieren Koordinaten jedoch mit nur vier Dezimalstellen (`toFixed(4)`).

Damit sind Fingerprint-Gleichheit und Entscheidungs-Gleichheit nicht äquivalent.

Konkrete reproduzierbare Grenzsituation bei 0,0 und Radius 0,1 km:

- Latitude `0.000895` liegt ungefähr 99,5 m vom Zentrum entfernt.
- Latitude `0.000904` liegt ungefähr 100,5 m entfernt.
- beide werden bei vier Dezimalstellen zu `0.0009`.

Die fachliche Entscheidung kann also von `applies` zu `not_applies` wechseln, während der Context-/Scope-Fingerprint gleich bleibt. Dasselbe kann Conflict-/Dedup-Semantik für punktbasierte Facts verfälschen.

Das verletzt die verbindliche Regel, dass Entscheidung-relevante Änderungen den Fingerprint ändern müssen.

### Erforderliche Korrektur

Koordinaten in Context-/Fact-/Scope-Identität müssen so kanonisiert werden, dass **jede Änderung, die die Relevanzentscheidung ändern kann, auch die Identität/Fingerprint ändern kann**. Keine gröbere Rundung als die Entscheidungslogik.

Empfohlen: deterministische kanonische Serialisierung der validierten numerischen Werte ohne verlustbehaftete Vier-Dezimal-Rundung.

### Pflicht-Regressionen

Mindestens:

- zwei Koordinaten innerhalb desselben bisherigen `toFixed(4)`-Buckets, die eine 0,1-km-Grenze auf unterschiedlichen Seiten liegen, erzeugen unterschiedliche Context-Fingerprints und unterschiedliche Relevanz.
- dasselbe für `point_radius`-Fact-/Scope-Identität.
- identische Koordinaten bleiben deterministisch identisch.
- bestehende order-independent Conflict-/Dedup-Tests bleiben grün.

---

## 5. Merge-Blocker 4 – Provider-Normalisierung ist bei mehreren untrusted Runtime-Feldern noch tolerant statt strikt

### Betroffene Dateien

- `lib/seasonal/normalisieren.ts`
- `lib/seasonal/evidence.ts`
- `lib/seasonal/scope.ts`
- ggf. `lib/seasonal/engine.ts`
- Provider-/Normalisierungs-/Engine-Tests

### 5.1 `sourceUrl` mit falschem Runtime-Typ

Ein ungültiger nichtleerer **String** wird korrekt als nicht vertrauenswürdig behandelt. Wenn `sourceUrl` aber als Zahl/Objekt/Array geliefert wird, normalisiert der URL-Parser auf `null`; die Trust-Prüfung betrachtet den Rohwert nur dann als Fehler, wenn er ein String war.

Damit kann ein malformed Provider-Fact trotz falsch typisierter Evidence noch `vertrauenswuerdig=true` werden und eine Seasonal-Aussage tragen.

**Erforderlich:** Wenn ein Evidence-Feld vorhanden ist, muss sein Runtime-Typ strikt zum Vertrag passen. Falscher Typ → Fact fail-closed ungültig/unknown, niemals trusted Truth.

### 5.2 `availability` ist nicht vollständig als Enum-Grenze validiert

Der Code behandelt exakt `temporarily_unavailable` speziell. Andere unerlaubte Strings bzw. falsche Runtime-Typen werden nicht als Vertragsverletzung erkannt und können normal weiterlaufen.

Zusätzlich sollte ein explizites `temporarily_unavailable` semantisch als **Source temporarily unavailable** erhalten bleiben und nicht nur wie eine beliebige malformed Zeile verschwinden.

**Erforderlich:** striktes Enum-Verhalten und klarer unavailable-Pfad.

### 5.3 `route.airportCodes[]` verwirft malformed Kinder still

Bei Route-Scopes werden einzelne ungültige Array-Elemente gefiltert. Eine Providerantwort wie sinngemäß `['DOH', 123]` kann dadurch zu `['DOH']` werden und anschließend eine belastbare Route-Relevanz erzeugen.

Das ist eine semantische Veränderung untrusted Providerdaten.

**Erforderlich:** Wenn ein strukturierter Entscheidungs-Array vorhanden ist, müssen alle Elemente den Vertrag erfüllen. Teilweise malformed → keine still verkürzte authoritative Truth.

### Pflicht-Regressionen

Mindestens:

- `sourceUrl: 123`, Objekt und Array → keine trusted Timing-Aussage.
- gültige HTTPS-URL → weiterhin trusted, sofern übrige Trust-Kriterien erfüllt.
- `availability: 'temporarily_unavailable'` → expliziter Source-unavailable-Zustand.
- unerlaubter Availability-String und falscher Typ → fail-closed.
- `route.airportCodes: ['DOH', 123]` → nicht still zu `['DOH']` normalisieren.
- vollständig gültige Airport-Code-Liste → bestehende Route-Relevanz bleibt korrekt.

---

## 6. Was ausdrücklich **kein** aktueller Merge-Blocker ist

Diese Punkte sind dokumentierte spätere Nähte und werden durch diesen Review nicht künstlich in den Foundation-Scope gezogen:

- kein echter Seasonal-Provider; `seasonalProviderAus()` bleibt `null`.
- Guest-/Account-Produktpfad lädt noch keine echten Seasonal-Evaluations; die optionale Workspace-Karte bleibt ohne Evaluation unsichtbar.
- `Trotzdem so planen` wird in dieser Foundation noch nicht persistiert.
- Title-only Geo bleibt `unknown`/`insufficient_context` statt geraten zu werden.
- In-process Rate-Limit ist für Preview/Development akzeptiert; kommerzieller Provider braucht später ein separates globales Gate.
- keine Seasonal-DB-Tabelle und keine Production-Migration.

Ebenfalls kein Grund für einen endlosen Foundation-Pass sind Stilfragen, kosmetische Refactors oder provider-spezifische Details, die erst mit einem real gewählten Adapter belastbar geprüft werden können.

---

## 7. Stop-Kriterium für den nächsten Re-Review

Nach Behebung der vier oben genannten Gruppen blockiert der nächste Review nur noch bei einem **konkreten reproduzierbaren oder direkt code-abgeleiteten Defekt** mit relevantem Einfluss auf:

- Seasonal Truth / Travel-Window-Wahrheit,
- Evidence / Provenance / Freshness / Fail-closed,
- Geo-/Zeit-Relevanz,
- Context-/Fact-/Decision-Fingerprints,
- Safety-vs-Seasonal-Trennung,
- Security / untrusted Providerdaten,
- Source-of-Truth / Guest-Account-Parität,
- Production-/Provider-Rollout,
- oder zentrale Foundation-Funktionalität.

Keine weiteren theoretischen Perfektionsschleifen.

---

## 8. Erforderlicher nächster Schritt

Cursor soll **ausschließlich diese vier Merge-Blocker** professionell schließen, die verlangten adversarial Regressionen ergänzen und danach das vollständige Gate auf exakt dem finalen Runtime-/PR-Head ausführen. Vor Abschluss erneut `origin/main` synchronisieren und 0 behind verifizieren.

PR #38 bleibt Draft. Kein Mark Ready, kein Merge, kein echter Provider, keine Development-/Production-Migration.