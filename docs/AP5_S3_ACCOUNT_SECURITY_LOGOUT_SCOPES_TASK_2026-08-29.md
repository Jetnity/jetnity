# Jetnity – AP-5-S3 Account Security Logout Scopes – Technical-Lead Task

Stand: 29. August 2026  
Status: **VERSIONIERTER STARTAUFTRAG / NORMALER TECHNICAL-LEAD-GATE / KEIN PO-SONDERGATE**  
Workstream: Account / Security  
Issue: #153  
Baseline: `main @ 3c3079defb4eb5bcea4b8cb0ec8d73eff7806c9a`  
Branch: `feat/ap5-s3-account-security-logout-scopes-2026-08-29`

> Live-Evidence gewinnt immer. Dieser Task ist ein Startvertrag, keine spätere PASS-Evidence.

## 1. Ziel

AP-5-S3 macht Jetnitys vorhandene Supabase-Abmelde-Semantik in `/account/security` professionell, verständlich und wahrheitsgetreu nutzbar, ohne neue Auth-/Session-Architektur zu erfinden.

Produktziel:

- Nutzer können **nur diese Sitzung / dieses Gerät** abmelden (`local`).
- Nutzer können **andere Sitzungen** abmelden und die aktuelle behalten (`others`).
- Nutzer können **überall** abmelden (`global`) und damit die bereits bestehende globale Jetnity-Semantik explizit verstehen.
- Zustände und Fehlersituationen bleiben ehrlich; kein Server-Revoke wird behauptet, wenn die API nicht erfolgreich bestätigt werden kann.

## 2. Kanonische Ausgangswahrheit

Aus AP-5 Gate 0 und integriertem AP-5-S1/S2:

- `signOut()` ohne Scope ist heute global.
- Supabase User Client unterstützt `signOut({ scope: 'local' | 'others' | 'global' })`.
- `others` behält die aktuelle Sitzung.
- Ein Access Token kann bis zu seinem Ablauf weiter gültig sein; Logout bedeutet nicht automatisch sofortiges JWT-Kill.
- Jetnity hat keine unterstützte user-facing API zum Auflisten aller Sessions/Geräte. S3 darf deshalb **keine Sessionliste vortäuschen**.
- AP-5-S1 und S2 sind integriert; S3 darf diese Verträge nicht zurückbauen.

## 3. Scope

### 3.1 UI / UX

Die bestehende `/account/security`-Oberfläche um einen klaren Bereich für Abmelden/Sitzungen ergänzen oder den vorhandenen Bereich entsprechend ausbauen.

Mindestens:

1. Aktion **Dieses Gerät abmelden** → `local`.
2. Aktion **Andere Geräte abmelden** → `others`.
3. Aktion **Überall abmelden** → `global`.
4. Gefährlichere Aktion `global` visuell und semantisch klarer als `local`/`others` behandeln.
5. Auf Mobile und Desktop konsistent; keine abgeschnittenen Controls, keine Hover-only-Bedeutung.
6. Tastaturbedienung, sichtbarer Fokus, sinnvolle Beschriftungen und Live-Status für asynchrone Aktionen.

### 3.2 Product Truth / Statusmodell

Keine impliziten Erfolgsmeldungen. Mindestens unterscheiden:

- idle
- working
- success
- error
- unavailable
- unsupported, falls die verwendete Fähigkeit in einer späteren Client-/Runtime-Variante nicht verfügbar sein sollte

Die UI darf bei `others` nicht behaupten, wie viele andere Sitzungen existieren oder beendet wurden.

### 3.3 Auth-Implementierung

- Nutze ausschließlich die bestehende Supabase User-Auth-API.
- Keine Service Role.
- Keine direkte Abfrage von `auth.sessions`.
- Keine neue Datenhaltung für Sessions/Devices.
- `local`, `others`, `global` müssen explizit und testbar sein.
- Bestehende globale Sign-out-Pfade außerhalb `/account/security` nicht still auf `local` ändern.
- Redirect-/Client-State-Verhalten nach `local`/`global` muss konsistent mit einer verlorenen lokalen Session sein.
- `others` darf die aktuelle Session nicht zerstören.

### 3.4 Security

- Keine Tokens, Session IDs, Refresh Tokens oder Auth-Fehlerrohtexte loggen.
- Keine unbekannten Supabase-/GoTrue-Rohmeldungen ungefiltert an Nutzer durchreichen, wenn sie interne Details enthalten könnten.
- Kein Claim, dass noch gültige Access Tokens serverseitig sofort invalidiert wurden.
- Netzwerkfehler bzw. nicht bestätigte Server-Revoke-Situation als Fehler/unbestätigt behandeln.
- Kein Client-only "success" falls der relevante API-Aufruf tatsächlich fehlschlägt.

### 3.5 Tests / Evidence

Mindestens:

- Unit-/Contract-Tests für exakte Scope-Zuordnung `local` / `others` / `global`.
- Regression: bestehendes allgemeines Jetnity-Abmelden bleibt global.
- Regression: `others` darf keinen lokalen Signed-Out-Pfad auslösen.
- Error-/Unavailable-State.
- Keine Session-Count-/Device-List-Behauptung.
- relevante Accessibility-/UI-Contract-Tests.
- bestehende AP-5 Gate-0-, S1-, S2-Tests weiter grün.
- vollständige Repository-Gates, GitHub Actions und Vercel Preview auf finalem Exact Head.

## 4. Hard Non-Scope

Nicht in S3:

- AP-5-S4 MFA-Step-up
- AP-5-S5 echte oder simulierte Session-/Geräteliste
- Consumer-AAL2
- Änderung von `supabase/config.toml`
- Auth-/MFA-/AAL-Grundlogik
- Session-Architektur oder zusätzliche Session-Persistenz
- DB-Migration
- RLS / Ownership / Identity
- Service Role
- Passkeys/OAuth live
- Recovery-Vertrag ändern
- AP-6 / Consent / Legal
- AP-7 Registry
- Provider / Payments / Growth / Public Launch / Domain / Native
- Branch Protection

## 5. Agent / Governance

Frischer logischer Cursor-Agent für diesen Slice:

`Cursor-Agent: Account plattform audit vorbereitung 13`

Generation 13 wird ausschließlich für AP-5-S3 verwendet. Nicht für S4 oder S5 wiederverwenden.

Cursor-Regeln:

- implementiert nur auf dem S3-Branch;
- hält PR Draft;
- setzt niemals Ready;
- merged niemals;
- führt Self-Review aus, aber Self-Review ist kein TL-PASS;
- bei CHANGES REQUIRED behebt **derselbe logische Agent / dieselbe Session** die S3-Funde;
- stoppt nach S3-Handoff; startet S4 nicht.

Technical-Lead-Regeln:

- unabhängiger Exact-Head-Review;
- jeder neue Push invalidiert ältere Gates;
- CI, Vercel Preview, Review Threads und Scope-Diff exakt verifizieren;
- nur bei P0=0 und blocking P1=0 integrieren;
- Post-Merge `main` + CI + Vercel Production prüfen;
- danach erst frischen S4-Task + frischen Agenten starten.

## 6. Abnahmekriterien

PASS nur wenn:

1. drei Logout-Semantiken fachlich korrekt und eindeutig umgesetzt sind;
2. keine Sessionliste oder Sessionanzahl erfunden wird;
3. `others` die aktuelle Sitzung bewahrt;
4. `local` und `global` lokalen Auth-Zustand korrekt verlassen;
5. bestehende globale Standard-Abmeldung außerhalb des Security-Panels nicht still verändert wurde;
6. Fehlerzustände nicht als Erfolg kaschiert werden;
7. keine Auth-/RLS-/DB-/Config-Sondergate-Fläche verändert wurde;
8. Accessibility/Mobile/Desktop-Vertrag intakt ist;
9. alle fokussierten und vollständigen Gates grün sind;
10. finaler Exact Head unabhängig reviewed und auf Vercel READY ist.

## 7. STOP

Nach Implementierung, Self-Review, Tests und persistiertem Handoff: **STOP für unabhängigen Technical-Lead Exact-Head-Review. Kein Ready, kein Merge, kein AP-5-S4 durch den Agenten.**
