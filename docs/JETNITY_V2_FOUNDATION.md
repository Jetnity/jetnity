# Jetnity V2 – Produktgrundlage

Stand: 14. August 2026

## Produktkern

Jetnity wird nicht als Sammlung unverbundener Reise-Tools gebaut. Das zentrale Objekt ist eine **Reise**. Entdeckte Orte, Tagespläne, spätere Preisvergleiche, Einreisehinweise, Erinnerungen und Reisepartner beziehen sich immer auf diese Reise.

Die erste Version konzentriert sich auf drei Wege:

1. **Entdecken** – Inspiration und relevante Reiseideen.
2. **Planen** – Eckdaten erfassen und einen verständlichen Tagesplan erstellen.
3. **Meine Reisen** – alle Entwürfe und später aktive sowie vergangene Reisen verwalten.

## Bereits umgesetzt

- neue markenfähige Startseite und vereinfachte Navigation
- responsiver Reiseplaner mit Datenvalidierung
- lokale Gastreisen mit maximal 20 Entwürfen pro Browser
- maximal 366 Tage pro Entwurf als Schutz vor fehlerhaften Eingaben
- Tagesarbeitsbereich mit Aktivitäten, Uhrzeiten und privaten Notizen
- robuste API-Initialisierung: fehlende OpenAI- oder Supabase-Konfiguration verhindert keinen Build mehr
- PWA-Grundlage mit Manifest und Icon
- SEO-Grundlage mit Metadaten, strukturierten Daten und Sitemap

## Datenschutzregel

Die Gastversion verarbeitet nur normale Planungsdaten und speichert sie lokal im Browser. **Passnummern, Ausweiskopien, Visa-Dokumente, Zahlungsdaten und Gesundheitsdaten gehören nicht in diesen Speicher.**

Bevor sensible Reisedokumente unterstützt werden, benötigt Jetnity einen getrennten Sicherheitsbereich mit mindestens:

- ausdrücklicher Einwilligung und Datensparsamkeit
- Ende-zu-Ende- oder clientseitiger Verschlüsselung für Dokumentinhalte
- getrenntem Schlüsselmanagement
- kurzer, konfigurierbarer Aufbewahrungsdauer
- vollständigem Audit-Log und Zugriffswiderruf
- RLS-Regeln, MFA und wiederkehrenden Sicherheitsprüfungen
- juristisch geprüften Datenschutz- und Löschprozessen

## Nächste Ausbaustufen

### Phase 2 – sichere Konten und Synchronisierung

- Supabase-Schema für Reisen, Teilnehmer, Tage und Planpunkte
- Row Level Security mit automatisierten Tests
- Anmeldung, Geräte-Synchronisierung und Einladungen
- Migration lokaler Gastreisen in ein Konto
- Offline-fähiger Cache mit Konfliktauflösung

### Phase 3 – intelligenter Planer

- Jetnity Copilot mit begrenztem, transparentem Reisekontext
- Vorschläge erst nach Nutzerfreigabe in den Reiseplan übernehmen
- Budget- und Zeitprüfung
- Quellen, Aktualitätsdatum und Vertrauensniveau bei Einreiseinformationen
- Kostenlimit, Nutzungsquote und Kill-Switch für jede externe KI-Funktion

### Phase 4 – Monetarisierung

- Partner-Preisvergleich für Flüge, Hotels und Mobilität
- Jetnity Pro für Zusammenarbeit, intelligente Optimierung und Offline-Funktionen
- Guardian-Modul für Einreise-, Sicherheits- und Fristenhinweise
- spätere B2B-Angebote für Reiseberater und Gruppenorganisatoren

Kein Partner oder kostenpflichtiger Dienst wird ohne separate technische und wirtschaftliche Freigabe aktiviert.

## Technische Leitplanken

- modularer Next.js/TypeScript-Kern
- serverseitige Secrets; keine Service-Role-Schlüssel im Client
- Schema-Validierung an jeder externen Grenze
- least privilege für Datenbank, Speicher und Integrationen
- Feature Flags für unfertige oder kostenpflichtige Funktionen
- Observability ohne sensible Nutzerdaten
- automatisierte Type-, Lint-, Build-, RLS- und End-to-End-Tests vor Produktion
- kleine, überprüfbare Releases über Branch und Preview statt direkte Änderungen an Produktion

## Release-Regel

Der aktuelle Stand bleibt auf dem Entwicklungsbranch, bis Design, Funktionsumfang, Datenmodell und mögliche Kosten gemeinsam freigegeben sind. Erst danach folgen Push, Preview-Deployment und Produktion.
