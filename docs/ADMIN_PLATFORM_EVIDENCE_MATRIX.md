# Admin Platform – Evidence-Matrix

Stand: 24. August 2026  
Cursor-Anzeigename: `Admin platform audit`

Format: heutiger Pfad → Befund → Risiko → Ziel → Dateien/DB → Testbedarf

| ID | Heutiger Pfad | Befund | Risiko | Ziel | Dateien / DB | Testbedarf |
| --- | --- | --- | --- | --- | --- | --- |
| E01 | `app/(admin)/layout.tsx` + `lib/auth/admin-guard.ts` | Zentraler Page-Gate, getUser, fail-closed | Gering; korrekt | Behalten | `admin-guard.ts`, `(admin)/layout.tsx` | vorhandene Access-Tests |
| E02 | `middleware.ts` | Nur Auth, nicht Rolle | Bewusst; neue Routen brauchen trotzdem Gate | Behalten + `check:api-schutz` | `middleware.ts`, `scripts/api-schutz.mjs` | CI-Gate |
| E03 | `lib/auth/roles.ts` + `darf_*` | Fähigkeiten Code=DB | Gering | Behalten; neue Caps nur nach Lead | `roles.ts`, `20260817100800_faehigkeiten.sql` | `faehigkeiten-datenbank.test.ts` |
| E04 | Break-Glass APIs | UI ja, Writes 500, Reads leer 200 | Leere Lage wirkt wie Entwarnung; Writes unklar | `reachesDatabase()` → 403 | `admin-access.ts`, alle Write-Routen | Access- + API-Tests |
| E05 | `/admin` Stats | Echte RPCs, Payouts immer 0, Conversion abgeleitet | Irreführende Business-KPI | Quelle/Freshness; Payouts nicht als echte Größe | `AdminStatsStrip.tsx`, `admin_payments_summary_30d` | Empty/Error bleibt; kein Fake-0 |
| E06 | `/admin` TimeSeries | Echte Reise-Zeitreihe | Gering | Behalten | `AdminTimeSeries.tsx`, `admin_reisen_zeitreihe` | RPC-Fehlerfläche |
| E07 | `/admin` HealthCards | RLS-Katalog, nicht Infra | „Security & Health“ klingt nach System-Health | Umbenennen; Infra separat | `AdminHealthCards.tsx`, `admin_security_overview` | unbekannt bei Fehler |
| E08 | `AdminSetupGuide` | Tote Links `/admin/control-center`, Creator-Pipeline | Operator folgt tot/verbotenem Pfad | Entfernen oder echte Tasks | `AdminSetupGuide.tsx` | Snapshot/IA-Test |
| E09 | `AdminTopbar` Copilot | POST `/api/admin/copilot/actions` fehlt; „Auto – sicher ausführen“ | Gefährliche Erwartung autonomer Writes | Entfernen | `AdminTopbar.tsx` | negativ: keine Copilot-Execute-UI |
| E10 | `AdminTopbar` Notifications | Badge 3, Fake-Items, Link 404 | Erfundene Ops-Wahrheit | Entfernen | `AdminTopbar.tsx` | kein hartes Badge ohne Quelle |
| E11 | Command Palette | Event ohne Hörer | Tote Produktivität | Echte Palette später | `AdminTopbar.tsx`, `admin/layout.tsx` | Slice F |
| E12 | `/admin/users` | Echt, Rangregeln, Empty≠Error | PII (E-Mail) für Moderatoren; Ban ohne Confirm | Behalten; Confirm+Audit später | `users/page.tsx`, `users/actions.ts`, `UsersTable.tsx`, `profiles` | vorhandene Rang-Tests + Action-Tests |
| E13 | `/admin/analytics` | Stub | Nav lügt Fertigstellung vor | Aus Nav oder „nicht bereit“ | `analytics/page.tsx`, Sidebar | IA |
| E14 | `/admin/marketing` | Stub | wie E13 | wie E13 | `marketing/page.tsx` | IA |
| E15 | `/admin/content` | Stub + verwaiste Capability | Druck, Creator-Content neu zu bauen | Nicht wiederbeleben | `content/page.tsx`, `darf_inhalte_moderieren` | Produktentscheidung |
| E16 | `/admin/settings` | Stub; Kill Switches unsichtbar | Ops sieht ENV-Drift nicht | Slice C | `settings/page.tsx`, `lib/*/zustand.ts` | Presence-Tests |
| E17 | `/admin/localization` | Stub, nicht verlinkt | Toter Code | Entfernen oder Settings | `localization/page.tsx` | — |
| E18 | Payments list/breakdown | Echt gegen lokale Tabelle | Leere Wahrheit vs. kein Ingest | Label „lokal, kein Provider“ | `payments/*`, `PaymentsCenter.tsx` | `ladezustand.test.ts` |
| E19 | `POST .../payments/refund` | Nur `refunds`+Status; kein Provider; kein Akteur; keine Confirm | Finanztheater; Doppel-Refund | Ehrliches UX; später Provider+Gate | `refund/route.ts`, `refunds`, `payments` | Fehlerpfade; kein ok:true bei RLS |
| E20 | `GET .../payments/webhooks` | Tabelle ohne Payload, kein Writer | Leere Liste wirkt wie „keine Events“ | Quelle/unknown wenn Ingest fehlt | `webhooks/route.ts`, `stripe_webhooks` | Empty vs missing ingest |
| E21 | Payments summary API | Kein UI-Consumer; Home nutzt RPC | Doppelte Semantik | Optional konsolidieren | `payments/summary/route.ts` vs RPC | Kennzahlen-Tests |
| E22 | Security list + Widget | 15s Poll; Events tot | Falsche Ruhe | Produzenten + Taxonomie | `security/list`, `SecurityWidget.tsx` | Poll-Errorfläche |
| E23 | Security summary/events APIs | Kein UI; `auth_failed` vs `login_failed` | KPI-Drift | Eine Taxonomie | `kennzahlen.ts`, summary/events | Unit-Taxonomie |
| E24 | `POST .../security/block` | Upsert ohne Validierung/Audit; nicht enforced | Falsches Sicherheitsgefühl | Label + optionales Enforcement-Gate | `block/route.ts`, `blocked_ips`, `middleware.ts` | Validierungstests |
| E25 | `POST .../security/unblock` | wie E24 | wie E24 | wie E24 | `unblock/route.ts` | wie E24 |
| E26 | Trip-Support | Keine Fläche; RLS blockt fremde Reisen | Support blind **oder** später zu weite Policy | Minimierte RPC nach Lead | `trips` Policies, ADR-0041 | negativ: Admin sieht keine Trip-Rows |
| E27 | Traveller/Readiness/Safety/Seasonal | Kein Admin-Pfad | Gut | So belassen | Shared Contracts | Regression: unverändert |
| E28 | Kill Switches | ENV, nicht Admin | Drift unsichtbar | Read-only Board | `JETNITY_*_AKTIV`, `modell/konfiguration.ts` | Zustand-Tests existieren |
| E29 | `model_usage` | Hartes Backend, keine Admin-UI | Kostenblindheit | Slice C | `model_usage`, Kontingent-RPCs | vorhandene Grenz-Tests |
| E30 | Vercel/Supabase Health | nicht vorhanden | Steuerzentrale ohne Infra | Slice B | neue Adapter, keine Key-List-API | unknown/stale Tests |
| E31 | Cron/Jobs | `vercel.json` ohne Crons | „keine Jobs“ vs unknown | explizit `disabled`/`none` | `vercel.json` | — |
| E32 | Infomaniak | Legacy entfernt, keine Fläche | Domain-/Mail-Blindheit | Read-only später | siehe Infomaniak-Doku | kein Write-Test in Phase 1 |
| E33 | Bexio/Ads/Affiliate/Abo | nicht vorhanden | kein erfinden | Readiness-Doku, Live eigene Gates | Vision, Payments-ADR-0010 | — |
| E34 | Copilot Pro | tot + gefährliche Reste | Autonomie-Erwartung | Analyst nach Evidence | Topbar, künftiges `lib/ops/copilot` | Autonomy: keine Execute ohne Gate |
| E35 | Admin MFA | nicht verlangt | gestohlene Session = voller Admin | AAL2-Ziel | `mfa.ts`, admin login | später Auth-Tests |
| E36 | Audit Trail | fehlt | nicht revisionsfähig | `admin_audit_events` nach Gate | keine Tabelle heute | RLS append-only Tests |
| E37 | Service Role in Admin | nicht genutzt | — | so belassen | `lib/supabase/server.ts` | `check:api-schutz` / Reviews |
| E38 | `creator` Rolle | vergebbar, keine Plattform | Produktverwirrung | PO-Entscheidung | `roles.ts`, UsersTable | nicht still entfernen |
| E39 | Mobile Admin | Drawer ja, Topbar nein | Notfall-Mobile ohne Theme/Suche | Home-Alerts auf Mobile | `admin/layout.tsx` | Viewport-Check bei UI-Slice |
| E40 | PR #38 / Seasonal | unberührt | Cross-edit-Risiko | Admin ändert Seasonal nicht | Seasonal-Branch separat | Contract-Diff leer halten |

Vollständige Handlungsreihenfolge: `docs/ADMIN_PLATFORM_MUST_SHOULD_LATER.md`.
