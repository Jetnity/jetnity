# Premium-Redesign PR A – Herkunft und Gate der KI-Illustrationen: Referenzliste (26.11.2026)

Stand: Draft #1320, Branch `feat/workspace-premium-redesign-a`. Zweite Fassung nach der Nachprüfung des Technical Leads (PR-Kommentar 7204725750). Sie ersetzt die erste Fassung, die fünf Dateien vorläufig gesperrt hatte (Ausgang der Korrektur `d122179f5`, ADR-0249).

## Was die fünf Dateien sind

`hero-bali.png`, `bali.jpg`, `lisbon.jpg`, `zermatt.jpg` und `amsterdam.jpg` sind **KI-Illustrationen, keine Fotos**. Sie zeigen keine echte Aufnahme des genannten Ortes. Das Medium `ki-illustration` ist im Katalog (`lib/trips/organisieren/bildnachweise.ts`) vom Medium `foto` getrennt und wird überall so benannt.

Herkunft (Erklärung des Product Owners vom 26.11.2026): **KI-generiert (ChatGPT/OpenAI), Eigentum Jetnity/Sasa Feirov (PO-Erklärung 26.11.2026)**. Einzige Quelle dieser Angabe ist die PO-Erklärung. Nicht erfasst und nicht erfunden: Prompts, Generierungs-Kennungen, Original-Adressen. Es gilt keine Creative-Commons-Lizenz, und es wird keine Urheberrechtsgarantie behauptet.

| Datei | Ersteintrag im Repository | Commit | SHA-256 | Einsatz |
|---|---|---|---|---|
| `public/images/hero-bali.png` | 19.07.2025 | `6f59d83eec1453892139eb2eab3e238223487a25` | `0d8aa860…ee45` | Hero der Startseite, Open Graph, Twitter, JSON-LD |
| `public/images/bali.jpg` | 02.09.2025 | `265887dd8a5dbdaf450eb14eec6b84f987568e6f` | `86acf2c0…0f07` | Reiseidee Bali (Startseite, Entdecken) |
| `public/images/lisbon.jpg` | 02.09.2025 | `265887dd8a5dbdaf450eb14eec6b84f987568e6f` | `e8f4f66b…70c3` | Reiseidee Lissabon |
| `public/images/amsterdam.jpg` | 02.09.2025 | `265887dd8a5dbdaf450eb14eec6b84f987568e6f` | `02462fc4…b122` | Reiseidee Amsterdam |
| `public/images/zermatt.jpg` | 02.09.2025 | `265887dd8a5dbdaf450eb14eec6b84f987568e6f` | `0720951b…92bc` | **nirgends** (siehe Zermatt) |

«Ersteintrag» ist der Tag, an dem die Datei erstmals ins Git-Repository eingecheckt wurde. Es ist **kein verifiziertes Erstellungsdatum**. Jede Datei hat seither genau einen Commit. Die vollständigen Prüfsummen stehen in `public/images/organisieren/Bildnachweise.txt` und im Katalog.

Die `.jpg`-Dateien sind in Wirklichkeit PNG-Daten (Endung und Inhalt stimmen nicht überein; Browser zeigen sie korrekt). Der Test der echten Abmessungen liest deshalb die Kopfdaten der Datei und nicht die Endung.

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

- **Explizite Allowlist einzeln belegter Dateien:** `FREIGEGEBENE_ILLUSTRATIONEN` (`hero-bali.png`, `bali.jpg`, `lisbon.jpg`, `amsterdam.jpg`) in `lib/trips/organisieren/bildnachweise.ts`. Alles andere, auch eine unbekannte oder fremde Datei, bleibt neutral (`NEUTRALES_REISEBILD`, `reiseatlas.webp`, kein Ortsanspruch). `ZURUECKGEHALTENE_ILLUSTRATIONEN` führt `zermatt.jpg` mit Grund.
- **Herkunft an vier Stellen:** `public/images/organisieren/Bildnachweise.txt` (Abschnitt «KI-Illustrationen»), der typisierte Katalog (`KI_ILLUSTRATIONEN`), die zentrale Seite `/datenquellen#ki-illustrationen` und der Nachweis am Bild (`BildnachweisKnopf` und `Bildnachweisliste`, ohne doppelte lange Zeilen).
- **Kennzeichnung am Bild:** Jede freigegebene Karte und der Hero tragen den sichtbaren, dezenten Hinweis «KI-Illustration» (`components/ui/IllustrationsHinweis.tsx`, im Hero `.hs-ort-hinweis`). Der Alt-Text beginnt mit «KI-Illustration:» und nennt das Motiv, nicht einen Ort als fotografiert.
- **Metadaten:** `STARTSEITENBILD` (`lib/seo/startseitenbild.ts`) bleibt die einzige Stelle für Hero, Open Graph, Twitter und JSON-LD. `og:image:alt` und `twitter:image:alt` benennen die Illustration; JSON-LD trägt ein `ImageObject` mit `caption` (Illustration), `creditText` (Herkunft) und den echten Abmessungen. Es wird kein Ortsfoto behauptet.
- **Echte Abmessungen:** Test und Abnahme lesen die tatsächlichen Pixelmasse der gewählten Datei (1536 × 1024) und vergleichen sie mit den angegebenen Werten. Das Nusa-Penida-Foto (800 × 450) ist kein Hindernis mehr und wird für den Hero nicht verwendet.

## Zermatt: bleibt neutral, offener Datenfehler

Die Reiseidee Zermatt zeigt im öffentlichen Inspirationskontext das neutrale Kartenmotiv ohne Bildtext, der den Ort behauptet. Die Datei `zermatt.jpg` ist belegt, wird aber nicht gezeigt.

| Kennung | Wo | Befund (öffentliche GeoNames-Seite, nur gelesen) |
|---|---|---|
| `geonames:2657915` | Reiseidee «Zermatt» in `lib/places/inspiration.ts`, CMS-/DB-Seeds, `lib/inspiration/explorer-1/katalog.ts` | GeoNames führt darunter «Zofingen, Switzerland» |
| `geonames:2657928` | Bildkatalog `lib/trips/organisieren/reisebilder.ts` (Zermatt) | GeoNames führt darunter «Zermatt, Switzerland» |

Die lokale Testdatei `lib/places/fixtures/geonames.tsv` nennt `2657915` ebenfalls «Zermatt» und weicht damit von GeoNames ab. **Die Kennungen werden nicht gleichgesetzt, es gibt keine Änderung an CMS-Identität, Daten oder Seeds.** Das Zermatt-Bild des Reisekopfs (`zermatt-commons.jpg`, Wikimedia Commons, bereits auf `main`) hängt an der Kennung `2657928` und bleibt unverändert.

**Offen, PO/Technical Lead:** Die Kennung der Reiseidee «Zermatt» ist vermutlich falsch (`2657915` ist Zofingen). Eine Korrektur berührt CMS-Zeilen, Migrations-Seeds und Tests und ist hier bewusst nicht erfolgt. Erst danach kann `zermatt.jpg` auf die Allowlist.

## Alle Fundstellen im Repository

Gesucht über das ganze Repository nach `hero-bali.png`, `bali.jpg`, `lisbon.jpg`, `zermatt.jpg`, `amsterdam.jpg` (ohne `node_modules`, `.next`, Bilder, `package-lock.json`).

**Aktive Anzeige- und Metadatenpfade (öffentlich): alle über die Freigabe, kein Rohwert wird angezeigt.**

| Fundstelle | Rolle |
|---|---|
| `lib/places/inspiration.ts` | statische Quelle der Reiseideen (CMS-Identität, unverändert); wird von `lib/inspiration/cms-public.ts` als Rückfall gelesen |
| `components/home/HomeInspiration.tsx`, `components/inspiration/explorer-1/Inspirationskarte.tsx` | zeigen `inspirationsbild(ziel.image)` (Datei, Nachweis, Medium, Alt-Text), nie den Rohwert |
| `app/(public)/page.tsx`, `app/(public)/entdecken/page.tsx` | Bildnachweise der gezeigten Karten und des Heros |
| `lib/seo/startseitenbild.ts`, `app/layout.tsx`, `app/(public)/layout.tsx`, `lib/seo/final-homepage.ts` | Open Graph, Twitter, JSON-LD, Hero |
| `lib/inspiration/bildfreigabe.ts` | die Freigabe für den Inspirationskontext |
| `app/(public)/datenquellen/page.tsx`, `components/inspiration/Bildnachweisliste.tsx`, `components/ui/bildnachweis.tsx` | zentrale Herkunft und Nachweis am Bild |

**Aktiver Pfad ausserhalb des Auftrags, nicht geändert:**

| Fundstelle | Befund |
|---|---|
| `components/admin/content/ContentInventory.tsx` | Admin-Inhaltsübersicht, nur nach Anmeldung als Admin: der Link «Katalogbild öffnen» öffnet den Rohpfad (`entry.image`) im neuen Tab. Wird dort nicht eingebettet. `lib/admin/analytics/browser.test.ts` pinnt den Link (`/images/bali.jpg`). Eine Änderung braucht eine Entscheidung (Test, Admin-Scope); **Empfehlung:** Link auf das Ergebnis der Freigabe umstellen. |

**Daten, Seeds, Fixtures (Identität, unverändert):** `scripts/db/admin-editorial-cms-1/schema-candidate.sql`, `scripts/db/admin-runtime-bg1-1/provider-migration-body.sql`, `scripts/db/admin-runtime-production-1/provider-migration-body.sql` (Katalogzeilen), `scripts/admin-cms-editor-2/fixtures.ts`.

**Tests (pinnen Allowlist, Kennzeichnung, Zermatt und Identität):** `lib/inspiration/bildfreigabe.test.ts`, `lib/trips/organisieren/bildnachweise.test.ts`, `lib/seo/final-homepage.test.ts`, `lib/inspiration/cms-public.test.ts`, `lib/admin/analytics/browser.test.ts`.

**Prüfskripte:** `scripts/premium-redesign-a/bildlizenz.mjs` (Netzwerk, DOM, Open Graph, Twitter, JSON-LD, Roh-HTML, Chromium und WebKit, 390 und 1440 px, hell und dunkel; Negativfälle für unbekannte Quelle und alte Kennungen), `scripts/premium-redesign-a/dunkelstart.mjs` (Kontrast der Bildtexte an den Pixeln, auch vor der Hydration).

**Historisch (Audit-Skripte und Dokumente, nicht aktiv):** `scripts/final-homepage-premium-experience-2-audit.mjs` (als historisch gekennzeichnet), `docs/NEXT_16_3_8_SECURITY_UPGRADE_1_REPORT_2026-09-30.md`, `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md`, `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`, `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`, `docs/evidence/**` (Messprotokolle früherer Läufe, unveränderlich).

## Seitenpayload

Die Entdecken-Seite liefert die CMS-Identität der Reiseideen im Seitenpayload (Rohpfad, auch `/images/zermatt.jpg`). Diese Pfade werden für Zermatt weder angefragt noch angezeigt (`bildlizenz.mjs` beweist es im Netzwerk und im DOM); sie sind aber im Roh-HTML des Servers lesbar. Wer auch das ausschliessen will, muss die Identität im Payload ersetzen; das berührt CMS-Daten und ist nicht Teil von PR A.

## Offene Punkte

- **Orts-ID Zermatt** (siehe oben): PO/Technical Lead.
- **Open-Graph-Bild:** `hero-bali.png` hat 2,4 MB (wie auf `main`). Manche Messenger lehnen so grosse Vorschaubilder ab (WhatsApp rund 300 KB). Eine verkleinerte Fassung wäre eine eigene, kleine Entscheidung; es wurde keine neue Datei erzeugt.
- **Endung:** Die drei `.jpg`-Dateien enthalten PNG-Daten. Eine Umbenennung berührt die Pfade der CMS- und Datenbankzeilen und ist hier nicht erfolgt.
- **Entdecken** hat wie auf `main` kein eigenes Open-Graph-Bild.
- **Rechtliche Würdigung:** Die Herkunft beruht auf der PO-Erklärung und den OpenAI-Bedingungen. Eine rechtliche Prüfung der Rechte Dritter ist nicht erfolgt.
