# Swiss PrivacyBee – kleinster sicherer zukünftiger Integrationsvertrag

Stand: 29. August 2026  
Status: **CONTRACT ONLY / KEIN START / KEINE RUNTIME / KEIN TRIAL / KEIN AVV-ACCEPT**  
Logical Cursor-Agent: **`Privacy provider integration audit 1`**  
TARGET: PrivacyBee AG / `privacybee.io`. Nicht `privacybee.com`.

Gilt nur, falls Product Owner + Legal + Security später ausdrücklich diese Swiss-PrivacyBee wählen.  
Gate 0 empfiehlt **keine Aktivierung jetzt**.

---

## 1. Wahrheitshierarchie

1. Jetnity bleibt SoT für Account, Auth, Trip-Graph, Traveller, Ownership, RLS und AP-6b.
2. PrivacyBee darf höchstens **Website-sichtbare** DSE-/Impressum-/Cookie-UI hosten oder als Widget einbinden.
3. PrivacyBee wird nicht Identity-, RLS-, Traveller- oder Account-Consent-Authority.
4. Vendor-Marketing „DSG/DSGVO-konform“ wird nicht zu Jetnity-UI-Copy.
5. Empty ≠ Error: ein totes Widget ist ein Fehler, keine „leere Privacy“.

## 2. Erlaubte spätere Rollen (Maximum)

| Rolle | Default | Bedingung |
| --- | --- | --- |
| DSE-Widget oder iFrame auf `/privacy` | bedingt | Legal akzeptiert PrivacyBee-Text **plus** Jetnity-Nachtrag für server-seitige/unübliche Verarbeitungen |
| Impressum-Widget auf extra-freigegebener `/impressum` | bedingt | Pflichtfelder von Legal geprüft; keine erfundenen Firmenfakten; OpenAI-Residual akzeptiert |
| Cookie-Banner via `cookie-banner.js` | **nein bis Tracker existieren** | Nur nach PO-Entscheid und nur für wirklich nicht-essenzielle Drittscripts |
| Externer Link auf PrivacyBee-gehostete DSE | bedingt | Schwächer für UX/Canonical; noindex bleibt Jetnity |
| `/terms` / Nutzungsbedingungen | **nein** | Kein PrivacyBee-Liefergegenstand |
| AP-6b Export/Delete/Account-Consent | **nein** | Jetnity-nativ |
| Autopilot als Entdecker von Traveller-/Auth-Daten | **nein** | Scanner sieht nur die öffentliche Website |

## 3. Pflicht-Nachtrag, den Jetnity selbst liefern muss

Bevor ein Widget live darf, muss Legal/Engineering schriftlich beschreiben (nicht der Scanner):

- Auth (E-Mail, Passwort, optionales `name`, Session-Cookies);
- `profiles`;
- Trip-Graph und trip-scoped Traveller ohne Nummer/Scan/MRZ;
- Guest-LocalStorage `jetnity:reise:v3` und Quota-Cookie `jetnity_gast`;
- `model_usage` (Hash, Kosten, keine Reiseinhalte);
- Admin-PII-Sicht;
- Infra-Kategorien Vercel/Supabase/GeoNames/optionale Modelle – nur tatsächlich live;
- dass Analytics/Ads derzeit fehlen.

Ohne diesen Nachtrag ist die generierte DSE für Jetnity **unzulässig unvollständig**.

## 4. Daten, die niemals ohne Extra-Gate fließen

Pass-/Dokumentnummern, Scans, MRZ, Biometrie, unnötige Citizenships, Auth-Secrets/Tokens, Payment-/Provider-Secrets, vollständiger Trip-Graph, Guest-Rohdaten, `model_usage`-Rohzeilen.

Ein Website-Scan und ein Impressum-Generator dürfen diese Klassen nicht nachfordern.

Besucher-Consent-Logs (IP/UA) entstehen erst, wenn der Banner gemountet wird. Das ist ein eigener PO/Legal-Entscheid.

## 5. Technische Grenze (falls später gebaut)

1. Kein Trial/Signup in einem Audit- oder Runtime-Slice ohne ausdrückliches Kosten-/AVV-Gate. Trial schliesst den AVV.
2. Scripts nur über dokumentierte `app.privacybee.io`-URLs; keine `NEXT_PUBLIC_` Secrets.
3. Cookie-Banner, falls je: erstes Head-Script, aber **nicht** bevor Tracker existieren.
4. CSP/SRI/Timeout/Kill-Switch. Fail-closed: Vendor down ⇒ Legal-Seite zeigt ehrlichen Fehler, keinen leeren 200.
5. Kein Autopilot-Block auf essenzielle Auth-/First-Party-Scripts ohne Test.
6. `window.PrivacyBee` darf Register-Checkbox oder AP-6b nicht ersetzen.
7. robots/canonical/noindex bleiben Jetnity-Helfer. Widgets ändern das Indexing-Gate nicht.
8. Search #168, Homepage, AP-7, DB/RLS/Auth unberührt.
9. V1-`CookieConsent` nicht parallel mounten.

## 6. Rechtliche Vorbedingungen

1. PO/Legal schliesst die AP-6a-Input-Matrix mindestens für Controller, Adresse, Kontakt, `/impressum` ja/nein, Konformitätszeile.
2. AVV 2.0 + Anlage 2 + Anlage 1 + OpenAI-TIA **gelesen und bewusst akzeptiert** – nicht durch Agenten.
3. Legal akzeptiert: automatisierte, nicht einzeln geprüfte Texte; Abmahngarantie-Deckel CHF/EUR 5’000; Ausschluss server-seitiger Lücken; 5-Jahre-Exit-Verbot; Jahresabo.
4. Schweizer Recht / Bern vs. Jetnity-Rechtsraum: Legal.
5. Keine Übernahme der Vendor-Konformitätsbehauptung in Login/Register.

Dieser Audit akzeptiert ALB und AVV **nicht**.

## 7. AP-6a / AP-6b / Vendor

| Arbeit | Vendor |
| --- | --- |
| AP-6a `/privacy` nach Content-Gate | optional Widget + Jetnity-Nachtrag |
| AP-6a `/terms` | **0** |
| `/impressum` | nur nach Extra-Input |
| CookieConsent Orphan/löschen/Banner | PO; Banner ≠ Default |
| AP-6b | **0** |
| Traveller/Account-SoT | **0** |

## 8. Traveller-Context

Nicht relevant für ein Website-Widget, **solange** keine Traveller-Fakten übertragen oder in die DSE als Identitäten geschrieben werden.

Relevant und verboten: Mehrfachstaatsangehörigkeit, Dokumentoptionen oder Residence als Vendor-Input.

## 9. Exit / Failure

- Kill-Switch entfernt alle `app.privacybee.io`-Scripts.
- `/privacy` darf dann nicht 200 mit leerem Widget bleiben.
- Generierte Texte nicht nach Exit weiterhosten (ALB 7.4, 5 Jahre).
- Consent-Logs: Löschung nach ALB 7.5 / AVV §10 verlangen, nicht still behalten.
- AP-6b und Register bleiben bedienbar.

## 10. Was dieser Vertrag nicht ist

Keine Vendor-Auswahl, keine Kostenfreigabe, kein Trial, keine Runtime, keine Freigabe sensibler Traveller-Daten, kein Start von AP-6a-Runtime oder AP-6b.
