# Jetnity – Roadmap

Stand: 15. August 2026

Diese Datei zeigt jederzeit: was fertig ist, was in Arbeit ist, was als Nächstes kommt, was blockiert ist und was bewusst verschoben wurde ([AGENTS.md](AGENTS.md) Regel 6).

Die Reihenfolge ist freigegeben und begründet in [DECISIONS.md](DECISIONS.md), ADR-0012.

---

## Übersicht

| Phase | Inhalt | Status |
| --- | --- | --- |
| Phase 0 | V2-Basis, Build, CI, Design-Tokens, Dokumentation | **fertig** |
| Phase 1 | V2-Sicherheit und Datenbasis | als Nächstes |
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

## Phase 1 – V2-Sicherheit und Datenbasis · als Nächstes

Grundsatz: Nur der Code wird abgesichert, der in V2 tatsächlich weiterbesteht. Alt-Code wird abgeschaltet, nicht gehärtet ([DECISIONS.md](DECISIONS.md), ADR-0006).

### 1.1 Alt-Endpunkte außer Betrieb nehmen · als Nächstes, freigegeben

Zielsetzung: die Angriffsfläche und die Kostenrisiken der alten Produktwelt beseitigen, bevor an der Datenbasis gearbeitet wird.

- [ ] KI-Endpunkte der Creator-/Story-/Media-Welt abschalten (unter anderem `api/copilot/*`, `api/story/*`, `api/storyboard`, `api/generate-*`, `api/remix-image`, `api/media/ai/*`, `api/media/title-suggest`)
- [ ] Render- und Video-Pipeline abschalten (`api/media/render*`, `api/media/transcode`, `api/video/*`, `api/worker/render`)
- [ ] Creator-, Feed- und Publishing-Endpunkte abschalten (`api/creator/*`, `api/sessions/*`, `api/feed/*`, `api/publish/*`, `api/cron/publish-scheduled-posts`)
- [ ] Content-Endpunkte abschalten (`api/blog/posts`, `api/content-type`, `api/inspiration`)
- [ ] Infrastruktur-Automatisierung abschalten (`api/admin/infomaniak/*`, `api/admin/copilot/*`, `api/admin/dns/*`, `api/admin/cron/dns`)
- [ ] **Cron-Jobs in `vercel.json` entfernen** – sie rufen in Production weiterhin ausschließlich Alt-Endpunkte auf: `/api/cron/publish-scheduled-posts` alle 10 Minuten, `/api/copilot/auto` täglich um 06:00 (kostenpflichtiger Modellaufruf) sowie `/api/admin/cron/dns` zweimal täglich
- [ ] Abhängigkeiten prüfen, damit die V2-Oberflächen unberührt bleiben
- [ ] Auswirkungen dokumentieren

Behalten: `app/auth/refresh`, `api/search/airports`, `api/admin/payments/*`, `api/admin/security/*`, `api/admin/storage/ensure`, `api/uploads/signed-url`, `api/utils/gravatar` (Prüfung im Zuge der Umsetzung).

### 1.2 shadcn-Tokens auf die V2-Farbwelt umstellen · freigegeben

- [ ] `--primary`, `--accent`, `--secondary`, `--ring`, `--border`, `--input` auf V2-Farben setzen
- [ ] tote Tokens mit Blauanteil entfernen (`--jet-hero`, `--jet-btn`, zugehörige Utilities)
- [ ] `DESIGN_SYSTEM.md` aktualisieren

Die Production-Prüfung hat ergeben, welche V2-Oberflächen konkret betroffen sind. Diese vier Dateien nutzen noch die blau/violetten shadcn-Tokens und werden mit diesem Schritt bereinigt:

| Datei | Wirkung |
| --- | --- |
| `components/layout/SkipToContentLink.tsx` | erscheint bei Tastaturfokus auf **jeder** V2-Seite blau |
| `app/(public)/error.tsx` | Buttons und Hover-Flächen blau/violett |
| `app/(public)/not-found.tsx` | Buttons und Fokus-Ring blau |
| `components/trips/MiniTripSlider.tsx` | Akzentflächen blau |

Der Skip-Link ist der einzige Blau-Eintrag, der die regulären V2-Seiten erreicht. Er ist bis zum Tastaturfokus unsichtbar, aber für Tastaturnutzer sichtbar und damit vorrangig.

### 1.3 Auth, Rollen und Middleware vereinheitlichen

- [ ] einheitliches Rollen- und Berechtigungsmodell
- [ ] Admin-Prüfung zentralisieren statt pro Route
- [ ] Middleware-Schutz über alle geschützten Bereiche statt nur `/creator/creator-dashboard`
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
- [ ] responsive Prüfung und Browser-Kompatibilität

---

## Blockiert

| Thema | blockiert durch |
| --- | --- |
| Phase 2 (Trip-Persistenz) | Datenbank-Baseline und Trip-Schema (1.4, 1.5) |
| RLS-Tests | fehlende versionierte RLS-Definitionen (1.4) |
| Aussagen zur DB-Sicherheit | Schema ist aus dem Repository nicht nachvollziehbar (1.4) |

---

## Wartet auf Freigabe

- **Anzahl Gastreisen.** Empfehlung: Gastmodus auf eine aktive Reise begrenzen, damit „mehrere Reisen" ein echter Kontonutzen ist. Aktuell 20. Siehe [DECISIONS.md](DECISIONS.md), Offene Widersprüche Punkt 1.

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
