# Homepage Final 1 — Builder-Nachweis

02.11.2026. Agent: `homepage_final_1`, lokaler Codex-Builder. Kein behaupteter
Cursor-/Guardian-Review. Root/TL prüft unabhängig und entscheidet über Release.

## Umfang

Baseline `537a097952641d82f7ce21b6021350330690e86b`, Auftrag
`10fd64e6e53add35cd50575739d7f4e5c3767e7c`, Draft PR #1107,
Branch `codex/homepage-final-20261102`.

Die Homepage präsentiert Jetnity als Reiseplaner/Reisebegleiter: bestehende
Marken-H1, präzise Definition, Bali-Hero auch mobil, fünf Reisebereiche,
Portugal-Beispielreise mit Route und Tagesplan, drei Schritte, Vorteile,
Inspiration, kompakte Vertrauenspunkte, sechs native FAQ und Abschluss-CTA.
Die alte Entwicklungs-/Statusmatrix samt Disclosure-Inline-Script ist entfernt.
Das Beispiel enthält keine Angebote, Preise, Buchungen oder erfundene Belege.
Die FAQ erläutert die Buchung beim jeweiligen Anbieter und den Browser-Gastentwurf.

Öffentliche Links führen zu Ablauf/FAQ; der alte `#pro`-Anker bleibt als
kompatibles FAQ-Ziel erhalten. Öffentliche Header-/Footer-Links behalten >=44px
Trefferhöhe auch bei Mausbedienung. Formular und dessen Place-/Gast-/Session-
Handler bleiben unverändert. Der 200%-Überlauf des bisherigen langen
Inspirationslinks ist durch einen begrenzten, umbrechenden Link „Mehr Reiseideen“
behoben; keine globale Overflow-Maskierung.

SEO: beschreibender Titel, passende Description, Canonical, konsistente
Organization/WebSite/SoftwareApplication-Daten mit derselben sichtbaren
Definition und korrekten absoluten Asset-URLs. Statisches Share-Bild 1200×630,
ca. 476 KiB, lokal aus vorhandenem Original-Logo und Bali-Asset komponiert.
Keine neue Bildquelle, keine Modell-/Providerkosten. Native FAQ und Haupttexte
sind Server-HTML; kein zusätzlicher Client-Bundle für die Produktstory.
Sitemap-`lastModified` entfällt ohne belegtes Aktualisierungsdatum.

## Prüfungen

- `npm ci`: PASS; bestehende npm-Audit-Meldung 24 Schwachstellen (17 moderate,
  7 high). Keine Abhängigkeitsänderung oder pauschales `audit fix`.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS, 0 Fehler / 192 vorhandene Warnungen. Kein neues
  Warnsignal in den geänderten Homepage-Dateien.
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`,
  `check:schema-bezug`: alle PASS. 0 verwaiste Module/Exports; unveränderte
  dokumentierte LOCAL/UNAPPLIED-RPC-Hinweise sind keine Produktionsfreigabe.
- Production-Build: PASS, Homepage statisch vorgerendert. Build-Log unten.
- 198 fokussierte Tests: PASS (SEO/Entity, private Indexing-Grenze,
  öffentlicher Origin, Session-Navigation, Gast-CTA/Gastspeicher,
  Route-Einstieg, natürliche Mehrziel-Eingabe und Route-Intent).
- Bestehende White/Mint-Browser-Suite erweitert: 12 Tests PASS, einschließlich
  Workspace-Hover/Fokus/Theme/Portal-Regressionsprüfungen und negativen
  Admin-/Provider-Farbkontrollen. Kein persönliches Chrome-Profil.
- Homepage separat: 320/360/390/768/1024/1440px, FAQ per Enter öffnen/schließen,
  Mobilmenü und Escape-Fokus, sichtbarer berechneter Input-Fokus, 320/1440px
  bei 200%-Root-Schrift. Überlauf jeweils 0px. Erste primäre CTA jeweils
  48px hoch und vollständig im ersten 900px-Viewport (Unterkante 440–581px).
- Beide historischen Homepage-Audit-Einstiege führen den aktuellen Vertrag aus:
  statisch PASS. Alte Statusmatrix-Assertions sind bewusst durch Kundenstory,
  reale Handoffs, Entity-/Bild-/FAQ- und unveränderte Indexing-Verträge ersetzt.
  Der optionale Browserteil ist ausschließlich auf Loopback beschränkt.
- `git diff --check`: PASS.

## Visuelle und Browser-Evidence

Lokaler Ordner (nicht als Produktionsprüfung ausgeben):
`outputs/jetnity-homepage-builder-2026-11-02/` im übergeordneten Workspace.

- `final-homepage-{320,360,390,768,1024,1440}.png`: erster Viewport.
- `final-homepage-{320,360,390,768,1024,1440}-full.png`: ganze Seite.
- `final-homepage-{320,1440}-200-full.png`: vergrößerte Schrift.
- `after-homepage-1440-full.png`: Gesamtkomposition; unter dem echten Footer
  sind ausschließlich in dieser Fixture die Admin-/Provider-Negativkontrollen.
- `computed-colors.json`: berechnete Größen/Farben und FAQ-/Fokus-Messungen.
- `browser-tests.log`, `homepage-responsive.log`, `focused-tests.log`,
  `lint.log`, `build.log`: lokale Prüfprotokolle.
- `public/images/jetnity-reiseplaner-share.png`: finales Share-Bild im Repository.

Visuell geprüft: Hero/Desktop, 320/390/1024px, Gesamtkomposition, Reisebeispiel
und Share-Bild. Ein zunächst entdeckter Foto-Text-Kontrast wurde durch eine
ruhige dunkle Caption-Fläche korrigiert. Die erste 200%-Prüfung zeigte den
langen Inspirationslink als konkreten Verursacher; nach begrenztem Link und
kürzerer Beschriftung ist die absolute Overflow-Prüfung grün.
Der bestehende sichtbare Input-Fokus kommt aus `white-mint.css`; die Prüfung
misst den berechneten Stil statt allein die `outline-none`-Utility zu deuten.

## Separater Root-Nachweis

Root meldet am finalen Produktionsbuild 67 unabhängige Prüfungen PASS, keine
Browserfehler, sechs Breiten, Mobilmenü-Anker, FAQ-Tastatur, 200%-Darstellung,
Server-HTML/Metadaten/absolute Assets/JSON-LD. Der echte Planungseinstieg fängt
ein leeres Ziel ab und übergibt die bestätigte Lissabon-ID korrekt an `/planen`.
Die Anfrage wurde im isolierten Browser abgefangen; keine DB-/Provideraufrufe.
Zusätzlich 50 Index-Grenztests PASS. Diese Ergebnisse stammen vom Root-Reviewer,
nicht aus der Builder-Eigenprüfung.

Separater Evidence-Ordner im übergeordneten Workspace:
`outputs/jetnity-homepage-review-2026-11-02/` mit `actual-app-audit.json`,
`actual-app-audit.log`, `index-boundary.log` und `next-*.png`.

## Self-Review und Grenzen

Die Vercel-React-Checkliste wurde auf alle bearbeiteten Komponenten angewendet:
Server-Komponenten bleiben statisch, keine neuen Effects/Fetches, native Details,
vorhandene Bildassets mit passenden Größenangaben, Hero priorisiert,
Fokus-/Touchziele geprüft, vorhandene Reduced-Motion-Regeln bleiben.

Keine DB-/API-/Auth-/RLS-/Provider-/Payment-/Trackingänderung, kein neuer Secret,
keine Migration, keine neue laufende Infrastruktur, keine Workspace-Umgestaltung.
Kein Providerkontakt oder persönlicher Browserzugriff aus den lokalen Tests.
Reale Geräte wurden in diesem Builder-Lauf nicht geprüft. Der echte Next.js-
Render-/SEO-/Orts-Handoff wurde separat von Root geprüft; dessen Bericht ist
keine Builder-Eigenprüfung. Hosted-CI/Vercel und Post-Merge bleiben Root-Aufgabe.

**Indexing/Launch bleibt bewusst unverändert geschlossen:** Diese Umsetzung
bereitet SEO vor, aktiviert aber weder öffentliche Indexierung noch robots/
Sitemap-Gates oder ENV. Eine Freigabe liegt allein beim Owner/Root-Prozess.
Keine Rankings, Google-Aufnahme oder KI-Nennung werden garantiert.

Dokumentation: Task, Plan, dieser Nachweis, datierter Spec-Nachtrag,
ARCHITECTURE, DECISIONS, DESIGN_SYSTEM und ROADMAP. Der Produkt-Nordstern
ändert sich nicht; keine neue Vision oder Folgeaufgabe.

STOP: lokaler Commit und Übergabe an Root. Kein Push, Ready, Merge oder Folge-Slice.
