# Jetnity – Handoff und nächste Schritte

Stand: **25. August 2026, ca. 00:57 Europe/Zurich**  
Status: **kanonischer operativer Einstieg für neue Chats/Agenten**

> Vor jeder neuen Aktion GitHub/CI/Vercel/Supabase live verifizieren. Historische Handoffs bleiben Evidence ihres damaligen Zeitpunkts und dürfen neuere zentrale Wahrheit nicht überschreiben.

## Zuerst lesen – verbindlich

**`docs/JETNITY_BINDING_BUILD_ORDER.md`** ist die aktuelle Product-Owner-verbindliche Reihenfolge dafür, **was Jetnity baut, wie es gebaut wird und welcher bestehende Agent wann zuständig ist**.

Kein neuer Chat oder Agent darf anhand älterer Handoffs eine andere Reihenfolge erfinden. Eine spätere Änderung dieser Reihenfolge braucht eine neue ausdrückliche Product-Owner-Entscheidung.

## Aktuelle operative Wahrheit

Repository: `Jetnity/jetnity`

- `main`: `1bc1e1f492ea30710840b4a38d96437d56b73d77`
- letzter integrierter großer Block: Trip Workspace Audit / PR #55, danach docs-only Kontinuitätsupdates auf `main`
- Product Owner hat die Trip-Workspace-Ziel-IA anschließend ausdrücklich angenommen und den Start von **TW-1** freigegeben
- aktiver Draft-PR: **#56 – Trip Workspace TW-1 – Shell & Geräteparität**
- Branch: `feat/trip-workspace-tw1-shell-device-parity`
- aktuell live verifizierter PR-Head: `d087b6d38f5bff2b712fbb498dade637d478f1e1`
- PR #56 ist **open / Draft / nicht gemergt**
- kein TW-2, TW-4 oder TW-3 automatisch freigegeben
- Supabase Production endet bei `20260824140000`
- `20260824160000` / `20260824180000` bleiben Development-only / nicht Production-approved
- `main` Branch Protection ist technisch weiterhin nicht umgesetzt

## Aktive und wartende Agenten

### Aktiv – `Trip workspace audit architecture`

- arbeitet kontrolliert an **TW-1 / PR #56**
- TW-1 = Shell & Geräteparität
- danach Self-Review → vollständige Exact-Head-Gates → unabhängiger ChatGPT/Technical-Lead-Re-Review → STOPP
- kein Mark Ready ohne neue ausdrückliche PO-Freigabe
- kein Merge ohne danach separate ausdrückliche PO-Freigabe
- kein automatischer Start von TW-2

### Wartet – `Account plattform audit vorbereitung`

- AP-1 bis AP-3 integriert
- kein AP-4 oder anderer Account-/Traveller-Slice ohne neuen kontrollierten Auftrag

### Wartet – `Jetnity provider readiness audit`

- Provider S1 bis S3 integriert
- kein S4 ohne neuen kontrollierten Auftrag

### Wartet – `Admin platform audit`

- Admin A bis C integriert
- kein Slice D ohne neuen kontrollierten Auftrag
- Billing-/Refund-P1 bleibt Pflichtblock vor Finance-/Payment-Live

## Verbindliche große Reihenfolge

Die vollständige Detailfassung steht in `docs/JETNITY_BINDING_BUILD_ORDER.md`.

Kurzfassung:

1. **Trip Workspace vollständig fertigbauen**: TW-1 → TW-2 → TW-4 → TW-3 → Details/Gaps on demand.
2. **Traveller-/Pass-/Multi-Citizenship-System vervollständigen**: bestehende Foundation E nicht neu bauen; Account Traveller Registry, Dokument-Lifecycle und produktweite Nutzung vervollständigen.
3. **Account Platform vollständig weiterführen**: AP-4 bis AP-12 gemäß Audit/Plan und Shared Gates.
4. **Provider Readiness S4–S8**, danach erst echte Provider unter separaten Verträgen/Secrets/Kosten-/Security-Gates.
5. **Admin Control Center D–K**, inkl. Billing-/Refund-P1 vor Finance-/Payment-Live.
6. **Homepage** erst nach stabilem zentralem Trip-Workspace-Kern, insbesondere TW-2/TW-4.
7. **Kommerzielle Produktschicht**: echte Preise/Verfügbarkeit, Multi-Provider-Vergleich, Provenance, Affiliate/Attribution, Revenue/Entitlements.
8. **Production-Härtung**: E2E, Security/Privacy, Backup/Restore, Monitoring, Rate/Cost, Performance, Accessibility, Release/Rollback, Branch Protection.

## Multi-Citizenship / Dokumente – harte Regel

Foundation E existiert bereits und bleibt kanonisch:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Noch fehlende Account-/Registry-/Lifecycle-Schichten müssen darauf aufbauen. Relevante Funktionen müssen mehrere Staatsbürgerschaften und Dokumente berücksichtigen, wenn ein anderer Pass einen zulässigen oder besseren Einreise-/Transitweg ermöglicht. Keine stille Citizenship-Annahme.

## Governance

- Kein Mark Ready ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Kein Merge ohne separate ausdrückliche aktuelle Product-Owner-Freigabe.
- Production-Migrationen separat freigeben.
- Provideraktivierung, Secrets/API-Keys, Verträge und kostenpflichtige Calls separat freigeben.
- laufende Infrastruktur-/Providerkosten > USD 100/Monat nur nach PO-Freigabe.
- Shared Auth/RLS/Identity/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation seriell unter Technical-Lead-Steuerung.
- `unknown` bleibt `unknown`; keine Fake-Truth.
- Agenten müssen P0/P1-Risiken und erhebliche Verbesserungsmöglichkeiten proaktiv melden, dürfen Scope aber nicht still erweitern.
- Jeder Auftrag an einen Cursor-Agenten nennt den Agenten **namentlich**.

## Kanonische Einstiegsquellen für neue Chats

1. `docs/JETNITY_BINDING_BUILD_ORDER.md`
2. `JETNITY_HANDOFF.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/CURRENT_MULTI_AGENT_TEAM_STATUS.md`
5. aktueller Slice-Task / Status / Handoff / Review
6. live verifizierter GitHub-/CI-/Vercel-/Supabase-Stand

## Exakter nächster Schritt

- **`Trip workspace audit architecture`** arbeitet TW-1 kontrolliert zu Ende und stoppt anschließend für den unabhängigen Technical-Lead-Review.
- **`Account plattform audit vorbereitung`** wartet.
- **`Jetnity provider readiness audit`** wartet.
- **`Admin platform audit`** wartet.

PR #52 bleibt Draft. Dieses Handoff-/Policy-Update ist Dokumentation; **kein Ready und kein Merge von PR #52 ist damit freigegeben**.
