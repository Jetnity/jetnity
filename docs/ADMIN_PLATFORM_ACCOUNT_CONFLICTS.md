# Admin Platform – Konflikte mit Account-Workstream und PR #38

Stand: 24. August 2026  
Cursor-Anzeigename: `Admin platform audit`

Account-Auftrag: `docs/CURSOR_ACCOUNT_PLATFORM_AUDIT_TASK.md`  
Account-Modell: `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`  
Koordination: `docs/MULTI_AGENT_WORKSTREAMS.md`  
Seasonal-PR: [#38](https://github.com/Jetnity/jetnity/pull/38) `feat/travel-timing-seasonal-intelligence` (Draft, offen)

## 1. Prinzip

Admin und Account teilen Identität, Rolle, Privacy und später Billing. Sie teilen **nicht** die UX. Account ist das Zuhause des Kunden. Admin ist das interne Control Center. Trip Workspace bleibt die operative Reiseoberfläche.

## 2. Shared Contracts – nicht parallel editieren

| Contract | Owner-Richtung | Admin darf in Audit | Spätere Implementierung |
| --- | --- | --- | --- |
| `profiles` / Rolle / Status | Lead | nur analysieren | seriell nach Slice 0 |
| `darf_*` / neue Capabilities | Lead | vorschlagen | eine Migration, ein Agent |
| Auth Sessions / MFA / Passkeys | Account + Security | Admin-AAL2 vorschlagen | nicht zwei MFA-Modelle |
| Guest→Account / Trip-Persistenz | Account + Travel | nicht anfassen | Admin nur read-only Support |
| Traveller / Credentials | Foundation E / Account | nicht anfassen | keine Admin-Klartexte |
| Readiness / Route / Safety / Seasonal | Fach-Workstreams | nicht anfassen | keine Admin-Overrides |
| Billing / Abo / Refund / Payments | Lead | ehrliches Label | eine SoT, zwei Sichten |
| Privacy Export / Delete | Account | Support begleiten | Admin führt nicht still Delete aus |
| Provider Activation / Secrets | Lead / PO | Status zeigen | kein Admin-Toggle ohne Gate |

## 3. Konkrete Konfliktstellen

### 3.1 `profiles.role` inklusive `creator`

Admin Users kann Rollen vergeben. Account-Audit plant Konto-IA ohne Creator-Plattform. Eine stillschweigende Entfernung von `creator` bricht Admin-Tests und den DB-Check. Entscheidung: Product Owner, Umsetzung: ein PR.

### 3.2 MFA

Account besitzt TOTP. Admin verlangt es nicht. Zwei getrennte MFA-Stacks wären falsch. Ziel: dieselbe Supabase-AAL, härtere Anforderung auf Admin-Writes.

### 3.3 Support vs. „Meine Reisen“

Account zeigt dem Nutzer seine Reisen. Admin braucht Support-Sicht fremder Reisen. Heutige RLS verbietet das auch für Owner. Eine Policy „Admins sehen alle trips“ wäre ein schwerer Privacy-Konflikt mit Account/DSG.

Empfehlung: minimierte SECURITY DEFINER-RPC mit Allowlist-Feldern, Audit, keine Credentials. Schnitt nur durch Lead.

### 3.4 Billing

Account-Modell: Tarif, Rechnungen, Zahlungsmittel. Admin: Payments-Center + später Bexio. Heute gibt es nur lokale `payments`. Beide Workstreams dürfen keine parallelen Abo-Tabellen erfinden.

### 3.5 Delete / Export

Account ist der Nutzerpfad. Admin darf Anfragen nur begleiten. Service-Role-Delete aus dem Admin ohne Audit wäre ein Konflikt und ein Security-Defekt.

### 3.6 Notifications

Account plant Nutzer-Benachrichtigungen. Admin-Topbar hat Fake-Ops-Notifications. Nicht dieselbe Tabelle zweckentfremden.

### 3.7 E-Mail-Adressen

Admin Users zeigt `profiles.email`. Account-Privacy kann Minimierung verlangen. Support braucht Erreichbarkeit. Lead entscheidet Sichtbarkeit (z. B. nur `operator+` oder Maskierung).

## 4. PR #38

Geprüft am 24.08.2026: PR #38 offen, Draft, CI/Vercel zuletzt SUCCESS, Mergeable. Head-Workstream ist Seasonal, nicht Admin.

Admin-Audit hat Seasonal-Code nicht geändert. Implementierungsslices dürfen Seasonal-/Safety-/Readiness-/Route-Dateien nicht mitändern.

Abhängigkeit: unkoordinierte Kernimplementierung bleibt bis technischem Closure von #38 gesperrt (`MULTI_AGENT_WORKSTREAMS.md`). Audit-Doku ist erlaubt.

Wenn #38 Shared Zeit-/Route-Felder ändert, braucht eine spätere Support-Reiseansicht dieselben kanonischen Felder – keine Admin-Kopie.

## 5. Empfohlene Integrationsreihenfolge

1. #38 Closure/PASS (Draft bleibt bis PO-Merge).
2. Account-Audit-Ergebnisse lesen (dieser Admin-Audit kennt den Account-Ist-Code nur soweit im aktuellen Branch sichtbar: Account-UI ist heute schmal, vor allem `/account/security`).
3. Lead-Schnitt Shared Contracts.
4. Admin Slice A (nur UI/IA) parallel zu unstrittigen Account-UX-Slices möglich.
5. Alles mit RLS/profiles/payments seriell.

## 6. Was der Admin-Agent nicht tun wird

- Account-Seiten umbauen
- PR #38 review-fixen oder mergen
- Rollen in Production anlegen
- Trip-RLS erweitern
