# Jetnity – Entry Requirements Visitor Checklist E3 Task

Stand: 31. August 2026  
Status: **BINDING BOUNDED IMPLEMENTATION TASK / NO PROVIDER / NO DEADLINE RUNTIME**

Issue: #311  
Baseline: `main@25f0af9ab92f0757ea7e4bc6c42c2fbbb01c45f5`  
Branch: `feat/entry-requirements-checklist-e3-2026-08-31`

## 1. Ziel

E1 und E2 liefern bereits provider-neutrale Official Requirements Truth, Visa-Modi und sichere Official Actions. Die aktuelle Besucheroberfläche reduziert diese Wahrheit jedoch weiterhin auf eine Summary pro Reisendem und zeigt Actions teilweise pauschal als „Offizielle Information öffnen“.

E3 macht die **vorhandene** Official Truth lossless, verständlich und pro Credential-Option sichtbar. E3 erfindet keine neue Requirements-Wahrheit.

Kanonisches Invariant:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Kein Default-/Primary-/Preferred-/Chosen-Pass, keine Default-Citizenship, kein `documents[0]`, kein `evaluations[0]`.

## 2. Verbindliche Presentation-Grenze

Eine Besucherzeile/-karte entspricht exakt einer `OfficialEvaluation` bzw. ihrem eindeutigen fachlichen Scope:

`Traveller × Credential-Option × Destination/Transit × Requirement Type`.

Keine credential-übergreifende Zusammenlegung, auch wenn Requirement-Typ oder URL identisch sind. Eine Summary darf ergänzend bleiben, aber niemals die einzige sichtbare Detailwahrheit sein.

### 2.1 Ergebnistext fail-closed

Nur wenn `status === 'current'` **und** `freshness === 'current'` darf die UI harte Ergebnis-Copy wie folgt zeigen:

- `required` → `Erforderlich`
- `not_required` → `Nicht erforderlich`
- `conditional` → `Bedingt`
- `unknown` → `Noch nicht verlässlich bestimmbar`

Nicht-current Zustände gewinnen in der Darstellung vor dem alten Resultat:

- `insufficient_context` / Missing Facts → fehlende Angaben nennen bzw. „Für die Prüfung fehlen Angaben“;
- `recheck_needed` / `stale` → `Erneut prüfen`;
- `source_temporarily_unavailable` → `Offizielle Quelle derzeit nicht erreichbar`;
- `provider_unavailable` → `Automatische Einreiseprüfung derzeit nicht verfügbar`;
- `never_checked` → `Noch nicht offiziell geprüft`.

Stale/Unavailable darf nicht gleichzeitig als aktuelle harte Sicherheit formuliert werden.

### 2.2 Requirement-Typen und Visa-Modi

Besucherlabels müssen aus der geschlossenen strukturierten Taxonomie kommen. Mindestens:

- `visa`: `Visum` plus strukturierter Modus, wenn belastbar vorhanden:
  - `visa_exempt` → `Visumfreie Einreise`
  - `visa_on_arrival` → `Visa on Arrival`
  - `electronic_visa` → `E-Visum`
  - `visa_before_travel` → `Visum vor der Reise`
  - `unknown` → `Visumstatus`
- `electronic_travel_authorization` → `Elektronische Reisegenehmigung (eTA)`; niemals als Visa-Modus umetikettieren;
- `passport` → `Reisepass`;
- `identity_document` → `Identitätsdokument`;
- `passport_validity` → `Passgültigkeit`;
- `blank_passport_pages` → `Freie Passseiten`;
- `transit` → `Transitbestimmungen`;
- `health` → `Gesundheitsanforderung`;
- `vaccination` → `Impfanforderung`;
- `health_document` → `Gesundheitsdokument`;
- `entry_form` → `Einreiseformular`;
- `insurance` → `Versicherungspflicht`;
- `onward_or_return_ticket` → `Rück- oder Weiterreisenachweis`;
- `booking_or_travel_document` → `Buchungs- oder Reisenachweis`;
- `financial_means` → `Finanzielle Mittel`;
- `other_entry_requirement` → `Weitere Einreiseanforderung`.

Keine Provider-Marketingtexte als fachliches Label.

## 3. Priorisierte Gruppen

Eine kleine provider-neutrale Presentation-Funktion darf die vorhandenen Typen in verständliche Besuchergruppen einsortieren. Verbindliche Mindeststruktur:

1. **Vor Abreise erledigen**
   - `electronic_travel_authorization`
   - `entry_form`
   - `vaccination`
   - `health_document`
   - `health`
   - `insurance`
   - `visa` mit `electronic_visa` oder `visa_before_travel`
   - `visa` mit `unknown` darf hier als `Erneut prüfen`/unklar erscheinen, aber niemals als erfundener Antrag.

2. **Dokument prüfen**
   - `passport`
   - `identity_document`
   - `passport_validity`
   - `blank_passport_pages`

3. **Bei Einreise / vor Ort**
   - `visa` mit `visa_on_arrival`
   - `visa` mit `visa_exempt`

4. **Bei Einreise / Reise nachweisen**
   - `onward_or_return_ticket`
   - `booking_or_travel_document`
   - `financial_means`

5. **Route / Transit**
   - `transit`

6. **Weitere offizielle Anforderungen**
   - `other_entry_requirement` und nur fachlich nicht sinnvoll anders klassifizierbare Residuals.

Die Gruppierung ist reine Presentation; sie darf `result`, `status`, `freshness`, `visaMode`, Evidence oder Eligibility nicht verändern.

## 4. Credential-Option sichtbar machen

Jede Evaluation muss für Besucher nachvollziehbar der verwendeten Dokumentoption zugeordnet werden.

- vorhandene `credentialOptionRef` nur über **exakte** bestehende Trip-/Traveller-Daten auflösen;
- wenn ein exaktes Dokument auflösbar ist: menschenlesbar z. B. `Reisepass · Schweiz` oder `Personalausweis · Kroatien`, wobei das Land nur aus dem strukturierten `issuingCountryCode` kommt;
- Citizenship darf nur zusätzlich gezeigt werden, wenn sie aus dem exakt verknüpften `citizenshipClientRef` auflösbar ist; Issuer Country ≠ Citizenship;
- niemals aus Reihenfolge oder Residence ableiten;
- wenn die Zuordnung nicht sicher auflösbar ist: neutrale Copy wie `Reisedokument-Option`, keine rohe interne Client-/Option-ID als normale Besucher-Copy.

Mehrere Credential-Optionen desselben Travellers bleiben separate Karten/Zeilen.

## 5. Destination / Transit / Evidence

Pro Eintrag darf, soweit strukturiert vorhanden, angezeigt werden:

- Destination-Land oder Transit-Land;
- Authority;
- `checkedAt` als **Jetnity-Prüfzeit**, nicht als „Quelle zuletzt aktualisiert“;
- Freshness-Text;
- sichere Evidence-/Action-Links.

Keine freie Interpretation von Providerdaten.

### 5.1 Links

- `officialActionZweckText(action.purpose)` ist für vorhandene Actions zu verwenden;
- `application` → `Offiziellen Antrag öffnen`;
- `form` → `Offizielles Formular öffnen`;
- `appointment` → `Offiziellen Termin öffnen`;
- `information` → `Offizielle Information öffnen`;
- wenn `action.href` von valider `evidence.sourceUrl` abweicht, darf zusätzlich eine sekundäre `Offizielle Quelle öffnen`-Action gezeigt werden;
- keine Doppelanzeige derselben URL;
- keine URL-Heuristik.

## 6. UI-Scope

Primär betroffen:

- `components/trips/Reisevorbereitung.tsx`
- `lib/readiness/bezeichnungen.ts`
- kleine neue provider-neutrale Presentation-Datei, z. B. `lib/readiness/official-presentation.ts`, falls sie die Komplexität sauber isoliert;
- zugehörige Tests.

Erlaubt:

- konkrete Official-Requirement-Karten/Zeilen;
- kleine responsive/accessibility Verbesserungen;
- klare Statusbadges/-texte ohne dekorative Überladung.

Nicht erlaubt:

- großer Workspace-/IA-Redesign;
- neue globale Designsystem-Abhängigkeit;
- neue persistierte User-Tasks aus Official Evaluations;
- Completion-/Deadline-/Notification-Logik.

## 7. Keine erfundenen Details

Der aktuelle Contract trägt noch **keine** belastbaren First-Class-Felder für z. B.:

- Visa-/eTA-Gebühr;
- erlaubte Aufenthaltsdauer;
- konkrete freie Seitenzahl;
- Proof-of-Funds-Betrag;
- vollständige Provider-Dokumentliste;
- `available_from` / `due_at` / Deadline-Regel.

E3 darf solche Werte weder aus `sourceUrl`, `requirementType`, `visaMode`, freiem Text noch LLM-/Browserwissen ableiten. Fehlt der strukturierte Wert, wird er nicht dargestellt.

## 8. Harte Non-Scope-Grenzen

- `requirementsProviderAus()` bleibt `null`;
- kein echter Provider / Adapter / Vendor / DPA;
- keine Secrets/API Keys/paid calls;
- keine Supabase-/Migration-/RLS-/Ownership-/Auth-/AAL-Änderung;
- keine Passnummer/MRZ/Scans/Biometrie/Gesundheitsakte;
- kein Credential-Ranking oder automatische „beste Pass“-Entscheidung;
- keine Deadline-/Reminder-/Notification-Runtime;
- keine neuen Gebühren-/Stay-/Threshold-/Deadline-Hard-Truth-Felder;
- keine automatische Browser-/LLM-Recherche als Official Truth;
- `docs/ACTIVE_WORK_STATUS.md` wird nur vom Technical Lead geändert, nicht vom Cursor-Agenten;
- kein E4 automatisch starten.

## 9. Pflicht-Tests

Mindestens:

1. zwei Citizenship-/Dokumentoptionen desselben Travellers bleiben getrennt und permutation-stabil;
2. kein `evaluations[0]`-/`documents[0]`-Fallback;
3. `visa_exempt`, `visa_on_arrival`, `electronic_visa`, `visa_before_travel`, `unknown` korrekt beschriftet/gruppiert;
4. eTA bleibt eigener Requirement-Typ;
5. `blank_passport_pages` und `financial_means` bekommen First-Class-Labels/Gruppen;
6. Transit landet in `Route / Transit` und bleibt scoped;
7. stale/recheck/unavailable/insufficient_context erzeugen keine aktuelle Hard-Truth-Copy;
8. purpose-spezifische Action-Labels;
9. Action + Source mit gleicher URL nicht dupliziert;
10. Credential-Label nutzt ausschließlich exakte strukturierte Dokumentdaten; unbekannte Zuordnung bleibt neutral;
11. bestehende E1/E2/Engine-Multi-Credential-Regressionen bleiben grün;
12. `requirementsProviderAus() === null`.

Zusätzlich vollständig ausführen:

- relevante targeted tests;
- `npm test`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`.

## 10. Agent-Delivery

Agent liefert eigene:

- `docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_STATUS_2026-08-31.md`
- `docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_HANDOFF_2026-08-31.md`
- `docs/ENTRY_REQUIREMENTS_VISITOR_CHECKLIST_E3_SELF_REVIEW_2026-08-31.md`

Self-Review ist kein TL-PASS. PR bleibt Draft. Keine Ready-/Merge-Aktion durch den Agenten.

Bei `CHANGES REQUIRED` arbeitet **dieselbe Cursor-Session** weiter.

## 11. Definition of Done

- Scope-faithful Diff;
- unabhängiger Technical-Lead Exact-Head-Review;
- Branch auf aktuellem `main`;
- Exact-Head CI SUCCESS;
- Vercel exact head SUCCESS/READY;
- 0 Review-Threads;
- geschützter Merge mit Expected Head;
- Post-Merge `main` exact Merge-SHA;
- Main-CI SUCCESS exact SHA;
- Vercel Production SUCCESS/READY exact SHA;
- Issue #311 schließen;
- Agent stoppen;
- **kein automatischer E4-/Provider-/Deadline-Start**.
