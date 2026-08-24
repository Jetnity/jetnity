# Jetnity – Multi-Agent Workstreams

Stand: 24. August 2026  
Status: **PR #38 vollständig integriert; Account- und Admin-Implementierung als nächste parallele Workstreams**

## 1. Koordinationsprinzip

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

GitHub ist dauerhaftes Teamgedächtnis. Jeder Cursor-Agent wird mit seinem exakten sichtbaren Cursor-Anzeigenamen referenziert, sobald dieser bekannt ist.

Verbindlicher gemeinsamer Schnitt: `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`.

## 2. Workstreams

| Cursor-Anzeigename | Workstream | Branch / PR | Status | Nächster Schritt |
| --- | --- | --- | --- | --- |
| `Reisezeitpunkt saisonale intellig...` | Travel Timing & Seasonal | PR #38 | **R17 PASS, gemergt, Production integriert** | abgeschlossen; nur bei konkretem neuen Defekt erneut öffnen |
| `Account plattform audit vorbereitung` | Account Platform | `audit/account-platform` / PR #39 | **AUDIT-PASS, Implementierung entblockt** | AP-1 Account-Shell + persönliche Übersicht / Meine Reisen |
| `Admin platform audit` | Admin Platform / Control Center | `audit/admin-platform` / PR #40 | **AUDIT-PASS, Implementierung entblockt** | Admin Slice A – ehrliche Control-Center-IA; danach read-only System Health |

Kein künftiger PR wird ohne ausdrückliche aktuelle Product-Owner-Freigabe Mark Ready oder gemergt.

## 3. PR #38 Abschluss

- final geprüfter Runtime-Head: `5782401943b41ddd1eea1337c93cb37163210362`
- finaler PR-Head: `1a61d21fe853c77faa1109ae0828e39f3629098a`
- Squash-Merge: `ee988bbe46a8dd63d4001c42825fc0159453f811`
- Main-CI `32681199019`: SUCCESS
- Vercel Production: READY
- Supabase Production: ACTIVE_HEALTHY
- Route-Surface-Migrationen `20260824120000` und `20260824140000`: Production angewendet
- manipulierte Client-Surface wird auf Production verworfen
- kein Live-Seasonal-Provider, keine neuen Secrets, keine neuen laufenden Providerkosten

## 4. Account Ownership

Account owns primär:

- Benutzerkonto-IA/UX
- Meine Reisen als Account-Hub
- Account-Security-UX
- nutzerseitige Privacy-/Consent-/Export-/Delete-Flows
- Account-Traveller-Registry nach separatem Shared-ADR
- Favoriten, Preferences, User Notifications und Subscription-Sicht

Account darf keine zweite Trip-/Traveller-/Billing-/Auth-/Route-Truth bauen.

## 5. Admin Ownership

Admin owns primär:

- Admin/Backoffice IA und Jetnity Control Center
- Admin Permissions/Security-Ops
- Copilot Pro Governance
- Provider-/Cost-Control
- Finance-/Bexio-Operations-Sicht
- Ads/Marketing-/SEO-Ops
- Analytics/Support/System Operations
- System Health / Infrastructure Observability
- Domains/DNS/E-Mail/Infomaniak-Readiness

Admin darf keine zweite Account-, Trip-, Traveller-, Billing- oder Travel-Truth bauen.

## 6. Shared Contracts – Technical-Lead-geschützt

Seriell/zentral bleiben insbesondere:

- Auth / Account Identity / Sessions / MFA / AAL
- `profiles`, Rollen und Capabilities
- RLS / Ownership / Service Role
- Support-Sicht auf fremde Reisen
- Trip Graph / Guest→Account Persistenz
- Traveller Context / Credentials / Readiness
- Route / Safety / Seasonal Truth
- Privacy Export / Delete
- Subscription / Billing / Payment / Refund / Bexio
- Admin Audit Trail
- Provider Activation / Secrets / Cost Gates

## 7. Verbindliche Integrationsreihenfolge

1. Account AP-1 und Admin Slice A dürfen parallel starten.
2. Nach jedem Slice unabhängiger Review vor dem nächsten Slice.
3. Read-only Admin System Health folgt als eigener Slice.
4. Shared Contracts nur seriell nach zentralem Schnitt.
5. Post-Integration Cross-Domain-Review.
6. Mark Ready / Merge nur mit aktueller Product-Owner-Freigabe.
7. Production-Migrationen sowie Provider-/Secret-/Kosten-Aktivierung bleiben separate Gates.

## 8. Homepage

Die geplante neue Startseiten-Richtung ist in `docs/HOMEPAGE_PRODUCT_PAGE_DIRECTION.md` gespeichert und bleibt pausiert. Sie ist ein eigener konfliktarmer visueller Workstream. Zuerst separate visuelle Preview; keine neue Funktionslogik und keine Änderung der Header-/Footer-Funktionalität.

## 9. Pflichtstatus pro Agent

Jeder Agent dokumentiert bei Meilenstein, Blockierung, Unterbrechung und Fertigmeldung:

- exakter Cursor-Anzeigename
- Workstream
- Branch / PR
- Runtime-/Docs-Head
- Status
- Scope / gesperrte Bereiche
- erledigte Arbeit
- Findings
- Tests/Gates
- offene Risiken
- Dependencies
- exakter nächster Schritt

Eine Cursor-Session darf verloren gehen, ohne dass relevanter Projektfortschritt verloren geht.