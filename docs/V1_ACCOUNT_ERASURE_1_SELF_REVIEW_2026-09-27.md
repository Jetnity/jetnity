# Jetnity – V1 Account Erasure 1 SELF-REVIEW

Stand: 27. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #588  
Draft PR: #590  
Implementierungsparent: `76e6bf9c153f94f3478cd11bcdbd26fd1794c2f0`  
Evidence: `d09acc247acf4299e4d1595b6644faf6f7f07cce`, Zählkorrektur `8b3126d064e9ebe869bd530f60fd26a181a964b0`  
Der Review-Head ist der Commit dieser Kopfzeile.

Dieses Dokument ersetzt keinen unabhängigen Technical-Lead-PASS.

---

## 1. Angriffe auf den Slice

| Angriff | Ergebnis |
| --- | --- |
| Beliebige `user_id` aus dem Browser löschen | Abgelehnt. Request ist genau `{ confirmation }`. Ziel kommt aus dem verifizierten JWT und muss `sub` entsprechen. |
| Production oder ein fremdes Projekt löschen | Abgelehnt vor jedem privilegierten Aufruf. Loopback bleibt nur für lokale Hosts. |
| Auth-Nutzer löschen, solange eigene Storage-Objekte liegen | Abgelehnt. Zweiter Storage-Walk muss leer sein, sonst kein `deleteUser`. |
| `storage.objects` per SQL leeren | Abgelehnt. Nur Storage-API. Der Nachweis löscht Objekte ebenfalls über die API und droppt danach nur Policy und leeren Bucket. |
| Veraltetes Passwort oder AAL1 bei verifiziertem Faktor | Abgelehnt (`reauth_veraltet` / `mfa_erforderlich`). Es wird nichts gelöscht. |
| OAuth-only ohne Passwortbeweis | Abgelehnt (`oauth_nicht_unterstuetzt`). OAuth bleibt in `config.toml` aus. |
| Bestehende Passwortänderung auf aktuelles Passwort umstellen | Abgelehnt. `reauthenticate()` bleibt der Vertrag der Passwortänderung. |
| Zweite Löschung als Erfolg melden | Abgelehnt. `nicht_gefunden` ist 404, nie `geloescht`. |
| Lokale Sitzung bei Fehler leeren | Abgelehnt. `signOut` und Gastreise-Schlüssel nur nach Klasse `geloescht`. |
| GDPR, CH-DSG oder 30 Tage behaupten | Abgelehnt in Oberfläche und Bestätigungsseite. |
| Globale Kontinuität oder AP-6a-Vertrag mitziehen | Abgelehnt. |
| Ready oder Merge | Abgelehnt. |
| Disposable-Nachweis als bestanden dokumentieren | Abgelehnt. Ausgabe ist `blockiert` / `management_401`. Function-Probe ist 404. |

## 2. Restrisiken

- Die Function ist nicht deployt. Preview und Development können die Löschung bis zu einem autorisierten Deploy nicht ausführen. Der Client bleibt dann bei einem ehrlichen Fehler und bestätigt keinen Erfolg.
- Der Disposable-Nachweis (Speicher weg, Ereignis weg, Kaskade, veraltetes Token, fremde Daten, MFA-Umgehung) ist nicht gelaufen. Die Vertragstests prüfen die Orchestrierung mit Doubles, nicht GoTrue.
- Die angemeldete Einstellungen-Maske wurde nicht mit einer echten Sitzung bedient.
- `listFactors` des Admin-Clients und der Storage-Owner müssen zur laufenden Supabase-Version passen. Weicht der Owner ab, bricht der Walker fail-closed ab und löscht den Auth-Nutzer nicht.
- Ein späterer Commit, einschließlich einer CI-Nachtragung, erzeugt einen neuen Head.
- `lib/legal/ap6a-gate0-vertrag.ts` nennt `kontoloeschung` weiter als Nicht-Scope. Das ist absichtlich unverändert und für Leser der Legal-Inventur irreführend, bis ein eigener Kontinuitäts-Slice es nachzieht.

## 3. Empfehlung

Den Vertrag und die Fail-closed-Grenzen reviewen. Den Live-Nachweis nicht als PASS lesen. Nicht mergen, bevor ein unabhängiger Exact-Head-Review das so entscheidet und der Development-Nachweis tatsächlich gelaufen ist. Production bleibt zu.
