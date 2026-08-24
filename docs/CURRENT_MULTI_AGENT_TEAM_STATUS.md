# Jetnity – Current Multi-Agent Team Status

Stand: **25. August 2026, ca. 00:57 Europe/Zurich**  
Status: **kanonische operative Team-Wahrheit für Chat-/Agent-Wechsel**

> Diese Datei liegt auf `docs/chatgpt-technical-lead-handoff-2026-08-24` / Draft-PR #52. Vor Eingriffen GitHub/CI/Vercel/Supabase live verifizieren.

## Verbindliche Build-Reihenfolge

**Zuerst lesen:** `docs/JETNITY_BINDING_BUILD_ORDER.md`.

Die dort dokumentierte Product-Owner-Reihenfolge ist verbindlich und darf nur durch eine spätere neue ausdrückliche Product-Owner-Entscheidung geändert werden.

Kurzform:

1. Trip Workspace komplett: TW-1 → TW-2 → TW-4 → TW-3 → Details/Gaps on demand
2. Traveller-/Pass-/Multi-Citizenship-System vervollständigen, Foundation E beibehalten
3. Account AP-4–AP-12
4. Provider S4–S8 → danach echte Provider
5. Admin D–K inkl. Billing-/Refund-P1
6. Homepage
7. kommerzielle Produktschicht
8. Production-Härtung

## Aktueller `main` / Production

- Repository: `Jetnity/jetnity`
- `main`: `1bc1e1f492ea30710840b4a38d96437d56b73d77`
- letzter großer Merge: Trip Workspace Audit / PR #55; danach docs-only Kontinuitätsupdates
- Supabase Production endet bei `20260824140000`
- `20260824160000` / `20260824180000` bleiben Development-only / nicht Production-approved
- `main` Branch Protection technisch weiterhin nicht umgesetzt

## ADR-Allokation

- ADR-0158 = Admin Slice A / PR #44
- ADR-0159 = Admin Slice B / PR #46
- ADR-0160 = Account AP-3 / PR #53
- ADR-0161 = Provider S3 / PR #54
- ADR-0162 = Admin Slice C / PR #49
- ADR-0163 = angenommene Trip-Workspace-Ziel-IA + Startgrenze TW-1

Neue ADR-Nummern nur kontrolliert durch den Technical Lead.

## Workstreams

### Aktiv – `Trip workspace audit architecture`

- aktiver Draft-PR #56 – **Trip Workspace TW-1 – Shell & Geräteparität**
- Branch `feat/trip-workspace-tw1-shell-device-parity`
- live verifizierter PR-Head bei diesem Checkpoint: `d087b6d38f5bff2b712fbb498dade637d478f1e1`
- Product Owner hat Ziel-IA und Start von TW-1 ausdrücklich freigegeben
- kein TW-2/TW-4/TW-3 automatisch freigegeben
- nach TW-1: Self-Review → Exact-Head-Gates → unabhängiger Technical-Lead-Review → STOPP

### Wartet – `Admin platform audit`

- Slice A–C integriert
- Billing-/Refund-P1 bleibt Pflichtblock vor Finance-/Payment-Live
- kein Slice D ohne neuen kontrollierten Auftrag

### Wartet – `Account plattform audit vorbereitung`

- AP-1–AP-3 integriert
- Foundation E / Traveller Context existiert; nicht neu bauen
- volle Account Traveller Registry / Dokument-Lifecycle-/UX-Schicht bleibt offen
- kein AP-4 oder anderer Account-/Traveller-Slice ohne neuen kontrollierten Auftrag / Shared-Gate

### Wartet – `Jetnity provider readiness audit`

- S1–S3 integriert
- S4–S8 offen
- keine Provideraktivierung/Secrets/Verträge/paid calls automatisch freigegeben
- kein S4 ohne neuen kontrollierten Auftrag

## Multi-Citizenship / Dokumente

Kanonisch bleibt:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Relevante Funktionen müssen mehrere Staatsbürgerschaften und Dokumente berücksichtigen. Keine implizite Ein-Pass-Annahme und keine stille Citizenship-Ableitung aus Residence/Standort/Sprache/Domain/Abflugland.

## Harte Governance

- kein Ready ohne ausdrückliche aktuelle PO-Freigabe
- kein Merge ohne separate ausdrückliche aktuelle PO-Freigabe
- Green CI/Vercel/Self-Review/Technical Closure ersetzen keine Freigabe
- Production-Migrationen separat
- Provideraktivierung/Secrets/Verträge/paid calls separat
- > USD 100/Monat laufende Kosten nur nach PO-Freigabe
- Shared Auth/Identity/Sessions/MFA/AAL/RLS/Ownership/Guest→Account/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation seriell unter Technical-Lead-Steuerung
- `unknown` bleibt `unknown`; keine Fake-Truth
- keine stillen Scope-Erweiterungen
- jeder neue Agentenauftrag nennt den Agenten **namentlich**

## Exakter nächster Schritt

- **`Trip workspace audit architecture`** arbeitet nur TW-1 weiter und stoppt danach für unabhängigen Technical-Lead-Review.
- **`Account plattform audit vorbereitung`** wartet.
- **`Jetnity provider readiness audit`** wartet.
- **`Admin platform audit`** wartet.
- PR #52 bleibt Draft; kein Ready/Merge ohne PO-Freigabe.

Historische Aussagen, die Ziel-IA/TW-1 noch als nicht freigegeben oder alle Agenten als wartend bezeichnen, sind Pre-Approval-Evidence und dürfen diesen Status nicht überschreiben.
