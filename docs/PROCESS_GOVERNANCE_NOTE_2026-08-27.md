# Jetnity – Process Governance Note – 27. August 2026

Stand: 27. August 2026  
Typ: **Continuity / Governance Evidence**

Bei der Anlage des Implementierungsauftrags für `P1-AAL2-PROD-01` wurde `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_IMPLEMENTATION_TASK_2026-08-27.md` versehentlich direkt auf `main` committed (`d951725283f366588464a3fcd3dfc94cac4fb701`), weil `main` weiterhin weder Branch Protection noch Ruleset besitzt.

Diese Abweichung:

- änderte ausschließlich Dokumentation;
- änderte keine Runtime;
- führte keine Supabase-/Production-Migration aus;
- änderte kein RLS/Auth/AAL/Ownership;
- aktivierte keinen Provider, kein Payment und keine Kosten.

Der direkte Commit wird nicht versteckt oder rückwirkend aus der Historie entfernt. Ab diesem Punkt gilt für den eigentlichen Security-Slice wieder strikt:

1. separater Branch vom aktuellen Live-`main`;
2. Draft-PR;
3. Feature-/Audit-Autor != unabhängiger Finalreviewer;
4. Exact-Head GitHub Actions + Vercel;
5. unabhängiger Technical-Lead-PASS;
6. normaler Merge erst danach;
7. Production-Apply weiterhin separates Product-Owner-Gate.

Die fehlende Branch Protection bleibt ein dokumentiertes Governance-Risiko und muss spätestens vor Launch gehärtet werden.
