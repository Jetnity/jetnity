# Explicit Visit History 1 – Handoff

Stand: 17. September 2026 (Guardian-Governance-`main` integriert, neu gegatet)

Status: **NICHT READY / REVIEW-BEFUNDE BEHOBEN / DEVELOPMENT LIVE VERIFIZIERT / STOP FÜR TECHNICAL-LEAD-RE-REVIEW**

Verbindliche Aufgabe: `docs/EXPLICIT_VISIT_HISTORY_1_TASK_2026-09-17.md`
Issue: #445 · Direktive: #441 · Draft-PR: #448

Agent: `Jetnity explicit visit history 1`, Generation 1, Claude Opus 5 High.
Session: `bc-ba47e289-5ac8-49c4-857e-ba1b37d5784f`.

---

## 1. Git

| | |
| --- | --- |
| Branch | `feat/phase-1-explicit-visit-history-1` |
| Kanonische Basis | `main@69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6` |
| Geprüfter Head Runde 1 | `a372f2152f21ab7b57b488b0dab66ca8d43a1813` |
| Geprüfter Head Runde 2 | `91c93be9fed77499b89ccde53d7090b95b9f728b` |
| Geprüfter Head Runde 3 | `f984faa1bfb0d31cee998718c5900ccf0b28ae42` |
| Integriertes `main` | `5b5cc403990e378854a8cbcd69fb7591e656e71a` (Guardian Governance 1, #451) |
| Merge-Base gegen `origin/main` | `5b5cc403990e378854a8cbcd69fb7591e656e71a` |
| Ahead / Behind | 16 / 0 (Stand des letzten Commits dieser Kette) |
| Drift | **keine** – 0 behind |

### Warum Merge und nicht Rebase

Der Auftrag nennt einen sauberen Rebase als bevorzugt, „if safe“. Er ist hier
nicht sicher, aus drei Gründen:

1. **Die Prüfkette hängt an Heads.** Der Technical Lead hat `a372f215`,
   `91c93be9` und `f984faa1` einzeln geprüft und in diesem PR mit SHA zitiert.
   Ein Rebase schreibt jeden Commit neu; diese drei wären keine Vorfahren des
   Branches mehr, und der Vergleich „was hat sich seit dem geprüften Head
   geändert“ verlöre seine Basis. Genau diesen Vergleich braucht jede Runde.
2. **Der Verlauf enthält bereits einen Merge** (`6074f4d5`, Integration von
   `main@cfcb6b5b`). Ein linearer Rebase wäre nicht „clean“, sondern müsste ihn
   plattdrücken oder mit `--rebase-merges` nachbilden.
3. **Rebase verlangt einen Force-Push**, den der Operating Standard ohne
   ausdrückliche Anweisung untersagt.

Der Merge war seinerseits risikofrei: `main` hat vier Governance-Dokumente
hinzugefügt, mein Branch berührt keines davon, und die Probe vor dem Merge
meldete null Konflikte.

### Was der Merge gebracht hat

Ausschliesslich die vier Guardian-Dateien aus `main`, unverändert übernommen:
`JETNITY_START_HERE.md`, `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`,
`docs/JETNITY_GUARDIAN_GOVERNANCE_1_STATUS_HANDOFF_2026-09-17.md` und
`docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`. Keine
Slice-Datei hat sich dadurch geändert, und keine Guardian-Datei ist
zurückgenommen worden – sie sind byte-identisch mit `origin/main`.

Der neue Standard ändert an dieser Etappe nichts: er regelt die Rolle des
Guardian, nicht die eines Cursor-Agenten, und führt kein neues Gate ein.

## 2. Runde 3: die erzeugten Typen

Der Technical Lead hat den Head `91c93be9` geprüft, die vier Befunde aus Runde 1
als behoben bestätigt und die Migration auf Supabase **Development** angewendet
und live verifiziert. Ein Punkt blieb offen: `types/supabase.ts` war von Hand
vorweggenommen und nicht generator-genau. Der echte Generator gibt zwei
Funktionen aus, die in der Handfassung fehlten:

- `account_visit_pruefen` – mit dem Rückgabetyp der Tabellenzeile und
  `SetofOptions`, obwohl sie für keine PostgREST-Rolle ausführbar ist;
- `ist_katalogland`.

**Behoben.** Beide sind generator-genau nachgetragen, unbeteiligte Bereiche der
Datei blieben unangetastet. Zusätzlich prüft jetzt ein Test, dass jede Funktion
der Migration, die kein Trigger ist, in den erzeugten Typen steht – die Lücke
wäre damit aufgefallen.

Der Cursor-Agent hat in dieser Runde **keine** Migration angewendet und
**kein** Supabase-Projekt verändert.

## 3. Die vier Befunde aus Runde 1

| # | Befund | Endzustand |
| --- | --- | --- |
| 1 | Schreibvertrag über direkte Tabellenrechte umgehbar | `authenticated` hat nur `SELECT`; geschrieben wird über drei `SECURITY DEFINER`-Funktionen; der gemeinsame Kern ist für niemanden ausführbar |
| 2 | Landtreffer der Ortssuche wurde ein gefälschter „Ort“ | Der Vertrag führt `typ='country'` auf die Landesidentität zurück: kein `place_id`, kein Label, keine Koordinaten, Ländercode aus der Referenz |
| 3 | Ersatzmarke trennte `besucht` und `beides` nicht | Drei Formen: Ring, gestrichelter Ring, Doppelring – und sie liegen jetzt in der Ortsmarken-Ebene, weil sie in der Kartengrafik auf 390 px unsichtbar waren |
| 4 | Lokale Evidenz bildete die Supabase-ACL nicht ab | Migration entzieht jeder Rolle einzeln inklusive `service_role`; das Bootstrap bildet die Voreinstellung nach und prüft im ersten Fall, dass sie wirksam ist |
| 5 | `origin/main` integrieren, 0 behind | Merge durchgeführt, alle Gates danach erneut gelaufen |

Die ausführliche Begründung je Befund steht in
`docs/EXPLICIT_VISIT_HISTORY_1_STATUS_2026-09-17.md`, Abschnitt „Review-Runde 1“.

Befund 4 ist inzwischen live bestätigt: auf Development hat `service_role` auf
dieser Tabelle kein Recht, obwohl Supabase neu angelegten Tabellen von sich aus
welche mitgibt. Die vollständige Messung steht in Abschnitt 7.

## 4. Geänderte Dateien

**Seit Head `f984faa1` (Integrationslauf)**

- nur der Merge von `main@5b5cc403` und diese Fortschreibung. Keine
  Slice-Datei, keine Migration, kein Typ, kein Test geändert.

**Seit Head `91c93be9` (Runde 3)**

- `types/supabase.ts` – `account_visit_pruefen` und `ist_katalogland`
  generator-genau ergänzt
- `lib/account/besuche.test.ts` – Test gegen künftige Typlücken
- STATUS, HANDOFF, SELF_REVIEW, MIGRATION_EVIDENZ

**Datenbank (Runde 2, inzwischen auf Development angewendet)**

- `supabase/migrations/20260917120000_account_visits.sql` – in Runde 2
  überarbeitet statt ergänzt, weil sie damals nirgends angewendet war. Seither
  ist sie auf Development angewendet; sie darf **nicht erneut** angewendet und
  nicht mehr verändert werden. Gegen die geprüften Heads `91c93be9` und
  `f984faa1` ist sie byte-identisch (`git diff` leer, sha256 `bdaa9d67bf34…`).
- `types/supabase.ts` – Tabelle und fünf Funktionen

**Anwendung**

- `lib/account/besuche-aktionen.ts` – ruft nur noch den Vertrag; kein `.from(…)`
- `lib/account/besuche-copy.ts` – Hinweis zum Landtreffer
- `lib/account/world-map-ansicht.ts` – `weltPunktLage`
- `components/account/WeltZustaende.tsx` – `WeltPunktMarken` in der
  Ortsmarken-Ebene, drei Formen, Probe mit Punktform
- `components/account/AccountWeltKarte.tsx` – Marken vor den Ortsmarken
- `components/account/AccountAuditClient.tsx` – Server-Komponente, Fixtures für
  alle drei Punktformen
- `app/(public)/ui-audit/account/page.tsx` – `searchParams` serverseitig

**Werkzeuge und Tests**

- `scripts/db/besuche-rls-lokal-bootstrap.sql` – Supabase-Default-Privilegien,
  Kontrolltabelle, erweiterte Ortsreferenz
- `scripts/db/besuche-rls-lokal.mjs` – 41 Nachweise, davon neun adversarisch
- `scripts/kartografie/besuchshistorie-belege.mjs` – Formmessung und drei Lupen
- `lib/account/besuche.test.ts`, `lib/account/welt-laender.test.ts`

**Dokumentation**

- STATUS, HANDOFF, SELF_REVIEW, MIGRATION_EVIDENZ, VISUAL_EVIDENCE
- `docs/evidence/explicit-visit-history-1/` – 14 Bilder, 3 Lupen, ein Messbericht

## 5. Gates

| Gate | Ergebnis |
| --- | --- |
| `npm test` | 3309 / 0 Fehler |
| `npx tsc --noEmit -p tsconfig.json` | grün |
| `npm run lint` | 0 Fehler, 139 Warnungen (bestehend) |
| `npm run build` | grün |
| `npm run check:dead` | grün |
| `npm run check:exports` | grün |
| `npm run check:deps` | grün |
| `npm run check:api-schutz` | grün |
| `npm run check:schema-bezug` | grün (22 Tabellen/Views, 25 Funktionen) |
| `npm run audit:account` | 48/48 (WebKit + Chromium, 6 Breiten) |
| `npm run db:besuche-lokal` | 41/41 gegen lokale PostgreSQL 16 |
| `node scripts/kartografie/weltkarte-geometrie.mjs --pruefen` | beide Dateien aktuell |
| `node scripts/kartografie/besuchshistorie-belege.mjs` | 14 Belege + 3 Lupen, `ok: true` |
| Supabase Development | vom Technical Lead angewendet und verifiziert – siehe 7 |
| `db:anwenden`, `db:rls`, `db:rechte`, `db:sicherheit`, `db:advisors`, `db:typen`, `auth:pruefen` | vom Agenten **nicht** ausführbar (Token 401); die Live-Prüfung hat der Technical Lead vorgenommen |
| Exact-Head-CI | siehe 9 |
| Exact-Head-Vercel-Preview | siehe 9 |

## 6. Sichtbelege

390 px und ≥ 1280 px je Zustand: leer, besucht, geplant, überlagert, Land ohne
zeichenbare Fläche in allen drei Zuständen, Lesefehler, Hinzufügen, Bearbeiten,
Widerrufen. Dazu drei Vergrösserungen für die Ersatzmarken.

Gemessen über alle 14 Aufnahmen: 0 fremde Herkünfte, 0 horizontaler Überlauf,
0 Konsolen- und Seitenfehler, kleinste Bedienfläche 44 px, 153 Farben im
Fenster über einer Landesgrenze unter einer Füllung, drei verschiedene
Formnamen für die drei Zustände.

Einzelheiten: `docs/EXPLICIT_VISIT_HISTORY_1_VISUAL_EVIDENCE_2026-09-17.md`.

## 7. Live-Stand Supabase Development

Angewendet und gemessen vom **Technical Lead**. Migrationshistorie exakt auf die
Repository-Fassung normalisiert (`20260917120000 account_visits`).
**Nicht erneut anwenden.**

| Gemessen | Ergebnis |
| --- | --- |
| RLS auf `public.account_visits` | aktiv |
| Policies | genau eine: `account_visits_lesen`, `USING user_id = auth.uid()`, `authenticated` |
| Tabellenrechte | `authenticated` nur `SELECT`; `anon` keine; `service_role` keine |
| `EXECUTE` auf den drei Schreib-RPCs | nur `postgres` und `authenticated` |
| `EXECUTE` auf `account_visit_pruefen` | nur `postgres` |
| Zeilen | 0 |
| Production | unverändert – `public.account_visits` und `account_visit_bestaetigen(...)` fehlen dort |

**Security Advisors:** geprüft. Zwei Arten von Hinweisen, beide gewollt: der
allgemeine Hinweis auf GraphQL-Sichtbarkeit für die angemeldete Rolle und
`SECURITY DEFINER`-Hinweise für die drei absichtlich exponierten, an
`auth.uid()` gebundenen Schreib-RPCs. Kein Hinweis auf fehlendes RLS, keiner auf
einen anon-Schreibweg. Ausdrücklich **keine** Zusage „null Warnungen“.

Ergänzend und davon unabhängig misst `npm run db:besuche-lokal` (41/41) das
Verhalten unter Angriff: direkte Schreibversuche als `authenticated` gegen eine
lokale PostgreSQL, die die Supabase-Voreinstellung nachbildet und ihre eigene
Voraussetzung mitprüft.

## 8. Was der Technical Lead entscheiden muss

1. Ob die generator-genau nachgetragenen Typeinträge dem entsprechen, was der
   Generator gegen Development ausgibt.
2. Ob `SECURITY DEFINER` für die drei Schreibfunktionen der gewünschte Weg ist
   (Self-Review 2.2 nennt die Gegenmassnahmen).
3. Ob der Länderkatalog in der Datenbank als Funktion bleibt oder eine
   Katalogtabelle werden soll (Self-Review 2.3).
4. Ob der Landtreffer zurückgeführt oder in der Ortssuche ausgeschlossen werden
   soll; gewählt ist die Rückführung (Self-Review 3.1).
5. Die aus Runde 1 offenen Punkte: Beschriftungspunkte für Kleinstaaten,
   `suppressHydrationWarning` in `LandFeld`, kräftigere Grenzlinien.
6. Ob ein Real-Device-Test verlangt wird; er hat nicht stattgefunden.
7. Produktionsmigration – ausdrücklich nicht Teil dieser Etappe.

## 9. Exakter Endstand

### Integrations-Head

`8ab32b16df374e62cd5697f60f9b0231dba0f7fe`

Der Merge von `main@5b5cc403`. Er enthält keine Slice-Änderung; alle Gates
dieses Dokuments sind auf diesem Stand gelaufen.

### Dokumentations-Head

Darauf folgt genau ein weiterer Commit. Er enthält **keinen Code**: diese
Fortschreibung. Er erzeugt einen eigenen CI-Lauf und einen eigenen
Vercel-Preview; dieser Lauf ist der Exact-Head-Stand für das Re-Review und in
PR #448 sichtbar.

### Historie dieser Kette

| Head | Rolle | CI |
| --- | --- | --- |
| `a372f215` | Runde 1, vom Technical Lead geprüft | success (`35200088971`) |
| `91c93be9` | Runde 2, vier Befunde behoben, `main@cfcb6b5b` integriert, vom Technical Lead geprüft; Development angewendet und verifiziert | success (`35207927525` / #1774), Vercel `dpl_5wPgjo7NKiTe5DQdGS2mdW68Y7Fx` Ready |
| `f984faa1` | Runde 3, erzeugte Typen generator-genau abgeglichen, vom Technical Lead geprüft | success (`35210820658`) |
| `8ab32b16` | Integration von `main@5b5cc403` (Guardian Governance 1) | siehe PR #448 |

Jeder dieser Heads ist weiterhin Vorfahr des Branches und damit für einen
Vergleich erreichbar.

### Drift

Keine. `origin/main` steht nach erneutem Fetch auf
`5b5cc403990e378854a8cbcd69fb7591e656e71a`, und das ist zugleich die
Merge-Base: **0 behind**. Kein Rebase, kein Force-Push; jeder zuvor geprüfte
Head bleibt in der Historie auffindbar.

---

**Kein Ready. Kein Merge. Keine Produktionsmigration. Keine Folgeetappe.**
Endzustand: **STOP FÜR TECHNICAL-LEAD-REVIEW**.
