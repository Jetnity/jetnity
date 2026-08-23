# Jetnity Account Platform – Zielarchitektur

Stand: 23. August 2026  
Status: **Zielbild für spätere Implementierung – nicht umgesetzt**  
Workstream: Jetnity Account Platform  
Cursor-Anzeigename: **Account plattform audit vorbereitung**  
Branch: `audit/account-platform`

Fachliche Grundlage: `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`.  
Ist-Befunde: `docs/ACCOUNT_PLATFORM_AUDIT.md`.

---

## 1. Harte Trennung

> **Benutzerkonto = persönliches, dauerhaftes Zuhause.**  
> **Trip Workspace = Kommandozentrale genau einer Reise.**

Das Konto aggregiert und verwaltet. Der Workspace operiert.

Verboten:

- Flug-/Hotel-/Aktivitäten-Karten aus der Workspace-Übersicht ins Konto kopieren
- ein zweites Trip-Graph-Modell
- Account-Präferenzen als Reise-Truth
- Accountbesitzer still als einzigen Traveller behandeln
- Citizenship/Credential aus Wohnsitz, Sprache, Domain, Abflugland

---

## 2. Informationsarchitektur

Sichtbare Hauptnavigation, kompakt:

1. **Übersicht** – `/account`
2. **Reisen** – `/reisen` (bestehende Adresse behalten)
3. **Reisende** – `/account/travellers`
4. **Favoriten** – `/account/favorites`
5. **Abonnement** – `/account/subscription`
6. **Einstellungen** – `/account/settings` mit Unterseiten Sicherheit, Datenschutz, Benachrichtigungen, Profil

`/account/security` wird Unterseite von Einstellungen, nicht ein isolierter Einstieg.

### 2.1 Übersicht

Nur reiseübergreifend:

- persönliche Begrüßung aus Profil/`auth.users`, nicht erraten
- nächste oder aktive Reise + primär **Reise fortsetzen**
- kompakte offene Punkte (fehlende Traveller-Fakten, unbeendete Übernahme, Sicherheitshinweise)
- letzte Kontoaktivität, sobald es einen Audit-Log gibt
- leere Zustände: erste Reise planen, nicht Workspace-Attrappe

### 2.2 Meine Reisen

`/reisen` bleibt der Hub.

Gruppen:

- **Aktiv** – heute liegt im Reisezeitraum
- **Kommend** – Start in der Zukunft
- **Vergangen** – Ende in der Vergangenheit
- **Archiviert** – nur nach ausdrücklicher Nutzeraktion (`trips.status = archived`)
- **Entwurf / ohne Datum** – bleibt sichtbar, nicht in „Vergangen“ schieben

Ableitung zuerst aus `start_date` / `end_date`. `draft`/`planned`/`booked` bleiben Planungsstatus, nicht Zeitstatus.

Gast:

- genau eine aktive Reise
- primär Fortsetzen
- zweite Reise nur nach Konto oder ausdrücklichem Ersetzen
- niemals still überschreiben

### 2.3 Einstellungen

Tiefe statt mehr Hauptpunkte:

- Profil (Name, E-Mail-Änderung über Supabase-Double-Confirm)
- Reiseprofil (Sprache, Währung, Zeitzone, freiwillige Prefs; explizit vs. abgeleitet)
- Sicherheit
- Datenschutz
- Benachrichtigungen
- verbundene Dienste, sobald OAuth an ist

---

## 3. Schichten

```
UI (Account Shell)
  → Account-Anwendung (Übersicht, Listen, Einstellungen)
    → bestehende Trip-/Traveller-Lesepfade
    → neue Account-Registry erst nach Shared-Contract-Schnitt
      → Supabase Auth + RLS
```

Keine parallele Persistenz in Local Storage für Konto-Wahrheit. Gast bleibt Local Storage bis zur bestehenden Übernahme.

---

## 4. Identität und Profil

Heute: `auth.users` ist die Identität; `profiles` ist optional und wird für Endnutzer nicht geschrieben.

Ziel, ohne voreiligen Trigger:

1. **Kurzfristig:** Anzeige aus `auth.users.user_metadata` / E-Mail; kein erfundenes Profil.
2. **Shared-Schnitt:** genau eine Stelle legt die `profiles`-Zeile mit `role=user` an (bestehender Rollen-Trigger bleibt die Eskalationsbremse).
3. Reisepräferenzen **nicht** in Creator-Altspalten und nicht in `user_metadata` als Truth.

Accountbesitzer und Traveller bleiben verschiedene Entitäten. Ein optionales „Das bin ich“-Flag am Account-Traveller ist erlaubt, automatisch setzen ist verboten.

---

## 5. Traveller-Registry (Shared, später)

ADR-0102 bleibt bis zum Schnitt der **implementierte** Vertrag: Fakten leben an der Reise.

Zielmodell:

```
account_travellers          (stabiles Personenprofil, user_id, client_ref)
  ├─ account_traveller_citizenships
  └─ account_traveller_documents
        └─ optionale explizite citizenship_id

trips / trip_travellers
  └─ participation: account_traveller_id NULLABLE
       + weiter trip-lokale Kopie oder Snapshot der für diese Reise relevanten Fakten
```

Regeln:

- Guest hat keine Registry; Guest-Party bleibt `Trip.party`.
- Übernahme legt Registry-Einträge nur an, wenn der Nutzer sie dauerhaft speichern will **oder** nach ausdrücklicher Product-Owner-Regel „Übernahme speichert Mitreisende ins Konto“. Default-Empfehlung: **opt-in** oder „für diese Reise übernehmen + später ins Konto speichern“, um Cross-Trip-Leaks zu vermeiden (Grund von ADR-0102).
- Reisen referenzieren Teilnahme. Sie kopieren nicht still alle Kontodaten in jede Reise, außer für Freeze/Snapshot zum Zeitpunkt der Readiness-Bewertung.
- Mehrere Citizenships/Dokumente, explizite Document↔Citizenship-Zuordnung.
- Keine Passnummern, Scans, MRZ, Biometrie.
- Residenz ≠ Citizenship. Aussteller ≠ Citizenship.
- Keine Credential-Auswahl raten.
- Citizenship bleibt start-optional, Official-pflichtig nach bestehender Policy.

**Technical Lead muss die Snapshot-vs-Live-Frage entscheiden**, bevor Code entsteht. Empfehlung dieses Audits:

- Konto = lebendige Stammdaten
- Reise speichert die zum Bewertungszeitpunkt verwendeten Fakten (Fingerprint bleibt gültig)
- Änderung im Konto macht betroffene Readiness/Entry **stale/recheck**, ändert nicht still alte Aussagen

---

## 6. Guest → Account

Bestehende Pipeline behalten:

`zurUebernahme → reise_anlegen → party_schreiben → readiness → Browser streichen`

Ergänzungen später, nicht jetzt:

- Teilerfolgszustände in der Brücke
- Tests für Party/Readiness-Fail nach Graph-Erfolg
- nach Lead-Schnitt: optionales Hochziehen in die Registry
- `party_schreiben`-Replace-Semantik nur serial und getestet

Idempotenz über `(user_id, client_ref)` bleibt unverhandelbar.

---

## 7. Sicherheit

Ziel-Unterseite `/account/settings/security`:

| Fähigkeit | Quelle | Jetzt |
| --- | --- | --- |
| Passwort ändern | Supabase `updateUser` + Re-Auth | nur Reset-Mail |
| TOTP | vorhanden | verwaist, kein Step-up |
| Passkeys | später | Config aus; Copy ehrlich |
| Sessions/Geräte | Supabase Auth Sessions | fehlt |
| Logout alle Geräte | Auth API | fehlt |
| Recovery-Hinweise | Copy + E-Mail | SMTP-Limit offen |

`mfa_allow_low_aal = false` bleibt. Enroll/Unenroll nur nach Step-up.

OAuth-Buttons nur bei Enablement. Production-`site_url` / Redirects sind ein separates Ops-Gate.

---

## 8. Datenschutz

| Fähigkeit | Ziel |
| --- | --- |
| Legal | echte `/privacy` und `/terms` (oder stabile CMS-URLs) |
| Consent | Version, Zeitstempel, Quelle; nicht nur Checkbox |
| Export | maschinenlesbar: Profil, Reisen, Party, Readiness-Userstate, Consents. Keine Secrets |
| Löschung | bestätigter Flow; löscht `auth.users` und damit CASCADE; Gast-LocalStorage separat erklären |
| verbundene Dienste | widerrufbar, sobald OAuth an ist |
| Dokumententresor | **nicht** in dieser Architektur; eigenes Encryption-/PO-Gate |

Cookie-Banner erst, wenn er wahr ist.

---

## 9. Favoriten, Buchungen, Benachrichtigungen, Abo

### Favoriten

Eigene Account-Tabellen später. Keine Vermischung mit `trip_items`. Übernahme in einen Workspace ist eine bewusste Aktion.

### Buchungen

Read-Modell über bestehende `trip_items` (`booking_status`, `kind`, Trip-Titel, Daten). Keine zweite Booking-Truth. Jetnity ist nicht automatisch Verkäufer.

### Benachrichtigungen

Themen: Einreise, Safety, Seasonal/Weather, Buchung/Flug, Reiseerinnerung, später Preise.  
Kanäle: E-Mail zuerst; Push nur mit explizitem Consent.  
Safety- und Seasonal-Aussagen bleiben getrennte Wahrheiten; das Konto steuert nur Zustellung.

### Abonnement

Platzhalter gemäß `docs/MONETARISIERUNG.md`:

- zentrale Entitlement-Schicht **vor** der ersten bezahlten Funktion
- keine Produktlogik an Stripe-Objekte binden
- Admin-`payments` nicht als User-Billing missbrauchen
- Shared mit Admin/Finance

---

## 10. Geräte und Design

- dieselbe Produktlogik auf Smartphone, Tablet, Desktop
- Account-Shell: mobile Bottom- oder Header-Nav mit denselben sechs Punkten, progressive Unterseiten
- Jetnity-V2-Tokens; `/account/security` an das System angleichen
- Loading / Empty / Error / Unavailable getrennt
- Workspace-Chrome und Account-Chrome verwandt, aber nicht identisch

---

## 11. Empfohlene spätere ADRs (nicht entschieden)

| ID-Vorschlag | Thema | Warum Lead/PO |
| --- | --- | --- |
| ADR-A1 | Account-IA trennt Zuhause und Workspace | Produkt |
| ADR-A2 | Zeitgruppen aus Daten, Archiv nur explizit | vermeidet Status-Missbrauch |
| ADR-A3 | Traveller-Registry + Participation + Snapshot | ersetzt/erweitert ADR-0102 |
| ADR-A4 | Profilanlage ohne Rollen-Eskalation | Auth/Identity |
| ADR-A5 | Consent- und Export/Lösch-Vertrag | Privacy |
| ADR-A6 | Entitlement vor Billing-UI | Shared Finance |

Keine dieser ADRs wird in diesem Audit-PR als umgesetzt markiert.

---

## 12. Nicht-Ziele dieser Architektur

- Payment-Liveintegration
- Passkey-Aktivierung
- Dokumententresor
- parallele Account-DB neben `trips`
- Änderung von Route/Safety/Seasonal-Truth
- großer Workspace-Umbau
