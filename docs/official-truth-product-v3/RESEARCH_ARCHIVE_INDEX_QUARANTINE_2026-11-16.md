# Originalarchiv — Index-/Migrationsquarantäne, 16.11.2026

**Geltung:** Nur `RESEARCH_ONLY`. Kein DB-Import, keine Veröffentlichung,
kein neuer Official-Truth-Datensatz. Die alten akzeptierten CH→DE-Auskünfte
werden nicht geändert. Quelle: das vom Owner bereitgestellte Originalarchiv,
SHA-256 `4d8e9804598788a1070016f69ecd6e28c72dfdee78b56aafbd647d23e4243e9d`;
vollständiger struktureller Prüflauf und Privatevidenz in
[#1218 / Nachtbeleg](https://github.com/Jetnity/jetnity/pull/1218#issuecomment-6907640164).

## Strukturelle Inventur — 206 Ziele

| Quarantäneklasse | Ziele | Behandlung |
| --- | ---: | --- |
| Explizite Split-/Legacy-Verträge, Kandidaten für den vorhandenen Offline-Adapter | 12 | Strenge Frame-/Index-/Tracker-/Slice-Prüfung; weiterhin reine Forschung |
| Split/Legacy mit ungeklärter kanonischer Migrationsbindung | 2, **CN/IN** | GESPERRT, kein auswählendes Legacy-Fallback |
| Sidecar vorhanden, aber Split-/Legacy-Bindung nicht nachgewiesen | 36, darunter **HR/NL** | GESPERRT, Sidecar weder ignorieren noch übersteuern |
| Indexvarianten ohne nachgewiesene separate Bindung, kein Sidecar | 154 | GESPERRT, eigenständigen Parser-Vertrag mit echter Index-/Tracker-/Slice-Provenienz erarbeiten |
| Regionen ausserhalb eines vereinbarten ISO2-Vertrags | 2, **CN-HK/CN-MO** | GESPERRT bis separate Gebietsanwendbarkeit/Vertragsprüfung |

Diese fünf Inventarklassen sind **nur Datenstrukturaussagen**. Auch die zwölf
Adapter-Kandidaten enthalten **keine akzeptierten neuen Fakten**; ein
vollständiges 50-Pass-Forschungspaket ist kein Quellen- oder Wahrheitsnachweis.
Insbesondere darf ein Tracker-Pointer fehlende rechtlich relevante
Migrations-, Herkunfts- oder Quellenbindungen nicht ersetzen.

## Ausführbarer, strikt beschränkter Offline-Pfad

`python3 scripts/official-truth-research-package.test.py -q` führt 16
synthetische Positiv-/Negativprüfungen aus; die Repo-Core-CI führt sie zusätzlich
über `lib/readiness/official-truth-research-package-integration.test.ts` aus.
Der Python-Adapter
`scripts/official-truth-research-package.py` verarbeitet ausschließlich
private, vorher sicher entpackte Forschungsdateien:

```bash
python3 scripts/official-truth-research-package.py prepare \
  --root "$PRIVATE_RESEARCH_ROOT" --destination AT --output "$PRIVATE_OUTPUT_PARENT/AT"
python3 scripts/official-truth-research-package.py verify \
  --output "$PRIVATE_OUTPUT_PARENT/AT"
```

`--output` muss ein bislang nicht existierendes Verzeichnis außerhalb der
Originalforschung sein. Keine Archivdaten ins öffentliche Repo committen.
Alle 26 Themen je Pass bleiben `unavailable`, `publicValue=null` und
`publicationAuthority=none`; Quellmetadaten werden originalgetreu kopiert,
nicht qualifiziert. Kein Provider-/Netzwerk-/Datenbank-/Publikationszugriff.

## Erste offene Arbeit nach der Adapterintegration

Die 36 Sidecar- und 154 sonstigen ungebundenen Varianten anhand **eines
belegten Datensatz-/Indexvertrags pro Form** einzeln eingrenzen. Für
**CN/IN** ist die Originalmigration zuerst quellseitig nachzuweisen;
**HR/NL** brauchen eindeutige Sidecar- und Migrationsbindungen; Sonderregionen
erfordern eigene Anwendbarkeitsregeln. Erst danach kann ein weiterer
quarantänisierter Forschungsadapter getestet werden. Jede amtliche
Tatsachenaufnahme erfordert separate, aktuelle Quellenprüfung mit exakter
Nationalität, Dokumentart, Zweck, Gebiet, Transit, Datum und Ownerfreigabe.
