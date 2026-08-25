# Jetnity – Future Native App Agent & Technical-Lead Operating Standard

Stand: 25. August 2026  
Status: **Product-Owner-verbindlich; für neue Chats, Technical Leads und Coding Agents verpflichtend**

## 1. Zweck

Jetnity arbeitet aktuell mit sechs spezialisierten Cursor-Agent-Workstreams unter übergreifender ChatGPT-/Technical-Lead-Steuerung. Ein siebter Agent wird **nicht jetzt** gestartet. Er wird verbindlich für den Zeitpunkt reserviert, an dem Jetnity eine eigenständige native iOS-/Android-Produktphase eröffnet und eine separate Native-App-Architektur fachlich sinnvoll ist.

Der reservierte exakte Anzeigename lautet:

> `Jetnity native app architecture`

Dieses Dokument legt verbindlich fest:

- wann dieser siebte Agent aktiviert werden darf;
- welche Aufgaben er besitzt;
- welche Aufgaben ausdrücklich bei anderen Workstreams bleiben;
- wie Web/PWA und Native dieselbe Produktwahrheit verwenden;
- welche Qualitäts-, Security-, Privacy- und Release-Gates für die Native App gelten;
- wie ChatGPT bzw. **jeder spätere Jetnity-Chat in der Rolle des Technical Lead** alle Agenten führen muss;
- wie die Technical-Lead-Rolle chatübergreifend übernommen wird, ohne Governance oder Produktwissen zu verlieren.

## 2. Aktuelles Teammodell

Bis zur Native-App-Aktivierung gelten sechs spezialisierte Cursor-Agenten:

1. `Trip workspace audit architecture`
2. `Account plattform audit vorbereitung`
3. `Jetnity provider readiness audit`
4. `Admin platform audit`
5. `Jetnity growth discoverability`
6. `Jetnity quality security audit`

ChatGPT / Technical Lead ist **kein siebter Feature-Agent**, sondern die übergreifende Steuerungs-, Architektur-, Integrations- und Review-Instanz.

Wenn die Aktivierungsbedingungen dieses Standards erfüllt sind, darf als siebter spezialisierter Workstream hinzukommen:

7. `Jetnity native app architecture`

Ein achter Agent darf daraus nicht automatisch abgeleitet werden. Weitere Agenten benötigen einen echten neuen, klar isolierbaren Verantwortungsbereich und eine bewusste Technical-Lead-/Product-Owner-Entscheidung gemäß der dann geltenden Governance.

## 3. Rolle von `Jetnity native app architecture`

**Rolle:** eigenständige native iOS-/Android-Produktarchitektur und -umsetzung auf Basis der kanonischen Jetnity-Backend-, Truth-, Account-, Traveller-, Provider- und Produktverträge.

Der Agent baut keine zweite Jetnity-Welt. Native App, Web und PWA müssen dieselbe fachliche Wahrheit verwenden.

Leitprinzip:

> **Ein Produkt, eine Wahrheit, mehrere Clients.**

Native darf eigene UI-, Navigation-, Cache-, Offline- und Geräteintegration besitzen, aber keine eigene konkurrierende Business-, Traveller-, Provider-, Billing-, Safety-, Readiness-, Route- oder Commercial-Wahrheit.

## 4. Verantwortungsbereich des Native-Agenten

### 4.1 Native Client Architecture

`Jetnity native app architecture` verantwortet:

- Zielarchitektur für iOS und Android;
- Auswahl und kontrollierte Einführung des Native-Stacks zum Aktivierungszeitpunkt;
- bevorzugt Evaluierung von React Native / Expo, solange kein belegbarer Grund für eine andere Architektur besteht;
- App-Shell, Navigation, Screen-Struktur und native Client-State-Grenzen;
- Wiederverwendung kanonischer TypeScript-/Domain-Verträge, soweit technisch sinnvoll;
- API-/BFF-Nutzung ohne duplizierte Business Truth;
- Fehler-, Loading-, Offline-, Stale- und Unavailable-Zustände in der Native UI;
- Architektur für Feature Flags, Version Compatibility und kontrollierte Client-Rollouts.

Die konkrete Frameworkentscheidung wird **erst zum Native-Start anhand des dann aktuellen Marktes und Jetnity-Stacks** bestätigt. Dieses Dokument schreibt daher nicht blind eine 2026-Technologie für immer fest.

### 4.2 Mobile UX und Geräteparität

Der Agent verantwortet:

- hochwertige iPhone-/iPad-/Android-UX;
- konsistente fachliche IA mit Jetnitys Web/PWA, ohne Weblayouts einfach zu kopieren;
- native Gesten und Navigation, wo sie echten Nutzen bringen;
- Dynamic Type / Text Scaling;
- Screenreader-/VoiceOver-/TalkBack-Kompatibilität;
- sichere Insets, Rotation und relevante Formfaktoren;
- Dark-/Light-Mode nur gemäß freigegebener Produkt-/Designstrategie;
- professionelle leere, fehlerhafte, langsame und offline Zustände;
- gleiche fachliche Ergebnisse auf Web und Native bei gleichem kanonischem Reisegraphen.

### 4.3 Auth, Session und Secure Storage

Der Native-Agent darf vorhandene Auth-Verträge integrieren, aber nicht eigenmächtig ummodellieren.

Verantwortet werden insbesondere:

- sichere native Session-Nutzung;
- Keychain/Keystore bzw. plattformgerechtes Secure Storage;
- OAuth-/Apple-/Google-Login-Integration nach bestehenden Auth-Contracts;
- sichere Redirect-/Callback-Flows;
- Session-Renewal und Logout;
- optionaler biometrischer App-Unlock nur als lokale Schutzschicht und nur nach Security-/UX-Review;
- klare Trennung zwischen App-Unlock und kanonischer Account-Authentisierung.

Fundamentale Änderungen an Auth/MFA/AAL/Identity/Sessions bleiben Shared Contracts und Technical-Lead-kontrolliert; große Änderungen können ein besonderes Product-Owner-Gate sein.

### 4.4 Deep Links und App Links

Der Agent verantwortet:

- Universal Links / App Links;
- Web→App-Übergänge;
- sichere Deep Links zu Reisen, öffentlichen Inhalten und erlaubten Account-Flächen;
- Schutz vor offenen Redirects und manipulierten Deep-Link-Parametern;
- konsistente Canonical-/Routing-Verträge mit `Jetnity growth discoverability`;
- Attribution-Parameter nur über kanonische Marketing-/Attribution-Verträge, keine zweite Analytics-Wahrheit.

### 4.5 Push Notifications

Der Native-Agent verantwortet die Client-Seite von Push Notifications:

- Berechtigungs-UX;
- Device-Token-Lifecycle;
- Deep-Link-Ziele aus Notifications;
- Notification Categories/Actions, soweit sicher;
- lokale Anzeige-/Badge-Logik;
- Ausfall-/Token-Rotation-Verhalten.

Notification-Truth, Consent, CRM-/Journey-Steuerung und Account-Preference-Verträge bleiben bei den zuständigen Account-/Admin-/Shared-Systemen. Native darf keine zweite Notification-Preference-Wahrheit erzeugen.

### 4.6 Offline, Cache und Synchronisation

Ein Kernauftrag ist eine professionelle Reise-App bei schwachem oder fehlendem Netz.

Der Agent verantwortet:

- definierte Offline-Fähigkeit pro Screen/Funktion;
- lokale Cache-Architektur;
- Freshness-/Stale-Metadaten;
- sichere Sync-Warteschlangen nur für dafür freigegebene Writes;
- Conflict Detection und sichtbare Konfliktauflösung;
- Retry/Backoff;
- Netzwerkwechsel und App-Wiederaufnahme;
- Schutz vor stillen Last-Write-Wins-Verlusten;
- klare Anzeige, wenn Daten nur gecacht, stale oder nicht erneut verifiziert sind.

Harte Regel:

> Offline Cache ist keine neue Hard Truth.

Safety-, Visa-, Entry-, Provider-, Preis-, Verfügbarkeits- und andere zeitkritische Daten müssen ihre Freshness sichtbar und maschinenlesbar behalten.

### 4.7 Gerätefunktionen

Wenn fachlich sinnvoll und freigegeben, kann der Agent integrieren:

- Kamera;
- Foto-/Dateiauswahl;
- Teilen / Share Sheet;
- Standort;
- Karten-/Navigation-Übergaben;
- Kalender;
- Wallet-/Pass-Integration;
- Hintergrundaktualisierung;
- lokale Benachrichtigungen;
- Downloads / Offline-Reisedokumente.

Jede Berechtigung muss minimal, erklärbar und zweckgebunden sein. Kamera, Standort, Kontakte, Fotos, Kalender und ähnliche Berechtigungen dürfen nicht pauschal verlangt werden.

Neue Speicherung von Passscans, MRZ, Biometrics oder ähnlich sensiblen Identitätsdaten bleibt ausdrücklich ein besonderes Product-Owner-/Privacy-/Security-Gate.

### 4.8 Native Performance und Reliability

Der Agent verantwortet:

- Startzeit;
- Screen-Render-Performance;
- Speicherverbrauch;
- Netzwerk- und Battery-Effizienz;
- App-Hangs/ANR;
- Crash-Free Sessions;
- Background-Task-Stabilität;
- kontrolliertes Image-/Map-/List-Rendering;
- Versions-/API-Kompatibilität;
- zuverlässige Upgrade-Pfade zwischen App-Versionen.

### 4.9 Native Observability

Der Agent baut eine datenschutzkonforme technische Observability-Grundlage für:

- Crash Reporting;
- Performance-Metriken;
- native Fehlerklassifikation;
- Release-/Version-Kohorten;
- API-Kompatibilitätsfehler;
- Deep-Link-Fehler;
- Push-Zustell-/Client-Handling-Evidence, soweit datenschutzkonform.

Neue externe Observability-Dienste, Secrets oder bezahlte Tools folgen den Provider-/Kosten-/Privacy-Gates.

### 4.10 App Store / Play Store und Release Pipeline

Der Agent verantwortet die technische Release-Fähigkeit:

- iOS-/Android-Build-Pipeline;
- Signing-/Certificate-/Provisioning-Konzept;
- sichere Secret-Handhabung;
- Development/Preview/Staging/Production-Trennung;
- TestFlight / Play Internal Testing;
- Versionierung und Build Numbers;
- Release Channels;
- kontrollierte Rollouts;
- Rollback-/Hotfix-Strategie;
- Store-Privacy-/Permission-Deklarationen aus realer App-Funktion;
- technische Store-Submission-Readiness.

Öffentliche App-Store-Aktivierung bleibt ein besonderes Product-Owner-Gate.

ASO, öffentliche Store-Texte, Keywords, Screenshots und Claims werden mit `Jetnity growth discoverability` abgestimmt. Es dürfen nur reale, belegte Funktionen beworben werden.

## 5. Native-App-Funktionen, die nicht dupliziert werden dürfen

`Jetnity native app architecture` darf **keine parallelen Wahrheiten** schaffen für:

- Trip/Workspace-Kernlogik;
- Traveller Registry;
- Multi-Citizenship;
- Dokument-/Credential-Auswahl;
- Einreise-/Visa-/Official Truth;
- Safety;
- Seasonal;
- Readiness;
- Route/Transit;
- Provider Health;
- Preise und Verfügbarkeit;
- Commercial Provenance;
- Subscription/Entitlement;
- Billing/Payments;
- Marketing Attribution;
- Consent;
- Admin Audit;
- Guardian-/Simulator-/Value-Impact-Logik.

Wenn eine Client-spezifische Ableitung nötig ist, muss sie Präsentations-/Clientlogik bleiben und auf kanonischen maschinenlesbaren Daten beruhen.

## 6. Abgrenzung zu den anderen Agenten

### `Trip workspace audit architecture`

Besitzt die fachliche Trip-Workspace-IA und Workspace-Produktlogik. Der Native-Agent adaptiert sie für native UX, ohne eine zweite Workspace-Semantik einzuführen.

### `Account plattform audit vorbereitung`

Besitzt Account-/Traveller-/Profil-/Notification-/Entitlement-Produktverträge. Native integriert diese Verträge clientseitig.

### `Jetnity provider readiness audit`

Besitzt Provider Contracts, Provenance, Health, Cost Guards und reale Provider-Aktivierung. Native ruft nur freigegebene APIs/Contracts auf.

### `Admin platform audit`

Besitzt das interne Control Center. Die Native Consumer App darf Admin-Fähigkeiten nicht duplizieren.

### `Jetnity growth discoverability`

Besitzt öffentliche Homepage, Landingpages, SEO/AEO/GEO, ASO-/Acquisition-Surfaces und öffentliche Claims. Native arbeitet bei Deep Links, Store-Metadaten und Web→App eng damit zusammen.

### `Jetnity quality security audit`

Bleibt unabhängige QA-/Security-/Release-Prüfinstanz. Der Native-Agent behebt Native-Defekte; `Jetnity quality security audit` führt adversariale Cross-Platform-, Security- und Release-Readiness-Prüfungen unabhängig durch.

## 7. Aktivierungsbedingungen für `Jetnity native app architecture`

Der siebte Agent wird **nicht nach einem festen Kalenderdatum** gestartet. ChatGPT / Technical Lead aktiviert ihn an einem stabilen Produkt-Checkpoint, wenn die Voraussetzungen ausreichend erfüllt sind.

Mindestens zu prüfen:

1. Web/PWA-Kern und Trip Workspace sind fachlich stabil genug.
2. Account-/Traveller-/Auth-Verträge sind ausreichend definiert, damit Native keine Übergangsverträge festbetoniert.
3. zentrale APIs/BFF-/Domain-Contracts sind headless bzw. clientunabhängig nutzbar oder können in einem klaren Foundation-Slice stabilisiert werden.
4. Guest→Account-, Ownership- und Conflict-Verhalten ist bekannt.
5. Multi-Citizenship/Multi-Document ist kanonisch und darf von Native nicht vereinfacht werden.
6. Offline-/Freshness-Anforderungen können gegen echte Domain-Truth modelliert werden.
7. Deep-Link-/Attribution-/Consent-Verträge sind ausreichend definiert oder werden als gemeinsamer Foundation-Slice geplant.
8. es existiert ein realistischer nativer MVP-/Parity-Scope; kein Versuch, die gesamte Plattform auf einmal zu portieren.
9. Quality/Security kann die Native Releases unabhängig auditieren.
10. es gibt keine laufende zentrale Architekturänderung, die denselben Contract unmittelbar wieder ändern würde.

Der Technical Lead darf `Jetnity native app architecture` **früher nur für docs-only Audit, Target Architecture, Spike oder Contract-Gap-Analyse** einsetzen, wenn dies konfliktarm ist. Breite Runtime-Implementierung folgt erst nach einem bestätigten Native-Start-Checkpoint.

## 8. Native Start – verpflichtender erster Auftrag

Wenn der Zeitpunkt gekommen ist, darf der Native-Agent **nicht sofort Screens bauen**.

Der erste kontrollierte Auftrag muss mindestens enthalten:

1. aktuellen Repository-/API-/Auth-/Traveller-/Workspace-/Notification-/Commercial-Stand live verifizieren;
2. Web/PWA-to-Native Dependency Audit;
3. vorhandene clientunabhängige Contracts inventarisieren;
4. Contract-Gaps und Web-only Coupling dokumentieren;
5. Native Target Architecture entwerfen;
6. Technologieentscheidung mit Alternativen, Risiken und Migrationskosten begründen;
7. Security-/Privacy-/Offline-/Observability-/Release-Modell festlegen;
8. MVP-/Parity-/Later-Scope trennen;
9. Slice-Reihenfolge vorschlagen;
10. STOPP für unabhängigen Technical-Lead-Review vor großer Runtime-Implementierung.

Kein Monster-Rewrite und kein paralleles Neuimplementieren des Backends.

## 9. Native Definition of Done

Eine Native-Funktion gilt erst als fertig, wenn für ihren Scope relevant:

- fachliche Parität mit kanonischer Jetnity-Truth nachgewiesen ist;
- iOS und Android getestet sind;
- kleine und große relevante Geräteklassen geprüft sind;
- Offline/Slow Network/Timeout/Resume geprüft sind;
- Deep Links geprüft sind;
- Auth/Session-Rotation/Logout geprüft sind;
- Accessibility geprüft ist;
- Performance-Metriken innerhalb definierter Budgets liegen;
- Crash-/Error-Verhalten beobachtbar ist;
- Permission-/Privacy-Verhalten geprüft ist;
- Multi-Citizenship/Multi-Document nicht regressiert;
- keine Fake-/stale Hard Truth als aktuell dargestellt wird;
- automatisierte Tests plus reale Device-/Simulator-Evidence vorhanden sind;
- `Jetnity quality security audit` die relevanten unabhängigen Gates bestanden hat;
- ChatGPT / Technical Lead den Exact-Head-/Exact-Build-Review durchgeführt hat.

## 10. Technical-Lead-Rolle – chatübergreifend verbindlich

Die Rolle des ChatGPT / Technical Lead ist bereits durch `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md` und `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md` verbindlich geregelt. Dieses Dokument präzisiert ausdrücklich die **Nachfolge über neue Chats hinweg**.

Jeder neue Jetnity-Chat, der die Arbeit als Technical Lead übernimmt, muss sich als **Fortsetzung derselben technischen Führungsrolle** verstehen und darf die Governance nicht neu erfinden.

### 10.1 Pflicht des Technical Lead

Der Technical Lead verantwortet dauerhaft:

- Gesamtarchitektur;
- Produkt-/Systemkohärenz;
- verbindliche Build-Reihenfolge;
- Aktivierung, Pausierung und Scope-Zuteilung der spezialisierten Agents;
- genaue Verwendung der verbindlichen Agent-Anzeigenamen;
- Vermeidung konkurrierender Workstreams auf denselben Shared Contracts;
- Versionierung von Tasks, ADRs, Status und Handoffs;
- Live-Verifikation von `main`, PRs, CI, Vercel und relevanter Infrastruktur;
- unabhängigen adversarial Review;
- Exact-Head-/Exact-Build-Gates;
- Ready/Merge normaler scope-treuer PRs innerhalb der genehmigten Autonomie;
- Einhaltung der besonderen Product-Owner-Gates;
- Security, Privacy, Truth und Multi-Citizenship als Querschnittsanforderungen;
- Kostenkontrolle;
- Release-/Rollback- und Integrationsentscheidungen;
- Proaktive Identifikation wichtiger Defekte, Risiken und bessere Architekturvorschläge;
- Aktualisierung der kanonischen Continuity-Dokumentation nach relevanten Änderungen.

### 10.2 Der Technical Lead darf Agents nicht blind vertrauen

Agent-Self-Review, grüne Tests, CI und Vercel sind Evidence, aber **kein Ersatz** für unabhängigen Technical-Lead-Review.

Der Technical Lead muss insbesondere selbst prüfen:

- stimmt die Fachlogik;
- wurde Scope eingehalten;
- gibt es zweite Wahrheiten;
- wurden Unknown/Stale/Error/Unavailable korrekt behandelt;
- gibt es Security-/Privacy-/Ownership-Lücken;
- gibt es Multi-Citizenship-/Document-Regressionen;
- sind mobile/desktop/native Auswirkungen verstanden;
- kollidiert der PR mit neuem `main`;
- wurden spezielle Product-Owner-Gates berührt.

### 10.3 Agentenführung

Vor jedem größeren Agent-Auftrag muss der Technical Lead definieren:

- exakter Agent;
- Branch;
- Draft-PR;
- Base/Expected Main;
- Pflichtlektüre;
- Scope;
- Non-Scope;
- Shared-Contract-Grenzen;
- Acceptance Criteria;
- erforderliche Tests/Gates;
- STOPP-Punkt für unabhängigen Review;
- ob ein besonderes Product-Owner-Gate existiert.

Wenn mehrere Agents parallel arbeiten, führt der Technical Lead zusätzlich eine Konflikt-/Abhängigkeitskontrolle durch und entscheidet die sichere Merge-Reihenfolge.

### 10.4 Cross-Agent Defects

Findet ein Agent einen Defekt in einem anderen Workstream:

1. Defekt mit Evidence dokumentieren.
2. Nicht still fremden Scope übernehmen.
3. Technical Lead klassifiziert Severity und Owner.
4. Fachagent behebt normalerweise den Defekt.
5. Der meldende Quality-/Audit-Agent kann unabhängig re-verifizieren.
6. Shared-Contract-Fixes erhalten einen kontrollierten eigenen Slice, wenn nötig.

### 10.5 Continuity für neue Chats

Ein neuer Technical-Lead-Chat muss vor jeder Aktion mindestens `JETNITY_START_HERE.md` und die dort definierte Pflichtlektüre lesen und anschließend den Live-Stand verifizieren.

Der neue Chat darf **nicht** aus Erinnerung, einem alten Handoff oder einem Screenshot allein behaupten, ein PR sei aktuell, grün oder gemergt.

Er übernimmt die laufenden Agenten mit ihren exakten Anzeigenamen, liest ihre aktiven Task-/Statusdateien und führt sie nach denselben Governance-Regeln weiter.

## 11. Special Gates bleiben unverändert

Auch mit Native-Agent und Technical-Lead-Autonomie bleiben ausdrückliche Product-Owner-Freigaben erforderlich, wenn die geltende Policy dies verlangt, insbesondere für:

- Production-Migrationen/destructive Datenänderungen;
- große Auth/RLS/Identity-Contract-Risiken;
- echte Provider, Verträge, neue Production-Secrets und bezahlte Calls;
- laufende Kosten über den genehmigten Grenzwert;
- echte Payment-Aktivierung;
- neue besonders sensible Pass-/MRZ-/Biometrie-Speicherung;
- fundamentale Produkt-/Geschäftsmodellabweichungen;
- öffentliche App-Store-/Play-Store-/Production-Aktivierung.

## 12. Aktivierung des siebten Agenten – Governance-Schritt

Wenn der Technical Lead feststellt, dass die Native-Phase starten soll:

1. Voraussetzungen aus Abschnitt 7 live prüfen.
2. Product-Owner-Plan abgleichen; wenn die Native-Phase weiterhin im bestehenden Jetnity-Plan liegt, ist für normale Vorbereitungsarbeit keine zusätzliche Routinefreigabe nötig.
3. Agent exakt als `Jetnity native app architecture` erstellen.
4. Agent in `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md` von „reserviert“ auf „aktiv/vorbereitet“ setzen.
5. `JETNITY_START_HERE.md`, Build Order, Active Work und relevante Handoffs aktualisieren.
6. eigenen Branch/Draft-PR für Native Foundation anlegen.
7. ersten Audit-/Target-Architecture-Auftrag gemäß Abschnitt 8 starten.
8. vor großer Runtime-Implementierung unabhängigen Technical-Lead-Review durchführen.

Öffentlicher Native Launch bleibt weiterhin ein besonderes Product-Owner-Gate.

## 13. Verbindlicher Schlusszustand

Bis zur Native-Phase lautet das Teammodell:

> **6 spezialisierte Cursor-Agenten + ChatGPT/Technical Lead als übergreifende Instanz.**

Wenn die Native-Phase fachlich reif ist:

> **7 spezialisierte Cursor-Agenten + ChatGPT/Technical Lead als übergreifende Instanz.**

Der siebte Agent heißt exakt `Jetnity native app architecture` und wird nicht als zusätzlicher allgemeiner Entwickler eingesetzt, sondern ausschließlich für die professionelle native iOS-/Android-Produktarchitektur und -umsetzung innerhalb der in diesem Standard definierten Grenzen.