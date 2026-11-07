# Official Truth Atomic Version Refresh 1 — TL Amendment R4

Stand: 2026-11-07. Issue #1152, Draft-PR #1153. Unmittelbare CHANGES REQUIRED desselben begrenzten Auftrags, kein Folgeslice.

Autor **Jetnity Official Truth Atomic Version Refresh 1 — Codex Generation 1**, tatsächliche Session `/root/atomic_version_refresh_writer`. Nur Root veröffentlicht und entscheidet PASS/Ready/Merge.

## 1. Tatsächlicher Eingang und feste Baseline

Veröffentlichter Parent `a3cbe8e1958120009b0b61386d345f9fb23355d0`, Tree `10b6d7ff26d0c6e763a896ec227fd439830c29ee`. Main weiterhin `a2a3f175670dd7744dbb56ed81fee70c38bbdf38`, Tree `2e8c1e12ffe3bfa794ec9f8a41089f901bff6098`. TASK V1 und R1/R2/R3 bleiben unverändert.

[Original CI42406185000 / Native128504273777](https://github.com/Jetnity/jetnity/actions/runs/42406185000/job/128504273777): Parent206.132,303358 ms,0 pass/1 fail/0 cancelled/0 skip. Fünf echte Fresh-Ausführungen und Primary-Coexistenz, vorangehende Negativfälle sowie tatsächlicher P7701 nach Bind bestanden. Die anschließende Transaktion erreichte den erwarteten tatsächlichen P7702 nach Supersede nicht; beobachtet wurde57014, ungefähr25,4 Sekunden nach der vorherigen Phase. Der Server setzt unverändert25s Statement-Timeout. Die innere Abbruchphase ist nicht separat gemessen. [Root-Befund](https://github.com/Jetnity/jetnity/pull/1153#issuecomment-6712034937).

Auf dem Vorgänger `2dfc9bb...` waren Primary/Composed mit vollständigem ACK/Producer-Ende/Readback erfolgreich, SQL19.975,833/23.325,841 ms. Das ist keine ausreichende Laufzeitreserve für beliebige Runner. Der letzte Lauf war bereits in tatsächlichen Fresh-Ausführungen und Publish-Probe deutlich langsamer. **JIT ist eine begrenzte Performancehypothese, bisher keine nachgewiesene Ursache.** Keine Wiederholung bis zufällig grün.

Zusätzlicher unabhängiger Quellbefund: Das bisherige12s-Race-Fenster beginnt vor beiden vollständigen Old-Reads/New-Projektionen und vor der tatsächlichen Publisherarbeit. Es misst daher nicht ausschließlich die beabsichtigte Writer-Lock-Phase.

## 2. Exakt ausgewählte zusammenhängende Korrektur

### A. Nur die neue Funktion erhält ein festes Ausführungsprofil

An ausschließlich `official_original_api.refresh_version_v1(...)` in der neuen `refresh-candidate.sql` ein festes Funktionsattribut **`SET jit=off`** ergänzen. Der gesamte bisherige SQL-Funktionsbody bleibt bytegleich. Alle bestehenden Helperaufrufe, vollständigen Closure-Prüfungen, Locks, Grants, Ereignisse, Auditwerte, Bedingungen, Fehlercodes und Reihenfolgen bleiben erhalten.

Keine Änderung an alten Funktionen, ihrer Definition, ACL oder Konfiguration. Keine Session-/Cluster-/System-/Hosted-Konfigurationsänderung durch den Kandidaten, kein neuer generischer Konfigurationsparameter. Die Einstellung gilt nur beim Aufruf dieser neuen Funktion; der vorherige Sessionwert muss danach erhalten sein.

Maßgebliche PostgreSQL16-Semantik:
- [Funktionsgebundene SET-Parameter und Wiederherstellung](https://www.postgresql.org/docs/16/sql-createfunction.html)
- [JIT-Plan-/Ausführungsentscheidung und mögliche Kompilierungskosten](https://www.postgresql.org/docs/16/jit-decision.html)

Die Dokumentation begründet den begrenzten Mechanismus, keinen gemessenen Jetnity-Speedup. Keine Entfernung von initialem/finalem Full-Corpus-Lookup, vollständigem Old-Reproof nach Bind oder New-Reproof. Keine Cache-Abkürzung über unterschiedliche Authority-/Currentness-Punkte.

### B. Tatsächlicher begrenzter Nachweis der Hypothese und der Profilgrenze

Nur im bereits vollständig eigenen wegwerfbaren Native-Cluster:
- Fest diagnostizieren, ob JIT verfügbar ist und welcher Sessionwert vorher gilt.
- Genau ein festes Paar vollständiger `verify_retained_v2`-Prüfungen desselben unveränderten gespeicherten Old-Receipts auf zwei frischen ausschließlich owner-lokalen Verbindungen desselben Clusters: einmal mit explizitem nur transaktionslokalem JIT-on, einmal mit JIT-off. Jeweils tatsächliche Dauer und normalisierte Einstellung; anschließend ROLLBACK, ursprünglicher Sessionwert und unveränderte Deadlines/Zustand nachgewiesen. Beide konkreten Probe-Backends schließen und ihre Abwesenheit prüfen. Kein zusätzliches track_functions-/EXPLAIN-/Profiling-Framework.
- Kein Loop/Retry, keine Speedup-Assertion, keine verkleinerte Capsule, kein Auslassen bei ungünstigem Ergebnis. Keine Rohpläne, SQL-Parameter, Schlüssel, Originale oder unnormalisierte Fehler in Diagnostiken.
- Native Installation prüft exakte neue Proconfig einschließlich jit=off bei unverändertem Owner/Definer/leerer search_path/UTC.
- Erfolgspfad und tatsächliche Fehlerpfade belegen die lokale Wirkung und Wiederherstellung, soweit mit den bestehenden Test-Hooks ohne Runtimeänderung prüfbar. Keine vorgetäuschte Messung aus bloßer Quelldeklaration.
- Die bestehende vollständige positive/negative Matrix bleibt der maßgebliche Laufzeit-/Korrektheitsnachweis. Das A/B-Paar allein ist kein PASS und beweist keine allgemeine Beschleunigung.

Ein fehlender ausreichender Laufzeiteffekt wird ehrlich als CHANGES REQUIRED zurückgegeben; keine autonome zweite Optimierung außerhalb dieser Auswahl.

### C. Race an die tatsächlichen drei Akteure binden

Den separaten unveränderten #1151-Old-Reader und beide vollständigen Coordinator-Preflights parallel starten. Beide minimalen Writer werden erst NACH vollständigem kanonischen Old-Read und New-Projektion an ihrem tatsächlichen Connect angehalten, noch VOR BEGIN und Refresh-SQL.

Die Akteure müssen ausdrücklich und stabil unterscheidbar sein, beispielsweise durch testlokales AsyncLocalStorage mit genau drei festen Labels. Je Coordinator wird ausschließlich der erste minimale Producer-Connect einmal angehalten; spätere Verbindungen zur Abgangskontrolle dürfen das Gate nicht erneut treffen. Ein gemeinsamer globaler Originals-Zähler darf keinen Coordinator-Preflight als separaten SHARE-Reader anhalten.

Erst wenn beide Writer ihre echten Connect-Barrieren erreicht haben und der gesonderte Old-Reader seine tatsächlich erfolgreiche finale Originals-Abfrage mit gehaltenem SHARE-Lock erreicht hat, beide Writer freigeben. Das bestehende12s-Beobachtungsfenster beginnt an der tatsächlichen Writer-SQL-Dispatchphase. Zwei echte konkrete Producer-PIDs müssen blockiert beobachtet werden: einer am Publikations-Advisory-Lock, einer am durch den echten Reader gehaltenen Head. Erst danach SHARE freigeben.

Früh zurückkehrende Coordinator-/Reader-Ergebnisse müssen unerreichte Barrieren sichtbar abbrechen. Im Fehlerpfad Barrieren lösen, gestartete Promises vollständig abwarten und konkrete Backends/Locks kontrolliert schließen; keine offenen unbeobachteten Promises bis zum900s-Parent.

Die vorhandenen positiven/negativen Race-Erwartungen bleiben vollständig: alter Reader sieht Old, genau ein tatsächlicher Writer gewinnt, ein Auditübergang, genau ein neuer Accepted-Event, kein Receipt des Verlierers, Fresh-Witness-Old-Contender wird verweigert, Geschichte bleibt erhalten und Locks/Backends werden nachgeprüft.

Keine neue äußere Autorität nach Start eines Coordinators, kein `align`/Checkpoint/Witness-Refresh innerhalb einer Operation. Alle tatsächlich früher erfassten Currentness-Grenzen bleiben erhalten. Der korrigierte Testaufbau garantiert noch keinen Laufzeiterfolg.

### D. Die noch offene Gesamtmatrix zusammen abschließen

Die drei Head-Wait-Fälle, echte verzögerte Guard-Probe700/3500/3000, Reader-/Writer-Race und vier Terminalfälle müssen vollständig laufen. Wahrheitsgemäße Unterscheidung:
- Verlust der Helper-Rückgabe nach wirklichem ACK ist keine behauptete Wire-Paketverlustprobe.
- Tatsächlich fehlender New-Reader nach ACK ist nichtpositiv.
- Tatsächlich erfolgreiche, bis nach den früheren Bound verzögerte Cleanup-/Reader-Antworten bleiben nichtpositiv.
- Unabhängige frische Nachprüfung beweist jeweils, was wirklich persistiert ist; kein automatischer Replay, Undo oder positiver Old-Fallback.

## 3. Erlaubte Dateien und eingefrorene Grenzen

Genau folgende vorhandenen Autoren-Dateien dürfen für diese Korrektur verändert werden:
1. `scripts/db/official-truth-atomic-version-refresh-1/refresh-candidate.sql`: ausschließlich das oben definierte neue Funktionsattribut; SQLbody und sonstige DDL bytegleich. Alter Blob `5b4ad25806776c82357296362d33451b496bc052`.
2. `scripts/db/official-truth-atomic-version-refresh-1/native.test.ts`: begrenzte Profil-/Akteur-/Barrieremessung und korrekte Abschlussbereinigung. Alter Blob `5bf0b03717ecdbbdf85c881945fd73b6814c050b`.
3. `docs/OFFICIAL_TRUTH_ATOMIC_VERSION_REFRESH_1_HANDOFF_2026-11-07.md`: tatsächliche neue Befunde, exakte Änderungen und offene Gates. Alter Blob `1b0ff9ae7719e652dfbb3e54fb2dbd7cd25fdeaf`.

Keine Änderung am Coordinator `refresh.ts`, Driver `pg-wire.ts`, Producer `engine.ts`, alten Tests/Readern/Migrationen oder irgendeinem vorhandenen Basishelper. Kein Dependency-/Workflow-/Setup-/App-Diff. Keine zusätzliche neue Produktionstest-Schnittstelle.

Alle Grenzen bleiben unverändert: Statement25s, Lock15s, Idle-Transaktion20s, Legacy-/maximaler Commit20s, Recovery2s/5s, Reader/Currentness60s, Coordinator120s, neuer Native-Parent900s. Keine Capsulereduktion, Erwartungslockerung, versteckten Skips oder Wiederholung auf günstigere Hashordnung/Runner.

TASK V1, R1, R2, R3 und dieses von Root versionierte R4 sind Autoren-schreibgeschützt. Root teilt den unveränderlichen R4-Commit/Blob und den Publication-Parent vor Implementierungsbeginn mit. Aktuellen Branch nicht selbst bewegen; keine Remote-Schreibaktionen.

## 4. Lieferung und vollständige Abnahme

Vollständiges eingefrorenes15-Datei-Manifest und exaktes höchstens3-Datei-Deltamanifest mit alten/neuen Git-Blobs, SHA256 und Größen liefern. Alle übrigen gepinnten Dateien unverändert bestätigen. Keine pauschale Veröffentlichung des partiellen Arbeitsverzeichnisses.

Lokale Ausführbarkeit ehrlich berichten; keine fehlenden Frameworks durch Stubs ersetzen. Native Nachweis nur durch echte ausgeführte vollständige CI auf dem finalen Tree. Neue exakte Core-/Persisted-Native-/Refresh-Native-/Auth-/Aggregate-/Hygiene-/Build-/Preview-Gates, aktuelle Reviewthreads und Main-Bindung erforderlich. Kein früherer PASS wird übertragen.

Nach Lieferung RETURN / STOP, kein automatischer Folgeslice. Bei erneutem materiellem Befund dieselbe Session und ausdrückliche nächste TL-Entscheidung.

## 5. Unveränderte Produkt- und Plattformgrenzen

Nur fiktiver Corpus, keine reale Rechtsänderung/AA-Auskunft, keine App-/Provider-/Pilot-/Production-Aktivierung. Stage1 APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, tatsächliche Ledger-ID UNKNOWN; Stage2 NOT_ATTEMPTED. Keine Hosted-SQL-/Readback-Wiederholung oder Umleitung, keine behauptete neue Plattform-Clearance. #1131 und alle anderen gehaltenen Arbeiten bleiben separat. Cursor pausiert; keine Kosten-/Account-/Environment-/Deployment-Einstellungsänderungen.

Das vollständige eigene persistente/versionierte/aktualisierbare Datenbankprodukt bleibt Hauptauftrag. Dieser begrenzte Abschluss löst nicht die realen A–F-Gates auf #917/#1139 und ist keine Voraussetzung für den ersten current-request-only CH→DE-Piloten.
