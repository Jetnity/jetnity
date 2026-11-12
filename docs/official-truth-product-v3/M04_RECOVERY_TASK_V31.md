# M04 Recovery V31 — R40 canonical selector repair / Generation4

**Current version: V31 v2, 12 November 2026.** The Product Owner has explicitly approved Generation4 and the permanent unreachable-session succession exception. The author/session HOLD quoted in the complete historical v1 below is superseded only by the following v2; all source/security/runtime criteria remain binding.

## M04 V31 v2 — Product-Owner-Freigabe der tatsächlichen Generation4-Nachfolge

Der Product Owner hat am12.11.2026 ausdrücklich entschieden: **Generation4 übernimmt V31 sofort als unmittelbaren Review-Fix**, mit vollständiger Übernahme der bisherigen Nachweise, unveränderten Sicherheitsgrenzen, unabhängigem Technical-Lead-Review und vollständigem Re-Gating. Der Autor-/Session-HOLD aus [V31 v1](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6811736678) ist damit aufgehoben; alle fachlichen Scope-/Diff-/Abnahmekriterien dieses Auftrags bleiben bestehen.

Neuer tatsächlicher Implementierer: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation4**. Neue, eigenständige Session: `/root/m04_durable_jobs_writer_g4`. Keine Wiederaufnahme von G3 wird behauptet. Ursprung bleibt G3 `/root/m04_durable_jobs_writer_g3`, deren direkter Follow-up “live agent path ... not found” meldete.

**Neue dauerhafte Owner-Regel:** Ist eine ursprüngliche Session nachweislich nicht mehr erreichbar, darf der Technical Lead künftig ohne erneute PO-Rückfrage eine klar benannte neue Generation/Session einsetzen. Nichtverfügbarkeit, neue Identität, vollständige Evidence-Übernahme und unveränderte unabhängige Abnahme werden dokumentiert. Der gleiche erreichbare Autor/dieselbe Session bleibt für unmittelbare Review-Korrekturen der Normalfall. Diese Regel erteilt keine Ready-/Merge-Befugnis an Agenten und hebt keine Plattform-/Sicherheitsgrenze auf.

Als eng begrenzte Governance-Ergänzung wird `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` um diese ausdrückliche Ausnahme ergänzt; sonstige Regeln bleiben erhalten. Root verantwortet Governance-/Continuity-Persistenz und unabhängige Publikation. Generation4 erstellt die konkrete V31-Source-Korrektur mit Kandidatenblobs und vollständiger Übergabe; **kein eigener Ref-Update, kein CI-Rerun, kein Ready, kein Merge**. Root veröffentlicht erst nach unabhängigem Source-Review einen neuen Head.

Frisch verifiziert: main `8b479a24b43b28aad12fc73748ceffba5a1d73ee`; #1184 OPEN/DRAFT bei `b01cd488c6d652129a2b8baa23b1a88b812a2111`. R39 bleibt niemals mergebar. Keine Hosted-Operation, kein Auth-Log und kein Wiederholen/Umleiten der#917/#1131-Sperren sind Bestandteil dieses Auftrags.

## Concrete immutable author delivery

Source-only commit `b54ae82183fc5f91b02b2ac17f277a3e72cad704`, parent `b01cd488c6d652129a2b8baa23b1a88b812a2111`, tree `76482b4e342645c156b3f719057e3d16f7ad92a3`. SQL blob `7021673c611b0b2cc5dc62cbd5dccb92e5024837`; exact restored Native `0b3f7d9906687ec42171de5af60fed009d07b39f`. Complete 18-source aggregate `f9f0bfaf2476692119f63e474bb61988bc0d50bb3c4518b96ee4987ef56e40e2`. No author publication or project execution. Root owns the bounded status/governance integration, independent package review, expected-head publication and all release gates.

Read [Root source review](M04_RECOVERY_ROOT_REVIEW_V31.md), [complete R39 evidence and R40 plan](M04_RECOVERY_R39_EVIDENCE_AND_R40_PLAN_V31.json) and current [M04 handoff](M04_HANDOFF_V1.md). This package does not claim an as-yet-unknown publication hash or runtime result; subsequent exact-head receipts are on PR #1184 and continuity #751.

---

## Complete historical V31 v1 retained

# M04 RECOVERY TASK V31 v1 — enge Reparatur nach vollständiger R39-Diagnose

**Status: KONKRETISIERTER UNMITTELBARER REVIEW-FIX; IMPLEMENTIERUNG AN AUTOR-/SESSION-GATE GEHALTEN. Kein neuer Produktslice.**

## 1. Ziel und aktuelle Entscheidung

Die unveränderte R38-SQL-Korrektur scheiterte im nicht instrumentierten Lauf43127654239 bei24/31 Gruppen am240s-Effektlimit. Die einmalige R39-Diagnose43132314920 besteht alle31 Gruppen bei203811ms Effektzeit plus231ms Cleanup und liefert vollständige Funktionsmessungen. Das ist keine Erklärung oder Behebung der vorausgegangenen Laufzeitvariabilität.

Root akzeptiert die Diagnose-Evidence gemäß [Exact-Head-Review5867653011](https://github.com/Jetnity/jetnity/pull/1184#pullrequestreview-5867653011). **R39 bleibt niemals Ready oder mergebar.** Der unmittelbare nächste Reparaturansatz reduziert die Kosten der vorhandenen positiven Auswahl in `canonical_v1`, ohne irgendeinen Validierungs-/History-/Security-Nachweis zu überspringen. Der genaue interne Kostenanteil dieser Auswahl wurde nicht separat gemessen; dies ist eine eng begrenzte Implementierungshypothese, keine zugesagte Beschleunigung.

## 2. Verbindliche Autorbindung

- Ursprünglicher Implementierer: **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation3**.
- Ursprüngliche Session: `/root/m04_durable_jobs_writer_g3`.
- Tatsächlicher unmittelbarer Follow-up-Versuch: **“live agent path ... not found”**. Die Session ist im aktiven Dienst nicht erreichbar.
- Dieser Auftrag gestattet keine stillschweigende Ersatzimplementierung und keine fiktive Wiederaufnahme. Der vom Nutzer ausdrücklich verlangte Same-Agent-/Same-Session-Review-Fix gilt.
- Implementierung erst nach unterstützter Wiederherstellung dieser Session; falls unmöglich, nach einer ausdrücklich dokumentierten eng begrenzten Ausnahme für diesen einen unmittelbaren Review-Fix mit wahrheitsgemäß benanntem Nachfolger. Vorgeschlagene Nachfolge wäre **Jetnity Official Truth V3 Durable Jobs1 — Codex Generation4**, neue dedizierte Session `/root/m04_durable_jobs_writer_g4`; sie ist **nicht gestartet oder als genehmigt ausgegeben**.
- Die fünf CH→DE-PO-Schritte einschließlich Dev und einmaliger D1-Genehmigung sind bereits freigegeben und werden nicht erneut zur Entscheidung gestellt. Diese noch offene Frage betrifft ausschließlich die abweichende unmittelbare Autor-/Sessionfortsetzung.

Die Originalbelege bleiben vollständig erhalten. Ein Nachfolger müsste Source, Task, R38-Fehler und R39-Messung selbst rekonstruieren; Root und unabhängige Reviewer führen das abschließende Review. Kein Agent setzt selbst Ready oder merged.

## 3. Exakte Basis

- Repo: Jetnity/jetnity; PR#1184; Branch `fix/official-truth-v3-m04-postmerge-r36-20261111`.
- Erwarteter aktueller Head: `b01cd488c6d652129a2b8baa23b1a88b812a2111`; Tree `9f8ae4884276fddd978a5f42bd4643a29d69bc97`.
- Aktuell geprüfter main/Merge-Base: `8b479a24b43b28aad12fc73748ceffba5a1d73ee`;5ahead/0behind. Vor Publikation erneut live prüfen.
- SQL: `scripts/db/official-truth-v3-durable-jobs-1/jobs-candidate.sql`, blob `1bb764344f22569dec9d3320667e0125d64c1cbf`,161095bytes, SHA-256 `868778c647464bf51ff179e39b86c2f4d6771cad07998165898f2f222e5fa84a`.
- Aktueller Diagnose-Native: blob `15923a09e760438a9e62a534aa757a11317c23a5`,206062bytes.
- Wiederherzustellender ursprünglicher Native: blob `0b3f7d9906687ec42171de5af60fed009d07b39f`,191098bytes, SHA-256 `f5d849c643ff22d264bc9adc1a7cd65f12caaac80a804647604851f22effbde0`.
- Aktuelles18-Quellen-Aggregat: `bc01075a7422e82745feed7dfcaa0460b43193e3f60c8a224d50d5e2f2ce2e2f`. Alle Quellen sind im unveränderten V30-Paket gepinnt. Ein neuer Kandidat erhält ein neu berechnetes vollständiges Manifest.

## 4. Messgrundlage und Reparaturgrenze

Im vollständigen256erLedger:209257 kanonische Aufrufe /29339.716ms gemessene Selbstzeit. In64Zyklen samtGrenzprüfung:339336 Aufrufe /38154.166ms. Insgesamt548593 /67493.882ms. Die Ledger-Präfixe64/128/192/254 ergeben exakt14656/53888/117696/202946 Aufrufe, entsprechend `3*n*n+37*n`.

Das belegt häufig wiederholte Arbeit, keinen Größenschwellenwechsel. Die8192-Byte-Grenze wird **nicht** angehoben. Inklusive Zeiten dürfen nicht addiert oder als CPU-Zeit ausgegeben werden; frühere andere Läufe sind keine kontrollierte Vergleichsmessung.

Ein möglicher Ansatz ist, nach den unveränderten No-backslash-/ASCII-Guards die strukturellen Wertgrenzen der tatsächlichen JSONB-Ausgabe zur begrenzten positiven Auswahl zu verwenden, statt jedes Mal alle quotierten Tokens durch `regexp_replace` zu entfernen und weitere vollständige Zwischenstrings anzulegen. **Die Zulässigkeit dieses Ansatzes muss erst bewiesen werden.** Wenn der Gleichheits-/Subset-Nachweis nicht gelingt, keine Erweiterung oder spekulative Alternative implementieren; Root erhält den konkreten Gegenbeleg.

## 5. Erlaubter Diff

1. In der bestehenden SQL-Datei ausschließlich die positive Auswahl innerhalb `official_v3_jobs_private.canonical_v1(jsonb,integer)` und dafür unmittelbar notwendige lokale Deklarationen ändern. Die flache und rekursive positive Ausgabe selbst bleiben exakt; der ganze ursprüngliche **7778-Byte-Fallback ab `  CASE jsonb_typeof(v)` bis vor `CREATE FUNCTION ...wire_v1` bleibt bytegleich**.
2. `scripts/db/official-truth-v3-durable-jobs-1/native.ts` exakt auf den oben genannten ursprünglichen Blob wiederherstellen. Keine anderen Änderungen an31Beweisen, Quoten, Timing, Cancellation, Recovery oder Cleanup.
3. Ausschließlich die bestehenden aktuellen Status-/Handoff-Blöcke sowie eine versionierte V31-Task-/Review-/Evidence-Aufzeichnung aktualisieren. Frühere V27–V30-Dateien, vollständige Original-Handoffs und alle außerhalb der Marker liegenden Inhalte erhalten.

Alle anderen16geschützten Quellen bleiben exakt. Alle29SQL-Funktionssignaturen, Eigentümer-/Security-/search_path-Eigenschaften und die anderen28Funktionskörper bleiben gleich. Keine neuen Funktionen/Objekte, kein Namespace-/Owner-/ACL-/RLS-/Methoden-/Authority-Diff, kein Workflow-/Paket-/CI-Routing-Diff.

## 6. Vor Review vorzulegender Gleichheitsnachweis

Die neue positive Auswahl darf keine Eingabe zulassen, deren kanonische Bedeutung, Ausgabe, Tiefe oder Zahlengenauigkeit von der vorherigen sicheren Auswahl abweicht. Alte sichere Fallback-Pfade bleiben verfügbar.

Der Review muss insbesondere nachvollziehbar abdecken:

- strukturelle Trenner gegenüber identischem Text innerhalb von ASCII-Schlüsseln und Stringwerten; Doppelpunkte, Leerzeichen, Kommas, Klammern, Ziffern, Punkt, Minus-Null und `{,` als Stringinhalt;
- Quotes/Backslashes/Unicode sowie weitere bisher ausgeschlossene Zeichen;
- negative und positive Integer,16stellige Zahlen, Skalierung/Dezimaldarstellung, Grenzwerte und die unveränderte sichere Fallback-Behandlung;
- Arrays auf jeder Tiefe, leere/nichtleere verschachtelte Objekte, Tiefe23/24/25 und die unveränderte8192-Byte-Grenze;
- exakte C-Sortierung, vollständige Validierung, gleiche Fehlersemantik und kein gelockerter Wire-/Node-/Duplicate-Key-Vertrag.

Kein Memoisieren über Operationsgrenzen, kein Vertrauen in frühere History-Validierung, keine Reduktion wiederholter Safety-Checks und keine Absenkung der256/64-Grenzen. Wenn zusätzliche ausführbare Regressionsevidence erforderlich ist, zuerst einen minimalen konkreten Pfad-/Testvorschlag an Root geben; die Wiederherstellung des Original-Native bleibt exakt. Keine ungeprüfte Scope-Erweiterung.

## 7. Execution und Abschluss

Bestehende Grenzen gelten: kein lokales Projekt-/Parser-/SQL-/Native-/Socket-/Build-/Test-Execution, keine Ersatzumgebung/Installation/Downloads/Clones/Git-Push. Die bereits geprüfte GitHub-CI ist die einzige Projektausführungsfläche. Keine Hosted-DB/Auth/RLS/ACL/Migration, keine Auth-Logs, kein Wiederholen oder Umleiten der#917/#1131-STOPs.

Vor neuer Publikation liefert der gebundene Autor einen konkret reviewbaren Kandidaten mit vollständigem Diff, Quellenpins, Gleichheitsnachweis und ehrlicher Self-Review. Root führt unabhängiges Source-/Scope-Review und frische main/Exact-Head/Owner/Thread-Prüfung aus. Nur erwartungsgeschützte, nicht erzwungene Veröffentlichung.

Nach tatsächlicher Source-Korrektur: ein neuer Head und vollständige erforderliche CI/Preview/Review-Gates. Alle31Gruppen, voller256erLedger,64Starts/65.Refusal, beideR9-Races,761Guardpaare/min4182Owned, Cleanup, sechsBegleiter und Build müssen tatsächlich nachgewiesen sein. Limits240000/60000/300000ms unverändert. Ein bloßes Entfernen der Diagnose mit identischem R38-Ausführungscode ist kein Reparaturnachweis und kein ausgewählter Rerun.

Erst nach vollständigem Root-PASS darf ein normaler Reparatur-PR Ready/mergebar werden. Anschließend tatsächliches main und exakte Production prüfen. Das aktiviert noch keine öffentliche CH→DE-Antwort und hebt keinen separaten Plattform-STOP auf. Kein automatischer anderer Slice.

## 8. Vollständige Belege

- [R38 CHANGES REQUIRED](https://github.com/Jetnity/jetnity/pull/1184#pullrequestreview-5867339258)
- [R39 Root-Abnahme der Diagnose mit vollständigem Native-Receipt](https://github.com/Jetnity/jetnity/pull/1184#pullrequestreview-5867653011)
- [Profil1/2](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6811613055), [Profil2/2](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6811615670)
- [Begleit-Evidence1/2](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6811634095), [Begleit-Evidence2/2](https://github.com/Jetnity/jetnity/pull/1184#issuecomment-6811636578)
- [D1 Readiness](https://github.com/Jetnity/jetnity/pull/1169#issuecomment-6810794730), [aktuelle amtliche Quellenbeobachtung](https://github.com/Jetnity/jetnity/pull/1169#issuecomment-6811398824), [#1131 tatsächliche aktuelle Divergenz/STOP](https://github.com/Jetnity/jetnity/pull/1131#issuecomment-6811513208)

**Exakter erster noch offener Schritt: legitime Autor-/Sessionfortsetzung für diesen konkreten unmittelbaren V31-Reparaturauftrag. Ein ausführender Ersatzagent ist nicht gestartet.**
