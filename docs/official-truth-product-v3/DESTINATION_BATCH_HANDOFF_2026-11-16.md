# Zielpakete mit 50 Pässen — Auftrag und Übergabe

**Owner-Auftrag 16.11.2026:** 206 Ziele × 50 Pässe aus vorhandener Recherche,
pro Ziel alle Pässe gemeinsam. Reihenfolge AT, IT, FR, ES, PT, GR, HR, NL, GB,
US, TR, TH, AE, danach weitere. Die echte `passport-priority.csv` bestimmt alle
50 Plätze, beginnend IN, TR, CN, DE, PL, IT, US, UA, RO, FR; CH gehört dazu.
Keine restlichen Ränge erfinden. Nur Dev/Vorbereitung; neue Inhalte, Merges und
Production brauchen Sasa. #1216-Monitorfreigabe ist ein separates bestehendes Gate.

## Umsetzung und Grenzen

`official-truth-destination-batch.mjs` erzeugt **ein** lokales Zielpaket mit zehn
unveränderten V3-Plänen zu je fünf Pässen. Die Abfrage-/Proposallimits werden nicht
auf 50 erweitert. Jeder Plan kommt aus der bestehenden kanonischen Templatefactory.
Alle 26 Themen je Pass bleiben ausdrücklich unavailable/not_researched. Das Paket
bindet CSV und ausgewählte Forschungsdateien per Prüfsumme, übernimmt aber keine
ungeprüften Aussagen. `completeResearch=false`, `availableClaims=0` und
`publicationAuthority=none` sind absichtlich nicht konfigurierbar.

Kein Netzwerk, kein Datenbankzugriff, kein Import, kein Queue-Aufruf und keine
Publikation. Fehlende/mehrdeutige CSV, andere Anzahl/Reihenfolge, fehlende
206-Ziel-Struktur, Symlinks, Budgetverletzung oder beschädigte Factoryausgabe
stoppen. Reguläre Länderordner oder einzelne `.json`/`.jsonl`/`.ndjson`-Dateien
werden erkannt; andere Archivlayouts benötigen erst einen belegten Adapter.
Es wird nichts stillschweigend konvertiert. Neue Ausgabe ausserhalb der Recherche,
kein Überschreiben; der Abschlussmanifest wird zuletzt geschrieben.

Ausführung im normalen Repository mit vorhandenen Abhängigkeiten, **ausserhalb Chat**:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx \
  scripts/official-truth-destination-batch.mjs \
  --research-root /pfad/zur/echten/recherche --destination AT \
  --passport-column TATSAECHLICHER_SPALTENNAME \
  --rank-column TATSAECHLICHER_RANGSPALTENNAME \
  --output /externe/ausgabe/AT
```

Ohne Rangspalte gilt die tatsächliche CSV-Zeilenfolge; dann `--rank-column` weglassen.
Spaltennamen zuerst aus der echten Datei lesen, nicht raten. stdout enthält nur
eine Zählzeile. Der Starter ist kein Massenimport; spätere Vorschläge brauchen
weiterhin amtliche Quellenqualifikation und den normalen V3-Importweg.

## Tatsächliche Evidenz dieser Lieferung

Neun lokale Node-Tests erfolgreich: rein künstliche Dateibäume, CSVs und Factory-
Fixtures. Der zusätzliche Core-Test verwendet die echte V3-Factory und ist über
das unveränderte `lib/**/*.test.ts`-Muster eingebunden. Dessen Ausführung erfolgt
im einzigen normalen CI-Lauf; kein vorausgenommener CI-PASS. Lokal fehlen die
vollständigen Repository-Abhängigkeiten; deshalb keine behauptete lokale
Gesamt-Typecheck-/Build-/Originaldaten-Abnahme. Keine frühere grüne CH→DE-Prüfung
wiederholt. Eigene Root-Quellprüfung, kein unabhängiger zweiter Reviewer behauptet.

**Realer Input fehlt im aktuellen Zugriff:** weder das 206×50-Archiv noch
`passport-priority.csv` waren im Mount, in gezielter Repo-/Issuesuche oder im
persönlichen Übergabekontext auffindbar. Das alte CH-only-Archiv wird nicht als
50-Pass-Recherche eingesetzt. Bisher **0 reale Zielpakete** erzeugt, **0 neue
Fakten** akzeptiert. Erstes offenes Arbeitselement ist der tatsächliche Datei-
zugriff, danach AT komplett und die kanonischen Quellen-/Anwendbarkeitsprüfungen.

Weitere vorbereitete Arbeit in diesem selben, nicht veröffentlichten Paket:
- `research-notes/2026-11-16/CH-DE-and-AT.md`: amtliche zusätzliche Kandidaten,
  ausdrücklich keine akzeptierten oder frisch gebundenen Quellenfakten.
- `SAVED_OFFERS_PRODUCTION_DECISION_2026-11-16.md`: bestehende Migration, echte
  Read-only-Bestandszählung und noch offene additive BG1-Komposition. Kein Apply.

Nur neue eigene Dateien; keine Änderung von Admin #1213, Reiseoberfläche #1198,
Migration, Auth, Rollen, Guard, Types, Quellenprogramm, CI oder Abhängigkeiten.
