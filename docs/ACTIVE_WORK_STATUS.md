# Jetnity – Active Work Status

Stand: **25. August 2026, ca. 00:57 Europe/Zurich**  
Status: **Trip Workspace TW-1 ist der einzige aktive zentrale Runtime-Workstream. Alle anderen bestehenden Agenten warten auf neue kontrollierte Aufträge.**

## Verbindliche Reihenfolge

Product-Owner-verbindlich: **`docs/JETNITY_BINDING_BUILD_ORDER.md`**.

Neue Chats/Agenten müssen diese Datei vor neuer Jetnity-Arbeit lesen. Sie definiert die Reihenfolge:

1. Trip Workspace vollständig: TW-1 → TW-2 → TW-4 → TW-3 → Details/Gaps on demand
2. Traveller-/Pass-/Multi-Citizenship-System vervollständigen, bestehende Foundation E weiterverwenden
3. Account AP-4–AP-12
4. Provider S4–S8 → danach echte Provider
5. Admin D–K inkl. Billing-/Refund-P1
6. Homepage
7. kommerzielle Produktschicht
8. Production-Härtung

## Main / Production

- `main`: `1bc1e1f492ea30710840b4a38d96437d56b73d77`
- letzter großer Merge: #55 – Trip Workspace Audit / Zielarchitektur, docs-only; danach docs-only Kontinuitätsupdates
- Supabase Production endet bei `20260824140000`
- `20260824160000` und `20260824180000` bleiben Development-only / nicht Production-approved
- `main` Branch Protection technisch weiterhin nicht umgesetzt

## Aktiv – Trip Workspace – Agent `Trip workspace audit architecture`

- Draft-PR #56 – **Trip Workspace TW-1 – Shell & Geräteparität**
- Branch: `feat/trip-workspace-tw1-shell-device-parity`
- aktuell live verifizierter PR-Head: `d087b6d38f5bff2b712fbb498dade637d478f1e1`
- PR: open / Draft / nicht gemergt
- Product Owner hat Ziel-IA und Start von TW-1 ausdrücklich freigegeben
- kein TW-2/TW-4/TW-3 automatisch freigegeben
- nach Implementierung: Self-Review → Exact-Head-Gates → unabhängiger Technical-Lead-Review → STOPP

## Wartet – Admin – Agent `Admin platform audit`

- Slice A / PR #44: merged
- Slice B / PR #46: merged
- Slice C / PR #49 / ADR-0162: merged
- Billing-/Refund-P1 bleibt separater Pflichtblock vor Finance-/Payment-Live
- **kein Slice D ohne neuen kontrollierten Auftrag**

## Wartet – Account – Agent `Account plattform audit vorbereitung`

- AP-1 bis AP-3 integriert; AP-3 / PR #53 / ADR-0160 merged
- Foundation E / Traveller Context existiert bereits; nicht neu bauen
- volle Account Traveller Registry / Dokument-Lifecycle-/UX-Schicht bleibt spätere Arbeit
- **kein AP-4 oder anderer Account-/Traveller-Slice ohne neuen kontrollierten Auftrag / Shared-Gate**

## Wartet – Provider – Agent `Jetnity provider readiness audit`

- S1 bis S3 integriert; S3 / PR #54 / ADR-0161 merged
- S4–S8 bleiben offen
- kein echter Provider, Secret, Vertrag oder paid call automatisch aktiviert
- **kein S4 ohne neuen kontrollierten Auftrag**

## Harte Gates

- Kein Ready ohne aktuelle PO-Freigabe.
- Kein Merge ohne separate aktuelle PO-Freigabe.
- Production-Migrationen, Provideraktivierung, Secrets, Verträge und paid calls bleiben separate Gates.
- laufende Kosten > USD 100/Monat nur nach Freigabe.
- Shared Auth/RLS/Identity/Traveller/Route/Privacy/Billing/Admin-Audit/Provider Activation unter Technical-Lead-Steuerung.
- jeder Agent wird in Aufträgen **namentlich** genannt.

## Exakter nächster Schritt

- **`Trip workspace audit architecture`** arbeitet ausschließlich TW-1 weiter und stoppt nach seinen Gates für den Technical-Lead-Review.
- **`Account plattform audit vorbereitung`** wartet.
- **`Jetnity provider readiness audit`** wartet.
- **`Admin platform audit`** wartet.

Historische Aussagen, die Ziel-IA/TW-1 noch als nicht freigegeben oder alle Agenten als wartend bezeichnen, sind Pre-Approval-Evidence und dürfen diesen Stand nicht überschreiben.
