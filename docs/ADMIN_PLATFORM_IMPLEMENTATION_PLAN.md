# Jetnity Admin Platform – Implementierungsplan

Stand: 24. August 2026  
Status: **Plan aus Audit – Implementierung erst nach Technical-Lead-/Product-Owner-Freigabe**  
Cursor-Anzeigename: `Admin platform audit`  
Branch-Vorlage später: nicht dieser Audit-Branch

Dieser Plan schneidet kleine, konfliktarme PRs. Er ändert keine Shared Contracts ohne Lead-Schnitt. Er aktiviert keine Provider, Payments, Bexio, Ads oder Infomaniak.

Voraussetzung: technisches Closure von PR #38 und gemeinsamer Abgleich mit dem Account-Audit.

---

## 1. Reihenfolge

1. PR #38 Seasonal: Review/Closure (dieser Workstream fasst Seasonal nicht an).
2. Account-Audit und dieses Admin-Audit gegen Shared Contracts legen.
3. Technical Lead schneidet `profiles` / Rollen / Privacy / Billing / Support-Audit.
4. Erst dann Implementierungs-Slices, jeweils eigener Branch + Draft-PR.
5. Auth/RLS/DB-Änderungen seriell, nie parallel von zwei Agenten.
6. Post-Integration Cross-Domain-Review.
7. Merge nur nach aktueller Product-Owner-Freigabe.

---

## 2. Slice 0 – Shared-Contract-Schnitt (Lead, kein Feature-PR)

**Owner:** Technical Lead + Product Owner  
**Kein Cursor-Alleingang**

Zu entscheiden, nicht zu bauen:

- bleibt `creator` eine Rolle?
- neue Capabilities oder Wiederverwendung der fünf bestehenden?
- Support-Reise lesen: minimierte RPC vs. niemals?
- Billing-SoT: lokale `payments` vs. späteres Abo vs. Bexio
- Admin-Audit-Tabelle: ja/nein, wer schreibt
- AAL2 für welche Writes
- IP-Blocklist durchsetzen oder als unbearbeitetes Werkzeug kennzeichnen

Deliverable: kurzer ADR oder Abschnitt in `DECISIONS.md`. Ohne diesen Schnitt keine RLS-Migration.

---

## 3. Slice A – Ehrliche Steuerzentralen-IA

**Ziel:** Vorhandenes Admin weiterverwenden, Legacy-Lügen entfernen, Home als Lage statt Setup-Guide.  
**DB:** keine  
**Shared Contracts:** keine  
**Vorgeschlagener Branch:** `feat/admin-control-center-ia`  
**PR-Grenze:** nur Admin-UI/IA plus Texte; keine neuen Integrationen

Must in diesem Slice:

- toten Copilot-„Auto“-Button entfernen oder als nicht verfügbar kennzeichnen; Route nicht vortäuschen
- erfundene Notifications entfernen
- Setup-Guide entfernen oder auf echte nächste Ops-Schritte reduzieren
- Sidebar an die Ziel-IA anpassen; Stub-Seiten nicht als fertige Module zeigen
- Payments-Refund und IP-Block ehrlich beschriften (lokal / nicht durchgesetzt)
- Break-Glass-Writes in APIs auf 403 mappen, wenn `grant !== 'role'` (`reachesDatabase()`)
- Capability-aware Nav (UI), Server-Gates bleiben Quelle

Tests: vorhandene Admin-Auth-Tests, `check:api-schutz`, gezielte UI-/Unit-Tests für „kein Fake-Badge“.

Risiko: gering. Nutzen: sofort weniger Fehlbedienung.

---

## 4. Slice B – System Health read-only

**Ziel:** Vercel / Supabase / GitHub / App-Probes als Evidence auf Home.  
**DB:** keine, außer Lead später Snapshots will  
**Secrets:** neue Management-Tokens nur nach Kosten-/Secret-Gate; Presence im UI, nie Werte  
**Branch:** `feat/admin-system-health`

Scope:

- Server-Adapter + `/api/admin/ops/health` mit `infra-lesen` oder vorerst `betrieb-lesen`
- Freshness, unknown/stale, Deep Links
- keine Deploy-/Rollback-/Migrations-Buttons

Kosten: Tokens im bestehenden Vercel-/Supabase-/GitHub-Plan. Polling-Cache 1–5 min.

Abhängigkeit: Slice 0 nur, wenn neue Capability gewünscht; sonst bestehende `betrieb-lesen`.

---

## 5. Slice C – Provider- und Kostenboard

**Ziel:** Kill-Switch- und Modellkosten-Wahrheit sichtbar machen.  
**DB:** keine neue; `model_usage` ist lesbar ab `betrieb-lesen`  
**Branch:** `feat/admin-provider-cost-board`

Kein Toggle, der Production aktiviert. Nur Status + Deep-Link zur Doku/Gates.

Hoher Nutzen vor echten Providern. Geringe Konfliktfläche zum Account-Workstream.

---

## 6. Slice D – Security-Härtung

**Ziel:** Audit-Trail, Confirmation, Event-Taxonomie, Admin-AAL2-Entscheidung.  
**DB:** wahrscheinlich `admin_audit_events` → **seriell nach Slice 0, eigene Migration, eigenes Gate**  
**Branch:** `feat/admin-security-hardening`

Enthält nicht: Live-IP-Enforcement, es sei denn Product Owner gibt das separat frei.

Muss enthalten: Akteur auf Refund/Block/Rolle; Bestätigung; Rate-Limit auf Writes.

---

## 7. Slice E – Support Nutzer + Reise read-only

**Ziel:** Support findet Konten und sieht eine minimierte Reise.  
**DB:** nur nach Slice-0-RPC; **keine** Policy „Admins lesen alle trips“  
**Branch:** `feat/admin-support-trip-readonly`  
**Konflikt:** Account-Workstream (Privacy, Delete, Traveller-Sicht)

Nicht im Slice: Traveller-Dokumente im Klartext, Graph-Writes, Safety/Seasonal-Overrides.

---

## 8. Slice F – Command Palette und Home-Produktivität

**Ziel:** echte Palette statt CustomEvent ins Leere.  
**DB:** keine  
**Branch:** `feat/admin-command-palette`

Suche über bereits autorisierte Listen (Nutzer, bekannte Admin-Routen, Evidence-Ids). Keine globale DB-Suche über Service Role.

---

## 9. Slice G – Finance-Readiness (kein Live-Bexio)

**Ziel:** operative Finance-Sicht ehrlich machen; Bexio-Contract dokumentieren.  
**DB:** keine Live-Sync-Tabelle ohne Gate  
**Branch:** `docs` + später `feat/admin-finance-readiness`

Kein Stripe-Live, kein Refund-Provider, kein Bexio-Token.

---

## 10. Slice H – Infomaniak read-only

**Ziel:** Domain-/DNS-/Mailbox-Metadaten.  
**DB:** Token-Speicher nur nach Secret-Architektur-Entscheidung (Vault/ENV)  
**Branch:** `feat/admin-infomaniak-readonly`  
**Gate:** OAuth-App, Least-Privilege-Scopes, kein Write

Details: `docs/ADMIN_PLATFORM_INFOMANIAK_DOMAIN_MAIL.md`.

---

## 11. Slice I – Copilot Pro Analyst

**Ziel:** Briefing/Anomalien/Vorschläge über vorhandene Evidence.  
**DB:** Nutzung über bestehendes `model_usage`  
**Branch:** `feat/admin-copilot-pro-analyst`

Kein Execute-Pfad für kritische Aktionen. Autonomy-Matrix ist verbindlich.

Abhängigkeit: sinnvolle Evidence aus A–C, sonst halluziniert der Assistent über leere Stubs.

---

## 12. Slice J – Analytics / SEO (später)

Erst wenn Ereignisse und Funnel-Quellen existieren. Kein Demo-Chart.

SEO-Health (Sitemap, robots, Index-Flag) kann früher und billiger als volles BI kommen.

---

## 13. Slice K – Ads / Bexio live / Payment-Ingest (eigene Gates)

Jeweils eigener PR, eigener Vertrag, eigene Kosten, eigene Secrets. Nicht bündeln.

---

## 14. Testplan pro Slice

Mindestens:

- TypeScript, Lint, relevante Unit-Tests, Production-Build
- `check:api-schutz` bei neuen Admin-Routen
- Hygiene-Checks bei neuen Modulen
- bei DB: `db:rechte`, `db:rls`, `db:sicherheit`
- Empty/Error/Unknown-UI
- keine Secrets in Client-Bundles (`NEXT_PUBLIC_` prüfen)
- Cross-Check: Account-Privacy, Trip-RLS, Seasonal/Safety unverändert

Kein Mark Ready, kein Merge ohne Product Owner.

---

## 15. Was dieser Audit-PR nicht tut

- keine der Slices implementieren
- keine Preview-Behauptung für ein neues Control Center
- Seasonal/Account-Code nicht anfassen

Nächster Schritt nach Review: Slice 0 entscheiden, dann Slice A freigeben oder zurückweisen.
