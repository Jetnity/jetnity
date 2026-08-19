# Jetnity

Jetnity wird als ruhiger, intelligenter Reisebegleiter neu aufgebaut: entdecken, planen und unterwegs alles an einem Ort behalten.

## V2-Grundlage

Die erste neue Produktschicht ist bereits nutzbar:

- neue öffentliche Startseite mit klarer Positionierung
- fokussierte Navigation mit `Entdecken`, `Meine Reisen` und `Reise planen`
- Reiseplaner unter `/planen`, ohne Konto und mit Konto derselbe Weg
- Reiseübersicht unter `/reisen`: ohne Konto der eine Gastentwurf, mit Konto die gespeicherten Reisen
- Tagesplanung mit eigenen Orten, Zeiten und Notizen unter `/reisen/[tripId]`
- App-Manifest, Icon, Metadaten und aktualisierte Sitemap

Ohne Konto liegt **genau eine** Gastreise im Browser; mehrere gespeicherte Reisen brauchen ein Konto. Bei Registrierung oder Anmeldung wandert der Entwurf einmalig in das Konto. Reisen im Konto liegen in Supabase und sind durch Row Level Security auf ihr eigenes Konto beschränkt ([docs/REISEN.md](docs/REISEN.md)).

Es werden in dieser Stufe weder Passdaten noch andere sensible Dokumente verarbeitet.

## Reise in eigenen Worten beschreiben

Seit Phase 2.1 gibt es unter `/planen` einen zweiten Einstieg: eine freie Beschreibung wie „7 Tage Thailand ab Zürich, zwei Personen, maximal CHF 3'000, Strand, gutes Essen und nicht zu stressig." Daraus entsteht ein Entwurf mit Etappen, Tagen und Planpunkten, der **vor** dem Speichern gezeigt wird. Erst „Übernehmen" legt die Reise an – im Konto oder als Gastentwurf, über dieselben Wege wie das Formular.

**Dieser Weg ist standardmässig abgeschaltet und in keiner Umgebung aktiv.** Er braucht einen `OPENAI_API_KEY` und den Kill Switch `JETNITY_MODELL_AKTIV`; fehlt eines, entsteht kein Aufruf und die Oberfläche sagt es. Das Formular bleibt davon unberührt.

Solange er läuft, ist er begrenzt: 4 Anfragen je Browser und Stunde, 8 je Tag, 24 für alle Gäste zusammen, 38 insgesamt und höchstens $3.00 Modellkosten am Tag. Die Grenzen setzt die Datenbank durch, nicht der Anwendungscode, und die Buchung geschieht vor dem Aufruf. Vollständige Beschreibung – Modellwahl, Preise, Grenzen, Fehlerfälle, Protokoll, Datenschutz und was zur Aktivierung nötig ist – in [docs/MODELL.md](docs/MODELL.md).

Ein Vorschlag enthält keine Preise, keine Anbieter, keine Verfügbarkeiten und keine Buchungslinks. Dafür gibt es noch keine belastbare Quelle; ein genanntes Budget ist ein Ziel und keine Aussage über einen Gesamtpreis.

## Lokale Entwicklung

Voraussetzungen: Node.js 20+ und npm.

```bash
npm install
npm run dev
```

Danach ist Jetnity unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Qualitätsprüfungen

```bash
npm run typecheck
npm run lint
npm test
NEXT_TELEMETRY_DISABLED=1 npx next build
```

Der direkte `next build`-Aufruf ist lokal nützlich, wenn noch keine produktiven Umgebungsvariablen gesetzt sind. Das reguläre `npm run build` führt vorher zusätzlich den Setup-Check aus.

Die CI führt darüber hinaus `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports` und `check:deps` aus. Alle laufen ohne Zugangsdaten.

Die datenbanknahen Prüfungen aus `scripts/db/` brauchen den Supabase-Development-Zugang und laufen von Hand; sie sind in [docs/DATENBANK.md](docs/DATENBANK.md) beschrieben.

## Umgebungsvariablen

Kopiere `.env.example` nach `.env.local` und hinterlege ausschließlich lokale Entwicklungswerte:

```bash
cp .env.example .env.local
```

Wichtige Variablen:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_ALLOWED_EMAILS` – Notzugang zur Administration, ausschließlich vollständige Adressen ([DECISIONS.md](DECISIONS.md) ADR-0027)
- `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN` – nur für die Datenbankwerkzeuge gegen den Development-Branch, nicht für die Anwendung

Einen Service-Role-Key liest kein Codepfad mehr. Was erhöhte Rechte braucht, liegt in einer Datenbankfunktion, die die Rolle selbst prüft ([DECISIONS.md](DECISIONS.md) ADR-0032).

Optional und standardmässig leer, für die intelligente Reiseplanung aus Phase 2.1:

- `JETNITY_MODELL_AKTIV` – Kill Switch. Nur `true` oder `1` schalten ein
- `OPENAI_API_KEY` – serverseitig. Mit Phase 1.1b war die Variable entfallen, weil es keinen Modellpfad mehr gab; seit Phase 2.1 gibt es wieder einen, abgeschaltet
- `JETNITY_MODELL_NAME`, `JETNITY_MODELL_AUFWAND` – optional. Leer entscheidet das Routing (Terra Standard, Sol bei Komplexität). Der Name ist der manuelle Stift.

Ohne diese Variablen läuft Jetnity vollständig; nur die freie Reisebeschreibung meldet, dass sie nicht freigegeben ist. Es gibt keine `NEXT_PUBLIC_OPENAI_*`-Variable und keinen Modellaufruf im Browser. Die Grenzen und Kostendeckel stehen bewusst **nicht** in der Umgebung, sondern in der Datenbank ([docs/MODELL.md](docs/MODELL.md)).

`.env.local` und echte Secrets dürfen nie committed werden. Kostenpflichtige Dienste werden nicht automatisch aktiviert – der Setup-Check verlangt `OPENAI_API_KEY` nicht.

## Projektdokumentation

Der rote Faden von Jetnity lebt im Repository, nicht in einzelnen Chats. Vor größeren Änderungen sind diese Dateien zu lesen:

| Datei | Inhalt |
| --- | --- |
| [AGENTS.md](AGENTS.md) | verbindliche Arbeitsweise für alle Coding Agents |
| [JETNITY_VISION.md](JETNITY_VISION.md) | Produktvision: was Jetnity ist und was nicht |
| [ARCHITECTURE.md](ARCHITECTURE.md) | tatsächlicher technischer Aufbau inklusive bekannter Schulden |
| [ROADMAP.md](ROADMAP.md) | Stand, nächste Schritte, blockierte und verschobene Punkte |
| [DECISIONS.md](DECISIONS.md) | Entscheidungsprotokoll und offene Widersprüche |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | verbindliche Farbtokens und Designregeln |
| [docs/DATENBANK.md](docs/DATENBANK.md) | Schema, Rollen, Eigentum, RLS und die Prüfungen dazu |
| [docs/REISEN.md](docs/REISEN.md) | Reisedatenmodell, Gast und Konto, der Weg Gast → Konto |
| [docs/MODELL.md](docs/MODELL.md) | Modellintegration, Reisevorschlag, Kostenkontrolle, Aktivierung |
| [docs/AUTH.md](docs/AUTH.md) | Auth-Konfiguration des Development-Branches und die Prüfungen dazu |
| [docs/LEGACY_ENTFERNUNG.md](docs/LEGACY_ENTFERNUNG.md) | Bericht zur Entfernung der 29 Legacy-Tabellen: Archiv-Tag, Nachweis, verbliebene Objekte |

Der historische erste V2-Entwurf liegt in [docs/JETNITY_V2_FOUNDATION.md](docs/JETNITY_V2_FOUNDATION.md); bei Widersprüchen gelten die Dateien oben.
