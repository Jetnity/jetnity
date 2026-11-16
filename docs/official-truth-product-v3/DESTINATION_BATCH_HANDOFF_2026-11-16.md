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
stoppen. Das **tatsächliche** Archiv hat 206 Zielordner (204 ISO2 + Sonderregionen
`CN-HK` und `CN-MO`) und 54 ergänzende `.json`-Sidecars. Der Reader
unterscheidet Zielland-Ordner von ergänzendem Länder-Shell, bindet einen
passgenau geprüften Sidecar zusätzlich mit Hash und verweigert fremde Aliasse.
Ein reines 206-Dateien-Layout ist ebenfalls kontrolliert erlaubt. Die zwei
Sonderregionen bleiben als eigenständige Destinationen **nicht V3-übertragbar**,
solange die kanonische V3-Zielland-Schnittstelle nur ISO2 akzeptiert; keine
heimliche Umdeutung zu CN und keine Veröffentlichung.
Es wird nichts stillschweigend konvertiert. Neue Ausgabe ausserhalb der Recherche,
kein Überschreiben; der Abschlussmanifest wird zuletzt geschrieben.

Ausführung im normalen Repository mit vorhandenen Abhängigkeiten, **ausserhalb Chat**:

```sh
node --import ./scripts/server-only-test-register.mjs --import tsx \
  scripts/official-truth-destination-batch.mjs \
  --research-root /gesichert/entry-requirements --destination AT \
  --passport-column nationality_iso2 --rank-column rank \
  --output /gesichert/ausgabe/AT
```

Die tatsächliche CSV hat die sechs Spalten `rank,nationality_iso2,name,score_basis,sources,notes`.
Ein nach Namen und SHA verifiziertes Archiv muss zuerst sicher im Ordner
`/gesichert/entry-requirements` entpackt sein; keine automatische Extraktion im
Starter. stdout enthält nur
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

**Originaldaten am 16.11. wiedergefunden und unabhängig verifiziert:**
ChatGPT Library `/jetnity-einreise-206-ziele.tar(1).xz` (2.764.784 Bytes,
SHA-256 `6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5`).
Archiv-Wurzel `entry-requirements/`; 206 Zielordner (204 ISO2 + zwei
Sonderregionen) mit je allen 50 CSV-Pass-Slices und `index.json`, plus 54
zusätzliche per-Land- und Gebiets-JSON-Sidecars. Der bisherige Reader zählte
die 54 Sidecars irrtümlich als zusätzliche Zielorte; mit dem belegten
Verzeichnis-/Sidecar-Modell im selben Korrekturpaket behoben. Keine gefährlichen
Tar-Pfade/Links bei der Metadatenprüfung. Originale `passport-priority.csv` hat
50 Datenzeilen, sechs Spalten und 112.228 Bytes; SHA-256
`4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358`.
Die zehn vorgegebenen ersten Pässe sowie CH-Beteiligung bestätigt. Die anfängliche
64-KiB-CSV-Grenze war **zu klein für das echte Original**; auf 128 KiB begrenzt
korrigiert und mit synthetischer breiter CSV im selben Core-Test verankert.
Datenzugriff hier ist kein Dev-/CI-/Quellenqualifikationsnachweis. Originalarchiv
liegt weiterhin RESEARCH_ONLY in der Library, nicht in Production oder im Repo.
**0 real generierte Zielpakete / 0 neue akzeptierte Fakten / keine Veröffentlichung.**
Erster offener Schritt nach grüner CI: Archiv im gesicherten Dev-Workspace über
nachgewiesene Bytes extrahieren; dann AT mit der echten Factory per einem Befehl
erzeugen und unabhängig auf 50 Pässe/26 Themen/0 Facts prüfen. Erst danach
amtliche Quellen-/Methodenprüfung vor jedweder inhaltlichen Freigabe.

Weitere vorbereitete Arbeit in diesem selben, nicht veröffentlichten Paket:
- `research-notes/2026-11-16/CH-DE-and-AT.md`: amtliche zusätzliche Kandidaten,
  ausdrücklich keine akzeptierten oder frisch gebundenen Quellenfakten.
- `SAVED_OFFERS_PRODUCTION_DECISION_2026-11-16.md`: bestehende Migration, echte
  Read-only-Bestandszählung und noch offene additive BG1-Komposition. Kein Apply.

Nur neue eigene Dateien; keine Änderung von Admin #1213, Reiseoberfläche #1198,
Migration, Auth, Rollen, Guard, Types, Quellenprogramm, CI oder Abhängigkeiten.
