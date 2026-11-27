# Official Truth Paket I – universeller Importer 206×50 / 6+4

## Nachkorrektur der Feldtypen, NO-GO auf bb0ad342e

- Ein Slice-Status, der kein String ist, wird als `slice_identity` gehalten. Die Mitgliedschaft im Statusset wird nicht auf einem Array oder Objekt ausgeführt. `prepare` lehnt denselben Wert mit `slice_identity` ab.
- Eine Quellen-URL wird nur geparst, wenn sie ein String ist. Ein Array oder Objekt ist eine unbestätigte Provenienz, kein Abbruch. `conflicts` mit `null`, fehlendem Schlüssel oder einem anderen Typ ist `conflict_undeclared` und nicht `holdStatus=none`. `conflictAbsenceProven` bleibt falsch.
- Der Hashvergleich eines Nichtobjekt-Slices geschieht vor dem Rücksprung. Eine unlesbare JSON-Datei ist `slice_parse_error`, eine fehlende Datei bleibt `slice_absent`. 206/10'300 bleibt Inventar. `legalEvidence` bleibt 0.

Lokal, ohne Archiv: Forschungsadapter 43 Tests, Gap-Audit 6, Importer 31, alle OK. Die CI dieses Heads wird erst nach dem Push belegt.

## Nachkorrektur der Diagnose, NO-GO auf 716ecce13

- Jeder Index, der kein Objekt ist, hält das Ziel. `null`, `false`, `0`, ein String und ein Array sind `index_not_object`. Die lesbaren Profile dieses Ziels werden weiter geprüft. Ein Typfehler in einem Indexfeld wird als Hold erfasst und bricht die übrigen Profile nicht ab.
- Im research_v2_2-Altpfad werden vorhandene `expected_50_set` und `slice_sha256` vor der Rückgabe geprüft. Ein explizites `null` ist kein fehlender Schlüssel. Eine fehlende Hashdeklaration bleibt `hash_declaration_absent` und ist kein Hash-PASS. Ein gesetzter Hash wird an die Dateibytes gebunden.
- Die Tracker-Pflichtspalten und der kanonische Pointer gelten vor jedem Kandidaten. Eine fehlende `record_pointer`-Spalte, ein abweichender Pointer, ein fehlendes oder falsches `record-schema.json` und der CORE-Vertrag erzeugen keinen Kandidaten. Eine fehlende Konfliktspalte ist nicht als leerer oder negativer Tracker gelesen. Leere Quellen, Metadatenwarnungen und nicht auflösbare Feldreferenzen bleiben lokal unbestätigt. `conflictAbsenceProven` bleibt falsch. `legalEvidence` bleibt 0.
- Die Profilstatus `missing`, `notCheckable`, `held` und `checked` sind disjunkt und summieren sich auf die geprüften Paare. `notCheckablePairs` zählt fehlende Ziele, fehlende Slices, `slice_not_object` und `sources_shape`. `checked` und 206/10'300 sind Inventar, kein PASS. Der lokale Ablauf diagnostiziert den temporären Forschungsbaum nach der bestehenden Abnahme und vor dem Aufräumen. Nach aussen gehen nur Summen. Es gibt keinen zweiten Archivzugriff und keine Umgehung des Exact-Head-Gates. Die Charge von `ebe14868c` bleibt historisch.

Lokal, ohne Archiv: Forschungsadapter 42 Tests, Gap-Audit 6, Importer 31, alle OK. Die CI dieses Heads wird erst nach dem Push belegt.

## Nachkorrektur der Diagnose, NO-GO auf 842c03d2b

- Die Diagnose läuft über die gepinnte Zielreihenfolge und zählt jedes tatsächlich geprüfte Paar. Ein früher Integritätsfehler beendet die übrigen Profilprüfungen nicht. Kandidaten gibt es nur ohne zielweite Integritätsstörung, und ein lokaler Befund trägt seinen Hold-Status. `holdStatus=none` setzt die Slice-Identität, den Status, die Authority und den Pointer voraus.
- Vorhandene Zusatzmaps und Hashfelder werden mitgeprüft. Ein gesetztes `sha256: null` ist ein Hold. Eine fehlende Deklaration bleibt nicht deklariert. `diagnose` öffnet das Archiv nicht und ersetzt die Chargenfreigabe nicht.
- `legalEvidence` bleibt 0. Die Charge von `ebe14868c` bleibt historisch. M04/N11 ist nicht verändert.

Die CI dieses Heads ist erst nach dem Push zu belegen.

## Fünfte Korrekturrunde, Sperranalyse 27.11.2026

Ausgang bleibt `ebe14868c`. Dessen lokaler technischer PASS und die alte Charge bleiben ein historischer Nachweis. Dieser Commit ist eine neue Prüfung und keine Freigabe einer neuen Charge.

- Ein Trackerfeld ist nur dann kein behaupteter Konflikt, wenn es leer ist oder nach Zuschnitt und Kleinschreibung genau `nein` lautet. `ja`, unbekannter Text und ein historischer Erledigungsvermerk bleiben ein Hold. Der Originalwert bleibt stehen. `nein` ist kein Rechtsbeleg und löscht einen Slice-Konflikt nicht.
- Abweichende Trackerzeilen werden nicht ausgewählt. Die Diagnose nennt die tatsächlich abweichenden Feldnamen und wählt keine Zeile, kein Datum und keine Mehrheit.
- `jetnity-entry-requirements-dest-index-v2.2` folgt dem bereits im Gap-Audit belegten Vertrag. `dest-index-v1` und `research-index-v2.2` binden nur, wenn sie dieselben bereits belegten Felder eindeutig verwenden. Eine fehlende Pointerliste ist dabei nur zulässig, wenn Dateimap und Positionsmap dieselbe eindeutige Zuordnung tragen. Ein vorhandener widersprüchlicher Pointer bleibt ein Hold. Eine andere Feldform bleibt `index_structure_unredacted`, weil ihre redigierte Struktur hier nicht belegt ist. Eine vorhandene Hashdeklaration muss zum Dateibytes passen. Eine fehlende doppelte Deklaration ist kein Hash-PASS.
- `diagnose` liest nur und sammelt Befunde. Eine zielweite Integritätsstörung erzeugt keine Kandidaten. Fehlende historische Schlüssel werden genannt und nicht ergänzt. `medication_import` wird kein neues Kern-Launch-Thema. Die Zahlen 549, 7'465 und 1'786 stehen als historischer Vergleich, nicht als PASS und nicht als neue Messung.
- `legalEvidence` bleibt 0. HR/NL und die vier SO/K2-Holds bleiben. Es wurde kein Archiv gelesen und keine neue Charge gestartet.

Die CI dieses Heads ist erst nach dem Push zu belegen.

## Vierte Korrekturrunde, NO-GO auf 7dfac457f

- Vor dem Lesen und vor jedem Schreiben prüft der lokale Ablauf die Ausgabe gegen den Ordner der Originaldatei und gegen jeden Git-Worktree. Ausgabe innerhalb, gleich oder oberhalb dieses Ordners, Symlink-Komponenten, `..`, Hardlinks und ein Staging im Originalordner werden abgelehnt. Die Originaldatei muss schon schreibgeschützt sein; der Lauf ändert ihre Bytes, ihre Rechte und den Ordnerinhalt nicht.
- Eine Schema-2-Charge kann nicht durch `schema=1` oder durch Entfernen von `sealVersion`, Charge, Journal, Lock oder Binding auf den historischen Schema-1-Lesepfad fallen. Sobald eine erwartete Identität oder ein solches Merkmal vorliegt, prüft Verify die Charge unter der Sperre. Der historische Pfad bleibt nur für alte Siegel ohne diese Merkmale und ist kein Chargen-PASS. Der lokale Ablauf benutzt ihn nicht.
- `legalEvidence` bleibt 0. `PRIVATE_PAYLOAD_PATH_STOP` bleibt. Das Mac-Archiv wurde nicht gelesen.

Die CI dieses Heads ist erst nach dem Push zu belegen. Sie wird hier nicht vorweg genommen.

## Dritte Korrekturrunde, NO-GO auf f08728c2a

- `run` öffnet das Archiv nur, wenn ein externer Abnahme-Datensatz denselben Git-Commit und dieselben vier Skript-Digests nennt. `authorized=True` und `--after-tl-acceptance` ohne diesen Datensatz bleiben `LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED` und lesen die Datei nicht. Der Datensatz steht nicht im Git. Diese Session setzt keine Freigabe.
- Ein Fixture-Lauf darf keinen der drei Archiv-Pins tragen. Ein behaupteter echter Pin wird vor dem Öffnen auf einen sauberen Checkout geprüft. Der Importer-CLI-Modus `prepare`/`resume` endet mit `local_gate_required`, bevor ein Archiv gelesen wird. `import` bleibt Exit 2.
- `verify` prüft bei Schema 2 unter der Chargensperre den Git-Commit, die Skript-Digests, die kanonische Ausgabeidentität, die Zielreihenfolge, die Journal-Kette und Paket- wie HOLD-Digests samt HOLD-Grund. Eine Schema-2-Charge ohne Identität wird abgelehnt. Ein vorhandenes Paket ohne passende Bindung wird nicht übernommen.
- Synthetisch geprüft: gesperrter Lauf, falscher Head, falsche Skriptdigests, Pin-Fixture, CLI-Umgehung, ungebundene Charge, gleicher Basename, HOLD-Widerspruch, paralleles Verify, sowie ein Fixture-Lauf mit unverändertem Original, Resume und Verify. `legalEvidence` bleibt 0.

Die CI dieses Heads ist erst nach dem Push zu belegen. Sie wird hier nicht vorweg genommen.

## Zweite Korrekturrunde, NO-GO auf 2c60c7eff

- Die Charge bindet Archiv-SHA, CSV-Pin, Tracker-Pin, den Git-Commit und die Digests aller vier ausführenden Skripte. Eine Null-SHA ist im realen Pfad abgelehnt. Ausgabe- und Zielidentität werden vor dem ersten Schreiben geprüft.
- Das Lock der Charge liegt vor dem Lesen des Journals und bleibt bis zum Abschlussmanifest. Ein zweiter Prozess erhält `checkpoint_busy` und löscht nichts. Ein Manifest wird atomar ersetzt, nicht vorher gelöscht.
- Ein Paket, das vor dem Journal-Eintrag geschrieben wurde, wird verifiziert und nicht neu erzeugt. Ein HOLD behält Grund und Bytes.
- Tracker-Zeilen werden nur dedupliziert, wenn sie vollständig gleich sind. Gleicher Zeiger mit anderem Feld, zwei Zeiger oder ein Konfliktflag sind ein Hold. Andere Ziele laufen weiter. Integritätskonflikte brechen fail-closed ab.
- Der lokale Archivlauf bleibt gesperrt. Synthetisch sind Prepare, Resume und Verify geprüft. `legalEvidence` bleibt 0. `PRIVATE_PAYLOAD_PATH_STOP` bleibt.

## Korrekturrunde nach TL-Review 27.11.2026

Massgeblich ist der Review in #1319, Kommentar 7207442476. Gleicher Branch, gleicher Draft #1323. M04/N11 ist nicht verändert.

- Der Repack `6545eb28cdffab00a2c7864626abe602d4df240a477bb28b73fe73f78520744b` ist die lokale Archivvariante. Größe 2'924'288 Bytes, CSV- und Tracker-Pins werden erst geprüft, wenn die Datei tatsächlich gelesen wird. `--research-root` ersetzt den Pin nicht. Diese Session hat das Archiv nicht gelesen.
- HR und NL bleiben Hold, auch bei gesplittetem Index. SO auf K2 gilt nur für AT, ES, GR und NL.
- Identische Tracker-Mehrfachzeilen binden einmal. Widersprechende Zeiger, fehlende oder uneinheitliche Indexfelder werden nicht ergänzt. Eine einheitliche andere Indexreihenfolge folgt dem CSV-Rang. v2.1/v2.2 und die Statusvarianten `RESEARCH_ONLY`, `researched`, `research_only` bleiben im Original.
- `project_launch` setzt `legalEvidence` nicht aus frei gelieferter source.id, Digest, Version, Scope, Status oder Textlänge. Ein `checked_official`-Witness ohne gebundene Originalbytes wird abgelehnt. Vollständige Profile bleiben 0.
- Checkpoints binden Archiv-SHA, CSV-SHA, Tracker-SHA, Skript-Digest und Ausgabeidentität. Ausgabe ausserhalb von Git-Worktrees, 0700/0600, Append-only, kein stilles Mischen von Chargen.
- Lokaler Ablauf für den Work-Chat: `docs/OFFICIAL_TRUTH_PACKET_I_LOCAL_WORK_RUN_2026-11-27.md`. Vor der TL-Abnahme endet er mit `LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED`. Datenbankimport bleibt `PRIVATE_PAYLOAD_PATH_STOP`.

Die CI dieses Korrektur-Heads ist erst nach dem Push zu belegen. Sie wird hier nicht vorweg genommen.

Stand der ersten Runde: 27.11.2026. Branch `cursor/official-truth-importer-206-5c1d` von `main` `ad157cf5ac64f4117787735b2d160628c09b67d1`.

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

- `official-truth-research-package.py` `a88f65e335cfc623baf132b4c0d915283a9f0c0b40d34cfd4a3150e5ba67763f`. Der vorherige Integrationspin `d345443512c53af3fc5f318746a485394ef02ebbee7af16da5ce133ac29aa5bb` gehört zu `bb0ad342e`. Der Pin `66f1f49d7b126061a1ad769f188af2f59bdd07048b406a38155dede672808c66` gehört zu `716ecce13`.
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

Ergebnis dieser Nachkorrektur, lokal, ohne Archiv:

- Forschungsadapter: 38 Tests, OK
- Gap-Audit: 6 Tests, OK
- Importer: 30 Tests, OK
- Drei Node-Integrationsprüfungen: 3 bestanden, 0 fehlgeschlagen

Ergebnis dieser fünften Korrektur, lokal, ohne Archiv und ohne Datenbank:

- Forschungsadapter: 34 Tests, OK
- Gap-Audit: 6 Tests, OK
- Importer: 30 Tests, OK
- Drei Node-Integrationsprüfungen: 3 bestanden, 0 fehlgeschlagen

Die älteren Zähler bleiben der Stand ihrer Runde. 549, 7'465 und 1'786 sind der historische Vergleich aus der Sperranalyse, keine neue Messung.

Ergebnis dieser vierten Korrektur, lokal, ohne Archiv und ohne Datenbank:

- Forschungsadapter: 25 Tests, OK
- Gap-Audit: 6 Tests, OK
- Importer: 30 Tests, OK
- Drei Node-Integrationsprüfungen: 3 bestanden, 0 fehlgeschlagen

Die älteren Zähler in diesem Abschnitt bleiben der Stand ihrer Runde.

Ergebnis dieser dritten Korrektur, lokal, ohne Archiv und ohne Datenbank:

- Forschungsadapter: 25 Tests, OK
- Gap-Audit: 6 Tests, OK
- Importer: 27 Tests, OK
- Drei Node-Integrationsprüfungen: 3 bestanden, 0 fehlgeschlagen

Die älteren Zähler in diesem Abschnitt bleiben der Stand ihrer Runde.

Ergebnis der ersten Arbeitskopie:

- Forschungsadapter: 21 Tests, OK
- Gap-Audit: 6 Tests, OK
- 50-Pass-/206-Importer: 9 Tests, OK
- Drei Node-Integrationsprüfungen: 3 bestanden, 0 fehlgeschlagen
- Trockener Lauf: Profile 10300, historische Slots 267800, Kern 61800, Zusatz 41200, Rechtsbeleg 0, Quellenzuordnung 0, Importfähigkeit `NOT_ASSESSED`, Publikation 0, `archiveVerifiedThisRun` false, Payload `STOP_PRIVATE_PAYLOAD_PATH_MISSING`
- `import`: Exit 2, `PRIVATE_PAYLOAD_PATH_STOP accepted=0 published=0`

CI auf dem Code-Head `f5ba18762b06653d05fd83a1e861516e70b0ae7d`: [Run 45913537567](https://github.com/Jetnity/jetnity/actions/runs/45913537567), 13 GitHub-Checks und der Vercel-Status, zusammen 14, alle `success`. Der grüne Lauf ist kein Rechtsbeleg, keine Archivprüfung und kein Import.

CI auf dem Dokumentations-Head `489f2ea8ab9dce94b523df87607ecc9a4d6722c1`: [Run 45916385150](https://github.com/Jetnity/jetnity/actions/runs/45916385150), `failure`. Gegen `f5ba18762` unterscheiden sich nur zwei Sätze in `docs/ACTIVE_WORK_STATUS.md` und diesem Protokoll. Rot sind `Repository verification` (Schritt Tests) und danach `Typecheck, Lint & Build`, weil dieser Job den Bestand der Verifikationsjobs verlangt. Der Testfehler ist einer: `scripts/db/official-truth-v3-durable-jobs-1/native.ts`, Beweis N11, `assert.equal` des Katalogs vor und nach einem temporären Deferred-Trigger (Zeile 2016). Die Meldung ist `proof_22:N11` / `assertion_failed`. GitHub kürzt die beiden Katalog-JSON ab; der sichtbare Anfang (Rollen und erste Spalten) ist gleich. Der umgebende M04-Test meldet denselben Fehler als `M04 native proof or terminal cleanup failed`. Dieser native M04-Beweis gehört nicht zu Paket I und wird hier nicht verändert.

## Offene Gates

- Kein Originalarchiv in diesem Lauf. Der Repack ist nicht erneut geprüft. Importfähigkeit der echten 10'300 Dateien bleibt `NOT_ASSESSED`.
- Kein privater Payload-Pfad für Einzelregeln. Jeder echte Import bleibt STOP. Keine Schema-, Tabellen- oder Rechteänderung vorgeschlagen oder ausgeführt.
- Rechtsbeleg 0, solange kein ausdrücklicher Witness mit Quelle, Scope, Version und Digest geliefert wird. Die fachlichen Teilbelege in #1319 sind nicht als PASS in den Code übernommen.
- `HR`/`NL` und der `SO`-K2-Hold sind erhalten, nicht neu bewiesen und nicht aufgehoben.
- Paket II und die Oberfläche sind nicht angefasst.
- Der aktuelle Head `489f2ea8` hat rote CI wegen des unveränderten M04-Nativbeweises N11. Der Code-Head `f5ba18762` bleibt der grüne Lauf. Exact-Head-Review und die Entscheidung über den Draft bleiben beim Technical Lead. Cursor setzt nicht Ready und mergt nicht.

## Nächster Schritt

Technical Lead prüft Diff, die genannten lokalen Tests und die CI dieses Heads. Ein echter Import bleibt blockiert, bis ein bereits vorhandener privater Payload-Pfad unabhängig nachgewiesen ist. Bis dahin bleibt die Ablage die bestehende private Dateisystem-Quarantäne ausserhalb von Git.
