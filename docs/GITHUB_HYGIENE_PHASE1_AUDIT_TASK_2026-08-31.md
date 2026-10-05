# Jetnity – GitHub Hygiene Phase 1 Audit

Stand: 31. August 2026  
Status: **BINDING READ-ONLY AUDIT / NO DELETION**

Issue: #266  
Baseline: `main@7f057e6ee8caddf87a3b5365731eaf43d037a114`  
Branch: `audit/github-hygiene-phase1-2026-08-31`

## Ziel

Remote-Branch-Bestand live inventarisieren und reproduzierbar klassifizieren, ohne irgendeinen Branch zu löschen oder zu verändern.

## Verbindlicher Scope

Für jeden Remote-Branch außer `main` erfassen:
- exakter Branchname;
- exakter Tip-SHA;
- ob Tip/Branch-Historie in aktuellem `main` enthalten ist;
- ob Branch Head eines offenen PR ist;
- ob Branch geschützt ist;
- Klassifikation `DELETE-SAFE_MERGED`, `KEEP_OPEN_PR`, `REVIEW_UNMERGED` oder `KEEP_MAIN`.

Erzeuge einen dauerhaft prüfbaren Manifest-/Audit-Bericht und eine kurze Empfehlung für Phase 2. Keine Löschung in diesem Slice.

## Hard Non-Scope

- keine Branch-/Tag-Löschung;
- kein Force Push / Ref-Move;
- keine PR-Schließung;
- keine Branch Protection-/Ruleset-Änderung;
- keine Runtime-/App-Dateien;
- keine Supabase-/Vercel-/Production-Mutation;
- keine Shared Traveller/Requirements/Auth/Admin/Provider-Verträge;
- `docs/ACTIVE_WORK_STATUS.md` und `JETNITY_START_HERE.md` nicht verändern;
- kein automatischer Phase-2-Delete-Runner.

## Parallelitätsgrenze

Dieser Agent arbeitet ausschließlich an GitHub-Metadaten und eigenen Hygiene-Dokumenten. Er darf keine Dateien des Entry-Requirements-E1- oder TW-Readiness-Streams verändern.

## Acceptance

- Manifest ist vollständig genug, um jede spätere Löschung einzeln erneut zu verifizieren;
- offene PR-Heads und ungemergte Branches werden niemals als delete-safe markiert;
- `main` ist ausgeschlossen;
- Unsicherheit führt zu `REVIEW_UNMERGED`, nicht zu Delete-Safe;
- Agent dokumentiert verwendete Live-Evidence und STOPpt für TL-Review.

## STOP

Nach Audit/Manifest/Self-Review STOP. Keine destruktive Aktion ausführen.
