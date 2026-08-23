# Jetnity – Account & Trip Workspace Product Model

Stand: 23. August 2026  
Status: **verbindliches Produktmodell**

## 1. Grundtrennung

Jetnity trennt dauerhaft zwei Ebenen:

> **Benutzerkonto = persönliches, dauerhaftes Zuhause des Kunden in Jetnity.**

> **Trip Workspace = operative Kommandozentrale genau einer konkreten Reise.**

Diese Ebenen dürfen UX-seitig und fachlich nicht zu zwei nahezu identischen Dashboards verschmelzen.

## 2. Benutzerkonto – Zweck

Das Benutzerkonto beantwortet reiseübergreifend:

- Wer bin ich?
- Welche Reisen gehören zu mir?
- Welche Reisenden/Familienmitglieder verwalte ich?
- Welche dauerhaften Präferenzen, Favoriten und Einstellungen gelten?
- Welches Abo nutze ich?
- Wie sind Sicherheit, Datenschutz, Benachrichtigungen und verbundene Dienste konfiguriert?

### Zielbereiche

1. **Übersicht**
   - persönliche Begrüßung
   - nächste/aktive Reise
   - `Reise fortsetzen`
   - reiseübergreifend wichtige offene Punkte/Hinweise
   - kompakte letzte Aktivität

2. **Meine Reisen**
   - kommende, aktive, vergangene und archivierte Reisen
   - öffnen/fortsetzen
   - später duplizieren/teilen/einladen
   - Löschen nur kontrolliert
   - Guest→Account ohne Datenverlust oder Duplikate

3. **Reisende**
   - Accountbesitzer ist nicht automatisch einziger Traveller
   - stabile Traveller-Profile für Partner/Kinder/Mitreisende
   - Wohnsitz
   - mehrere Staatsbürgerschaften
   - mehrere Dokumente
   - explizite Dokument↔Staatsbürgerschaft-Zuordnung
   - keine erfundene Passport-/Credential-Auswahl

4. **Persönliches Reiseprofil**
   - Sprache, Währung, Zeitzone
   - freiwillige Reisepräferenzen
   - Flug-/Sitz-/Gepäck-/Unterkunft-/Mobilitäts-/Budgetpräferenzen
   - ausdrücklich angegebene und abgeleitete Präferenzen bleiben unterscheidbar

5. **Favoriten & Reisegedächtnis**
   - gespeicherte Ziele/Hotels/Aktivitäten/Orte
   - Wunschlisten
   - besuchte/geplante Orte und später persönliche Weltkarte
   - Nutzerkontrolle über abgeleitete Präferenzen

6. **Buchungen & Reservierungen – reiseübergreifende Sicht**
   - Übersicht hinterlegter Flug-/Hotel-/Mietwagen-/Aktivitäts-/Transferbuchungen
   - Quelle und Status transparent
   - Jetnity ist nicht automatisch Verkäufer

7. **Benachrichtigungen**
   - zentrale Kanal-/Themensteuerung
   - Einreise, Safety, Seasonal/Weather, Buchungs-/Flugänderungen, Reiseerinnerungen, später Preisbeobachtungen
   - Push/E-Mail, später weitere Kanäle nur mit expliziter Kontrolle

8. **Abonnement & Zahlungen**
   - Tarif, Leistungen, Nutzung, Rechnungen, Zahlungsmethode
   - Upgrade/Downgrade/Kündigung transparent

9. **Sicherheit**
   - Passwort
   - MFA
   - später Passkeys
   - aktive Sessions/Geräte
   - Abmelden aller Geräte
   - Sicherheitswarnungen und Wiederherstellung

10. **Datenschutz & Daten**
    - Einwilligungen
    - Datenexport
    - Kontolöschung
    - verbundene Dienste widerrufbar
    - transparente Datennutzung

11. **Dokumente**
    - zunächst nur notwendige strukturierte Angaben
    - keine Passnummern, Scans, MRZ oder Biometrie in der aktuellen Foundation
    - echter Dokumententresor erst später nach separater Security-/Encryption-/Privacy-Architektur und Product-Owner-Gate

12. **Support & Kontoaktivität**
    - Hilfe/Support
    - wichtige Kontoänderungen nachvollziehbar

### Sichtbare Hauptnavigation des Kontos

Nicht überladen. Ziel sind ungefähr:

- Übersicht
- Reisen
- Reisende
- Favoriten
- Abonnement
- Einstellungen

Tiefe Funktionen liegen darunter.

## 3. Trip Workspace – Zweck

Der Workspace beantwortet für **eine konkrete Reise**:

- Was ist diese Reise?
- Was steht bereits fest?
- Was fehlt?
- Was ist jetzt wichtig?
- Welche Risiken/offenen Entscheidungen gibt es?
- Was sollte der Kunde als Nächstes tun?

### Was der Kunde dort macht

1. Reise/Etappen aufbauen und bearbeiten.
2. Flüge suchen, vergleichen, auswählen und Status verwalten.
3. Unterkünfte suchen, vergleichen, auswählen und Status verwalten.
4. Aktivitäten entdecken, auswählen und in die Reise einbauen.
5. Mobilität, Transfers und Mietwagen planen.
6. Tagesplan zusammenführen und während der Reise nutzen.
7. Reisevorbereitung verstehen: Readiness/Entry, Traveller-/Credential-Relevanz, Safety, Seasonal und spätere provider-backed Hinweise.
8. Buchungen/Reservierungen im Kontext dieser Reise überblicken.
9. Änderungen und deren Cross-Domain-Auswirkungen verstehen.
10. Vor und während der Reise den nächsten sinnvollen Schritt erkennen.

### Zeitlicher Modus

- **Vor der Reise:** planen, vergleichen, entscheiden, vorbereiten.
- **Kurz vor Abreise:** offene Punkte schließen, prüfen, bestätigen.
- **Während der Reise:** Tagesablauf, Buchungen, Mobilität, Hinweise und Änderungen.
- **Nach der Reise:** Reisehistorie, besuchte Orte, später Reisebuch/Erinnerungen.

## 4. Account ↔ Workspace Zusammenspiel

Beispiel:

`Account → Meine Reisen → Bali → Trip Workspace`

Das Konto kennt alle Reisen. Der Workspace kennt genau die aktuell geöffnete Reise.

Traveller-Profile werden im Konto dauerhaft verwaltet. Eine Reise referenziert, welche Traveller teilnehmen. Readiness/Entry/Document-Logik bewertet anschließend **pro Traveller und pro Reise** die relevanten Fakten.

Favoriten können reiseübergreifend im Konto liegen und bei Bedarf in einen Workspace übernommen werden.

Abo, globale Sicherheit, globale Datenschutz- und Benachrichtigungseinstellungen gehören nicht in den Workspace.

## 5. Harte Produktgrenzen

- Kein zweites Trip-Graph-Modell im Benutzerkonto.
- Keine Kopie des Workspace als Account-Dashboard.
- Keine Vermischung von Accountbesitzer und Traveller.
- Keine stillen Default-Staatsbürgerschaften oder Credentials.
- Keine reiseübergreifenden Account-Einstellungen als Reise-Truth behandeln.
- Keine wichtige Workspace-Entscheidung nur im UI halten; kanonische Truth bleibt im bestehenden Reisegraphen.
- Gleiche Design-Sprache, aber unterschiedliche Informationsarchitektur.

## 6. Qualitätsziel

Das Benutzerkonto soll sich wie das **persönliche Jetnity-Zuhause** anfühlen.

Der Trip Workspace soll sich wie die **Kommandozentrale einer einzelnen Reise** anfühlen.

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**
