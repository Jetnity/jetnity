# Premium-Redesign PR A – Herkunft und Gate der KI-Illustrationen: Referenzliste (26.11.2026)

Stand: Draft #1320, Branch `feat/workspace-premium-redesign-a`. **Dritte Fassung (27.11.2026)** nach den letzten PO-Korrekturen und dem Exact-Head-Nachreview des Technical Leads (PR-Kommentar 7207422459): Zermatt-Planungskennung `2657928`, abgeleitetes Vorschaubild 1200 × 630 unter 300 KB, PNG-Dateien mit richtiger Endung (ADR-0250, Fortschreibung 27.11.2026). Die zweite Fassung (PR-Kommentar 7204725750) hatte die Herkunft dokumentiert und vier Dateien freigegeben; die erste Fassung hatte fünf Dateien vorläufig gesperrt (ADR-0249). Hinweis des PO: Die KI-Illustrationen werden nach PR A durch Unsplash-Fotos ersetzt (eigener PR); deshalb kein zusätzlicher Aufwand an den Bildern ausser den drei Korrekturen.

## Was die fünf Dateien sind

`hero-bali.png`, `bali.png`, `lisbon.png`, `zermatt.png` und `amsterdam.png` (bis 26.11.2026 `bali.jpg`, `lisbon.jpg`, `zermatt.jpg`, `amsterdam.jpg`, siehe «Endung») sind **KI-Illustrationen, keine Fotos**. Sie zeigen keine echte Aufnahme des genannten Ortes. Das Medium `ki-illustration` ist im Katalog (`lib/trips/organisieren/bildnachweise.ts`) vom Medium `foto` getrennt und wird überall so benannt.

Herkunft (Erklärung des Product Owners vom 26.11.2026): **KI-generiert (ChatGPT/OpenAI), Eigentum Jetnity/Sasa Feirov (PO-Erklärung 26.11.2026)**. Einzige Quelle dieser Angabe ist die PO-Erklärung. Nicht erfasst und nicht erfunden: Prompts, Generierungs-Kennungen, Original-Adressen. Es gilt keine Creative-Commons-Lizenz, und es wird keine Urheberrechtsgarantie behauptet.

| Datei | Ersteintrag im Repository | Commit | SHA-256 | Einsatz |
|---|---|---|---|---|
| `public/images/hero-bali.png` | 19.07.2025 | `6f59d83eec1453892139eb2eab3e238223487a25` | `0d8aa860…ee45` | Hero der Startseite, Open Graph, Twitter, JSON-LD |
| `public/images/bali.png` (früher `bali.jpg`) | 02.09.2025 | `265887dd8a5dbdaf450eb14eec6b84f987568e6f` | `86acf2c0…0f07` | Reiseidee Bali (Startseite, Entdecken) |
| `public/images/lisbon.png` (früher `lisbon.jpg`) | 02.09.2025 | `265887dd8a5dbdaf450eb14eec6b84f987568e6f` | `e8f4f66b…70c3` | Reiseidee Lissabon |
| `public/images/amsterdam.png` (früher `amsterdam.jpg`) | 02.09.2025 | `265887dd8a5dbdaf450eb14eec6b84f987568e6f` | `02462fc4…b122` | Reiseidee Amsterdam |
| `public/images/zermatt.png` (früher `zermatt.jpg`) | 02.09.2025 | `265887dd8a5dbdaf450eb14eec6b84f987568e6f` | `0720951b…92bc` | **nirgends** (siehe Zermatt) |
| `public/images/hero-bali-og.jpg` (abgeleitet) | 27.11.2026 (Ableitung) | – | `589ad9de…5ac7` | nur Open Graph, Twitter, JSON-LD; nie im sichtbaren Bild |

«Ersteintrag» ist der Tag, an dem die Datei erstmals ins Git-Repository eingecheckt wurde. Es ist **kein verifiziertes Erstellungsdatum**. Die fünf Originale sind seit ihrem Ersteintrag byteidentisch (die Umbenennung am 27.11.2026 änderte nur den Namen; `git log --follow` zeigt den Verlauf). Die vollständigen Prüfsummen stehen in `public/images/organisieren/Bildnachweise.txt` und im Katalog.

**Das Vorschaubild `hero-bali-og.jpg` ist abgeleitet, kein neues Original.** Quelle: `hero-bali.png` (2382129 Bytes, 1536 × 1024, SHA-256 `0d8aa860…ee45`, unverändert). Lokal erzeugt mit `scripts/premium-redesign-a/og-bild.mjs` (sharp, Ausschnitt 1536 × 806 ab Zeile 100, Skalierung auf 1200 × 630, mozjpeg, höchste Güte unter 270000 Bytes) mit dem eingebrannten, dezenten Hinweis «KI-Illustration». Ergebnis: JPEG 1200 × 630, 258726 Bytes (unter 300000), SHA-256 `589ad9def90ed883…65ac7`, ohne EXIF und ohne C2PA-Manifest. Es ist **nicht unabhängig C2PA-verifiziert** und wird nicht als neues Original ausgegeben. Medium und Herkunft sind die der Quelle (KI-Illustration, PO-Erklärung 26.11.2026); die Bearbeitung (Zuschnitt, Skalierung, Hinweis, Neukodierung) steht im Katalog (`KI_VORSCHAUBILD`), in `Bildnachweise.txt` und auf `/datenquellen#ki-illustrationen`. Keine neue Bildgenerierung, kein Provider, keine Kosten.

**Endung (27.11.2026 korrigiert):** `bali`, `lisbon`, `zermatt` und `amsterdam` waren PNG-Daten unter einer `.jpg`-Endung (Browser zeigten sie korrekt, jede Prüfung des Inhaltstyps hätte gelogen). Sie sind **byteidentisch** zu `.png` umbenannt: kein Neukodieren, SHA-256 und eingebettete Herkunft unverändert, Git-Verlauf erhalten (`git mv`). Die alten Originaldateien werden nicht zerstört (Verlauf, Prüfsumme). Der alte Pfad bleibt als **CMS-Identität** gültig (`INSPIRATION_ZIELE.image`, CMS-Fixtures und Seeds tragen ihn, der Pfad gehört zur persistierten Referenz). Eine exakt begrenzte Zuordnung (`LEGACY_BILDPFADE` in `lib/trips/organisieren/bildnachweise.ts`, genau diese vier Einträge, aus dem Feld `fruehererPfad` abgeleitet) bildet nur im Freigabe-Gate (`inspirationsbild()`) und im Admin-Link den alten auf den neuen Pfad ab; unbekannte oder fremde Pfade bleiben neutral, es gibt keine allgemeine Adress-Zuordnung. Test und Abnahme lesen den Dateikopf (PNG-IHDR, JPEG-SOF) und vergleichen ihn mit Endung und Inhaltstyp; die Prüfung läuft über ganz `public/` (kein Bild mit falscher Endung).

## Bedingungen von OpenAI

Abschnitt «Ownership of content». Die Bedingungen regeln das Verhältnis zu OpenAI, nicht gegenüber Dritten.

- Archivfassung vom 11.12.2024: https://openai.com/policies/dec-2024-eu-terms/
- Aktuelle Fassung (Stand 16.01.2026): https://openai.com/policies/eu-terms-of-use/

Danach gehört der Output im Verhältnis zu OpenAI und soweit gesetzlich zulässig der nutzenden Person; Ausgaben können anderen Nutzern ähnlich sein. Eine Garantie für exklusive Rechte oder für die Freiheit von Rechten Dritter folgt daraus nicht.

## Was nicht unabhängig belegt ist

- **Binärherkunft:** Alle fünf Dateien enthalten ein eingebettetes C2PA-Manifest (Claim-Generator ChatGPT, signiert «Truepic Lens CLI in ChatGPT», Aussteller OpenAI). Die Dateiprüfsumme im Manifest stimmt (`assertion.dataHash.match`), die Rohdaten nennen `c2pa.created` und `trainedAlgorithmicMedia`. Die Prüfung mit c2pa-python 0.39.0 ergibt aber insgesamt **«ungültig»**: `signingCredential.untrusted`, `signingCredential.expired` und `assertion.action.malformed` (die Bibliothek wertet die Aktionsangabe als fehlerhaft). Das Manifest ist deshalb nur ein schwacher Hinweis; es ersetzt weder die PO-Erklärung noch einen Rechtsnachweis.
- **EXIF und Dateimetadaten:** nicht als Beleg gewertet.
- **Rechte Dritter:** KI-Ausgaben können Dritten ähnlich sein; das Repository belegt dazu nichts.

## Wie das Gate jetzt arbeitet

- **Explizite Allowlist einzeln belegter Dateien:** `FREIGEGEBENE_ILLUSTRATIONEN` (`hero-bali.png`, `bali.png`, `lisbon.png`, `amsterdam.png` und für Metadaten das Vorschaubild `hero-bali-og.jpg`) in `lib/trips/organisieren/bildnachweise.ts`. Alles andere, auch eine unbekannte oder fremde Datei, bleibt neutral (`NEUTRALES_REISEBILD`, `reiseatlas.webp`, kein Ortsanspruch). `ZURUECKGEHALTENE_ILLUSTRATIONEN` führt `zermatt.png` mit Grund; die Ortskennung ist korrigiert, die Illustration wird aber auf Vorgabe von PO und TL in PR A nicht automatisch freigegeben.
- **Herkunft an vier Stellen:** `public/images/organisieren/Bildnachweise.txt` (Abschnitt «KI-Illustrationen»), der typisierte Katalog (`KI_ILLUSTRATIONEN`), die zentrale Seite `/datenquellen#ki-illustrationen` und der Nachweis am Bild (`BildnachweisKnopf` und `Bildnachweisliste`, ohne doppelte lange Zeilen).
- **Kennzeichnung am Bild:** Jede freigegebene Karte und der Hero tragen den sichtbaren, dezenten Hinweis «KI-Illustration» (`components/ui/IllustrationsHinweis.tsx`, im Hero `.hs-ort-hinweis`). Der Alt-Text beginnt mit «KI-Illustration:» und nennt das Motiv, nicht einen Ort als fotografiert.
- **Metadaten:** `lib/seo/startseitenbild.ts` führt zwei getrennte Datensätze: `STARTSEITENBILD` (sichtbares Hero, Original `hero-bali.png`) und `TEILENBILD` (`hero-bali-og.jpg`, Open Graph, Twitter, JSON-LD). Alle drei Metadatenstellen nennen dieselbe absolute kanonische Adresse (`https://jetnity.com/images/hero-bali-og.jpg`), `og:image:type image/jpeg`, 1200 × 630 und den wahren Alt-Text. `og:image:alt` und `twitter:image:alt` benennen die Illustration; JSON-LD trägt ein `ImageObject` mit `encodingFormat`, Breite, Höhe, `caption` (Illustration) und `creditText` (Herkunft). Es wird kein Ortsfoto behauptet.
- **Echte Abmessungen:** Test und Abnahme lesen die tatsächlichen Pixelmasse, das Format und das Gewicht der ausgelieferten Datei (Vorschaubild 1200 × 630, JPEG, 258726 Bytes; Hero 1536 × 1024, PNG) und vergleichen sie mit den angegebenen Werten und dem Inhaltstyp.

## Zermatt: Kennung korrigiert, Illustration bleibt neutral

GeoNames (Primärquelle): `2657915` = Zofingen (AG, CH, PPLA2), `2657928` = Zermatt (VS, CH, PPL).

| Feld | Wert für Zermatt | Rolle |
|---|---|---|
| `zielId` (`lib/places/inspiration.ts`) | `geonames:2657928` | **kanonische Kennung für Anzeige und Übergabe in die Planung** (`zielHref` → `/planen?zielId=geonames%3A2657928&idee=…`) |
| `placeId` | `geonames:2657915` | **redaktionelle CMS-Identität** der Reiseidee (EntryId, persistiert; in `cmsReference` und `referenceMatches`; der alte Bildpfad gehört zur Referenz). Unverändert. |
| Bildkatalog `lib/trips/organisieren/reisebilder.ts` | `geonames:2657928` | Reisekopf-Foto (`zermatt-commons.jpg`, Wikimedia Commons, bereits auf `main`), unverändert |

Bali, Lissabon und Amsterdam haben beide Felder gleich. **Es gibt keine Alias-Tabelle und keine Gleichsetzung der Orte:** Zofingen bleibt Zofingen (`reisebilder.test.ts` hält `geonames:2657915` neutral). Historische SQL-Seeds, Migrationen, CMS-Vertrag und Daten sind unverändert, es wird nichts in CMS oder Datenbank geschrieben. Die redaktionelle Zuordnung (`REDAKTION` im Katalog) bleibt über `placeId` verschlüsselt; Deduplizierung, veröffentlichte CMS-Revisionen, statischer Katalog, Rückfall und Ergänzung arbeiten weiter mit `placeId`, nur die Übergabe benutzt `zielId`. Die lokale Testdatei `lib/places/fixtures/geonames.tsv` führt jetzt beide echten Orte als getrennte Datensätze (Quelle in `lib/places/fixtures/README.md`). Im Admin-Inventar steht bei Zermatt «Planungsziel geonames:2657928» neben der CMS-Zuordnung.

Die Datei `zermatt.png` ist belegt, wird aber **nicht** gezeigt: Die Reiseidee Zermatt zeigt im öffentlichen Inspirationskontext das neutrale Kartenmotiv ohne Bildtext, der den Ort behauptet; sie wird auf Vorgabe von PO und TL nicht automatisch freigegeben.

**Offen, PO/Technical Lead:** Ob die Production-Tabelle `places` die Kennung `geonames:2657928` führt, ist von hier nicht prüfbar (die Planung bestätigt den Ort dort serverseitig). Ein lokaler Dev-Nachweis (`scripts/premium-redesign-a/zermatt-uebergabe.mjs`, Loopback-Fixture) belegt die Übergabe. Ist in Production eine Daten- oder CMS-Korrektur nötig, ist das ein eigenes PO-Paket; hier gibt es keine Schreibzugriffe und keine Lockerung des Vertrags.

## Alle Fundstellen im Repository

Gesucht über das ganze Repository nach `hero-bali.png`, `bali.jpg`, `lisbon.jpg`, `zermatt.jpg`, `amsterdam.jpg` (ohne `node_modules`, `.next`, Bilder, `package-lock.json`).

**Aktive Anzeige- und Metadatenpfade (öffentlich): alle über die Freigabe, kein Rohwert wird angezeigt.**

| Fundstelle | Rolle |
|---|---|
| `lib/places/inspiration.ts` | statische Quelle der Reiseideen (CMS-Identität, unverändert); wird von `lib/inspiration/cms-public.ts` als Rückfall gelesen |
| `components/home/HomeInspiration.tsx`, `components/inspiration/explorer-1/Inspirationskarte.tsx` | zeigen `inspirationsbild(ziel.image)` (Datei, Nachweis, Medium, Alt-Text), nie den Rohwert |
| `app/(public)/page.tsx`, `app/(public)/entdecken/page.tsx` | Bildnachweise der gezeigten Karten und des Heros |
| `lib/seo/startseitenbild.ts`, `app/layout.tsx`, `app/(public)/layout.tsx`, `app/(public)/page.tsx`, `lib/seo/final-homepage.ts` | Hero (`STARTSEITENBILD`), Open Graph, Twitter, JSON-LD (`TEILENBILD`) |
| `lib/inspiration/bildfreigabe.ts` | die Freigabe für den Inspirationskontext |
| `app/(public)/datenquellen/page.tsx`, `components/inspiration/Bildnachweisliste.tsx`, `components/ui/bildnachweis.tsx` | zentrale Herkunft und Nachweis am Bild |

**Admin (seit 27.11.2026 umgestellt, Anmeldung und Logik unverändert):**

| Fundstelle | Befund |
|---|---|
| `components/admin/content/ContentInventory.tsx` | Admin-Inhaltsübersicht, nur nach Anmeldung als Admin: der Link «Katalogbild öffnen» zeigt jetzt auf den richtigen Pfad (`inspirationsbild(entry.image).src`, zum Beispiel `/images/bali.png`); für Zermatt steht «Bildnachweis öffnen» (`/datenquellen#ki-illustrationen`). Die CMS-Zuordnung zeigt den Rohwert und, wenn abweichend, das Planungsziel. `lib/admin/analytics/browser.test.ts` und `lib/admin/content/inventory.test.ts` pinnen das. |

**Daten, Seeds, Fixtures (Identität, unverändert):** `scripts/db/admin-editorial-cms-1/schema-candidate.sql`, `scripts/db/admin-runtime-bg1-1/provider-migration-body.sql`, `scripts/db/admin-runtime-production-1/provider-migration-body.sql` (Katalogzeilen), `scripts/admin-cms-editor-2/fixtures.ts`.

**Tests (pinnen Allowlist, Kennzeichnung, Zermatt und Identität):** `lib/inspiration/bildfreigabe.test.ts`, `lib/trips/organisieren/bildnachweise.test.ts`, `lib/seo/final-homepage.test.ts`, `lib/inspiration/cms-public.test.ts`, `lib/admin/analytics/browser.test.ts`.

**Prüfskripte:** `scripts/premium-redesign-a/bildlizenz.mjs` (Netzwerk, DOM, Open Graph, Twitter, JSON-LD, Roh-HTML, ausgelieferte Dateien mit Inhaltstyp, Dateikopf und SHA-256, 404 der alten Adressen, Chromium und WebKit, 390 und 1440 px, hell und dunkel), `scripts/premium-redesign-a/og-bild.mjs` (Ableitung und Prüfung des Vorschaubilds), `scripts/premium-redesign-a/zermatt-uebergabe.mjs` (Dev-Nachweis der Übergabe), `scripts/premium-redesign-a/dunkelstart.mjs` (Kontrast der Bildtexte an den Pixeln, auch vor der Hydration).

**Historisch (Audit-Skripte und Dokumente, nicht aktiv):** `scripts/final-homepage-premium-experience-2-audit.mjs` (als historisch gekennzeichnet), `docs/NEXT_16_3_8_SECURITY_UPGRADE_1_REPORT_2026-09-30.md`, `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md`, `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`, `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`, `docs/evidence/**` (Messprotokolle früherer Läufe, unveränderlich).

## Seitenpayload

Die Entdecken-Seite liefert die CMS-Identität der Reiseideen im Seitenpayload (Rohpfad, auch der alte `/images/zermatt.jpg` und die Kennung `geonames:2657915`). Diese Pfade werden für Zermatt weder angefragt noch angezeigt (`bildlizenz.mjs` beweist es im Netzwerk und im DOM); sie sind aber im Roh-HTML des Servers lesbar. Wer auch das ausschliessen will, muss die Identität im Payload ersetzen; das berührt CMS-Daten und ist nicht Teil von PR A.

## Alte Adressen `/images/*.jpg`

Die vier alten Adressen (`bali.jpg`, `lisbon.jpg`, `zermatt.jpg`, `amsterdam.jpg`) werden **nicht** weitergeleitet. Geprüft: Keine aktive Seite, kein Open-Graph-Bild und keine Sitemap verweist darauf (die Kartenbilder laufen über `next/image` mit dem neuen Pfad, das Open-Graph-Bild war immer `hero-bali.png`), die CMS-Anzeige bildet den alten Pfad intern ab. Eine Weiterleitung wäre eine neue Routing-Regel mit Production-Wirkung ohne Bedarf. Die alten Adressen liefern 404 statt PNG-Daten unter einem JPEG-Namen (`bildlizenz.mjs` prüft das). Ein externer Verweis wäre nur ein schon vor dem Deploy zwischengespeichertes HTML der Startseite; Rückfalllösung wäre eine schmale 307-Weiterleitung der drei freigegebenen Adressen, nie eine allgemeine Zuordnung.

## Offene Punkte

- **Production-`places`:** Ob `geonames:2657928` dort steht, ist von hier nicht prüfbar (PO/Technical Lead, nur lesend; bei Bedarf eigenes PO-Paket, keine Schreibzugriffe in PR A).
- **Alte CMS-Zeilen und Seeds** tragen weiter `geonames:2657915` und `/images/*.jpg` (CMS-Identität, bewusst unverändert); die Anzeige-Seite bildet sie korrekt ab.
- **Öffentliche Adressen:** Die vier Asset-Adressen haben sich geändert (`.jpg` → `.png`); alte Adressen liefern 404 (keine Weiterleitung, siehe oben).
- **Ungenutzte Datei:** `public/images/jetnity-reiseplaner-share.png` (485 KB) ist seit jeher ungenutzt und bleibt unangetastet.
- **Entdecken** hat über das öffentliche Layout dasselbe Vorschaubild.
- **Ersatz der KI-Illustrationen:** durch Unsplash-Fotos in einem eigenen PR nach PR A (PO). PR B bis D und Premium Destination Images bleiben bis zum A-Merge blockiert.
- **Rechtliche Würdigung:** Die Herkunft beruht auf der PO-Erklärung und den OpenAI-Bedingungen. Eine rechtliche Prüfung der Rechte Dritter ist nicht erfolgt.
- **Work-Test 27.11.2026** (echtes iPhone, VoiceOver, TalkBack) am finalen Preview bleibt ein eigenes Gate.
