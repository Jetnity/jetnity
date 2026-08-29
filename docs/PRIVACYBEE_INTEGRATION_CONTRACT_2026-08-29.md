# PrivacyBee – kleinster sicherer zukünftiger Integrationsvertrag

Stand: 29. August 2026  
Status: **CONTRACT ONLY / KEIN START / KEINE RUNTIME / KEIN VENDOR-ACCEPT**  
Logical Cursor-Agent: **`Privacy provider integration audit 1`**

Dieses Dokument gilt **nur**, falls Product Owner + Legal + Security später ausdrücklich PrivacyBee auswählen.  
Gate 0 empfiehlt diese Auswahl **nicht**. Der Vertrag ist die Fail-closed-Grenze, nicht ein Implementierungsauftrag.

---

## 1. Wahrheitshierarchie

1. Jetnity bleibt einzige Source of Truth für Account, Session/Auth, Trip-Graph, Traveller/Party, Ownership, RLS, Identity und AP-6b-Consent-Version.
2. AP-6a-Rechtstexte bleiben Jetnity-seitig und nur nach PO/Legal-Freigabe.
3. PrivacyBee darf niemals still Identity-Authority, RLS-Authority, Traveller-Registry, Cookie-/Consent-SoT oder Speicher für Reise-/Dokumentdaten werden.
4. Eine leere Vendor-Antwort ist kein Beweis, dass Jetnity keine Daten hat. Empty ≠ Error bleibt Jetnity-seitig.

## 2. Erlaubte zukünftige Rolle (Maximum)

Nur eine der folgenden Rollen darf überhaupt diskutiert werden, und nur nach DPA/SCC + PO/Legal/Security-Gate:

| Rolle | Erlaubt? | Bedingung |
| --- | --- | --- |
| Processor für **DSAR-Ticket-Intake** (E-Mail + Request-Typ + Zeitstempel) | bedingt | Jetnity führt Access/Export/Delete selbst aus |
| Processor für **Vendor-Risk-Metadaten ohne Personenbezug** (Firmennamen bestehender Infra-Vendor) | bedingt | keine Employee-PII, keine Nutzer-PII |
| Cookie-Banner / Consent-Tag im Jetnity-Frontend | **nein** als Default | nur nach späterem Extra-Gate, und nur wenn Login/Scan/Commission nachweislich aus sind |
| Consent-SoT / Preference-Syndication / Marketing-Unsubscribe-Hub | **nein** | würde AP-6b und Growth-Verträge ersetzen |
| Employee External-Data-Privacy / Data-Broker-Removal für Reisende oder Gäste | **nein** | anderer Produktzweck; Traveller-PII-Verbot |
| Authorized Agent, der gegenüber Dritten für Jetnity-Nutzer handelt | **nein** | Identity-/Vollmachts-Gate |
| Trust Badge / Referral / Commission | **nein** | Produkt- und Trust-Konflikt |

## 3. Daten, die niemals ohne Extra-Gate fließen

Explizit **nicht freigegeben** und default-verboten:

- Pass-/Dokumentnummern, Scans, Bilder, MRZ, Biometrie, Chip/RFID;
- gesetzliche Namen, Geburtsdaten, Gesundheits-/Impfdaten;
- unnötige Citizenships, Residence, Credential-Optionen;
- Auth-Secrets, Sessions, Recovery-Codes, MFA-Faktoren, AAL;
- Payment-/Provider-Secrets, Affiliate-Tokens;
- vollständiger Trip-Graph, Guest-`jetnity:reise:v3`, `model_usage`;
- Admin-Support-PII-Exporte;
- Kinder in `party` über das hinaus, was AP-6b später selbst exportiert.

Wenn AP-6b später exportiert, exportiert **Jetnity**. PrivacyBee erhält höchstens die Ticket-Metadaten, nicht das Exportpaket.

## 4. Daten, die in einer späteren Intake-Rolle überhaupt denkbar wären

Nur nach schriftlichem DPA und Minimierungsliste:

- Jetnity-Account-E-Mail des Antragstellers **oder** ein transienter Request-Token;
- Request-Typ (`access` / `deletion` / `rectification` / `other`);
- Request-ID, Zeitstempel, Status (`received` / `in_progress` / `done` / `rejected`);
- keine Traveller-Fakten, keine Reiseinhalte.

Zweckbindung: Betroffenenanfrage an Jetnity zustellen. Kein Scan, kein Broker-Removal, kein Upsell, kein Cross-Company-Preference-Graph.

## 5. Technische Integrationsgrenze

Falls jemals gebaut (nicht dieser Slice):

1. Kein Browser-Tag, kein Cookie-Banner-Mount, kein `CookieConsent`-Ersatz durch PrivacyBee.
2. Kein Client-Secret, kein `NEXT_PUBLIC_` Vendor-Key.
3. Nur serverseitiger, authentisierter Adapter hinter bestehendem Auth/Ownership.
4. Timeout, Rate-Limit, Kill-Switch, kein unbegrenzt kostenpflichtiger Pfad.
5. Fail-closed: Vendor down ⇒ Jetnity-DSAR-Inbox bleibt lokal bedienbar.
6. Webhook nur mit Signaturprüfung, falls eine API überhaupt first-party belegt wird. Heute: **unknown / vendor-confirmation-required**.
7. Keine stille Abhängigkeit in Register/Login/Footer.
8. Search/Places/Homepage und AP-7 bleiben unberührt.

## 6. Rechtliche Vorbedingungen vor jeder Aktivierung

Alles `PO-Legal-Security-approval-required`:

1. Schriftliche DPA mit Processor-Rolle, TOMs, Subprocessor-Kontrolle.
2. Benanntes Transferinstrument USA (SCC und/oder CH-Äquivalent) – heute öffentlich **nicht** belegt.
3. Keine Commission-/Referral-Addenda (§2.7 Terms) für Jetnity-Nutzer.
4. Keine Direct-to-Participant-Services für Jetnity-Endnutzer.
5. Exit: Export + Löschung + Subprocessor-Purge innerhalb einer benannten Frist.
6. Breach-Notice-Frist, die Legal für CH-DSG/GDPR akzeptiert; „promptly“ allein reicht nicht als implizite SLA.
7. Georgia-Gerichtsstand vs. Jetnity-Rechtsraum: Legal muss das tragen oder neu verhandeln.
8. Keine Konformitätszeile „DSGVO & CH-DSG konform“ als Folge der Integration.

Dieser Audit akzeptiert die Business Terms **nicht**.

## 7. Trennung AP-6a / AP-6b / Vendor

| Arbeit | Wann | Vendor-Anteil |
| --- | --- | --- |
| AP-6a Legal-Seiten | nach Content-Gate, unabhängig von PrivacyBee | **0** |
| CookieConsent Orphan/löschen/ehrlicher Text | PO-Entscheid in AP-6a-Matrix | **0** |
| AP-6b Consent-Version, Export, Delete | serial nach AP-6a; PO-Gate | **0** als SoT |
| Optionaler PrivacyBee-Intake | nur nach diesem Vertrag + Extra-Gates | Ticket-Metadaten |
| Employee-EDP für Jetnity-Team | eigener PO-Entscheid, nicht Consumer-Runtime | getrenntes Briefing |

## 8. Traveller-Context

Nicht relevant für einen DSAR-Intake **solange** keine Traveller-Fakten übertragen werden.

Relevant und **verboten**, sobald Citizenship, Dokumenttyp, Residence oder Party-Labels den Vendor erreichen: Mehrfachstaatsangehörigkeit darf nicht auf eine Option reduziert und nicht extern materialisiert werden.

## 9. Exit / Failure

- Kill-Switch entfernt jede serverseitige Weiterleitung.
- Offene Tickets werden in Jetnity zu `unsupported` / manuell, nicht still als „erledigt“ geschlossen.
- Keine automatische Verlängerung darf Runtime am Leben halten, wenn der Kill-Switch gezogen ist.
- Commission- oder Badge-Reste dürfen nicht als tote Scripts weiterlaufen.

## 10. Was dieser Vertrag ausdrücklich nicht ist

- keine Vendor-Auswahl;
- keine Kostenfreigabe;
- keine Runtime-Erlaubnis;
- keine Freigabe für Passport-/Scan-/MRZ-/Biometrie-Daten;
- kein Start von AP-6a-Runtime, AP-6b oder einem Folgeslice.
