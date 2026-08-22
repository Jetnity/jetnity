# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation E – Traveller Context / Multi-Citizenship / Multi-Document – Auftrag bereit**

## 1. Aktueller Zustand

Foundation D – Route & Transit Intelligence ist vollständig abgeschlossen und **nicht erneut zu bauen**.

- PR #34: gemergt
- Merge-Commit auf `main`: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- final geprüfter PR-Head: `11bfc958aba54486148fa756f5f8d4616ff86c8a`
- finaler CI-Lauf: success
- Vercel finaler PR-Head: success
- Vercel Production nach Merge: success
- Production-Abnahme: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`

Nach separater Product-Owner-Freigabe sind die drei Foundation-D-Migrationen auf Production und verifiziert:

- `20260822130000_reise_anlegen_route_itinerary`
- `20260822140000_flug_route_itinerary_airport_truth`
- `20260822150000_trip_items_route_itinerary_guard`

Production ist gesund. Keine externen Provider, Secrets oder neuen laufenden Providerkosten wurden aktiviert.

## 2. Jetzt aktiv – Foundation E

**Foundation E – Traveller Context / Multi-Citizenship / Multi-Document** ist der nächste verbindliche Kernblock.

Verbindlicher Implementierungsauftrag:

`docs/CURSOR_FOUNDATION_E_TRAVELLER_CONTEXT_TASK.md`

Der Auftrag ist auf `main` versioniert und muss vom neuen Cursor-Agenten vollständig gelesen und exakt ausgeführt werden.

Der neue Agent startet von frischem `origin/main` und erstellt:

`feat/traveller-context-intelligence`

sowie früh einen **Draft PR**.

Keine Implementierung auf dem alten Foundation-D-Branch fortsetzen.

## 3. Foundation-E-Ziel

Langfristiges kanonisches Grundmodell:

> **Ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängige zulässige Optionen.**

Foundation C besitzt noch transitionale singuläre Felder auf `trip_travellers`. Foundation E muss diese professionell in ein 1:n-Modell überführen, mit:

- sicherem Expand/Contract-Übergang,
- Backfill ohne Datenverlust,
- klarer kanonischer Source of Truth,
- Guest/Account-Parität,
- verlustfreier/idempotenter Guest→Account-Übernahme,
- traveller-spezifischer Readiness,
- Multi-Credential-Fingerprint/Freshness,
- Gruppenreisen,
- provider-neutraler Credential-Evaluationsnaht,
- RLS/FK/Owner-Security,
- Mobile/Tablet/Desktop-UX,
- vollständiger Test-/Audit-Matrix.

Foundation-D-Route-Truth wird wiederverwendet und bleibt traveller-neutral.

## 4. Harte Grenzen Foundation E

- kein echter Travel-Requirements-Provider
- kein Timatic-Vertrag
- keine Provider-Secrets
- keine Production-Migration ohne separates Product-Owner-Gate
- kein Merge ohne ausdrückliche Product-Owner-Freigabe
- keine Pass-/Ausweisnummern
- keine Scans/MRZ/Biometrie/Dokumentvault
- kein LLM als regulatorische Truth-Quelle
- `unknown` bleibt `unknown`
- keine breite Workspace-Neugestaltung in Foundation E
- keine Safety-/Seasonality-Implementierung vorwegnehmen.

## 5. Pflichtlektüre für den neuen Agenten

Mindestens:

- `docs/CURSOR_FOUNDATION_E_TRAVELLER_CONTEXT_TASK.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`
- `docs/TRAVEL_READINESS.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
- `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md`
- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- Quality/Logic/UX/Continuity/Merge-/Progress-Policies.

Wenn ältere Passagen in `ROADMAP.md` oder `JETNITY_HANDOFF.md` Foundation D noch als offen darstellen, sind diese operativ historisch überholt. **Diese Datei, `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md` und der Foundation-E-Task enthalten den neueren Arbeitsstand.** Der neue Agent soll die zentralen Dokumente im Foundation-E-Branch entsprechend nachziehen.

## 6. Danach verbindliche Reihenfolge

Nach Foundation E:

1. Travel Safety & Disruption Intelligence – provider-neutrale Foundation
2. Travel Timing & Seasonal Intelligence – provider-neutrale Foundation
3. Provider-Readiness-Pass über alle relevanten Bereiche
4. großer End-to-End Trip-Workspace-/Übersicht-Umbau inklusive Weg dorthin
5. finaler Workspace Intelligence Audit
6. echte Providerphase
7. Provider-backed End-to-End-/Truth-Audit
8. finale Startseiten-Positionierung.

## 7. Großer Workspace-Umbau – späterer verbindlicher Scope

Der spätere Umbau umfasst den kompletten Nutzerweg, nicht nur die Übersicht: funktionaler Reiseeinstieg, Multi-Destination, Planungsflow, Gast-/Account-Weg, `Meine Reisen`, Übergang in den Workspace, Fachbereiche und deren Zusammenspiel sowie die Übersicht als intelligentes Kontrollzentrum für Status, offene Punkte, Warnungen, Empfehlungen und nächste Schritte.

Fachregel: `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md`.

## 8. Exakter nächster Schritt

1. **Neuen Cursor-Agenten starten.**
2. Ihm ausschließlich den Startauftrag geben, `docs/CURSOR_FOUNDATION_E_TRAVELLER_CONTEXT_TASK.md` und die dort genannte Pflichtlektüre vollständig zu lesen.
3. Agent prüft frisches `main`, tatsächliche DB-/Code-Wahrheit und erstellt `feat/traveller-context-intelligence`.
4. Agent führt zuerst Phase 1 Architektur-/Security-/Migration-Audit aus und dokumentiert den Stand.
5. Danach Foundation E gemäß Task implementieren.
6. Draft PR bleibt bis Review und Product-Owner-Gate ungemergt.
