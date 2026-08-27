# Jetnity – PR #98 Post-Merge Technical-Lead Checkpoint – 27. August 2026

Stand: 27. August 2026  
Typ: **kanonische Continuity / Post-Merge Evidence**

## 1. Live-Baseline

PR #98 `P1: Admin AAL2 Production Data-Plane Alignment` wurde nach unabhängigem Technical-Lead-Re-Review normal integriert.

- Reviewed Exact Head: `b3ce11c33de3b016d89b4a4e28828810102dce7a`
- Technical-Lead PASS Review: `5042554449`
- Exact-Head GitHub Actions CI: Run `33087039741` — SUCCESS
- Exact-Head Vercel Preview: `dpl_6BQpigWSJz2hR77wcEXjSao4zdYX` — READY
- Merge-Commit auf `main`: `beaef64a151adceb8f5bc759f58ae9ad13cecc51`

Live-Evidence gewinnt weiterhin über diesen Checkpoint. Jeder neue Chat muss `main`, PRs, CI, Vercel, Supabase und Branch Protection erneut live verifizieren.

## 2. Was PR #98 integriert

Integriert ist die **vorbereitete, forward-only** Alignment-Migration:

`supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql`

Kanonischer Vertrag:

> administrative DB-Fähigkeit = unveränderte Mindestrolle **UND** aktueller signierter Supabase-JWT-Claim `aal='aal2'`.

Die historische Development-/Repo-Differenz bleibt ehrlich dokumentiert:

- Development-History: `20260826052735_admin_aal2_data_plane`
- historische Repo-Datei: `20260826090000_admin_aal2_data_plane.sql`
- neue forward-only Alignment-Datei: `20260827170000_admin_aal2_data_plane_alignment.sql`

Der Current-State-Policy-Test rekonstruiert `CREATE POLICY` + `ALTER POLICY ... RENAME` + `DROP POLICY` und verwendet die aktuellen Profil-Policy-Namen:

- `profiles_lesen`
- `profiles_aendern`
- `profiles_loeschen`

Der frühere Technical-Lead-Fund zu historischen `creator_profiles_*`-False-Positives ist damit geschlossen.

## 3. Production bleibt ausdrücklich unangetastet

**PR #98 Merge ist KEIN Production-Apply.**

Letzte vor dem Merge/Review live verifizierte Production-Wahrheit:

- Production-Projekt: `qscbgcdmivbbnzrcyegn`
- Migration-Head: `20260827010000_reise_anlegen_zero_stage_fail_closed`
- `public.aktuelles_admin_aal2()` in Production: nicht vorhanden
- `20260827170000_admin_aal2_data_plane_alignment`: 0× angewendet
- aktuelle Profil-Policies live: `profiles_lesen`, `profiles_aendern`, `profiles_loeschen`

Das Anwenden von `20260827170000...` auf Production bleibt ein **separates ausdrückliches Product-Owner-Gate**. Keine andere Freigabe gilt dafür automatisch.

## 4. Product-/Build-Order-Folge

Der Security-Autoren-/Review-Slice ist repository-seitig integriert. Der noch offene Production-Apply blockiert nicht automatisch die **Vorbereitung** des nächsten fachlich zulässigen Produktslices.

Nach der bereits durchgeführten Live-Rekonstruktion ist der nächste Workspace-Kandidat:

**TW-7 – Hub-Anschluss / Multi-Destination-Hub-Truth**, eng begrenzt auf das, was AP-3 nicht bereits besitzt.

Bekannte Grenzen:

- kein Neuaufbau des Workspace-Routings;
- Account, Gast und Workspace verwenden bereits die kanonische `/reisen/[tripId]`-Route;
- AP-3 Lifecycle-Gruppierung bleibt Account-Eigentum;
- kein AP-4 Archive-Write, kein AP-7 Traveller-Registry-Start;
- kein TW-8 ohne Provider-/Commercial-Provenance-Gate;
- kein Homepage-/Growth-/Provider-Live-Scope.

Vor Runtime-Start muss `Cursor-Agent: Trip workspace audit architecture` den aktuellen `main` und AP-3/Hub-Vertrag erneut live prüfen und den exakten TW-7-Gap bestätigen.

## 5. Parallelität

Kontrollierte Parallelität ist jetzt möglich:

- `Cursor-Agent: Trip workspace audit architecture` darf TW-7 live analysieren/vorbereiten und nach Freigabe den engen Slice implementieren.
- `Cursor-Agent: Jetnity quality security audit` ist für PR #98 Autorenarbeit abgeschlossen; kein weiterer AAL2-Production-Write ohne neues ausdrückliches Gate.
- Account/Admin/Provider/Growth/Native nicht blind parallel in Shared Auth/RLS/Account/Commercial-Verträge schreiben lassen.

## 6. Offene Governance-/Security-Punkte

- Production AAL2 Data-Plane Apply bleibt offen und Product-Owner-gated.
- `main` Branch Protection / Ruleset bleibt live nicht aktiviert und ist ein Governance-Risiko.
- P2-TA-06 (`documents[0]` latent fallback) bleibt offen.
- Provider S5-B bleibt nicht gestartet; TW-8 bleibt gated.
- Project-Sanitation PR #88 bleibt non-destructive historische Evidence; kein automatisches Cleanup.

## 7. New-Chat-Regel

Jeder neue ChatGPT-Technical-Lead muss dieselbe Arbeitsweise übernehmen:

1. `JETNITY_START_HERE.md` und die kanonischen Governance-/Handoff-Dateien lesen.
2. Danach **alles live** verifizieren: `main`, offene PRs/Branches, CI, Vercel, relevante Supabase-Stände, Review-Threads und Gates.
3. Alte SHAs, PR-Bodies, Screenshots und Checkpoints nur als Evidence ihres Zeitpunkts behandeln.
4. Materiale Fortschritte, Entscheidungen, Review-Ergebnisse und Gates im Repository persistieren.
5. Autonom mergen nur nach unabhängigem Exact-Head-PASS; besondere Product-Owner-Gates bleiben bestehen.

Dieser Checkpoint superseded ältere Aussagen, PR #98 sei noch Draft/CHANGES REQUIRED. Die historische Review-Evidence bleibt erhalten.