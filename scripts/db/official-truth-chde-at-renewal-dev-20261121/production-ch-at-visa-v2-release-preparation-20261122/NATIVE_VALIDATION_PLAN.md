# CH→AT Production — unabhängige native und Besucher-Abnahme vor einem späteren GO

**Nur Plan.** Ein grüner Dev-Test ersetzt weder das neue Production-Catalog-Readback noch eine echte Production-Owner/AAL2-Methodenfreigabe. Keine Aktion dieses Dokuments ist automatisch genehmigt.

| Fall | Erforderlicher Nachweis |
| --- | --- |
| AT01 | Produktion besitzt genau den per neuer Owner-Preflight-Auskunft gebundenen Vorgänger, keine unbekannten DDL/ACL/RLS-/Rollenunterschiede |
| AT02 | Drei Zielstaats-Originale mit bytegenauer SHA-256; BMI zweimal `unchanged_exact`, BMEIA neue Fassung `changed` und nachgewiesener, nur CH→AT-Visa-neutraler Delta |
| AT03 | Alte `RESEARCH_ONLY`-Originale, Quellenbelege, historische Fakten, Jobs und Id-Allocator bleiben unverändert |
| AT04 | Production-MA1 ist **eigenständig** per echtem Production Owner/AAL2 staged, bestätigt, approved und nochmals bestätigt; keine Dev-Quittung kopiert |
| AT05 | Ohne neue Production-Owner-Freigabe, ohne neue Methode oder bei Widerruf verweigert der private Issuer alle Positivfälle |
| AT06 | Fremdpass IN/DE/US/TR/CN sowie übrige nicht qualifizierte Passcodes und Sonderdokumente bleiben `unavailable` |
| AT07 | Transit, Gesundheits-/Impf-, Aufenthalts-, Formular-, Zoll- und andere nicht bestätigte Kundenthemen bleiben unabhängig und ungeöffnet |
| AT08 | Vor/nach einem neuen BG1-Cutoff wird exakt der frische natürliche Vollproof verlangt, kein manuell vorgespulter Checker |
| AT09 | Ein neues `pending` im Quellenmonitor unterbricht nicht die noch frische vollständig versiegelte Quellenentscheidung |
| AT10 | Jede echte nachfolgende neue Hash- oder Regelabweichung führt vor der positiven Ausgabe zu `unavailable` |
| AT11 | Vollständig neuer regulärer Quellencollector, AT-Cron-Seal und genau eine neue Faktversion je Source-Batch; keine erneute Quittung durch Replay |
| AT12 | Altes Basisoriginal wird nicht überschrieben; neuer positiver Fakt muss ursprüngliche Source-ID, Methode/Epoch, natürliche Zeit und Quellenhistorie tragen |
| AT13 | Exakter Ablauf-/70-Minuten-Puffer: keine frühere oder spätere Uhrzeit erzeugt positiv; positive Regel nach mehr als einer Stunde nur durch **natürliche** erneute amtliche Kontrolle |
| AT14 | Echte `anon`-Abfrage mit normalem Transaktionskontext (BG1 `FOR SHARE`) bestätigt CH `not_required` und 3 amtliche URLs, fremde Pässe bleiben gesperrt |
| AT15 | Reale Browser-Antwort und mobil/desktop: Schweiz→Österreich «Kein Visum nötig» mit «Stand vom» und Behörde, gleichzeitig negativer IN/DE; keine scheinbare Positivanzeige im Cache |
| AT16 | Atomare Installationsprobe vollständig ROLLBACK; echter COMMIT-Readback mit exakten Hashes; getesteter, separater fail-closed Rücknahmeweg; CH→DE-Zyklus12 und Scheduler weiterhin blockiert |

**Status:** AT01–AT16 sind künftige Production-Gates, *nicht* pauschal PASS. Dev besitzt bereits enge native Negativ- und BG1-Belege; die echten Production-Schritte sind ausstehend. Ein fehlender Beleg darf niemals als Skip=PASS gezählt werden.


## CH→AT Production-V1-Adapter: zusätzliche Native-/CoS-Abnahmekategorien

Die im alten Abschnitt AT01–AT16 aufgeführten vollständigen **Production**-Gates bleiben weiterhin **nicht** als durchweg PASS markiert. Neu nachgewiesen ist nur der native Dev-PG17-V1-Layout-Fixture-Pfad:

- **PG17-60 SOURCE/MA1/ISSUER/VISITOR: PASS** — drei amtliche Dev-Originalbodies mit exaktem SHA, ausschließlich Owner-Dev-MA1 Rev2/Epoch2, ein CH→AT-Fakt, drei offizielle Links, IN/DE gesperrt, Duplicate-Fact-Replay verweigert, neue geänderte Source sofort fail-closed, unveränderliche Quelle; vollständiges `ROLLBACK`. Erst reservierten PostgreSQL-Bezeichner und danach den mehrdeutigen Source-JOIN korrigiert; **finale Datei PASS**.
- **PG17-61 ROLLBACK: PASS** — simulierte Production-V1-Rücknahme behält V1- und V2-Historie/Altcorns/Quellen/Fakt, deaktiviert nur neue V2-Cron, CH/IN `unavailable`, neuer Issuer `0`, V6-Predecessor-Digest verbunden, vollständiges `ROLLBACK`.
- **PG17-62 BG1-Compiler: PASS** — fünf BG1/Guard/catalog-/require-Funktionen aus den Production-V1-Snapshot-Definitionen namespace-gemappt und nativ kompiliert; keine echten Live-Dev-Guard-Funktionen überschrieben. **Nicht** gleichzusetzen mit tatsächlichem BG1-Vollproof nach dem installierten V5-Cron auf vollständiger Production-V1-Topologie.
- **PG17-63 IMMUTABLE BASELINE: PASS** — V5+V6 einmalig bootstrap-initialisiert, beide nach erster Initialisierung unveränderlich, vier Mutationstests mit SQLSTATE P7905 abgelehnt. V6 ist an V5-Hash gebunden, ROLLBACK.
- **Repo-Exact-Body:** `30`/ `31` und `32`/`33` wurden bytegenau bis auf abschliessendes `ROLLBACK` bzw. `COMMIT` verglichen; Installationskörper `10`+Guardkörper `20` vollständig in `30` vorhanden. V1-Originaltabellen werden nicht ersetzt. Die historische HTTP-ID-v4-Transportmetadatenbindung wurde so korrigiert, dass v4 gegen den **eingefrorenen v4-Katalog** geprüft bleibt und die neue V2-Cron erst in v5/6 attestiert wird.
- **Dev-Nachread:** 22.11.2026 22:30:10 UTC: alle drei disposable Fixture-Schemas nicht mehr vorhanden; Dev-BG1 Gen2451 mit Incident=Resume; Dev-v12-Katalog unverändert exakt; Methode Rev2.
- **Noch BLOCKED:** End-to-End exakt ausführbare `30`/`31`/`32`/`33` gegen *identische* Production-V1-BG1-v4-Daten und echten Cron-`catalog_status`, unabhängiger Chief-of-Staff-Review, aktuelle Production-Quellen- und BG1-**Datenwerte** (ein Katalog-Metadatenread von 21:03 UTC ist kein aktueller Lauf), tatsächliche Production Owner/AAL2-Rev2-UI-Auswahl. Keine falschen Positivflags für andere 49 Pässe.

**Release-Verdict: `CHIEF_OF_STAFF_REVIEW_READY / INSTALL_GO_HOLD`.** Nicht vor CoS-/vollständigem BG1-Nativ-Gate und explizitem Installations-Go ausführen.
