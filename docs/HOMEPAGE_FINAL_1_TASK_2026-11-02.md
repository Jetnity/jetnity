# Homepage Final 1 — Auftrag

02.11.2026. Owner verlangt jetzt die finale, hochwertige Kunden-Startseite,
aufbauend auf dem vorhandenen Plan; keine Entwicklungsübersicht. Google- und
KI-Auffindbarkeit, klare Vorteile und moderne Gestaltung haben Priorität.
Die Umsetzung soll jetzt erfolgen, auch bevor alle Zielbild-Funktionen fertig sind.
Dieser aktuelle Auftrag ersetzt das historische Timing-Gate der Homepage-Policy
und die Pflicht zur sichtbaren vollständigen Capability-/Statusmatrix.
Er verlangt keine erfundenen Preise, Bewertungen oder Buchungsbestätigungen.

## Baseline und Arbeitsweise

- Main live: `537a097952641d82f7ce21b6021350330690e86b`; Modus NORMAL.
- Branch: `codex/homepage-final-20261102`; Worktree `work/jetnity-homepage`.
- Vorarbeit: Spec vom 30.09., Positioning-Policy, AI/Search-Standard,
  Marketing-Standard, Vision, Architektur, Roadmap, Design und relevante Tests.
- Geeignet: ein Code-Writer `homepage_final_1`, unabhängiger Root/TL-Review.
  Lokaler Codex-Agent; keine behauptete Cursor-/Guardian-Integration.
- Keine konkurrierende offene Homepage-PR im Live-Precheck. Vor Merge erneut prüfen.
- Wichtig: Origin hat eingeschränkten Fetch-Refspec. Main ausdrücklich mit
  `refs/heads/main:refs/remotes/origin/main` aktualisieren; nicht alte origin/main nutzen.

## Ziel und Akzeptanz

1. Innerhalb weniger Sekunden verständlich: Jetnity ist ein Reiseplaner und
   Reisebegleiter, bündelt Route, Tagesplan und Organisation an einem Ort.
2. Prägnante positive Kundensprache. Kein Entwickler-/Statusbericht, keine
   Kennzeichenwand und keine internen Begriffe wie synthetisch oder Anbieterwahrheit.
3. Hochwertige mobile-first Komposition in bestehender Weiß/Mint/Dunkelgrün/Lime-Marke.
   Bewährtes Hero-Reisebild, starke Typografie, sinnvolle kürzere Abschnittsfolge,
   anschaulicher Reiseplan als klar benanntes Beispiel, passende Inspiration.
4. Klarer echter Planungseinstieg. Bestehende Ortsbestätigung, Gastfortsetzung,
   Session-/Abmeldehandler und neu akzeptierter Workspace bleiben funktionsgleich.
5. Produktvorteile + 3 Schritte + Reisebeispiel + Inspiration + kompakter Trust/
   FAQ + Abschluss-CTA. Keine Fake-Angebote, Preise, Nutzungszahlen oder Testimonials.
   Zukunftsrichtung darf erzählt werden, aber keine fehlende konkrete Leistung als
   sofort nutzbare Aktion versprechen. Buchung beim jeweiligen Anbieter klar erklären.
6. Google/AI: sichtbare präzise Definition; hilfreiche Fragen/Antworten; statisches
   wesentl. HTML; 1 H1; H2/H3; beschreibender Titel/Meta; kanonische URL;
   aussagekräftiges Share-Bild; konsistente Organization/WebSite/WebApplication-
   Entity-Daten (nur passende Typen, keine erfundenen sameAs/ratings/offers).
   Keine Rankings garantieren, keine Keyword-Wände oder neuen Doorway-Seiten.
7. 320/360/390/768/1024/1440px sowie 200%-Schrift: kein Seitenoverflow;
   Touchziele >=44px, sichtbarer Fokus, Reduced Motion, sinnvolle Bildgrößen.
8. Header/Footer müssen auf reale Ziele führen. Veralteten Pro-Statusanker im
   Homepage-Kontext durch kundenrelevante echte Abschnitte ersetzen. Auth-Logik bleibt.

## Umfang und Grenzen

Writer besitzt `app/(public)/page.tsx`, `components/home/**`, relevante
Homepage-Styles, `lib/seo/final-homepage*`, öffentliche Navigation/Footer nur für
Darstellung/Linkziele, ergänzende Share-Bild-Datei/Route, relevante Homepage-Tests
und eigene Evidence-/Plan-Dokumentation sowie gezielte Einträge in ARCHITECTURE,
DECISIONS, DESIGN_SYSTEM, ROADMAP und der alten Homepage-Spec als aktueller Nachtrag.
`StartzielForm` nur Kundenhinweistext, keine Handler-/Orts-/Gastlogik ändern.
Keine DB/Migration, API, Auth/RLS, Provider-/Payment-/Trackingaktivierung,
Abhängigkeit oder neue laufende Kosten. Keine Workspace-/Admin-Stile ändern.

Live-Read: `/` enthält noindex/nofollow; robots.txt Disallow:/; Sitemap leer.
SEO-Vorbereitung ist beauftragt. Globale Indexing-/Launch-Freigabe ist nach
Operating Standard §3 separat reserviert. **Writer ändert keine Indexing-Gates
oder ENV.** Root klärt die konkrete Freigabe erst am fertigen reviewbaren Ergebnis.

## Evidence und Abschluss

- Kundenpfad/CTA, responsive Screenshots, Keyboard/Mobil, HTML/Meta/JSON-LD prüfen.
- Bestehende Tests dort aktualisieren, wo der Owner bewusst Texte/Struktur ersetzt;
  echte Place-/Guest-/Private-Indexing-Verträge nicht abschwächen.
- npm ci, Typen, Lint, alle fünf Hygieneprüfungen, Production-Build;
  fokussierte Regression lokal, vollständige CI und Vercel am finalen Head.
- Root liest gesamten Diff, prüft unabhängig Darstellung/SEO/Flow und entscheidet.
- Post-Merge exakte Main-CI/Production/öffentliche Domain prüfen, Bericht aktualisieren.
- Handoff mit Exact SHA, Dateien, Belegen, Grenzen und Restpunkten; keine Secrets/PII.

STOP nach Umsetzung, lokalem Self-Review und Commit für Root/TL.
**do not mark Ready; do not merge; do not start a follow-up slice.**
