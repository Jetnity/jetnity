# Admin D–K / Growth Control – Gap Audit Evidence

Stand: 26. August 2026  
Agent: `Admin platform audit`  
Branch: `audit/admin-d-k-growth-control`  
Draft-PR: #78  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Typ: **AUDIT ONLY**

Verbindlicher Auftrag: `docs/ADMIN_D_K_GROWTH_CONTROL_AUDIT_TASK.md`.  
`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

Regel: **sichtbare UI ≠ Backendwirkung ≠ externe Wirkung.**

---

## 1. Live-Verifikation

| Fakt | Evidence |
| --- | --- |
| `origin/main` | `ba86279e5ee2505bfd13801ae5e05ef50ba87c22` – *Merge PR #73: rigorous Technical Lead merge autonomy* |
| Audit-Branch-Head vor diesem Evidence-Commit | `94079cf1e7667e6ba5941b66b0d3094b03ac8b8d` |
| Merge-Base | `ba86279e` |
| Ahead / Behind vs `main` | **2 / 0** (nur Audit-Task + Status-Init) |
| PR #78 | Draft, Base `main`, mergeable |
| Actions auf `94079cf1` | Run `32910196813` SUCCESS |
| Vercel auf `94079cf1` | READY, Inspector `CM2UAyKcjS3CbsAmg5CRgjBpE1em` |
| Review-Threads | keine |

Parallele offene Draft-PRs (nicht anfassen):

| PR | Branch | Typ |
| --- | --- | --- |
| #74 | `feat/d0-2-canonical-origin-consistency` | D0-2 Runtime (fremd) |
| #75 | `audit/tw6-guest-one-trip-dependency` | TW-6 Audit |
| #76 | `audit/traveller-account-next-phase` | Account/Traveller Audit |
| #77 | `audit/provider-s4-s8-provenance` | Provider S4–S8 Audit |
| #79 | `audit/qs2-quality-security-resilience` | QS-2 Audit |
| #40 | `audit/admin-platform` | historischer Admin-Audit (Planquelle) |
| #39, #50, #52, #28 | diverse | historisch / stale |

Admin A–C auf `main` (Live, nicht die stale Slice-C-Statusdatei):

- Slice A: PR #44 → `1ec93cc9`, ADR-0158
- Slice B: PR #46 → `e3bad749`, ADR-0159
- Slice C: PR #49 → `78192ab7`, ADR-0162

Historische Quelle für D–K-Schnitt: `origin/audit/admin-platform` / `docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md` (PR #40). Liegt **nicht** auf `main`.

Traveller Context ist für dieses interne Control-Center **nicht** als Credential-Erfassung relevant. Slice E und spätere CRM-/Audience-Flächen dürfen Pass-/MRZ-/Citizenship-Daten nicht als Marketingtargeting verwenden.

---

## 2. Admin A–C Reality Matrix

Legende Wirkung: `UI` sichtbar · `DB` lokale Persistenz · `EXT` externe/provider/Geld-Wirkung.

| Fläche | Slice | UI | Backend | EXT | Capability | Audit Trail | Empty/Error/Unknown | Tests | Lage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Steuerzentrale `/admin` | A | ehrliche Lage + lokale Kennzahlen + RLS-Katalog | Liest vorhandene Aggregate / `admin_security_overview` | nein | Bereichs-Gate im `(admin)`-Layout | nein | Kennzahlen über `lese()`; RLS-Karte unbekannt bei Fehler/leer | `kennzahlen.test.ts`, `ladezustand`, `ehrliche-zustaende` | **implemented (honest local)** |
| Nutzer `/admin/users` | Legacy + A | Rollen-/Status-UI | **echte** `profiles.role` / `profiles.status` Updates | nein | `konten-verwalten`; Break-Glass ohne DB-Rolle wird abgewiesen | nur `console.info` / `console.warn` | Fehler werfen; leere Suche möglich | Rollenregeln in `lib/auth/roles.ts` + DB-Fähigkeiten | **implemented (real local write)** |
| Zahlungen `/admin/payments` | Legacy + A | „Lokale Zahlungssicht“ | GET list/summary/breakdown/webhooks; POST refund | **keine Geldbewegung** | Seite: nur Bereich; APIs: `betrieb-lesen` / Refund `betrieb-eingreifen` + Write-Gate | nein | `lese()` trennt leer/fehler | Copy-Tests; `db:sicherheit` Refund-Policies | **partial + P1 integrity** |
| Security `/admin/security` | Legacy + A | Events + Blockliste, „nicht enforced“ | GET events/list/summary; POST block/unblock → `blocked_ips` | **Middleware/Edge prüft nicht** | Seite: nur Bereich; APIs: `betrieb-lesen` / Writes `betrieb-eingreifen` + Write-Gate | nein | Widget/APIs über `lese()` | Copy-Tests; `db:sicherheit` | **implemented (local write, no enforcement)** |
| System Health `/admin/system-health` | B | fail-closed Karten | GET `/api/admin/system-health` | keine Management-API | `betrieb-lesen` | n/a read-only | Parent `unknown` / `not_configured`; Empty≠Error | `system-health.test.ts`, `audit:admin-system-health` | **implemented (honest read-only)** |
| Provider & Kosten `/admin/provider-ops` | C | fail-closed Board | GET `/api/admin/provider-ops`; `model_usage` über `darf_betrieb_lesen` | keine Provideraktivierung | `betrieb-lesen` | n/a read-only | Parent `foundation_only`; empty≠unavailable | `provider-ops-board.test.ts`, `audit:admin-provider-ops` | **implemented (honest read-only)** |
| Analytics / Content / Marketing / Settings / Localization | A stubs | `AdminFolgtSeite` + Nav-Badge `folgt` | keine APIs | nein | nur Bereichs-Gate | n/a | n/a (kein Datenclaim) | `ehrliche-zustaende.test.ts` | **placeholder (honest)** |
| Copilot-Button / Befehlssuche | A | disabled / „folgt“ | keine Route | nein | n/a | n/a | n/a | Copy-Tests | **placeholder (honest)** |

### 2.1 Wirkungsgrenzen der Writes

| Aktion | UI-Text | Tatsächliche Backendwirkung | Externe Wirkung |
| --- | --- | --- | --- |
| Refund „Lokal vermerken“ | keine Provider-Erstattung | `refunds` INSERT, optional `payments.status='refunded'` in **getrennten** Schritten | **keine** |
| IP blocken | „nicht enforced“ | `blocked_ips` Upsert | **keine** – kein Treffer in `middleware.ts` |
| IP entsperren | lokal | `blocked_ips` Delete | **keine** |
| Rolle/Status | Nutzerverwaltung | `profiles` Update | Session/Rechte im Produkt, **kein** Payment/Provider |
| Break-Glass Write | 403-Copy | API-Writes 403 via `adminWriteErlaubt` | keine |

Refund-UI behauptet zusätzlich: scheitere ein Schritt, werde „nichts als erledigt angezeigt“. Das gilt nur für die **Client-Antwort**. Nach erfolgreichem INSERT und fehlgeschlagenem Payment-Update bleibt die Refund-Zeile stehen. Das ist der dokumentierte Billing-P1, kein Fake-Money, aber eine **unehrliche Abschlusswirkung** zwischen UI und DB.

---

## 3. D–K Gap- / Dependency-Matrix

Quelle Plan: PR #40 `docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md`. Growth-Standard ergänzt M0–M6.

| Slice | Ziel | Stand | Dependencies | Shared Contracts | PO-Gates | Konflikte | Minimal testbarer Scope |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 Shared-Schnitt | Capabilities, Support-RPC, Audit-Tabelle, AAL2, Billing-Contract | **offen** | TL + PO | **alle unten** | ja, wenn Migration/Auth | Account/Privacy/Billing | nur ADR/Decision, kein Feature |
| A Steuerzentrale | ehrliche IA | **auf main** | – | keine neuen | – | – | erledigt |
| B System Health | read-only Evidence | **auf main** | `betrieb-lesen` | keine | Management-Tokens separat | – | erledigt |
| C Provider/Kosten | S1 + `model_usage` | **auf main** | S1 | `lib/provider-ops` read-only | keine Aktivierung | Provider-Workstream | erledigt |
| D Security-Härtung | Audit-Trail, Confirm, Taxonomie, AAL2-Entscheidung | **absent** | Slice 0 | `admin_audit_events`, Admin-AAL2, Capability | Migration; AAL/MFA wenn erzwungen | Auth/Identity | Confirm-UI + Write-Logging **ohne** neue Tabelle nur als Zwischenlösung unzureichend |
| E Support Nutzer + Reise RO | minimierte Reise | **absent** | Slice 0 RPC | Trip-RLS, Privacy, Traveller | Support-RPC / keine `trips` Admin-SELECT-Policy | Account/TW/Traveller | eine RPC, eine User-Detail-Karte, kein Dokument-Klartext |
| F Command Palette | echte Suche | **placeholder** | A | keine | nein | – | autorisierte Listen + Routen, kein Service-Role |
| G Finance-Readiness | ehrliche Finance, Bexio-Contract | **absent** | **Billing-P1 zuerst** | Billing/Payment | kein Live-Bexio/Stripe | Finance | Ledger-Sicht lokal, Connector `not_configured` |
| H Infomaniak RO | Domain/Mail-Metadaten | **absent** | Secret-Architektur | Connector/Secrets | OAuth/Secret/Kosten | Settings-Stub | read-only, Token nie im Client |
| I Copilot Analyst | Evidence-Briefing | **placeholder** | A–C Evidence | `model_usage` Kosten | KI-Kostenlimits | – | read-only Analyse, kein Execute |
| J Analytics/SEO | kein Demo-Chart | **placeholder** | Events/D0 | Attribution/SEO-Contracts | Indexing/Custom-Domain | D0-2, Growth Discoverability | SEO-Health RO nach D0-2 |
| K Ads/Bexio/Payment-Ingest | Live-Connectoren | **absent** | G + Billing-P1 + Caps | Payment, Ads, Finance | Secrets, paid calls, Geld, Verträge | Provider/Finance | **eigene PRs, nicht bündeln** |
| Billing-P1 | atomarer lokaler Refund | **offen / P1** | vor G und K | Billing/Payment | Migration wenn Schema | Slice D Audit-Akteur | Idempotency + Transaktion + Tests |
| M0–M6 Growth | Control Plane | **absent** | G0 Contracts, Account Consent, Commercial Truth | Attribution, Consent, Claims, Capabilities | Ads/CRM/Launch/Secrets | Growth Discoverability, Account | siehe Coverage + Reihenfolge unten |

---

## 4. Growth-Control Coverage Matrix

Gegen `docs/ADMIN_MARKETING_GROWTH_CONTROL_CENTER_STANDARD.md`.  
`implemented` = produktive, source-backed Fläche. Heute fast nichts davon.

| Standard-Modul | Status | Heutige Fläche | Bemerkung |
| --- | --- | --- | --- |
| Executive Growth Overview | **absent** | Home = lokale Ops-Lage, keine Growth-KPIs | CAC/LTV/Payback nicht existent |
| Funnel / Kohorten | **absent** | – | kein Event-/Funnel-Contract |
| Attribution / Revenue Reconciliation | **absent** | kein `utm_`-Product-Contract ausser D0-1 noindex | Shared Attribution fehlt |
| Paid-Media Control (Caps/Kill Switch/Approval/Audit) | **absent** | `/admin/marketing` Placeholder | Kill-Switch in Slice C ist S1-Form, **kein** Ads-Kill-Switch |
| Creative / Claims Registry | **absent** | – | Shared Claims-Truth |
| Landingpage / Campaign Surfaces | **absent** | – | öffentliche Flächen = anderer Agent |
| CRM Audience / Journey / Deliverability | **absent** | – | Account/Consent-Abhängigkeit |
| Content / SEO / AI-Search Ops | **placeholder** | `/admin/content`, `/admin/analytics`, `/admin/localization` | ehrlich „folgt“; D0-2 separat |
| Experiment Registry | **absent** | – | – |
| Referral / Creator / Partner | **absent** | – | Anti-Fraud fehlt |
| Reviews / Reputation / PR / Launch | **absent** | – | Launch = PO-Gate |
| Subscription Growth | **absent** | – | Entitlements noch nicht live |
| Market Expansion | **absent** | – | – |
| CAC/LTV/Payback/Contribution/Forecast | **absent** | Slice C zeigt höchstens `model_usage` Mikro-USD | kein Marketing-Spend |
| Tracking / Data Quality | **absent** | – | G0 |
| Privacy / Consent Center | **absent** | – | Shared Privacy |
| Connectors / Settings | **placeholder** | `/admin/settings` | „keine Secrets-Steuerung“ |
| Marketing Calendar | **absent** | – | – |
| Copilot Pro Analyst | **placeholder** | Topbar „Copilot Pro folgt“ | kein Execute – korrekt |
| Vier-Augen / Growth-Capabilities / Audit | **absent** | nur `betrieb-*` / `konten-verwalten` | zu grob für Marketing-Writes |
| Incident / Alerts Center | **absent** | Security-Events lokal, kein Spend-Alert | – |

Gesamt: **0 implemented Growth-Control-Module.** Admin A–C liefern die **ehrliche Ops-Basis**, nicht das Growth-OS.

---

## 5. Irreführende Placeholder- / Legacy-Flächen

Ehrlich beschriftet (kein Fake-Ready):

- Nav `Analytics`, `Content`, `Marketing`, `Einstellungen`, `Lokalisierung` mit Badge `folgt`
- `AdminFolgtSeite` Copy
- Copilot/Suche disabled
- Payments/Refund/IP-Block Copy

Trotzdem riskant / irreführend:

| Fundstelle | Risiko | Priorität |
| --- | --- | --- |
| Refund-UI „nichts wird als erledigt angezeigt“ bei Schrittfehler | INSERT kann schon persistiert sein | **P1** |
| `/admin/payments` und `/admin/security` ohne Seiten-Capability `betrieb-lesen` | Shell sichtbar für jeden Admin-Bereich; APIs 403 | **P2** |
| Home-Karten „RLS aktiv“ neben „Operative Lage“ | kann mit System Health verwechselt werden; Copy grenzt ab | **P3** |
| Slice-C-Status auf `main` sagt noch „nicht gemergt“ | globale Docs-Stale vs Live `78192ab7` | **P2** Continuity |
| Nav-Label „Marketing“ | Operator erwartet Control Plane; Seite sagt Placeholder | **P3** |
| Historischer PR #40 weiter offen | Plan lebt nur dort, nicht auf `main` | **P3** |
| `users/actions.ts` `createServerComponentClient() as any` | Type-Escape auf Write-Pfad | **P2** Qualität |

Keine Fläche behauptet produktive Ads, CRM oder Provider-Live.

---

## 6. Billing / Refund Truth

Kanonisch: `docs/ADMIN_BILLING_LOCAL_REFUND_INTEGRITY_TASK.md`.

Belegt in `app/api/admin/payments/refund/route.ts`:

1. kein Payment-Provider, kein Stripe/Bexio/TWINT-Call;
2. Write nur mit `betrieb-eingreifen` **und** `grant === 'role'`;
3. Schritte nicht atomar, keine Idempotency-ID, kein FK `refunds.payment_id → payments.id`;
4. unbekannte Payment-ID kann trotzdem eine Refund-Zeile erzeugen;
5. Retry/Parallelität kann duplizieren;
6. UI und API trennen lokal vs Provider in der **Absicht**, nicht in der **Transaktion**.

**Schluss:** Heute gibt es **keine reale Geldbewegung**. Es gibt eine **reale lokale Ledger-Lüge-Gefahr** (Teilcommit, Duplikat, Over-Refund). Das blockiert Finance-Live, Slice G Persistenz und Slice K Payment-Ingest. Nicht Slice-C-Scope. Nicht in diesem Audit zu implementieren.

---

## 7. P0 / P1 / P2 / P3

### P0

Keine neue Production-Incident-Klasse in diesem Audit. Kein Live-Money, keine Ads-Writes, keine Secret-Leaks in Admin-Client-Bundles gefunden.

### P1

1. **Billing-P1 Refund-Integrität** – nicht atomar, nicht idempotent; UI kann Fehler zeigen nach persistierter Notiz.
2. **Kein dauerhafter Admin-Audit-Trail** für Rolle/Status/Refund/Block – nur Logs. Privilege-Change ohne belastbare Actor/Before/After-Tabelle.
3. **D0-P1-03 Legal 404** – global, nicht Admin-Runtime, aber öffentlicher Trust; nicht in diesem PR lösen.

### P2

1. Payments/Security-Seiten ohne `betrieb-lesen`-Page-Gate.
2. IP-Block persistiert ohne Enforcement (Copy ehrlich; Wirkung trotzdem leicht überschätzbar).
3. Slice-C-Statusdatei auf `main` stale.
4. `users/actions.ts` `as any`.
5. `main` Branch Protection deaktiviert (global, `JETNITY_START_HERE.md`).
6. Keine Bestätigung zweiter Stufe vor Refund/Block/Rollenwrite.
7. Growth-/Attribution-Contracts fehlen – jede frühe „Analytics“-Runtime würde Fake-Funnel riskieren.

### P3

1. Copilot/Suche/Marketing-Nav als sichtbare Folgt-Flächen.
2. PR #40 Plan nicht auf `main`.
3. Keine Vier-Augen-Capabilities.
4. Home RLS-Katalog vs System-Health-Namenskollision.

---

## 8. Capability / Audit / Approval-Risiken

| Risiko | Evidence | Folge |
| --- | --- | --- |
| Zu grobe Capabilities | `betrieb-lesen`, `betrieb-eingreifen`, `konten-verwalten`, `inhalte-moderieren`, `konfiguration-verwalten` | Marketing-Writes dürfen **nicht** an `betrieb-eingreifen` gehängt werden |
| Geplante `growth.*` Capabilities existieren nicht | Standard §27 | Shared Auth/Admin-Contract, **STOPP** vor Marketing-Writes |
| Kein Vier-Augen | kein Approval-Modell | Budget/Launch/Audience-Export wäre unkontrolliert |
| Kein `admin_audit_events` | keine Tabelle in aktuellen Migrationen | Slice D + Billing-P1 Punkt 6 |
| AAL2 nur Login-MFA, nicht Admin-Write-Step-up | `LoginForm.tsx` / kein Admin-AAL-Gate | Slice D Entscheidung, ggf. PO-Gate |
| Break-Glass | API-Writes 403; User-Writes brauchen DB-Rolle | Vertrag hält für APIs; User-Actions indirekt |
| Layout-Gate vs Seiten-Gate | `(admin)/layout.tsx` nur Bereich | Placeholder-Seiten für jeden Moderator sichtbar – akzeptabel nur weil ohne Daten |

---

## 9. Product-Owner-Gate-Matrix

| Aktion / späterer Slice | PO-Gate nötig? | Warum |
| --- | --- | --- |
| Dieser Audit PR #78 Ready/Merge | nein (normaler docs-PR nach TL-Autonomie) – **dieser Agent setzt weder Ready noch Merge** | Audit-only |
| Admin F Command Palette | nein, wenn nur autorisierte Listen | kein Secret/DB |
| Admin D Audit-Tabelle / AAL2-Zwang | **ja**, sobald Migration oder MFA/AAL erzwungen wird | Auth/DB |
| Billing-P1 Schema/RPC | **ja** bei Migration | Billing + ggf. Production |
| Admin E Support-RPC | **ja** wenn neue Privilege auf Reisen | Privacy/RLS |
| Admin G ohne Live-Connector | nein, wenn nur ehrliche lokale Sicht | – |
| Admin H Infomaniak Token | **ja** | Secret/OAuth/Kosten |
| Admin I Modellkosten | Kostenlimits; neues Modell/Provider **ja** | KI-Kosten |
| Admin J SEO-Health RO | nein, wenn nur vorhandene robots/sitemap gelesen werden | D0-2 fremd |
| Tracking/Consent an | **ja** | Privacy |
| Ads/CRM/Audience Writes | **ja** | Secrets, paid, Datenweitergabe |
| Payment-Live / Refund-Provider | **ja** | reale Geldbewegung |
| Public Launch / Indexing-Aktivierung | **ja** | Launch |
| Neue laufende Kosten > USD 100/Monat | **ja** | Kosten |

---

## 10. Konfliktarme nächste Slice-Reihenfolge

Keine Monster-PR. Kein Folgeslice durch diesen Agenten.

### Sofort **nicht** starten

- Admin D Runtime ohne Technical-Lead-Shared-Contract für Audit/AAL2
- Billing-P1 Runtime ohne Billing-Contract
- Admin E ohne Support-RPC-Schnitt
- M1–M6 Growth-Runtime ohne G0 Attribution/Event/Consent
- D0-2 (läuft in PR #74)
- Ads/CRM/Finance-Live

### Nach TL-Review dieses Audits – kleinste konfliktarme Admin-Schritte

1. **Admin F – Command Palette**  
   Keine DB, keine neuen Capabilities. Sucht nur bereits autorisierte Routen/Listen. Schließt den toten Such-Button.

2. **Optional Admin IA-M0-Nav**  
   Eigener kleiner Docs+Nav-Slice: Growth-Bereich als `folgt`-Unterpunkte laut Standard-IA, **ohne** KPIs. Nur wenn TL das von F trennt. Keine zweite Wahrheit.

3. **Admin J-lite SEO-Health read-only**  
   Erst **nach** Integration von D0-2. Liest vorhandene robots/sitemap/index-Grenze. Kein Tracking.

### Shared-Contract zuerst (dokumentieren + **STOPP**)

Siehe Abschnitt 11. Erst danach:

4. **Admin D** Security-Härtung (Audit + Confirm; IP-Enforcement **nicht** implizit)
5. **Billing-P1** (eigener Billing-Slice, nicht in D verstecken)
6. **Admin G** Finance-Readiness ohne Live-Bexio
7. **Admin E** Support-Reise RO nach Account/Privacy-Schnitt
8. **M0 read-only Growth Overview** erst nach G0-Contracts (TL/Growth/Account)
9. **I Copilot Analyst** erst wenn A–C + M0 Evidence tragen
10. **H / K** jeweils eigene Gates, eigene PRs

M2 Content/SEO-Ops teilt öffentliche Surfaces mit `Jetnity growth discoverability` – Admin steuert intern, Discoverability baut öffentlich. Eine Claims-Registry, zwei UIs.

---

## 11. Shared-Contract-Bedarf → STOPP

Dieser Agent implementiert **keine** der folgenden Verträge.

| Contract | Warum nötig | Owner |
| --- | --- | --- |
| `admin_audit_events` + Actor/Before/After | D, Billing-P1 §6, später Marketing-Writes | Technical Lead / Admin+Auth |
| Admin-AAL2-Write-Matrix | D | Auth Shared |
| Billing Refund-Idempotency + Transaktion | P1 vor G/K | Billing Shared |
| Support-Reise-RPC (kein Admin-`trips`-SELECT) | E | Account/Privacy/Trip |
| `growth.*` Capabilities | vor jedem Marketing-Write | Auth/Admin Shared |
| Attribution / versionierte Events / Consent-Zweck | M0/M1, G0 | Growth + Privacy Shared |
| Approved Claims Registry | Ads/Landing/Public Copy | Admin + Discoverability Shared |
| IP-Enforcement (Middleware/Edge) | nur nach separater Security-Entscheidung | Security Shared |
| Connector/Secret-Vault-Modell | H/K | Infra/Security |

**STOPP.** Keine stille Erweiterung.

---

## 12. Was dieser Audit nicht ist

- keine Runtime, keine Migration, kein Tracking, keine Secrets
- keine D0-2-Änderung
- keine Admin-D–K-Implementierung
- kein Ready, kein Merge, kein Folgeslice
