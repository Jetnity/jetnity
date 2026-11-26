# Premium-Redesign PR A – Lizenz-Gate der Bilder: Referenzliste (26.11.2026)

Stand: Draft #1320, Branch `feat/workspace-premium-redesign-a`. Ausgang der Korrektur `d122179f5`.

## Gesperrte Dateien

Für diese fünf Dateien gibt es im Repository keinen belegten Lizenznachweis (weder in `public/images/organisieren/Bildnachweise.txt` noch in `lib/trips/organisieren/bildnachweise.ts`):

| Datei | Früher gezeigt als |
|---|---|
| `public/images/hero-bali.png` | Foto der Startseite, Open Graph, Twitter, JSON-LD |
| `public/images/bali.jpg` | Inspirationskarte «Bali» (Startseite, Entdecken, CMS-Rückfall) |
| `public/images/lisbon.jpg` | Inspirationskarte «Lissabon» |
| `public/images/zermatt.jpg` | Inspirationskarte «Zermatt» |
| `public/images/amsterdam.jpg` | Inspirationskarte «Amsterdam» |

Die Dateien bleiben im Repository (keine Löschung ohne Entscheidung des Product Owners), weil CMS- und Datenbankzeilen ihre Pfade als Identität tragen und die Daten unverändert bleiben.

## Was jetzt gezeigt wird

- Startseite, Open Graph, Twitter und JSON-LD: `lib/seo/startseitenbild.ts` führt auf das geklärte Bild `organisieren/nusa-penida.webp` (Nachweis vorhanden, 800 × 450 px).
- Lissabon, Zermatt, Amsterdam: ein bereits geklärtes Bild derselben Stadt aus demselben Katalog (`lisbon-commons.jpg`, `zermatt-commons.jpg`, `amsterdam-commons.jpg`). Der Ersatz bindet eine Datei an eine Datei (`lib/inspiration/bildfreigabe.ts`).
- Bali: kein geklärtes Bali-Bild vorhanden. Die Karte zeigt das neutrale Kartenmotiv (`reiseatlas.webp`) ohne Bildtext, der den Ort behauptet.
- Jede gezeigte Fotokarte trägt ihren sichtbaren Bildnachweis; die Liste «Bildnachweise» bleibt vollständig.

## Zermatt: zwei Kennungen, nicht gleichgesetzt

| Kennung | Wo | Befund (öffentliche GeoNames-Seite, nur gelesen) |
|---|---|---|
| `geonames:2657915` | Reiseidee «Zermatt» in `lib/places/inspiration.ts`, CMS-/DB-Seeds, `lib/inspiration/explorer-1/katalog.ts` | GeoNames führt darunter «Zofingen, Switzerland» |
| `geonames:2657928` | Bildkatalog `lib/trips/organisieren/reisebilder.ts` (Zermatt) | GeoNames führt darunter «Zermatt, Switzerland» |

Die lokale Testdatei `lib/places/fixtures/geonames.tsv` nennt `2657915` ebenfalls «Zermatt» und weicht damit von GeoNames ab. Die Reiseidee behält ihre Kennung (CMS- und Datenbankdaten unverändert, Seeds und Tests pinnen sie); der Bildersatz hängt nicht an einer Orts-Kennung. **Offen, PO/Technical Lead:** die Kennung der Reiseidee «Zermatt» ist vermutlich falsch (`2657915` ist Zofingen). Eine Korrektur berührt CMS-Zeilen, Migrations-Seeds und Tests und ist hier bewusst nicht erfolgt.

## Alle Fundstellen im Repository

Gesucht über das ganze Repository nach `hero-bali.png`, `bali.jpg`, `lisbon.jpg`, `zermatt.jpg`, `amsterdam.jpg` (ohne `node_modules`, `.next`, Bilder, `package-lock.json`).

**Aktive Anzeige- und Metadatenpfade (öffentlich): alle über die Freigabe, kein Rohwert wird angezeigt.**

| Fundstelle | Rolle |
|---|---|
| `lib/places/inspiration.ts` | statische Quelle der Reiseideen (CMS-Identität); wird von `lib/inspiration/cms-public.ts` als Rückfall gelesen |
| `components/home/HomeInspiration.tsx`, `components/inspiration/explorer-1/Inspirationskarte.tsx` | zeigen `inspirationsbild(ziel.image).src`, nie den Rohwert |
| `app/(public)/page.tsx`, `app/(public)/entdecken/page.tsx` | Bildnachweise der gezeigten Karten |
| `lib/seo/startseitenbild.ts`, `app/layout.tsx`, `app/(public)/layout.tsx`, `lib/seo/final-homepage.ts` | Open Graph, Twitter, JSON-LD, Hero |
| `lib/inspiration/bildfreigabe.ts` | die Freigabe selbst (nennt die gesperrten Dateien als Schlüssel des Ersatzes) |

**Aktiver Pfad ausserhalb des Auftrags, nicht geändert:**

| Fundstelle | Befund |
|---|---|
| `components/admin/content/ContentInventory.tsx` | Admin-Inhaltsübersicht, nur nach Anmeldung als Admin: der Link «Katalogbild öffnen» öffnet den Rohpfad (`entry.image`) im neuen Tab. Wird dort nicht eingebettet. `lib/admin/analytics/browser.test.ts` pinnt den Link (`/images/bali.jpg`). Eine Änderung braucht eine Entscheidung (Test, Admin-Scope); **Empfehlung:** Link auf das Ergebnis der Freigabe umstellen oder entfernen. |

**Daten, Seeds, Fixtures (Identität, unverändert):** `scripts/db/admin-editorial-cms-1/schema-candidate.sql`, `scripts/db/admin-runtime-bg1-1/provider-migration-body.sql`, `scripts/db/admin-runtime-production-1/provider-migration-body.sql` (Katalogzeilen), `scripts/admin-cms-editor-2/fixtures.ts`.

**Tests (pinnen das Verhalten der Freigabe oder die Identität):** `lib/inspiration/bildfreigabe.test.ts`, `lib/inspiration/cms-public.test.ts`, `lib/trips/organisieren/bildnachweise.test.ts`, `lib/seo/final-homepage.test.ts`, `lib/admin/analytics/browser.test.ts`.

**Prüfskript:** `scripts/premium-redesign-a/bildlizenz.mjs` (Netzwerk, DOM, Metadaten, JSON-LD, Roh-HTML, Chromium und WebKit, 390 und 1440 px, hell und dunkel).

**Historisch (Audit-Skripte und Dokumente, nicht aktiv):** `scripts/final-homepage-premium-experience-2-audit.mjs` (als historisch gekennzeichnet), `docs/NEXT_16_3_8_SECURITY_UPGRADE_1_REPORT_2026-09-30.md`, `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md`, `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`, `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`, `docs/evidence/**` (Messprotokolle früherer Läufe, unveränderlich).

## Seitenpayload

Die Entdecken-Seite liefert die CMS-Identität der Reiseideen im Seitenpayload (Rohpfad `/images/bali.jpg` usw.). Diese Pfade werden weder angefragt noch angezeigt (`bildlizenz.mjs` beweist es im Netzwerk und im DOM); sie sind aber im Roh-HTML des Servers lesbar. Wer auch das ausschliessen will, muss die Identität im Payload ersetzen; das berührt CMS-Daten und ist nicht Teil von PR A.

## Empfehlung

Wenn Jetnity Bali, ein eigenes Hero-Foto und weitere Ziele zeigen soll: Lizenznachweis für diese Dateien beschaffen (Urheber, Quelle, Lizenz) und in `Bildnachweise.txt` und den Katalog eintragen. Erst dann kann die Freigabe die Dateien wieder durchlassen. Das Hero-Bild der Startseite hat 800 × 450 px und wirkt auf grossen Bildschirmen weicher als das frühere Foto; ein lizenziertes Hero-Foto in höherer Auflösung ist die eigentliche Lösung (Product-Owner-Entscheid, evtl. Kosten).
