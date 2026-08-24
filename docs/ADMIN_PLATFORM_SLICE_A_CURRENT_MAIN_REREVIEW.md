# Admin Slice A – Current-Main Technical-Lead Re-Review

Stand: 24. August 2026, ca. 18:00 Europe/Zurich  
Status: **PASS / TECHNICAL INTEGRATION CLOSURE auf aktuellem `main`**  
Draft-PR: #44  
Branch: `feat/admin-control-center-ia`  
Exact Runtime Head: `7b06a947a36ef9d28bfae124b78537ddba88eaed`  
Base `main`: `52e665acfed88303300870d50855177284588026`

## 1. Integrationsnachweis

Der Current-Main-Sync ist ein echter Zwei-Eltern-Merge und kein Force-Replace:

- Parent 1: vorheriger Admin-Head `b64cd2af7f99109d8771457e8ac776681b86fed1`
- Parent 2: aktueller `main` `52e665acfed88303300870d50855177284588026` (Provider Readiness S2 / PR #51)
- Merge-Commit / Exact Runtime Head: `7b06a947a36ef9d28bfae124b78537ddba88eaed`
- Vergleich gegen `main`: **0 behind**, Merge-Base exakt `52e665ac...`
- PR-Diff enthält nur Admin-Slice-A-Runtime/-Tests/-Dokumente plus ADR-0158; keine Provider-S2-Datei, keine Migration und keine fremde Travel-Truth.

## 2. ADR-Kollision sauber aufgelöst

Beim Sync wurde eine reale Integrationskollision gefunden: Historische Admin-Slice-A-Dokumente nannten ADR-0155, während aktuelles `main` ADR-0155 bis ADR-0157 für Provider Readiness S2 belegt.

Auflösung:

- Provider-ADRs 0155–0157 auf `main` bleiben unverändert und autoritativ.
- Admin Slice A erhält ab diesem Integrationspunkt **ADR-0158**.
- Authoritative Datei: `docs/ADR_0158_ADMIN_SLICE_A.md`.
- Historische Slice-A-Dokumente werden nicht rückwirkend verfälscht; sie bleiben Evidence ihres damaligen Heads.

## 3. Exact-Head-Gates

GitHub Actions auf exakt `7b06a947...`:

- CI Run `32747475489`: **SUCCESS**
- Typecheck: SUCCESS
- Lint: SUCCESS
- Tests: SUCCESS
- Schutz der Admin-API: SUCCESS
- Schema-Bezug: SUCCESS
- Unerreichbarer Code: SUCCESS
- Exporte ohne Aufrufer: SUCCESS
- Ungenutzte Pakete: SUCCESS
- Production Build: SUCCESS
- Auth-Konfiguration gegen `config.toml`: SUCCESS

Vercel:

- Preview Deployment `dpl_E9rUnsNePeXzN6r693GVcqb46Q4R`: **READY**
- Git SHA: exakt `7b06a947...`

Der Preview ist durch Vercel-Schutz gesichert. Ein unauthentifizierter Fetch auf `/admin` endet deshalb am Vercel-SSO-Gate. **Keine eingeloggte Admin-Browser-Acceptance auf diesem Exact Head wird behauptet.** Die Runtime-Änderungen von Slice A waren bereits historisch gegatet; dieser Review bewertet zusätzlich die Current-Main-Integration, den Code-Diff und die neuen Exact-Head-Gates.

## 4. Adversarial Review – Ergebnis

### Authorization / Break-Glass

- `requireAdminPage` / `requireAdminApi` / RLS bleiben Autorität.
- `AdminSessionProvider` transportiert Rolle/Grant nur für UX; daraus entsteht keine neue Autorität.
- `adminWriteErlaubt()` lässt persistente Admin-Writes nur für `grant === 'role'` zu.
- Refund/Block/Unblock lehnen Break-Glass mit 403 ab, bevor die Datenbank erreicht wird.
- Capability-aware Navigation bleibt ausdrücklich UX und ersetzt keine Server-Gates.

**Ergebnis:** kein neuer Authorization-Bypass gefunden.

### Truth / Fake-State

- Fake-Notifications/Badge sind entfernt.
- Copilot-Execute/Auto-Pfad und tote Command-Palette-Signale sind entfernt bzw. als `folgt`/nicht verfügbar gekennzeichnet.
- RLS-Karten heißen ehrlich `Datenbank-RLS-Katalog` und behaupten keine Infrastruktur-/System-Health.
- Payment-Fläche sagt ausdrücklich lokale Sicht / keine provider-backed Geldbewegung.
- IP-Blockliste sagt ausdrücklich `nicht enforced`.
- Stub-Flächen sind als `folgt` gekennzeichnet.

**Ergebnis:** kein neuer Fake-Green-/Provider-Truth-Defekt gefunden.

### Cross-Domain / Provider S2

- `main` ist Merge-Base; Provider S2 bleibt vollständig erhalten.
- Keine Account-, Trip-, Traveller-, Route-, Readiness-, Safety-, Seasonal- oder Provider-S2-Runtime-Datei liegt im PR-Diff.
- Keine Production-Migration, kein Secret, keine Provideraktivierung, keine neue laufende Kostenwirkung.

**Ergebnis:** kein Cross-Domain-Rollback gefunden.

### Review-Hygiene

- PR #44 bleibt Draft.
- Keine offenen Inline-Review-Threads zum Review-Zeitpunkt.
- Technical PASS ist keine Product-Owner-Freigabe für Ready oder Merge.

## 5. Geerbter P1-Fund – lokale Refund-Integrität

Der adversarial Review hat einen **bereits vor Slice A vorhandenen** Billing-/Persistenzdefekt bestätigt:

`app/api/admin/payments/refund/route.ts` schreibt zuerst eine Zeile in `refunds` und liest/ändert danach separat `payments`. Das ist nicht atomar und nicht idempotent.

Read-only Live-Schema-Prüfung auf Supabase Production bestätigte:

- `refunds` besitzt nur den Primary Key auf zufälligem `id`;
- kein Unique-/Idempotency-Constraint für eine Refund-Operation;
- kein Foreign Key von `refunds.payment_id` auf `payments.id`.

Dadurch sind u. a. möglich:

1. Refund-Notiz für eine nicht existierende Payment-ID, danach trotzdem lokale Erfolgsantwort ohne Settlement;
2. Refund-Insert erfolgreich, nachfolgendes Lesen/Status-Update fehlschlägt → API 500, Refund-Zeile bleibt bestehen;
3. Retry nach diesem Teilfehler → doppelte Refund-Notiz;
4. parallele Requests → keine belastbare kumulative Betrags-/Idempotenzgrenze.

Slice A hat diesen Defekt **nicht eingeführt** und reduziert das Risiko durch ehrliche Copy und Break-Glass-Write-Sperre. Ein sauberer Fix verlangt jedoch einen Billing-/DB-Contract und darf nicht still in Slice A gezogen werden.

Verbindlicher Folgeauftrag: `docs/ADMIN_BILLING_LOCAL_REFUND_INTEGRITY_TASK.md`.

**Klassifikation:** P1 inherited / mandatory before Admin Finance-/Payment-Live, Bexio/Payment-Ingest oder produktionsreifer Billing Technical Closure. **Kein Slice-A-Mergeblocker**, solange die Funktion ehrlich lokal bleibt und kein echter Payment-Provider aktiviert wird.

## 6. Technical-Lead-Urteil

**PASS / TECHNICAL INTEGRATION CLOSURE für Admin Slice A auf Exact Runtime Head `7b06a947...`.**

Begründung: Kein neuer konkreter Slice-A-Truth-, Authorization-, Security-, Cross-Domain- oder Integrationsdefekt gefunden. Der neu gefundene Refund-P1 ist ein geerbter Shared/Billing-Defekt, ist jetzt dauerhaft erfasst und wird vor den späteren Finance-/Payment-Live-Gates zwingend geschlossen.

Dieser PASS beendet **nicht** den Admin-Bereich. Gemäß `docs/DOMAIN_PROGRAM_COMPLETION_POLICY.md` läuft das Admin-Programm nach Slice A über die vollständigen weiteren Slices bis zur ehrlichen produktionsreifen Technical Closure.

## 7. STOP

PR #44 bleibt Draft.  
**Kein Mark Ready und kein Merge ohne neue ausdrückliche aktuelle Product-Owner-Freigabe.**  
Slice B/C wird nicht in PR #44 gemischt.
