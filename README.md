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
NEXT_TELEMETRY_DISABLED=1 npx next build
```

Der direkte `next build`-Aufruf ist lokal nützlich, wenn noch keine produktiven Umgebungsvariablen gesetzt sind. Das reguläre `npm run build` führt vorher zusätzlich den Setup-Check aus.

## Umgebungsvariablen

Kopiere `.env.example` nach `.env.local` und hinterlege ausschließlich lokale Entwicklungswerte:

```bash
cp .env.example .env.local
```

Wichtige Variablen:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ausschließlich serverseitig
- `OPENAI_API_KEY` ausschließlich serverseitig und nur für aktivierte KI-Funktionen

`.env.local` und echte Secrets dürfen nie committed werden. Kostenpflichtige Dienste werden nicht automatisch aktiviert.

## Produkt- und Sicherheitsarchitektur

Die aktuelle V2-Entscheidung und die nächsten kontrollierten Ausbaustufen stehen in [docs/JETNITY_V2_FOUNDATION.md](docs/JETNITY_V2_FOUNDATION.md).
