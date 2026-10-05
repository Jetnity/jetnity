# ChatGPT Technical Lead – Requirements Truth-Ops S4-R1 Closed

Stand: 31. August 2026  
Status: **CANONICAL CLOSURE CHECKPOINT / S4-R1 CLOSED / LIVE-EVIDENCE GEWINNT**

## 1. Ergebnis

Requirements Truth-Ops S4-R1 ist technisch abgeschlossen, unabhängig durch den Technical Lead geprüft, geschützt gemergt und post-merge verifiziert.

Runtime-Merge auf `main`:

`43177a7bab61b0934775f86442833af0f27b3361`

Dieser docs-only Closure-/Continuity-PR bewegt `main` nach dem Runtime-Merge erneut. **Finalen `main` nach diesem Docs-Merge immer live lesen.**

## 2. PR-/Merge-Evidence

Implementierungs-Head:

`595b4ad2a827beff7bec597433b3316d21da0747`

- Draft-PR #293: **CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED**.
- Grund: bekannter GitHub-Connectorfehler beim Draft→Ready-Schritt: `Repository.fullDatabaseId`.
- Branch Protection wurde nicht gelockert, umgangen oder gebypasst.
- non-draft Review-PR #296 wurde auf **dem exakt gleichen geprüften Head** erstellt.
- PR #296 wurde vollständig neu gegatet und geschützt gemergt.
- Merge-SHA: `43177a7bab61b0934775f86442833af0f27b3361`.

Der mechanische Ersatzprozess bleibt verbindlich, solange der Connectorfehler besteht:

1. Cursor liefert im Draft-PR.
2. TL reviewt den exakten finalen Head.
3. bei TL-PASS non-draft Review-PR auf exakt demselben Commit.
4. neuer Exact-Head-Gate auf CI, Vercel, Mergeability und Threads.
5. erst dann geschützter Merge.

## 3. Exact-Head- und Post-Merge-Gates

Vor Merge auf Review-PR #296:

- Head: `595b4ad2a827beff7bec597433b3316d21da0747`.
- CI #1422 / Run `33342318481`: **SUCCESS**.
- Vercel Preview `dpl_56YKqcD6p1vSAaaFWmhTqX4HWNs6`: **READY** exakt auf Head.
- PR: mergeable / clean.
- GitHub Review Threads: **0**.
- Vercel Toolbar unresolved Threads auf Review-Branch: **0**.

Nach Merge:

- `main`: `43177a7bab61b0934775f86442833af0f27b3361`.
- Main-CI #1423 / Run `33342536940`: **SUCCESS** exakt auf Merge-SHA.
- Vercel Production `dpl_EkrbQmFfxD8gwnZ4AnYFegfaRBWG`: **READY**, target `production`, exakt auf Merge-SHA.
- Vercel Toolbar unresolved Threads auf `main`: **0**.
- Issue #292: **CLOSED / completed**.

## 4. Implementierter S4-R1-Vertrag

### Provider Port / Cancellation

- `RequirementsProvider.evaluate(anfrage, signal)` verlangt ein Pflicht-`AbortSignal`.
- ein bereits abgebrochenes äußeres Signal startet keinen Provider-Call.
- Domain-Hard-Timeout: **4.000 ms**.
- Timeout wird per `AbortController` abgebrochen; kein bloßes un-cancelled Race als Sicherheitsgrenze.
- ein späterer Adapter muss das Signal in den bestehenden Provider Transport Core weiterreichen.
- kein zweiter HTTP-/Retry-Stack.

### Failure-Semantik

Intern unterscheidbar:

- `timeout`
- `aborted`
- `temporarily_unavailable`
- `unavailable`

Fail-closed Official Truth:

- Timeout / Abort / transient → `source_temporarily_unavailable`.
- unavailable / kein Provider / Kill-Switch → `provider_unavailable`.
- technische Fehler erzeugen keine `required` / `not_required` / `conditional` Hard Truth.
- Raw Vendor-/Secret-Fehler werden nicht in Official Evidence/Antworten übernommen.

### Readiness Kill-Switch

- Domain-Flag: `JETNITY_READINESS_AKTIV`.
- bestehendes `providerOpsZustand`-Muster wird wiederverwendet.
- Production bleibt hart aus, unabhängig von Flag oder Providerobjekt.
- Zugang nur bei explizitem Flag (`true` / `1`) und tatsächlich vorhandenem Providerobjekt.
- `requirementsProviderAus()` bleibt `null`.

### Bounded Freshness

- globaler Jetnity Official-`checkedAt`-Ceiling: **60 Minuten**.
- Alter `>= 60 Minuten` → `recheck_needed`.
- `checkedAt` = Jetnity Retrieval-/Evaluation-Zeit.
- Vendor-`lastUpdatedAt` darf nicht als Jetnity-`checkedAt` umgedeutet werden.
- spätere provider-spezifische Policy darf strenger, nicht ohne neue Entscheidung lockerer sein.

## 5. Tests / Quality

Agent lokale Evidence:

- `npm test`: **2834/2834**.
- S4-R1 Tests: 14/14.
- Kill-Switch Tests: 5/5.
- Engine Tests: 45/45.
- Typecheck PASS.
- Lint: 0 Errors / bestehende Warnings.
- Production Build PASS.
- Hygiene-Gates PASS.

Unabhängige GitHub-Gates und Post-Merge-Gates bestätigen den finalen Stand; Agent-Self-Review war nie TL-PASS.

## 6. Nicht geöffnet / weiterhin verboten

S4-R1 hat ausdrücklich **nicht** aktiviert:

- echten Requirements-/Visa-/Entry-Provider;
- Timatic, Sherpa oder anderen Vendor;
- Providerwahl / Vendorvertrag / DPA;
- Secrets oder API Keys;
- echte oder paid Calls;
- Supabase-Migrationen;
- RLS-/Ownership-/Storage-Änderungen;
- Auth/MFA/AAL-Änderungen;
- Workspace-Live-Provider-Wiring;
- sensitive Passnummern / MRZ / Scans / Biometrie / Gesundheitsakten;
- Commercial Runtime Writer;
- Public Launch / Store / Domain Cutover.

## 7. Traveller Truth bleibt unverändert

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Weiterhin verboten:

- Default-/Primary-/Preferred-/Chosen-Pass als Product Truth;
- Default-Citizenship;
- Herkunft/Wohnsitz als Nationalität ableiten;
- Issuer Country mit Citizenship gleichsetzen;
- `documents[0]` / `evaluations[0]` als Product Truth.

Trip Snapshot bleibt einzige Current Truth der konkreten Reise; Account Registry bleibt wiederverwendbare Faktenquelle, nicht automatische Evaluate Authority.

## 8. Bestätigte Entry Requirements / Travel Companion Target Architecture

Während S4-R1 hat der Product Owner die Zielarchitektur ausdrücklich erweitert und bestätigt.

Kanonische Datei:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

Verbindlich gehören in den Zielzustand unter anderem:

- visumfrei / klassisches Visum / Visa on Arrival / eVisa / eTA;
- offizielle Antrags-/Informationsquelle und direkte sichere Action;
- Passgültigkeit;
- `blank_passport_pages` als eigener strukturierter Requirement-Typ;
- Transitvisum/-genehmigung und vollständiger Transitkontext;
- Arrival-/Einreise-/Gesundheitsformulare;
- Impf-/Gesundheitsanforderungen;
- Versicherungspflicht;
- Rück-/Weiterflug-, Reise-/Unterkunftsnachweise;
- `financial_means` als eigener strukturierter Requirement-Typ;
- proaktive Travel-Companion-/Deadline-Semantik;
- zeitgebundene Action-Fenster wie „frühestens 72 Stunden vor Ankunft“;
- Referenzereignis + Zeitzone;
- `Jetzt erledigen` / `Demnächst` / `Zur Information`;
- Neuberechnung bei Reise-/Route-/Zeit-/Credential-Änderungen;
- deduplizierte, statusbewusste Notifications;
- harte Warnungen nur aus belastbarer, aktueller Official Evidence;
- offizielle Antragsseiten müssen von Informations- und Drittanbieterlinks unterscheidbar sein.

Diese Target Architecture ist **kein automatischer Runtime-Auftrag**.

Issue #294 bleibt als persistenter Architektur-Tracker offen.

## 9. GitHub Governance

Ruleset:

- ID `21875372`
- `Jetnity main protection`
- active
- bypass leer
- PR required
- Conversation Resolution required
- merge-only
- strict Checks:
  - `Typecheck, Lint & Build`
  - `Auth-Konfiguration gegen config.toml`
  - `Vercel`

Der Draft→Ready-Connectorfehler ist kein Grund, diese Regeln zu lockern.

## 10. Supabase Boundary

S4-R1 hat Supabase nicht mutiert.

Letzter bekannter Requirements-Gate-0-Stand:

- Production `qscbgcdmivbbnzrcyegn`: `ACTIVE_HEALTHY`.
- Development `yfvbxvijcorffwxbxahl`: `ACTIVE_HEALTHY`.
- Development-vs-Production-Migration-History weist Drift auf.

Vor jedem migrationsnahen / DB-/RLS-/Storage-/Security-Slice live erneut prüfen und reconciliieren.

## 11. Agent / Continuity

Letzter Agent:

**`Jetnity requirements truth ops 1`**  
Generation: **1**  
Session: `bc-49df8304-48ed-4820-bdf4-57f53aa1aaee`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS**.

Es läuft nach diesem Closure **kein automatisch gestarteter Runtime-Folgeslice**.

## 12. FIRST NEXT ACTION

Vor jeder weiteren Runtime-Arbeit:

1. finalen `main` nach diesem Continuity-PR live lesen;
2. offene PRs/Issues und aktuelle CI/Vercel-Evidence prüfen;
3. `docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md` gegen den aktuellen Code lesen;
4. Supabase nur bei betroffenem Scope live prüfen;
5. den kleinsten verantwortbaren bounded Slice definieren;
6. Providerwahl, Vertrag/DPA, Secrets/API Keys, paid calls, sensitive Daten und Production-Aktivierung weiterhin als Product-Owner-Gates behandeln.

**Kein automatischer Folgeslice. Live-Evidence gewinnt immer.**
