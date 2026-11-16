# AT Official Truth V3 — Quellenidentität und blockierte Methodenaufnahme

**16. November 2026. Draft-Lane zu Issue #1223. Keine Veröffentlichung, kein Merge, kein Production-Write.**

## Blockade

`AT – BLOCKIERT; 10 von 11 vertraglich bekannten Prioritätsplätzen haben eine gewöhnliche Visum- oder ID-Zelle, Türkei bleibt unavailable; 39 von 50 Plätzen sind ohne die nicht veröffentlichte passport-priority.csv nicht identifizierbar; HRS, BG1 und Method-Approval sind nicht durchlaufen; keine Veröffentlichung.`

## Was die Originalbytes belegen

Abruf `2026-11-16T19:45:39Z`. Beleg: [fetch-receipt.json](../evidence/official-truth-at-v3/2026-11-16/fetch-receipt.json).

Die BMI-Visaliste enthält genau einmal `(Stand: 6.11.2026)` und weder `15.7.2026` noch `15.07.2026`. SHA-256 `fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778`, 498415 Bytes. Die ältere gerenderte Fassung ist damit nicht dieses Dokument. Ein HTTP-`Last-Modified` vom selben CDN-Zeitpunkt ist keine Rechtsfassung.

Die BMI-Kurzaufenthaltsseite hat keine redaktionelle Stand-Zeile. Ihre Fassung ist der Byte-Hash `ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e`. Sie trennt EU/EWR/Schweiz (kein Visum, gültiger Pass oder Personalausweis, bis drei Monate, keine Drittstaats-90/180-Regel) von Drittstaatsangehörigen.

Die Botschaft Bern bestätigt für Schweizer Staatsangehörige visumfreie Einreise mit gültigem Pass oder Personalausweis. Schweizer Aufenthaltsbewilligung B/C/L bleibt eine andere Personengruppe und wird nicht als Schweizer Passregel gelesen. Bern hat zwei identische Canonical-Links ohne Schrägstrich; der abgerufene Final-URL behält den Schrägstrich. Keine redaktionelle Stand-Zeile.

## Gewöhnliche Zellen, die der Extractor klar lässt

Nur direkte touristische Kurzreise, gewöhnlicher Pass, Visum und Personalausweis. Sonder-, Diplomaten- und Dienstpässe, Transit, Kinder, Aufenthaltstitel, Gebiete und die übrigen der 26 Themen bleiben `method_not_qualified` / unavailable. Freizügigkeit wird nicht als 90/180 gespeichert. Eine nationale oder bilaterale Sonderzelle, die den gewöhnlichen Pass nicht sauber ausnimmt, bleibt unavailable. Deshalb bleibt die Türkei unavailable, obwohl die EU-Visumpflicht „Ja“ sagt: das bilaterale Abkommen ist nicht auf Sonderpässe begrenzt.

Unter den elf bekannten Plätzen (`IN TR CN DE PL IT US UA RO FR` plus Pflichtmitglied `CH`, Position von CH unbekannt):

| Pass | Visum | Personalausweis |
| --- | --- | --- |
| IN | required | not_accepted |
| TR | unavailable | unavailable |
| CN | required | not_accepted |
| DE | free_movement | accepted |
| PL | free_movement | accepted |
| IT | free_movement | accepted |
| US | third_country_exempt | not_accepted |
| UA | biometric_ordinary | not_accepted |
| RO | free_movement | accepted |
| FR | free_movement | unavailable (Matrix: „Ja (siehe Zusatz)“) |
| CH | free_movement | accepted |

Über die ganze Matrix, nicht als Prioritäts-50: 30 Freizügigkeit, 19 klare Drittstaats-Befreiungen, 7 biometrische gewöhnliche Pässe, 91 gewöhnliche Visumpflichten, 44 gemappte unavailable. Das ist keine Freigabezeile `x/50`.

## Warum der reguläre V3-Pfad hier stoppt

Der Method-Draft `jetnity-destination-primary-at-visa` Revision 1 ist `NOT_APPROVED`. `readHrs1Binding` lässt weiterhin nur Ziel `DE` und Staatsangehörigkeit `CH` zu. `HRS1_LIMITS.originalBytes` bleibt 131072; die Visaliste hat 498415 Bytes. Die BG1-Coverage-SQL bleibt auf `DE`/`CH`. Eine Aufnahme würde diese gemeinsamen Grenzen öffnen. Das ist kein Bypass.

## Einziger nächster Owner-Schritt

Nicht diese Zellen veröffentlichen. Erst, wenn die echte `passport-priority.csv` vorliegt und Technical Lead / Owner eine eigene HRS-Revision für AT prüfen: Owner-Rolle, aktuelles AAL2, Fähigkeit `official-truth-freigeben`, danach ein Dev-Besucherreadback. Bis dahin bleibt jede Zelle unveröffentlicht. Bitte vor der Reise die amtlichen Seiten prüfen.
