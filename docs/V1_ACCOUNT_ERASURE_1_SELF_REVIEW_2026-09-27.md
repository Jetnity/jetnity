# Jetnity – V1 Account Erasure 1 SELF-REVIEW

Stand: 27. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #588  
Draft PR: #590  
Parent vor dieser Korrektur: `ab0d38a4c7130a648514bd0f4b518c64e27992e6`

Dieses Dokument ersetzt keinen unabhängigen Technical-Lead-PASS. Der Development-Nachweis ist nicht ausgeführt.

---

## 1. Angriffe auf die Korrektur

| Angriff | Ergebnis |
| --- | --- |
| Mit beiden Schlüsseln trotzdem die Management API rufen | Abgelehnt. Der Callback läuft im Test nicht, und `fetch` wird nicht gerufen. |
| Einen einzelnen Schlüssel als Direktmodus lesen | Abgelehnt. `direkt_unvollstaendig` vor dem Netz. |
| Production-Ref oder Production-URL durchlassen | Abgelehnt. `produktion` vor dem Netz, auch wenn die Schlüssel gesetzt sind. |
| Schlüssel in Fehler oder JSON schreiben | Abgelehnt. Die Entscheidung enthält sie nicht. `nachweisGrund` lässt nur bekannte Codes durch. |
| Den Management-Weg entfernen | Abgelehnt. Ohne beide Schlüssel bleibt er. |
| `verify_jwt` ausschalten oder Production öffnen | Abgelehnt. |
| Einen PAT anlegen oder den Nachweis als 11/11 ausgeben | Abgelehnt. Kein Lauf, kein Claim. |
| Globale Kontinuität oder Ready/Merge | Abgelehnt. |

## 2. Restrisiken

- Der Direktmodus kann die temporäre Insert-Policy nicht ohne Management-SQL anlegen. Storage kann den Nutzer-Upload mit `speicher_policy` ablehnen. Das Aufräumen bleibt vorgesehen, der übrige Nachweis stoppt dann.
- `schema_kaskade` im Direktmodus ist Verhaltensbeobachtung nach `deleteUser`, nicht der Katalog der Fremdschlüssel.
- `deno check` der Function hat weiterhin die fünf bekannten Generic-Fehler. Dieser Slice ändert die Function nicht.
- Ein späterer Commit entwertet diesen Head. CI dieses Heads ist zum Schreibzeitpunkt noch nicht belegt.

## 3. Empfehlung

Den Direktmodus reviewen. Den Nachweis mit beiden Development-Schlüsseln selbst ausführen und die Schlüssel nicht in den Bericht nehmen. Nicht mergen. Production bleibt zu.
