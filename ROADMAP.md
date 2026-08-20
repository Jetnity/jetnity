# Jetnity – Roadmap

Stand: 20. August 2026

Diese Datei zeigt jederzeit: was fertig ist, was in Arbeit ist, was als Nächstes kommt, was blockiert ist und was bewusst verschoben wurde ([AGENTS.md](AGENTS.md) Regel 6).

Die Reihenfolge ist freigegeben und begründet in [DECISIONS.md](DECISIONS.md), ADR-0012.

---

## Übersicht

| Phase | Inhalt | Status |
| --- | --- | --- |
| Phase 0 | V2-Basis, Build, CI, Design-Tokens, Dokumentation | **fertig** |
| Querschnitt | Mobile- und Responsive-Qualität der V2-Seiten | **abgeschlossen, in Production verifiziert** |
| Phase 1.1 | Alt-Endpunkte und Cron-Jobs außer Betrieb | **fertig** |
| Phase 1.1b | Alt-Oberflächen entfernen, Auth-Texte auf V2 | **abgeschlossen, in Production verifiziert** |
| Phase 1.2 – 1.4 | Tokens, Auth-Vereinheitlichung, Datenbank-Baseline | **fertig auf Development** |
| Phase 1.4b | obsolete Legacy-Tabellen archiviert und entfernt (37 → 8) | **fertig auf Development** |
| Phase 1.4c | Auth-Konfiguration als Code, Abgleich und Flussprüfung | **fertig auf Development** |
| Phase 1.4d | Fehler im Administrationsbereich sichtbar statt leer | **fertig** |
| Phase 1.5 | V2-Reiseschema, persistente Reisen, Gast → Konto | **fertig** |
| Phase 2.1 | natürliche Sprache zu strukturiertem Reisevorschlag | **fertig auf Development, Preview aktivierbar, Production aus** |
| Phase 2.2 | bestehende Reise per Sprache ändern | **fertig, nach main gemergt, Production verifiziert; Modellweg aus** |
| Phase 3.1 | Flight Foundation, erster Duffel-Adapter | **in Arbeit** |
| Phase 3 | Hotels, Aktivitäten, Monetarisierung | als Nächstes nach 3.1 |
| Phase 4 | Launch-Reife | geplant |

Phase 2 ist als konversationeller Kern **fertig**: 2.1 erzeugt einen Vorschlag, 2.2 verändert eine bestehende Reise. Production bleibt für den Modellweg aus. Phase 3.1 liefert die erste Flugbasis; Production-Flugsuche bleibt aus.

---

## Phase 0 – V2-Basis · fertig, nach `main` gemergt und deployt

Umgesetzt in Pull Request [#1](https://github.com/Jetnity/jetnity/pull/1), am 15. August 2026 per Fast-Forward nach `main` gemergt (`2e643c85`). CI auf `main` grün, Vercel-Production-Deploy erfolgreich, V2-Seiten in Production geprüft.

- [x] V2-Branch `codex/jetnity-v2-foundation` vollständig reviewt (Diff, Typecheck, Build)
- [x] V2 als neue Basis übernommen (Fast-Forward, keine Konflikte, keine V2-Funktion verloren)
- [x] Archiv-Tag `archive/jetnity-v1-main` auf dem alten Stand gesetzt
- [x] Build grün: `npm ci`, Typecheck, Lint, Production-Build
- [x] Node-Engine korrigiert (`>=20.9`), Lockfile synchronisiert, `simple-swizzle` gepinnt
- [x] CI eingerichtet (`.github/workflows/ci.yml`) mit Fail-Closed-Setup-Check
- [x] V2-Farbwelt in 27 Design-Tokens zentralisiert, visuelle Erscheinung erhalten
- [x] Projektdokumentation angelegt: `AGENTS.md`, `JETNITY_VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md`

**Nicht Bestandteil von Phase 0:** Datenbank, RLS, Auth-Vereinheitlichung, Alt-Code-Entfernung.

---

## Querschnitt – Mobile- und Responsive-Qualität · fertig

Vollständiger Qualitätspass über alle V2-Seiten. Regeln in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) Abschnitt 7, Entscheidungen in [DECISIONS.md](DECISIONS.md) ADR-0015 bis ADR-0017.

- [x] Ursachen behoben statt versteckt: `overflow-hidden` von `main` entfernt, zu breite Layouts korrigiert
- [x] Startseite: Hero, Reise-Cockpit-Mockup, Entdecken-Karten, Pro-Sektion
- [x] `/planen`, `/reisen`, `/reisen/[tripId]` geprüft und angepasst
- [x] Navigation: Mobile-Menü schließt bei Sprungmarken, Touch-Ziel der Menütaste auf 44 px
- [x] Mindesthöhen nach Breakpoint gestaffelt, Landscape auf dem Telefon nutzbar
- [x] Typografie unterhalb `sm` reduziert, ab `sm` unverändert
- [x] Eingabefelder mit 16 px auf kleinen Breiten, kein iOS-Auto-Zoom
- [x] Safe-Area-Insets für Kopfzeile, Footer und fixierte Elemente
- [x] gemessen auf 280, 300, 320, 360, 375, 390, 430, 768, 1280 px sowie Landscape 844×390 und 667×375

Nachtrag nach dem Merge, gefunden bei der Messung gegen Production: `/login` und `/register` liefen lokal mangels Supabase-Variablen in die Fehlerseite und waren deshalb nie real vermessen. In Production zeigten sich drei Fehler, alle behoben.

- [x] Zustimmungstext der Registrierung verbreiterte die Seite um bis zu 207 px (`truncate` im `Label`-Primitiv erzwang eine Zeile)
- [x] doppelter Passwort-Umschalter in beiden Formularen entfernt, das `Input`-Primitiv bringt ihn mit
- [x] Icons in Absende- und Social-Buttons rutschten in eine eigene Zeile, jetzt über `leftIcon`/`rightIcon`
- [x] Google-Icon vereinheitlicht, die Registrierung trug einen unvollständigen Pfad

### Zweiter Durchgang unter WebKit · fertig

Anlass: Auf einem echten iPhone waren weiterhin Fehler sichtbar, obwohl der erste Durchgang bestanden hatte. Ursache war die Messumgebung. Sie prüfte in Chromium und stützte sich zu stark auf `scrollWidth === clientWidth`, eine Prüfung, die abgeschnittener Inhalt mühelos besteht. Entscheidungen in [DECISIONS.md](DECISIONS.md), ADR-0020 bis ADR-0022.

Messumgebung erweitert:

- [x] Prüfung zusätzlich unter **WebKit**, derselben Engine wie auf dem iPhone
- [x] neun Prüfregeln statt einer: Seiten-Overflow, abgeschnittener Inhalt, aus dem Elternteil ragende Elemente, nicht schrumpfbare Felder, Trefferflächen, Überlappungen, Schriftgröße in Feldern, erreichbare Scrollbereiche, verdeckte Sprung- und Fokusziele
- [x] jede Seite belegt zuerst, dass ihr **erwarteter Inhalt** da ist. Eine Fehlerfläche statt des Formulars fällt jetzt auf, statt die Prüfung zu bestehen
- [x] Wischgesten aus einzelnen Touch-Ereignissen statt `scrollLeft`
- [x] Belastungstest: die Mindestbreite nativer Bedienelemente wird künstlich auf 200 px erzwungen, weil weder Chromium noch WebKit unter Linux den nativen iOS-Datumswähler abbilden
- [x] 19 Seitenzustände × 12 Breiten, 227 Kombinationen je Engine

Damit gefunden und behoben:

- [x] Der Kopfbereich der Reise war auf jeder Telefonbreite **566 px** breit und wurde vom `overflow-hidden` seiner eigenen Sektion abgeschnitten. Auf 320 px verschwanden 262 px Inhalt rechts, ohne dass die Seite waagrecht scrollte – genau das Bild, das auf dem iPhone berichtet wurde. Die alte Messung bestand hier, weil `scrollWidth === clientWidth` durch das Abschneiden erfüllt blieb
- [x] Beschriftungen mit Symbol stellten das Symbol **über** den Text, auf `/login`, `/register` und beim Passwortwechsel. Ursache: `svg { display: block }` aus der Preflight im gemeinsamen Textelement der Beschriftung
- [x] Der Untergrund des Dokuments trug einen blau-violetten Verlauf aus der alten Gestaltung, sichtbar beim Überdehnen des Scrollbereichs auf iOS und unterhalb kurzer Seiten wie der 404-Seite
- [x] `/unauthorized` und `/admin/login` waren nie geprüft: zu kleine Trefferflächen, Felder unter 16 px

Abschlussmessung gegen Production, je Breite Production gegen den Zweig, gemessen wird herausragender und abgeschnittener Inhalt statt nur Seiten-Overflow:

| Seite | Production | Zweig |
| --- | --- | --- |
| `/reisen/[tripId]` 280 px | 11 herausragend, 9 abgeschnitten | 0 / 0 |
| `/reisen/[tripId]` 320 px | 11 herausragend, 9 abgeschnitten | 0 / 0 |
| `/reisen/[tripId]` 390 px | 7 herausragend, 8 abgeschnitten | 0 / 0 |
| `/planen` mit 200-px-Datumsfeldern | 0 / 0 | 0 / 0 |
| `/login`, `/register` | 0 / 0 | 0 / 0 |

### Abschluss in Production · 16. August 2026

Pull Request [#6](https://github.com/Jetnity/jetnity/pull/6) und [#7](https://github.com/Jetnity/jetnity/pull/7) sind per Fast-Forward nach `main` gemergt (`0e3fab75`, `aa6956f7`), CI auf `main` grün, Vercel-Production-Deploy erfolgreich. Danach wurde derselbe Prüfsatz gegen Production gefahren – nicht gegen einen lokalen Server:

| Prüfung | Umfang | Ergebnis |
| --- | --- | --- |
| WebKit-Audit, neun Regeln | 227 Seiten-/Breiten-Kombinationen | 0 Fehler |
| Chromium-Audit, Gegenprobe | 227 Kombinationen | 0 Fehler |
| Herausragender und abgeschnittener Inhalt, kalte Flächen | 80 Kombinationen über 10 Seiten | 0 Befunde |
| Belastungstest native Bedienelemente (200 px erzwungen) | 32 Kombinationen | 0 Fehler |
| Wischen mit echten Touch-Ereignissen | 280/320/390/430 px | Überhang 278–428 px vollständig durchfahrbar |
| Tastatur offen, sichtbarer Bereich 508 px | 7 Felder auf `/planen` | alle vollständig sichtbar |

Belegt ist damit auch: Die Dokumentfläche trägt auf allen zehn geprüften Seiten `rgb(245, 244, 238)` – die warme V2-Fläche –, der `body` ist transparent, und keine Fläche über 4000 px² zeigt noch einen kräftigen Blauanteil. Die alten blau-violetten Verläufe sind vollständig weg.

Die Safe-Area-Werte sind erwartungsgemäß 0 px: `viewport-fit` bleibt `auto`, iOS begrenzt den Viewport damit selbst auf den sicheren Bereich (ADR-0017). Die Berechnungen in Kopfzeile, Footer und „Nach oben" greifen erst im installierten `standalone`-Modus.

Zwei Meldungen bleiben als Hinweis und sind keine Fehler: Die klebende Kopfzeile liegt planmäßig über vorbeigescrolltem Inhalt, und die Kacheln im waagrechten Bereich ragen gewollt über den Container – sie liegen in einem scrollbaren Vorfahren (`584 > 266 px`) und sind per Wischen erreichbar. Beide Ausnahmen sind in der Prüfung explizit begründet, damit sie nicht als bestandene Messung durchgehen.

**Offen:** Verifikation auf echter iOS- und Android-Hardware. Geprüft wurde unter WebKit und Chromium mit den obigen Viewports.

---

## Phase 1 – V2-Sicherheit und Datenbasis · in Arbeit

Grundsatz: Nur der Code wird abgesichert, der in V2 tatsächlich weiterbesteht. Alt-Code wird abgeschaltet, nicht gehärtet ([DECISIONS.md](DECISIONS.md), ADR-0006).

### 1.1 Alt-Endpunkte außer Betrieb nehmen · fertig

Von 77 Route Handlern wurden 61 entfernt, 16 bleiben. Alle vier Cron-Jobs sind entfernt. Details in [DECISIONS.md](DECISIONS.md), ADR-0014.

- [x] alle vier Cron-Jobs aus `vercel.json` entfernt
- [x] Cron-Endpunkte entfernt (`api/copilot/auto`, `api/cron/publish-scheduled-posts`, `api/admin/cron/dns`)
- [x] 21 KI-/Modell-Endpunkte entfernt, darunter sechs ohne jede Authentifizierung
- [x] Media- und Video-Render-Pipeline entfernt (12 Endpunkte)
- [x] Creator-, Feed- und Session-Endpunkte entfernt (13 Endpunkte)
- [x] Content-Endpunkte entfernt (`api/blog/posts`, `api/content-type`, `api/inspiration`, `api/og/story/[id]`)
- [x] Infrastruktur-Automatisierung entfernt (`api/admin/infomaniak/*`, `api/admin/dns/check`, `api/admin/storage/ensure`, `api/uploads/signed-url`, `api/utils/gravatar`)
- [x] automatischen DALL·E-Aufruf im Rendering von `app/search/page.tsx` entfernt
- [x] DALL·E-Generierungskette entfernt (`copilot-upload-checker`, `copilot-upload-generator`, `copilot-image`, Block `maybeGenerateCopilotUpload`)
- [x] verwaiste FFmpeg-Abhängigkeiten entfernt (`ffmpeg-static`, `fluent-ffmpeg`, `@types/fluent-ffmpeg`)
- [x] Abhängigkeiten geprüft: der transitive Graph der V2-Seiten umfasst 32 Dateien und enthält **keinen** Endpunkt-Aufruf
- [x] Auswirkungen dokumentiert

Bewusst behalten: `app/auth/refresh`, `api/search/airports`, `api/search`, `api/admin/payments/*`, `api/admin/security/*`. `app/auth/refresh` ist mit 1.3 entfallen – der Endpunkt konnte seine Aufgabe nie erfüllen.

### 1.1b Alt-Oberflächen entfernen · abgeschlossen, in Production verifiziert

Umgesetzt in Pull Request [#6](https://github.com/Jetnity/jetnity/pull/6), am 16. August 2026 per Fast-Forward nach `main` gemergt (`0e3fab75`). Archiv-Tag vor der Löschung: `archive/pre-1-1b-alt-ui`. 209 Dateien entfernt, Typecheck, Lint und Production-Build grün. Details in [DECISIONS.md](DECISIONS.md), ADR-0018.

In Production nachgewiesen: `/login` zeigt „Willkommen zurück", `/register` zeigt „Deine Reisen. Ein Konto.", und im ausgelieferten HTML beider Seiten findet sich kein Treffer mehr auf Creator, Media-Studio, Analytics oder Social.

- [x] Media Studio, Creator Hub, Creator Dashboard, Creator Analytics, Creator-Story
- [x] Feed- und Publishing-Oberflächen
- [x] Blog- und Story-Oberflächen
- [x] Alt-Suchseite (`app/search/*`) samt `api/search`; `api/search/airports` bleibt für die Flugintegration
- [x] Admin-Copilot, Copilot-Kommandopaletten, Control-Center und Domains-Oberfläche
- [x] `lib/openai`, `lib/media`, `lib/video`, `lib/intelligence`, `lib/supabase/actions*`, `lib/client`, `config/api.config.ts`
- [x] Pakete entfernt: `hls.js`, `html2pdf.js`, `exifr`, `openai`, `sharp`, `marked`
- [x] Fehler- und 404-Seiten in V2-Gestaltung, ohne Verweise auf Alt-Suche, Feed und Blog
- [x] Auth-Seiten mit den freigegebenen V2-Texten, ohne Creator-, Media- und Analytics-Bezug
- [x] Weiterleitungen nach Login, Registrierung, OAuth-Callback und Passwortwechsel gehen auf `/reisen`
- [x] Sitemap ohne Story-URLs und ohne Supabase-Aufruf, `robots.txt` ohne tote Pfade
- [x] Setup-Check verlangt keinen `OPENAI_API_KEY` mehr

Dabei gefunden und mit behoben:

- Login, Registrierung, OAuth-Callback und Passwortwechsel leiteten auf das entfernte Creator-Dashboard. Ohne diese Korrektur wäre jede Anmeldung in einer 404-Seite geendet.
- Die Middleware schützte ausschliesslich `/creator/creator-dashboard`. Sie schützte damit nichts mehr, während `/account/security` ohne serverseitige Prüfung erreichbar war. Sie schützt jetzt `/account` und leitet auf `/login` mit Rücksprungziel. Die vollständige Vereinheitlichung bleibt Phase 1.3.
- Die Sitemap veröffentlichte weiterhin `/story/<id>`-URLs aus `creator_sessions`.

**Bewusst nicht entfernt:** Admin-Bereiche für Nutzer, Inhalte, Analytics, Marketing, Zahlungen, Security, Einstellungen und Lokalisierung. Sie gehören laut Vision Abschnitt 14 zum späteren Admin-System.

### 1.2 shadcn-Tokens auf die V2-Farbwelt umstellen · abgeschlossen

- [x] semantische Tokens auf die V2-Palette gelegt
- [x] tote Tokens mit Blauanteil entfernt
- [x] `DESIGN_SYSTEM.md` und `ARCHITECTURE.md` aktualisiert

Die Tokens definieren keine eigenen Farben mehr, sondern **verweisen** auf die Markenpalette (`--primary: var(--jet-brand-800)`). Damit gibt es je Farbe genau eine Quelle; die frühere Doppelpflege war die Ursache dafür, dass dieselbe Fläche je nach verwendeter Klasse blau oder grün erschien. Zuordnung und Begründung: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) Abschnitt 3, [DECISIONS.md](DECISIONS.md) ADR-0024.

Kein Klassenname in den Komponenten musste sich ändern – die Umstellung liegt vollständig in `styles/globals.css` und `tailwind.config.js`. Der Skip-Link und die Auth-Primitive sind damit mitbereinigt, ohne selbst angefasst zu werden.

Entfallen sind zusätzlich `--surface-1/2/3`, `--snippet-lines`, die in `tailwind.config.js` deklarierten aber nie definierten `--chart-1..5`, dreizehn unbenutzte Klassen der alten Gestaltung und das `.prose`-Thema samt `@tailwindcss/typography` – die Klasse kommt im Markup nirgends vor, seit die Blog-Oberflächen weg sind.

**Geprüft:** Unter WebKit auf acht Seiten (`/`, `/planen`, `/reisen`, `/login`, `/register`, `/unauthorized`, `/admin/login`, 404), dass jedes Token zu einer Farbe auflöst und nichts mehr im Farbtonbereich 200–300 Grad gezeichnet wird. Die Auflösungsprüfung ist nötig, weil die zweite `var()`-Ebene sonst still auf transparent fallen könnte – auf einem Screenshot teils unauffällig.

Zwei Befunde kamen bei dieser Prüfung dazu und sind mitbehoben:

- Die Standardvariante des Button-Primitivs lag auf der gedämpften Sekundärfläche. Jede Schaltfläche ohne ausdrückliche Variante ist aber die Hauptaktion ihrer Maske – Anmelden, Konto erstellen, Passwort setzen. Sie wichen alle optisch zurück. Ausserdem waren sie mit 40 px unter den 44 px, die Abschnitt 7.5 des Designsystems für Hauptaktionen verlangt.
- Der Balken der Passwortstärke war auf jeder Stufe im Markengrün: Die Aussage lag allein in seiner Länge, während die Farbe durchgehend „gut" meldete.

### 1.2b Unerreichbaren Code und ungenutzte Pakete entfernen · abgeschlossen

Statt einer Textsuche drei Analysen über die Importkette, jede als Skript im Baum und in der CI ([DECISIONS.md](DECISIONS.md) ADR-0026):

| Prüfung | gefunden |
| --- | --- |
| `npm run check:dead` – Dateien ohne Weg von einem Einstiegspunkt | **53 Dateien** |
| `npm run check:exports` – benannte Exporte ohne Aufrufer | **35 Exporte** |
| `npm run check:deps` – Pakete ohne Verwendung | **17 Pakete** |

Die Dateiebene allein hätte zu wenig gefunden: `card.tsx` wird importiert, aber nur fünf von elf Exporten wurden je benutzt. Umgekehrt sah manche Datei importiert aus und wurde nur von einer anderen unerreichbaren Datei aus benutzt – `PaymentsWidget` und `SecurityWidget` lagen je dreimal im Baum, live war eine Fassung.

Bewusst behalten, mit Begründung im jeweiligen Skript:

| behalten | Grund |
| --- | --- |
| `zod` | Laufzeitvalidierung der strukturierten V2-Reisedaten und der Modellantworten (Phase 2) |
| `CookieConsent.tsx` | wartet auf die Rechtsentscheidung; es zu löschen würde sie vorwegnehmen |
| `startSupabaseAuthListener` | Gegenseite von `app/auth/refresh`, gehört in Phase 1.3 – dort geprüft und mit dem Endpunkt entfernt |

Drei Helfer in `lib/supabase/server.ts` sind entfernt, weil sie als Vorlage gefährlich gewesen wären: `createAdminClient` gab einem Client mit Service-Role-Rechten den mutierbaren Cookie-Adapter, `getSessionServer`/`getUserServer` lasen die Identität aus `auth.getSession()` – serverseitig wird dabei die Token-Signatur nicht nachgeprüft. Ein Kommentar an der Stelle hält fest, warum, damit Phase 1.3/1.4 sie nicht so wieder einführt.

**Nebenbefund behoben:** Der Umschalter für das Dunkelthema setzte `dark` auf `<html>`, und niemand nahm es zurück. Beim Wechsel vom Admin auf eine öffentliche Seite blieb die Klasse stehen und die hellen V2-Seiten wurden mit den dunklen Tokens gezeichnet ([DECISIONS.md](DECISIONS.md) ADR-0025).

Lint ist seither ohne Warnung (vorher drei).

### 1.3 Auth, Rollen und Middleware vereinheitlichen · abgeschlossen

Umgesetzt in Pull Request [#10](https://github.com/Jetnity/jetnity/pull/10). Entscheidungen: [DECISIONS.md](DECISIONS.md) ADR-0027 bis ADR-0029.

- [x] einheitliches Rollen- und Berechtigungsmodell (`lib/auth/roles.ts`)
- [x] Admin-Prüfung zentralisiert – Seiten über das Layout der Routengruppe, API-Routen über `requireAdminApi()` mit CI-Kontrolle
- [x] Middleware-Schutz über `/admin`, `/api/admin` und `/account`, je Oberfläche mit der passenden Antwort
- [x] serverseitige Identität aus `auth.getUser()` statt `auth.getSession()`
- [x] Rollen- und Berechtigungstests (34)
- [ ] generisches Traveller-Profil an Stelle des Creator-Profils → hängt an 1.4

Die Bestandsaufnahme vom 16. August 2026 hatte vier Probleme benannt. Alle vier sind behoben, und bei der Umsetzung kamen vier weitere dazu.

**1. Die E-Mail-Domain umging das Rollenmodell.** `requireAdmin()` liess durch, wenn die Rolle passte **oder** die Adresse auf `@jetnity.com` endete. Der Domain-Fallback ist entfernt: Eine Domain erteilt keine Berechtigung. `ADMIN_ALLOWED_EMAILS` bleibt als ausdrücklich konfigurierter Notzugang, aber ausschliesslich als exakte Adressliste – Domains, Platzhalter und Teileinträge werden verworfen, und ein gesetzter, aber unbrauchbarer Wert wird als Fehlkonfiguration protokolliert. Jede Nutzung erscheint als Warnung mit Konto, Bereich und Zustand der Rollenabfrage.

Der schwerere Teil dieses Problems lag in der Fehlerbehandlung. `catch { role = null }` fing nur geworfene Ausnahmen; Supabase meldet einen abgelehnten Zugriff aber im `error`-Feld der Antwort, das nie gelesen wurde. Eine per RLS abgewiesene Rollenabfrage sah damit genauso aus wie „dieses Konto hat keine Rolle" und fiel auf die E-Mail-Prüfung zurück. Die Entscheidung unterscheidet jetzt drei Zustände – Rolle vorhanden, keine Rolle hinterlegt, Abfrage fehlgeschlagen – und ein Ausfall führt nie zu einer Freigabe.

**2. Der Schutz war opt-in.** `app/(admin)/layout.tsx` ist eine Server-Komponente über der bestehenden Client-Hülle und schützt die gesamte Routengruppe, auch künftige Seiten. Die acht Seiten, die nur prüften, tragen keinen eigenen Aufruf mehr.

**3. `requireAdmin()` leitete um, auch in API-Routen.** Getrennt in `requireAdminPage()` (Weiterleitung) und `requireAdminApi()` (401 ohne Anmeldung, 403 ohne Berechtigung, 503 wenn die Prüfung selbst ausfällt). Da ein Layout API-Routen nicht schützen kann, prüft `npm run check:api-schutz` in der CI jeden exportierten HTTP-Handler unter `app/api/admin` darauf, dass er den Gate aufruft und die gelieferte Antwort zurückgibt.

**4. Die Rollen standen an vier Stellen.** Eine Quelle: `lib/auth/roles.ts` mit Rollen, Rangfolge, Bereichszugang und Vergaberegeln, ohne Next- und Supabase-Importe, damit die Regeln ohne Laufzeit prüfbar sind.

Dabei gefunden und mit behoben:

- **Rechteausweitung in der Kontoverwaltung.** `setUserRole` prüfte nur, ob die Owner-Rolle vergeben wird, und ob sich jemand selbst herabstuft. Eine Moderation konnte deshalb ihre **eigene** Rolle auf `admin` setzen – die Prüfung liess Selbständerungen „in Richtung admin/owner" ausdrücklich zu. Jetzt ist die eigene Rolle unveränderbar, und es zählt der Rang gegenüber der bisherigen **und** der künftigen Rolle. Nur der Owner darf jede fremde Rolle setzen, damit eine Nachfolge einrichtbar bleibt.
- **Eine fünfte Zugangsliste im Loginformular.** `app/(public)/admin/login/actions.ts` hatte eine eigene Allowlist mit drei fest im Quellcode hinterlegten Adressen als Vorbelegung und demselben Domain-Fallback. Sie sperrte Konten aus, deren Berechtigung aus einer Datenbankrolle stammte, und ihre Meldung „Diese E-Mail ist nicht freigegeben" verriet vor der Anmeldung, welche Adressen Admin-Rechte haben. Das Formular entscheidet nichts mehr selbst; die Magic-Link-Antwort ist neutral.
- **Die Middleware fiel auf.** Fehlte die Supabase-Umgebung, liess sie die geschützten Pfade durch. Jetzt gesperrt, mit deutlichem Protokolleintrag: Ein geschützter Bereich, der bei fehlender Konfiguration aufgeht, ist das Gegenteil von Schutz.
- **`app/auth/refresh` konnte nie funktionieren.** Der Cookie-Adapter des Endpunkts gab für jeden Namen `undefined` zurück und verwarf jedes Schreiben. Er und seine Gegenseite `startSupabaseAuthListener` sind entfernt: `@supabase/ssr` legt die Sitzung im Browser bereits in Cookies ab, und die Middleware schreibt erneuerte Cookies in die Antwort zurück. Einen Aufrufer hatte die Funktion nie.

**Geprüft** gegen einen lokalen Supabase-Ersatz mit echten Sitzungen und echten Cookies, je Rolle und für beide Oberflächen:

| Konto | API lesen | API schreiben | `/admin` |
| --- | --- | --- | --- |
| ohne Anmeldung | 401 | 401 | → `/admin/login?next=` |
| Rolle `user` | 403 | 403 | → `/unauthorized?grund=forbidden` |
| kein Profileintrag | 403 | 403 | → `/unauthorized?grund=forbidden` |
| Rolle `user` auf `@jetnity.com` | 403 | 403 | → `/unauthorized?grund=forbidden` |
| Rolle `moderator` | 200 | 403 | 200 |
| Rolle `operator` | 200 | 200 | 200 |
| Notliste, Rolle `user` | 200 | 200 | 200 |
| Rollenabfrage ausgefallen, Rolle `operator` | 503 | 503 | → `/unauthorized?grund=lookup-failed` |
| Rollenabfrage ausgefallen, Notliste | 200 | 200 | 200 |

Keine API-Antwort war eine Weiterleitung. Schreibende Endpunkte verlangen jetzt mindestens `operator`, lesende den Bereichszugang ab `moderator`.

Offen bleibt das generische Profil: Die Rolle liegt weiterhin in `creator_profiles`, der Tabelle der alten Produktidee. Der Tabellenname steht jetzt an genau einer Stelle (`ROLE_TABLE` in `lib/auth/admin-guard.ts`), damit die Umstellung in 1.4 eine einzelne Änderung bleibt.

### 1.4 Datenbank-Baseline · abgeschlossen auf Development

Umgesetzt auf dem Supabase-Development-Branch. Production ist nicht angefasst worden. Vollständige Beschreibung: [docs/DATENBANK.md](docs/DATENBANK.md). Entscheidungen: [DECISIONS.md](DECISIONS.md) ADR-0031 bis ADR-0037.

- [x] Development-Schema vollständig inventarisiert – Tabellen, Spalten, Schlüssel, Bedingungen, Indizes, Enums, Views, Funktionen, Trigger, Extensions, Rechte, RLS und Policies (`npm run db:inventar`)
- [x] Drift gegen Repo-Migrationen und Typdateien dokumentiert
- [x] reproduzierbare Baseline hergestellt und **gemessen**: Wiederaufbau aus den Migrationen gegen das laufende Schema, Abschnitt für Abschnitt, ohne Unterschied
- [x] Altlasten eingeordnet: 7 für V2 benötigt, 1 vorläufig, 29 obsolet
- [x] `admin_domains` entfernt, dazu `app_admins`, `is_admin(uuid)` und `creator_profiles.is_admin`
- [x] Rollenmodell in der Datenbank auf eine Autorität zurückgeführt und mit `lib/auth/roles.ts` verbunden
- [x] `types/supabase.ts` aus dem Schema erzeugt statt gepflegt, mit Prüfung auf Abweichung
- [x] RLS auf allen 37 Tabellen aktiv, 66 Policies, positive und negative Zugriffsfälle nachgewiesen
- [x] Datenbankrechte an das Rollenmodell aus 1.3 gebunden – fünf benannte Fähigkeiten statt der pauschalen Rolle `admin`, je Fähigkeit ein Nachweis für die Stufe darüber und darunter
- [x] Notzugang entschieden und sichtbar gemacht: `ADMIN_ALLOWED_EMAILS` öffnet die Oberfläche, nicht die Datenbank
- [x] lesende Admin-Routen fail-closed: ein Datenbankfehler wird 500 oder 503, eine echt leere Abfrage bleibt eine leere Liste
- [x] Rechte auf das Nötige begrenzt, `TRUNCATE` entzogen
- [x] Advisors ausgeführt, Befunde behoben oder begründet dokumentiert
- [x] Ownership-Modell dokumentiert
- [x] unversionierte Migration `<timestamp>_realtime_creator_session_metrics.sql` bereinigt – sie ist Teil der Baseline
- [x] die zwei konkurrierenden Typdateien zusammengeführt – mit Phase 1.2b erledigt: `types/supabase.types.ts` war ein älterer, kleinerer Abzug ohne einen einzigen Import und ist entfernt
- [ ] Rolle aus `creator_profiles` in ein generisches Profil überführen → nach 1.5 verschoben, siehe unten

Ausgangslage waren zehn Migrationsdateien, die zusammen **zwei** Tabellen erzeugten, während der Branch **39** trug. Für 37 Tabellen existierte keine versionierte Beschreibung; der RLS-Zustand war aus dem Repository nicht ableitbar.

**Sechs Befunde waren mehr als Unordnung.**

**1. `TRUNCATE` umgeht RLS.** `anon` und `authenticated` hatten auf allen 39 Tabellen sämtliche Rechte, einschliesslich `TRUNCATE`, `REFERENCES` und `TRIGGER`. Wer die Seite nur aufrief, konnte `truncate public.payments` ausführen und die Tabelle leeren – Policies greifen dabei nicht. Alle Rechte sind entzogen und einzeln neu vergeben; `npm run db:rechte` prüft seither in beide Richtungen, dass kein Recht ohne Policy und keine Policy ohne Recht existiert.

**2. Jedes Konto konnte sich selbst befördern.** Die Policy auf `creator_profiles` erlaubte das Ändern der eigenen Zeile – einschliesslich der Spalten `role` und `status`. `update creator_profiles set role = 'owner' where user_id = auth.uid()` ging durch. Dasselbe galt beim Anlegen: Ein frisch registriertes Konto ohne Profil konnte sich sein erstes Profil direkt mit `role = 'owner'` ausstellen. Ein Trigger prüft jetzt beide Wege gegen dieselbe Rangfolge, die auch die Anwendung verwendet.

**3. Vier Stellen entschieden, wer Administrator ist.** `creator_profiles.role`, `creator_profiles.is_admin`, die Tabelle `app_admins` und die Tabelle `admin_domains`. Ein Konto konnte in der Anwendung `user` sein und in den Policies Administrator. Die drei überzähligen sind entfernt; wer über sie Rechte hatte, hat vorher die Rolle `admin` erhalten. Damit ist ADR-0027 auch in der Datenbank umgesetzt.

**4. Zwei Anzeigen logen.** Drei Security-Routen schrieben in `ip_blocklist` – eine Tabelle, die es nicht gibt. Weil `supabase-js` nicht wirft, sondern im `error`-Feld meldet, lief das `try/catch` nie an: Das Sperren einer IP meldete Erfolg und tat nichts. Die Karten „Security & Health" riefen eine Funktion `admin_security_overview` auf, die es nicht gab, fingen den Fehler ab und zeigten aus null Zeilen „RLS aktiv 0/0 – alle Tabellen geschützt". Beides ist behoben, und `npm run check:schema-bezug` verhindert in der CI den Rückfall.

**5. Anwendung und Datenbank waren sich über die Mindestrollen nicht einig.** Der erste Durchgang stellte jede administrative Policy auf `hat_rolle_mindestens('admin')`, während die Anwendung den Bereich seit 1.3 ab `moderator` öffnet und einzelne Eingriffe ab `operator`. Eine Moderation kam damit durch `requireAdminApi()` und bekam von RLS jede Zeile weggefiltert – eine leere Liste, kein Fehler. Ein Betrieb kam durch `POST /api/admin/security/block`, und die Sperre lief ins Leere. `POST /api/admin/payments/refund` konnte überhaupt nichts schreiben, `GET /api/admin/payments/webhooks` antwortete immer leer. Gefunden hat das die Durchsicht des Pull Requests, nicht die Nachweise: Die kannten nur `user`, `admin` und `owner` – genau die beiden mittleren Rollen fehlten. Beide Seiten sprechen jetzt über Fähigkeiten statt über Rollen, und jede Fähigkeit hat einen Nachweis für die Stufe, ab der sie gilt, und die Stufe direkt darunter ([DECISIONS.md](DECISIONS.md) ADR-0035).

**6. Ein Fehler sah aus wie eine leere Liste.** Sechs lesende Admin-Routen umschlossen ihre Abfrage mit `try/catch` und antworteten im Fehlerfall mit `{ rows: [] }` oder mit Nullen. `GET /api/admin/security/summary` hätte im Ausfall „0 Fehlanmeldungen, 0 Sperren" gemeldet, `GET /api/admin/payments/breakdown` dreissig Tage ohne Umsatz. Wirksam war der Fang ohnehin nie, denn `supabase-js` wirft nicht – dieselbe Ursache wie bei Befund 4. Die Routen unterscheiden jetzt drei Ausgänge: leere Liste bei einer erfolgreichen Abfrage ohne Zeilen, 500 bei einer Ablehnung der Datenbank, 503 bei einem Ausfall ([DECISIONS.md](DECISIONS.md) ADR-0037). Am laufenden Server gemessen: Mit entzogenem `select` auf `payments` antworten die drei Zahlungswege 500 statt wie vorher 200 mit leerer Liste.

Dabei kamen zwei Defekte zum Vorschein, die das Verschlucken verdeckt hatte. Die Suche in den Sicherheitsereignissen verglich `security_events.user_id` – eine `uuid` – mit `ilike`; Postgres lehnte jede Suche ab, die Route lieferte stillschweigend nichts. Und ein Suchbegriff mit Komma oder Klammer zerlegte den `or`-Ausdruck von PostgREST, sodass eine andere als die gemeinte Abfrage lief. Beides ist behoben und in `lib/api/suchfilter.test.ts` festgehalten.

Damit stellte sich die Frage nach dem Notzugang: `ADMIN_ALLOWED_EMAILS` öffnet den Gate der Anwendung, aber die Policies kennen die Liste nicht. Entschieden ist, dass das so bleibt – eine zweite Autorität neben `creator_profiles.role` wäre `admin_domains` unter neuem Namen. Eine solche Sitzung sieht jetzt einen Hinweis über der gesamten Shell, statt leere Übersichten, die sich als Entwarnung lesen liessen ([DECISIONS.md](DECISIONS.md) ADR-0036).

**Nachweise.** Nicht abgeleitet, sondern gemessen – alles in Transaktionen, die zurückgerollt werden:

| Prüfung | Ergebnis |
| --- | --- |
| `npm run db:reproduzierbarkeit` | Wiederaufbau gleich dem laufenden Schema, kein Unterschied über 18 Abschnitte |
| `npm run db:sicherheit` | 81 von 81 Nachweisen erfüllt, über neun Konten von `user` bis `owner` |
| `npm run db:rechte` | 118 Tabellenrechte, jedes durch eine Policy gedeckt; kein `TRUNCATE`, `REFERENCES`, `TRIGGER`; RLS auf allen Tabellen; keine Policy nennt eine Rolle direkt |
| `npm run db:rls` | vollständige Matrix aus 4 Rollen × 37 Tabellen × bis zu 5 Operationen |
| `npm run db:typen -- --pruefen` | `types/supabase.ts` entspricht dem Schema |
| `npm test` | 83 Tests, darin der Abgleich von Rollenmodell und Fähigkeiten zwischen TypeScript und Migrations-SQL sowie die Trennung von Fehler und echter Leere |
| Fail-closed am laufenden Server | mit entzogenem `select` auf `payments`: 500 statt 200 mit leerer Liste; Recht zurückgegeben, wieder 200 mit Daten |

**Advisors.** `function_search_path_mutable`, `auth_rls_initplan`, `multiple_permissive_policies`, `duplicate_index` und `rls_enabled_no_policy` sind behoben. Es bleiben 45 Security- und 47 Performance-Befunde, jeder mit Begründung in [docs/DATENBANK.md](docs/DATENBANK.md) Abschnitt 8. Der Grossteil sind Hinweise auf GraphQL-Sichtbarkeit, die aus dem `SELECT`-Recht folgt, und nie benutzte Indizes auf einem Branch ohne Verkehr.

Ein Befund kam im Abschlusslauf neu dazu und blieb zunächst offen: `auth_leaked_password_protection`. Er betrifft keine Struktur, sondern eine Einstellung des Auth-Servers, die in keiner Migration steht. Sie im Vorbeigehen umzulegen hätte geheissen, eine Sicherheitszusage zu geben, die das Repository nicht belegen kann. **Erledigt in 1.4c**: Die Einstellung ist eingeschaltet, ihre Wirkung nachgewiesen und ihr Sollwert im Repository festgehalten ([docs/AUTH.md](docs/AUTH.md) Abschnitt 5).

**Keine Development-Service-Role angelegt.** Sie war an keiner Stelle nötig. Die Skripte gehen über die Management API mit dem Personal Access Token, und die RLS-Nachweise legen ihre Testkonten innerhalb der zurückgerollten Transaktion selbst an.

Bei der Rechtedurchsicht fiel dafür der letzte Service-Role-Pfad **in der Anwendung** auf: `api/search/airports` legte, sobald `SUPABASE_SERVICE_ROLE_KEY` gesetzt war, einen zweiten Client mit vollen Rechten an, um Amadeus-Ergebnisse zurückzuschreiben. Der Endpunkt ist öffentlich und ohne Anmeldung erreichbar. Das Zwischenspeichern ist entfernt. Mit Phase 3.1 entfällt auch der lesende Amadeus-Fallback: die Suche liest nur noch `public.airports`. Damit liest kein Codepfad der Anwendung einen Service-Role-Key und kein aktiver V2-Pfad mehr die Amadeus-API.

**Bewusst nicht getan.** Die 29 obsoleten Tabellen sind eingeordnet, aber nicht gelöscht. Das ist eine eigene, unumkehrbare Handlung und braucht nach [AGENTS.md](AGENTS.md) Regel 22 ein Archiv-Tag. Sie sind jetzt versioniert, RLS-gedeckt und rechtlich eng geführt; ihre Entfernung ist damit eine Aufräumaktion, keine Sicherheitsmassnahme. Nachgeholt in 1.4b.

### 1.4b Obsolete Tabellen entfernen · abgeschlossen auf Development

Umgesetzt auf dem Supabase-Development-Branch. Production ist nicht angefasst worden. Vollständiger Bericht: [docs/LEGACY_ENTFERNUNG.md](docs/LEGACY_ENTFERNUNG.md). Entscheidung: [DECISIONS.md](DECISIONS.md) ADR-0038.

- [x] Archiv-Tag `archive/pre-1-4b-legacy-datenbank` auf den gemergten `main`-Stand gesetzt und gepusht (Commit `c058e845`)
- [x] die 29 Tabellen gegen den realen Development-Stand verifiziert, statt nach Namen zu löschen
- [x] Zeilenzahlen vor dem Drop erhoben: alle 29 leer, keine Daten vernichtet
- [x] Abhängigkeiten vollständig geprüft – Fremdschlüssel, Views, Funktionen, Trigger, Policies, Grants, Indizes, Enums, Sequenzen, Kommentare, Publikationen, cron-Jobs, Anwendungscode
- [x] 29 Tabellen entfernt, dazu 24 Funktionssignaturen, 9 Trigger und die Enums `blog_status` und `creator_content_type`
- [x] Migration `20260817110000_legacy_entfernen.sql` arbeitet **ohne `cascade`** – eine unerwartete Abhängigkeit lässt sie scheitern statt still mitgenommen zu werden
- [x] `creator_profiles`, `airports`, `payments`, `refunds`, `stripe_webhooks`, `security_events`, `blocked_ips` und `creator_sessions` geschützt: 8 Tabellen bleiben
- [x] Typen neu erzeugt (1400 Zeilen entfallen), Reproduzierbarkeit über alle 11 Migrationen ohne Unterschied
- [x] Nachweise angepasst statt gestrichen: 78 Sicherheitsnachweise, 144 RLS-Proben, Advisors erneut gefahren
- [x] `npm run db:rechte` um eine vierte Regel erweitert: keine Funktion nennt eine Struktur, die es nicht gibt
- [x] tote Codepfade entfernt – `scripts/db/sicherheit.mjs`, `scripts/db/verwendung.mjs`, `lib/auth/roles.ts`
- [x] `creator_sessions` bleibt bis 1.5 – die Admin-Startseite zieht daraus noch ihre Kennzahlen

**Erwartung und Messung.** Die Aufgabe nannte ungefähr 39 → 10 Tabellen; gemessen sind es **37 → 8**. Die Abweichung ist zeitlich, nicht fachlich: 39 war der Stand *vor* Phase 1.4, die `admin_domains` und `app_admins` entfernt hat. Die Liste der zu entfernenden Tabellen blieb unverändert 29, und 37 − 29 = 8.

**Der Trockenlauf war der eigentliche Nachweis.** Eine Aufzählung von Abhängigkeiten sagt, was gefunden wurde, nicht was übersehen wurde. Die Migration lief deshalb zuerst in einer zurückgerollten Transaktion und ohne `cascade` – so scheitert sie, sobald etwas ausserhalb der Liste an den Objekten hängt. Sie hat zwei echte Reihenfolgeabhängigkeiten gefunden, die keine Katalogabfrage gezeigt hätte: `publish_due_blog_posts(integer)` gibt `setof blog_posts` zurück und muss vor der Tabelle fallen, Triggerfunktionen erst nach ihren Tabellen.

**Eine Fehlerklasse statt eines Einzelfalls.** PostgreSQL verfolgt Tabellenbezüge im Rumpf einer Funktion nicht in `pg_depend`. 18 Signaturen hätten den `drop table` unbemerkt überlebt und wären erst beim Aufruf mit „relation does not exist" gescheitert – dieselbe Klasse wie `ip_blocklist` und `admin_security_overview` in Phase 1.4. `npm run db:rechte` prüft das jetzt, und die Prüfung ist gegengeprobt: In einer zurückgerollten Transaktion findet sie eine künstlich erzeugte Funktion mit totem Bezug.

**Nicht entfernt, weil der Nachweis fehlte.** Das Enum `session_status` war schon vor dieser Phase verwaist, seine drei Werte sind aber genau die, die `creator_sessions_review_status_check` auf der verbleibenden Spalte `creator_sessions.review_status` erlaubt – es gehört damit nicht nachweisbar ausschliesslich zur entfernten Struktur. Die Fähigkeit `konfiguration-verwalten` deckt keine Tabelle mehr ab, bleibt aber als höchste Stufe des Fähigkeitsmodells bestehen und wird jetzt direkt geprüft. Beide Punkte sind in [docs/DATENBANK.md](docs/DATENBANK.md) Abschnitt 11 als offen geführt.

### 1.4c Auth-Konfiguration versionieren · abgeschlossen auf Development

Umgesetzt auf dem Supabase-Development-Branch. Production ist nicht angefasst worden – der Vergleich mit dem Elternprojekt ist ausschliesslich gelesen. Vollständige Beschreibung: [docs/AUTH.md](docs/AUTH.md). Entscheidung: [DECISIONS.md](DECISIONS.md) ADR-0039.

- [x] den realen Auth-Stand des Branches über die Management API erhoben, bevor etwas geändert wurde – 242 Schlüssel, davon 35 sicherheitsrelevante gegen das Elternprojekt verglichen
- [x] `supabase/config.toml` beschreibt jetzt den Branch statt der CLI-Vorlage; neun Widersprüche aufgelöst, unter anderem Passwortlänge (6 → 12), E-Mail-Bestätigung (aus → an), TOTP (aus → an)
- [x] `password_hibp_enabled` auf Development eingeschaltet und die Wirkung nachgewiesen – ein Passwort aus einem bekannten Datenleck wird abgelehnt, obwohl es die Regel erfüllt
- [x] erklärt, warum der Advisor `auth_leaked_password_protection` kam und ging: Er meldet nur, solange passwortgestützte Konten existieren (vorher 13 Befunde ohne, 14 mit einem solchen Konto). Am Ende der Phase in beide Richtungen gegengeprobt: jetzt 13 ohne **und** 13 mit, jeweils ohne Treffer
- [x] Redirect-Verhalten gemessen statt vermutet: Ein Pfad am eigenen Ursprung wird übernommen, ein fremder Host fällt auf `site_url` zurück. `additional_redirect_urls` bleibt deshalb leer
- [x] zehn sicherheitsrelevante Schlüssel ohne CLI-Entsprechung mit Begründung im Code festgehalten und per PATCH gesetzt
- [x] `npm run auth:pruefen` prüft nicht nur die 55 Sollwerte, sondern verlangt für **jeden** der 242 Schlüssel eine Aussage des Repositories; zwei Musterregeln fangen jeden neuen Anmeldedienst und jeden Auth-Hook
- [x] `npm run auth:fluesse` prüft die Wirkung an den echten Endpunkten: 18 Fälle, alle grün
- [x] Schutz vor dem falschen Ziel: `scripts/auth/ziel.ts` fragt bei Supabase, ob der Ref ein Branch ist, und bricht bei einem eigenständigen Projekt ab
- [x] Passwortregel der Formulare auf eine Quelle gebracht (`lib/auth/passwort-richtlinie.ts`); die Seite nach dem Rücksetzlink verlangte acht Zeichen, der Server zwölf aus vier Gruppen
- [x] die Ablehnung wegen eines Datenlecks wird als solche angezeigt, nicht mehr als „Anforderungen nicht erfüllt"
- [x] eigener CI-Job für den Abgleich, fail-closed: Fehlen die Secrets, schlägt er fehl. Nur ein Pull Request aus einem Fork überspringt sich, weil GitHub ihm keine Secrets gibt
- [x] der Abgleich nennt bei einem unbekannten Schlüssel nur den Namen, nie den Wert – die Auth-Konfiguration führt Geheimnisse, und was in einem neuen Schlüssel steht, weiss niemand. `lib/supabase/auth-bericht.test.ts` speist einen Secret-artigen Wert ein und sucht ihn in Text- und JSON-Ausgabe

**Nachgezogen nach der Prüfung des Pull Requests.** Drei Punkte, alle eng begrenzt. Der CI-Job war nicht fail-closed: Der Schritt „Abgleich" übersprang sich bei fehlenden Secrets, der Job meldete trotzdem `success` – genau der Zustand, den der Kommentar im Workflow ausschliessen wollte. Der Abgleich schrieb den Live-Wert eines unklassifizierten Schlüssels ins Protokoll, obwohl bei einem unbekannten Schlüssel niemand weiss, ob ein Geheimnis darin steht. Und die Aussage zum Plan war falsch: Leaked Password Protection ist Pro Plan und höher, nicht „in allen Plänen" – für Jetnity ohne Folge, weil die Organisation bereits auf Pro läuft, aber als Aussage nicht haltbar ([docs/AUTH.md](docs/AUTH.md) Abschnitt 5).

**Kein `[remotes.*]`-Block.** Die offizielle Branch-Konfiguration läuft darüber, verlangt aber den Projekt-Ref im Klartext und trennt zwei Umgebungen – solange von hier aus nur Development verwaltet wird, ohne Wirkung. Begründung in ADR-0039; der Parameter dafür bleibt im Code vorhanden.

**Offen geblieben, mit Grund.** Google und Apple stehen als Schaltfläche in beiden Formularen und sind auf dem Branch aus; einschalten braucht Client-ID und Secret beider Anbieter. `additional_redirect_urls` bleibt leer, bis ein ausgelieferter Ursprung existiert. Es gibt keinen eigenen SMTP-Server: Supabase versendet selbst und begrenzt auf zwei E-Mails je Stunde – für den Launch reicht das nicht.

### 1.4d Fehler in der Oberfläche sichtbar machen · abgeschlossen

Umgesetzt. Am laufenden Server gemessen, mit entzogenem `select` auf `payments`, `stripe_webhooks`, `security_events` und `creator_sessions`. Entscheidung: [DECISIONS.md](DECISIONS.md) ADR-0040.

- [x] `TransactionsCard` und `WebhooksCard` warfen bei `!res.ok` in ein `finally` **ohne `catch`**; der Zustand blieb auf `[]` stehen und die Tabelle meldete „Keine Transaktionen" bzw. „Keine Events". Beide zeigen jetzt die Meldung des Servers
- [x] `OverviewCard` zeigte die Meldung, darunter aber trotzdem drei Nullen und eine flache Kurve; `SecurityWidget` einen Toast, der nach vier Sekunden verschwand und vier Kennzahlen auf 0 zurückliess – bei einem Lauf alle 15 Sekunden zudem immer wieder
- [x] eine gemeinsame Fläche für *lädt* / *leer* / *nicht ermittelbar* in `components/admin/Ladezustand.tsx`, die Unterscheidung einmal in `lib/admin/ladezustand.ts`; alle Admin-Ansichten benutzen beides
- [x] ein erfolgreicher Request mit null Zeilen bleibt die gewohnte leere Ansicht – nachgestellt mit einem Statusfilter ohne Treffer
- [x] nur 503 lädt zum zweiten Versuch ein; bei 500 hat die Datenbank geantwortet und abgelehnt
- [x] `lib/admin/ladezustand.test.ts`: 23 Fälle „leer" gegen „Fehler" ohne Netz, darunter Status 500 mit `{ rows: [] }` im Körper und ein fehlendes Feld
- [x] drei weitere Stellen derselben Klasse gefunden und behoben, alle serverseitig: `AdminStatsStrip` („Gesamtumsatz CHF 0.00" bei gescheiterter Abfrage), `AdminTimeSeries` (vierzehn Tage ohne Sitzungen) und die Benutzerverwaltung („Admin · 0 Nutzer gesamt")
- [x] `app/api/admin/security/list/route.ts` war die einzige lesende Route ohne `lese()` und bildete jede Ablehnung auf 500 ab, auch eine erschöpfte Verbindung
- [x] `RefundCard` las `data.error`, die Route sendet `message` – die Begründung der Datenbank kam nie an
- [x] der Suchbegriff der Benutzerverwaltung stand unzitiert im `or`-Ausdruck; `a,b` ergab HTTP 400 und die Seite „0 Nutzer gesamt" (derselbe Fehler wie in ADR-0037 für die Ereignissuche)

**Gemessen statt behauptet.** `head: true` schickt HEAD, und eine HEAD-Antwort hat keinen Körper: `postgrest-js` liefert `{ message: '' }` ohne SQLSTATE, wo dieselbe Abfrage als GET „permission denied for table creator_sessions" meldet. Ohne Behandlung wäre die Fehlerfläche dort eine leere Zeile; sie nennt jetzt den Statuscode.

### 1.5 V2-Reiseschema und persistente Reisen · abgeschlossen auf Development

Umgesetzt auf dem Supabase-Development-Branch. Production ist nicht angefasst worden. Fachliche Beschreibung: [docs/REISEN.md](docs/REISEN.md). Entscheidungen: [DECISIONS.md](DECISIONS.md) ADR-0041 bis ADR-0044.

- [x] Schema für Reisen, Etappen, Tage und Planpunkte (`20260817120000_reiseschema.sql`): 4 Tabellen, 45 CHECK-Bedingungen, 7 Fremdschlüssel, 16 Policies, kein Enum-Typ
- [x] RLS je Tabelle und je Operation getrennt nachgewiesen, positiv und negativ, über zwei Konten und alle Rollenstufen – `npm run db:sicherheit` führt jetzt 128 statt 78 Nachweise
- [x] Eigentum nicht vom Client setzbar: `default auth.uid()`, `with check` in jeder Policy, zusammengesetzter Fremdschlüssel `(trip_id, user_id) → trips (id, user_id)` auf jeder Kindtabelle
- [x] Adminrechte öffnen keine private Reise – nachgewiesen bis zur Rolle `owner`; die Kennzahlen kommen aus zwei Aggregatfunktionen, die nur Anzahlen liefern (ADR-0041)
- [x] Gast → Konto: eine Datenbankfunktion `public.reise_anlegen()`, idempotent über `unique (user_id, client_ref)`; lokaler Entwurf verschwindet erst nach bestätigter Kennung (ADR-0042)
- [x] `creator_profiles` in ein generisches `profiles` überführt, dazu die neun Spalten der Creator-Identität entfernt (ADR-0044)
- [x] Admin-Kennzahlen von `creator_sessions` auf Reisen umgestellt; die Tabelle ist damit entfallen, mit ihr die letzten beiden Enums und fünf Funktionen ohne Aufrufer
- [x] `MAX_GUEST_TRIPS` entfallen: genau eine aktive Gastreise, Hinweis auf das Konto statt stillem Überschreiben, und ein definierter Übergang für Browser mit mehreren Entwürfen der Fassung v2 ([DECISIONS.md](DECISIONS.md) ADR-0013)
- [x] `/planen`, `/reisen` und `/reisen/[tripId]` auf das neue Modell gebracht – Gast im Browser, Konto in Supabase, ohne Beispieldaten und mit getrennten Lade-, Leer- und Fehlerzuständen
- [x] Indizes an den realen Zugriffspfaden, Advisors danach erneut gefahren
- [x] Reproduzierbarkeit über alle 15 Migrationen ohne Unterschied, Typen neu erzeugt, kein Type-Drift
- [x] Browser-Flow gegen den laufenden Branch verifiziert: Gast plant im Browser, meldet sich an, dieselbe Reise liegt danach im Konto – ein Reload erzeugt keine zweite. Öffnen, Planpunkt hinzufügen und Reise löschen im Konto ebenfalls durchgespielt, danach der Bestand in der Datenbank nachgezählt
- [ ] Registrierung über die Oberfläche **nicht** von Hand durchgespielt: Der Branch verlangt die E-Mail-Bestätigung, und es gibt kein Postfach dafür ([docs/AUTH.md](docs/AUTH.md) Abschnitt 8). Die Brücke ist für Anmeldung und Registrierung dieselbe Stelle und liegt auf `/reisen`; der Signup-Fall ist in `lib/trips/uebernahme.test.ts` abgedeckt

**Das Datenmodell ist aus den Anforderungen abgeleitet, nicht aus dem Speicherformat.** Eine Reise lag bis hierher als Titel, Ziel und Liste freier Einträge im `localStorage`. Vier Tabellen tragen jetzt, was der Produktkern braucht: mehrere Ziele als Etappen in Reihenfolge, Reisetage mit verbindlicher Ordnung und optionalem Datum, Planpunkte in fünf Arten mit Zeitfenster, Preis und drei Spalten für spätere Anbieter. Optional ist dabei Absicht: Eine Reiseidee entsteht ohne festen Zeitraum, und Phase 2 soll sie in diesem Zustand speichern können. Begründung je Festlegung in ADR-0043.

**Die Idempotenz sitzt in der Datenbank.** `trips.client_ref` trägt die Kennung, die der Browser vergibt, und `unique (user_id, client_ref)` macht daraus pro Konto genau eine Reise. Damit sind Reload, Retry, doppelter Request, zweiter Login, zwei offene Tabs und ein Doppelklick auf „Reise erstellen" mit einer Bedingung abgedeckt – ein Vermerk im Browser hätte keinen dieser Fälle vollständig gesehen.

**Kein Gastkonto.** Anonyme Anmeldungen wären der bequeme Weg gewesen und hätten für jede Besucherin eine Zeile in `auth.users` erzeugt, die niemand bestätigt, aufräumt oder verantwortet. Der Gast bleibt deshalb ohne serverseitige Identität; `anon` hat auf keiner Reisetabelle ein Recht und auf `reise_anlegen()` kein EXECUTE (ADR-0042).

**Nachweise.** Gemessen, nicht abgeleitet – die datenbanknahen Läufe in Transaktionen, die zurückgerollt werden:

| Prüfung | Ergebnis |
| --- | --- |
| `npm run db:reproduzierbarkeit` | Wiederaufbau aus 18 Migrationen gleich dem laufenden Schema, kein Unterschied |
| `npm run db:sicherheit` | 140 von 140 Nachweisen erfüllt, davon 52 neue zu Reisen |
| `npm run db:parallelitaet` | 5 von 5 Nachweisen erfüllt, je 6 gleichzeitige Sitzungen gegen die Erzeugungsschranke |
| `npm run db:rechte` | 32 Tabellenrechte, jedes durch eine Policy gedeckt; kein `TRUNCATE`, `REFERENCES`, `TRIGGER`; RLS auf allen 11 Tabellen; keine Policy nennt eine Rolle direkt; keine Funktion greift ins Leere |
| `npm run db:rls` | Matrix aus 4 Akteuren × 11 Tabellen × bis zu 5 Operationen |
| `npm run db:typen -- --pruefen` | `types/supabase.ts` entspricht dem Schema |
| `npm run db:advisors` | 18 Security-, 6 Performance-Befunde, jeder begründet ([docs/DATENBANK.md](docs/DATENBANK.md) Abschnitt 8) |
| `npm run auth:pruefen` | 55 Sollwerte, 242 Schlüssel eingeordnet, unverändert grün |
| `npm test` | 327 Tests in 75 Gruppen, davon 129 in `lib/trips/`: Zod-Schemas, Mapper, Tagesaufteilung, Gastspeicher und Übernahme |
| Typecheck, Lint, Hygiene, Production-Build | grün |

**Nachtrag aus der Überprüfung vor dem Merge.** Drei Befunde sind in derselben Phase behoben, jeder an der Ursache:

- [x] Die Erzeugungsregeln lagen nur in `public.reise_anlegen()`, `authenticated` hat aber `INSERT` auf `public.trips`: Über PostgREST liessen sich Kennung, Anfangsstatus und die Schranke von 60 neuen Reisen je Stunde vollständig übergehen, ein rückdatiertes `created_at` zusätzlich das Zeitfenster der Schranke. `client_ref` ist jetzt `NOT NULL`, ein Auslöser vor jeder Einfügung setzt die Zeitstempel, verlangt `draft` und zählt die Schranke – auf jedem Schreibweg (ADR-0045)
- [x] Der Gastspeicher verschluckte Schreibfehler: Anlegen und Bearbeiten meldeten Erfolg, obwohl nichts im Browser lag, und die Übernahme aus der alten Fassung löschte den alten Schlüssel, ohne das Schreiben der neuen zu prüfen. Jeder Schreibvorgang wird jetzt zurückgelesen, ein Fehlschlag wirft, und gelöscht wird nur, was nachweislich anderswo liegt (ADR-0046)
- [x] `PublicNavbar` zeigte auch bei offener Sitzung immer „Anmelden" und bot kein Abmelden. Mit persistenten privaten Reisen ist das auf einem geteilten Gerät ein Sicherheitsthema und keine Kosmetik: Die Leiste liest die Sitzung jetzt im Browser, das öffentliche Layout bleibt statisch (ADR-0047)

**Nachtrag aus der zweiten Überprüfung.** Ein Folgefehler der Verlegung aus ADR-0045, behoben an der Ursache:

- [x] Der Auslöser aus ADR-0045 läuft vor dem eindeutigen Index und warf damit an der Grenze auch dann mit `53400`, wenn `on conflict do nothing` gar keine Reise angelegt hätte: Ein Retry mit belegter Kennung – Netzfehler, Reload, zweite Anmeldung – war an einem Konto mit 60 Reisen in der letzten Stunde eine Stunde lang nicht wiederholbar, obwohl die Reise längst im Konto lag. Die Schranke fragt jetzt zuerst, ob überhaupt eine Reise entsteht: Ist `(user_id, client_ref)` belegt, gilt sie nicht, und der Schreibvorgang endet am eindeutigen Index statt an der Schranke. Eine tatsächlich neue Kennung scheitert weiter mit `53400` (ADR-0048)

**Nachtrag aus der dritten Überprüfung.** Die Schranke prüfte sequenziell, was gleichzeitig geschieht:

- [x] `count(*)` und die anschliessende Einfügung liefen ohne Serialisierung je Konto. Bei 59 vorhandenen Reisen sahen gleichzeitige Anfragen alle den Stand 59 und kamen alle durch – gemessen mit sechs Sitzungen: 65 Reisen statt höchstens 60, auf beiden Schreibwegen. Über PostgREST sind gleichzeitige Anfragen der Normalfall, der öffentliche Weg aus ADR-0045 war also weiter offen, nur parallel statt sequenziell. Zählung und Einfügung laufen jetzt je Konto der Reihe nach, serialisiert über eine Beratungssperre auf Transaktionsdauer (ADR-0049)
- [x] Dazu ein eigener Nachweis `npm run db:parallelitaet` mit echten gleichzeitigen Verbindungen. `db:sicherheit` konnte das nicht leisten: Der Lauf liegt vollständig in einer Transaktion, und zwei Anweisungen derselben Transaktion sehen einander immer. Dass die Parameter genügen, ist gegengeprüft – mit der Fassung ohne Sperre scheitert das Skript

**Vier Dinge sind bei der Umsetzung aufgefallen und mit behoben.** Die Prüfbedingung auf `interests` liess denselben Wert doppelt zu – ein CHECK mit `unnest` braucht eine `immutable` Funktion, weil eine Unterabfrage dort nicht erlaubt ist (SQLSTATE `0A000`). Ein Preis war ohne Währung eintragbar; beides ist jetzt aneinander gebunden. Die Zuordnung eines Planpunkts zu seinem Tag lief zunächst über die lokale Kennung des Browsers, die in der Datenbank keine Bedeutung hat – sie läuft jetzt über `day_index`. Und `npm run db:rls` konnte Kindtabellen mit zusammengesetztem Fremdschlüssel nicht säen: Die Saat wählte eine beliebige Reise, häufig die eines anderen Testkontos, und scheiterte an `trip_days_reise_fk`. Das Skript löst Fremdschlüssel jetzt über die Primärschlüsselspalten der Zieltabelle auf und wählt bei Tabellen mit `user_id` deterministisch die Zeile des eigenen Kontos.

### 1.6 Erste Tests

Priorität nach [AGENTS.md](AGENTS.md) Regel 24: Auth, Rollen, RLS, Trip-Persistenz.

- [x] Test-Runner eingerichtet – mit 1.3 erledigt: `npm test` läuft über den Test-Runner von Node mit `tsx` als Loader, ohne neues Paket ([DECISIONS.md](DECISIONS.md) ADR-0029)
- [x] Tests für Rollen und Berechtigungen (52 ohne Datenbank; 34 aus 1.3, dazu 7 für den Abgleich des Rollenmodells, 6 für den Abgleich der Fähigkeiten und 5 für Fähigkeiten und Notzugang in der Zugangsentscheidung)
- [x] Tests für die Antworten der lesenden Admin-Routen (31 ohne Datenbank: 14 für Fehler gegen echte Leere, 7 für die Suchausdrücke, 10 für die Kennzahlen)
- [x] RLS-Nachweise gegen den Development-Branch (140 nach Phase 1.5), dazu die Rechteprüfung, der Reproduzierbarkeitsbeweis und fünf Nachweise unter echter Parallelität
- [x] Tests für Trip-Erstellung und -Persistenz – 129 in `lib/trips/` ohne Datenbank (Schemas, Mapper, Tage, Gastspeicher inklusive voller und stummer Ablage, Übernahme mit Retry, Doppelrequest und Manipulationsversuch), dazu 52 Nachweise gegen den Branch für RLS, Idempotenz und die Erzeugungsregeln – geprüft über `reise_anlegen()` **und** über den direkten `INSERT`, einschliesslich der Wiederholung an der Schranke
- [ ] datenbanknahe Prüfungen in die CI holen – braucht einen kurzlebigen Branch je Lauf, sonst legen nebenläufige Läufe dieselben Testkonten an

### 1.7 Sitzung im öffentlichen Bereich sichtbar · abgeschlossen

Aufgefallen bei der Prüfung der Phase 1.5 im Browser, nicht durch sie verursacht – und in der Überprüfung vor dem Merge als Sicherheitsthema eingeordnet statt verschoben.

- [x] `PublicNavbar` kennt die Sitzung: „Anmelden" nur für Gäste, „Abmelden" über `signOutAction()`, solange die Sitzung unbekannt ist keine der beiden Aussagen
- [x] Entscheidung dokumentiert: clientseitig im Browser über die Cookies, die der Server gesetzt hat, dazu `onAuthStateChange`. Das öffentliche Layout bleibt statisch, die Startseite weiter vorgerendert (ADR-0047)
- [x] Die Regel liegt in `lib/auth/oeffentliche-navigation.ts` und ist ohne Browser prüfbar – 8 Fälle, darunter „Abmelden wird nie ein Link", weil Next.js Links vorauslädt
- [x] Prüfung im Browser: angemeldet abmelden, danach zeigt `/reisen` wieder den Gastzustand
- [x] Dabei aufgefallen und behoben: Die erste Fassung liess nach dem Abmelden weiter „Abmelden" stehen, bis jemand neu lud – die Leiste liegt im Layout und wird von der Weiterleitung der Server Action nicht neu aufgebaut. Sie liest die Sitzung jetzt zusätzlich nach jedem Wechsel des Pfads und nach jedem abgeschlossenen Vorgang, und zwar gelesen statt angenommen (ADR-0047, Nachtrag)

---

## Phase 2 – Jetnity-Kern · in Arbeit

Höchste Produktpriorität: **natürliche Sprache zu strukturierter Reise.**

### 2.1 Freitext zu strukturiertem Reisevorschlag · abgeschlossen auf Development, Modellweg abgeschaltet

Vollständige Beschreibung: [docs/MODELL.md](docs/MODELL.md). Entscheidungen: [DECISIONS.md](DECISIONS.md) ADR-0050 bis ADR-0056.

- [x] Reiseidee in Freitext erfassen und strukturiert interpretieren – Abreiseort, Ziele, Zeitraum oder Dauer, Reisende, Währung, Budgetziel, Tempo, Interessen, besondere Wünsche
- [x] strukturierten Reisevorschlag mit Etappen, Tagen und Planpunkten erzeugen, direkt abbildbar auf das Reiseschema aus Phase 1.5
- [x] Vorschau vor dem Speichern: erkannte Daten, Etappen, Tagesstruktur, Planpunkte, Budgetziel, Tempo, Interessen, Annahmen
- [x] Vorschläge erst nach ausdrücklicher Freigabe übernehmen – der Vorschlag lebt bis dahin im Browser, nicht in der Datenbank (ADR-0050)
- [x] Übernahme über die bestehende Persistenz: `public.reise_anlegen()` im Konto, `gastreiseAblegen()` als Gast, Idempotenz über `client_ref` – keine zweite Persistenz für Modellreisen
- [x] Modelloutput als untrusted input: JSON-Schema mit `strict: true`, danach Zod mit den fachlichen Grenzen des Reiseschemas, dieselbe Prüfung noch einmal beim Übernehmen, versionierte Fassung (ADR-0053)
- [x] keine erfundenen Live-Angebote: Preis-, Anbieter- und Buchungsfelder existieren im Vorschlagsschema nicht, Beträge werden aus Freitexten entfernt, ein genanntes Budget bleibt ein Ziel (ADR-0054)
- [x] Kostenkontrolle nach [AGENTS.md](AGENTS.md) Regel 17: Kill Switch, 4 Aufrufe je Kennung und Stunde, 8 je Tag, 24 für alle Gäste, 38 insgesamt, Kostendeckel $3.00 je Tag, 2000 Zeichen Eingabe, 6000 Ausgabetokens, Terra/Luna 90 s und Sol 120 s, neun Ergebnisklassen, Nutzungsprotokoll
- [x] die Kostenschranke liegt in der Datenbank und ist race-condition-sicher: Reservierung **vor** dem Aufruf, serialisiert über `pg_advisory_xact_lock` (ADR-0052)
- [x] Gaststrategie ohne Gastkonto und ohne neue kostenpflichtige Infrastruktur: Cookie-Kennung, in der Datenbank nur als SHA-256, eigener kleinerer Tagestopf gegen rotierende Kennungen
- [x] 618 Tests ohne einen Modellaufruf, dazu 16 Nachweise gegen die echte Datenbank (`npm run db:kontingent`)
- [x] Prompt-Injection als Testfall: Regeln ignorieren, Systemregeln ausgeben lassen, HTML und SQL im Text
- [x] das bestehende Formular unter `/planen` bleibt unverändert nutzbar und ist der Weg, der auch ohne Modell funktioniert

**Nachtrag 19. August 2026.** Direkter anonymer PostgREST-/RPC-Zugriff darf kein Kontingent mehr reservieren: `EXECUTE` nur noch `service_role`, Server Action bleibt der Gastweg (ADR-0052). ADR-0050 unterscheidet Doppelklick/Retry von einem Reload in der Vorschau. Preview hat Schlüssel und Kill Switch; Production bleibt aus. Die Development-Migration `20260819010000` ist angewendet; die datenbanknahen Nachweise sind gegen den Development-Branch grün.

**Nachtrag Modellstrategie, 19. August 2026.** Die Drei-Fixture-Messung hatte Luna als Vorgabe gesetzt. Die spätere Fünf-Fälle-Messung (`reasoning.effort: low`) hat das geändert: Terra ist Standard, Sol übernimmt komplexe Abwägungen, Luna plant keine komplette Reise automatisch. 40 s kommen nicht zurück; Sol hat 120 s hart. Genau ein Terra-Fallback, genau eine Vorgabe-Korrektur, Progressive Loading auf `/planen` (ADR-0056). Production unverändert aus.

**Nachweise.** Der Abschlusslauf der Phase, die datenbanknahen Teile gegen den Development-Branch:

| Prüfung | Ergebnis |
| --- | --- |
| `npm test` | 618 Tests in 131 Gruppen, inklusive Routing, Vorgabenprüfung, Fortschritt, Fallback und Korrektur – kein Lauf ruft ein Modell |
| `npm run db:kontingent` | 16 von 16 Nachweisen erfüllt: jede der fünf Grenzen einzeln, 6 gleichzeitige Sitzungen auf einen freien Platz, Abschluss, Doppelabschluss, fremde Kennung, Identität eines Kontos |
| `npm run db:sicherheit` | 149 von 149 Nachweisen erfüllt, darin der SQL-Negativfall und der echte PostgREST-Aufruf gegen die Kontingent-RPCs |
| `npm run db:reproduzierbarkeit` | Wiederaufbau aus den versionierten Migrationen gleich dem laufenden Schema |
| `npm run db:rechte` | 33 Tabellenrechte, jedes durch eine Policy gedeckt; RLS auf allen 12 Tabellen |
| `npm run db:rls` | Matrix aus 4 Akteuren × 12 Tabellen; auf `model_usage` hat `anon` kein Recht, ein gewöhnliches Konto sieht null Zeilen, niemand schreibt direkt |
| `npm run db:parallelitaet` | 5 von 5 Nachweisen erfüllt, unverändert grün |
| `npm run db:typen -- --pruefen` | `types/supabase.ts` entspricht dem Schema |
| `npm run db:advisors` | 19 Security-, 6 Performance-Befunde; die früher gefährlichen Kontingent-RPC-Rechte für `anon`/`authenticated` sind entfallen, die verbleibenden sind begründet ([docs/DATENBANK.md](docs/DATENBANK.md) Abschnitt 8) |
| `npm run auth:pruefen` | 55 Sollwerte, 242 Schlüssel eingeordnet, unverändert grün |
| Typecheck, Lint, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, Production-Build | grün |
| Browser, Gast und Konto, Mobile und Desktop | Freitext, Vorschau, Übernehmen, Reise öffnen, Reload – die Reise bleibt, ein Reload erzeugt keine zweite. Der Modellaufruf war dabei lokal durch eine Attrappe ersetzt, die die Fixture zurückgibt; Kontingent, Protokoll und Persistenz liefen echt |

Offen aus 2.1:

- [x] `OPENAI_API_KEY` in der Preview-Umgebung hinterlegen (`JETNITY_MODELL_AKTIV=true`, Hard Spend Limit $5) – Production unverändert aus
- [x] Gast-Kontingent nicht mehr über direkten anon-RPC erreichbar (Nachtrag ADR-0052)
- [x] `npm run modell:probe` gegen `gpt-5.6-terra` und `gpt-5.6-luna` mit Ideen 1, 2 und 7 – frühe Vorgabe, später durch ADR-0056 ersetzt
- [x] Sol/Terra auf fünf vollständigen Planungsfällen gemessen; Routing, 120-s-Sol-Grenze, Vorgabeprüfung und Progressive Loading (ADR-0056)
- [ ] Aufbewahrungsfrist für `public.model_usage` entscheiden – sie gehört zur Freigabe, nicht zur Implementierung (ADR-0052)
- [ ] Entscheidung über die Aktivierung in Production – die Modellwahl ist gemessen, Production bleibt aus

### 2.2 Bestehende Reise per Sprache ändern · fertig auf Development

- [x] Änderung per Sprache („Mach die Reise zwei Tage länger", „Entferne Los Angeles", „Wir reisen jetzt zu dritt", „Mach die Reise entspannter", „Füge nach Florenz noch zwei Tage am Meer hinzu")
- [x] `trip_days.stage_id` und `trips.revision` / `last_mutation_id`
- [x] strukturierte Operationen, deterministisch angewendet, Vorher/Nachher, ausdrückliche Bestätigung
- [x] atomisches `public.reise_aendern()`, Idempotenz, veraltete Fassung, Gastspeicher
- [x] Tests für Operationen, Zuordnung, kommerzielle Felder, Kontingent, RLS
- [x] Nachtrag: `reise_anlegen()` ohne eigene Missbrauchszählung (`20260820050000`, ADR-0045/0048)
- [x] Nachtrag: Graph-Revision über Trigger (`20260820060000`), Guest-`ohneTag`, kommerzielle Planpunkte bei Modelloperationen geschützt
- [x] Nachtrag: direkte Stammdaten-Updates auf `trips` erhöhen `revision` (`20260820070000`)
- [x] Nachtrag: aufgeschobene Tages-Eindeutigkeit in `reise_aendern()` (`20260820080000`) und vollständige Sperre kommerzieller Planpunkte

**Voraussetzungen erfüllt.** PR #18 ist gemergt, Production-Deploy verifiziert. Modellweg in Production unverändert aus.

**Nachweise Nachtrag `20260820080000` (Development):** `npm test` 701/701; typecheck, lint, Hygiene, `db:typen --pruefen`, `db:rechte`, Production-Build grün; `db:sicherheit` 168/168, einschließlich aufgeschobener Tages-Eindeutigkeit (fünf gültige Umnummerierungen, eine abgelehnte Doppelnummer) und vollständiger Kommerzial-Sperre. `db:kontingent` nicht gegen die Live-Gasttagesgrenze geschrieben.

---

## Phase 3.1 – Flight Foundation · in Arbeit

Schlanke interne Flugdomäne, Duffel als erster Datenadapter, deterministisches Ranking, Übernahme in die Reise. Keine eigene Buchung. Production aus.

- [x] Provider-unabhängige Flight-Domain und `FlightProvider`
- [x] Duffel Flights API als erster Adapter (nur Test-Token)
- [x] deterministisches, provisionsneutrales Ranking
- [x] Suche im Reise-Arbeitsbereich
- [x] Übernahme als kommerzieller `trip_item`, modellgeschützt
- [x] Amadeus-Fallback aus `/api/search/airports` entfernt; Suche nur noch `public.airports`
- [x] Provider-unabhängige Airport-Datenbasis (OurAirports-Import, Development 5332 Zeilen)
- [x] Destination Validation & Place Foundation (GeoNames-Dump, lokale `public.places`, gemeinsame Autocomplete)
- [ ] Preview mit Duffel-Test-Token verifizieren
- [x] Development-Migration `20260820100000` auf dem Development-Branch anwenden
- [ ] Production-Flugsuche – eigene Freigabe, nicht Teil dieses Schritts
- [ ] Production-Airport-Schema und -Bestand – eigene Freigabe, nicht Teil dieses Schritts
- [ ] Production-Places-Schema und -Bestand – eigene Freigabe, nicht Teil dieses Schritts

Amadeus Self-Service (eingestellt 17. Juli 2026) wird nicht angebunden. Im aktiven V2-Code gibt es keinen funktionsfähigen Amadeus-API-Pfad mehr. Ein späterer Skyscanner- oder Aviasales-Adapter muss dasselbe Interface erfüllen, ohne UI-, Ranking- oder Trip-Rewrite.

---

## Phase 3 – Hotels, Aktivitäten, Monetarisierung · als Nächstes

Je Kategorie zunächst genau ein Weg ([DECISIONS.md](DECISIONS.md), ADR-0011, Nachtrag ADR-0062).

- [ ] Hotels über einfache Affiliate-/Deeplink-Lösung
- [ ] Aktivitäten über GetYourGuide
- [ ] Budget- und Gesamtpreisübersicht über die ganze Reise
- [ ] Affiliate-Tracking und Übergabe an Buchungspartner
- [ ] Angebote erscheinen im Reisekontext, nicht als getrennte Suchmaschinen
- [ ] Tests für Provider-Integration und Affiliate-Tracking

---

## Phase 4 – Launch-Reife · geplant

- [ ] Konto-Flows vollständig: Registrierung, Login, Gastmigration, Präferenzen
- [ ] schlankes Admin für Nutzer, Reisen, Affiliate-Aktivitäten, Provider, Support, Einnahmen, Systemstatus, Audit Logs
- [ ] Performance: Startseite, Trip Workspace, Suchergebnisse, Bilder, Caching
- [ ] Internationalisierung vorbereiten, Start mit Deutsch, CHF, Schweizer Datenschutz
- [ ] `jetnity.ch` und `jetnity.com` mit dem Vercel-Projekt verbinden – beide lösen derzeit nicht auf, Production läuft nur unter `jetnity-app.vercel.app`
- [ ] End-to-End-Tests der MVP-Strecke
- [ ] Browser-Kompatibilität und Prüfung auf echter iOS-/Android-Hardware (Responsive-Regeln siehe Querschnitt oben)
- [ ] Rechtstexte: `/terms` und `/privacy` existieren nicht, die Registrierung verlinkt beide (siehe „Wartet auf Freigabe")

---

## Blockiert

| Thema | blockiert durch |
| --- | --- |
| Datenbanknahe Prüfungen in der CI | braucht einen kurzlebigen Supabase-Branch je Lauf |
| Nutzungsbedingungen und Datenschutzerklärung | Inhalt ist eine rechtliche Entscheidung, nicht technisch ableitbar |
| Anmeldung über Google und Apple | Client-ID und Secret beider Anbieter, eine Handlung ausserhalb dieses Repositories |

Mit Phase 1.4 sind zwei Einträge entfallen: RLS ist versioniert und mit Nachweisen belegt, und das Schema ist aus dem Repository nachvollziehbar und reproduzierbar. Mit Phase 1.5 ist der dritte entfallen – die Trip-Persistenz, an der Phase 2 hing.

---

## Wartet auf Freigabe

**Nutzungsbedingungen und Datenschutzerklärung.** Der Zustimmungstext der Registrierung verlinkt `/terms` und `/privacy`. Beide Routen existieren nicht, beide Links führen auf die 404-Seite – also ausgerechnet dort, wo jemand vor dem Anlegen eines Kontos zustimmen soll. Der Inhalt ist eine rechtliche Entscheidung und wird nicht erfunden. Benötigt werden die freigegebenen Texte für DSGVO und CH-DSG; danach sind die beiden Seiten schnell angelegt. Bis dahin bleibt dies der einzige bekannte tote Link auf einer V2-Seite.

Ebenfalls offen, weil an derselben Freigabe hängend: `components/layout/CookieConsent.tsx` ist vorhanden, wird nirgends eingebunden und verweist ebenfalls auf `/privacy`. Ob Jetnity einen Cookie-Hinweis braucht, ist eine rechtliche Frage; die Datei bleibt deshalb liegen, statt sie als toten Code zu entfernen.

---

## Bewusst verschoben

Diese Punkte sind erkannt und nicht eingeplant. Sie dürfen die aktuelle Phase nicht verdrängen ([AGENTS.md](AGENTS.md) Regel 26).

- **Jetnity Pro / Abo-Modell** – V2 monetarisiert primär über Vermittlung (ADR-0010)
- **Guardian-Modul** für Einreise- und Sicherheitshinweise – neue Produktkategorie, nicht freigegeben
- **B2B-Angebote** für Reiseberater und Gruppenorganisatoren – nicht freigegeben
- **Bexio-Integration** – erst wenn relevante Transaktionsvolumen existieren
- **Multi-Provider-Abstraktion** – erst bei echtem zweiten Provider (ADR-0011)
- **Zentrales Error-Tracking / Observability-Anbieter** – verursacht laufende Kosten, braucht Freigabe
- **Dark Mode für V2-Oberflächen** – nicht ausgearbeitet, nicht freigegeben
- **Sensible Reisedokumente** (Pass, Visa, Gesundheitsdaten) – benötigt getrennten Sicherheitsbereich, siehe `docs/JETNITY_V2_FOUNDATION.md`
- **Mietwagen, Transfers, Versicherungen** – nach Phase 3, wenn die drei Kernkategorien tragen
- **Weitere Sprachen über Deutsch hinaus** – Architektur vorbereiten, Inhalte später
- **Bereinigung der ca. 309 `any`-Vorkommen** – nur dort, wo V2-relevanter Code betroffen ist

---

## Backlog

Ideen ohne Termin, dokumentiert damit sie nicht verloren gehen.

- Preisänderungen einer gespeicherten Reise beobachten und melden
- Alternativen einer Reise vergleichbar nebeneinander darstellen
- gemeinsame Reiseplanung mit mehreren Personen
- Offline-fähiger Cache mit Konfliktauflösung
- strukturierte Log-Konvention ohne sensible Nutzerdaten
- Obergrenze für Etappen, Tage und Planpunkte **je Reise** auch auf dem direkten Schreibweg. `public.reise_anlegen()` prüft sie (50 / 366 / 1000), ein direkter `INSERT` in die Kindtabellen nicht: Ein Konto kann seine eigene Reise beliebig weit füllen. Ein Auslöser je Zeile mit einer Zählung wäre bei 1000 Planpunkten in einer Anweisung quadratisch; der brauchbare Weg ist ein Auslöser je Anweisung mit Übergangstabelle. Bewusst nicht in den Nachtrag der Phase 1.5 gezogen (ADR-0045, Alternative 4)
- automatisierte Responsive-Regression in der CI: Seiten auf den Referenzbreiten laden und horizontales Overflow sowie abgeschnittene Inhalte prüfen. Benötigt einen Browser im CI-Lauf und damit zusätzliche Laufzeit, deshalb bewusst noch nicht eingebaut. Wichtig dabei: Seiten, die ohne Supabase-Variablen in die Fehlerseite laufen, werden sonst scheinbar fehlerfrei gemessen – der Lauf braucht Platzhalter-Variablen und eine Prüfung, dass die echte Seite gerendert wurde.
