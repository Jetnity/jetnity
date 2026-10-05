# Jetnity – Mobile Accessibility 1 Task

Stand: 2. September 2026  
Status: **TECHNICAL-LEAD AUTHORIZED / SINGLE_AGENT / PROVIDER-INDEPENDENT V1 RELEASE-QUALITY SLICE / STOP BEFORE READY OR MERGE**

Issue: **#429**  
Baseline: `main@e31e57269e985cb73e1490a0ac6b8ad6bea87725`  
Branch: `feat/phase-1-mobile-accessibility-1`  
Cursor-Agent: **`Jetnity mobile accessibility 1`**  
Generation: **1**

## 1. Ziel

Schließe einen **kleinen, belastbaren Mobile-/Accessibility-Release-Qualitätsslice** für den kritischen Phase-1-Webpfad.

Der Auftrag ist **kein Redesign** und kein neues Produktfeature. Der Agent soll zuerst die bestehende UI gegen reale Browser-/Viewport-/Keyboard-/Accessibility-Anforderungen prüfen und **nur bestätigte Defekte** innerhalb dieses Scopes beheben.

Leitregel:

> Mobile und Desktop bleiben dieselbe Produktarchitektur. Accessibility ist Teil der Produktkorrektheit, nicht kosmetisches Nachpolieren.

## 2. Warum jetzt

Live-Rekonstruktion vor Dispatch ergab:

- aktuelles `main`: `e31e57269e985cb73e1490a0ac6b8ad6bea87725`;
- Assistant Truth Context 1: CLOSED;
- World Map 1: CLOSED;
- Destination Essentials 1: CLOSED;
- PWA-1 Installability: bereits CLOSED; Manifest/Icons/Apple-Metadata vorhanden, `/sw.js` bewusst nicht vorhanden;
- Provider-Anfragen und Production-Gates A–E: CLOSED/DEFERRED;
- V1 Gap Analysis: Mobile Web **PARTIAL / stark**, aber vollständiger Browser-/Mobile-/Accessibility-Gate fehlt;
- Vercel Production auf exaktem `main`: READY, keine beobachteten Runtime-Fehler im letzten 24h-Fenster;
- kein aktiver Cursor-Agent / kein aktiver Runtime-Draft.

Deshalb ist ein enger Release-Quality-Slice aktuell verantwortbarer als ein neuer Provider-, Official-Truth- oder Assistant-Modellpfad.

## 3. Multi-Agent Suitability

### Decision: `SINGLE_AGENT`

Begründung:

- Responsive/A11y-Defekte liegen typischerweise in gemeinsam genutzten Shell-, Navigation-, Form- und Trip-Workspace-Komponenten;
- dieselben Styles/Komponenten/Tests können mehrere Viewports betreffen;
- zwei schreibende Agenten würden hohe Kollisions- und Semantikdrift-Gefahr erzeugen;
- die Aufgabe ist bounded genug für einen Agenten und anschließenden unabhängigen Technical-Lead-Review.

Kein zweiter schreibender Agent in diesem Slice.

## 4. Primärer Scope

Audit und, nur wenn belegt, bounded Fixes auf dem **kritischen öffentlichen/Guest-Webpfad und gemeinsam genutzter Präsentations-UI**:

1. globale Shell/Header/Footer/Navigation, soweit für diesen Pfad genutzt;
2. Homepage-Einstieg;
3. `/planen` und die dortige Kerninteraktion;
4. `/reisen` Guest-/Listenoberfläche, soweit ohne Auth nutzbar;
5. `/reisen/[tripId]` bzw. vorhandene Trip-Workspace-Kernoberfläche über bestehende Fixtures/Guest-Truth;
6. gemeinsame Dialoge/Sheets/Listboxes/Comboboxes/Form-Kontrollen, **nur soweit sie in diesem Pfad tatsächlich auftreten**;
7. gemeinsam genutzte Styles, wenn ein bestätigter Defekt dort ursächlich ist;
8. zielgerichtete Regressionstests/Evidence für die bestätigten Defekte.

Authenticated Account-Komponenten dürfen nur dann presentation-only angepasst werden, wenn dieselbe gemeinsam genutzte Komponente durch einen Fix betroffen ist. **Keine Auth-/Session-/MFA-/AAL-/Recovery-Semantik ändern.**

## 5. Verbindliche Audit-Dimensionen

Mindestens prüfen:

### Responsive / Reflow

- 320 CSS px;
- 360 CSS px;
- 390 CSS px;
- 768 CSS px;
- 1024 CSS px;
- 1440 CSS px;
- kein unbeabsichtigtes `body`-Horizontal-Overflow;
- keine abgeschnittenen Kernaktionen, Formfelder oder Dialoginhalte;
- fixe/sticky Flächen überdecken keine notwendigen Inhalte oder Aktionen;
- bei 200%-Zoom bzw. äquivalenter schmaler CSS-Reflow-Breite keine Funktionsverluste;
- lange reale Labels/Texte dürfen Layout nicht brechen.

Intentional interne horizontale Rails sind nur zulässig, wenn sie bereits Teil der bestehenden IA sind, nicht den gesamten Body überlaufen lassen und bedienbar/verständlich bleiben.

### Touch / Pointer

- kritische Buttons, Icon-Actions, Inputs und Auswahlkontrollen mit effektiv ausreichend großer Touch-Fläche; bestehender Jetnity-Standard `>=44px` / `min-h-11` berücksichtigen;
- keine zwingende Hover-only-Funktion;
- keine gesture-only Kernaktion.

### Keyboard / Focus

- alle Kernaktionen keyboard-erreichbar;
- logische Fokusreihenfolge;
- sichtbarer Fokus;
- kein unbeabsichtigter Fokusverlust nach dynamischen UI-Änderungen;
- kein Fokus-Trap außerhalb echter Modalität;
- bei Modal/Dialog/Sheet korrekte Rückgabe bzw. sinnvolle Fokusführung.

### Semantics / Screen Reader

- Controls besitzen sinnvolle zugängliche Namen;
- Labels und Inputs sind korrekt verbunden;
- Buttons bleiben Buttons, Links bleiben Navigation;
- keine verschachtelten interaktiven Controls;
- Dialog/Listbox/Combobox/Disclosure-Semantik bleibt korrekt;
- dynamische relevante Fehler/Statusmeldungen werden angemessen angekündigt, ohne interne Fehlertexte als Labels zu leaken;
- versteckte/inert Inhalte dürfen nicht unbeabsichtigt fokussierbar bleiben.

### Motion / Safe UI

- bestehende Reduced-Motion-Präferenz nicht brechen;
- Animation darf keine notwendige Information exklusiv transportieren;
- mobile fixed/sticky UI muss Safe-Area/Viewport-Verhalten verantwortbar behandeln, wo relevant.

## 6. Fix-Regel

Der Agent darf **nur bestätigte P0/P1/P2-relevante responsive/accessibility Defekte** innerhalb des Scopes ändern.

Nicht erlaubt:

- allgemeines visuelles Redesign;
- neue Navigation/IA;
- neue Produktfeatures;
- große Copy-Neufassung;
- neue zweite Design-System-Abstraktion;
- opportunistisches Refactoring ohne Defektbezug;
- Änderungen außerhalb des Critical-Path-Scopes nur weil sie ähnlich aussehen.

Wenn ein Fund einen Shared Contract, Auth-/Traveller-/Route-/DB-Vertrag oder eine Produktentscheidung erfordert: **STOPP an dieser Grenze, dokumentieren, nicht eigenmächtig erweitern.**

## 7. Harte Non-Scope-/Gate-Grenzen

Dieser Slice autorisiert **nicht**:

- DB-/Supabase-Migrationen, Tabellen, RLS, Grants, Functions oder Production-Datenänderungen;
- Auth-/Session-/MFA-/AAL-/Identity-/Ownership-Semantik;
- Traveller-/Citizenship-/Document-Vertragsänderungen;
- Passport/MRZ/Scan/Biometrie-/Health-Speicherung oder Weitergabe;
- Providerwahl, Providerkontakt, Signup, Terms/DPA, Secrets, Sandbox/live/paid calls;
- Production S6 oder Commercial Provenance Writer;
- OpenAI-/Modellaufrufe oder neue `Modellfunktion`;
- Assistant Runtime/UI;
- Official-Truth-Erzeugung oder neue Official-Provider;
- Service Worker, Offline Cache, IndexedDB, Push/Notifications;
- Änderung des bereits geschlossenen PWA-1-Vertrags/Manifest-/Icon-Programms ohne belegten Regression-Bug;
- Native-App-Architektur;
- öffentliche Indexierung/Domain-Cutover/Public Launch;
- Payments;
- neue laufende Infrastruktur-/Servicekosten.

Product-Owner-Gates bleiben vollständig bestehen.

## 8. Truth-/Security-Regeln bleiben unverändert

> `1 Traveller -> mehrere Staatsbürgerschaften -> mehrere Reisedokumente/Credentials -> kontextabhängig bewertete Optionen.`

Nie Default/Primary/Preferred Citizenship oder Passport aus Array-Reihenfolge ableiten. Residence ≠ Citizenship. Issuer Country ≠ Citizenship.

> OFFICIAL TRUTH ≠ PROVIDER TRUTH ≠ JETNITY RECOMMENDATION ≠ COMMUNITY OPINION ≠ GENERATED SUGGESTION.

`unknown != not_required`, `unavailable != not_required`, `stale != current`, Planned != Visited, LLM != Official Truth.

Responsive/A11y-Fixes dürfen diese Semantik nicht verändern oder verschleiern.

## 9. Evidence / Tests

Erforderlich:

1. alle neuen/angepassten gezielten Regressionstests grün;
2. vollständiger vorhandener Testlauf grün;
3. Typecheck grün;
4. Lint ohne neue Fehler;
5. Production Build grün;
6. bestehende Repository-Hygiene-Gates grün;
7. Browser-/Viewport-Evidence für die auditierten Kernbreiten;
8. Keyboard-/Focus-Evidence für die tatsächlich betroffenen interaktiven Pfade;
9. bei bestätigten Fixes: vorher/nachher nachvollziehbar dokumentieren;
10. keine Behauptung „real device tested“, wenn nur Browser-Viewport/Emulation verwendet wurde.

Wenn die Agentenumgebung echtes physisches Gerät nicht bereitstellt, lautet die Evidence ausdrücklich `browser viewport/emulation`, nicht `real device`.

## 10. Deliverables

Mindestens:

- Runtime-/Test-Fixes nur für bestätigte Defekte;
- `docs/MOBILE_ACCESSIBILITY_1_STATUS_2026-09-02.md`;
- `docs/MOBILE_ACCESSIBILITY_1_HANDOFF_2026-09-02.md`;
- `docs/MOBILE_ACCESSIBILITY_1_SELF_REVIEW_2026-09-02.md`;
- Evidence unter `docs/evidence/` nur soweit tatsächlich nützlich und reproduzierbar;
- Task/Status/Handoff müssen exakten finalen Head, tatsächliche Tests und verbliebene Nicht-Abdeckung ehrlich nennen.

## 11. Agent-Arbeitsweise

Cursor-Agent: **`Jetnity mobile accessibility 1`**.

1. Vor Änderung `origin/main`, Branch und dieses Task-Dokument lesen/verifizieren.
2. Bestehende Komponenten/Tests wiederverwenden; keine zweite UI-/A11y-Architektur bauen.
3. Zuerst auditieren, dann nur belegte Defekte fixen.
4. Kleine, nachvollziehbare Commits.
5. Scope-Creep stoppen und dokumentieren.
6. Self-Review ist Evidence, kein Technical-Lead-PASS.
7. Jeder neue Head invalidiert vorherige Exact-Head-Gates.

## 12. STOPP

Nach Implementierung, Tests, Status, Handoff und Self-Review:

**STOPP.**

- **DO NOT MARK READY.**
- **DO NOT MERGE.**
- **DO NOT START A FOLLOW-UP SLICE.**
- **DO NOT OPEN ANY PRODUCT-OWNER GATE.**

Der ChatGPT / Technical Lead führt danach den unabhängigen Exact-Head-Review, CI/Vercel-/Thread-/Drift-Check und die Integrationsentscheidung durch.
