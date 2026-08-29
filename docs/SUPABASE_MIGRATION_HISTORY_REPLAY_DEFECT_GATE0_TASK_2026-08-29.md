# Supabase Migration-History Replay Defect – Gate 0 Task

Stand: 29. August 2026  
Status: **AUTHORIZED / AUDIT-ONLY / PARALLEL-SAFE / NO MUTATION**  
Issue: #216  
Baseline: `main @ b2857117741aad47a2bca3d198e5a0a88b4a0415`

## 1. Ziel

Rekonstruiere die bereits beobachtete Supabase Migration-History-/Replay-Störung rund um `trip_item_commercial_provenance` vollständig und unabhängig, damit spätere Migrationen/Rebases sicher geplant werden können.

Der Slice ist bewusst parallel zu AP-7-S3 zulässig, weil er keine Account-/Traveller-Runtime, keine Shared Traveller Contracts und keine produktive Datenmutation berührt.

## 2. Zu prüfende Evidence

Mindestens:

- kanonische Repository-Migration `supabase/migrations/20260829140000_trip_item_commercial_provenance.sql`;
- Production-Migration-History und – sofern über die erlaubten Tools lesbar – gespeicherter Migration Body / Replay Evidence;
- Development Branch Migration-History;
- vorhandene Branch-Action-/Rebase-/Reset-Logs;
- tatsächlicher Production-/Development-Katalog der betroffenen Commercial-Provenance-Objekte;
- bestehende Status-/Handoff-/ADR-Dokumente zu S5-B;
- aktuelle Supabase-Dokumentation/unterstützte Reparaturpfade nur soweit erforderlich und belegbar.

## 3. Fragen

1. Was war die exakte Ursache des Replay-Fehlers auf Statement 0?
2. Ist die Störung nur Migration-History/Metadata oder besteht echter Schema-Drift?
3. Welche Objekte existieren in Production und Development tatsächlich?
4. Welche Reparaturoptionen sind technisch möglich und welche davon sind sicher/verantwortbar?
5. Braucht eine spätere Reparatur Product-Owner-Freigabe? Welche Backups/Evidence sind vorher Pflicht?
6. Ist Supabase Support/CLI/History-Repair gegenüber direkter Metadata-Manipulation vorzuziehen?
7. Welche Acceptance Criteria müssen gelten, bevor irgendeine spätere Repair-Aktion ausgeführt wird?

## 4. Deliverables

Erstelle ausschließlich audit-/evidence-bezogene Dokumentation, z. B.:

- Status / Findings;
- Recommendation + Options/Risiken;
- Handoff;
- Self-Review;
- bei Bedarf ADR-/Risk-Eintrag, aber keine Änderung globaler Current-State-Dateien, die der Technical Lead zentral hält.

Jede Behauptung zu Production/Development muss mit tatsächlicher Evidence belegt oder ausdrücklich als unbestätigt markiert werden.

## 5. Hard Non-Scope

Kein:

- Production- oder Development-Apply/Reset/Rebase/Repair;
- Migration-History-Edit;
- Schema-/Daten-/RLS-/Grant-/Ownership-Änderung;
- Auth/Session/MFA/AAL;
- AP-7-S3 oder Account-/Traveller-Runtime;
- Änderung an `lib/traveller/account-registry.ts`, `/account/travellers` oder Account-Navigation;
- Provider-Live/Secrets/paid calls;
- TW-8;
- Payments;
- Branch Protection;
- Public Launch;
- automatischer Follow-up-Repair-Slice.

## 6. Agent / Governance

Cursor-Agent: `Jetnity infrastructure migration audit 1`

Neue, unabhängige Generation für diesen Audit.

- PR bleibt Draft.
- Cursor darf niemals Ready setzen oder mergen.
- Keine Supabase-Mutation aus dem Agenten.
- Bei unmittelbaren Review-Fixes wird dieselbe Session verwendet.
- Vor Handoff `origin/main` erneut prüfen und Drift dokumentieren.
- Nach Evidence + Self-Review **STOPP für unabhängigen Technical-Lead Exact-Head-Review**.
