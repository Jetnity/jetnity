# Jetnity – Roadmap

Stand: 16. August 2026

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
| Phase 1 (Rest) | V2-Sicherheit und Datenbasis | in Arbeit |
| Phase 2 | Jetnity-Kern: natürliche Sprache zu strukturierter Reise | geplant |
| Phase 3 | Reiseprodukte und Monetarisierung | geplant |
| Phase 4 | Launch-Reife | geplant |

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

### 1.4 Datenbank-Baseline · wartet auf den Development-Zugang, blockierend für Phase 2

**Benötigter Zugang.** Ohne diese beiden Verbindungen lässt sich 1.4 nicht beginnen; erhoben werden kann nichts, und Migrationen liessen sich nirgends testen. Nach der Freigabe von Phase 1.3 gilt: keine Production-Datenbankänderungen.

| Zweck | Was gebraucht wird | Rechte |
| --- | --- | --- |
| Bestandsaufnahme Production | Projekt-Referenz und ein lesender Zugang zum Production-Projekt | ausschliesslich lesend, projektgebunden. **Keine** Production-Service-Role |
| Migrationen, RLS und Tests | ein eigenes Development-/Test-Projekt: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` und die Datenbank-Verbindung für `supabase db push` | schreibend, nur auf dem Development-Projekt |

Eine Development-Service-Role wird erst dann als Secret angelegt, wenn ein Test sie tatsächlich braucht – etwa um für RLS-Tests Datensätze fremder Konten anzulegen. Die Rollen- und Berechtigungstests aus 1.3 brauchen sie nicht: Sie prüfen die Entscheidungslogik ohne Datenbank.

**Was ohne Zugang schon feststeht.** Die Typen beschreiben 37 Tabellen, versioniert sind zwei. Es existiert eine Tabelle `admin_domains` – ein Hinweis darauf, dass eine domainbasierte Administrationsfreigabe einmal vorgesehen war. Mit ADR-0027 ist entschieden, dass eine Domain keine Berechtigung erteilt; die Tabelle ist in der Anwendung unbenutzt und gehört bei der Baseline auf die Liste der zu entfernenden Altlasten.

- [ ] vollständige Baseline-Migration für das real existierende Schema (aktuell 37 Tabellen in den Typen, 2 in Migrationen)
- [ ] `admin_domains` bewerten und entfernen – domainbasierter Admin-Zugang ist mit ADR-0027 ausgeschlossen
- [ ] Rolle aus `creator_profiles` in ein generisches Profil überführen; `ROLE_TABLE` in `lib/auth/admin-guard.ts` ist die einzige Stelle, die den Tabellennamen kennt
- [ ] unversionierte Migration `<timestamp>_realtime_creator_session_metrics.sql` bereinigen
- [x] die zwei konkurrierenden Typdateien zusammengeführt – mit Phase 1.2b erledigt: `types/supabase.types.ts` war ein älterer, kleinerer Abzug ohne einen einzigen Import und ist entfernt; die Schematypen liegen nur noch in `types/supabase.ts`
- [ ] RLS-Zustand erheben, versionieren und testen
- [ ] Ownership-Modell dokumentieren

### 1.5 V2-Reise-Schema

- [ ] Schema für Reisen, Etappen, Tage, Planpunkte, Teilnehmer
- [ ] RLS je Tabelle mit Tests
- [ ] Migrationspfad Gastreise zu Konto
- [ ] Indizes prüfen
- [ ] `MAX_GUEST_TRIPS` von 20 auf 1 setzen, mit ehrlichem Hinweis auf das Konto statt stillem Überschreiben und definiertem Übergang für Browser, die bereits mehrere Gastreisen enthalten ([DECISIONS.md](DECISIONS.md), ADR-0013)

### 1.6 Erste Tests

Priorität nach [AGENTS.md](AGENTS.md) Regel 24: Auth, Rollen, RLS, Trip-Persistenz.

- [x] Test-Runner eingerichtet – mit 1.3 erledigt: `npm test` läuft über den Test-Runner von Node mit `tsx` als Loader, ohne neues Paket ([DECISIONS.md](DECISIONS.md) ADR-0029)
- [x] Tests für Rollen und Berechtigungen (34, ohne Datenbank)
- [ ] RLS-Tests → braucht den Development-Zugang aus 1.4
- [ ] Tests für Trip-Erstellung und -Persistenz

---

## Phase 2 – Jetnity-Kern · geplant

Höchste Produktpriorität: **natürliche Sprache zu strukturierter Reise.**

- [ ] Reiseidee in Freitext erfassen und strukturiert interpretieren (Ziel, Zeitraum, Reisende, Budget, Präferenzen)
- [ ] strukturierten Reisevorschlag mit Etappen und Tagesstruktur erzeugen
- [ ] Reise speichern und im Workspace weiterbearbeiten
- [ ] Änderung per Sprache („Hotel günstiger", „Eine Nacht weniger Bangkok", „Mach Tag 3 entspannter", „maximal CHF 3'000")
- [ ] Vorschläge erst nach Nutzerfreigabe übernehmen
- [ ] Kostenkontrolle für jede Modellfunktion: Request-Limit, Tageslimit, Timeout, Max Tokens, Fallback, Kill Switch, Nutzungs-Logging ([AGENTS.md](AGENTS.md) Regel 17)
- [ ] Tests für die strukturierten Sprachoperationen

**Voraussetzung:** Phase 1.4 und 1.5. Ohne Trip-Schema wäre der Trip Builder eine Demo.

---

## Phase 3 – Reiseprodukte und Monetarisierung · geplant

Je Kategorie zunächst genau ein Anbieter ([DECISIONS.md](DECISIONS.md), ADR-0011).

- [ ] Flüge über Amadeus, bestehende Airport-Integration weiterverwenden
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
| Phase 2 (Trip-Persistenz) | Datenbank-Baseline und Trip-Schema (1.4, 1.5) |
| RLS-Tests | fehlende versionierte RLS-Definitionen (1.4) |
| Aussagen zur DB-Sicherheit | Schema ist aus dem Repository nicht nachvollziehbar (1.4) |
| Nutzungsbedingungen und Datenschutzerklärung | Inhalt ist eine rechtliche Entscheidung, nicht technisch ableitbar |

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
- automatisierte Responsive-Regression in der CI: Seiten auf den Referenzbreiten laden und horizontales Overflow sowie abgeschnittene Inhalte prüfen. Benötigt einen Browser im CI-Lauf und damit zusätzliche Laufzeit, deshalb bewusst noch nicht eingebaut. Wichtig dabei: Seiten, die ohne Supabase-Variablen in die Fehlerseite laufen, werden sonst scheinbar fehlerfrei gemessen – der Lauf braucht Platzhalter-Variablen und eine Prüfung, dass die echte Seite gerendert wurde.
