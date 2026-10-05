# Jetnity – Trip Workspace Function-by-Function Audit Mandate

Stand: 23. August 2026  
Status: **verbindliche Product-Owner-Ergänzung zum finalen Workspace Intelligence Audit**

## 1. Product-Owner-Entscheidung

Der spätere große Trip-Workspace-/Übersicht-Block ist ausdrücklich **kein reines Redesign und kein bloßer Struktur-Umbau**.

Er umfasst eine vollständige, gründliche Generalinspektion **jeder bestehenden und neuen Funktion**, die im Trip Workspace sichtbar ist oder seine fachliche Wahrheit, Entscheidungen, Persistenz, Navigation oder Cross-Domain-Logik beeinflusst.

Leitsatz:

> **Nicht nur den Workspace umbauen. Jede Funktion muss erneut beweisen, dass sie fachlich, technisch und im Gesamtsystem richtig gebaut ist.**

Diese Regel ergänzt und verschärft `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`.

## 2. Kein Bestandsschutz / kein Überspringen

Keine Funktion gilt allein deshalb als korrekt, weil sie:

- früher gemergt wurde,
- früher grüne Unit-/Integrationstests hatte,
- in einer früheren Foundation abgenommen wurde,
- aktuell keine offensichtliche UI-Störung zeigt,
- oder isoliert betrachtet funktioniert.

Jede Funktion wird gegen den **dann aktuellen Jetnity-Standard und das dann vollständige Gesamtsystem** erneut geprüft.

## 3. Pflicht: vollständiges Funktionsinventar vor Abschluss

Vor einer finalen Workspace-Abnahme muss ein versioniertes Inventar aller relevanten Funktionen erstellt werden.

Das Inventar umfasst mindestens:

- Reiseübersicht / Workspace-Navigation
- Ziele / Etappen / Multi-Destination
- Flüge / Route / Transit
- Hotels / Unterkunft
- Aktivitäten
- Mobilität / Transfers
- Mietwagen
- Tagesplan
- Budget / Kosten / Coverage
- Booking-/Planungsstatus
- Traveller / Gruppenreisen
- Multi-Citizenship / Multi-Document
- Readiness / Einreise / Vorbereitung
- Safety & Disruption
- Timing & Seasonal Intelligence
- Wünsche & Prioritäten
- Reiseänderungen / Revision / Approval
- Guest-Reise
- Account-Reise
- Guest→Account
- Persistenz / Recovery / Retry
- alle relevanten Empty-/Loading-/Error-/Unknown-/Unavailable-/Stale-Zustände
- alle serverseitigen APIs, Actions, RPCs, DB-Trigger, RLS-/Ownership-Grenzen und Provider-Ports, die diese Funktionen tragen.

Kein relevanter Bereich darf nur deshalb fehlen, weil er historisch in einem anderen PR oder einer anderen Foundation gebaut wurde.

## 4. Pflichtprüfung je Funktion

Für jede inventarisierte Funktion muss nachvollziehbar geprüft werden:

1. **Produktzweck** – löst sie noch das richtige Nutzerproblem und ist sie überhaupt noch sinnvoll?
2. **Fachliche Logik** – stimmen Regeln, Prioritäten, Zustände und Grenzfälle?
3. **Source of Truth** – stammt jeder harte Fakt aus der richtigen kanonischen Quelle? Gibt es doppelte oder konkurrierende Wahrheiten?
4. **Datenfluss** – gehen Informationen beim Übergang zwischen Einstieg, Planung, Hub, Workspace, Guest/Account und Fachbereichen verloren oder ändern unbemerkt ihre Bedeutung?
5. **Cross-Domain-Auswirkungen** – erkennt die Funktion alle relevanten Folgen in anderen Reisebereichen?
6. **Freshness / Invalidierung** – werden abhängige Ergebnisse bei Änderungen korrekt stale, recheck oder neu bewertet?
7. **Security / Ownership / Privacy** – RLS, FKs, Auth, Cross-User-/Cross-Trip-Schutz, sensible Daten und Servergrenzen korrekt?
8. **Failure-Verhalten** – sind Timeout, Fehler, fehlende Providerdaten, `unknown`, `unavailable`, stale Evidence und Teilfehler ehrlich und fail-closed?
9. **Guest / Account** – gleiche fachliche Wahrheit, keine stillen Verluste, sichere Übernahme und Retry-Semantik?
10. **UX / Psychologie** – versteht der Nutzer Zustand, Priorität, nächste Aktion, Konsequenz und Unsicherheit schnell?
11. **Geräteparität** – Smartphone, Tablet, Laptop/Desktop und relevante Browser liefern dieselbe Wahrheit und Nutzerkontrolle.
12. **Tests / Nachweis** – Unit, Integration, Cross-Domain, E2E, Regression und nötige DB-/Security-Tests decken die echte Funktion ausreichend ab.

## 5. Pflicht: nicht nur Komponenten, sondern reale Reiseabläufe

Der Audit muss echte Reiseabläufe sequenziell testen.

Beispielhafte Ketten:

- Reise erstellen → zweites Ziel hinzufügen → Flug wählen → Transit ändert sich → Readiness/Safety/Mobilität/Unterkunft prüfen → Änderung bestätigen/ablehnen.
- Traveller hinzufügen → mehrere Citizenship-/Document-Optionen → Route ändern → travellerabhängige Resultate neu bewerten.
- Hotel wechseln → Transfer-/Aktivitäts-/Tagesplan-Auswirkungen prüfen.
- Safety-Ereignis trifft nur eine Etappe → nur tatsächlich betroffene Bereiche reagieren → Event wird stale/aufgehoben → Zustand korrekt zurückführen.
- Mehrere Änderungen nacheinander → keine inkonsistenten Restzustände.
- Guest-Reise → Bearbeitung → Account-Übernahme → alle Fakten/Status/Intelligence bleiben korrekt.

Ein einzelner grüner Screen oder eine isolierte Komponente reicht nicht.

## 6. Pflicht: Lücken aktiv suchen, nicht nur bekannte Bugs beheben

ChatGPT/Hauptentwickler und Coding Agent müssen ausdrücklich nach unbekannten Fehlern, Lücken und falschen historischen Annahmen suchen.

Zu prüfen ist insbesondere:

- Was funktioniert nur zufällig statt durch klaren Vertrag?
- Welche alte Annahme ist durch spätere Foundations falsch geworden?
- Welche Funktion ist doppelt oder widersprüchlich modelliert?
- Welche Information wird mehrfach abgefragt oder mehrfach gespeichert?
- Welche Funktion fehlt, damit zwei vorhandene Bereiche wirklich zusammenarbeiten?
- Welche bestehende Funktion ist zu kompliziert, fachlich schwach oder heute nicht mehr sinnvoll?
- Welche API-/DB-/UI-Grenze kann bei realen Änderungen inkonsistent werden?
- Welche Edge Cases werden durch die bisherige Testmatrix noch nicht abgedeckt?

## 7. Funde müssen behoben und erneut geprüft werden

Der Audit ist nicht nur ein Bericht.

Konkrete relevante Defekte und Lücken werden:

1. dokumentiert,
2. priorisiert,
3. professionell behoben oder bewusst mit Product-Owner-Entscheidung verschoben,
4. mit Regressionstests abgesichert,
5. anschließend erneut unabhängig geprüft.

Ein Bereich gilt erst als abgeschlossen, wenn die Reparatur selbst verifiziert wurde.

## 8. Evidence-Matrix je Funktion

Der finale Audit-Bericht muss pro relevanter Funktion mindestens festhalten:

- Status: PASS / FIXED+PASS / BLOCKED / bewusstes Follow-up
- geprüfte Code-/DB-/API-Grenzen
- relevante Source(s) of Truth
- Cross-Domain-Abhängigkeiten
- geprüfte Fehler-/Unknown-/Stale-Zustände
- Guest-/Account-Ergebnis
- Security-/Ownership-Ergebnis
- Geräte-/Viewport-Ergebnis
- konkrete Tests / E2E-Szenarien
- offene externe Providerabhängigkeiten
- Product-Owner-Entscheidung, falls erforderlich.

Ohne dieses Inventar ist der Workspace-Audit nicht vollständig.

## 9. Abschlusskriterium

Der große Workspace-Block gilt nicht als fertig, nur weil das neue Design gut aussieht oder die neue Übersicht funktioniert.

Er gilt erst als fertig, wenn:

- **jede relevante bestehende und neue Funktion inventarisiert und geprüft wurde**,
- keine bekannte hochwirksame Logic-/Truth-/Security-/Datenverlust-/UX-Lücke offen ist,
- Cross-Domain-Verhalten realistisch und sequenziell funktioniert,
- frühere Foundations im heutigen Gesamtsystem erneut bestanden haben,
- gefundene Defekte nach Fix erneut verifiziert wurden,
- die vollständige Evidence-Matrix vorliegt,
- und der Product Owner anschließend ausdrücklich abnimmt.

> **Der Workspace ist erst fertig, wenn nicht nur jede Funktion für sich stimmt, sondern die gesamte Reise auch nach realen Änderungen dauerhaft richtig bleibt.**
