# KI Runtime Recovery 1 — Self-Review

**Stand:** 18.11.2026  
**Verdikt des Autors:** `BLOCKED_OWNER_GATE`  
**Dieses Self-Review ist kein Technical-Lead-PASS.**

## Scope

Geschrieben wurden nur:

- `docs/JETNITY_KI_RUNTIME_RECOVERY_1_STATUS_2026-11-18.md`
- `docs/JETNITY_KI_RUNTIME_RECOVERY_1_SELF_REVIEW_2026-11-18.md`
- `docs/JETNITY_KI_RUNTIME_RECOVERY_1_HANDOFF_2026-11-18.md`

Kein Produktcode, kein Testcode, keine Preise, keine Kontingente, keine Migration, kein Workflow, kein Package, kein Lockfile, kein `.env`, kein `JETNITY_START_HERE.md`, kein `ROADMAP.md`, kein `ARCHITECTURE.md`, kein `DECISIONS.md`, kein `docs/ACTIVE_WORK_STATUS.md`, kein Official-Truth-/Einreise-/Readiness-Pfad, kein PR ausser #1238.

`next-env.d.ts` war zu Beginn der Diagnose lokal verändert und wurde verworfen, nicht committet.

## Warum kein Fix

Die Allowlist erlaubt einen Fix nur für einen isolierten, reproduzierbaren Codefehler. Der gemeinsame Ausfall von Erstellung und Änderung passt zum gemeinsamen Schalter vor Reservierung und `fetch`. Die gezielten Tests zeigen für `abgeschaltet`, `kein-schluessel` und `unbekanntes-modell` Klasse `gesperrt` und null Aufrufe.

Ein UI-Zustandsfehler, der beide Pfade leer oder hängend macht, wurde im Code nicht gefunden: beide Komponenten schreiben `ergebnis.meldung`. Das wurde auf `jetnity.com` nicht durch einen Submit bestätigt.

Sol-Preisdrift ist real und bewusst nicht korrigiert. `lib/modell/preise.ts` ist in diesem Auftrag nicht schreibbar. Die Drift unterschätzt den Listenpreis nicht.

## Evidence-Grenzen

| Behauptung | Grad |
| --- | --- |
| Leere Umgebung ist `abgeschaltet` und ruft nichts auf | lokal ausgeführt, 211/211 |
| Öffentliche Domain-ID `dpl_4bei1CfkMWKRJpgvEvcq9R5K6Etf` | selbst gelesen, 18.11.2026 |
| Diese ID gehört zu `e85ff69e5ebab77b019212843d92e5726eddd224` | GitHub-Commit-Status, selbst gelesen |
| KI-Quellen zwischen dieser SHA und `main@f0f376fa` sind gleich | `git diff` leer |
| Vercel-Production-Variablen sind aus | nicht in dieser Sitzung gelesen. Historische Dokumente sagen es. Das bleibt ein Owner-Lesen. |
| Owner sah den Freigabesatz | nicht beobachtet |
| Reisebegleiter-UI auf der Domain fehlgeschlagen | nicht beobachtet, nicht behauptet |
| Responses-API nimmt den Körper von `anfrage.ts` heute an | nicht ausgeführt |

## Sicherheit und Kosten

Keine Secretwerte gelesen, gedruckt oder gespeichert. Kein `modell:probe`. Kein Submit auf Production oder Preview. Keine Kontingentbuchung. Keine Nutzerreise gelesen. Der Supabase-Token dieser Umgebung wurde nicht verwendet.

## Findings für den unabhängigen Review

1. Review-Head ist der Push-Tip nach diesen Dateien, nicht `d351113afdcff03058d7831a6b1c601102f3b927` und nicht `f0f376fa`.
2. CI und Preview dieses Tips sind nach dem Push neu. Ältere Preview von `d351113` gilt nicht.
3. Hosted-Preview-Submit bleibt blockiert, bis Isolation und Kostenfreigabe getrennt belegt sind.
4. Alias-Rückstand und KI-Abschaltung sind zwei Tatsachen. Nur die zweite erklärt den Owner-Bericht, und auch sie nur zusammen mit dem noch nicht neu gelesenen Production-ENV.
5. Kein Ready aus dieser Datei.
