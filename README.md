# Jetnity

Jetnity wird als ruhiger, intelligenter Reisebegleiter neu aufgebaut: entdecken, planen und unterwegs alles an einem Ort behalten.

## V2-Grundlage

Die erste neue Produktschicht ist bereits nutzbar:

- neue öffentliche Startseite mit klarer Positionierung
- fokussierte Navigation mit `Entdecken`, `Meine Reisen` und `Reise planen`
- privater Gast-Reiseplaner unter `/planen`
- lokale Reiseübersicht unter `/reisen`
- Tagesplanung mit eigenen Orten, Zeiten und Notizen unter `/reisen/[tripId]`
- App-Manifest, Icon, Metadaten und aktualisierte Sitemap

Gastreisen werden bewusst nur im Browser gespeichert. Es werden in dieser Stufe weder Passdaten noch andere sensible Dokumente verarbeitet.

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

Einen Service-Role-Key liest kein Codepfad mehr. Was erhöhte Rechte braucht, liegt in einer Datenbankfunktion, die die Rolle selbst prüft ([DECISIONS.md](DECISIONS.md) ADR-0032). `OPENAI_API_KEY` ist mit Phase 1.1b entfallen; es existiert kein Weg zu einem kostenpflichtigen Modell.

`.env.local` und echte Secrets dürfen nie committed werden. Kostenpflichtige Dienste werden nicht automatisch aktiviert.

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

Der historische erste V2-Entwurf liegt in [docs/JETNITY_V2_FOUNDATION.md](docs/JETNITY_V2_FOUNDATION.md); bei Widersprüchen gelten die Dateien oben.
