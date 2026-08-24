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
| vollständiger Anzeigename weiterhin nicht bekannt; Cursor zeigt nur `Reisezeitpunkt saisonale intellig...` | Travel Timing & Seasonal | Runtime-Fix + Independent Review | `feat/travel-timing-seasonal-intelligence` / PR #38 | R16 fand Truth-/Provenance-Blocker 31; Draft, nicht gemergt | Blocker 31 schließen → neues Exact-Head-Gate → ChatGPT R17 |
| `Account plattform audit vorbereitung` | Account Platform | Audit abgeschlossen | `audit/account-platform` / PR #39 | **AUDIT-PASS** als Planungsgrundlage; keine Implementierung | auf PR-#38-Closure warten; danach AP-1/AP-2/AP-3 freigabefähig schneiden |
| `Admin platform audit` | Admin Platform / Control Center | Audit abgeschlossen | `audit/admin-platform` / PR #40 | **AUDIT-PASS** als Planungsgrundlage; keine Implementierung | auf PR-#38-Closure warten; danach zuerst Admin Slice A, anschließend read-only System Health |

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

Owns weiterhin nur PR #38 und dessen direkt notwendige Route-/Seasonal-/Readiness-Persistenz- und Trust-Grenzen-Korrekturen. Account/Admin dürfen diesen Runtime-Workstream nicht verändern.

Aktueller Blocker 31 betrifft die gemeinsame Route-Truth-Grenze Browser/LocalStorage/Guest → Server → DB. Solange PR #38 offen ist, bleibt die Korrektur im PR-#38-Workstream; Account/Admin dürfen hierzu keinen parallelen Contract bauen.

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

1. PR #38 **R16-Blocker 31** kohärent schließen: untrusted Browser-/LocalStorage-/Guest-`routeItinerary` darf `surfaceFromAirportCode` nicht allein durch syntaktische Plausibilität zu belegter Surface-Truth machen.
2. Neues Exact-Head-Gate auf dem korrigierten Runtime-Head.
3. Unabhängiger ChatGPT-Re-Review **R17** über Evidence-Provenance, Save→Reload, Guest/Account-Parität, Cross-Domain-Truth und prior blockers.
4. Wenn R17 nach Stop-Kriterium keinen neuen konkreten relevanten Defekt findet: technisches Closure/PASS für PR #38 dokumentieren; PR bleibt trotzdem Draft bis Product-Owner-Freigabe.
5. Danach konfliktarme UI-Slices freigeben:
   - Account AP-1 / AP-2 / AP-3
   - Admin Slice A (ehrliche Control-Center-IA / Legacy-Lügen entfernen)
6. Read-only Admin System Health kann danach als eigener konfliktarmer Slice folgen.
7. Shared Auth/RLS/DB/Privacy/Billing/Support/Traveller-Slices nur seriell nach dem zentralen Contract-Schnitt.
8. Post-Integration Cross-Domain-Review.
9. Mark Ready / Merge immer nur nach aktueller Product-Owner-Freigabe.

## 6. R16-Status / Infra-Grenzen

- letzter gegateter PR-#38-Runtime-Head: `5cc4488e3b30aeb3c8afe1eb2ff7bc9627987e88`
- R16 Review: `docs/PR38_CHATGPT_R16_REVIEW.md`
- R16-Urteil: **REQUEST CHANGES / Blocker 31**
- Supabase Route-Surface-Migration `20260824120000_flug_route_itinerary_surface_evidence`: Development ja, Production nein
- keine Production-Migration durch R16
- kein Live-Seasonal-Provider, keine neuen Secrets, keine neuen laufenden Providerkosten

## 7. Pflichtstatus pro Agent

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

## 8. Produkttrennung

Verbindliches Detailmodell: `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`.

> **Account = persönliches dauerhaftes Zuhause des Kunden.**

> **Trip Workspace = operative Kommandozentrale einer einzelnen Reise.**

> **Admin = interne intelligente Steuerzentrale von Jetnity.**

Keine zwei konkurrierenden Dashboards und keine doppelte Source of Truth.
