# Jetnity – Multi-Agent Workstreams

Stand: 24. August 2026  
Status: **PR #38 hat R17 Technical Closure/PASS; erste konfliktarme Account-/Admin-Slices sind technisch entblockt**

## 1. Koordinationsprinzip

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

GitHub ist dauerhaftes Teamgedächtnis. Jeder Cursor-Agent wird ausschließlich mit seinem **exakten sichtbaren Cursor-Anzeigenamen** referenziert, sobald dieser bekannt ist.

Verbindlicher gemeinsamer Schnitt Account/Admin: `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`.

## 2. Aktive Workstreams

| Cursor-Anzeigename | Workstream | Phase | Branch / PR | Status | Nächster Schritt |
| --- | --- | --- | --- | --- | --- |
| Cursor zeigt `Reisezeitpunkt saisonale intellig...` | Travel Timing & Seasonal | Technical Closure | `feat/travel-timing-seasonal-intelligence` / PR #38 | **R17 PASS / Technical Closure**; Draft, nicht gemergt | auf Product-Owner-Entscheidung zu Mark Ready/Merge warten; Production-Migration separates Gate |
| `Account plattform audit vorbereitung` | Account Platform | Audit abgeschlossen / Implementierung entblockt | `audit/account-platform` / PR #39 | **AUDIT-PASS** als Planungsgrundlage | erster konfliktarmer Slice: AP-1 Account-Shell + persönliche Übersicht / Meine Reisen als Account-Hub |
| `Admin platform audit` | Admin Platform / Control Center | Audit abgeschlossen / Implementierung entblockt | `audit/admin-platform` / PR #40 | **AUDIT-PASS** als Planungsgrundlage | erster konfliktarmer Slice: Admin Slice A – ehrliche Control-Center-IA; danach read-only System Health |

Alle PRs/Workstreams bleiben ohne ausdrückliche Product-Owner-Freigabe **nicht Mark Ready und nicht gemergt**.

## 3. Ownership

### Account Platform – `Account plattform audit vorbereitung`

Owns primär:

- Benutzerkonto-IA/UX
- Meine Reisen als Account-Hub
- Account-Security-UX
- nutzerseitige Privacy-/Consent-/Export-/Delete-Flows
- Account-Traveller-Registry nach separatem Shared-ADR
- Favoriten, Preferences, User Notifications und Subscription-Sicht

Darf keine zweite Trip-/Traveller-/Billing-/Auth-Truth bauen.

### Admin Platform – `Admin platform audit`

Owns primär:

- Admin/Backoffice IA/UX und Jetnity Control Center
- Admin Permissions/Security-Ops
- Copilot Pro Governance
- Provider-/Cost-Control
- Finance-/Bexio-Operations-Sicht
- Ads/Marketing-/SEO-Ops
- Analytics/Support/System Operations
- System Health / Infrastructure Observability für Supabase, Vercel, GitHub und weitere betriebsrelevante Systeme
- Domains/DNS/E-Mail/Infomaniak-Readiness

Darf keine zweite Account-, Trip-, Traveller-, Billing- oder Travel-Truth bauen.

### Travel Timing & Seasonal

PR #38 ist technisch geschlossen. Der final unabhängig geprüfte Runtime-Head ist `5782401943b41ddd1eea1337c93cb37163210362`; R17-Dokument: `docs/PR38_CHATGPT_R17_REVIEW.md`.

Der PR bleibt Draft. Keine weiteren Runtime-Änderungen ohne neuen konkreten Bedarf; jede relevante neue Runtime-Änderung würde vor Integration erneut geprüft.

## 4. Gemeinsame Contracts – Technical-Lead-geschützt

Verbindliche Entscheidungen stehen in `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`.

Seriell/zentral bleiben insbesondere:

- Auth / Account Identity / Sessions / MFA / AAL
- `profiles`, Rollen und Capabilities
- RLS / Ownership / Service Role
- Support-Sicht auf fremde Reisen
- Trip Graph / Guest→Account Persistenz
- Traveller Context / Credentials / Readiness
- Route / Safety / Seasonal Truth-Verträge
- Privacy Export / Delete
- Subscription / Billing / Payment / Refund / Bexio Truth
- Admin Audit Trail
- Provider Activation / Secrets / Cost Gates

## 5. Verbindliche Integrationsreihenfolge ab R17

1. PR #38 bleibt Draft und technisch unverändert, bis der Product Owner über Mark Ready/Merge entscheidet.
2. Account darf mit AP-1 als konfliktarmem UI-/IA-Slice beginnen.
3. Admin darf parallel mit Slice A als konfliktarmem UI-/IA-Slice beginnen.
4. Nach jedem Slice unabhängiger Review vor dem nächsten Slice.
5. Read-only Admin System Health folgt als eigener konfliktarmer Slice.
6. Shared Auth/RLS/DB/Privacy/Billing/Support/Traveller-/Route-Verträge nur seriell nach zentralem Contract-Schnitt.
7. Post-Integration Cross-Domain-Review.
8. Mark Ready / Merge immer nur nach aktueller Product-Owner-Freigabe.
9. Production-Migrationen und Provider-/Secret-/Kosten-Aktivierung bleiben separate Product-Owner-Gates.

## 6. R17-Status / Infra-Grenzen

- final geprüfter PR-#38-Runtime-Head: `5782401943b41ddd1eea1337c93cb37163210362`
- R17 Review: `docs/PR38_CHATGPT_R17_REVIEW.md`
- R17-Urteil: **PASS / Technical Closure**
- GitHub Actions Runtime Run `32677741683`: SUCCESS
- Vercel Runtime Preview `dpl_74A67UxWrCLWviihrsn9hfYqqZDQ`: READY
- Supabase Development: `20260824120000` + `20260824140000`
- Supabase Production: keine dieser Route-Surface-Migrationen
- kein Live-Seasonal-Provider, keine neuen Secrets, keine neuen laufenden Providerkosten

## 7. Homepage-Workstream

Die geplante neue Startseiten-Richtung ist in `docs/HOMEPAGE_PRODUCT_PAGE_DIRECTION.md` gespeichert und bleibt pausiert. Sie ist als eigener konfliktarmer visueller Workstream vorgesehen, aber **noch nicht zur Implementierung freigegeben**. Header-/Footer-Funktionalität sowie Account/Admin/Seasonal/Auth/DB-Verträge dürfen dabei nicht verändert werden; zuerst ist eine separate visuelle Preview vorgesehen.

## 8. Pflichtstatus pro Agent

Jeder Agent dokumentiert spätestens bei Meilenstein, Blockierung, Unterbrechung und Fertigmeldung:

- exakter Cursor-Anzeigename
- Workstream
- Branch
- PR
- aktueller Runtime-/Docs-Head
- Status
- Scope / erlaubte und gesperrte Bereiche
- erledigte Arbeit
- konkrete Findings
- Tests/Gates
- offene Risiken
- Dependencies
- exakter nächster Schritt

Eine Cursor-Session darf verloren gehen, ohne dass dadurch relevanter Projektfortschritt verloren geht.

## 9. Produkttrennung

Verbindliches Detailmodell: `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`.

> **Account = persönliches dauerhaftes Zuhause des Kunden.**

> **Trip Workspace = operative Kommandozentrale einer einzelnen Reise.**

> **Admin = interne intelligente Steuerzentrale von Jetnity.**

Keine zwei konkurrierenden Dashboards und keine doppelte Source of Truth.
