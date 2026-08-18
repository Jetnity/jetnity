# Jetnity – Produktvision

Stand: 15. August 2026
Status: verbindlich

Diese Datei ist die maßgebliche Produktspezifikation von Jetnity V2. Sie hat Vorrang vor bestehendem Code. Wenn Code und diese Datei widersprechen, gilt diese Datei (siehe [AGENTS.md](AGENTS.md) Regel 29).

---

## 1. Was Jetnity ist

Jetnity ist eine moderne, intelligente Reiseplattform, die Menschen bei der kompletten Reiseplanung unterstützt.

Der Kern in einem Satz:

> Der einfachste intelligente Weg, eine komplette Reise von der Idee bis zur Buchung zu planen.

Jetnity reduziert Komplexität. Es erzeugt sie nicht. Der Nutzer soll nicht vor hundert Reiseoptionen und Menüpunkten stehen, sondern schnell zu einer fertigen, verständlichen Reise kommen.

Leitsatz für den Funktionsumfang: **Weniger Funktionen, aber extrem gute Funktionen mit hoher Nutzerbindung und hohem Umsatzpotenzial.**

---

## 2. Was Jetnity nicht ist

Jetnity ist ausdrücklich **nicht**:

- ein Travel-Superportal, das Booking.com, Skyscanner, Expedia, TripAdvisor, Instagram, TikTok und Reisebüros gleichzeitig ersetzt
- nur ein Chatbot
- nur eine Flugsuche
- nur ein Hotelvergleich
- nur ein Affiliate-Blog
- ein soziales Netzwerk
- eine Creator-Plattform
- ein ERP
- eine Kopie von Booking.com oder Skyscanner

---

## 3. Der Produktkern: Intelligent Trip Builder

Der Kern ist **keine klassische Suchmaschine**, sondern der Trip Builder.

Der Nutzer beschreibt seine gewünschte Reise in natürlicher Sprache. Jetnity erzeugt daraus einen strukturierten Reisevorschlag.

Beispieleingabe:

> „7 Tage Thailand im November für zwei Personen. Maximal CHF 3'500. Erst Bangkok und danach Strand."

Erwartetes Ergebnis: eine strukturierte Reise mit Etappen (z. B. Bangkok 3 Nächte, Koh Samui 4 Nächte), je Etappe Flug, Hotel, Transfer und passende Aktivitäten, dazu eine Gesamtkostenübersicht und Alternativen.

Jetnity muss dabei:

- ein Ziel vorschlagen
- passende Flüge finden
- passende Hotels finden
- Aktivitäten vorschlagen
- die Reise strukturieren
- ein Gesamtbudget darstellen
- Alternativen vergleichbar machen
- Änderungen verstehen
- die Reise speichern und später weiterbearbeiten lassen
- Preise und relevante Änderungen berücksichtigen

Der Nutzer soll möglichst wenig manuell zusammensuchen müssen.

---

## 4. Änderung per natürlicher Sprache

Eine bestehende Reise muss über Sprache veränderbar sein. Beispiele:

- „Hotel günstiger."
- „Eine Nacht weniger Bangkok."
- „Besseres Hotel am Strand."
- „Mach Tag 3 entspannter."
- „Wir wollen maximal CHF 3'000 ausgeben."

Jetnity versteht die Änderungsabsicht und aktualisiert die Reise. Vorschläge werden erst nach Nutzerfreigabe übernommen.

---

## 5. Trip Workspace

Nach der Erstellung entsteht ein eigener Arbeitsbereich pro Reise, zum Beispiel:

```
Barcelona · 12.–16. September

Tag 1   Anreise · Hotel Check-in · Abendessen
Tag 2   Altstadt · Sagrada Família · Restaurant
Tag 3   Strand
```

Dazu gehören Flug, Hotel, Aktivitäten, Transfers, Budget und Gesamtpreis. Der Workspace ist der Ort, an dem die Reise lebt.

---

## 6. Prioritäten

1. **Reise erstellen** – sehr schnell zu einer Reise kommen
2. **Reise bearbeiten** – jede Reise flexibel verändern
3. **Reiseprodukte** – Flüge, Hotels und Aktivitäten sinnvoll einbinden
4. **Monetarisierung** – Umsatz aus vorgeschlagenen bzw. gebuchten Leistungen
5. **Persönlicher Reisebegleiter** – Nutzerpräferenzen und Reiseverhalten verstehen

Alles andere ist sekundär.

---

## 7. Monetarisierung

Jetnity verdient **nicht primär** über Abonnements, sondern über Reisevermittlung.

Mögliche Einnahmequellen: Hotel-Affiliate-Provisionen, Flug-Affiliate bzw. API-Provisionen, Aktivitäten, Mietwagen, Transfers, Versicherungen, Reiseprodukte, Partnerangebote, später eventuell Premium-Funktionen.

**Vertrauen ist wichtiger als kurzfristige Klickoptimierung.** Die Oberfläche darf niemals wie eine aggressive Affiliate-Seite wirken.

---

## 8. Benutzererlebnis

Jetnity muss extrem einfach wirken. Der Einstieg ist nicht eine komplexe Suchmaske, sondern eine Frage:

> „Erzähl Jetnity von deiner nächsten Reise."

Klassische Suchformulare dürfen existieren, bestimmen aber nicht die Produktidentität.

---

## 9. Gastmodus

Jetnity muss ohne Konto ausprobierbar sein. Ein neuer Nutzer soll Jetnity öffnen, seine Reiseidee beschreiben, einen Reisevorschlag erhalten und diesen bearbeiten können – **ohne vorher zur Registrierung gezwungen zu werden**.

Ein Konto wird benötigt für:

- dauerhaftes Speichern
- Synchronisierung zwischen Geräten
- mehrere Reisen
- Präferenzen
- gemeinsame Reiseplanung
- spätere personalisierte Funktionen

Ohne Konto ist **genau eine aktive Gastreise** vorgesehen. Sie liegt im Browser und ist an dieses Gerät gebunden. Mehrere gespeicherte Reisen sind eine Leistung des Kontos – das ist die Grenze zwischen Ausprobieren und Benutzen, und sie soll erklärt und nicht versteckt werden.

Vorhandene Gastreisen sollen bei Registrierung bzw. Login sauber in das Benutzerkonto übernommen werden. Umgesetzt seit Phase 1.5; der Weg ist in [docs/REISEN.md](docs/REISEN.md) beschrieben.

---

## 10. Benutzerkonto und Präferenzen

Langfristig darf Jetnity kennen: bevorzugte Abflughäfen, bevorzugte Hotelklasse, Budget, Reisearten, Lieblingsziele, frühere Reisen, Familie bzw. Anzahl Reisende.

Datenschutz und Transparenz haben Vorrang. Keine unnötige Datensammlung.

---

## 11. Jetnity Copilot

Der interne Name des Assistenten ist **Jetnity Copilot**.

Nach außen wird nicht permanent mit „KI" geworben. Jetnity soll wie ein intelligentes Produkt wirken, nicht wie „unser KI-Chatbot". Der Assistent ist Bestandteil des Produkts, nicht das Produktmarketing.

---

## 12. Markt und Sprachen

**Schweiz zuerst.** Zu berücksichtigen: CHF, Schweizer Nutzer, Mehrsprachigkeit, Schweizer Datenschutz (DSG), DSGVO soweit relevant, später Schweizer Zahlungsanbieter.

Domains: `jetnity.ch` und `jetnity.com`. Schweiz zuerst, international später.

Langfristig vorgesehene Sprachen: Deutsch, Englisch, Französisch, Italienisch, Spanisch, Portugiesisch, Polnisch. Die Architektur soll internationalisierbar sein, aber nicht jede Seite muss sofort in sieben Sprachen vorliegen, wenn das den MVP blockiert.

---

## 13. MVP-Ziel

Ein realistisches MVP ermöglicht einem Nutzer:

1. Konto erstellen
2. Reiseidee eingeben
3. eine strukturierte Reise erhalten
4. Reiseziel und Zeitraum festlegen
5. Flugoptionen sehen
6. Hoteloptionen sehen
7. Aktivitäten sehen
8. die komplette Reise im Workspace sehen
9. die Reise per natürlicher Sprache verändern
10. die Reise speichern
11. zu relevanten Buchungspartnern gelangen

Wenn diese Erfahrung hervorragend funktioniert, ist Jetnity wertvoll. Für das MVP braucht es keine 100 Funktionen.

---

## 14. Nicht Bestandteil des MVP

Folgende Bereiche der alten Produktidee sind **nicht automatisch** Bestandteil von V2 und werden nur behalten, wenn sie die Kernstrategie nachweislich stützen:

Creator Hub, Creator Feed, Media Studio, komplexes Story-System, umfangreiches Blogging, Social Network, komplexe Creator Analytics, Kreuzfahrten, Zug, Bus, Fähre, große Content-Plattform.

Der Abbau dieser Module ist freigegeben (siehe [DECISIONS.md](DECISIONS.md)).

---

## 15. Administration und Buchhaltung

Jetnity braucht ein professionelles, aber schlankes Admin-System: Benutzer, Reisen, Buchungs-/Affiliate-Aktivitäten, Travel Provider, Content, Support, Einnahmen, Systemstatus, Audit Logs, Konfiguration, Berechtigungen. Keine Enterprise-ERP-Lösung, bevor sie benötigt wird.

Buchhaltung: Jetnity verwaltet Transaktionen, Provisionen, Umsätze, Auszahlungen, Rechnungsdaten, Refunds und Gebühren. Eine Integration zu **Bexio** soll möglich sein; Bexio kann das führende Buchhaltungssystem sein. Jetnity baut kein eigenes Buchhaltungsprogramm nach.

---

## 16. Erfolgsmaßstab

Bei jeder Funktion gilt:

- Macht sie die Reiseplanung einfacher?
- Erhöht sie die Wahrscheinlichkeit, dass jemand Jetnity wieder benutzt?
- Erhöht sie sinnvoll das Umsatzpotenzial?

Wenn alle drei Antworten Nein sind: **nicht bauen.**

---

## 17. Langfristige Vision

Ein Nutzer soll irgendwann sagen können:

> „Jetnity, wir möchten nächsten Februar für zwei Wochen mit unserem Kind nach Thailand. Wir wollen nicht ständig Hotel wechseln, gutes Wetter, schönes Meer und insgesamt maximal CHF 7'000."

Jetnity versteht, wer reist, das Budget, den Zeitraum, die Präferenzen, die akzeptable Flugdauer, die Reiseart und bisherige Reisen – und erstellt daraus eine hochwertige komplette Reise. Der Nutzer muss nicht mehr zehn Websites durchsuchen.
