# Jetnity – Swiss PrivacyBee Product-Owner Binding Decision

Stand: 30. August 2026  
Status: **PRODUCT-OWNER-BINDING / CHAT- UND AGENTENÜBERGREIFEND / KEINE RUNTIME-AKTIVIERUNG**

## 1. Verbindliche Produktentscheidung

Für Jetnitys **website-sichtbare Datenschutzschicht** ist **PrivacyBee AG, Schweiz (`privacybee.io`)** der vorgesehene Anbieter.

Diese Entscheidung supersediert ältere Formulierungen, die Swiss PrivacyBee nur als unverbindliche spätere Option oder noch offene Vendor-Auswahl behandeln.

Der vorhandene Sicherheits- und Integrationsvertrag bleibt bindend:

`docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md`

Die Vendor-Grenzen werden durch diese Auswahl **nicht** gelockert.

## 2. Was PrivacyBee übernehmen soll

PrivacyBee ist für die website-sichtbare Datenschutzebene vorgesehen, insbesondere:

- Datenschutzerklärung / DSE auf oder hinter `/privacy`;
- laufende website-bezogene Aktualisierung im vorgesehenen PrivacyBee-Modell;
- falls später separat freigegeben: Impressum-Schicht;
- falls später echte nicht-essenzielle Tracker existieren und separat freigegeben: Cookie-Banner.

Die konkrete technische Einbindung (Widget, iFrame, externer Link oder andere vom Vendor unterstützte Form) wird erst nach Account-/Vendor-Evidence und Security-/Legal-Review festgelegt.

## 3. Was PrivacyBee ausdrücklich NICHT übernimmt

PrivacyBee wird nicht Authority für:

- `/terms` / Nutzungsbedingungen / AGB;
- AP-6b Consent-Persistenz;
- Datenexport;
- Kontolöschung;
- Account-/Auth-/Session-Wahrheit;
- Traveller-/Citizenship-/Document-Wahrheit;
- RLS / Ownership / Identity;
- Provider-/Commercial Truth;
- Marketing-Consent oder CRM-Wahrheit.

Diese Bereiche bleiben Jetnity-native bzw. benötigen eigene Legal-/Product-Gates.

## 4. Jetnity-spezifischer Datenschutz-Nachtrag bleibt Pflicht

Ein öffentlicher Website-Scan kann Jetnitys serverseitige und accountbezogene Verarbeitung nicht vollständig erkennen. Vor Live-Aktivierung muss die website-sichtbare DSE deshalb die tatsächlich implementierten Jetnity-Verarbeitungen korrekt abdecken, insbesondere soweit aktuell relevant:

- Auth / Session-Cookies;
- Account-Profil;
- Trip-Graph;
- trip- und account-scoped Traveller-Metadaten ohne Passnummern/Scans/MRZ/Biometrie;
- Guest-LocalStorage und Gast-Quota-Cookie;
- `model_usage` entsprechend realer Aktivierung;
- Admin-PII-Sicht;
- tatsächlich live genutzte Infrastruktur-/Subprocessor-Kategorien.

Keine geplanten Provider oder nicht aktiven Systeme dürfen als live dargestellt werden.

## 5. Bestehendes Product-Owner-Konto

Der Product Owner hat bereits ein Konto bei Swiss PrivacyBee. Dieses bestehende Konto ist der vorgesehene spätere Integrationspfad; es ist **kein** Auftrag für Agenten, sich einzuloggen, einen Trial zu starten, eine Domain zu aktivieren, Verträge anzunehmen oder Zahlungen auszulösen.

Vor Aktivierung bleibt `account-evidence-required`, insbesondere für:

- tatsächlichen Domain-/Tarifstatus;
- verfügbare Integrationsart / Snippets;
- aktuelle Account-Kopie von AVV/DPA und relevanten Anlagen/TOM/TIA, soweit vorhanden;
- generierte Datenschutz-/Impressumsinhalte;
- eventuelle laufende Kosten/Vertragsbindung.

Passwörter, Session-Cookies, API-Keys oder andere Zugangsdaten dürfen nicht an Cursor-Agenten oder ins Repository gelangen.

## 6. Security- und Privacy-Grenzen

Ohne separates Extra-Gate niemals an PrivacyBee übertragen:

- Pass-/Ausweisnummern;
- Dokument-Scans;
- MRZ;
- Biometrie;
- Auth-Tokens / Cookies / Secrets;
- Payment-/Provider-Secrets;
- vollständige private Trip-Rohdaten;
- unnötige Citizenship-/Residence-Details.

PrivacyBee darf keine zweite Account-, Identity-, Consent- oder Traveller-Wahrheit erzeugen.

## 7. Cookie-Banner

Kein PrivacyBee-Cookie-Banner nur der Optik oder „Compliance“ wegen aktivieren.

Solange Jetnity keine echten nicht-essenziellen Tracking-/Marketing-Scripts nutzt, bleibt der Banner aus. Sobald solche Systeme real eingeführt werden, erfolgt ein eigener Consent-/Tracking-Gate.

## 8. `/terms` bleibt separater Trust-Blocker

PrivacyBee liefert nach aktuellem Vertrag **keine Jetnity-Nutzungsbedingungen/AGB**. `/terms` muss deshalb separat mit freigegebenem Legal-Inhalt gelöst werden.

Kein Agent darf Nutzungsbedingungen erfinden.

## 9. Nächster zulässiger Arbeitsblock

Vor einer PrivacyBee-Runtime-Aktivierung:

1. PrivacyBee-Account-Evidence vom Product Owner einsammeln, **ohne Zugangsdaten**;
2. vorhandene Vendor-/Account-Dokumente und Integrationsartefakte gegen `docs/PRIVACYBEE_INTEGRATION_CONTRACT_2026-08-29.md` prüfen;
3. Jetnity-spezifische DSE-Lücken bestimmen;
4. `/terms` separat als Legal-Input-Block behandeln;
5. danach bounded AP-6a Runtime Slice schneiden.

Dieser Entscheid startet **keinen** Cursor-Agenten und autorisiert **keine** PrivacyBee-Aktivierung.