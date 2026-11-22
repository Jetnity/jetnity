# CH→AT Production — Installationsspezifikation, nicht ausführbar

## Status und Ursprung

`NOT_READY_FOR_PRODUCTION_COMMIT`: Die einmalige Production-V1-Kataloglese wurde versucht, aber mit `42P01` abgebrochen, da `official_v3_at_private.whole_originals_v2` in Production **nicht existiert**; die tatsächliche Production-Variante und der BG1-Parent wurden **nicht ermittelt**. Die neue schema-tolerante Datei `01-PRODUCTION-CATALOG-V2.READONLY.sql` ist nur in Dev testgelesen, nicht Production. Das Production-Katalogbild ist nicht erfolgreich erneut gelesen und kein Production-Installations- oder Rücknahme-SQL wurde in diesem Paket erstellt. Die vorhandene natürliche Dev-BG1-Kette v9 → v10 → v11 → v12 ist kein direktes Production-Installationsskript. Sie referenziert Dev-Baselines und würde auf Production bewusst ablehnen. Ungeprüft übertragen wäre ein falscher Integritätsschutz.

Letztes **historisches**, nicht aktuelles Production-v4-HTTP-Allocator-Digest: `c847d8573ac8f62c2d163fcec7d8f0bde409574bd9ae7319e0bf97d99eb9c0a4` aus der bekannten Abnahme vom 22.11.2026. Dieser Wert darf ohne frischen Zielread nicht als gültiger heutiger COMMIT-Parent gelten. Production-CH→DE-Zyklus12 bleibt in eigenem gesperrten Programm; AT-Installation darf seine historischen Dispatches/Jobs oder die HTTP-ID-Sequenz nicht anfassen.

## Exakter fachlicher Umfang

**Nur:** gewöhnlicher gültiger Schweizer Pass, Schweizer Staatsangehörigkeit `CH`, Österreich `AT`, direkte Einreise, Visum nicht erforderlich. Die Aussage entscheidet nichts über Transit, Passgültigkeits-Sonderfälle, Einreiseformulare, Aufenthalt/Beschäftigung, Gebühren oder Gesundheitsfragen. Die übrigen 49 Passländer erhalten keine aus CH abgeleitete positive Antwort.

## Quellen und Identitäten

Drei Zielstaats-Quellen in `SOURCE_SCOPE.json` vollständig byte-/SHA-256-gebunden:
- BMI-Matrix, Edition 06.11.2026: 498415 Bytes, `fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778`.
- BMI allgemeine Grenz-/Einreisebedingungen: 91655 Bytes, `ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e`.
- BMEIA Bern neue Fassung: 172428 Bytes, `2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe`, technischer Monitorstatus **`changed`**. Die inhaltlich irrelevante Webdesign-/Menüänderung ist nur für die o.g. CH→AT-Regel freigegeben, nicht global und nicht als `unchanged` umzudeklarieren.

## Gebundener, append-only technischer Releaseumfang

- Eingrenzung der qualifizierten Originaleditionen in privaten, RLS-geschützten Append-only-Stores; alte `RESEARCH_ONLY`-Bodies unberührt; reale HTTP200-Originale und Zeitsignaturen bei jeder natürlichen Prüfung.
- Produktionsspezifischer BG1-Katalognachfolger auf **dem tatsächlichen, aktuell nachgelesenen Production-Parent**; jede Funktion, Relation, Owner/ACL, Scheduler-Rolle, Sourcepointer und Sicherheitsgrenze vorab und nach COMMIT digest-gebunden; neue Generation und tatsächlicher natürlicher Vollbeleg nach Cutoff.
- Getrennte Production-MA1-Revision/Owner/AAL2 mit eigenem echten Epoch/Receipt. Der Dev-Digest und die Dev-Ownerquittung sind lediglich Code-Identität, keine Live-Autorität.
- AT-Visum-Issuer/Erneuerung mit max. einer neuen Faktversion je versiegeltem amtlichen Batch. Der neueste `pending`-Batch unterbricht eine noch frische vollständig geprüfte Vorgängerantwort nicht; jede tatsächliche fremde Hash- oder Regeländerung sperrt unmittelbar. Nach abgeschlossenem neuen Batch verlängert ein **natürlicher** Schedulerlauf den CH-only Fakt, niemals ein rückdatiertes Überschreiben.
- Öffentliche Antwort nur über tatsächlich autorisierte Quelle + Methode + BG1 + unverfallenen Faktenpuffer; Dev-Methode `visa_free` wird nur bei `CH`/korrekter Quellenkombination im UI auf `visa_exempt` angezeigt. Kein fremder Pass kann diesen Zweig nutzen.

## Vorbereitete, noch nicht ausgeführte Dateien

- `00-PRODUCTION-PREFLIGHT.READONLY.sql` — erste künftige eigene Owner-Freigabe.
- `40-PRODUCTION-POSTCOMMIT.READONLY.sql` — unabhängige Katalog-/BG1-/Rollen-Nachlese, muss mit dem tatsächlich installierten Nachfolger abgleichen.
- `50-PRODUCTION-VISITOR-READBACK.ROLLBACK.sql` — echte `anon`-Visitor-Calls erst **nach** separater Installation/Production-Owner-MA1, im normalen `BEGIN` (BG1 verwendet `FOR SHARE`) und zwingendem `ROLLBACK`.
- `ROLLBACK_PLAN.md` — genaue Vorgaben vor/nach COMMIT sowie nach echten Owner-/Kundenereignissen.
- `GO_SCOPE.md`, `DEV_EVIDENCE.md`, `SOURCE_SCOPE.json`, `SHA256SUMS`, `MANIFEST.json`.

**STOP:** Es gibt bewusst keine `INSTALL-COMMIT.sql` und keine ausführbare `ROLLBACK.sql` für Production. Die finalen Bytes und SHA-256 dürfen erst aus freigegebenem aktuellem Production-Preflight und neuem unabhängigen nativen Abnahmeprotokoll abgeleitet werden. Andere Pakete, etwa CH→DE, müssen im Fall einer gemeinsamen Parent-Änderung neu gebunden werden.
