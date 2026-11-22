# CH→DE Zyklus 12 — getrenntes Production-Prüfpaket, 22.11.2026

**Status: vorbereitet, nichts ausgeführt.** Der konkrete nächste Freigabeumfang ist ein einzelner READ-ONLY-Bindungsauftrag. Der geschützte Abschluss und ein späterer Wiederanlauf sind noch nicht installationsbereit und erhalten eigene gebundene Dateien, native Prüfbelege und ein separates Go.

## Entscheidung in fünf Zeilen

1. Zyklus 12 blockiert nach acht signierten Resume-HTTP503; Dispatch 39 ist `unresolved`, 40 `unavailable`, 41–46 `unresolved`. Die Antworten stammen vom Jetnity-Importendpunkt; die ursprüngliche Laufzeitursache ist noch nicht bewiesen.
2. Vorgesehen sind eine unveränderliche, echt Owner/AAL2-bestätigte Abschlussquittung, eine exakt zugeordnete native CAS-Schließung und ein BG1-/Scheduler-Nachfolger; alte Zyklen, Belege, Quotas und HTTP-IDs bleiben erhalten.
3. Abschluss/Owner-Quittung lassen das neue Dispatch-Gate geschlossen; erst ein separates Wiederanlauf-Go darf genau einen neuen natürlichen Zyklus samt begrenzter Fortsetzung erlauben.
4. Jetzt zur separaten Prüfung: `00-cycle12-bindings.READONLY.sql`, SHA-256 `e642250349a993d8f70c805e52e02646d957301ec0e6f8951dbc85d32559535f`; Manifest-SHA-256 `7110bc2fb5b77638acaf20f35044faddf8e2c91df469c197e35c1a273ae07f1f`. Genau ein Read/ROLLBACK innerhalb von fünf Minuten, keine Ausführung bisher.
5. Vor COMMIT vollständiges ROLLBACK; bei unklarem COMMIT STOP; späterer Schutz/Rückbau nur separat gebunden und freigegeben, ohne Historienlöschung. AT bleibt „derzeit nicht verfügbar“.

## Vollständige Dateien

- [Manifest](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-review-20261122/MANIFEST.json): vollständige SHA-256-Werte, Grenzen, Pflicht-/Optionalkatalogobjekte, Stopregeln und separater Freigabestatus.
- [Einziger SQL-Kandidat](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-review-20261122/00-cycle12-bindings.READONLY.sql): Cycle12-IDs, deterministische Job-/Claim-Zuordnung, Archiv-/Quittungshashes, bestehende native Autorität und frischer natürlicher BG1-Beleg, ausschließlich lesend.
- [Schreib-, Wiederanlauf- und Rückbauplan](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-review-20261122/01-WRITE-AND-ROLLBACK-PLAN.md): genaue spätere Änderungen, fehlende Bindungen, Autoritätsgrenzen, Dev-Abnahme und Schutz nach COMMIT.
- [Exakter Go-Text](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-review-20261122/GO-SCOPE.md): ausschließlich der einzelne READ-ONLY-Auftrag; kein verstecktes Installations-, Owner- oder Wiederanlauf-Go.
- [Ergebnisvertrag](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-review-20261122/02-RESULT-CONTRACT.json), [Quellen und bisherige Evidence](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-review-20261122/03-SOURCE-EVIDENCE.json), [Offline-Prüfgrenzen](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-review-20261122/04-OFFLINE-PREPARATION-CHECKS.json) und [Prüfsummen](../scripts/db/official-truth-chde-at-renewal-dev-20261121/production-chde-cycle12-review-20261122/SHA256SUMS).

## Aussagekraft und offene Bindungen

Der bisherige Runtime-Beleg stammt vom **22.11.2026, 11:54:53.145099 UTC**. Er ist kein neuer Read dieser Vorbereitung. Die einzige damals gezählte abgelaufene Lease war ein unzugeordnetes Aggregat aller geleasten `subjects_v1`-Zeilen; der Feldname `expired_research_leases` belegt keine CH→DE-/Cycle12-Zuordnung. Der neue Auftrag berechnet die im Code exakt definierten Enqueue-/Job-/Claim-IDs aus den ursprünglichen Cycle12-IDs und vergleicht die tatsächliche Zuordnung.

Die Dev-v6/v7-Belege dienen als Schutzmuster. Ihre sechs vorherigen und die spätere siebte Owner-Quittung, Dev-Cycle5-IDs, Zähler 15/53 und der damalige temporäre Rollen-Grant sind keine Production-Bindung. Der Production-Weg muss mit vorhandener nativer Autorität ohne SET ROLE/GRANT funktionieren; andernfalls bleibt der Schreibschritt gesperrt. Der gepinnte Katalogreader und die Schema-/ID-Ableitungen wurden unabhängig anhand unveränderter Repository-Dateien geprüft. Keine SQL-Datei wurde geparst oder ausgeführt; es gibt keinen behaupteten nativen Test dieses neuen Pakets.

Beide getrennten AT-/CH→DE-Vorbereitungen gehen vom installierten v4-Vorgänger `c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4` aus. Ändert ein später genehmigtes Paket diesen Stand, muss das andere Paket neu gebunden und mit neuen SHA-256 vorgelegt werden. Dieses Paket übernimmt keinen geänderten Katalog automatisch.
