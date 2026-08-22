# Jetnity – Provider Integration Readiness Policy

Stand: 22. August 2026  
Status: **verbindliche globale Architektur-/Produktregel**

## 1. Zweck

Jetnity soll externe Reiseanbieter, Datenquellen und kommerzielle Provider erst in einer späteren finalen Integrationsphase produktiv auswählen und aktivieren. Vor dieser Phase muss Jetnity auf seiner eigenen Seite jedoch **provider-ready** sein.

Leitsatz:

> **Das Produkt wird zuerst provider-neutral fertig. Der echte Provider wird danach angeschlossen – ohne Produkt- oder UI-Neubau.**

Diese Regel gilt für alle Funktionen, deren Wahrheit, Preise, Verfügbarkeit, Fahrpläne, regulatorische Informationen, Safety-/Disruption-Facts, saisonale Informationen, Routing-/POI-Facts oder andere externe Daten später aus einem Provider bzw. einer autoritativen Quelle kommen.

## 2. Wichtige Begriffsgrenze

`Provider-ready` bedeutet nicht, dass ein konkreter Anbieter bereits vertraglich gewählt, bezahlt, mit Live-Secret verbunden oder in Production aktiviert sein muss.

Vor der finalen Providerphase müssen fertig sein:

- interne provider-neutrale Domäne
- klarer Provider-Port / Interface
- validierte interne Request-/Response-Verträge
- Normalisierung von Providerdaten in Jetnity-Facts
- Evidence / Provenance / Freshness, soweit fachlich relevant
- Timeout / Error / Unavailable / Rate-Limit / Invalid-Response-Verhalten
- Kill Switch / Feature Gate
- serverseitige Secret-Grenze
- Client darf keine Provider-Wahrheit setzen
- sichere Übernahme / Nachweis / Snapshot-Logik für kommerzielle Auswahl, soweit relevant
- deterministische bzw. fachlich definierte Ranking-/Entscheidungslogik getrennt vom Provider
- Contract-/Domain-/Security-Tests mit kontrollierten Test-Doubles
- keine Fake-Daten im produktiven Pfad
- UI muss ohne Provider ehrlich funktionieren (`unavailable`, `unknown`, `insufficient_context` etc.)

Der **konkrete provider-spezifische Adapter** wird erst vollständig implementiert, wenn der echte Anbieter und sein aktueller API-Vertrag gewählt wurden. Ein Adapter darf nicht auf Basis angenommener oder erfundener Provider-Schemas gebaut werden.

## 3. Finaler Provideranschluss

Die spätere Providerphase umfasst je Anbieter mindestens:

1. Provider auswählen und fachlich vergleichen.
2. Lizenz, Kosten, Rate Limits, Caching, Datenschutz, Coverage und Nutzungsrechte prüfen.
3. Aktuelle offizielle API-Dokumentation / Sandbox verwenden.
4. Konkreten Adapter gegen den bestehenden Jetnity-Port implementieren.
5. Providerantworten strikt validieren und normalisieren.
6. Contract-/Sandbox-/Failure-Tests durchführen.
7. Security-, Kosten- und Abuse-Schutz prüfen.
8. Preview/Development mit echtem Testzugang verifizieren.
9. Product-Owner-Freigabe für Kosten / Provider / Production einholen.
10. Erst danach Production aktivieren.

Providerwechsel oder ein zweiter Anbieter dürfen keine Neuarchitektur des Trip Workspace oder der Kern-Domäne erfordern.

## 4. Search / Truth / Booking trennen

Jetnity darf nicht voraussetzen, dass ein Anbieter gleichzeitig Suchprovider, Wahrheitsquelle, Booking-/Affiliate-Partner und Persistenznachweis sein muss.

Beispiele:

- Flight Search Provider kann sich vom Affiliate-/Booking-Partner unterscheiden.
- Hotel Search Provider kann sich vom Booking-Partner unterscheiden.
- Regulatory/Safety-Truth braucht eine andere Trust-Klasse als kommerzielle Angebote.
- Routing-/POI-Daten können eine separate Quelle besitzen.

Die internen Verträge müssen diese Trennung erlauben, wenn fachlich sinnvoll.

## 5. Aktueller Readiness-Stand der Kernbereiche

Stand 22.08.2026, vor einem späteren vollständigen Audit:

### Flüge

Bereits stark provider-ready:

- `FlightProvider`-Interface vorhanden
- interne Domäne / Ranking / Orchestrierung getrennt
- Duffel als erster Development-Adapter vorhanden
- Production bleibt gesperrt
- Search und Booking/Affiliate bewusst getrennt

Vor finaler Production trotzdem erneut prüfen: global persistentes Rate-Limit, Provider-/Affiliate-Entscheidung, Sandbox/Live-Vertrag, Offer-Freshness, Monitoring und vollständige Provider-End-to-End-Verifikation.

### Hotels

Provider-neutrale Schicht vorhanden:

- `HotelProvider`
- Suchpipeline / Ranking / Client-Sicht
- `HotelNachweis` als serverseitige Vertrauensgrenze
- Factory aktuell bewusst `null`

Konkreter echter Hoteladapter und produktiver Nachweis fehlen.

### Aktivitäten

Provider-neutrale Schicht vorhanden:

- `ActivityProvider`
- Tageskontext / Ranking / Konfliktlogik
- `ActivityNachweis`
- Factory aktuell bewusst `null`

Konkreter echter Activity-Adapter und produktiver Nachweis fehlen.

### Mobilität / Bahn / Bus / Fähre / Transfers

Provider-neutrale Schicht vorhanden:

- `MobilityProvider`
- gemeinsame Mobilitätsdomäne
- `MobilityNachweis`
- Factory aktuell bewusst `null`

Konkreter echter Mobility-Adapter und produktiver Nachweis fehlen.

### Mietwagen

Provider-neutrale Schicht vorhanden:

- `RentalCarProvider`
- gemeinsame Persistenz / Ranking-Grenzen
- `RentalCarNachweis`
- Factory aktuell bewusst `null`

Konkreter echter Mietwagenadapter und produktiver Nachweis fehlen.

### Travel Requirements / Readiness

Provider-neutrale Requirements-Engine und Provider-Port existieren. Echter regulatorischer Provider fehlt. Vor dessen Anschluss muss Foundation E / Traveller Context / Multi-Citizenship belastbar sein.

### Travel Safety & Disruption

Produkt- und Wahrheitsregel ist verbindlich. Die technische provider-neutrale Provider-/Evidence-Schicht muss in der entsprechenden Foundation gebaut werden, bevor ein echter Safety-/Event-/Official-Source-Anbieter angeschlossen wird.

### Travel Timing & Seasonal Intelligence

Produkt- und Wahrheitsregel ist verbindlich. Die technische provider-neutrale Schicht für Seasonal Pattern / Risk Window / Forecast / Source Evidence muss vor der echten Datenquellenphase gebaut werden.

### Weitere externe Datenabhängigkeiten

Der spätere Provider-Readiness-Audit muss zusätzlich alle anderen externen Datenabhängigkeiten inventarisieren, z. B.:

- Routing / reale Wegezeiten
- POI / Öffnungszeiten
- Live-Status / Schedule Changes
- Preis-/Verfügbarkeitsmonitoring
- Geo-/Referenzdaten, falls externe Aktualisierung nötig
- weitere spätere Reise-Wahrheitsquellen

Nicht annehmen, dass eine Funktion provider-ready ist, nur weil ein API-Endpunkt existiert.

## 6. Provider-Readiness Audit vor finaler Providerphase

Bevor echte Provider systemweit angeschlossen werden, führt Jetnity einen vollständigen **Provider Integration Readiness Audit** durch.

Für jede externe Datenfunktion wird dokumentiert:

- fachlicher Zweck
- interner Source-of-Truth-Vertrag
- vorhandener Port / Interface
- vorhandene Normalisierung
- Trust-/Evidence-Regeln
- Freshness / Invalidierung
- Timeout / Failure / Retry
- Rate-Limit / Abuse / Kostenkontrolle
- Cache-Regeln
- Persistenz / Snapshot / Nachweis
- Guest / Account Verhalten
- Security / Secrets
- UI bei `unknown` / `unavailable`
- Contract-Testbarkeit
- konkreter späterer Provider-Kandidat
- noch fehlende Arbeit vor Anbieteranschluss

Eine Lücke wird geschlossen, bevor der echte Provider angeschlossen wird.

## 7. Rate Limits und Kosten

In-Memory-Rate-Limits sind für Preview/Development zulässig, aber nicht automatisch ausreichend für kommerzielle Production-Provider.

Vor produktiver Aktivierung einer kostenpflichtigen oder missbrauchsanfälligen Providerfunktion muss ein global wirksamer Schutz vorhanden sein, soweit die Provider-/Kostenstruktur dies erfordert.

Keine laufenden Providerkosten ohne bestehende Product-Owner-Kostenfreigabe.

## 8. Reihenfolge

Verbindliche Produktreihenfolge nach aktuellem Product-Owner-Entscheid:

1. Foundation D – Route & Transit Intelligence sauber abschließen.
2. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document.
3. Travel Safety & Disruption Intelligence als provider-neutrale Foundation.
4. Travel Timing & Seasonal Intelligence als provider-neutrale Foundation.
5. Provider-Readiness-Lücken der bestehenden und neuen externen Datenfunktionen vollständig inventarisieren und die **Jetnity-seitigen Ports/Verträge** schließen.
6. Zentralen Trip Workspace / Übersicht auf diesen Wahrheits- und Intelligence-Grundlagen umfassend optimieren.
7. Workspace Intelligence / Cross-Domain Audit durchführen.
8. **Finale echte Provider-Integrationsphase**: Anbieter auswählen, konkrete Adapter bauen/verifizieren, Sandbox/Preview, Kosten-/Security-/Production-Gates.
9. Nach echten Providerintegrationen relevante End-to-End-/Regression-/Truth-Audits nochmals durchführen.
10. Finale Startseiten-Positionierung/-Kommunikation auf Basis der tatsächlich verfügbaren Produktfähigkeiten.

Echte Provider werden also bewusst spät angeschlossen; die Produktarchitektur darf bis dahin nicht von ihnen abhängen.

## 9. Definition of Done

Eine providerabhängige Jetnity-Funktion ist vor der finalen Providerphase nur dann `provider-ready`, wenn ein späterer seriöser Anbieter gegen einen klaren internen Vertrag angeschlossen werden kann, ohne:

- die Kern-UI neu zu bauen,
- den Reisegraphen neu zu modellieren,
- Provider-Rohdaten in die Domäne lecken zu lassen,
- Security-/Truth-Grenzen nachträglich zu erfinden,
- oder Fake-Daten als Zwischenlösung zu verwenden.
