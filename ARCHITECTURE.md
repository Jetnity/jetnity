# Jetnity – Architektur

Stand: 23. August 2026
Gültig für: Foundation D und E auf `main` und Production; Travel Safety & Disruption Intelligence gemergt auf `main`; Travel Timing & Seasonal Intelligence als provider-neutrale Foundation auf Draft-PR #38, Runtime `263c2f84`. Production-Schema unverändert durch diesen Block.

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
| Modell | OpenAI Responses API, serverseitig; Preview aktivierbar, Production aus (Abschnitt 5a) |
| Node | >= 20.9 (siehe `package.json` → `engines`) |

Ein Framework-Wechsel ist nicht vorgesehen und benötigt Freigabe.

---

## 2. Schichten und Verantwortlichkeiten

```
app/                Routing, Server Components, Route Handler, Server Actions
components/         Präsentation und Interaktion
lib/                Business-Logik, Datenzugriff, Integrationen
lib/auth/           Rollenmodell und Zugangsentscheidung (siehe Abschnitt 4)
types/              Datenbank- und Domänentypen; types/supabase.ts wird erzeugt
supabase/migrations Datenbankschema, vollständig und reproduzierbar (Abschnitt 6)
middleware.ts       Edge-Middleware
scripts/            Prüfungen, die in der CI laufen
scripts/db/         Inventur, Migrationslauf und Nachweise gegen Development
scripts/airports/   OurAirports-Import nach Development, nie in der CI
styles/globals.css  Design-Tokens
tailwind.config.js  Token-Mapping
```

Tests liegen als `*.test.ts` neben dem Code, den sie prüfen, und laufen über `npm test` ([DECISIONS.md](DECISIONS.md) ADR-0029).

**Regel:** Business-Logik gehört nach `lib/`, nicht in UI-Komponenten. Sensible Logik läuft ausschließlich serverseitig.

---

## 3. Supabase-Clients

Es existieren getrennte Clients je Ausführungskontext. Die Auswahl ist nicht optional:

| Funktion in `lib/supabase/` | Kontext | Rechte |
| --- | --- | --- |
| `server.ts` → `createServerComponentClient()` | Server Components / RSC | Nutzerrechte, RLS aktiv, Cookies nur lesend |
| `server.ts` → `createRouteHandlerClient()` | Route Handler | Nutzerrechte, RLS aktiv, darf Cookies schreiben |
| `server.ts` → `createServerActionClient()` | Server Actions | Nutzerrechte, RLS aktiv, darf Cookies schreiben |
| `client.ts` → `createBrowserClient()` | Client Components | Anon Key, RLS aktiv |

**Einen allgemeinen Admin-Client gibt es weiterhin nicht.** `lib/supabase/admin.ts` und der frühere `createAdminClient` sind in Phase 1.2b entfernt worden: Letzterer hängte einem Client mit vollen Rechten den mutierbaren Cookie-Adapter der Besucherin an.

Der eine verbliebene Service-Role-Zugang sitzt in `lib/modell/kontingent.ts`: cookie-los, nicht exportiert, ausschliesslich die zwei Kontingent-RPCs. Ohne ihn könnte ein Gast die Schranke nicht erreichen, ohne `anon` wieder `EXECUTE` zu geben – und genau das öffnete den direkten PostgREST-Weg (ADR-0052, Nachtrag). Alle übrigen erhöhten Rechte liegen in `SECURITY DEFINER`-Funktionen, die die Rolle selbst prüfen: `admin_payments_summary_30d()`, `admin_security_overview()`, `admin_reisen_kennzahlen()` und `admin_reisen_zeitreihe(integer)` ([AGENTS.md](AGENTS.md) Regel 14).

`public.reise_anlegen(jsonb)` ist ausdrücklich **nicht** so gebaut: Sie ist `SECURITY INVOKER` und schreibt ausschliesslich in die Reisen des aufrufenden Kontos, was die Policies ohnehin erlauben. Erhöhte Rechte bekommt eine Funktion nur, wenn sie sie braucht.

Sie ist deshalb aber auch nicht der einzige Weg, auf dem eine Reise entstehen kann: `authenticated` hat `INSERT` auf `public.trips`, und PostgREST macht dieses Recht erreichbar. Die Regeln des Anlegens – Kennung, Anfangsstatus, Zeitstempel und die Schranke von 60 neuen Reisen je Stunde – liegen darum nicht in der Funktion, sondern in einer Bedingung und im Auslöser `trips_erzeugung_pruefen` der Tabelle. Er ist `SECURITY DEFINER`, damit seine Zählung nicht von einer Lesepolicy abhängt, und für niemanden aufrufbar ([DECISIONS.md](DECISIONS.md) ADR-0045).

Die Schranke zählt Neuanlagen und keine Schreibversuche: Ist `(user_id, client_ref)` schon belegt, entsteht keine Reise, die Schranke gilt nicht, und der Schreibvorgang endet am eindeutigen Index – in `reise_anlegen()` im `on conflict do nothing`, auf dem direkten Weg in `23505`. Ohne diese Frage wäre ein Retry an der Grenze abgelehnt worden, obwohl die Reise bereits im Konto liegt; ein `BEFORE INSERT`-Auslöser läuft vor dem eindeutigen Index (ADR-0048).

Zählung und Einfügung sind ein Lesen mit anschliessendem Schreiben und laufen deshalb je Konto der Reihe nach, serialisiert über `pg_advisory_xact_lock` auf Transaktionsdauer. Ohne diese Sperre sahen gleichzeitige Anfragen bei 59 vorhandenen Reisen alle denselben Stand und kamen alle durch – über PostgREST war die Schranke damit parallel überschreitbar. `npm run db:parallelitaet` weist das mit echten gleichzeitigen Verbindungen nach; `npm run db:sicherheit` kann es nicht, weil sein Lauf vollständig in einer Transaktion liegt (ADR-0049).

Die Migrationen brauchen keinen Service-Key: `npm run db:anwenden` geht über die Management API.

---

## 3a. Cursor MCP – nur Development

Für Phase 1.4 (Datenbank-Baseline) ist der offizielle Supabase Remote MCP Server projektspezifisch unter `.cursor/mcp.json` konfiguriert. Begründung in [DECISIONS.md](DECISIONS.md), ADR-0030.

| Vorgabe | Umsetzung |
| --- | --- |
| Server | `https://mcp.supabase.com/mcp` (offiziell, remote) |
| Authentifizierung | `Authorization: Bearer` über Environment-Secret `SUPABASE_ACCESS_TOKEN` |
| Scope | ausschließlich `SUPABASE_PROJECT_REF` (Development-Branch) |
| Feature-Gruppen | `database`, `debugging`, `development` |
| Production | keine zweite Verbindung, kein Production-`project_ref` |

Cursor interpoliert die Werte zur Laufzeit über `${env:SUPABASE_PROJECT_REF}` und `${env:SUPABASE_ACCESS_TOKEN}`. Im Repository stehen nur die Platzhalter, niemals Token oder Projekt-Refs.

Diese Verbindung ist ein Entwicklerwerkzeug. Sie ersetzt weder die App-Clients aus Abschnitt 3 noch Service-Role-Zugriff in der Anwendung.

Verifikation am 17. August 2026 gegen den offiziellen Remote-Server, vor Phase 1.4: Authentifizierung erfolgreich, genau die zehn Werkzeuge der drei Feature-Gruppen, Account-/Branching-/Functions-/Storage-Werkzeuge abwesend, Projekt-URL identisch mit `SUPABASE_PROJECT_REF`. `list_tables` lieferte damals 39 Tabellen in `public`; nach Phase 1.4b sind es 8 und nach Phase 1.5 elf.

Dieselben Zugangsdaten – Personal Access Token und Projekt-Referenz – nutzen die Skripte in `scripts/db/` über die Management API. Sie sind der Weg, auf dem Phase 1.4 und 1.4b inventarisiert, Migrationen angewendet und Nachweise geführt haben; ein Datenbankpasswort oder ein Service-Key war dafür nicht nötig. Beschreibung in [docs/DATENBANK.md](docs/DATENBANK.md), Abschnitt 2. Ein späterer Production-Import geht nicht über MCP, sondern nur über den manuellen Mehrfachschutz in [docs/PRODUCTION_ROLLOUT.md](docs/PRODUCTION_ROLLOUT.md).

---

## 4. Auth und Zugriffsschutz

Sessions laufen über Supabase-Auth-Cookies. Serverseitig wird die Identität immer mit `auth.getUser()` ermittelt, nie mit `auth.getSession()`: Letzteres liest nur die mitgeschickten Cookies und prüft die Signatur nicht nach.

**Drei Schichten, jede mit einer Aufgabe.** Die Trennung ist bewusst; Begründung in [DECISIONS.md](DECISIONS.md) ADR-0028.

| Schicht | Datei | Aufgabe | Antwort bei Ablehnung |
| --- | --- | --- | --- |
| Anmeldung | `middleware.ts` | ist ein verifiziertes Konto vorhanden? Gilt für `/admin`, `/api/admin`, `/account` | Seiten: Weiterleitung zur passenden Anmeldung mit Rücksprungziel. API: 401 als JSON |
| Berechtigung Seiten | `app/(admin)/layout.tsx` | Rollenprüfung für die **gesamte** Routengruppe, auch für künftige Seiten | Weiterleitung auf `/admin/login` oder `/unauthorized?grund=…` |
| Berechtigung API | `requireAdminApi()` je Route | Rollenprüfung, in der CI durch `check:api-schutz` erzwungen | 401 / 403 / 503 als JSON, **nie** eine Weiterleitung |
| Datenzugriff | `lese()` in `lib/api/datenbank-lesen.ts` | trennt eine erfolgreiche leere Abfrage von einem Fehler der Datenbank | 500 bei Ablehnung, 503 bei Ausfall, jeweils als JSON |

`/admin/login` liegt in der Gruppe `(public)` und ist von der Rollenprüfung ausgenommen – andernfalls entstünde eine Endlosschleife.

**Das Rollenmodell steht an einer Stelle.** `lib/auth/roles.ts` enthält die sechs Rollen, ihre Rangfolge, den Bereichszugang und die Regeln der Rollenvergabe – ohne Next- und Supabase-Importe, damit die Regeln ohne Laufzeit prüfbar sind. `lib/auth/admin-access.ts` trifft die Zugangsentscheidung als reine Funktion, `lib/auth/admin-guard.ts` führt sie aus und protokolliert sie.

Seit Phase 1.4 gilt dasselbe Modell auch in der Datenbank: `public.rollenrang()`, `public.aktuelle_rolle()` und `public.hat_rolle_mindestens()` sind die Grundlage jeder Policy. Bis dahin entschieden vier Stellen unabhängig voneinander über Administrationsrechte – ein Konto konnte in der Anwendung `user` sein und in den Policies trotzdem Administrator. `lib/auth/roles-datenbank.test.ts` vergleicht bei jedem `npm test` die Rangfolge in TypeScript mit der im Migrations-SQL, ohne Datenbank. Einzelheiten in [docs/DATENBANK.md](docs/DATENBANK.md), Abschnitt 6.

**Zwischen Rolle und Zugriff steht eine Fähigkeit.** Eine Route verlangt nicht „mindestens `operator`", sondern die Fähigkeit `betrieb-eingreifen`; eine Policy ruft nicht `hat_rolle_mindestens('operator')` auf, sondern `public.darf_betrieb_eingreifen()`. Die Mindestrolle steht damit an genau einer Stelle: in `CAPABILITY_MINIMUM` in `lib/auth/roles.ts`. Der Umweg ist die Antwort auf einen realen Bruch – der erste Durchgang von Phase 1.4 stellte alle Policies pauschal auf `admin`, während die Anwendung ab `moderator` hereinliess, sodass eine Moderation durch den Gate kam und danach von RLS leer ausging. `lib/auth/faehigkeiten-datenbank.test.ts` vergleicht beide Seiten ohne Datenbank, `npm run db:rechte` lehnt jede Policy ab, die eine Rolle direkt nennt ([DECISIONS.md](DECISIONS.md) ADR-0035).

Die Entscheidung unterscheidet drei Zustände der Rollenabfrage: Rolle vorhanden, keine Rolle hinterlegt, Abfrage fehlgeschlagen. Ein Ausfall führt nie zu einer Freigabe. Reguläre Quelle ist die Datenbankrolle; `ADMIN_ALLOWED_EMAILS` ist ein Notzugang aus exakten Adressen, dessen Nutzung protokolliert wird. Eine Domain erteilt keine Berechtigung ([DECISIONS.md](DECISIONS.md) ADR-0027).

Der Notzugang öffnet die Oberfläche, nicht die Datenbank. Die Policies kennen die Liste nicht und sollen sie nicht kennen – sonst stünde neben `creator_profiles.role` wieder eine zweite Autorität. Eine solche Sitzung sieht deshalb einen Hinweis über der gesamten Administrations-Shell, statt leere Übersichten, die sich als Entwarnung lesen liessen. `reachesDatabase()` in `lib/auth/admin-access.ts` hält den Satz als prüfbare Funktion fest ([DECISIONS.md](DECISIONS.md) ADR-0036).

**Die Einstellungen des Auth-Servers stehen im Repository.** Die Anmeldung ist der Weg *in* die Anwendung, ihre Konfiguration liegt aber nicht in der Datenbank, sondern beim Auth-Server – ein Klick im Dashboard ändert sie ohne Migration und ohne Commit. Seit Phase 1.4c beschreibt der Abschnitt `[auth]` in `supabase/config.toml` deshalb den Development-Branch, nicht die CLI-Vorlage. Was die Datei nicht ausdrücken kann – voran der Schutz vor kompromittierten Passwörtern –, steht mit Begründung in `lib/supabase/auth-erwartung.ts`.

`npm run auth:pruefen` vergleicht beides mit dem laufenden Branch und verlangt für **jeden** der 242 Schlüssel der Management API eine Aussage des Repositories; zwei Musterregeln fangen jeden neuen Anmeldedienst und jeden Auth-Hook. Die Rechnung selbst liegt in `lib/supabase/auth-bericht.ts` und ist ohne Supabase-Zugang prüfbar; sie nennt bei einem unbekannten Schlüssel nur den Namen, weil dessen Inhalt niemand begutachtet hat. `npm run auth:fluesse` prüft die Wirkung statt der Werte, an den echten Endpunkten. Beides zielt ausschliesslich auf den Branch aus `SUPABASE_PROJECT_REF`: `scripts/auth/ziel.ts` fragt bei Supabase, ob der Ref ein Branch ist, und bricht bei einem eigenständigen Projekt ab. Einzelheiten in [docs/AUTH.md](docs/AUTH.md), Entscheidung in [DECISIONS.md](DECISIONS.md) ADR-0039.

Die Passwortregel, die beide Formulare zeigen und prüfen, steht in `lib/auth/passwort-richtlinie.ts` und wird bei jedem `npm test` mit `config.toml` verglichen – ohne Datenbank und ohne Netz.

Weitere Punkte:

- Nach Anmeldung, Registrierung, OAuth-Callback und Passwortwechsel führt der Weg auf `/reisen` ([DECISIONS.md](DECISIONS.md), ADR-0019).
- Fehlen die Supabase-Umgebungsvariablen, sperrt die Middleware die geschützten Bereiche und protokolliert das. Bis Phase 1.3 liess sie in diesem Fall durch – ein Bereich, der bei fehlender Konfiguration aufgeht, ist das Gegenteil von Schutz.
- Server-Actions sind eigene Eintrittspunkte und werden von keinem Layout geschützt; sie prüfen selbst.
- Abmelden ist eine Server-Action, kein Pfad ([DECISIONS.md](DECISIONS.md), ADR-0023) – und seit dem Nachtrag der Phase 1.5 auch im öffentlichen Bereich erreichbar. `components/layout/PublicNavbar.tsx` liest die Sitzung clientseitig aus den Cookies, die der Server gesetzt hat; die Entscheidung, was die Leiste zeigt, liegt in `lib/auth/oeffentliche-navigation.ts` und ist ohne Browser prüfbar. Das öffentliche Layout bleibt dadurch statisch (ADR-0047). Gelesen wird nach dem ersten Aufbau, nach jedem Wechsel des Pfads und nach jedem abgeschlossenen Abmeldevorgang: Die Leiste liegt im Layout und wird von der Weiterleitung der Server Action nicht neu aufgebaut, `onAuthStateChange` schweigt bei einem Abmelden über den Server.

**Die Rolle liegt seit Phase 1.5 in `public.profiles`.** Die Tabelle hiess bis dahin `creator_profiles` – ein Name aus der alten Produktidee. Weil er nur in `ROLE_TABLE` in `lib/auth/admin-guard.ts` stand, war die Umstellung eine einzelne Änderung im Anwendungscode. Mit der Umbenennung sind die neun Spalten der öffentlichen Creator-Identität entfallen; was bleibt, ist das, was ein Reisekonto braucht: Kennung, E-Mail, Anzeigename, Avatar, Rolle, Status, Zeitstempel. Persönliche Reisepräferenzen bekommen eigene Spalten oder eine eigene Tabelle, wenn sie fällig sind – nicht die freigewordenen ([DECISIONS.md](DECISIONS.md) ADR-0044).

**Nach Anmeldung und Registrierung führt der Weg über eine Übernahme.** Liegt im Browser eine Gastreise, überträgt `lib/trips/uebernahme.ts` sie in das Konto, bevor „Meine Reisen" etwas anzeigt; der lokale Entwurf verschwindet erst, wenn der Server die Kennung der gespeicherten Reise gemeldet hat. Einzelheiten in Abschnitt 5 und in [docs/REISEN.md](docs/REISEN.md).

---

## 5. Datenfluss der V2-Reiseschicht

Die V2-Produktschicht liegt in der Route-Gruppe `app/(public)`:

| Pfad | Aufgabe |
| --- | --- |
| `/` | Startseite mit Positionierung und Einstieg in die Reiseplanung |
| `/planen` | Reisebeschreibung in eigenen Worten (`components/trips/Reiseidee.tsx`) und darunter das Formular (`components/trips/TripPlanner.tsx`). Feldfehler sitzen am Feld, nicht nur unter der Absenden-Taste (ADR-0068). |
| `/reisen` | Übersicht der Reisen – im Konto aus Supabase, als Gast die eine Gastreise |
| `/reisen/[tripId]` | Trip Workspace: auf schmalen Viewports kompakte Übersicht mit eingebettetem Tagesplan plus Bereiche Flüge, Unterkunft, Aktivitäten, Mobilität; ab 1024 px die bisherige breite Arbeitsansicht. Flüge, Unterkunft und Mobilität zeigen zuerst Bestand/Abdeckung, erst darunter die bestehende Suche. Production-Suchen bleiben aus. |

**Seit Phase 1.5 gibt es zwei Wege, und sie unterscheiden sich nur im Speicher.** Fachliche Beschreibung: [docs/REISEN.md](docs/REISEN.md), Entscheidungen in [DECISIONS.md](DECISIONS.md) ADR-0041 bis ADR-0043.

| Schicht | Datei | Aufgabe |
| --- | --- | --- |
| Domänenmodell | `types/trips.ts` | eine Reise, wie die Anwendung sie kennt – gleich für Gast und Konto |
| Validierung | `lib/trips/schema.ts` | Zod-Schemas für jede Eingabe und für die Nutzlast an die Datenbank |
| Abbildung | `lib/trips/abbildung.ts` | zwischen Datenbankzeile (`snake_case`) und Domänenmodell (`camelCase`) |
| Gastspeicher | `lib/trips/gastspeicher.ts` | die eine Gastreise im `localStorage`, Schlüssel `jetnity:reise:v3`; jeder Schreibvorgang wird zurückgelesen, ein Fehlschlag wirft (ADR-0046) |
| Lesen im Konto | `lib/trips/daten.ts` | `server-only`, Anon-Key, kein `eq('user_id', …)` – RLS filtert |
| Schreiben im Konto | `lib/trips/aktionen.ts` | Server Actions, Identität über `auth.getUser()`, Rückgabe als Ergebnis statt als Ausnahme |
| Übernahme | `lib/trips/uebernahme.ts` | Gastreise ins Konto, idempotent, ohne React und damit prüfbar |
| Mobile-IA | `lib/trips/arbeitsbereich.ts` | sichtbare Hauptbereiche, Planstatus der Übersicht, gemeinsame Tagesauswahl, Mount-/Sichtbarkeitsregeln; kein zweiter Reise-State |
| Buchungsstatus | `lib/trips/buchung.ts` | `unconfirmed` vs. `booked`; Quelle nur `user`; keine Provider-Behauptung aus dem Browser |
| Flugabdeckung | `lib/trips/flug-abdeckung.ts` | benötigte Abschnitte aus Origin und Etappen; Match nur bei eindeutigem Datum; sonst unbestimmt |
| Nachtabdeckung | `lib/trips/naechte-abdeckung.ts` | halboffenes `[checkIn, checkOut)`; Überlappungen als Vereinigung; unbekannte Daten nicht als `0/14` |

Die serverseitigen Module benutzen ausschliesslich die Clients aus Abschnitt 3 und damit die Rechte des angemeldeten Kontos. Ein Filter auf `user_id` steht bewusst nirgends: Wer die Zugehörigkeit im Code filtert, hat sie in dem Moment nicht mehr durchgesetzt, in dem er den Filter vergisst.

**Der Gast bleibt ohne serverseitige Identität.** Er hat genau eine aktive Gastreise im Browser; `anon` hat auf keiner Reisetabelle ein Recht und auf `public.reise_anlegen()` kein EXECUTE. Bei Anmeldung oder Registrierung wandert die Gastreise genau einmal ins Konto – die Idempotenz trägt `unique (user_id, client_ref)` in der Datenbank, nicht ein Vermerk im Browser ([DECISIONS.md](DECISIONS.md) ADR-0042).

Damit ist die frühere Ist-Ziel-Abweichung aufgelöst: Reisen eines Kontos liegen in der Datenbank, `localStorage` trägt nur noch den Gastentwurf – und für den ist er nach [AGENTS.md](AGENTS.md) Regel 13 zulässig, weil der Weg ins Konto existiert und geprüft ist. Was bleibt, ist die Eigenschaft einer Gastreise: Sie ist an einen Browser gebunden und mit dessen Speicher weg.

Bewusste Datenschutzregel, unverändert: Weder im Browserspeicher noch in den Reisetabellen werden Passnummern, Ausweiskopien, Visa-Dokumente, Zahlungs- oder Gesundheitsdaten verarbeitet. Für sie wäre ein getrennter Sicherheitsbereich nötig; er ist in [ROADMAP.md](ROADMAP.md) bewusst verschoben.

---

## 5a. Der Reisevorschlag aus natürlicher Sprache

Vollständige Beschreibung: [docs/MODELL.md](docs/MODELL.md). Hier steht, wie die Schicht in die Architektur greift.

Seit Phase 2.1 gibt es unter `/planen` neben dem Formular einen zweiten Einstieg: eine freie Reisebeschreibung. Aus ihr entsteht ein strukturierter Entwurf mit Etappen, Tagen und Planpunkten.

```
Freitext → Eingabeprüfung → Modellzustand → Routing (Terra/Sol)
  → Kontingent buchen → Modellaufruf → Nutzung abschliessen → Antwortprüfung
  → Vorgaben (eine Korrektur) → Vorschau → Freigabe → Persistenz
```

| Schicht | Datei | Aufgabe |
| --- | --- | --- |
| Konfiguration | `lib/modell/konfiguration.ts` | Kill Switch, Modellwahl, alle Grenzen, neun Ergebnisklassen |
| Preise | `lib/modell/preise.ts` | Preise in Mikrodollar, Kostenrechnung, Reservierung |
| Anfrage und Antwort | `lib/modell/anfrage.ts`, `antwort.ts` | Anfragekörper; HTTP-Status und Antwortobjekt → Ergebnisklasse |
| Aufruf | `lib/modell/aufruf.ts` | der eine `fetch`, `server-only`, Terra/Luna 90 s, Sol 120 s |
| Kontingent | `lib/modell/kontingent.ts` | Gastkennung als Cookie, Dienstclient nur für die zwei Kontingent-RPCs |
| Vorschlagsschema | `lib/reisevorschlag/schema.ts` | Zod- und JSON-Schema, fachliche Stimmigkeit, Fassung |
| Systemregeln | `lib/reisevorschlag/regeln.ts` | der einzige Prompt, den Jetnity schreibt |
| Routing | `lib/reisevorschlag/routing.ts` | Terra Standard, Sol bei Komplexität, Luna nie automatisch |
| Vorgaben | `lib/reisevorschlag/vorgaben.ts` | harte Constraints, höchstens eine Korrektur |
| Fortschritt | `lib/reisevorschlag/fortschritt.ts` | zeitgesteuerte Phasen ohne erfundene Prozente |
| Normalisierung | `lib/reisevorschlag/normalisierung.ts` | Steuerzeichen und Preisangaben aus Modelltext |
| Ablauf | `lib/reisevorschlag/erzeugen.ts` | die Kette oben, mit Ports statt Verbindungen |
| Abbildung | `lib/reisevorschlag/abbildung.ts` | Vorschlag → `Trip` (Gast) bzw. `ReiseNutzlast` (Konto) |
| Server Actions | `lib/reisevorschlag/aktionen.ts` | `vorschlagErzeugen()`, `vorschlagUebernehmen()` |

Seit Phase 2.2 hängt am bestehenden Unterbau ein zweiter Weg, **ohne** zweiten Stack:

```
Bestehende Reise → Änderungswunsch → Kontingent (gemeinsam mit reisevorschlag)
  → Operationen → deterministisch anwenden → Vorschau → Bestätigung
  → public.reise_aendern()  bzw.  gastreiseAendern()
```

| Schicht | Datei | Aufgabe |
| --- | --- | --- |
| Operationsschema | `lib/reiseaenderung/schema.ts` | Zod- und JSON-Schema, ohne Handelsfelder |
| Anwenden | `lib/reiseaenderung/anwenden.ts` | Operationen auf den vertrauenswürdigen Graphen |
| Diff | `lib/reiseaenderung/diff.ts` | Vorher/Nachher in Sätzen |
| Ablauf | `lib/reiseaenderung/erzeugen.ts` | wie 2.1, mit Ports |
| Server Actions | `lib/reiseaenderung/aktionen.ts` | Erzeugen speichert nichts; Übernehmen wendet erneut an |

Das Modell ändert die Datenbank nicht (ADR-0059). Account-Schreiben ist `SECURITY INVOKER` und atomisch (ADR-0060). `trip_days.stage_id` bindet Tage an Etappen, auch ohne Kalenderdaten (ADR-0057). `trips.revision` steigt bei jeder fachlichen Graphänderung und bei direkten Stammdaten-Updates, nicht nur in `reise_aendern()` (ADR-0058). Gast und Konto speichern ungeplante Planpunkte gleich (ADR-0061). Kommerzielle Planpunkte – einschliesslich übernommener Flüge – sind bei Modelloperationen vollständig gesperrt (ADR-0059 Nachtrag, ADR-0060). `reise_aendern()` schiebt die Eindeutigkeit von Tagesnummer und -datum bis zum fertigen Graphen auf (ADR-0060 Nachtrag).

**Es entsteht keine zweite Persistenz.** Ein Vorschlag aus 2.1 lebt bis zur Freigabe im React-Zustand; danach schreiben Gastweg (`gastreiseAblegen()`) und Kontoweg (`public.reise_anlegen()`) wie das Formular. Eine Änderung aus 2.2 lebt ebenso nur in der Vorschau; danach schreiben `gastreiseAendern()` bzw. `public.reise_aendern()`.

**Modelloutput ist untrusted input.** Die Antwort wird zweimal geprüft: von der Plattform gegen ein JSON-Schema mit `strict: true`, danach von Jetnity gegen ein Zod-Schema mit den fachlichen Grenzen des Reiseschemas. Beim Übernehmen läuft dieselbe Prüfung noch einmal, weil der Vorschlag durch den Browser gelaufen ist (ADR-0053).

**Der Vorschlag kann keine Preise, Anbieter oder Verfügbarkeiten enthalten.** Das Schema hat diese Felder nicht, `additionalProperties: false` macht sie unaussprechbar, und die Normalisierung entfernt Beträge aus Freitexten. Nach der Abbildung sind `price_amount`, `price_currency`, `provider`, `external_ref` und `booking_url` `null`; ein genanntes Budget ist ein Ziel in `trips.budget_amount` (ADR-0054).

**Production bleibt aus.** Preview hat Kill Switch und Schlüssel. `modellZustand()` verlangt `JETNITY_MODELL_AKTIV`, einen `OPENAI_API_KEY` und ein Modell mit bekanntem Preis. Fehlt eines, entsteht kein Aufruf, und die Oberfläche sagt es – das Formular unter `/planen` bleibt vollständig benutzbar. Was zur Aktivierung nötig ist, steht in [docs/MODELL.md](docs/MODELL.md), Abschnitt 8.

---

## 6. Datenbank

Vollständige Beschreibung: [docs/DATENBANK.md](docs/DATENBANK.md). Hier steht nur, wie sie in die Architektur eingebunden ist.

**Das Schema ist seit Phase 1.4 aus dem Repository reproduzierbar.** Die Migrationen in `supabase/migrations/` beschreiben – nach der Entfernung der Legacy-Struktur in Phase 1.4b, dem Reiseschema aus Phase 1.5, dem Kostenprotokoll aus Phase 2.1 und der Sprachänderung aus Phase 2.2 – die Production-Reisetabellen plus `public.model_usage`. Foundation C hat `trip_readiness_items` und `trip_travellers` nach ausdrücklicher Freigabe auf Production gebracht (Acceptance `docs/PR32_PRODUCTION_MIGRATION_ACCEPTANCE.md`). Foundation D liegt auf `main` und Production (Acceptance `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`). Foundation E ergänzt auf Development `trip_traveller_citizenships`, `trip_traveller_documents`, optionales `trip_readiness_items.traveller_id` und `public.party_schreiben()` (ADR-0117, ADR-0118). Production bleibt ohne Foundation-E-Schema, bis eine separate Freigabe folgt.

Vier der Production-Reisetabellen sind `trips`, `trip_stages`, `trip_days`, `trip_items`. Sie sind privat und tragen ihre Eigentümerkennung selbst; ein zusammengesetzter Fremdschlüssel `(trip_id, user_id) → trips (id, user_id)` verhindert, dass ein Kind an einer fremden Reise hängt. `trip_days.stage_id` bindet einen Tag an eine Etappe derselben Reise, auch ohne Kalenderdatum (ADR-0057). `trips.revision` und `trips.last_mutation_id` tragen Fassung und Idempotenz einer Sprachänderung (ADR-0058). `trip_items` trägt seit PR #29 die provider-neutralen Spalten `booking_status`, `booking_source` und `booking_confirmed_at` (ADR-0089). Foundation A ergänzt optionale Mobilitätsspalten auf derselben Tabelle, ohne neue `kind`-Werte (ADR-0090). Foundation B ergänzt `kind = rental_car` (ADR-0092). Foundation C legt Readiness **nicht** als neuen `kind` an, sondern als eigene Tabelle `trip_readiness_items` plus trip-spezifischen Reisendenkontext `trip_travellers` (ADR-0096, ADR-0102). Die Requirements-Engine ist provider-neutral und ohne Adapter (ADR-0103). Official Evidence wird vor regulatorischen Resultaten streng validiert (ADR-0107). Origin- und Transit-Ländercodes kommen nur über `routeFactsAusReise()` aus validierten Flight-Itineraries in `trip_items.metadata` (ADR-0108, ADR-0112). Enum-Typen führt das Schema keine mehr – jeder Wertebereich steht in einer Prüfbedingung ([DECISIONS.md](DECISIONS.md) ADR-0043).

Die zwölfte Tabelle ist `public.model_usage` aus Phase 2.1 – ein Kostenprotokoll, keine Nutzdaten. Sie ist die Stelle, an der die Kostenkontrolle für Modellaufrufe wirklich stattfindet: Ein Zähler in einem Serverprozess kennt nur seine eigene Instanz, und Vercel startet beliebig viele. Zwei `SECURITY DEFINER`-Funktionen buchen ein Kontingent, bevor ein Aufruf geschieht, und schliessen es danach ab; `pg_advisory_xact_lock` serialisiert Prüfung und Einfügung – dieselbe Bauweise wie die Missbrauchsschranke aus ADR-0049. Einzelheiten in [docs/MODELL.md](docs/MODELL.md), Begründung in ADR-0052.

Auf dieser Tabelle hat `anon` **kein** Recht, und auf den beiden Funktionen hat weder `anon` noch `authenticated` ein `EXECUTE`. Die Server Action ruft sie über den cookie-losen Dienstclient auf (ADR-0052, Nachtrag). Lesen darf die Tabelle nur, wer `betrieb-lesen` hat; ändern und löschen darf sie niemand – ein Kostenprotokoll, das sein Eigentümer aufräumen kann, ist keins.

Drei Regeln halten das zusammen:

| Regel | Durchsetzung |
| --- | --- |
| Schemaänderungen entstehen als Migration, nicht in der Supabase-Oberfläche | `npm run db:reproduzierbarkeit` baut das Schema aus den Migrationen neu auf und vergleicht Abschnitt für Abschnitt mit dem laufenden |
| `types/supabase.ts` wird erzeugt, nicht gepflegt | `npm run db:typen -- --pruefen` |
| Der Code spricht nur an, was es gibt | `npm run check:schema-bezug`, in der CI |

Die ersten beiden brauchen den Development-Zugang und laufen vor einer Zusammenführung von Hand. Die dritte liest nur die erzeugte Typdatei und läuft in der CI mit.

**Zugriffsschutz.** RLS ist auf allen 12 Tabellen eingeschaltet. `anon` und `authenticated` haben kein Tabellenrecht, das nicht eine Policy braucht – geprüft in beide Richtungen durch `npm run db:rechte`. Bis Phase 1.4 hatten beide Rollen auf jeder Tabelle alle Rechte einschließlich `TRUNCATE`, das RLS vollständig umgeht. Ohne Anmeldung lesbar ist seit Phase 1.4b nur noch `airports`.

Auf den vier Reisetabellen prüft **keine** Policy eine Fähigkeit: Adminrechte öffnen private Reiseinhalte nicht, und das gilt bis zur Rolle `owner`. Die Kennzahlen des Administrationsbereichs kommen deshalb aus zwei `SECURITY DEFINER`-Funktionen, die ausschliesslich Anzahlen liefern und die Fähigkeit `betrieb-lesen` selbst prüfen ([DECISIONS.md](DECISIONS.md) ADR-0041).

Seit Phase 1.4b prüft `npm run db:rechte` eine vierte Regel: Keine Funktion nennt eine Struktur, die es nicht gibt. Tabellenbezüge im Rumpf einer Funktion stehen nicht in `pg_depend`, PostgreSQL verfolgt sie also nicht – 18 Funktionen hätten die Entfernung ihrer Tabellen unbemerkt überlebt und erst beim Aufruf gescheitert. Das ist dieselbe Fehlerklasse, die `npm run check:schema-bezug` für den Anwendungscode abdeckt, nun auch für die Datenbank selbst.

`npm run db:sicherheit` führt benannte Nachweise, positiv und negativ, gegen den Development-Branch. Sie belegen unter anderem, dass sich kein Konto selbst befördert, keine Rolle eine fremde Reise liest, dieselbe Gastreise zweimal übernommen genau eine Reise ergibt – und dass `public.reise_aendern()` eine veraltete Fassung ablehnt, denselben Retry nicht zweimal anwendet, kommerzielle Felder nicht überschreibt, bei Fehler die Revision zurückrollt, Tagesumnummerierungen ohne UNIQUE-Konflikt durchführt und dass ein direkter Planpunkt die Fassung erhöht.

**Die Reisedaten liegen seit Phase 1.5 in der Datenbank.** Phase 1.4b hatte die 29 Tabellen der alten Produktidee entfernt und damit ein Schema hinterlassen, das nur noch beschrieb, was verwendet wird – aber keine Reise speichern konnte. Die vier Reisetabellen füllen diese Lücke; `creator_sessions`, die letzte Alt-Tabelle, ist mit derselben Phase entfallen. Der Übergang ist in [docs/LEGACY_ENTFERNUNG.md](docs/LEGACY_ENTFERNUNG.md) belegt, das Ergebnis in [docs/DATENBANK.md](docs/DATENBANK.md) beschrieben, das Modell fachlich in [docs/REISEN.md](docs/REISEN.md).

---

## 7. API-Schicht

Nach Phase 1.1, 1.1b, 1.3, 1.4, 3.1, 3.2, 3.3, Foundation A, Foundation B und Draft-Foundation C existieren **18** Route Handler. Zuvor waren es 77.

| Endpunkt | Zweck | Status |
| --- | --- | --- |
| `api/search/airports` | Flughafendaten | nur `public.airports`; Import ist ein Skript, kein Request-Pfad |
| `api/search/places` | Reiseziel- und Abreiseorte | nur `public.places`; Import ist ein Skript, kein Geocoding-Proxy |
| `api/flights/search` | geschlossene Flugsuche | Phase 3.1, Production aus, nur Duffel-Test |
| `api/hotels/search` | geschlossene Hotelsuche | Phase 3.2c, Production aus, noch kein Hotelprovider |
| `api/activities/search` | geschlossene Aktivitätensuche | Phase 3.3, Production aus, noch kein Activity-Provider |
| `api/mobility/search` | geschlossene Mobilitätssuche | Foundation A, Production aus, noch kein Mobility-Provider |
| `api/rental-cars/search` | geschlossene Mietwagensuche | Foundation B, Production aus, noch kein Mietwagenprovider |
| `api/readiness/requirements` | geschlossene Requirement-Naht | Foundation C Draft-PR #32, kein Provider, Production-Schema unverändert |
| `api/admin/payments/*` (5) | Zahlungen, Refunds, Webhooks | behalten ohne Priorität (ADR-0010) |
| `api/admin/security/*` (5) | Sicherheitsereignisse, IP-Sperren | für den späteren Admin-Umfang vorgesehen |

Alle zehn Endpunkte unter `api/admin` prüfen die Berechtigung über `requireAdminApi()`; `npm run check:api-schutz` erzwingt das in der CI. Lesende Endpunkte verlangen die Fähigkeit `betrieb-lesen` (ab `moderator`), eingreifende – Rückerstattung, Sperren, Entsperren – `betrieb-eingreifen` (ab `operator`). Dieselben Fähigkeiten gelten in den Policies, sodass ein Endpunkt, der jemanden durchlässt, ihm auch die Daten zeigen kann.

Was die Datenbank nicht liefert, meldet der Endpunkt, statt es zu verschweigen: Eine Ablehnung wird 500, ein Ausfall 503, jeweils mit `{ message }`; eine erfolgreiche Abfrage ohne Zeilen bleibt eine leere Liste mit 200. Die Unterscheidung steht einmal in `lese()` in `lib/api/datenbank-lesen.ts` und nicht in den Routen ([DECISIONS.md](DECISIONS.md) ADR-0037). Von RLS weggefilterte Zeilen sind bewusst kein Fehler – das ist der Fall einer Notzugangs-Sitzung, den der Hinweisbalken erklärt.

Die Oberfläche gibt das seit Phase 1.4d weiter, statt es in eine leere Tabelle zu verwandeln. Die Deutung einer Antwort steht einmal in `lib/admin/ladezustand.ts` – bewusst frei von React, Next und `fetch`, damit beide Fälle ohne Laufzeit prüfbar sind –, die Darstellung einmal in `components/admin/Ladezustand.tsx`. Ansichten, die serverseitig lesen (Startseite der Administration, Benutzerverwaltung), holen die Einordnung 500/503 über `problemAus()` aus derselben Stelle wie die Routen und zeigen dieselbe Fläche, nur ohne Wiederholen-Schaltfläche. Einzelheiten in [DECISIONS.md](DECISIONS.md) ADR-0040.

Phase 1.4 hat drei weitere entfernt: `security/block-ip` und `security/unblock-ip` waren Doppelungen von `security/block` und `security/unblock` ohne Aufrufer, `security/overview` rief eine Funktion auf, die es nicht gab, und hatte ebenfalls keinen Aufrufer.

`app/auth/refresh` ist mit Phase 1.3 entfallen. Der Endpunkt sollte Sessions erneuern, konnte es aber nie: Sein Cookie-Adapter gab für jeden Namen `undefined` zurück und verwarf jedes Schreiben.

Entfernt wurden 63 Endpunkte: alle KI- und Modell-Endpunkte, die Media- und Video-Render-Pipeline, Creator-, Feed-, Session- und Publishing-Endpunkte, die Content-Endpunkte, die Infomaniak-DNS- und Mail-Automatisierung sowie mit Phase 1.1b die Alt-Suche `api/search`. Begründung und Umfang in [DECISIONS.md](DECISIONS.md), ADR-0014 und ADR-0018.

**Grundsatz für neue Endpunkte:** Kein Endpunkt ist standardmäßig offen. Die Prüfliste steht in [AGENTS.md](AGENTS.md) Regel 15.

### Flugsuche (Phase 3.1)

`POST /api/flights/search` ist geschlossen: nur die Jetnity-Suchanfrage, nur die normalisierte Antwort. Kein Provider-Proxy. UI, Ranking und Reisegraph sprechen `FlugOption`, nicht Duffel.

Duffel ist der erste Datenadapter, nicht die Produktarchitektur. Search und Booking/Affiliate sind getrennt; `booking_url` bleibt `null`. Ein späterer Skyscanner- oder Aviasales-Adapter implementiert dasselbe `FlightProvider`-Interface. Amadeus Self-Service ist eingestellt und nicht angebunden.

Production bleibt hart aus. Development/Preview brauchen `JETNITY_FLIGHT_AKTIV` und `DUFFEL_ACCESS_TOKEN` (`duffel_test_…`). Fehlende Credentials sind Feature-unavailable, kein Buildfehler. Fachlich: [docs/FLUEGE.md](docs/FLUEGE.md), ADR-0062 bis ADR-0065.

### Flughafenbasis (Phase 3.1)

`GET /api/search/airports` liest ausschliesslich `public.airports`. Der Bestand kommt aus OurAirports Open Data (Public Domain), gefiltert und idempotent über `npm run airports:importieren` geschrieben. Weder Build noch CI noch eine Nutzersuche laden den Upstream. Production-Schreiben nur über [docs/PRODUCTION_ROLLOUT.md](docs/PRODUCTION_ROLLOUT.md). Fachlich: [docs/FLUGHAFEN.md](docs/FLUGHAFEN.md), ADR-0066.

### Hotelsuche (Phase 3.2 / 3.2c)

`POST /api/hotels/search` ist geschlossen: nur `application/json`, höchstens 16 KB UTF-8. `Content-Length` über dem Limit wird vor dem Lesen abgewiesen; der Body wird zusätzlich streamend mit hartem Cap gelesen. Quartierkontext, Quartierbewertung, optional Provider, Ranking, Client-Sicht. Kein Provider-Proxy. 429 setzt `Retry-After`. Die UI spricht `HotelOption` und ein sichtbares Quartier, nicht einen Anbieter.

Phase 3.2c hat bewusst keinen Hoteladapter. `hotelProviderAus()` gibt `null` zurück. Production bleibt hart aus. Development/Preview brauchen `JETNITY_HOTEL_AKTIV` **und** einen späteren Provider; fehlender Zugang ist Feature-unavailable, kein Buildfehler. Quartiergründe entstehen nur aus vorhandenen Reisedaten. Wegezeiten, ÖV-Zeiten und POIs werden nicht erfunden. Ein Etappenort wird nicht als Viertel verkauft.

Die Konto-Übernahme speichert keine Browseroption. Sie prüft den Reisegraphen und verlangt einen serverseitigen `HotelNachweis` gegen Ziel, Zeitraum, Belegung und Währung. Heute ist der Nachweis `null` – fail closed. Gast-LocalStorage gilt nicht als serverseitig verifiziert. Fachlich: [docs/HOTELS.md](docs/HOTELS.md), ADR-0070 bis ADR-0077.

### Aktivitätensuche (Phase 3.3)

`POST /api/activities/search` ist geschlossen: nur `application/json`, höchstens 16 KB UTF-8. `Content-Length` über dem Limit wird vor dem Lesen abgewiesen; der Body wird zusätzlich streamend mit hartem Cap gelesen. Tageskontext, optional Provider, Konfliktprüfung, Ranking, Client-Sicht. Kein Provider-Proxy. 429 setzt `Retry-After`. Die UI spricht `ActivityOption`, nicht einen Anbieter.

Phase 3.3 hat bewusst keinen Activity-Adapter. `activityProviderAus()` gibt `null` zurück. Production bleibt hart aus. Development/Preview brauchen `JETNITY_ACTIVITY_AKTIV` **und** einen späteren Provider; fehlender Zugang ist Feature-unavailable, kein Buildfehler. Der Tageskontext entsteht nur aus vorhandenen Reisedaten. Öffnungszeiten, Wegezeiten und minutengenaue Lücken werden nicht erfunden. Fehlende Uhrzeiten gelten nicht als konfliktfrei. Die interne Audit-Seite `/ui-audit/activities` ist in Production unabhängig von `JETNITY_UI_AUDIT` fail closed (ADR-0086).

Die Konto-Übernahme speichert keine Browseroption. Sie prüft den Reisegraphen und verlangt einen serverseitigen `ActivityNachweis` gegen Ziel, Datum, Teilnehmer, Währung und den Timeslot der Option. Heute ist der Nachweis `null` – fail closed. Gast-LocalStorage gilt nicht als serverseitig verifiziert. Fachlich: [docs/ACTIVITIES.md](docs/ACTIVITIES.md), ADR-0078 bis ADR-0085.

### Mobilitätssuche (Foundation A)

`POST /api/mobility/search` ist geschlossen: nur `application/json`, höchstens 16 KB UTF-8. `Content-Length` über dem Limit wird vor dem Lesen abgewiesen; der Body wird zusätzlich streamend mit hartem Cap gelesen. Optional Provider, Ranking, Client-Sicht. Kein Provider-Proxy. 429 setzt `Retry-After`. Die UI spricht `MobilityOption`, nicht einen Anbieter.

Foundation A hat bewusst keinen Mobility-Adapter. `mobilityProviderAus()` gibt `null` zurück. Production bleibt hart aus. Development/Preview brauchen `JETNITY_MOBILITY_AKTIV` **und** einen späteren Provider; fehlender Zugang ist Feature-unavailable, kein Buildfehler. Es gibt keinen Providernamen und kein Provider-Secret. Abdeckung entsteht nur aus vorhandenen Reisedaten. Fahrpläne, Wegezeiten und Anschlussgarantien werden nicht erfunden. Fehlende Graphdaten bleiben unbestimmt.

Die Konto-Übernahme aus einem späteren Providerergebnis speichert keine Browseroption. Sie verlangt einen serverseitigen `MobilityNachweis`. Heute ist der Nachweis `null` – fail closed. Manuelle Verbindungen sind Nutzerangaben, keine Providerfakten. Fachlich: [docs/MOBILITY.md](docs/MOBILITY.md), ADR-0090 und ADR-0091.

### Mietwagensuche (Foundation B)

`POST /api/rental-cars/search` ist geschlossen: nur `application/json`, höchstens 16 KB UTF-8. `Content-Length` über dem Limit wird vor dem Lesen abgewiesen; der Body wird zusätzlich streamend mit hartem Cap gelesen. Optional Provider, Ranking, Client-Sicht. Kein Provider-Proxy. 429 setzt `Retry-After`. Die UI spricht eine clientseitige Mietwagenoption, nicht einen Anbieter. Das Öffnen von Mobilität → Mietwagen löst keine Suche aus; ohne ausdrückliche Nutzeraktion bleibt der Bereich `unavailable`/`vorbereitet`.

Foundation B hat bewusst keinen Mietwagen-Adapter. `rentalCarProviderAus()` gibt `null` zurück. Production bleibt hart aus, auch wenn `JETNITY_RENTAL_CAR_AKTIV` gesetzt wäre. Development/Preview brauchen den Kill Switch **und** einen späteren Provider; fehlender Zugang ist Feature-unavailable, kein Buildfehler. Es gibt keinen Providernamen und kein Provider-Secret. Ein Mietwagen im Zeitraum ist kein Nachweis, dass eine konkrete Strecke damit gefahren wird. Unbekannte Klasse, Getriebe, Kaution oder Kilometerregel bleiben unbekannt.

Die Konto-Übernahme aus einem späteren Providerergebnis speichert keine Browseroption. Sie verlangt einen serverseitigen `RentalCarNachweis`. Heute ist der Nachweis `null` – fail closed. Manuelle Mietwagen sind Nutzerangaben, keine Providerfakten. Das manuelle Formular startet leer; Reiseorte sind höchstens unverbindliche Platzhalter. `one_way` braucht zwei verschiedene Place-IDs. Ranking vergleicht Gesamtpreise nur in derselben Währung. `Best Value` braucht mindestens zwei vergleichbare Gesamtpreise; `Jetnity empfiehlt` nur einen eindeutigen Top-Score. Fachlich: [docs/RENTAL_CARS.md](docs/RENTAL_CARS.md), ADR-0092, ADR-0093, ADR-0094 und ADR-0095.

### Travel Readiness (Foundation C)

`POST /api/readiness/requirements` ist geschlossen: nur `application/json`, höchstens 8 KB UTF-8, Rate-Limit, `Cache-Control: private, no-store`. Browser- oder LLM-Felder werden ignoriert. Die kanonische Antwort ist `evaluations[]` (Traveller × Credential-Option × Destination × Transit × Requirement Type). Das Feld `official` ist eine ausdrücklich reduzierte Legacy-Zusammenfassung und darf die Engine nicht auf den ersten Treffer reduzieren.

`requirementsProviderAus()` gibt `null` zurück. Tests dürfen einen Port injizieren. `evaluate` ist async; Throw/Timeout bleibt fail closed (ADR-0109). Official Evidence braucht Provider-Identität, plausibles `checkedAt`, Authority und/oder Rule Reference; eine Source URL ist für das Resultat optional und für die Official Action zwingend (ADR-0107, ADR-0110). Untrusted Evidence darf Freshness nicht `current` lassen (ADR-0111). `evaluations[]` ist die einzige kanonische neue Official-Truth; Legacy-`official` bleibt immer `unknown`.

`routeFactsAusReise()` ist die einzige Origin-/Transit-Naht. Foundation D füllt sie aus `trip_items.metadata.routeItinerary`; ohne Itinerary bleibt `quelle: 'none'`. Ortsnamen, Place-IDs und Browser-Country-Felder werden nicht in Ländercodes geraten (ADR-0108, ADR-0112, ADR-0114). Fachlich: [docs/TRAVEL_READINESS.md](docs/TRAVEL_READINESS.md), [docs/ROUTE_TRANSIT_INTELLIGENCE.md](docs/ROUTE_TRANSIT_INTELLIGENCE.md), [docs/TRAVELLER_CONTEXT.md](docs/TRAVELLER_CONTEXT.md), ADR-0096 bis ADR-0120.

### Route & Transit Intelligence (Foundation D)

PR #34 ist gemergt und auf Production. `lib/route/` leitet `RouteFacts` nur aus validierten Flight-Itineraries ab. `airportContacts`, `connections`, `transitCountryCodes` und `destinationCountryCodes` entstehen nur innerhalb eines belegten Legs; getrennte Flight-Items oder Legs werden nicht über den Zielaufenthalt verbunden. Ein Hinflugziel wird nicht durch ein späteres Rück-Leg zum Transit. Ein späterer Leg-Origin, der nicht das bewiesene Reise-Origin ist, bleibt ein belegter Besuch. Fingerprint und Anzeige behalten jede Leg-Grenze. Persistenz nutzt vorhandenes `trip_items.metadata` als `{ routeItinerary }` (max. 8192 Zeichen). `reiseAusNutzlastAnlegen()` kanonisiert jede clientseitige Itinerary vor RPC und Recovery (ADR-0114). `flug_route_itinerary_metadata()` baut Punkte aus `public.airports` neu (ADR-0115). Ein BEFORE-Trigger auf `trip_items` wendet dieselbe Kanonisierung auf jeden INSERT/UPDATE von `metadata` oder `kind` an (ADR-0116). `reise_anlegen()` schreibt die validierte Itinerary atomar in derselben Transaktion (ADR-0113); der TypeScript-Nachlauf ist fail-closed Recovery. Die Flugsuche löst IATA-Länder in einem Batch gegen `public.airports` auf; die direkte Account-Flugübernahme bleibt referenzbasiert. Guest und Account teilen dasselbe `TripItem.routeItinerary`. Production-Suche und Timatic bleiben aus.

### Traveller Context (Foundation E)

PR #35 ist gemergt und auf Production. `trip_travellers` bleibt der stabile Parent. Kanonische Wahrheit für Credentials liegt in `trip_traveller_citizenships` und `trip_traveller_documents`. Account-Writes gehen über `party_schreiben()` in einer Transaktion. Guest Local Storage trägt dieselbe `TripTraveller`-Form. Die Engine bewertet vorhandene Credential-Optionen getrennt; `requirementsProviderAus()` bleibt `null`. Ausstellerland ist kein Citizenship-Ersatz. Fachlich: [docs/TRAVELLER_CONTEXT.md](docs/TRAVELLER_CONTEXT.md).

### Travel Safety & Disruption (provider-neutrale Foundation)

PR #37 ist auf `main` gemergt. `lib/safety/` ist eine eigene Truth-Domäne. `safetyProviderAus()` gibt `null` zurück. Tests dürfen einen Port injizieren. External Fact, Freshness, räumliche/zeitliche Relevanz, Trip-Impact und Präsentationsklasse bleiben getrennt (ADR-0127, ADR-0128, ADR-0129, ADR-0130, ADR-0131, ADR-0132).

`POST /api/safety/evaluate` ist geschlossen: nur `application/json`, höchstens 24 KB UTF-8, Rate-Limit, `Cache-Control: private, no-store`. Browser- oder LLM-Felder setzen keine Evidence. Route Truth kommt nur aus `routeFactsAusGraph`. Ein Transit-Ereignis markiert nicht pauschal das Reiseziel. `seasonal_pattern` erzeugt keine Safety-Warnung. Evidence-Freshness ist vom Event-Zeitfenster getrennt. Zeitliche Relevanz gilt für konkrete Kontaktfenster, nicht für ein Min/Max über wiederholte Airports. Date-only-Kalendertage und Foundation-D-Ortszeiten bleiben zonenlos; gegen UTC-Instanten gilt eine weltweite Offset-Hülle statt erfundener UTC-Tagesgrenzen. Country-Scope behält Stage und alle Land-Routekontakte. Feinere Geo-Scopes ohne belegbare Membership bleiben `insufficient_context`, auch wenn eine Stage im selben Land liegt oder später zeitlich herausfällt. Teilweise malformed Providerantworten setzen `summary.complete=false` und dürfen nicht `checked_clean` oder generisches API-`ok` erzeugen. Ein erfolgreicher Provider mit 0 akuten Facts ist geprüft, nicht unavailable. Timeout, Unknown und Konflikt erzeugen keine Entwarnungs-Copy. Travellerabhängige Facts bewerten alle anwendbaren Slots fail-closed. Der Provider-Aufruf hat ein Timeout. Keine Safety-Tabelle. Die Übersicht zeigt den Block nur bei übergebenen Evaluations, nicht als permanente leere Karte. Keine automatische Reiseänderung.

Fachlich: [docs/TRAVEL_SAFETY_DISRUPTION.md](docs/TRAVEL_SAFETY_DISRUPTION.md).

### Travel Timing & Seasonal Intelligence (provider-neutrale Foundation)

Draft-PR #38 auf `feat/travel-timing-seasonal-intelligence`. `lib/seasonal/` ist eine eigene Truth-Domäne neben Safety. `seasonalProviderAus()` gibt `null` zurück. Tests dürfen einen Port injizieren. Kategorie, Evidence-Klasse, Outcome, Freshness, Reference Period, Travel Window, räumliche Relevanz, Impact und Präsentationsklasse bleiben getrennt (ADR-0133, ADR-0134, ADR-0135, ADR-0136, ADR-0137, ADR-0138, ADR-0139, ADR-0140).

`POST /api/seasonal/evaluate` ist geschlossen: nur `application/json`, höchstens 24 KB UTF-8, Rate-Limit, `Cache-Control: private, no-store`. Browser- oder LLM-Felder setzen keine Evidence. Route Truth kommt nur aus `routeFactsAusGraph`. Seasonal bleibt traveller-neutral. Der provider-neutrale Request trägt neben der groben Top-Level-Hülle kanonische Stage-Targets und getrennte Route-/Airport-Zeitkontakte aus derselben Foundation-D-Projektion; flache Country-/Airport-/Place-Mengen bleiben nur Hülle. Getrennte Airport-Besuche bleiben getrennte Kontakte. Recurring Windows sind inklusiv und jahressensitiv, inklusive Jahreswechsel und Leap-Day. Ohne explizites `freshUntil` gibt es kein `current`. `active_warning` / `acute` / `acute_event` erscheinen nicht als Seasonal-Hinweis und werden als `rejected_acute` materialisiert, niemals als `seasonal_pattern`, auch nicht kombiniert mit `temporarily_unavailable`. `seasonal_pattern` erzeugt weiterhin keine Safety-Warnung. Rückwärts laufende Trip- oder Stage-Datumsbereiche sind an der untrusted Seasonal-API ungültig; ein unerwartet umgekehrtes Intervall wird zeitlich `insufficient`, nicht `not_applies`. Eine widersprüchliche Top-Level-Hülle überstimmt konkrete Stage-/Route-Kontakte nicht. Items ohne eigene `stageId` erben eine belegte `day.stageId`. Date-only und Foundation-D-Ortszeiten bleiben zonenlos. Feinere Geo-Scopes ohne Membership bleiben `insufficient_context`. Teilweise malformed Antworten setzen `summary.complete=false`. Ein erfolgreicher Provider mit `[]` ist geprüftes Leergebnis, nicht unavailable, und keine optimale Reisezeit. Keine Seasonal-Tabelle. Die Übersicht zeigt den Block nur bei übergebenen Evaluations, nicht als permanente leere Karte. Keine automatische Reiseänderung.

Fachlich: [docs/TRAVEL_TIMING_SEASONAL.md](docs/TRAVEL_TIMING_SEASONAL.md).

### Ortsbasis (Phase 3.1)

`GET /api/search/places` liest ausschliesslich `public.places`. Der Bestand kommt aus dem GeoNames-Dump (CC BY 4.0) plus Flughafen-Zeilen aus `public.airports`. Development enthält nach dem ersten Import 124 811 Orte. Kein Live-Geocoding, keine Google-/Nominatim-Abfrage. Startseite und `/planen` teilen dieselbe Auswahlkomponente und dieselbe Serverprüfung. Der Modellweg löst eindeutige Orte gegen dieselbe Tabelle auf und rät nicht. Schema und Inhalt für Production nur über den kontrollierten Rollout in [docs/PRODUCTION_ROLLOUT.md](docs/PRODUCTION_ROLLOUT.md) (ADR-0069). Fachlich: [docs/ORTE.md](docs/ORTE.md), ADR-0067.

### Kostenkontrolle bei Modellaufrufen

Es existiert **kein** Codepfad, der ohne Nutzerinteraktion einen kostenpflichtigen Modellaufruf auslöst. Beseitigt wurden in Phase 1.1:

1. der Cron `/api/copilot/auto`, der täglich bis zu 24 DALL·E-3-Bilder erzeugte und dessen Secret-Prüfung fail-open war,
2. ein Generator-Aufruf im Server-Rendering von `app/search/page.tsx`, der bei jedem öffentlichen Aufruf mit `region`- oder `city`-Parameter eine DALL·E-3-Generierung auslöste – ohne Authentifizierung, Secret oder Rate Limit,
3. die gesamte Generierungskette (`copilot-upload-checker`, `copilot-upload-generator`, `copilot-image`) sowie der Block `maybeGenerateCopilotUpload`.

Mit Phase 1.1b wurde zusätzlich `lib/openai/*` entfernt und das Paket `openai` deinstalliert.

**Seit Phase 2.1 gibt es wieder einen Weg zu einem kostenpflichtigen Modell – abgeschaltet, und nur über eine Nutzerhandlung.** Er unterscheidet sich in jedem Punkt von den entfernten:

| Eigenschaft | Alt-Endpunkte (entfernt) | `vorschlagErzeugen()` |
| --- | --- | --- |
| Auslöser | Cron und Server-Rendering | ein Klick auf „Entwurf erstellen" |
| Standardzustand | eingeschaltet | aus; drei Variablen müssen zusammenkommen |
| Grenze je Aufrufer | keine | 4 je Stunde, 8 je Tag |
| Globale Grenze | keine | 38 Aufrufe und $3.00 je Tag |
| Durchsetzung | – | Datenbank, serialisiert, vor dem Aufruf gebucht |
| Ausgabegrenze | keine | `max_output_tokens: 6000` |
| Zeitgrenze | keine | Terra/Luna 90 s, Sol 120 s, eigener `AbortController` |
| Protokoll | keins | `public.model_usage`, eine Zeile je Aufruf |

Der Setup-Check verlangt `OPENAI_API_KEY` weiterhin **nicht** – eine fehlende Variable ist der Normalzustand einer Umgebung, in der die Funktion nicht laufen soll. Vollständige Beschreibung in [docs/MODELL.md](docs/MODELL.md), Entscheidung in [DECISIONS.md](DECISIONS.md) ADR-0052.

---

## 8. Design-Architektur

Die V2-Markenfarben sind zentralisiert:

- `styles/globals.css` definiert die Markenpalette in sieben Familien (`brand`, `citrus`, `surface`, `line`, `ink`, `night`, `danger`) als RGB-Kanäle.
- Die semantischen shadcn-Namen (`--primary`, `--muted`, `--border` usw.) definieren keine eigenen Farben, sondern **verweisen** auf diese Palette. Damit gibt es je Farbe genau eine Quelle.
- `tailwind.config.js` mappt beide Gruppen über `rgb(var(--token) / <alpha-value>)`, damit Opacity-Modifier wie `bg-brand-600/10` und `bg-primary/10` funktionieren.
- Die UI-Dateien verwenden ausschließlich Tokens, keine Hex-Literale und keine Farben aus der Tailwind-Standardpalette.

Zuordnung und Begründung der semantischen Tokens: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), Abschnitt 3.

---

## 9. Build, CI und Deployment

- `npm run typecheck` – `tsc --noEmit`
- `npm run lint` – ESLint
- `npm run build` – Setup-Check und danach `next build`
- `npm run check:setup:ci` – Setup-Check mit Fail-Closed-Verhalten für CI
- `npm run check:schema-bezug` – jedes `.from()` und `.rpc()` gegen `types/supabase.ts`
- `.github/workflows/ci.yml` führt bei jedem Push auf `main` und bei jedem Pull Request aus: `npm ci`, Setup-Check, Typecheck, Lint, Tests, Schutz der Admin-API, Bezug auf das Schema, die drei Hygiene-Prüfungen und den Production-Build
- ein zweiter Job gleicht die Auth-Konfiguration des Branches gegen `supabase/config.toml` ab (`npm run auth:pruefen`). Er ist fail-closed: Ohne die Secrets `SUPABASE_ACCESS_TOKEN` und `SUPABASE_PROJECT_REF` schlägt er fehl, statt sich stillschweigend zu überspringen. Nur ein Pull Request aus einem Fork überspringt sich, weil GitHub ihm keine Secrets gibt

Die datenbanknahen Prüfungen aus `scripts/db/` laufen nicht in der CI. Sie brauchen den Development-Zugang, und mehrere Läufe gegen denselben Branch würden dieselben Testkonten anlegen. Sie werden vor einer Zusammenführung von Hand ausgeführt; die Liste steht in [docs/DATENBANK.md](docs/DATENBANK.md), Abschnitt 9. Seit Phase 2.1 gehört `npm run db:kontingent` dazu.

`npm run modell:probe` löst einen echten, bezahlten Modellaufruf aus und läuft deshalb **nie** in der CI, sondern nur ausdrücklich von Hand ([docs/MODELL.md](docs/MODELL.md), Abschnitt 8).

Deployment über Vercel (Projekt `jetnity-app`). `main` ist der stabile Integrationsbranch; größere Umbauten laufen über Feature-Branch und Preview. Ein Push auf `main` löst automatisch einen Production-Deploy aus.

**Erreichbarkeit (Stand 15. August 2026, verifiziert):**

| Adresse | Zustand |
| --- | --- |
| `jetnity-app.vercel.app` | öffentlich erreichbar, aktueller Production-Alias |
| Deployment-URLs (`jetnity-<hash>-…vercel.app`) | durch Vercel Deployment Protection geschützt, liefern die Vercel-Login-Seite |
| `jetnity.com` | **keine öffentliche DNS-Auflösung** |
| `jetnity.ch` | **keine öffentliche DNS-Auflösung** |

Die beiden Produktionsdomains aus [JETNITY_VISION.md](JETNITY_VISION.md) sind damit noch nicht mit dem Vercel-Projekt verbunden. Für die Entwicklung ist das unkritisch, für den Launch ist es eine Voraussetzung. Automatisierte Prüfungen der Produktion müssen bis dahin den Alias verwenden, nicht die Wunschdomain.

`vercel.json` enthält seit Phase 1.1 **keine** Cron-Jobs mehr. Die vier vorherigen Jobs zeigten ausschließlich auf Alt-Endpunkte und sind entfernt.

---

## 10. Observability

Aktuell nur Konsolen-Logging, kein zentrales Error-Tracking und keine strukturierte Log-Konvention. Ein Anbieter würde laufende Kosten verursachen und ist deshalb nicht ohne Freigabe eingeführt. Für die Launch-Reife ist eine kostengünstige Lösung vorgesehen (Backlog in [ROADMAP.md](ROADMAP.md)).

---

## 11. Bekannte technische Schulden

| Thema | Ausmaß | Einordnung |
| --- | --- | --- |
| ~~Fehlende Baseline-Migration~~ | ~~37 Tabellen ohne Versionierung~~ | in Phase 1.4 hergestellt, Wiederaufbau gemessen |
| ~~Zwei Supabase-Typdateien~~ | ~~37 vs. 3 Tabellen~~ | in Phase 1.2b zusammengeführt, seit 1.4 erzeugt statt gepflegt |
| ~~RLS-Zustand unbekannt~~ | ~~nicht aus dem Repo ableitbar~~ | in Phase 1.4 erhoben, neu aufgebaut und mit inzwischen 135 Nachweisen belegt |
| ~~Alt-Tabellen in der Datenbank~~ | ~~29 von 37 ohne Verwendung im Code~~ | in Phase 1.4b entfernt, mit Archiv-Tag und Nachweis in `docs/LEGACY_ENTFERNUNG.md`; `creator_sessions` als letzte in Phase 1.5 |
| ~~Rolle liegt in `creator_profiles`~~ | ~~Tabelle der alten Produktidee~~ | in Phase 1.5 auf `public.profiles` umgestellt, samt Entfernung der neun Creator-Spalten (ADR-0044) |
| ~~Fünf Funktionen ohne Aufrufer~~ | ~~auf `creator_profiles` und `creator_sessions`~~ | in Phase 1.5 entfernt, dazu ein doppelter Auslöser auf dem Profil |
| Datenbanknahe Prüfungen laufen nicht in der CI | 5 Prüfungen von Hand | braucht einen kurzlebigen Branch je Lauf, sonst kollidieren die Testkonten |
| ~~Tests ohne Reisedaten~~ | ~~41 Tests, davon keiner zur Persistenz~~ | in Phase 1.5: 129 Tests in `lib/trips/` ohne Datenbank, dazu 47 Nachweise gegen den Branch |
| Reise bearbeiten ist noch schmal | Anlegen, Planpunkt hinzufügen und entfernen, Reise löschen | Umbenennen, Umsortieren und Verschieben von Tagen entstehen mit dem Trip Builder in Phase 2 |
| Modellweg ohne echten Aufruf belegt | Fixture-Tests, 0 Aufrufe gegen OpenAI | Routing Terra/Sol, Sol 120 s, eine Korrektur (ADR-0056). Frühe Luna-Vorgabe durch die Fünf-Fälle-Messung ersetzt. |
| `model_usage` ohne Aufbewahrungsfrist | höchstens 38 Zeilen am Tag, keine Reiseinhalte | eine Frist gehört zu der Entscheidung, die Funktion einzuschalten. Backlog in [ROADMAP.md](ROADMAP.md), Begründung ADR-0052 |
| Ein Vorschlag überlebt kein Reload | Zustand einer React-Komponente | bewusst: der Vorschlag ist kein Systemzustand, und ein Verlust kostet einen Aufruf, nicht eine Reise (ADR-0050) |
| ~~`PublicNavbar` kennt die Sitzung nicht~~ | ~~zeigt immer „Anmelden", kein Abmelden im öffentlichen Bereich~~ | im Nachtrag der Phase 1.5 behoben: Die Leiste liest die Sitzung clientseitig, das öffentliche Layout bleibt statisch (ADR-0047) |
| Zahl der Kindzeilen je Reise ungebremst | Etappen, Tage und Planpunkte nur über `reise_anlegen()` begrenzt | ein direkter `INSERT` kann die eigene Reise beliebig weit füllen. Ein Auslöser je Zeile wäre quadratisch; der Weg ist ein Auslöser je Anweisung. Backlog in [ROADMAP.md](ROADMAP.md), Begründung ADR-0045 |
| Einsicht in eine fremde Reise für den Support | bewusst nicht vorhanden | braucht eine eigene Entscheidung samt Protokollierung, nicht eine Policy (ADR-0041) |
| `any`-Verwendung | ca. 309 Vorkommen in `app/`, `lib/`, `components/`, `types/` | überwiegend in Alt-Code; nur V2-relevante Stellen werden bereinigt |
| ~~Middleware schützt nur einen Pfad~~ | ~~1 von vielen geschützten Bereichen~~ | in Phase 1.3 auf `/admin`, `/api/admin` und `/account` erweitert |
| ~~`admin_domains` im Schema~~ | ~~unbenutzt, widerspricht ADR-0027~~ | in Phase 1.4 entfernt, zusammen mit `app_admins` und `is_admin` |
| ~~Alt-Endpunkte ohne Kostenkontrolle~~ | ~~mehrere OpenAI-Endpunkte~~ | in Phase 1.1 durch Abschaltung gelöst |
| ~~Alt-Oberflächen ohne funktionierende Endpunkte~~ | ~~Media Studio, Creator Hub, Admin Copilot, Feed, Blog~~ | in Phase 1.1b entfernt (209 Dateien) |

Bewusste Entscheidung: `any`-Vorkommen und Sicherheitslücken in Alt-Code werden **nicht** aufwendig refactored, wenn der betroffene Code kurzfristig entfernt wird ([DECISIONS.md](DECISIONS.md), ADR-0006).
