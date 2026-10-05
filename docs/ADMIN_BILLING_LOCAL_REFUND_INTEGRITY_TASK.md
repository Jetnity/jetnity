# Admin / Billing – lokale Refund-Integrität vor Finance-/Payment-Live

Stand: 24. August 2026  
Status: **verbindlicher P1-Folgeauftrag; nicht Teil von Admin Slice A / PR #44**  
Owner: Technical Lead + später zuständiger Admin/Billing-Slice

## 1. Warum dieser Auftrag existiert

Der Current-Main-Re-Review von Admin Slice A hat einen geerbten Persistenzdefekt im lokalen Refund-Pfad bestätigt. Die Funktion ist heute ausdrücklich **keine echte Provider-Erstattung**, muss aber vor Finance-/Payment-Live und vor produktionsreifer Billing Technical Closure zu einem belastbaren lokalen Ledger-Vertrag werden.

## 2. Aktueller Defekt

`app/api/admin/payments/refund/route.ts` arbeitet in getrennten Schritten:

1. `refunds` INSERT;
2. `payments` lesen;
3. bei vollem Betrag `payments.status = 'refunded'` setzen.

Diese Schritte sind nicht atomar und besitzen keine Idempotency-Grenze.

Read-only Live-Schema-Evidence auf Supabase Production am 24. August 2026:

- `refunds.id`: UUID Primary Key, zufällig generiert;
- `refunds.payment_id`: Text, NOT NULL;
- kein Foreign Key `refunds.payment_id -> payments.id`;
- kein Unique-/Idempotency-Index für die fachliche Refund-Operation;
- `payments.id`: Text Primary Key.

## 3. Reproduzierbare Risikoklassen

- **Unbekannte Payment-ID:** Refund-Zeile kann geschrieben werden, obwohl kein Payment existiert.
- **Teilcommit:** Refund-Insert erfolgreich, späteres Read/Update fehlschlägt; Client sieht Fehler, DB enthält bereits die Notiz.
- **Retry-Duplikat:** Wiederholung nach Teilfehler schreibt eine zweite Zeile.
- **Parallelität:** Gleichzeitige Requests können ohne serialisierten Vertrag mehrfach buchen.
- **Betragsintegrität:** Keine atomare Prüfung gegen bereits vorhandene Refund-Summe.
- **Spätere Providergefahr:** Ein Live-Payment-Adapter darf diese lokale Semantik niemals still zu echter Geldbewegung hochstufen.

## 4. Zielvertrag

Vor Finance-/Payment-Live muss ein eigener versionierter Billing-Contract festgelegt und umgesetzt werden. Mindestanforderungen:

1. fachliche **Idempotency-ID** pro Refund-Operation, serverseitig validiert und in der DB eindeutig;
2. Payment muss in derselben atomaren Operation existieren;
3. positiver Betrag und atomare Prüfung des kumulierten lokalen Refund-Betrags gegen den Payment-Betrag;
4. Refund-Eintrag und lokaler Payment-Status müssen **in einer Transaktion** konsistent werden oder gemeinsam scheitern;
5. Parallel-/Retry-Sicherheit mit reproduzierbaren Tests;
6. Actor/Audit-Bezug spätestens zusammen mit Admin Security/Audit Slice D;
7. Capability/RLS/Ownership-Vertrag ausdrücklich prüfen; keine Service-Role-Abkürzung;
8. `SECURITY DEFINER` nur, falls nach eigenem Security-Design zwingend nötig; dann Least Privilege, explizite Auth-/Capability-Prüfung und getrenntes Security-Gate;
9. UI und API müssen lokal vs. provider-backed weiterhin eindeutig unterscheiden;
10. echter Provider-Refund bleibt ein **separater** Payment-/Provider-Vertrag mit Secrets/Kosten/Production-Gates.

## 5. Wahrscheinliche technische Form

Bevorzugt ein atomarer Postgres-/RPC-Vertrag oder eine gleichwertige transaktionale Servergrenze. Die endgültige Form wird erst im zuständigen Shared/Billing-Slice entschieden. Keine Migration wird aus diesem Dokument heraus freigegeben.

Mögliche Schemaelemente, nur nach Design-/Migration-Gate:

- `idempotency_key` mit Unique Constraint;
- explizite Referenz zu `payments`, wenn die Lifecycle-Semantik eine FK erlaubt;
- Audit-/Actor-Spalten oder Verknüpfung zu `admin_audit_events`;
- Constraints für positive Beträge und belastbare Zustände.

## 6. Pflicht-Tests

Mindestens:

- gleiche Idempotency-ID zweimal → exakt eine fachliche Refund-Operation;
- unbekannte Payment-ID → kein Refund-Insert;
- Teilfehler → kein halber Commit;
- zwei parallele Requests → kein Over-/Double-Refund;
- kumulierter Teilrefund bis exakt Payment-Betrag;
- Überschreitung des Payment-Betrags → fail closed;
- Break-Glass → 403 vor Write;
- RLS/Capability/DB-Rechte fail closed;
- lokale Refund-Notiz wird nie als echte Provider-Erstattung dargestellt.

## 7. Gates

Dieser Auftrag autorisiert **nicht**:

- DB-/Production-Migration;
- Live-Payment-Provider;
- Stripe/TWINT/PostFinance/PayPal/Bexio-Aktivierung;
- Secrets/API-Keys;
- echte Geldbewegung;
- Merge eines späteren Billing-PRs.

Jede DB-Migration, Provideraktivierung, Secret-Nutzung und Production-Wirkung bleibt separates Product-Owner-Gate.

## 8. Einordnung in den vollständigen Admin-Plan

Der Defekt muss spätestens vor **Admin Slice G Finance-Readiness mit produktiver Persistenz** bzw. zwingend vor **Slice K Ads/Bexio live/Payment-Ingest** und vor der finalen produktionsreifen Billing/Admin Technical Closure geschlossen sein.

Er ist **kein Ende des Admin-Programms** und kein Grund, Slice A künstlich um Shared-Billing-Scope zu erweitern.
