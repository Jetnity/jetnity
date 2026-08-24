# Jetnity – Trip Workspace TW-2 Status

Stand: 25. August 2026  
Status: **vorbereitet / Runtime noch nicht gestartet**

## Steuerung

- Agent: `Trip workspace audit architecture`
- Branch: `feat/trip-workspace-tw2-overview`
- Basis bei Branch-Erstellung: `main` @ `5eed1baf01b3dc787269bb94f9bd23358a17d983`
- TW-1: PR #56 gemergt, Merge-Commit `02b166e652f046d41f6e5b8d292e980369ca255e`
- ADR: `docs/ADR_0164_TRIP_WORKSPACE_TW2_OVERVIEW.md`
- Auftrag: `docs/TRIP_WORKSPACE_TW2_TASK.md`

## Ziel

TW-2 verdichtet ausschließlich die bestehende Reise-Wahrheit zu einer schnellen, ruhigen Reiseübersicht. Kein neuer persistierter Gesamtstatus, kein Shadow-Lifecycle, kein TW-4.

## Harte Grenzen

- keine DB/Migration/RLS/Auth/MFA/AAL
- kein `trips.status`-Write / kein neuer Lifecycle-Vertrag
- keine Traveller Registry / Citizenship-/Document-Neumodellierung
- keine Safety-/Seasonal-Orchestrierung
- kein Provider S4 / keine Provideraktivierung / Secrets / Verträge / paid calls
- kein Admin D / Account AP-4
- keine Production-Migration
- kein TW-3/TW-4/TW-5+

## Verbindliche Qualitätsregeln

- bestehende Coverage-/Graph-Ableitungen wiederverwenden
- AP-3-Date-only-Lifecycle nicht widersprechen
- Guest/Account gleicher Graph → gleiche fachliche Übersicht
- `unknown` bleibt `unknown`
- mehrere Citizenships/Dokumente bleiben möglich; kein Standard-Pass
- Safety/Seasonal ohne Evaluation niemals clean

## Autonomie

TW-2 liegt in der verbindlichen Build-Reihenfolge und ist ein normaler Technical-Lead-gesteuerter Slice. Nach Self-Review, Exact-Head-Gates und unabhängigem Technical-Lead-PASS darf Ready/Merge ohne neue PO-Freigabe erfolgen, solange kein besonderes Gate aus `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md` betroffen ist.

## Nächster Schritt

`Trip workspace audit architecture` implementiert ausschließlich `docs/TRIP_WORKSPACE_TW2_TASK.md`, führt Self-Review und vollständige Exact-Head-Gates aus und stoppt danach für den unabhängigen ChatGPT/Technical-Lead-Re-Review.
