# Jetnity Guardian Governance 1 – Status, Handoff und Evidence

Stand: 17. September 2026  
Slice: **Jetnity Guardian governance 1**, Generation 1  
Status: **DOCS-/GOVERNANCE-SLICE IMPLEMENTIERT / DRAFT / WARTET AUF UNABHÄNGIGEN TECHNICAL-LEAD-REVIEW**

> **LIVE-EVIDENCE WINS.** Alle Zustandsangaben in diesem Dokument sind Evidence ihres genannten Zeitpunkts und ihres genannten Exact Head. Sie sind keine zeitlose Wahrheit. Jeder neue Head invalidiert die hier festgehaltene Exact-Head-Evidence. Wer diesen Slice weiterführt, reviewt oder integriert, rekonstruiert `main`, PR-Heads, CI, Preview und offene Arbeit zuerst live.

## 1. Auftrag

Issue: **#450**  
Draft-PR: **#451**  
Branch: `docs/grok-bot-governance-1`  
Baseline laut Auftrag: `main@cfcb6b5ba12bef2383782e5d27e968b23d446b04`

Ziel: die vom Product Owner verbindlich gemachte Jetnity-Guardian-/Grok-Bot-Rolle dauerhaft in die kanonische Repository-Governance integrieren – als reiner Docs-/Governance-Slice, ohne Runtime-, DB-, Provider-, Kosten- oder Production-Wirkung und ohne Aktivierung des Guardian.

## 2. Umgesetzt

1. `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md` – kanonischer Guardian-/Grok-Bot-Standard (Release / QA / Continuity Operator, Autoritätskette, Startup Contract, Live-Evidence-/Exact-Head-Regel, Observer-first/Least-Privilege-Capability-Scope, harte Verbote, Repository-Mutationsgrenze, Verhältnis zu Cursor-Agenten, Pflichtberichtsformat, Continuity-Verantwortung, PASS-/Ready-/Merge-Grenze, Aktivierungsregel). Bereits mit dem ersten Branch-Commit `9c21231b1975a9d135e19f28d512b9878f925448` vorhanden; in dieser Runde inhaltlich unverändert, weil er den verbindlichen Product-Owner-Contract vollständig abdeckt.

2. `JETNITY_START_HERE.md`
   - Der Guardian-Standard ist als Punkt `1a` der Pflichtlektüre aufgenommen, direkt hinter dem Technical-Lead-/Cursor-Standard, und damit Startup-Pflicht für künftige Technical Leads, Guardian-Läufe und Agenten, deren Arbeit Guardian-Evidence berührt.
   - Brittle Current-State-Behauptungen sind entfernt bzw. umgerahmt: `NO ACTIVE CURSOR AGENT` ist aus dem Statuskopf und aus der Schlusszeile verschwunden, und Abschnitt 8 behauptet keinen momentanen Arbeitsstand mehr.
   - Statt einer gespeicherten Liste aktiver Arbeit verlangt Abschnitt 8 die Live-Rekonstruktion von PRs, Branches, Heads, Reviews, Exact-Head-CI/Preview und zugehörigem Task/Handoff. Fehlt diese Prüfung, gilt der Arbeitsstand ausdrücklich als **unbekannt**, nicht als leer (`unknown ≠ nichts aktiv`).
   - Neuer Vorspann und neue Ergänzung nach der Leseliste halten fest, dass dieses Dokument für geschlossene Wahrheiten, Grenzen und Gates verbindlich ist, aber niemals Quelle des momentanen Arbeitsstands, und dass gespeicherter Text bei Widerspruch gegen Live-Evidence verliert und danach korrigiert wird.
   - Abschnitt 11 erhält Punkt 10: Guardian-Befunde sind Evidence/Input für den Technical Lead, niemals ein Technical-Lead-`PASS`; der Guardian setzt niemals Ready und merged niemals.

3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
   - neuer Abschnitt 10 `Guardian / Grok Bot – verbindliche Rollengrenze` mit Verweis auf den Guardian-Standard, dem Default-Modus `READ-ONLY / OBSERVER` / `WAITING FOR TECHNICAL-LEAD ACTIVATION`, der Least-Privilege-/Aktivierungsregel (Baseline höchstens GitHub/CI read-only; Vercel und weitere Systeme nur nach separater Verbindung und Freigabe) und acht bindenden Regeln für den Technical Lead: Guardian-Befunde sind Evidence und nie PASS, sie dürfen nicht als eigener Review zusammengefasst werden, unvollständige Berichte sind keine Gate-Evidence, neue Heads invalidieren Guardian-Exact-Head-Evidence, Live-Evidence schlägt Statusdokumente ohne Guardian-Eigenkorrektur, Repository-/Code-Arbeit nur mit explizit versioniertem Auftrag und anschließendem unabhängigen Review, kein Übernehmen/Starten/Unterbrechen von Slices oder Agenten, und die vollständige Liste harter Verbote.
   - Abschnitt 10 stellt ausdrücklich fest, dass die exklusive Technical-Lead-Autorität aus Abschnitt 2 und die besonderen Product-Owner-Gates aus Abschnitt 3 unverändert bleiben und durch die Guardian-Rolle weder erweitert noch still gelockert werden.
   - Vorrang (jetzt Abschnitt 11) nimmt den Guardian-Standard als Rang 5 auf, unterhalb der Product-Owner-Gates und unterhalb dieses Dokuments, passend zur Autoritätskette im Guardian-Standard selbst.
   - Kopf-Metadaten mit `Ergänzt: 17. September 2026` versehen; Merksatz (jetzt Abschnitt 12) nennt die Guardian-Rolle read-only. Die vorherigen Abschnitte 10/11 sind unverändert zu 11/12 verschoben; kein anderes Repository-Dokument referenziert diese Abschnittsnummern.

4. dieses Dokument als slice-spezifische Status-/Handoff-/Evidence-Persistenz.

## 3. Geänderte Dateien

Gegen `origin/main` verändert dieser Branch ausschließlich:

- `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md` (neu, erster Branch-Commit)
- `JETNITY_START_HERE.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_GUARDIAN_GOVERNANCE_1_STATUS_HANDOFF_2026-09-17.md` (neu)

Nur Markdown. Keine Datei unter `app/`, `components/`, `lib/`, `types/`, `supabase/`, `scripts/`, `.github/`, kein `package.json`/Lockfile, keine Vercel-/CI-/Environment-Konfiguration, keine Migration, kein Provider-, Payment-, Secret- oder Production-Artefakt.

## 4. Kollisionsgrenze – geprüft und eingehalten

Nicht verändert, wie im Auftrag verlangt:

- `docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md` – aktives Ownership von PR #435;
- account-/map-/visit-history-Runtime und die Slice-Dokumente von PR #448;
- jegliche Runtime-, DB-, Supabase-, Dependency-, CI-, Vercel-, Provider-, Payment-, Secret- oder Production-Fläche.

Ein während der Umsetzung im Working Tree vorgefundener Next.js-Dev-Artefakt-Diff in `next-env.d.ts` (aus dem Environment-Start, nicht aus diesem Slice) wurde verworfen und ist nicht Teil des Branches.

## 5. Exact-Head-Evidence, 17. September 2026, ca. 10:30 UTC

| Gegenstand | Exact Wert |
| --- | --- |
| `origin/main` | `cfcb6b5ba12bef2383782e5d27e968b23d446b04` |
| Merge-Base `HEAD`/`origin/main` | `cfcb6b5ba12bef2383782e5d27e968b23d446b04` |
| Drift vor dem Docs-Commit | 1 ahead / 0 behind |
| PR #451 Head vor dem Docs-Commit | `9c21231b1975a9d135e19f28d512b9878f925448` |
| PR #451 Zustand | `DRAFT`, `MERGEABLE`, `mergeStateStatus=CLEAN`, kein Review-Verdict |

CI und Preview auf Head `9c21231b1975a9d135e19f28d512b9878f925448`, automatisch über die bestehende Git-Integration ausgelöst:

- GitHub Actions `CI`, Run `35210455520`: **SUCCESS** (`Typecheck, Lint & Build` und `Auth-Konfiguration gegen config.toml`);
- Vercel Preview-Status: **SUCCESS**, Deployment-Inspektion `4ZH5zmpW7yASxY3CahyYfstUgdGh`, Preview-Host `jetnity-app-git-docs-grok-bot-governance-1-jetnity-e1b93c82.vercel.app`, laut PR-Kommentar `Ready`.

Kein Deployment wurde manuell ausgelöst, kein Vercel-Objekt mutiert, keine Vercel-Konfiguration verändert.

Exakter Inhaltshead dieses Slices nach den drei Commits dieser Runde:

`aa4f5bed76263dff236955209e478d649eb559dd`

Automatisch über die Git-Integration ausgelöste Evidence auf genau diesem Head:

- `origin/main` beim Push weiterhin `cfcb6b5ba12bef2383782e5d27e968b23d446b04`, Merge-Base identisch, 4 ahead / 0 behind;
- GitHub Actions `CI`, Run `35211147716`: **SUCCESS** (`Typecheck, Lint & Build` und `Auth-Konfiguration gegen config.toml`);
- Vercel Preview-Status: **SUCCESS**, Deployment-Inspektion `BRyPRvckvpXkUJ5n9aYZjNUzZz4T`;
- PR #451 bleibt `DRAFT`, ohne Review-Verdict.

Der Commit, der diese Evidence festhält, erzeugt selbst einen weiteren Head. Für diesen letzten Head laufen CI und Preview erneut automatisch; der Technical Lead liest sie live und behandelt kein Gate als grün, bevor er das getan hat. Jede in diesem Dokument genannte Exact-Head-Evidence gilt ausschließlich für den jeweils genannten SHA.

## 6. Lokale Gates

Ausgeführt auf dem Arbeitsstand dieses Slices, 17. September 2026:

- `npm run typecheck`: **PASS** (Exit 0)
- `npm run lint`: **PASS** (Exit 0; 138 Probleme, davon 0 Fehler und 138 bereits vorher bestehende Warnungen in Runtime-Dateien, die dieser Slice nicht berührt)
- `npm test`: **PASS** (3240 Tests, 572 Suites, 0 Fehlschläge)
- `npm run check:dead`: **PASS** (1 begründet verwaiste Datei, `components/layout/CookieConsent.tsx`, unverändert)
- `npm run check:exports`: **PASS** (815 Dateien, 0 Exporte ohne Aufrufer)
- `npm run check:deps`: **PASS**
- `npm run check:api-schutz`: **PASS** (12 Admin-Routen, alle mit `requireAdminApi()`)
- `npm run check:schema-bezug`: **PASS**

Kein Gate hat sich selbst wegen eines fehlenden Secrets übersprungen.

Nicht ausgeführt und nicht behauptet: Production-Build gegen Production-Umgebung, `db:rechte`, `db:rls`, `db:sicherheit`, `auth:pruefen` gegen Live-Supabase sowie jede Real-Device-Prüfung. Dieser Slice verändert weder Datenbank noch Anmeldung noch Runtime; der Production-Build läuft in CI über `Typecheck, Lint & Build`.

## 7. Live-Arbeitsstand als Zeitpunkt-Evidence

Ausdrücklich nur Evidence vom 17. September 2026, ca. 10:30 UTC, ausdrücklich **nicht** als dauerhafte Wahrheit im Repository verankert:

- offene Draft-PRs mit aktiver Arbeit: **#435** `Phase 1 Assistant Runtime 1`, Head `0be696c713950c5062bf27f5850f42a50478d082`; **#448** `Explicit Visit History 1`, Head `91c93be9fed77499b89ccde53d7090b95b9f728b`; **#451** dieser Slice;
- zusätzlich offen, aber alt und nicht als aktive Arbeit dieses Zeitpunkts geprüft: #52, #50, #40, #39, #28;
- `main`-CI Run `35200659291` auf `cfcb6b5b...`: **SUCCESS**.

Daraus folgt der wichtigste Continuity-Befund dieses Slices: die Behauptung „kein aktiver Cursor-Agent / kein aktiver Slice“ war zum Zeitpunkt der Umsetzung durch Live-Evidence widerlegt. Genau diese Klasse gespeicherter Behauptungen wurde in `JETNITY_START_HERE.md` beseitigt.

## 8. Befunde und Empfehlungen für den Technical Lead

1. **Behoben in diesem Slice:** `JETNITY_START_HERE.md` behauptete `NO ACTIVE CURSOR AGENT` und `No active implementation slice`, während mindestens #435 und #448 offen waren. Die Datei verlangt jetzt Live-Rekonstruktion und behandelt fehlende Prüfung als `unknown`.

2. **Offen, bewusst nicht angefasst:** `JETNITY_HANDOFF.md` trägt im Statuskopf weiterhin `NO ACTIVE CURSOR AGENT`. Die Datei stand nicht im Auftrag dieses Slices, gehört aber zur gleichen Fehlerklasse. Empfehlung: in einem eigenen kleinen Docs-Slice gleich umrahmen, damit nicht ein zweites Dokument stale Current-State als Wahrheit ausgibt.

3. **Offen, durch Kollisionsgrenze gesperrt:** `docs/ACTIVE_WORK_STATUS.md` trägt ebenfalls `NO ACTIVE CURSOR AGENT`. Diese Datei ist #435-Ownership und wurde deshalb nicht verändert. Empfehlung: nach Integration von #435 durch den Technical Lead oder einen ausdrücklich beauftragten Slice nachziehen. Als Live-Statusdatei sollte sie den aktuellen Stand tragen oder ihn ausdrücklich als zeitpunktgebunden kennzeichnen.

4. **Absichtlich unverändert:** Historische Checkpoints (`docs/CHATGPT_*_CLOSED_*.md`, `docs/CHATGPT_NEW_CHAT_CHECKPOINT_*.md`) enthalten dieselbe Formulierung als Evidence ihres Zeitpunkts. Das ist korrekt und wurde nicht umgeschrieben.

5. **Governance-Prüfung:** Abschnitt 2 (exklusive Merge-Autorität) und Abschnitt 3 (besondere Product-Owner-Gates) des Technical-Lead-Standards sind wörtlich unverändert. Der neue Abschnitt 10 fügt ausschließlich Beschränkungen für den Guardian hinzu und bestätigt beide Abschnitte ausdrücklich. Die Gates A–E und die Traveller-/Truth-Regeln in `JETNITY_START_HERE.md` sind inhaltlich unverändert.

## 9. Guardian-Zustand nach Repository-Integration

Auch nach einem späteren Merge dieses PRs bleibt der Guardian:

> **READ-ONLY / OBSERVER**  
> **WAITING FOR TECHNICAL-LEAD ACTIVATION**

Die Integration des Standards ist ausdrücklich **keine** Aktivierung, keine Rechteerweiterung, keine Systemverbindung und kein Auftrag. Aktivierung, Capability-Scope und jede Verbindung über GitHub-/CI-Read-only hinaus – insbesondere Vercel – erfordern eine separate, ausdrückliche, system- und aufgabenspezifische Freigabe.

## 10. Nicht getan

- kein Ready;
- kein Merge;
- keine Guardian-Aktivierung;
- kein Follow-up-Slice, kein weiterer Branch, kein weiterer PR, kein weiterer Agent;
- kein manuelles Deployment und keine Vercel-Mutation;
- keine Änderung an Datenbank, Supabase, RLS, Secrets, Providern, Payments, Kosten oder Production;
- keine Änderung an den kollisionsgesperrten Dateien;
- kein Product-Owner-Gate berührt.

## 11. Blocker

Technisch keine. Der Slice ist inhaltlich vollständig.

Offen ist ausschließlich das, was per Governance offen bleiben muss: der unabhängige Technical-Lead-Review auf dem **neuen** Exact Head samt neuer Exact-Head-CI-/Preview-Evidence sowie die Technical-Lead-eigene Ready-/Merge-Entscheidung.

## 12. Empfohlener nächster Schritt

1. neuen Exact Head von PR #451 live lesen;
2. vollständigen Diff gegen live `main` selbst prüfen, insbesondere ob Abschnitt 10 wirklich nur einschränkt und die Abschnitte 2 und 3 unverändert sind;
3. Exact-Head-CI und Exact-Head-Vercel-Preview auf dem neuen Head verifizieren;
4. Merge-Base/behind gegen live `main` neu bewerten;
5. Verdict setzen; bei `PASS` Technical-Lead-eigenes Ready/Merge mit SHA-Lock;
6. nach Merge `main`, Post-Merge-CI und Production-Deployment verifizieren und Continuity nachziehen;
7. erst danach entscheiden, ob die Befunde 2 und 3 aus Abschnitt 8 als eigener kleiner Docs-Slice bearbeitet werden;
8. eine Guardian-Aktivierung bleibt eine separate, ausdrücklich zu beauftragende Entscheidung.

**STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD-REVIEW. NICHT READY SETZEN. NICHT MERGEN. GUARDIAN NICHT AKTIVIEREN. KEINEN FOLLOW-UP-SLICE STARTEN.**
