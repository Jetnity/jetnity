# Cursor-Auftrag – PR #32 Final Architecture Review

Stand: 22. August 2026  
Branch: `feat/travel-readiness-foundation`  
PR: `#32 – Foundation C – Travel Readiness & Dokumente`  
Ausgangs-Head dieses Reviews: `2d5ef37395f92b65d3ef3095b22c0e272d1a2669`

## Status

Die erste Human-Review-Runde ist weitgehend korrekt umgesetzt. CI, Preview, Tests und Audits sind grün. PR #32 bleibt dennoch Draft, weil beim zweiten Architektur-Review noch einige Provider-Readiness- und Truth-Grenzen aufgefallen sind.

Bestehende Arbeit nicht verwerfen. Nur die folgenden Punkte gezielt korrigieren. Keine Production-Migration, kein echter Provider, kein Timatic-Vertrag, keine neuen Secrets oder laufenden Kosten.

---

## 1. Provider-Ausführung muss echte Netzwerkprovider ohne Kernumbau unterstützen

Aktuell ist der Port synchron:

`RequirementsProvider.evaluate(anfrage): RequirementsProviderZeile[]`

Ein echter Timatic-/vergleichbarer Provider ist ein Netzwerkdienst und wird asynchron aufgerufen. In der jetzigen Form müsste die Kernarchitektur bei Provider-Aktivierung erneut umgebaut werden. Außerdem kann ein Throw/Netzwerkfehler derzeit die API als 500 verlassen, statt fail-closed zu bleiben.

### Fix

Baue die Provider-Grenze jetzt async-fähig und fehlertolerant, ohne heute einen echten Provider zu aktivieren.

Ziel:

- echter Provider kann später `await`-basiert integriert werden
- Provider-Fehler/Timeout/temporäre Nichterreichbarkeit führen zu ehrlichem `provider_unavailable` bzw. `source_temporarily_unavailable`, nicht zu erfundenen Resultaten und nicht zu einem ungefangenen 500
- pure Normalisierung/Truth-Logik bleibt testbar ohne Netzwerk
- Browser/LLM kann weiterhin keinen Provider injizieren
- `requirementsProviderAus()` bleibt in dieser Foundation `null`

Du darfst die Architektur in eine pure Normalisierungsfunktion + async Provider-Orchestrierung aufteilen, wenn das sauberer ist.

### Tests

Mindestens:

- async Testprovider liefert strukturierte Evaluations
- Provider wirft Fehler → fail closed, keine required/not_required-Aussage
- temporär unavailable → unknown + passende Freshness
- kein echter Netzwerkcall in Tests/Preview.

---

## 2. Die UI muss echte Provider-Evaluations später tatsächlich empfangen können

`Reisevorbereitung.tsx` ruft heute indirekt `requirementsFuerReise(reise)` auf. Diese Funktion verwendet `requirementsProviderAus()`, das bewusst `null` ist.

Damit ist zwar die Copy jetzt statusabhängig, aber selbst nach einer späteren API-/Provider-Anbindung könnten echte serverseitige Evaluations die UI ohne weiteren strukturellen Umbau nicht erreichen.

### Fix

Schaffe jetzt eine saubere Daten-Naht für Official Evaluations.

Beispielsweise:

- `Reisevorbereitung` / `readinessAnsicht` kann optional bereits serverseitig geladene `OfficialEvaluation[]` erhalten
- ohne diese Daten bleibt der heutige fail-closed lokale Fallback
- die UI muss nicht selbst Provider-Secrets oder Provider-Calls besitzen
- kein Provider-Secret im Client
- kein doppeltes Truth-System.

Der echte Provider bleibt heute deaktiviert; es geht nur darum, dass die UI später die kanonischen Evaluation-Daten konsumieren kann, ohne die Foundation umzubauen.

### Zusätzlich: Result-Darstellung

Aktuell zeigt die Traveller-Karte bei `required === 0` pauschal `Noch nicht automatisch geprüft`.

Das ist bei current `not_required` oder `conditional` falsch.

Die UI muss result-/statusabhängig unterscheiden können, mindestens:

- required
- not_required
- conditional
- unknown
- insufficient_context
- stale/recheck
- provider/source unavailable.

Keine globale `Reise bereit`-Sprache.

### Tests / Audit

- current not_required wird nicht als ungeprüft dargestellt
- current conditional wird verständlich dargestellt
- current required wird korrekt dargestellt
- fehlende Fakten bleiben Missing-Facts-UX
- Provider unavailable bleibt ehrlich unavailable
- externe/supplied evaluations können die UI erreichen, ohne Provider im Client.

---

## 3. Multi-Transit muss vollständig sein, auch wenn Provider nur Teilzeilen liefert

Die `.find()`-Reduktion wurde korrekt entfernt. Es bleibt aber ein Edge Case:

Wenn die Anfrage zwei Transitländer enthält, z. B. `QA` und `SG`, und der Provider nur eine Zeile für `QA` zurückgibt, gibt die Engine aktuell nur diese Provider-Zeile aus. Für `SG` entsteht kein fail-closed Unknown-Eintrag, weil `zeilen.length > 0` bereits den Fallback-Zweig überspringt.

Außerdem darf ein Provider keine Transit-Evaluation für ein Transitland einschleusen, das gar nicht in der Anfrage enthalten ist.

### Fix

Für Requirement Type `transit`:

- pro angefragtem Transitland genau eine fachliche Evaluation erzeugen
- vorhandene passende Provider-Zeile normalisieren
- fehlende Provider-Zeile für ein angefragtes Transitland → `unknown` / ehrliche Freshness
- Provider-Zeile für nicht angefragtes Transitland ignorieren/fail closed
- deterministische Deduplizierung behalten.

### Tests

- Anfrage QA + SG, Provider liefert nur QA → QA Provider-Resultat + SG unknown
- Provider liefert unangefragtes US → US erscheint nicht
- doppelte QA-Zeile → nur eine QA-Evaluation
- Multi-Destination + Multi-Transit bleibt vollständig.

---

## 4. Evidence-Trust muss provider-neutral und zeitlich korrekt sein

`officialEvidenceVertrauenswuerdig()` verlangt aktuell zwingend eine `sourceUrl`. Der verbindliche Automations-Auftrag definiert `Source URL falls vorhanden`; ein vertrauenswürdiger Provider kann regulatorische Evidence liefern, ohne für jede einzelne Regel eine klickbare Behörden-URL zu exponieren.

Eine Source URL darf deshalb für eine **Official Action** zwingend sein, aber nicht automatisch für jede fachlich vertrauenswürdige Provider-Aussage, sofern andere belastbare Provider-Evidence vorhanden ist.

Außerdem werden `validFrom` / `validUntil` aktuell nicht sauber validiert; `validFrom` beeinflusst Freshness gar nicht. Ein ungültiger oder erst zukünftig gültiger Zeitraum darf nicht als `current required` akzeptiert werden.

### Fix

Treffe und dokumentiere eine provider-neutrale Trust-Regel. Mindestens:

- Provider-Identität valide
- `checkedAt` valide und zeitlich plausibel
- belastbare Authority und/oder Provider Rule Reference gemäß ADR
- `sourceUrl` optional für Trust, aber zwingend validiert, falls vorhanden
- Official Action nur bei valider HTTPS Source URL
- `validFrom` / `validUntil`, falls vorhanden, streng als Datum/Zeit validieren
- `validFrom` in Zukunft → nicht current
- `validUntil` abgelaufen → recheck_needed
- ungültige Zeitwerte → fail closed
- keine Future-`checkedAt`-Scheinevidence akzeptieren (kleine Clock-Skew-Toleranz erlaubt und dokumentieren).

Wichtig: Nicht Timatic-spezifisch hartcodieren.

### Tests

- trusted provider + checkedAt + Authority/RuleRef, aber keine Source URL → Result darf nach dokumentierter Trust-Regel gültig sein; Action bleibt null
- Source URL vorhanden und valide → Action möglich
- invalid Source URL → keine Action; Result gemäß Trust-Regel behandeln
- validFrom zukünftig → nicht current/kein required
- validUntil abgelaufen → recheck_needed/unknown
- invalid validFrom/validUntil → fail closed
- checkedAt deutlich in Zukunft → fail closed.

---

## 5. API-/UI-Wahrheit darf nicht auseinanderlaufen

Die kanonische API liefert jetzt `evaluations[]`, was korrekt ist. Stelle sicher, dass die Legacy-Zusammenfassung `official` nicht später als zweite fachliche Wahrheit verwendet wird.

### Fix

- `evaluations[]` ist kanonisch dokumentiert
- `official` nur Legacy/Compatibility, klar markiert
- UI/neuere Logik konsumiert die strukturierte Evaluation-Domain
- keine Logikentscheidung aus `official` treffen, wenn `evaluations[]` vorhanden sind.

Falls möglich, deprecate-Kommentar/ADR ergänzen.

---

## 6. Verification

Nach den Fixes vollständig erneut:

- `npm test`
- Typecheck
- Lint
- Hygiene (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`)
- `auth:pruefen`
- Production Build
- WebKit Trip-Workspace Audit
- Chromium Trip-Workspace Audit
- Activities Regression
- GitHub CI
- Vercel Preview.

DB-Schema sollte für diese Runde **nicht** geändert werden. Falls doch wider Erwarten nötig: nur Development und vorher im Abschlussbericht begründen; keine Production-Migration.

---

## 7. Abschlussbericht

Am Ende explizit beantworten:

1. Ist der Provider-Port jetzt async-fähig?
2. Was passiert bei Provider-Throw/temporärer Nichterreichbarkeit?
3. Wie gelangen spätere serverseitige Official Evaluations in die UI?
4. Wie stellt die UI required/not_required/conditional/unknown dar?
5. Wie werden teilweise fehlende Transit-Providerzeilen behandelt?
6. Wie werden unangefragte Transitländer abgewehrt?
7. Welche Evidence-Felder sind für Trust zwingend und warum?
8. Wie werden validFrom/validUntil/checkedAt validiert?
9. Ist `evaluations[]` die einzige kanonische neue Truth-Domain?
10. Sind DB/Production weiterhin unverändert?
11. Exakter Head, Tests, Audits, CI und Preview.

---

## Harte Grenzen

- PR bleibt Draft.
- Nicht mergen.
- Nicht Mark Ready.
- Keine Production-Migration.
- Kein echter Provider.
- Kein Timatic-Vertrag.
- Keine neuen Secrets.
- Keine neuen laufenden Kosten.
