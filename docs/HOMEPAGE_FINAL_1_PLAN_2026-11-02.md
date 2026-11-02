# Homepage Final 1 — Umsetzungsplan

02.11.2026. Basis: `537a097952641d82f7ce21b6021350330690e86b` plus Task-Auftrag.

Die Startseite wird ein fertiger Kundenauftritt: bestehende Marken-H1 und Bali-Bild,
präzise Reiseplaner-Definition, fünf zusammengehörende Reisebereiche, konkrete
Portugal-Beispielreise, drei Schritte, Vorteile, Inspiration, kompakter Trust/FAQ
und echter Planungseinstieg. Die sichtbare Entwicklungs-/Statusmatrix entfällt
gemäß aktuellem Owner-Auftrag; erfundene Angebote, Buchungen und Belege bleiben ausgeschlossen.

Betroffen sind Homepage-Komponenten, zentrale Inhalts-/SEO-Daten, öffentliche
Header-/Footer-Linkziele, ein statisches Share-Bild und die zugehörigen Audits.
Der bestehende Einstieg behält Place-Bestätigung, Gastfortsetzung und alle Handler.
Session, Auth, APIs, Datenbank, Provider, Trip-Graph und Indexing-Gates ändern sich nicht.
Keine Migration, keine neue Abhängigkeit, keine neuen laufenden Kosten.

Risiken sind Layoutbruch bei schmalen Geräten/200%-Schrift, unpassende Metadaten,
überzogene Produktversprechen sowie alte Tests auf bewusst ersetzte Texte.
Prüfung: fokussierte SEO-/Navigation-/Place-/Gast-Tests; bestehende lokale
Browserfixture mit 320/360/390/768/1024/1440px, 200%-Schrift, Fokus, Mobilmenü,
FAQ, echter Eingabe und ausschließlich lokalen Testantworten; visuelle Screenshots.
Danach TypeScript, Lint, fünf Hygienechecks und Production-Build.

Review: Vercel React Best Practices für statische Server-Komponenten,
Bildgrößen/Loading, geringe Clientlast, native Details und zugängliche Bedienelemente.
Anschließend eigener Evidence-Bericht, lokaler Commit, unabhängiger Root-Review.
Kein Push, Ready, Merge oder Folge-Slice durch den Builder.
