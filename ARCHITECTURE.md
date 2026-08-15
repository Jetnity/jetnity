# Jetnity – Architektur

Stand: 15. August 2026
Gültig für: Branch `cursor/jetnity-v2-basis-cbcd` (Phase 0)

Diese Datei beschreibt den **tatsächlichen** technischen Aufbau, nicht den Zielzustand. Abweichungen zwischen Ist und Ziel sind als solche gekennzeichnet. Zielzustand und Reihenfolge stehen in [ROADMAP.md](ROADMAP.md).

---

## 1. Technischer Stack

| Bereich | Technologie |
| --- | --- |
| Framework | Next.js 14, App Router |
| Sprache | TypeScript (strict) |
| Styling | Tailwind CSS, CSS Custom Properties |
| UI-Bausteine | Radix UI / shadcn-Muster |
| Hosting | Vercel |
| Datenbank | Supabase PostgreSQL |
| Auth | Supabase Auth (Cookie-basiert, SSR) |
| Storage | Supabase Storage |
| KI | OpenAI API (serverseitig) |
| Node | >= 20.9 (siehe `package.json` → `engines`) |

Ein Framework-Wechsel ist nicht vorgesehen und benötigt Freigabe.

---

## 2. Schichten und Verantwortlichkeiten

```
app/                Routing, Server Components, Route Handler, Server Actions
components/         Präsentation und Interaktion
lib/                Business-Logik, Datenzugriff, Integrationen
types/              Datenbank- und Domänentypen
supabase/migrations Datenbankschema (siehe Abschnitt 6 – aktuell unvollständig)
middleware.ts       Edge-Middleware
styles/globals.css  Design-Tokens
tailwind.config.js  Token-Mapping
```

**Regel:** Business-Logik gehört nach `lib/`, nicht in UI-Komponenten. Sensible Logik läuft ausschließlich serverseitig.

---

## 3. Supabase-Clients

Es existieren getrennte Clients je Ausführungskontext. Die Auswahl ist nicht optional:

| Datei | Kontext | Rechte |
| --- | --- | --- |
| `lib/supabase/server.ts` | Server Components / RSC | Nutzerrechte, RLS aktiv |
| `lib/supabase/actions.ts` | Server Actions, Route Handler | Nutzerrechte, RLS aktiv, darf Cookies schreiben |
| `lib/supabase/client.ts` | Client Components | Anon Key, RLS aktiv |
| `lib/supabase/admin.ts` | ausschließlich Server | **Service Role, umgeht RLS** |

`lib/supabase/admin.ts` darf nur verwendet werden, wenn im gleichen Codepfad Auth, Ownership und Eingabevalidierung geprüft werden ([AGENTS.md](AGENTS.md) Regel 14).

---

## 4. Auth und Zugriffsschutz

- Sessions laufen über Supabase-Auth-Cookies und werden serverseitig gelesen.
- `app/auth/refresh/route.ts` erneuert Sessions.
- `middleware.ts` schützt derzeit **ausschließlich** `/creator/creator-dashboard`. Alle anderen Pfade werden ohne Prüfung durchgelassen; Autorisierung liegt damit in den einzelnen Routen und Seiten.
- Fehlen die Supabase-Umgebungsvariablen, lässt die Middleware Anfragen bewusst durch („fail open"), damit Preview und CI ohne Produktions-Secrets bauen können.

**Ist-Ziel-Abweichung:** Ein einheitliches Rollen- und Berechtigungsmodell existiert noch nicht. Admin-Prüfungen sind über einzelne Routen verteilt statt zentral. Die Vereinheitlichung ist Teil von Phase 1.

---

## 5. Datenfluss der V2-Reiseschicht

Die V2-Produktschicht liegt in der Route-Gruppe `app/(public)`:

| Pfad | Aufgabe |
| --- | --- |
| `/` | Startseite mit Positionierung und Einstieg in die Reiseplanung |
| `/planen` | Erfassung der Reiseidee (`components/trips/TripPlanner.tsx`) |
| `/reisen` | Übersicht der Reisen (`components/trips/GuestTrips.tsx`) |
| `/reisen/[tripId]` | Trip Workspace mit Tagesplanung (`components/trips/TripWorkspace.tsx`) |

Persistenz erfolgt derzeit **ausschließlich im Browser** über `lib/trips/guest-store.ts`:

- `localStorage`-Schlüssel `jetnity:guest-trips:v2`
- maximal 20 Entwürfe pro Browser
- maximal 366 Tage pro Entwurf

**Ist-Ziel-Abweichung:** Die Datenbank ist laut [AGENTS.md](AGENTS.md) Regel 13 die Source of Truth. Reisen existieren aktuell nur clientseitig. Der Gastmodus darf `localStorage` verwenden, die serverseitige Persistenz für angemeldete Nutzer fehlt jedoch noch vollständig. Das ist der zentrale Inhalt von Phase 1 (Trip-Schema) und Phase 2.

Bewusste Datenschutzregel: In diesem Speicher werden keine Passnummern, Ausweiskopien, Visa-Dokumente, Zahlungs- oder Gesundheitsdaten verarbeitet.

---

## 6. Datenbank

**Kritischer Ist-Zustand – keine belastbare Schema-Historie:**

- `supabase/migrations/` enthält 10 Dateien. Diese erzeugen lediglich zwei Tabellen (`creator_alert_rules`, `creator_alert_events`) sowie mehrere RPCs und Views aus der alten Creator-Analytics-Welt.
- Die generierten Typen in `types/supabase.ts` beschreiben dagegen **37 Tabellen**. Für den überwiegenden Teil des real existierenden Schemas gibt es also keine versionierte Migration.
- Eine Datei ist unversioniert benannt: `<timestamp>_realtime_creator_session_metrics.sql`.
- Es existieren **zwei konkurrierende Typdateien**: `types/supabase.ts` (37 Tabellen, von ca. 110 Dateien importiert) und `types/supabase.types.ts` (3 Tabellen, von 2 Dateien importiert).

**Konsequenz:** Die Datenbank ist derzeit nicht reproduzierbar aufsetzbar. Eine vollständige Baseline-Migration und die Zusammenführung der Typdateien sind Voraussetzung für alles Weitere und in Phase 1 eingeplant.

RLS: Nur 2 der 10 Migrationen erwähnen Row Level Security. Der RLS-Zustand des produktiven Schemas ist aus dem Repository **nicht** nachvollziehbar und muss in Phase 1 erhoben, versioniert und getestet werden.

---

## 7. API-Schicht

Es existieren 76 Route Handler unter `app/api/`. Die Verteilung zeigt den Altlastenanteil deutlich:

| Bereich | Zugehörigkeit |
| --- | --- |
| `api/media/*`, `api/video/*`, `api/worker/render` | Alt: Media Studio / Render-Pipeline |
| `api/creator/*`, `api/sessions/*`, `api/feed/*`, `api/publish/*` | Alt: Creator Hub, Feed, Publishing |
| `api/copilot/*`, `api/story/*`, `api/storyboard`, `api/generate-*`, `api/remix-image` | Alt: Creator-Copilot und Story-System |
| `api/blog/posts`, `api/content-type`, `api/inspiration` | Alt: Content-Plattform |
| `api/admin/infomaniak/*`, `api/admin/copilot/*`, `api/admin/dns/*`, `api/admin/cron/dns` | Infrastruktur-Automatisierung, nicht MVP-relevant |
| `api/admin/payments/*`, `api/admin/security/*` | wird vorerst behalten, ohne Priorität |
| `api/search/airports`, `api/search` | für V2 potenziell wiederverwendbar |
| `app/auth/refresh` | V2-relevant |

**Ist-Ziel-Abweichung:** Für V2 wird keiner der KI- und Media-Endpunkte benötigt. Die Außerbetriebnahme ist freigegeben und beginnt in Phase 1 (siehe [ROADMAP.md](ROADMAP.md)). Bis dahin gilt: keine Weiterentwicklung dieser Endpunkte.

---

## 8. Design-Architektur

Die V2-Markenfarben sind zentralisiert:

- `styles/globals.css` definiert 27 Tokens in fünf Familien (`brand`, `citrus`, `surface`, `line`, `ink`) als RGB-Kanäle.
- `tailwind.config.js` mappt sie über `rgb(var(--jet-*) / <alpha-value>)`, damit Opacity-Modifier wie `bg-brand-600/10` funktionieren.
- Die V2-UI-Dateien verwenden ausschließlich diese Tokens, keine Hex-Literale.

**Bekannte Abweichung:** Die shadcn-Tokens (`--primary`, `--accent`, `--ring` usw.) tragen noch die alte blau/violette Farbwelt. Sie werden von Alt-Komponenten genutzt. Die Umstellung auf die V2-Farbwelt ist freigegeben und als eigener Schritt eingeplant. Details in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

---

## 9. Build, CI und Deployment

- `npm run typecheck` – `tsc --noEmit`
- `npm run lint` – ESLint
- `npm run build` – Setup-Check und danach `next build`
- `npm run check:setup:ci` – Setup-Check mit Fail-Closed-Verhalten für CI
- `.github/workflows/ci.yml` führt bei jedem Push auf `main` und bei jedem Pull Request aus: `npm ci`, Setup-Check, Typecheck, Lint, Production-Build

Deployment über Vercel (Projekt `jetnity-app`). `main` ist der stabile Integrationsbranch; größere Umbauten laufen über Feature-Branch und Preview. Ein Push auf `main` löst automatisch einen Production-Deploy aus.

**Erreichbarkeit (Stand 15. August 2026, verifiziert):**

| Adresse | Zustand |
| --- | --- |
| `jetnity-app.vercel.app` | öffentlich erreichbar, aktueller Production-Alias |
| Deployment-URLs (`jetnity-<hash>-…vercel.app`) | durch Vercel Deployment Protection geschützt, liefern die Vercel-Login-Seite |
| `jetnity.com` | **keine öffentliche DNS-Auflösung** |
| `jetnity.ch` | **keine öffentliche DNS-Auflösung** |

Die beiden Produktionsdomains aus [JETNITY_VISION.md](JETNITY_VISION.md) sind damit noch nicht mit dem Vercel-Projekt verbunden. Für die Entwicklung ist das unkritisch, für den Launch ist es eine Voraussetzung. Automatisierte Prüfungen der Produktion müssen bis dahin den Alias verwenden, nicht die Wunschdomain.

Hinweis für Prüfungen: `vercel.json` enthält vier Cron-Jobs, die ausschließlich Alt-Endpunkte aufrufen (`/api/cron/publish-scheduled-posts`, `/api/copilot/auto`, `/api/admin/cron/dns`). Sie laufen in Production weiterhin. Ihre Abschaltung gehört zu Phase 1.1.

---

## 10. Observability

Aktuell nur Konsolen-Logging, kein zentrales Error-Tracking und keine strukturierte Log-Konvention. Ein Anbieter würde laufende Kosten verursachen und ist deshalb nicht ohne Freigabe eingeführt. Für die Launch-Reife ist eine kostengünstige Lösung vorgesehen (Backlog in [ROADMAP.md](ROADMAP.md)).

---

## 11. Bekannte technische Schulden

| Thema | Ausmaß | Einordnung |
| --- | --- | --- |
| Fehlende Baseline-Migration | 37 Tabellen ohne Versionierung | Phase 1, blockierend |
| Zwei Supabase-Typdateien | 37 vs. 3 Tabellen | Phase 1 |
| RLS-Zustand unbekannt | nicht aus dem Repo ableitbar | Phase 1, sicherheitsrelevant |
| Keine automatisierten Tests | 0 Test-Dateien im Repo | Phase 1 beginnend |
| `any`-Verwendung | ca. 309 Vorkommen in `app/`, `lib/`, `components/`, `types/` | überwiegend in Alt-Code; nur V2-relevante Stellen werden bereinigt |
| Middleware schützt nur einen Pfad | 1 von vielen geschützten Bereichen | Phase 1 |
| Alt-Endpunkte ohne Kostenkontrolle | mehrere OpenAI-Endpunkte | Phase 1, wird durch Abschaltung gelöst |

Bewusste Entscheidung: `any`-Vorkommen und Sicherheitslücken in Alt-Code werden **nicht** aufwendig refactored, wenn der betroffene Code kurzfristig entfernt wird ([DECISIONS.md](DECISIONS.md), ADR-0006).
