# Jetnity – AP-7-S4 Account Plan Reconciliation

Stand: 30. August 2026  
Status: **CURRENT RECONCILIATION / LIVE-EVIDENCE WINS**

## Zweck

`docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` wurde am 28. August 2026 aus einem älteren Account-Stand rekonstruiert. Einzelne AP-7-Passagen darin beschreiben S1 noch als Draft bzw. Persistenz/UI als gated. Diese Aussagen sind durch spätere integrierte Live-Evidence superseded.

Die große kanonische Plan-Datei wird in diesem Continuity-Closure **nicht breit neu geschrieben**, weil der verfügbare GitHub-Write-Pfad nur vollständige Datei-Ersetzungen unterstützt und ein unnötiger Whole-File-Rewrite hier mehr Drift-Risiko als Nutzen erzeugen würde.

Bis zu einer späteren gezielten Plan-Revision gilt deshalb diese Reconciliation zusammen mit dem aktuellen Technical-Lead-Checkpoint als Current Truth.

## AP-7 Current Truth

Integriert und **nicht erneut zu planen**:

1. AP-7 Gate 0 / Product-Owner Dual-Authority approval.
2. AP-7-S1 pure Domain Contract in `lib/traveller/account-registry.ts`.
3. AP-7-S2 Account Registry Persistence / Identity / owner-only RLS auf Production.
4. AP-7-S3 reale Account Traveller Registry CRUD/UI unter `/account/travellers`.
5. AP-7-S4 explizite Account Registry → independent trip-owned Traveller Snapshot Runtime-Materialisierung.

Finale AP-7-S4 Evidence:

- Issue #222: CLOSED / completed;
- Source Draft PR #223 / final Head `f366ea839dfd3560b4ca2f0b4ec054f0ed8c463a`;
- Recovery PR #224;
- Merge/Main `e33341b30019fb1a57c2cc6f2cd8c0b0a3a85f40`;
- Post-Merge CI #1293 / `33279680487`: SUCCESS;
- Vercel Production `dpl_6GZsxWbYwuY4LxFG8D8GoqK5Cxm8`: READY exact Main-SHA.

## Weiterhin bindende AP-7-Invarianten

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Nicht zulässig ohne neuen Vertrag/Gate:

- Default-/Primary-/Chosen-Pass;
- Default-Citizenship;
- First-Item-Wahrheit (`documents[0]`, `citizenships[0]`);
- Live Registry→Trip Referenz/Sync;
- stille Guest→Registry-Übernahme;
- Passport-/Document Numbers, MRZ, Scans, Biometrics, DOB, Health;
- automatische „bester Pass“- oder Visa-/Entry-Hard-Truth ohne echte kontextuelle Evidence.

## Konsequenz für den nächsten Slice

Der nächste Account-/Traveller-Slice darf **nicht** als AP-7-S1/S2/S3/S4-Neubau formuliert werden.

Vor Start:

1. frischer Binding Slice Precheck;
2. aktueller `main`/CI/Vercel/Supabase Live-Check;
3. verbliebene Traveller-/Document-Lifecycle-/Credential-Options-Lücken bestimmen;
4. migrationsnahe Kandidaten gegen das bekannte Supabase-Replay-P1 prüfen;
5. besondere Product-Owner-Gates bewerten;
6. neue logische Einheit → frischer Cursor-Agent.

Kein Folgeslice wird durch dieses Dokument automatisch autorisiert.
