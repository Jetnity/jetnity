# Jetnity – Multi-Agent Workstreams

Stand: 24. August 2026  
Status: **Account- und Admin-Audits abgeschlossen und gemeinsam geschnitten; Kernimplementierung bleibt bis technischem Closure von PR #38 gesperrt**

## 1. Koordinationsprinzip

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

GitHub ist dauerhaftes Teamgedächtnis. Jeder Cursor-Agent wird ausschließlich mit seinem **exakten sichtbaren Cursor-Anzeigenamen** referenziert, sobald dieser bekannt ist.

Verbindlicher gemeinsamer Schnitt Account/Admin: `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`.

## 2. Aktive Workstreams

| Cursor-Anzeigename | Workstream | Phase | Branch / PR | Status | Nächster Schritt |
| --- | --- | --- | --- | --- | --- |
| vollständiger Anzeigename weiterhin nicht bekannt; Cursor zeigt nur `Reisezeitpunkt saisonale intellig...` | Travel Timing & Seasonal | Runtime-Fix + Independent Review | `feat/travel-timing-seasonal-intelligence` / PR #38 | R14 fand Persistenz-Blocker 29; Draft, nicht gemergt | Blocker 29 schließen → Exact-Head-Gate → ChatGPT R15 |
| `Account plattform audit vorbereitung` | Account Platform | Audit abgeschlossen | `audit/account-platform` / PR #39 | Audit als Planungsgrundlage akzeptiert; keine Implementierung | auf PR-#38-Closure warten; danach AP-1/AP-2/AP-3 freigabefähig schneiden |
| `Admin platform audit` | Admin Platform / Control Center | Audit abgeschlossen | `audit/admin-platform` / PR #40 | Audit als Planungsgrundlage akzeptiert; keine Implementierung | auf PR-#38-Closure warten; danach zuerst Admin Slice A, anschließend read-only System Health |

Alle drei PRs/Workstreams bleiben ohne ausdrückliche Product-Owner-Freigabe **nicht Mark Ready und nicht gemergt**.

## 3. Ownership nach gemeinsamem Account/Admin-Review

### Account Platform – `Account plattform audit vorbereitung`

Owns später primär:

- Benutzerkonto-IA/UX
- Meine Reisen als Account-Hub
- Account-Security-UX
- Nutzerseitige Privacy-/Consent-/Export-/Delete-Flows
- Account-Traveller-Registry nach separatem Shared-ADR
- Favoriten, Preferences, User Notifications und Subscription-Sicht

Darf keine zweite Trip-/Traveller-/Billing-/Auth-Truth bauen.

### Admin Platform – `Admin platform audit`

Owns später primär:

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

Owns weiterhin nur PR #38 und dessen direkt notwendige Route-/Seasonal-/Readiness-Persistenzkorrekturen. Account/Admin dürfen diesen Runtime-Workstream nicht verändern.

## 4. Gemeinsame Contracts – Technical-Lead-geschützt

Verbindliche Entscheidungen stehen in `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`.

Seriell/zentral bleiben insbesondere:

- Auth / Account Identity / Sessions / MFA / AAL
- `profiles`, Rollen und Capabilities
- RLS / Ownership / Service Role
- Support-Sicht auf fremde Reisen
- Trip Graph / Guest→Account Persistenz
- Traveller Context / Credentials / Readiness
- Privacy Export / Delete
- Subscription / Billing / Payment / Refund / Bexio Truth
- Admin Audit Trail
- Provider Activation / Secrets / Cost Gates

## 5. Verbindliche Integrationsreihenfolge

1. PR #38 Blocker 29 schließen.
2. Exact-Head-Gate und unabhängiger ChatGPT R15.
3. Wenn R15 nach Stop-Kriterium keinen neuen konkreten relevanten Defekt findet: technisches Closure/PASS für PR #38 dokumentieren; PR bleibt trotzdem Draft bis Product-Owner-Freigabe.
4. Danach konfliktarme UI-Slices freigeben:
   - Account AP-1 / AP-2 / AP-3
   - Admin Slice A (ehrliche Control-Center-IA / Legacy-Lügen entfernen)
5. Read-only Admin System Health kann danach als eigener konfliktarmer Slice folgen.
6. Shared Auth/RLS/DB/Privacy/Billing/Support/Traveller-Slices nur seriell nach dem zentralen Contract-Schnitt.
7. Post-Integration Cross-Domain-Review.
8. Mark Ready / Merge immer nur nach aktueller Product-Owner-Freigabe.

## 6. Pflichtstatus pro Agent

Jeder Agent dokumentiert spätestens bei Meilenstein, Blockierung, Unterbrechung und Fertigmeldung:

- exakter Cursor-Anzeigename
- Workstream
- Branch
- PR
- aktueller Runtime-/Docs-Head
- Status: geplant / arbeitet / blockiert / Review / fertig / integriert
- Scope / erlaubte und gesperrte Bereiche
- erledigte Arbeit
- konkrete Findings
- Tests/Gates
- offene Risiken
- Dependencies
- exakter nächster Schritt

Eine Cursor-Session darf verloren gehen, ohne dass dadurch relevanter Projektfortschritt verloren geht.

## 7. Produkttrennung

Verbindliches Detailmodell: `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`.

> **Account = persönliches dauerhaftes Zuhause des Kunden.**

> **Trip Workspace = operative Kommandozentrale einer einzelnen Reise.**

> **Admin = interne intelligente Steuerzentrale von Jetnity.**

Keine zwei konkurrierenden Dashboards und keine doppelte Source of Truth.
