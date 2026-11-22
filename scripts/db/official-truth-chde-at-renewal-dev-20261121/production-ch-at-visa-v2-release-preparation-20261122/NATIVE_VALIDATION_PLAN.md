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
