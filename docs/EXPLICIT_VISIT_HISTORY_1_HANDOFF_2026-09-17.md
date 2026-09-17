# Explicit Visit History 1 – Handoff

Stand: 17. September 2026 (Review-Runde 1 eingearbeitet)

Status: **NICHT READY / REVIEW-BEFUNDE BEHOBEN / EIN GATE BLOCKIERT / STOP FÜR TECHNICAL-LEAD-REVIEW**

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
| Zuvor geprüfter Head | `a372f2152f21ab7b57b488b0dab66ca8d43a1813` |
| Integriertes `main` | `cfcb6b5ba12bef2383782e5d27e968b23d446b04` |
| Merge-Base gegen `origin/main` | `cfcb6b5ba12bef2383782e5d27e968b23d446b04` |
| Ahead / Behind | 12 / 0 (Stand des letzten Commits dieser Kette) |
| Drift | **keine** – 0 behind |

`main@cfcb6b5b` ist per **Merge** integriert. Kein Rebase, kein Force-Push: der
zuvor geprüfte Head bleibt in der Historie auffindbar. Der Zuwachs von `main`
war reine Dokumentation (V1 Account/Privacy/Ops Audit G2) und ohne Konflikt.

## 2. Die vier Befunde

| # | Befund | Endzustand |
| --- | --- | --- |
| 1 | Schreibvertrag über direkte Tabellenrechte umgehbar | `authenticated` hat nur `SELECT`; geschrieben wird über drei `SECURITY DEFINER`-Funktionen; der gemeinsame Kern ist für niemanden ausführbar |
| 2 | Landtreffer der Ortssuche wurde ein gefälschter „Ort“ | Der Vertrag führt `typ='country'` auf die Landesidentität zurück: kein `place_id`, kein Label, keine Koordinaten, Ländercode aus der Referenz |
| 3 | Ersatzmarke trennte `besucht` und `beides` nicht | Drei Formen: Ring, gestrichelter Ring, Doppelring – und sie liegen jetzt in der Ortsmarken-Ebene, weil sie in der Kartengrafik auf 390 px unsichtbar waren |
| 4 | Lokale Evidenz bildete die Supabase-ACL nicht ab | Migration entzieht jeder Rolle einzeln inklusive `service_role`; das Bootstrap bildet die Voreinstellung nach und prüft im ersten Fall, dass sie wirksam ist |
| 5 | `origin/main` integrieren, 0 behind | Merge durchgeführt, alle Gates danach erneut gelaufen |

Die ausführliche Begründung je Befund steht in
`docs/EXPLICIT_VISIT_HISTORY_1_STATUS_2026-09-17.md`, Abschnitt „Review-Runde 1“.

Über `service_role` wird ausdrücklich **nicht** behauptet, dass es auf
Development blockiert ist. Behauptet wird, dass die Migration den Entzug
ausspricht und dass er gegen die nachgebildete Voreinstellung nachweislich
wirkt. Die Abfragen für die Live-Prüfung stehen im Migrationsnachweis,
Abschnitt 5.

## 3. Geänderte Dateien seit dem geprüften Head

**Datenbank**

- `supabase/migrations/20260917120000_account_visits.sql` – überarbeitet, nicht
  ergänzt: die Datei ist nirgends angewendet, es bleibt eine additive Migration
- `types/supabase.ts` – drei Vertragsfunktionen ergänzt

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

## 4. Gates

| Gate | Ergebnis |
| --- | --- |
| `npm test` | 3308 / 0 Fehler |
| `npx tsc --noEmit -p tsconfig.json` | grün |
| `npm run lint` | 0 Fehler, 139 Warnungen (bestehend) |
| `npm run build` | grün |
| `npm run check:dead` | grün |
| `npm run check:exports` | grün |
| `npm run check:deps` | grün |
| `npm run check:api-schutz` | grün |
| `npm run check:schema-bezug` | grün (22 Tabellen/Views, 23 Funktionen) |
| `npm run audit:account` | 48/48 (WebKit + Chromium, 6 Breiten) |
| `npm run db:besuche-lokal` | 41/41 gegen lokale PostgreSQL 16 |
| `node scripts/kartografie/weltkarte-geometrie.mjs --pruefen` | beide Dateien aktuell |
| `node scripts/kartografie/besuchshistorie-belege.mjs` | 14 Belege + 3 Lupen, `ok: true` |
| `npm run db:anwenden` | **abgebrochen, HTTP 401** – siehe 6 |
| `db:rls`, `db:rechte`, `db:sicherheit`, `db:advisors`, `db:typen`, `auth:pruefen` | **nicht gelaufen**, dasselbe 401 |
| Exact-Head-CI | siehe 8 |
| Exact-Head-Vercel-Preview | siehe 8 |

## 5. Sichtbelege

390 px und ≥ 1280 px je Zustand: leer, besucht, geplant, überlagert, Land ohne
zeichenbare Fläche in allen drei Zuständen, Lesefehler, Hinzufügen, Bearbeiten,
Widerrufen. Dazu drei Vergrösserungen für die Ersatzmarken.

Gemessen über alle 14 Aufnahmen: 0 fremde Herkünfte, 0 horizontaler Überlauf,
0 Konsolen- und Seitenfehler, kleinste Bedienfläche 44 px, 153 Farben im
Fenster über einer Landesgrenze unter einer Füllung, drei verschiedene
Formnamen für die drei Zustände.

Einzelheiten: `docs/EXPLICIT_VISIT_HISTORY_1_VISUAL_EVIDENCE_2026-09-17.md`.

## 6. Das blockierte Gate

`SUPABASE_ACCESS_TOKEN` wird vom Supabase-Management-API mit HTTP 401
abgewiesen. Folge:

- die Migration ist **nicht** auf Development angewendet;
- Live-Schema, Live-RLS, Policies, Grants, Advisors und `auth:pruefen` sind
  **nicht** geprüft;
- `types/supabase.ts` trägt Tabelle und Funktionen von Hand in Generatorform
  und muss nach dem Anwenden mit `npm run db:typen` ersetzt werden.

Production wurde **nicht** berührt.

Ersatzweise liegt der isolierte Lauf gegen eine lokal aufgesetzte
PostgreSQL 16 vor (41/41), der dieselbe Migrationsdatei anwendet, die
Supabase-Voreinstellung nachbildet und seine eigene Voraussetzung mitprüft.

## 7. Was der Technical Lead entscheiden muss

1. Migration auf Development anwenden, danach die Prüfungen und die drei
   ACL-Abfragen aus dem Migrationsnachweis, Abschnitt 5; `types/supabase.ts`
   neu erzeugen und den Diff gegenlesen.
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

## 8. Exakter Endstand

### Code-Head

`4a939d811aa2110161b4e4865c2e378c1f60e24a`

Letzter Commit mit Code, Migration, Tests, Werkzeugen und Belegen. Sein Gating
ist vollständig:

| Prüfung | Ergebnis am Head `4a939d81` |
| --- | --- |
| GitHub Actions, Lauf `35207604693` | **success** |
| „Typecheck, Lint & Build“ | pass (2m33s) |
| „Auth-Konfiguration gegen config.toml“ | pass (25s) |
| Vercel Preview `GeENU49QXYPS8LyVefy8icK2LPTg` | **Ready** |

### Dokumentations-Head

Darauf folgt genau ein weiterer Commit. Er enthält **keinen Code**: diesen
Abschnitt. Er erzeugt einen eigenen CI-Lauf und einen eigenen Vercel-Preview;
dieser Lauf ist der Exact-Head-Stand für das Review und in PR #448 sichtbar.

### Historie dieser Kette

| Head | Rolle | CI |
| --- | --- | --- |
| `a372f215` | Runde 1, vom Technical Lead geprüft | success (`35200088971`) |
| `4a939d81` | Runde 2, Befunde behoben, `main` integriert | success (`35207604693`) |

### Drift

Keine. `origin/main` steht nach erneutem Fetch auf
`cfcb6b5ba12bef2383782e5d27e968b23d446b04`, und das ist zugleich die
Merge-Base: **0 behind**. Kein Rebase, kein Force-Push.

---

**Kein Ready. Kein Merge. Keine Produktionsmigration. Keine Folgeetappe.**
Endzustand: **STOP FÜR TECHNICAL-LEAD-REVIEW**.
