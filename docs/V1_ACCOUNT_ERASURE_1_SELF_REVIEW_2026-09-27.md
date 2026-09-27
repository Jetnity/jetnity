# Jetnity – V1 Account Erasure 1 SELF-REVIEW

Stand: 27. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #588  
Draft PR: #590  
Technical-Lead-Kommentar: `5860625071`  
Parent vor dieser Korrektur: `823618eda90310f123ca0b345398a5a88183c524`

Dieses Dokument ersetzt keinen unabhängigen Technical-Lead-PASS. Der Development-Nachweis ist nicht ausgeführt. Die Migration ist nicht auf Development und nicht auf Production angewendet.

---

## 1. Angriffe auf die Korrektur

| Angriff | Ergebnis |
| --- | --- |
| Nur `pg_trigger_depth() > 1` und die Kaskade trotzdem schreiben lassen | Abgelehnt. Auf PostgreSQL 16 ist die Tiefe der Fremdschlüssel-Kaskade 1. Der lokale Lauf der alten Funktion endet mit `42501`. |
| Die Auth-Rolle mit `UPDATE` auf `trips` ausstatten | Abgelehnt. Die Migration enthält kein `GRANT`. Der Nachweis sieht weiterhin kein Tabellenrecht. |
| Die Funktion `SECURITY DEFINER` machen | Abgelehnt. `prosecdef` bleibt falsch. |
| Die Graph-Trigger entfernen oder abschalten | Abgelehnt. Die Migration enthält kein `DROP TRIGGER`. Direkte Kindänderungen zählen im Nachweis weiter, neun Mal genau +1. |
| Einen Rollennamen in die Funktion schreiben | Abgelehnt. Die Rückkehr hängt an der sichtbaren Elternreise und an `42501`, nicht an einem Namen. |
| `jetnity.graph_mutation` entfernen | Abgelehnt. Die Abkürzung steht vor der Tiefe. Der Nachweis lässt die Fassung dabei unverändert. |
| Die verschwindende Reise trotzdem anfassen | Abgelehnt. Elternlöschung und Auth-Löschung erhöhen das Schreibprotokoll nicht. Die Geschwisterreise bleibt auf Fassung 4. |
| Die Migration hier auf Development oder Production anwenden | Abgelehnt. Nur die lokale Wegwerf-Datenbank des Nachweises hat sie ausgeführt. |
| Den Live-Nachweis als 11/11 ausgeben | Abgelehnt. Er ist nicht gelaufen. |

## 2. Restrisiken

- Ob Development nach dem Anwenden dieselbe PostgreSQL-Fassung zeigt wie der lokale Cluster 16, prüft erst der nächste Disposable-Lauf. Der lokale Nachweis ist 6/6 auf PostgreSQL 16.15.
- Ein Konto, das `public.trips` lesen darf, die Elternzeile aber noch sieht, schreibt die Fassung weiter. Das ist die direkte Kindänderung. Die Kaskade sieht die Elternzeile nicht mehr.
- Storage-Besitz, Direktmodus und die Frage, ob `SUPABASE_DB_URL` in der gehosteten Function gesetzt ist, bleiben so stehen wie auf `823618ed`. Dieser Commit ändert die Function nicht. `deno bundle` bleibt bei 81 Modulen.
- Ein späterer Commit entwertet diesen Head. CI dieses Heads ist zum Schreibzeitpunkt noch nicht belegt.
- Die Änderung ist reisenden-neutral. Sie liest keine Staatsangehörigkeit, keinen Ausweis und kein Reisedokument.

## 3. Empfehlung

Die Migration und den lokalen Nachweis reviewen. Danach nur Development anwenden und den Disposable-Nachweis selbst ausführen. Nicht mergen. Production bleibt zu.
