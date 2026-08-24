# Jetnity – Multi-Agent Workstreams

Stand: 23. August 2026  
Status: **Vorbereitungsphase – Audit-Agenten dürfen starten; parallele Kernimplementierung bleibt bis technischem Closure von PR #38 gesperrt**

## 1. Koordinationsprinzip

> **Parallel entwickeln, zentral koordinieren, unabhängig prüfen, kontrolliert integrieren.**

GitHub ist dauerhaftes Teamgedächtnis. Jeder Cursor-Agent wird ausschließlich mit seinem **exakten sichtbaren Cursor-Anzeigenamen** referenziert, sobald dieser bekannt ist.

## 2. Aktive / vorbereitete Workstreams

| Cursor-Anzeigename | Workstream | Phase | Basis | Erlaubt | Gesperrt | Nächster Schritt |
| --- | --- | --- | --- | --- | --- | --- |
| wird nach Start eingetragen | Travel Timing & Seasonal / PR #38 | Runtime-Fix + Review | `feat/travel-timing-seasonal-intelligence` | R11-Blocker 24–26 schließen, Tests/Gates/Handoff | Mark Ready/Merge ohne Product Owner | Fix 24–26 → Exact-Head-Gate → ChatGPT R12 |
| wird nach Start eingetragen | Account Platform | Audit / Vorbereitung | eigener Branch von `main` bzw. freigegebener Prep-Basis | Code-/DB-/UX-Audit, Architektur, Evidence-Matrix, Implementierungsplan, Doku | unkoordinierte Auth/RLS/DB/Truth-Implementierung, Migration, Production | `docs/CURSOR_ACCOUNT_PLATFORM_AUDIT_TASK.md` ausführen |
| Admin platform audit | Admin Platform | AUDIT-PASS, Draft PR #40; bleibt für Implementierungs-Slices | `audit/admin-platform` | aktuell nur Doku; nach #38-Closure + Freigabe Slice A | Rollen/RLS/Service-Role/Payment/Bexio/Ads/Provider/Infomaniak Live, kein Mark Ready/Merge ohne PO | PR #38 Closure; danach Slice A durch denselben Agenten; Shared Contracts aus `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md` |

## 3. Ownership-Grenzen während der Auditphase

### Travel Timing & Seasonal Agent

Owns aktuell nur den laufenden PR-#38-Härtungszyklus und dessen direkt notwendige Route-/Seasonal-/Readiness-Fixes.

Account/Admin-Audit-Agenten dürfen diesen Runtime-Workstream nicht verändern.

### Account Platform Audit Agent

Owns Analyse und Zielplanung für:

- Benutzerkonto-IA/UX
- Meine Reisen als Account-Hub
- Traveller-Verwaltung aus Account-Sicht
- Auth-/Security-Audit
- Guest→Account-Audit
- Privacy/Data/Notifications/Subscription-Readiness

Darf gemeinsame Auth/RLS/DB/Traveller-Contracts in dieser Phase nur analysieren, nicht verändern.

### Admin Platform Audit Agent

Owns Analyse und Zielplanung für:

- Admin/Backoffice IA/UX
- Admin Auth/Permissions/Security
- Copilot Pro Governance
- Provider-/Cost-Control
- Finance/Bexio-Readiness
- Ads/Marketing-Ops-Readiness
- Analytics/Support/System Operations

Darf gemeinsame Auth/RLS/DB/Service-Role-/Payment-/Provider-Contracts in dieser Phase nur analysieren, nicht verändern.

## 4. Gemeinsame Contracts – vorerst Lead-geschützt

Folgende Bereiche sind bis zur späteren Integrationsplanung **nicht parallel frei editierbar**:

- Auth / Account Identity / Sessions
- Admin Role / Permission Model
- RLS / Ownership / Service Role
- Trip Graph / Guest→Account Persistenz
- Traveller Context / Credentials
- Readiness / Entry
- Route Truth
- Safety / Seasonal gemeinsame Route-/Zeitdaten
- Subscription / Payment / Refund / Accounting Truth
- Provider Activation / Secrets / Cost Gates

Wenn ein Audit dort einen Defekt findet, dokumentiert der Agent ihn mit konkretem Pfad, Auswirkung und vorgeschlagener Lösung. Implementierung wartet auf Technical-Lead-Slicing.

## 5. Integrationsreihenfolge

Aktuell verbindlich:

1. PR #38 R11-Blocker 24–26 schließen.
2. Exact-Head-Gate.
3. Unabhängiger ChatGPT R12.
4. Bei Stop-Kriterium technisches Closure/PASS; PR bleibt Draft bis Product-Owner-Freigabe.
5. Account- und Admin-Audit-Ergebnisse gemeinsam gegen Architektur/Dependencies prüfen.
6. Implementierung in kleine, konfliktarme Workstreams/PRs schneiden.
7. Auth/RLS/Shared-Contract-Änderungen zentral/seriell integrieren.
8. Post-Integration Cross-Domain-Review.

## 6. Pflichtstatus pro Agent

Jeder Agent dokumentiert spätestens bei Meilenstein, Blockierung, Unterbrechung und Fertigmeldung:

- exakter Cursor-Anzeigename
- Workstream
- Branch
- PR (falls vorhanden)
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

## 7. Aktuelle Produktentscheidung Account vs Workspace

Verbindliches Detailmodell: `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`.

Kurzform:

> **Account = persönliches dauerhaftes Zuhause des Kunden.**

> **Trip Workspace = operative Kommandozentrale einer einzelnen Reise.**

Keine zwei konkurrierenden Dashboards.
