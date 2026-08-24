# Jetnity – Domain Program Completion Policy

Stand: 24. August 2026  
Status: **verbindliche Product-Owner-/Technical-Lead-Governance**

## 1. Zweck

Diese Policy beseitigt ausdrücklich jeden Interpretationsspielraum, dass der jeweils nächste sichtbare Slice bereits das Ende eines Fachbereichs sei.

> **Account, Admin und Provider werden nicht nur bis zum jeweils nächsten Slice entwickelt. Jeder Workstream führt seinen vollständigen versionierten Audit-/Roadmap-Plan bis zur produktionsreifen Technical Closure des jeweiligen Bereichs weiter.**

Zwischenslices wie Account AP-3, Admin Slice C oder Provider S3 sind **Meilensteine, keine Endpunkte**.

## 2. Verbindliches Ausführungsmodell

Für jeden der drei Workstreams gilt standardmäßig:

1. aktuellen Plan und Live-Stand lesen;
2. nächsten zulässigen Slice schneiden;
3. implementieren;
4. Self-Review durchführen;
5. vollständige technische Gates auf dem Exact Head durchführen;
6. unabhängigen Technical-Lead-Review durchführen;
7. STOP für das jeweilige Product-Owner-Gate, falls Ready/Merge, Production, Shared Contract, Kosten, Secret, Vertrag oder Provideraktivierung betroffen ist;
8. nach bestandener/erteilter Freigabe zum **nächsten noch offenen Slice des vollständigen Plans** weitergehen.

Ein einzelner technisch abgeschlossener oder gemergter Slice beendet den Workstream nicht.

## 3. Account Platform

Authoritativer Plan: `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` aus dem Account-Audit.

Der Account-Workstream umfasst den vollständigen geplanten Pfad AP-1 bis AP-12 einschließlich der späteren Shared-/Privacy-/Traveller-/Profile-/Favoriten-/Booking-/Notifications-/Entitlement-Themen, soweit sie nicht durch eine spätere ausdrückliche Product-Owner-Entscheidung ersetzt, entfernt oder neu geschnitten werden.

Aktueller Stand:

- AP-1: merged
- AP-2: merged
- AP-3: nächster geplanter Slice, noch nicht gestartet

**AP-3 ist ausdrücklich nicht die Account-Closure.**

Shared Slices wie AP-4, AP-6b, AP-7, AP-8 oder AP-12 bleiben separate Lead-/DB-/Auth-/Privacy-/Billing-Gates. Dass ein Gate separat freigegeben werden muss, beendet den Account-Workstream nicht; es pausiert nur den betroffenen Slice bis zur Entscheidung.

## 4. Admin / Control Center

Authoritativer Plan: `docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md` aus dem Admin-Audit.

Der Admin-Workstream umfasst den vollständigen Plan Slice A bis K einschließlich Control-Center-IA, System Health, Provider-/Kostenboard, Security/Audit, Support Read-only, Command Palette, Finance Readiness, Infomaniak Read-only, Copilot Pro Analyst, Analytics/SEO sowie die später separat gegateten Live-Blöcke.

Aktueller Stand:

- Slice A / PR #44: braucht Current-Main-Sync, Exact-Head-Gates und Re-Review
- Slice B / PR #46: historischer Stack, später neu zu integrieren
- Slice C / PR #49: vorbereitet/docs-only, kein Runtime-Start

**Slice C ist ausdrücklich nicht die Admin-Closure.**

Live-Ads, Bexio, Payment-Ingest, neue Management-Secrets, kritische Admin-Writes und vergleichbare externe/produktive Integrationen bleiben separate Product-Owner-/Security-/Kosten-/Secret-Gates. Nach einem solchen Gate läuft der Admin-Plan weiter, sofern der Product Owner den Block nicht ausdrücklich verwirft oder ersetzt.

## 5. Provider / Provider Readiness

Authoritativer Plan: `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md` plus Provider-Audit/-Matrix/-Shared-Contract-Dokumente.

Der Provider-Readiness-Workstream umfasst den vollständigen Jetnity-seitigen Plan S1 bis S8:

- S1 Shared Operational Contract
- S2 FlugNachweis
- S3 Mobility/Rental Nachweis
- S4 Truth-Domain Operationsparität
- S5 Commercial Provenance
- S6 Persistenter Cost Guard
- S7 Observability / ehrliche Health-Hooks
- S8 Cache-/Lizenz-Hooks

Aktueller Stand:

- S1: merged
- S2: merged
- S3: nächster geplanter Slice, noch nicht gestartet

**S3 ist ausdrücklich nicht die Provider-Closure.**

Nach S1–S8 folgt – sofern durch separate Product-Owner-Gates freigegeben – die echte provider-backed Phase mit konkreten Adaptern, Verträgen, Secrets, Kosten, Lizenzbedingungen und Production-Aktivierung. Diese Freigabe wird durch diese Policy **nicht** vorweggenommen.

## 6. Wann ein Workstream wirklich als abgeschlossen gelten darf

Ein Bereich darf erst als **Technical Closure / produktionsreif** bezeichnet werden, wenn mindestens:

- alle für den Bereich weiterhin gültigen Audit-/Roadmap-Blöcke technisch geschlossen oder ausdrücklich durch Product Owner/ADR superseded, deferred oder entfernt wurden;
- kein offener P0/P1-Defekt oder ungeklärter Truth-/Security-/RLS-/Ownership-/Data-loss-Blocker verbleibt;
- relevante Shared Contracts geklärt und integriert sind;
- vollständige Exact-Head-Gates und unabhängiger Technical-Lead-Review bestanden sind;
- Cross-Domain-Regressionen gegen Account/Admin/Provider/Trip/Traveller/Auth/RLS/Privacy/Route/Readiness/Safety/Seasonal geprüft wurden;
- Production-/Provider-/Secret-/Kosten-/Migration-Gates dort separat erfüllt sind, wo sie für die behauptete Produktionsreife tatsächlich notwendig sind;
- Status, Evidence, Exact Heads, bekannte Restpunkte und nächste operative Wahrheit im Repository persistiert sind.

Wenn externe Aktivierung bewusst noch nicht freigegeben ist, darf nur die dafür passende begrenzte Closure behauptet werden, z. B. **Provider Readiness Technical Closure**, nicht eine erfundene Live-Provider-Production-Closure.

## 7. Unveränderte Governance

Diese Policy erweitert keine bestehende Einzel-Freigabe stillschweigend.

Weiterhin verbindlich:

- kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe;
- kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe;
- Production-Migrationen separat freigeben;
- Provideraktivierung, Secrets, Verträge und bezahlte Calls separat freigeben;
- laufende Kosten über USD 100/Monat vorher freigeben;
- Shared Auth/RLS/Identity/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation-Verträge seriell unter Technical-Lead-Steuerung;
- kein stilles Scope-Creep: wenn ein Slice einen breiteren Shared Fix benötigt, stoppen, belegen, neuen Auftrag schneiden;
- wichtiger Fortschritt und alle Gates dauerhaft im Repository dokumentieren.

## 8. Leitsatz

> **Der nächste Slice ist der nächste Schritt – nicht das Ende des Bereichs. Account, Admin und Provider laufen planvoll bis zur ehrlichen produktionsreifen Technical Closure weiter.**
