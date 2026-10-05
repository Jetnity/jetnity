# Jetnity – Process Governance Note – 27. August 2026

Stand: 27. August 2026  
Typ: **Continuity / Governance Evidence**

## 1. Direkter Task-Commit auf `main`

Bei der Anlage des Implementierungsauftrags für `P1-AAL2-PROD-01` wurde `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_IMPLEMENTATION_TASK_2026-08-27.md` versehentlich direkt auf `main` committed (`d951725283f366588464a3fcd3dfc94cac4fb701`), weil `main` weiterhin weder Branch Protection noch Ruleset besitzt.

Diese Abweichung:

- änderte ausschließlich Dokumentation;
- änderte keine Runtime;
- führte keine Supabase-/Production-Migration aus;
- änderte kein RLS/Auth/AAL/Ownership;
- aktivierte keinen Provider, kein Payment und keine Kosten.

Der direkte Commit wird nicht versteckt oder rückwirkend aus der Historie entfernt.

## 2. Zweite operative Fehlbedienung und Cleanup

Bei der anschließenden Werkzeugumschaltung wurde zusätzlich versehentlich die leere Datei `docs/.keep` direkt auf `main` angelegt (`b96343cf8b47badb468dc18329ee45a1955b2a77`).

Die Datei enthielt **0 Bytes** und wurde unmittelbar wieder entfernt (`84f54194cf7461c5f785f4da490dba060c93e999`). Der resultierende Repository-Tree enthält diese Datei nicht mehr.

Auch diese beiden Commits:

- änderten keine Runtime;
- führten keine Production-/Supabase-Änderung aus;
- änderten keine Security-/Auth-/RLS-/Ownership-Semantik;
- verursachten keine Provider-/Payment-/Kosten-Aktivierung.

Die Historie wird nicht rewritten. Das Ereignis bleibt als Governance-Evidence sichtbar.

## 3. Wiederhergestellter Arbeitsmodus

Der eigentliche Security-Slice startet ab `main @ 84f54194cf7461c5f785f4da490dba060c93e999` ausschließlich auf:

`fix/admin-aal2-production-alignment-2026-08-27`

Ab diesem Punkt gilt wieder strikt:

1. separater Branch vom aktuellen Live-`main`;
2. Draft-PR;
3. Feature-/Audit-Autor != unabhängiger Finalreviewer;
4. Exact-Head GitHub Actions + Vercel;
5. unabhängiger Technical-Lead-PASS;
6. normaler Merge erst danach;
7. Production-Apply weiterhin separates Product-Owner-Gate.

Keine weitere direkte `main`-Mutation gehört zum normalen Workflow.

## 4. Systemischer Restpunkt

Die fehlende Branch Protection / das fehlende Ruleset hat beide Fehlbedienungen technisch ermöglicht. Das bleibt ein dokumentiertes Governance-Risiko und muss spätestens vor Launch gehärtet werden. Bis dahin ist jeder Technical Lead verpflichtet, Branch- und Zielref vor jeder GitHub-Write-Operation explizit zu prüfen.
