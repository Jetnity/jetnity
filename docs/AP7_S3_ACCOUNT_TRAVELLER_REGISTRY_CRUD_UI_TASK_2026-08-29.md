# Jetnity – AP-7-S3 Account Traveller Registry CRUD / UI Task

Stand: 29. August 2026  
Status: **TECHNICAL-LEAD AUTHORIZED / BOUNDED RUNTIME SLICE / NO SCHEMA CHANGE**  
Issue: #214  
Baseline: `main @ b2857117741aad47a2bca3d198e5a0a88b4a0415`  
Cursor-Agent: `Account plattform audit vorbereitung 17`

## 1. Ziel

Die in AP-7-S2 bereits produktiv vorhandene Account Traveller Registry wird für den eingeloggten Owner als echte Account-Funktion nutzbar.

Binding Dual-Authority bleibt unverändert:

> Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
> Trip Snapshot = einzige Current Truth einer konkreten Reise.

Dieser Slice baut ausschließlich die Registry-eigene CRUD-/UI-Fläche. Er materialisiert nichts in Reisen und koppelt bestehende Reisen nicht an Registry-Einträge.

## 2. Verifizierte Baseline

Vor Slice-Cut:

- `main`: `b2857117741aad47a2bca3d198e5a0a88b4a0415`;
- GitHub post-merge CI #1273 / Run `33275394476`: SUCCESS auf exakt diesem SHA;
- Vercel Production `dpl_Fp2KT3Bb2dPaS8Z6rEdzs4wbGjCu`: READY auf exakt diesem SHA;
- Production Supabase `qscbgcdmivbbnzrcyegn`: AP-7-S2 Migration `20260829210052_account_traveller_registry_persistence` live/verifiziert;
- Tabellen: `account_travellers`, `account_traveller_citizenships`, `account_traveller_documents`;
- Owner-only RLS aktiv; `anon` ohne Tabellenrechte; `authenticated` CRUD unter Owner-RLS;
- `lib/traveller/account-registry.ts` ist der bindende Shared Domain Contract;
- `app/account` hat aktuell keine Traveller-Route;
- `lib/account/navigation.ts` enthält bewusst noch keinen Reisende-Link.

Live-Evidence gewinnt. Agent muss vor Handoff `origin/main` erneut prüfen und Drift melden.

## 3. Acceptance Criteria

### 3.1 Account Surface

1. Eine echte, authentifizierte Account-Fläche unter `/account/travellers` existiert.
2. `Reisende` wird erst mit dieser realen Route in die kompakte Account-Navigation aufgenommen.
3. Mobile-first Layout, Keyboard-Bedienbarkeit, sichtbare Labels/Focus-Zustände und sinnvolle semantische Controls.
4. Loading, Empty, Error und Success werden wahrheitsgetreu getrennt; kein leeres Ergebnis als Fehler und kein Fehler als „keine Reisenden“.

### 3.2 Traveller CRUD

Owner kann über bestehende authenticated Session + bestehende S2-RLS:

- Registry Traveller auflisten;
- Traveller erstellen;
- Label und Residence Country ändern;
- Traveller löschen.

Delete-Copy muss eindeutig klarstellen: Registry-Eintrag wird gelöscht; bereits vorhandene Trip Snapshots werden dadurch nicht umgeschrieben oder gelöscht.

Keine Service Role und kein privilegierter Server-Bypass.

### 3.3 Citizenship CRUD

- mehrere Staatsbürgerschaften sind first-class;
- hinzufügen / entfernen möglich;
- max. 8 wird UI-seitig respektiert und DB bleibt Backstop;
- duplicate country wird nicht als zweite Wahrheit erzeugt;
- keine „primäre“, „bevorzugte“ oder Default-Citizenship.

### 3.4 Document Metadata CRUD

- mehrere Dokument-Metadaten sind first-class;
- Typ ausschließlich bestehender Contract (`passport`, `national_id`, `unknown`);
- Issuing Country ist explizit getrennt von Citizenship;
- optionaler expliziter Bezug auf eine Citizenship desselben Registry Travellers;
- `expires_on` nur als vorhandenes datensparsames Metadatum;
- max. 12 wird UI-seitig respektiert und DB bleibt Backstop;
- keine Default-/Primary-/Chosen-Pass-Semantik.

### 3.5 Sensitive Data Boundary

UI, Actions, Types, Logs, Error Copy und Tests dürfen keine Eingabefelder oder Payloads für folgende Daten einführen:

- Pass-/Dokumentnummern;
- Scans/Bilder;
- MRZ;
- Biometrics;
- DOB/Geburtsdatum;
- Health/Medical/Vaccination Daten.

Keine Freitextfläche darf als Hintertür für solche Daten dienen.

### 3.6 Truth / Isolation

- Nur eigene Registry-Daten werden gelesen/geschrieben; bestehende S2-RLS bleibt Authority.
- Kein Registry Edit schreibt bestehende Trip Snapshots um.
- Keine Registry→Trip Materialisierung, Auswahl oder Import-Schaltfläche in S3.
- Kein Guest→Registry Import oder stilles Profil aus Guest-Daten.
- `issuer != citizenship` bleibt erhalten.
- keine `documents[0]`, `citizenships[0]`, first-item, chosen/default/primary Semantik.

## 4. Implementierungsgrenzen

Bevorzugt bestehende Next-/Supabase-/Account-Patterns wiederverwenden. Neue Helper dürfen eingeführt werden, wenn sie eng Registry-owned sind und `lib/traveller/account-registry.ts` nicht semantisch duplizieren.

Keine Migration ist in diesem Slice erlaubt. Wenn ein sauberer CRUD/UI-Endzustand eine Schema-/RLS-/Grant-/Ownership-Änderung zu benötigen scheint: **STOPP / BLOCKED melden**, nicht erweitern.

Ebenso keine neue Server-privileged Registry API, solange existing authenticated+RLS sauber genügt.

## 5. Hard Non-Scope

Kein:

- neues Schema, Migration, RLS, Policy, GRANT/REVOKE, Trigger, Function oder Ownership-Change;
- Service Role / Admin / Support Cross-Account Access;
- Auth / Session / MFA / AAL Änderung;
- Registry→Trip Runtime / Materialisierung / Provenance-Link;
- Guest→Registry Import, Dedup, Backfill;
- Änderung an `trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents`;
- stille Änderung historischer Trip Snapshots;
- Default/Preferred/Primary/Chosen Credential;
- sensitive Dokumentdaten;
- AP-8 Reiseprofil;
- Provider Runtime/Secrets/Paid Calls;
- TW-8;
- Payments/Subscription live;
- Branch Protection;
- Public Launch / Domain Cutover;
- automatischer Folgeslice.

## 6. Tests / Evidence

Mindestens gezielt abdecken:

- Account navigation active-state für `/account/travellers`;
- Empty ≠ Error ≠ Loading;
- create/update/delete Traveller contract;
- multi-citizenship, duplicate prevention/DB-error handling, 8-limit UX;
- multi-document, 12-limit UX;
- issuer and citizenship remain independently selectable;
- nullable citizenship relation;
- deleting citizenship handles the DB `SET NULL` result honestly;
- no default/first-item behavior;
- deletion copy/behavior does not imply trip deletion;
- sensitive-field boundary regression;
- unauthorized/unauthenticated behavior follows current account/auth contract;
- Typecheck, Lint, complete repository tests and Production build;
- exact-head GitHub Actions + Vercel Preview before agent STOP.

Wenn browser-/real-device Evidence nicht technisch verfügbar ist, nicht erfinden; klar als residual dokumentieren.

## 7. Deliverables

Agent liefert auf demselben Branch mindestens:

- Runtime/UI + benötigte eng begrenzte registry-owned helpers/tests;
- versionierten AP-7-S3 Status;
- Self-Review;
- Handoff mit exact head, Tests, Risiken/Residuals und Scope-Nachweis;
- falls Architekturentscheidung nötig wird: dokumentieren und STOPP, nicht still erweitern.

`JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md` oder andere global single-writer Continuity-Dateien nur ändern, wenn der Task dies ausdrücklich nachträglich verlangt. Der Technical Lead übernimmt finale globale Continuity.

## 8. Agent Governance / STOPP

Verbindlich:

- `Cursor-Agent: Account plattform audit vorbereitung 17`;
- PR bleibt Draft;
- **do not mark Ready**;
- **do not merge**;
- keine Production-/Supabase-Mutation;
- kein Follow-up Slice;
- nach finalem Push + Self-Review + exact-head gates **STOPP für unabhängigen ChatGPT / Technical-Lead Review**;
- unmittelbare CHANGES-REQUIRED-Fixes erfolgen in derselben Agent-Session und ausschließlich im S3-Scope.
