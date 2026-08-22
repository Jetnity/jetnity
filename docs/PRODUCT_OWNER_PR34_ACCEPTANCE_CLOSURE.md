# Jetnity – PR #34 Product-Owner-Abnahme: Abschluss des Rundgangs

Stand: 22. August 2026  
Status: **Product-Owner-Rundgang abgeschlossen / Merge-Freigabe NICHT erteilt**

## 1. Bedeutung dieses Abschlusses

Der Product Owner hat den schrittweisen visuellen und funktionalen Rundgang durch den aktuellen Reiseanlege-Flow und den Trip Workspace am 22.08.2026 als beendet erklärt.

Das bedeutet ausdrücklich **nicht**:

- keine automatische Merge-Freigabe,
- kein `Mark Ready`,
- keine Production-Migration,
- keine Freigabe externer Provider oder neuer laufender Kosten.

PR #34 bleibt bis zu einer ausdrücklichen aktuellen Product-Owner-Freigabe Draft und ungemergt.

## 2. Ergebnis der Abnahme

Die technische Foundation-D-Route-/Transit-Arbeit war bereits vor dem Rundgang durch Human-/Architecture-/Security-/Truth-Review ohne offenen Foundation-D-Codeblocker bewertet worden.

Der Product-Owner-Rundgang hat wichtige **produktweite** Anforderungen und Qualitätsverschärfungen ergeben. Diese sind verbindlich, sollen aber nicht unkontrolliert in den bereits großen Foundation-D-PR hineingemischt werden.

Es wurde während des Rundgangs keine ausdrückliche Ablehnung der Foundation-D-Grundidee `Route Truth / Transit Intelligence` ausgesprochen. Die neu gefundenen Hauptthemen betreffen überwiegend Trip Builder, Guest UX, globale Informationsarchitektur, Traveller Context und den späteren zentralen Workspace-Umbau.

## 3. Verbindlich bestätigte Produktentscheidungen aus dem Rundgang

### 3.1 Mehrere Reiseziele von Anfang an

- Startseite und Planungsflow müssen mehrere geordnete Nutzerziele/Etappen unterstützen.
- Progressive Aktion nach erstem Ziel, z. B. `+ Weiteres Ziel hinzufügen`.
- Kein starres Ziel-1/Ziel-2/Ziel-3-Modell.
- Alle Ziele verlustfrei in den nächsten Planungsschritt übernehmen.
- Ziele später hinzufügen, entfernen, ersetzen und reorderbar machen.
- Derselbe Ort darf mehrfach als eigene Etappe vorkommen.
- Bestehendes `trip_stages`-Modell wiederverwenden; kein Shadow-Graph.
- Nutzerziele strikt von Foundation-D-Transitpunkten unterscheiden.
- Spätere Routenoptimierung nur als Vorschlag, nie still reorder.

### 3.2 `Meine Reisen` bleibt zentraler Reise-Hub

- Konzept und Zwischenweg bleiben erhalten.
- Account kann mehrere Reisen verwalten.
- Gastregel bleibt zunächst: genau eine aktive Gastreise.
- Bei aktiver Gastreise darf `Neue Reise` nicht still einen zweiten parallelen Entwurf versprechen oder den bestehenden Entwurf überschreiben.
- Bevorzugt `Reise fortsetzen`; neue Reise nur über klaren Konto-/Ersetzen-/Löschen-Entscheidungsweg.
- Mehrziel-Reisen müssen in Reisekarten als geordnete Route verständlich erkennbar sein.

### 3.3 Gast muss die Ein-Reise-Grenze verstehen

- Ohne Konto darf die Ein-Reise-Grenze nicht erst durch einen Fehler sichtbar werden.
- Ruhige, klare Erklärung spätestens beim Erstellen bzw. auf `Meine Reisen`.
- Mehrere Ziele innerhalb einer Reise zählen weiterhin als **eine** Gastreise.
- Niemals still überschreiben.

### 3.4 Reise anlegen: keine frühen starren Profil-Chips

- `Ruhig / Ausgewogen / Intensiv` aus dem initialen Erstellungsflow entfernen.
- Interessen-Chips wie Kultur/Natur/Kulinarik/Strand/Abenteuer/Wellness aus dem initialen Erstellungsflow entfernen.
- Ein technischer Default wie `balanced` darf nicht als vom Nutzer bestätigte Präferenz in intelligente Entscheidungen einfließen.
- Primärer weicher Kontext: optionales Freitextfeld `Was ist dir bei dieser Reise wichtig?`.
- Hard Facts und Soft Preferences strikt trennen.
- Freitext-Wünsche später im Workspace sichtbar und einfach bearbeitbar machen.
- Jetnity darf weiche Wünsche nicht ungefragt zu dauerhaften starren Nutzerprofilen verhärten.
- Weitere Präferenzen erst dann gezielt fragen, wenn sie eine konkrete Entscheidung wirklich verbessern.

### 3.5 Trip Workspace ist die wichtigste Produktoberfläche

- Der Trip Workspace / das Reise-Dashboard ist höchste UX-/Logic-/Intelligence-Priorität.
- Er muss die Reise erklären, priorisieren, bewerten, warnen und führen – nicht nur Karten anzeigen.
- Gemeinsame Reise-Wahrheit über alle Fachbereiche.
- Harte Facts, Buchungsstatus, Soft Preferences, Empfehlungen, Warnungen und offene Entscheidungen klar trennen.
- Cross-Domain-Folgeeffekte erkennen und verständlich zeigen.
- Große Änderungen erst nach ausdrücklicher Nutzerfreigabe übernehmen.

### 3.6 Übersicht ist das intelligente Kontrollzentrum

Die Workspace-Übersicht muss auf einen Blick beantworten:

1. Was ist diese Reise?
2. Wie weit ist die Planung?
3. Was fehlt noch?
4. Gibt es Warnungen/Risiken/offene Punkte?
5. Was empfiehlt Jetnity als nächsten sinnvollen Schritt?

Zielrichtung der späteren Informationsarchitektur:

- Reise-Kopf / Gesamtstatus
- `Jetzt wichtig` / nächste sinnvolle Schritte
- priorisierte Warnungen/Risiken
- Fortschritt nach Fachbereichen
- Einreise & persönliche Vorbereitung / Traveller Context
- Tagesplan in sinnvoller Priorität
- Wünsche & Prioritäten / Reiseänderung
- Details progressiv statt alles gleich laut

Die genaue spätere Anordnung wird im professionellen Workspace-Design-/Audit-Prozess finalisiert und darf bestehende Karten-/Tab-Strukturen vollständig hinterfragen.

### 3.7 Geräte-, Viewport- und UX-Parität

Verbindlich für jede unterstützte Bildschirmgröße und jedes Gerät:

- gleiche fachliche Wahrheit,
- gleiche Nutzerkontrolle,
- gleiche Entscheidungslogik,
- logisch durchschaubare Ansicht,
- klare Orientierung und Informationshierarchie,
- Kernfunktionen auf keinem Gerät verloren oder unauffindbar.

Mobile darf progressiver darstellen, Desktop mehr gleichzeitig zeigen. Responsiveness darf keine zweite Produktlogik erzeugen.

Leitsatz:

> **Gleiche Reise. Gleiche Wahrheit. Gleiche Nutzerkontrolle. Gleich verständlich auf jedem Gerät.**

### 3.8 Kein Bestandsschutz für frühere Funktionen

Früher gebaut oder früher grün getestet bedeutet nicht dauerhaft richtig.

Wenn bestehende Funktionen dem heutigen Jetnity-Standard nicht mehr entsprechen, dürfen/sollen sie professionell:

- refaktoriert,
- vereinfacht,
- neu strukturiert,
- auf gemeinsame Sources of Truth umgestellt,
- ersetzt,
- oder nach notwendiger Product-Owner-Freigabe entfernt werden.

Eine Funktion ist erst wirklich fertig, wenn sie nicht nur isoliert, sondern mit allen relevanten Jetnity-Bereichen korrekt zusammenspielt.

### 3.9 Travel Safety & Disruption Intelligence wird gebaut

Verbindliche spätere Produktfähigkeit:

- relevante Kriegs-/Konflikt-/Unruhe-/Naturkatastrophen-/schwere Disruption-Hinweise auf konkrete geplante Reiseziele, Etappen und Routen beziehen,
- keine pauschalen erfundenen Gefahrenurteile,
- keine LLM-Sicherheitswahrheit,
- belastbare aktuelle Quellen/Evidence, räumliche und zeitliche Relevanz,
- priorisierte Warnung im Workspace,
- Auswirkungen auf Route, Flug, Unterkunft, Aktivitäten, Mobilität, Tagesplan und Readiness prüfen,
- sinnvolle Alternativen/Anpassungen vorschlagen,
- niemals eigenmächtig die Reise ändern.

Globale Grundlage: `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`.

## 4. Verbindliche Reihenfolge nach diesem Rundgang

### Schritt A – Foundation D sauber abschließen

PR #34 nicht mit dem kompletten späteren Workspace-Umbau aufblasen.

Vor einer Merge-Entscheidung:

1. Branch gegen aktuelles `main` synchronisieren.
2. Neuere globale Produkt-/Governance-/UX-Dokumente aus `main` erhalten.
3. Konflikte semantisch lösen; keine gültige neuere Wahrheit überschreiben.
4. Prüfen, ob die Synchronisierung Code oder nur Dokumentation verändert.
5. Relevante Tests/Typecheck/Lint/Build/DB-/Security-/UI-Audits entsprechend dem Änderungsumfang erneut ausführen.
6. GitHub CI und Vercel Preview erneut grün verifizieren.
7. `docs/ACTIVE_WORK_STATUS.md`, Handoff und relevante Acceptance-Dokumente auf den echten finalen Head aktualisieren.
8. Danach Product Owner um **separate ausdrückliche Merge-Freigabe** bitten.

Keine Production-Migration mit dem Merge-Gate vermischen.

### Schritt B – Foundation E: Traveller Context & Multi-Citizenship

Nach abgeschlossenem Foundation D ist Foundation E die verbindliche nächste Kernpriorität:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängige rechtlich zulässige Optionen.**

Vor Implementierung muss ein vollständiger eigener Binding Task erstellt und Architecture-/Security-reviewed werden.

### Schritt C – zentraler Workspace-Umbau

Erst mit Route Truth aus D und Traveller Truth aus E den Trip Workspace grundlegend optimieren.

Der Umbau umfasst ausdrücklich auch die in diesem Rundgang bestätigten Trip-Builder-/Guest-/Overview-/Preference-/Informationsarchitektur-Änderungen, soweit fachlich passend.

### Schritt D – Travel Safety & Disruption Intelligence integrieren

Als eigener professioneller Produkt-/Daten-/Evidence-Block; keine schnelle News-Scraping- oder LLM-Warnlösung.

### Schritt E – finaler Workspace Intelligence Audit

Verbindlich nach `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`:

- Senior Product
- Architecture
- UX/Psychologie
- Logic/Truth
- Security/Privacy
- Cross-Domain-Interoperabilität
- frühere Foundations erneut prüfen
- Edge Cases / End-to-End
- Geräte-/Viewport-Matrix
- technische Regressionen

Erst danach finale Product-Owner-Abnahme dieser Workspace-Ausbaustufe.

## 5. Aktueller Merge-Status

Der Product Owner hat mit `Ich bin fertig` den Rundgang beendet, **aber keine ausdrückliche Merge-Freigabe für PR #34 erteilt**.

Daher verbindlich:

- PR bleibt Draft,
- kein Merge,
- kein `Mark Ready`,
- keine Production-Migration,
- zuerst Branch-Synchronisierung + erneute Verifikation + finaler Statusbericht.
