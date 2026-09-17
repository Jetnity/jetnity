# Explicit Visit History 1 – Handoff

Stand: 17. September 2026

Status: **NICHT READY / IMPLEMENTIERT / EIN GATE BLOCKIERT / STOP FÜR TECHNICAL-LEAD-REVIEW**

Verbindliche Aufgabe: `docs/EXPLICIT_VISIT_HISTORY_1_TASK_2026-09-17.md`
Issue: #445 · Direktive: #441 · Draft-PR: #448

Agent: `Jetnity explicit visit history 1`, Generation 1, Claude Opus 5 High.

---

## 1. Git

| | |
| --- | --- |
| Branch | `feat/phase-1-explicit-visit-history-1` |
| Kanonische Basis | `main@69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6` |
| Merge-Base gegen `origin/main` | `69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6` |
| `origin/main` nach erneutem Fetch | `69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6` |
| Ahead / Behind | 8 / 0 (Stand des letzten Commits dieser Kette) |
| Drift gegenüber der kanonischen Basis | **keine** – Merge-Base und `origin/main` sind derselbe Commit |

Die Basis hat sich seit der Beauftragung nicht bewegt. Der Branch ist ein reiner
Vorlauf ohne Merge und ohne Rebase.

## 2. Was diese Etappe liefert

Die Account-Weltkarte trägt zwei getrennte Wahrheiten: **bestätigt besucht** und
**in Jetnity geplant**. Besucht entsteht ausschliesslich durch eine
ausdrückliche Bestätigung des Kontoinhabers, auch für Reisen von lange vor
Jetnity. Keine Reise, kein vergangenes Datum, kein Archivstand und kein
Buchungszustand erzeugt einen Besuch.

Der vollständige Umfang steht in
`docs/EXPLICIT_VISIT_HISTORY_1_STATUS_2026-09-17.md`.

## 3. Geänderte Dateien

**Datenbank**

- `supabase/migrations/20260917120000_account_visits.sql` (neu, additiv)
- `types/supabase.ts` (ein Tabellenblock, von Hand in Generatorform – siehe 6)

**Domäne und Server**

- `lib/account/besuche.ts`, `besuche-eingabe.ts`, `besuche-daten.ts`,
  `besuche-aktionen.ts`, `besuche-copy.ts` (neu)
- `lib/account/welt-ansicht.ts`, `welt-laender.ts`, `welt-geometrie.ts` (neu)
- `lib/account/world-map.ts` (Besuchsfelder entfernt, Kennzahl ergänzt)
- `lib/account/world-map-ansicht.ts` (Zustandsbeschreibung für Hilfsmittel)
- `lib/account/world-map-laender.ts` (neu, erzeugt)
- `lib/account/navigation.ts` (Punkt „Deine Welt“)

**Oberfläche**

- `app/account/welt/page.tsx` (neu)
- `app/account/page.tsx`, `app/(public)/ui-audit/account/page.tsx`
- `components/account/AccountBesuche.tsx`, `AccountBesuchFormular.tsx`,
  `WeltZustaende.tsx` (neu)
- `components/account/AccountWeltKarte.tsx`, `AccountUebersicht.tsx`,
  `AccountUebersichtLive.tsx`, `AccountAuditClient.tsx`
- `components/country/LandFeld.tsx` (Hydrationsfehler, siehe Self-Review 2.2)

**Werkzeuge und Tests**

- `scripts/kartografie/weltkarte-geometrie.mjs` (erzeugt zusätzlich die
  Länderflächen; die Grundkarte bleibt byte-identisch)
- `scripts/kartografie/besuchshistorie-belege.mjs` (neu)
- `scripts/db/besuche-rls-lokal.mjs`, `besuche-rls-lokal-bootstrap.sql` (neu)
- `scripts/account-ui-audit.mjs` (Zusagen an das neue Wahrheitsmodell angepasst)
- `lib/account/besuche.test.ts`, `welt-laender.test.ts` (neu)
- `lib/account/world-map.test.ts`, `navigation.test.ts`, `buchungen-ui.test.ts`
- `package.json` (ein Skript: `db:besuche-lokal`)

**Dokumentation**

- `docs/EXPLICIT_VISIT_HISTORY_1_STATUS_2026-09-17.md`
- `docs/EXPLICIT_VISIT_HISTORY_1_HANDOFF_2026-09-17.md`
- `docs/EXPLICIT_VISIT_HISTORY_1_SELF_REVIEW_2026-09-17.md`
- `docs/EXPLICIT_VISIT_HISTORY_1_MIGRATION_EVIDENZ_2026-09-17.md`
- `docs/EXPLICIT_VISIT_HISTORY_1_VISUAL_EVIDENCE_2026-09-17.md`
- `docs/evidence/explicit-visit-history-1/` (14 Bilder, ein Messbericht)

## 4. Gates

| Gate | Ergebnis |
| --- | --- |
| `npm test` | 3293 / 0 Fehler |
| `npx tsc --noEmit -p tsconfig.json` | grün |
| `npm run lint` | 0 Fehler, 139 Warnungen (bestehend, keine aus dieser Etappe) |
| `npm run build` | grün |
| `npm run check:dead` | grün |
| `npm run check:exports` | grün |
| `npm run check:deps` | grün |
| `npm run check:api-schutz` | grün |
| `npm run check:schema-bezug` | grün |
| `npm run audit:account` | 48/48 (WebKit + Chromium, 6 Breiten) |
| `npm run db:besuche-lokal` | 26/26 gegen lokale PostgreSQL 16 |
| `node scripts/kartografie/weltkarte-geometrie.mjs --pruefen` | beide Dateien aktuell |
| `node scripts/kartografie/besuchshistorie-belege.mjs` | 14 Belege, `ok: true` |
| `npm run db:anwenden` | **abgebrochen, HTTP 401** – siehe 6 |
| `db:rls`, `db:rechte`, `db:sicherheit`, `db:advisors`, `db:typen`, `auth:pruefen` | **nicht gelaufen**, dasselbe 401 |
| Exact-Head-CI | siehe Abschnitt 8 |
| Exact-Head-Vercel-Preview | siehe Abschnitt 8 |

## 5. Sichtbelege

390 px und ≥ 1280 px je Zustand: leer, besucht, geplant, überlagert, Land ohne
zeichenbare Fläche, Lesefehler, Hinzufügen, Bearbeiten, Widerrufen.

Gemessen über alle 14 Aufnahmen: 0 fremde Herkünfte, 0 horizontaler Überlauf,
0 Konsolen- und Seitenfehler, kleinste Bedienfläche 44 px, 15 Farben im
14-px-Fenster über einer Landesgrenze unter einer Füllung.

Einzelheiten: `docs/EXPLICIT_VISIT_HISTORY_1_VISUAL_EVIDENCE_2026-09-17.md`.

## 6. Das blockierte Gate

`SUPABASE_ACCESS_TOKEN` wird vom Supabase-Management-API mit HTTP 401
abgewiesen. Folge:

- die Migration ist **nicht** auf Development angewendet;
- Live-Schema, Live-RLS, Policies, Grants, Advisors und `auth:pruefen` sind
  **nicht** geprüft;
- `types/supabase.ts` trägt den Block `account_visits` von Hand in
  Generatorform und muss nach dem Anwenden mit `npm run db:typen` ersetzt werden.

Production wurde **nicht** berührt: es wurde kein Kommando mit `--produktion`
ausgeführt, und derselbe 401 hätte jeden Zugriff verhindert.

Ersatzweise liegt ein isolierter Lauf gegen eine lokal aufgesetzte
PostgreSQL 16 vor, der dieselbe Migrationsdatei anwendet und RLS, Rechte und
jede Check-Bedingung empirisch misst: 26/26. Er ersetzt den
Development-Nachweis nicht.

Einzelheiten und der genaue Ablauf nach Freigabe:
`docs/EXPLICIT_VISIT_HISTORY_1_MIGRATION_EVIDENZ_2026-09-17.md`.

## 7. Was der Technical Lead entscheiden muss

1. Migration auf Supabase Development anwenden lassen, danach `db:typen`,
   `db:rls`, `db:rechte`, `db:sicherheit`, `db:advisors`, `auth:pruefen` und
   `production:pruefen`, und den Diff von `types/supabase.ts` gegenlesen.
2. Ob die Ersatzmarke für Länder ohne zeichenbare Fläche (Self-Review 2.1) in
   dieser Form bleibt.
3. Ob der Eingriff in `components/country/LandFeld.tsx` (Self-Review 2.2) so
   bleibt oder als eigener Fix aus dieser Etappe herausgelöst wird.
4. Ob die kräftigeren Grenzlinien (Self-Review 2.3) übernommen werden.
5. Ob ein Real-Device-Test verlangt wird; er hat nicht stattgefunden.
6. Produktionsmigration – ausdrücklich nicht Teil dieser Etappe.

## 8. Exakter Endstand

### Code-Head

`abb7378cf9ba915c62afccdea1c045cf3b2e2943`

Das ist der letzte Commit, der Code, Migration, Tests, Werkzeuge und Belege
enthält. Sein Gating ist vollständig:

| Prüfung | Ergebnis am Head `abb7378c` |
| --- | --- |
| GitHub Actions, Lauf `35199705131` | **success** |
| „Typecheck, Lint & Build“ | pass (2m31s) |
| „Auth-Konfiguration gegen config.toml“ | pass (26s) |
| Vercel Preview | **Ready** |

Zwei ältere Läufe stehen in der Historie dieses Branches, und einer davon ist
rot. Er gehört zum Zwischenstand `f26bc3bf`, dem die Tests noch fehlten;
`check:exports` meldete 15 Exporte ohne Aufrufer. Der darauf folgende Commit
`a30bb7df` hat ihn grün gemacht (Lauf `35197413684`, success). Beide Stände sind
überholt; massgeblich ist der Head oben.

### Dokumentations-Head

Auf `abb7378c` folgt genau ein weiterer Commit. Er enthält **keinen Code**:
diesen Abschnitt und die Rücknahme eines Blocks, den `next dev` selbsttätig an
`AGENTS.md` angehängt hatte. `AGENTS.md` ist damit wieder byte-identisch mit
`origin/main`; die Regeln dieses Repositories gehören nicht in den Diff einer
Feature-Etappe.

Dieser Commit erzeugt einen eigenen CI-Lauf und einen eigenen Vercel-Preview.
Das Ergebnis dieses Laufs ist der Stand, den das Technical-Lead-Review als
Exact-Head zu prüfen hat; er ist in PR #448 sichtbar.

### Drift

Keine. `origin/main` steht nach erneutem Fetch weiterhin auf
`69f3b206fc87bf4a3ff9e3c275cf55d244c0a9a6`, und das ist zugleich die Merge-Base.
Der Branch ist ein reiner Vorlauf: kein Merge, kein Rebase, kein Force-Push.

---

**Kein Ready. Kein Merge. Keine Produktionsmigration. Keine Folgeetappe.**
Endzustand: **STOP FÜR TECHNICAL-LEAD-REVIEW**.
