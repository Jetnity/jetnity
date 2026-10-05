# Jetnity – Three-Phase Product Strategy

Stand: 1. September 2026  
Status: **KANONISCHE PRODUCT-OWNER-STRATEGIE / BINDING / LIVE-EVIDENCE WINS**

Diese Datei ist zusammen mit ADR-0204 die kanonische Produktphasen-Spezifikation. Sie ergänzt `JETNITY_PRODUCT_MANDATE.md` und `JETNITY_VISION.md`; sie ersetzt keine korrekt gebaute Architektur.

## Product North Star

Jetnity soll die konkrete Reise, den Traveller und den Reiseprozess besser zusammenführen als ein einzelner Buchungsdienst. Der langfristige Vorteil soll nicht „mehr Features“ sein, sondern bessere Reise-Truth, bessere Entscheidungen, geringere Reibung und mit wachsender Nutzung stärkere Daten-/Netzwerkeffekte.

## Phase 1 – JETNITY CORE

### Ziel

> **Die konkrete Reise vollständig beherrschen.**

Ein echter Nutzer muss eine konkrete Reise professionell planen, organisieren und reisebereit durchführen können.

Kern-User-Journey:

`Reise erstellen → Traveller erfassen → Route/Destination/Transit verstehen → Reiseoptionen vergleichen → Reise organisieren → Einreisebereitschaft prüfen → notwendige Handlungen verstehen → vor und während der Reise intelligent begleitet werden.`

Phase 1 fühlt sich als vollständiges Produkt an, obwohl Phase-2/3-Breite bewusst fehlt.

### Verbindlicher V1-Kernumfang

1. **Trip Workspace** – Reise, Multi-Destination, Etappen, Transit, Tage, Orte, Zeiten, Notizen, Reisebestandteile, Änderungen, Mobile/Desktop-Kohärenz.
2. **Account + Guest → Account** – Gastnutzung, Übernahme, gespeicherte Reisen, Ownership/RLS, Account Registry, Trip Snapshot, sichere Sessions/MFA/AAL wo erforderlich.
3. **Traveller Architecture** – mehrere Staatsbürgerschaften und Credentials ohne Default-/Primary-Truth; kontextabhängige Eignung.
4. **Route / Transit / Multi-Destination Truth** – Origin, Destination, Zwischenziele, Transit, Umstiege, Events und lokale/absolute Zeitwahrheit.
5. **Flights** – mindestens ein belastbarer realer Flight-Provider mit Preis/Zeit/Segment/Provenance/Failure/Persistenz/Workspace-Integration.
6. **Accommodation / Hotels** – mindestens eine professionelle reale Hotel-/Accommodation-Integration mit Commercial Provenance und Reiseintegration.
7. **Activities / Experiences** – mindestens eine professionelle Integration, soweit Vertrag/Zugang/Reife dies verantwortbar erlauben; andernfalls ist vor V1 ein expliziter Product-Owner-Launch-Exception-Entscheid nötig, kein stilles Weglassen.
8. **Entry Requirements / Travel Readiness** – strukturierte Official Truth über Visa/eVisa/eTA/Transit/Dokumente/Gültigkeit/freie Seiten/Formulare/Health-Vorgaben/Versicherung/Onward/Accommodation/Financial Means und weitere offiziell belegte Bedingungen.
9. **Temporal Readiness / Travel Companion** – `available_from`, `due_at`, Event-Bindings, Zeitzonen, Now/Soon/Info; keine harte Deadline ohne belastbare Zeit-Evidence; relevante Re-Evaluation nach Trip-/Traveller-/Evidence-Änderungen.
10. **Intelligenter Reiseassistent** – arbeitet mit bestehender Jetnity Truth; Generated Suggestion bleibt getrennt von Official/Provider Truth.
11. **Destination Essentials** – begrenzte hochwertige Länder-/Zielinformationen, Safety, offizielle Links und praktische Reisevorbereitung.
12. **World Map** – geplante Reisen und besuchte Orte/Länder, accountgebunden; keine Social-Funktionen vor V1.
13. **Mobile / PWA** – hervorragende Smartphone-UX und PWA/mobile-first Web; Native Apps nicht V1-blockierend.
14. **Admin / Operations Foundation** – System Health, Security, Provider Ops, notwendige Nutzer-/Trip-Administration, Incident-/Error-Sicht, Analytics-, Cost-, Revenue-/Affiliate- und Audit-Grundlagen. Keine Fake-Daten.
15. **Monetarisierung** – Affiliate/Referral/Booking-Weiterleitungen, Revenue Attribution, Conversion Tracking und schlanke Premium-/Pro-Grenzen soweit sinnvoll; kein überkomplexes Tarifmodell vor PMF.

### Phase-1 Provider Principle

Nicht maximale Provideranzahl. Lieber **ein professionell integrierter Provider pro V1-Kernkategorie** als mehrere halb fertige Integrationen.

Providerwahl, Vertrag, DPA, Secrets/API Keys, Kosten, paid calls und Live-Aktivierung bleiben einzelne Product-Owner-Gates.

### Phase-1 Exit

Phase 1 ist erst abgeschlossen, wenn:

> **JETNITY V1 = PRODUCTION READY FOR REAL TRAVELLERS**

und der verbindliche V1 Release Readiness Gate bestanden ist.

Erfolgssatz:

> „Ich kann meine komplette Reise in Jetnity organisieren und Jetnity sagt mir zuverlässig, was ich wann für diese Reise erledigen muss.“

## Phase 2 – JETNITY COMPLETE TRAVEL PLATFORM

### Ziel

> **Planen + Entscheiden + Buchen + Unterwegs.**

Phase 2 verbreitert Jetnity auf Basis echter Phase-1-Nutzung.

Schwerpunkte:

- mehrere Flight-/Hotel-/Activity-Provider;
- Mietwagen, Bahn, Bus, Fähren, Transfers, ggf. Cruises, Versicherungen und weitere Reiseprodukte;
- fortgeschrittene Reiseentscheidung über Preis, Reisezeit, Umstiege, Self-Transfer, Airport Change, Gepäck, Zeitlage, Komfort, Flexibilität, Traveller-, Visa-/Transit-, Transfer- und Hotel-Folgen;
- Advanced Companion mit Tasks, Completion, Action Windows, Push/E-Mail, Change Detection und Re-Evaluation;
- breitere Destination Intelligence inkl. Seasons, Weather Context, POIs, Trends und Social/Instagram-Hotspots;
- Consent-basierte Personalisierung;
- Admin / Operations Pro inkl. Provider Health/Costs, Attribution, Incident, Support, Content, Compliance, Finance, Bexio, Copilot Pro und Growth Ops;
- breitere Monetarisierung und Premium-/Entitlement-Optimierung;
- datengetriebene Growth-/Discoverability-Ausweitung.

Erfolgssatz:

> „Von der ersten Reiseidee bis zur Rückkehr brauche ich für die meisten Reiseaufgaben nur noch Jetnity.“

## Phase 3 – JETNITY TRAVEL ECOSYSTEM

### Ziel

> **Aus einem Produkt wird ein schwer kopierbares Ökosystem.**

Schwerpunkte:

- professionelle native iOS-/Android-Apps mit derselben zentralen Truth-Architektur;
- Traveller Network / Reisepartner-Matching / Gruppenplanung mit Privacy, Safety, Abuse Prevention und Moderation;
- Creator Ecosystem für veröffentlichte Trips, Guides, Collections, Communities und Affiliate-Revenue;
- Partner-/Marketplace-Ecosystem für Hotels, Activities, Tourism Boards, lokale Anbieter, Versicherungen, Mobility, Creator und DMOs;
- Jetnity Intelligence Layer aus datenschutzkonformen Nutzungs-/Operationsmustern;
- eigene Data Assets wie normalisierte Travel Graphs, Route-/Transit-Wissen, Regulatory Truth, Provider Quality Intelligence, erlaubte Preis-/Availability-Muster, Destination Knowledge Graph, anonymisierte Trip Patterns, Preference Models und Travel Readiness Engine;
- geordnete internationale Skalierung Schweiz → DACH → Europa → priorisierte internationale Märkte → global.

Partner- oder Affiliateinteressen dürfen Jetnitys neutrale Entscheidungslogik niemals still manipulieren.

Erfolgssatz:

> „Jetnity versteht die konkrete Reise, den Traveller und den gesamten Reiseprozess besser als ein einzelner Buchungsdienst – und dieser Vorteil wird mit jedem Nutzer, jeder Integration und jedem Partner stärker.“

## Anti-Bloat-Regel

Neue Ideen dürfen dokumentiert werden. Sie blockieren V1 aber nur, wenn sie nachweislich für die vollständige Phase-1-Kernreise, Sicherheit, Recht, Reliability, Monetarisierbarkeit oder Release Readiness erforderlich sind.

Alles andere wird ausdrücklich Phase 2 oder Phase 3 zugeordnet.
