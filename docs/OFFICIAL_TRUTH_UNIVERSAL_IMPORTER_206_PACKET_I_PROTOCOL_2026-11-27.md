# Official Truth Paket I – universeller Importer 206×50 / 6+4

Stand: 27.11.2026. Branch `cursor/official-truth-importer-206-5c1d` von `main` `ad157cf5ac64f4117787735b2d160628c09b67d1`.

Auftrag: [#1321](https://github.com/Jetnity/jetnity/issues/1321). Massgeblich [#1319](https://github.com/Jetnity/jetnity/issues/1319), insbesondere [6+4](https://github.com/Jetnity/jetnity/issues/1319#issuecomment-7205494648) und [Freitagscheckpoint](https://github.com/Jetnity/jetnity/issues/1319#issuecomment-7205720179). #1319 bleibt offen. Kein Merge, kein Ready, kein Deploy, keine Datenbank, kein Importlauf, keine Aktivierung.

## Was der Code tut

Die bestehenden Skripte `scripts/official-truth-50-pass-import.py`, `scripts/official-truth-research-package.py` und `scripts/official-truth-index-gap-audit.py` bleiben die Basis. Neu ist die logische Erweiterung, nicht ein zweiter Importer und keine neue Tabelle.

- Katalog: 206 Ziele. Die ersten 13 bleiben `AT IT FR ES PT GR HR NL GB US TR TH AE`. Danach die übrigen Ziele in der Reihenfolge des geprüften Scope-Index. Der sortierte Katalog hat SHA-256 `cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123`. Das ist der bereits im Repo gepinnte Ländersatz, keine neue Archivlesung.
- 206 × 50 = 10'300 Profile. Historische Themen bleiben 26, also 267'800 historische Slots. Die Launch-Projektion ist zusätzlich 6 × 10'300 = 61'800 Kernslots und 4 × 10'300 = 41'200 Zusatzslots.
- `CN-HK` und `CN-MO` sind eigene Ziele. Sie sind keine Pässe und werden nicht mit `CN` zusammengelegt.
- Neun Extra-Slices (`AU`, `CN-HK`, `CN-MO`, `KE`, `MV`, `NZ`, `SA`, `TZ`, `ZA`) werden bytegenau erhalten und nicht als 51. Pass importiert. Ein Extra ausserhalb dieser neun Ziele bricht ab.
- Legacy-Dubletten bleiben `preserved_not_selected`. v2.1-Slices bleiben v2.1.
- `HR` und `NL` bleiben der bekannte strukturelle Index-Hold (unsplit, nicht importierbar).
- `SO` bleibt ein Themen-Hold auf K2 (Dokumentanerkennung). Der Hold wird nicht durch einen Witness überschrieben. Das ist die mitgeführte Sperre aus den Checkpoints, keine neue Rechtsfeststellung und keine neue Archivprüfung.
- Trockener Lauf, Resume, append-only Checkpoint ausserhalb des Repos, Idempotenz, Pfad-/Identitäts-/Duplikat-/Konfliktverweigerung.
- `import` endet immer mit `PRIVATE_PAYLOAD_PATH_STOP` und Exit 2. Es gibt keinen nachgewiesenen privaten Persistenzpfad für Einzelregel-Payloads. Es wird keine Datenbank geöffnet und kein Schema geändert.

## 6+4, ohne die 26 Themen zu ändern

Die 26 historischen Topics bleiben der Ablage-Locator. Die Projektion erzeugt keine neuen Regelwerte und stuft nichts hoch.

| Launch | Historische Topics | Gate |
|---|---|---|
| K1 Visum/Einreisegenehmigung | visa, electronic_travel_authorization, entry_fees | Pflicht |
| K2 Dokument | passport, identity_document, passport_validity, blank_passport_pages | Pflicht |
| K3 Aufenthalt | stay_limit | Pflicht |
| K4 Gesundheit | required_vaccinations, recommended_vaccinations, health_measures, health_documents | Pflicht |
| K5 Formulare | entry_forms, form_costs | Pflicht |
| K6 Minderjährige | minors, parental_consent | Pflicht |
| Z1 Finanzmittel | financial_means | Zusatz |
| Z2 Rück-/Weiterreise | onward_return_ticket | Zusatz |
| Z3 Transit | transit | Zusatz |
| Z4 Zoll | customs | Zusatz |

Weiterhin nur historisch, kein Launch-Gate: insurance, fraud_warnings, booking_or_travel_document, dual_nationals, recent_changes, official_actions.

Ein Kernprofil ist nur vollständig, wenn alle sechs Kernslots einen ausdrücklich gelieferten Status `B`, `BELEGT_BEDINGT` oder `N/A` tragen. `N/A` braucht eine Rechtsgrundlage, sonst Verweigerung. Scope, Version, Digest und Quellen-ID gehören zu jedem belegten Status. Eine Ausnahmeliste nimmt Pässe aus einer Gruppe heraus, statt die Gruppe still zu erweitern. Ein offener oder unbekannter Zusatzslot ist kein Vollständigkeitsgate. Fehlende Belege bleiben offen und zählen nicht als PASS. Publikation bleibt 0.

## Getrennte Zähler

| Zähler | Bedeutung in diesem Paket | Trockener Lauf über alle 206 |
|---|---|---|
| Quellenzuordnung | Anzahl Slots mit ausdrücklich gelieferter Quellen-ID | 0 |
| Importfähigkeit | Strukturell gebundene Profile. Ohne gelesene Forschungsroot nicht bewertet | `NOT_ASSESSED` |
| Rechtsbeleg | Slots mit belegtem Status | 0 |
| Publikation | Veröffentlichte Regeln | 0 |

Der Gap-Audit zählt Importfähigkeit nur für hash-gebundene synthetische Fälle. Auch dort bleiben Rechtsbeleg und Publikation 0.

## Pins

Unverändert übernommen, in diesem Lauf nicht neu gegen das PO-Mac-Archiv geprüft:

- Original-Upload `6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5`
- Fixiertes 206-Archiv `4d8e9804598788a1070016f69ecd6e28c72dfdee78b56aafbd647d23e4243e9d`
- Prioritäts-CSV `4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358`
- Tracker `33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153`
- Ländersatz `cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123`

Der spätere Repack `6545eb28cdffab00a2c7864626abe602d4df240a477bb28b73fe73f78520744b` wird erkannt und abgelehnt (`repack_not_reverified_this_run`). Dieser Lauf hat das Archiv nicht gelesen. Keine Rohdaten liegen im Git.

Die Byte-Pins der beiden geänderten Offline-Skripte in den Integrationsprüfungen sind die neuen Skript-Digests, nicht Archiv-Digests:

- `official-truth-research-package.py` `99a42089f38e1bbcd960fa66ebcd8cba163d2f36fd8056be9670a9ec80b90d3b`
- `official-truth-index-gap-audit.py` `9099cd90077029144bbea18e4b0570d3f76037a540b16931270fff575de49bea`

## Tests, lokal, ohne Datenbank und ohne Netz

```text
python3 scripts/official-truth-research-package.test.py -q
python3 scripts/official-truth-index-gap-audit.test.py -q
python3 scripts/official-truth-50-pass-import.test.py -q
node --experimental-test-module-mocks --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/readiness/official-truth-50-pass-import.integration.test.ts \
  lib/readiness/official-truth-research-package-integration.test.ts \
  lib/readiness/official-truth-index-gap-audit-integration.test.ts
python3 scripts/official-truth-50-pass-import.py dry-run --destinations ALL
python3 scripts/official-truth-50-pass-import.py import
```

Ergebnis dieser Arbeitskopie:

- Forschungsadapter: 21 Tests, OK
- Gap-Audit: 6 Tests, OK
- 50-Pass-/206-Importer: 9 Tests, OK
- Drei Node-Integrationsprüfungen: 3 bestanden, 0 fehlgeschlagen
- Trockener Lauf: Profile 10300, historische Slots 267800, Kern 61800, Zusatz 41200, Rechtsbeleg 0, Quellenzuordnung 0, Importfähigkeit `NOT_ASSESSED`, Publikation 0, `archiveVerifiedThisRun` false, Payload `STOP_PRIVATE_PAYLOAD_PATH_MISSING`
- `import`: Exit 2, `PRIVATE_PAYLOAD_PATH_STOP accepted=0 published=0`

CI auf dem Code-Head `f5ba18762b06653d05fd83a1e861516e70b0ae7d`: [Run 45913537567](https://github.com/Jetnity/jetnity/actions/runs/45913537567), 13 GitHub-Checks und der Vercel-Status, zusammen 14, alle `success`. Der anschliessende Dokumentations-Commit trägt nur dieses Ergebnis nach. Seine eigene CI ist ein neuer Head und ist mit dem Lauf 45913537567 nicht bewiesen. Der grüne Lauf ist kein Rechtsbeleg, keine Archivprüfung und kein Import.

## Offene Gates

- Kein Originalarchiv in diesem Lauf. Der Repack ist nicht erneut geprüft. Importfähigkeit der echten 10'300 Dateien bleibt `NOT_ASSESSED`.
- Kein privater Payload-Pfad für Einzelregeln. Jeder echte Import bleibt STOP. Keine Schema-, Tabellen- oder Rechteänderung vorgeschlagen oder ausgeführt.
- Rechtsbeleg 0, solange kein ausdrücklicher Witness mit Quelle, Scope, Version und Digest geliefert wird. Die fachlichen Teilbelege in #1319 sind nicht als PASS in den Code übernommen.
- `HR`/`NL` und der `SO`-K2-Hold sind erhalten, nicht neu bewiesen und nicht aufgehoben.
- Paket II und die Oberfläche sind nicht angefasst.
- Die CI dieses Heads ist grün. Exact-Head-Review und die Entscheidung über den Draft bleiben beim Technical Lead. Cursor setzt nicht Ready und mergt nicht. Ein grüner Lauf ist kein Rechtsbeleg und kein Import.

## Nächster Schritt

Technical Lead prüft Diff, die genannten lokalen Tests und die CI dieses Heads. Ein echter Import bleibt blockiert, bis ein bereits vorhandener privater Payload-Pfad unabhängig nachgewiesen ist. Bis dahin bleibt die Ablage die bestehende private Dateisystem-Quarantäne ausserhalb von Git.
