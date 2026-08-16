# Jetnity – Roadmap

Stand: 16. August 2026

Diese Datei zeigt jederzeit: was fertig ist, was in Arbeit ist, was als Nächstes kommt, was blockiert ist und was bewusst verschoben wurde ([AGENTS.md](AGENTS.md) Regel 6).

Die Reihenfolge ist freigegeben und begründet in [DECISIONS.md](DECISIONS.md), ADR-0012.

---

## Übersicht

| Phase | Inhalt | Status |
| --- | --- | --- |
| Phase 0 | V2-Basis, Build, CI, Design-Tokens, Dokumentation | **fertig** |
| Querschnitt | Mobile- und Responsive-Qualität der V2-Seiten | **fertig** |
| Phase 1.1 | Alt-Endpunkte und Cron-Jobs außer Betrieb | **fertig** |
| Phase 1.1b | Alt-Oberflächen entfernen, Auth-Texte auf V2 | **fertig** |
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

Bewusst behalten: `app/auth/refresh`, `api/search/airports`, `api/search`, `api/admin/payments/*`, `api/admin/security/*`.

### 1.1b Alt-Oberflächen entfernen · fertig

Archiv-Tag vor der Löschung: `archive/pre-1-1b-alt-ui`. 209 Dateien entfernt, Typecheck, Lint und Production-Build grün. Details in [DECISIONS.md](DECISIONS.md), ADR-0018.

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

### 1.2 shadcn-Tokens auf die V2-Farbwelt umstellen · freigegeben

- [ ] `--primary`, `--accent`, `--secondary`, `--ring`, `--border`, `--input` auf V2-Farben setzen
- [ ] tote Tokens mit Blauanteil entfernen (`--jet-hero`, `--jet-btn`, zugehörige Utilities)
- [ ] `DESIGN_SYSTEM.md` aktualisieren

Die Production-Prüfung hat ergeben, welche V2-Oberflächen konkret betroffen sind. Diese vier Dateien nutzen noch die blau/violetten shadcn-Tokens und werden mit diesem Schritt bereinigt:

| Datei | Wirkung |
| --- | --- |
| `components/layout/SkipToContentLink.tsx` | erscheint bei Tastaturfokus auf **jeder** V2-Seite blau |
| `components/ui/*` | Primitive (Button, Input, Checkbox) tragen die shadcn-Tokens, sichtbar auf `/login` und `/register` |

`app/(public)/error.tsx`, `app/(public)/not-found.tsx` und `components/trips/MiniTripSlider.tsx` sind mit Phase 1.1b erledigt: die Fehlerseiten nutzen jetzt V2-Tokens, der Slider ist entfernt. Der Skip-Link ist damit der einzige Blau-Eintrag, der die regulären V2-Seiten erreicht. Er ist bis zum Tastaturfokus unsichtbar, aber für Tastaturnutzer sichtbar und damit vorrangig. Dazu kommen die Auth-Formulare, die über die `ui`-Primitive noch auf `--primary` liegen.

### 1.3 Auth, Rollen und Middleware vereinheitlichen

- [ ] einheitliches Rollen- und Berechtigungsmodell
- [ ] Admin-Prüfung zentralisieren statt pro Route
- [ ] Middleware-Schutz über alle geschützten Bereiche statt nur `/account`
- [ ] generisches Traveller-Profil an Stelle des Creator-Profils

### 1.4 Datenbank-Baseline · blockierend für Phase 2

- [ ] vollständige Baseline-Migration für das real existierende Schema (aktuell 37 Tabellen in den Typen, 2 in Migrationen)
- [ ] unversionierte Migration `<timestamp>_realtime_creator_session_metrics.sql` bereinigen
- [ ] die zwei konkurrierenden Typdateien zusammenführen (`types/supabase.ts` und `types/supabase.types.ts`)
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

- [ ] Test-Runner einrichten (derzeit 0 Test-Dateien im Repo)
- [ ] RLS-Tests
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

---

## Blockiert

| Thema | blockiert durch |
| --- | --- |
| Phase 2 (Trip-Persistenz) | Datenbank-Baseline und Trip-Schema (1.4, 1.5) |
| RLS-Tests | fehlende versionierte RLS-Definitionen (1.4) |
| Aussagen zur DB-Sicherheit | Schema ist aus dem Repository nicht nachvollziehbar (1.4) |

---

## Wartet auf Freigabe

Derzeit nichts.

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
