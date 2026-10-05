# Jetnity – Produktvision

Stand: 21. August 2026
Status: verbindlich

Diese Datei ist die maßgebliche Produktspezifikation von Jetnity V2. Sie hat Vorrang vor bestehendem Code. Wenn Code und diese Datei widersprechen, gilt diese Datei (siehe [AGENTS.md](AGENTS.md) Regel 29).

---

## 1. Was Jetnity ist

Jetnity ist eine moderne, intelligente Reiseplattform, die Menschen bei der kompletten Reiseplanung unterstützt.

Der Kern in einem Satz:

> Der einfachste intelligente Weg, eine komplette Reise von der Idee bis zur Buchung und durch die Reise hindurch zu organisieren.

Jetnity reduziert Komplexität. Es erzeugt sie nicht. Der Nutzer soll nicht vor hundert Reiseoptionen und Menüpunkten stehen, sondern schnell zu einer fertigen, verständlichen Reise kommen.

Leitsatz für den Funktionsumfang: **Weniger Funktionen, aber extrem gute Funktionen mit hoher Nutzerbindung und hohem Umsatzpotenzial.**

### Verbindlicher Produkt-Nordstern

Jetnity ist **kein Bündel einzelner Suchmaschinen**. Flug, Unterkunft, Aktivitäten, Transfers, Tagesplan, Budget, Reisende, Präferenzen und spätere Reisebereitschafts-/Live-Informationen arbeiten um **dieselbe Reise** herum und sollen sich gegenseitig verstehen.

Der gemeinsame Reisegraph ist die fachliche Grundlage. Ein Bereich darf nicht so entwickelt werden, als wäre der Rest der Reise unbekannt, wenn Jetnity diese Informationen bereits besitzt.

Jetnity soll dem Nutzer insbesondere abnehmen:

- dieselben Reisedaten mehrfach einzugeben
- zwischen vielen Websites und Apps zu wechseln
- selbst zu prüfen, ob Flug, Hotel, Aktivitäten und Transfers zeitlich zusammenpassen
- manuell herauszufinden, welche Nächte, Abschnitte oder Buchungen noch fehlen
- unnötig viele nahezu gleiche Optionen zu vergleichen
- Auswirkungen einer Änderung auf die restliche Reise selbst nachzurechnen
- sich ständig zu fragen, ob etwas Wichtiges vergessen wurde

Verbindliches Prinzip:

> **So viel sinnvolle Arbeit, Suchaufwand, Entscheidungsstress und organisatorische Reibung wie möglich von Jetnity übernehmen – ohne dem Nutzer die Kontrolle über wichtige Entscheidungen zu nehmen.**

Jetnity soll analysieren, erklären und empfehlen. Wichtige Änderungen an der Reise oder an kommerziellen Bestandteilen werden nicht still übernommen, sondern vom Nutzer bestätigt.

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
- eine Ansammlung voneinander isolierter Flug-, Hotel- und Aktivitätssuchen

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
- vorhandene Buchungen, offene Lücken und noch nötige Schritte verständlich zusammenführen
- bereits bekannte Reiseinformationen automatisch wiederverwenden, statt den Nutzer erneut danach zu fragen

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

### Auswirkungen realer Reiseänderungen verstehen

Jetnity behandelt eine Reise als zusammenhängendes System. Ändert sich ein bereits eingeplanter oder gebuchter Bestandteil – zum Beispiel ein Flug wird um einen Tag verschoben –, darf Jetnity nicht nur dieses einzelne Element aktualisieren. Es soll erkennen, welche nachgelagerten Teile der Reise dadurch betroffen sind, und einen verständlichen Anpassungsvorschlag vorbereiten.

Beispiel: Ein Flug kommt einen Tag später an. Jetnity prüft dann unter anderem Hotelnächte, Aktivitäten, Transfers, Anschlussflüge, Aufenthaltsdauer, Budget und zeitliche Konflikte. Es zeigt, **welche Teile betroffen sind**, welche Alternativen bestehen und welche Gesamtlösung unter Berücksichtigung von Zeit, Kosten, Komfort und Reibung am sinnvollsten ist.

Verbindlicher Grundsatz:

> **Änderung erkennen → Auswirkungen auf die Gesamtreise bestimmen → optimierte Anpassung vorschlagen → Vorher/Nachher zeigen → erst nach ausdrücklicher Nutzerfreigabe übernehmen.**

Mit Provider-Anbindungen soll Jetnity solche Änderungen später auch proaktiv erkennen können, zum Beispiel bei einer Flugplanänderung. Eine externe Änderung darf niemals still andere Buchungen oder Reiseelemente verändern. Jetnity informiert, erklärt die Folgen und bereitet eine Lösung vor; der Nutzer entscheidet über die Übernahme.

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

Der Trip Workspace ist das **zentrale Reise-Dashboard**. Von dort soll der Nutzer die wichtigen Bereiche direkt erreichen und ohne Sackgassen wieder zur Gesamtübersicht zurückkommen. Die Übersicht soll nicht nur Links zeigen, sondern den tatsächlichen Zustand der Reise verständlich zusammenfassen: was steht fest, was ist ausgewählt oder gebucht, was fehlt noch und wo braucht der Nutzer als Nächstes eine Entscheidung.

### Hotel- und Quartierlogik

Jetnity darf Hotels nicht losgelöst vom restlichen Reiseplan empfehlen. Bevor konkrete Hotels vorgeschlagen werden, soll Jetnity bestimmen, **in welchem Viertel bzw. in welcher Gegend der Nutzer für genau diese Reise am sinnvollsten wohnen sollte**.

Die Entscheidung soll unter anderem berücksichtigen: geplante Sehenswürdigkeiten und Aktivitäten, Reiseetappen, Flughäfen und Bahnhöfe, Transfers, Aufenthaltsdauer, Budget, tägliche Wegezeiten, Erreichbarkeit zu Fuß und mit öffentlichen Verkehrsmitteln sowie Präferenzen wie Ruhe, Nachtleben, Kulinarik, Strand oder Familienfreundlichkeit.

Danach zeigt Jetnity bewusst nur wenige passende Hoteloptionen, typischerweise 3–5, zum Beispiel **Jetnity empfiehlt**, **Bestes Preis-Leistungs-Verhältnis**, **Beste Lage**, **Ruhigere Alternative** oder **Premium-Option**. Zu jeder Empfehlung erklärt Jetnity nachvollziehbar, warum sie zur konkreten Reise passt und welche Abwägung gegenüber günstigeren oder schnelleren Alternativen besteht.

Beispielprinzip: Ein Hotel darf empfohlen werden, obwohl es etwas teurer ist, wenn dadurch während der gesamten Reise deutlich weniger Transferzeit, weniger Umstiege oder eine bessere Lage zu den geplanten Aktivitäten entsteht. Der günstigste Hotelpreis ist **nicht automatisch** die beste Reiseentscheidung.

Auch innerhalb derselben Stadt kann für verschiedene Aufenthalte eine andere Gegend sinnvoll sein – etwa wenn der letzte Aufenthalt vor einem frühen Rückflug bewusst näher am Flughafen oder an einer passenden Verkehrsanbindung liegen sollte.

Verbindlicher Grundsatz:

> **Nicht zuerst „Welches Hotel ist am billigsten?“, sondern zuerst „Wo sollte der Nutzer für diese konkrete Reise wohnen?“ – danach die besten passenden Hotels in dieser Gegend empfehlen.**

Provisionen oder kommerzielle Providerinteressen dürfen weder die Quartierentscheidung noch das Jetnity-Ranking beeinflussen.

---

## 6. Prioritäten

1. **Reise erstellen** – sehr schnell zu einer Reise kommen
2. **Reise bearbeiten** – jede Reise flexibel verändern und Auswirkungen von Änderungen auf die Gesamtreise verstehen
3. **Reiseprodukte** – Flüge, Hotels und Aktivitäten sinnvoll einbinden
4. **Monetarisierung** – Umsatz aus vorgeschlagenen bzw. gebuchten Leistungen
5. **Persönlicher Reisebegleiter** – Nutzerpräferenzen und Reiseverhalten verstehen
6. **Reisestress reduzieren** – offene Lücken, Konflikte, Änderungen und nächste sinnvolle Schritte automatisch erkennen und verständlich machen

Alles andere ist sekundär.

---

## 7. Monetarisierung

Jetnity verdient **nicht primär** über Abonnements, sondern über Reisevermittlung.

Mögliche Einnahmequellen: Hotel-Affiliate-Provisionen, Flug-Affiliate bzw. API-Provisionen, Aktivitäten, Mietwagen, Transfers, Versicherungen, Reiseprodukte, Partnerangebote, später eventuell Premium-Funktionen.

**Vertrauen ist wichtiger als kurzfristige Klickoptimierung.** Die Oberfläche darf niemals wie eine aggressive Affiliate-Seite wirken.

Eine Empfehlung, die für Jetnity mehr Provision bringt, darf nicht gegenüber einer für den Nutzer besseren Gesamtlösung bevorzugt werden.

---

## 8. Benutzererlebnis

Jetnity muss extrem einfach wirken. Der Einstieg ist nicht eine komplexe Suchmaske, sondern eine Frage:

> „Erzähl Jetnity von deiner nächsten Reise."

Klassische Suchformulare dürfen existieren, bestimmen aber nicht die Produktidentität.

### Die erste Reise als entscheidender Produkttest

Die erste vollständig mit Jetnity geplante und begleitete Reise ist der wichtigste Bindungsmoment des Produkts.

Der Nutzer soll spätestens dabei deutlich erleben:

- Jetnity spart mir Zeit.
- Jetnity reduziert organisatorischen Stress.
- Jetnity erkennt Lücken und Zusammenhänge, die ich sonst selbst prüfen müsste.
- Jetnity gibt mir wenige, verständliche und begründete Entscheidungen statt Option-Overload.
- Ich habe meine ganze Reise an einem Ort und verliere nicht den Überblick.
- Bei Änderungen weiß ich schnell, was betroffen ist und was ich tun sollte.

Das langfristige Produktziel ist eine so hohe praktische Entlastung und Verlässlichkeit, dass Jetnity für wiederkehrende Nutzer zum **selbstverständlichen Ausgangspunkt jeder neuen Reise** wird.

Das bedeutet ausdrücklich **nicht**, künstliche Abhängigkeit, Dark Patterns oder unnötige Benachrichtigungen zu erzeugen. Bindung soll aus realem Nutzen, Vertrauen, Zeitersparnis und geringerem Reisestress entstehen.

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

Diese Informationen sollen genutzt werden, um wiederkehrende manuelle Arbeit zu vermeiden und Empfehlungen besser an die konkrete Reise anzupassen – nicht um unnötig Daten zu sammeln.

Datenschutz und Transparenz haben Vorrang. Keine unnötige Datensammlung.

---

## 11. Jetnity Copilot

Der interne Name des Assistenten ist **Jetnity Copilot**.

Nach außen wird nicht permanent mit „KI" geworben. Jetnity soll wie ein intelligentes Produkt wirken, nicht wie „unser KI-Chatbot". Der Assistent ist Bestandteil des Produkts, nicht das Produktmarketing.

Intelligenz soll vor allem daran sichtbar werden, dass Jetnity Zusammenhänge erkennt, Informationen wiederverwendet, gute Entscheidungen vorbereitet und unnötige Arbeit vermeidet – nicht daran, dass überall ein Chatfenster oder ein „KI“-Label erscheint.

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
12. auf einen Blick erkennen, welche wichtigen Reisebestandteile bereits abgedeckt sind und was noch fehlt

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
- Spart sie dem Nutzer konkret Zeit, Suche, Doppelarbeit oder Entscheidungsstress?
- Nutzt sie vorhandenen Reisekontext sinnvoll, statt einen neuen isolierten Ablauf zu erzeugen?
- Erhöht sie die Wahrscheinlichkeit, dass jemand Jetnity bei der nächsten Reise wieder benutzt?
- Erhöht sie sinnvoll das Umsatzpotenzial, ohne Vertrauen oder Empfehlungsqualität zu verschlechtern?

Wenn die Funktion weder die Reise deutlich verbessert noch notwendigen technischen Unterbau liefert: **nicht bauen.**

Wichtige Produktmetriken sollen langfristig nicht nur Klicks messen, sondern unter anderem Zeit bis zu einer brauchbaren Reise, Zahl unnötiger manueller Schritte, erkannte offene Lücken, erfolgreich gelöste Reiseänderungen, Wiederkehr zur nächsten Reise und Vertrauen in Empfehlungen.

---

## 17. Langfristige Vision

Ein Nutzer soll irgendwann sagen können:

> „Jetnity, wir möchten nächsten Februar für zwei Wochen mit unserem Kind nach Thailand. Wir wollen nicht ständig Hotel wechseln, gutes Wetter, schönes Meer und insgesamt maximal CHF 7'000."

Jetnity versteht, wer reist, das Budget, den Zeitraum, die Präferenzen, die akzeptable Flugdauer, die Reiseart und bisherige Reisen – und erstellt daraus eine hochwertige komplette Reise. Der Nutzer muss nicht mehr zehn Websites durchsuchen.

### Vor und während der Reise mitdenken

Jetnity soll langfristig nicht mit dem Reiseplan oder dem Klick zum Buchungspartner aufhören. Soweit belastbare Daten und Providerzugänge vorhanden sind, soll es vor und während der Reise den Zustand der Gesamtreise verstehen und sinnvolle Arbeit abnehmen.

Beispiele:

- fehlen noch Flugabschnitte oder Hotelnächte?
- sind Buchungen nur ausgewählt oder tatsächlich bestätigt?
- kollidiert eine Aktivität mit einer Ankunft, Abreise oder einem anderen festen Termin?
- verändert eine Flugplanänderung Unterkunft, Transfer, Aktivitäten oder Budget?
- welche wenigen Dinge sollte der Nutzer vor Abreise noch erledigen?
- was ist heute bzw. morgen für diese konkrete Reise relevant?

Dabei gilt immer:

- keine erfundenen Live-Fakten
- keine stillen Änderungen an Buchungen
- keine unnötigen Warnungen oder Benachrichtigungen
- Unsicherheit klar benennen
- Auswirkungen auf die Gesamtreise erklären
- sinnvolle Lösung vorbereiten
- bei wichtigen Änderungen den Nutzer entscheiden lassen

Das Zielbild ist nicht „mehr Features“, sondern ein Reisebegleiter, der die **richtige Information und die richtige nächste Handlung im richtigen Moment** liefert und dadurch spürbar Arbeit und Stress reduziert.
