# Reisebegleiter Kontextbudget 1 — Handoff

**Stand:** 18.11.2026 · **Generation 1** · **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW**

## Sitzung

| | |
| --- | --- |
| Logischer Name | Jetnity Reisebegleiter Kontextbudget 1 |
| UI-Titel | `Jetnity Reisebegleiter Kontextbudget 1` |
| Umbenennung | ausgeführt; Rückgabe der Umbenennung war genau dieser Titel |
| Session | https://cursor.com/agents/bc-f7678c37-fe48-4c1d-bc93-5c7bf6190145 |
| bcId | `bc-f7678c37-fe48-4c1d-bc93-5c7bf6190145` |
| Modell | `originalModelName=grok-4.7-high-fast` |
| Branch | `fix/reisebegleiter-kontextbudget-1-20261118` |
| Draft-PR | https://github.com/Jetnity/jetnity/pull/1244 |
| Issue | https://github.com/Jetnity/jetnity/issues/1243 |
| Base | `main@f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5` |
| Modus | `NORMAL` |

## Auftrag

Eine gewöhnliche 7-Tage-/2-Etappen-Reise soll den Reisebegleiter nicht mehr mit „zu umfangreich“ abweisen, ohne die Kostengrenze zu erhöhen und ohne Official-Wahrheit zu kürzen.

## Änderung

- `lib/reisebegleiter/nutzlast.ts`: Official-Lagen mit gleichem Prüfstand teilen `stand`. Jede Lage bleibt eine Zeile. Dokumentoptionen bekommen eine stabile Kennung `K1…` statt der wiederholten internen Optionsreferenz.
- `lib/reisebegleiter/regeln.ts`: die Regeln erklären Spalten und Gruppen. Sie sagen, dass eine Gruppe keine Option zusammenlegt.
- `lib/reisebegleiter/kontextbudget.test.ts`: synthetische 7-Tage-Reise, breite Statusmatrix, Reissleine, 4 000 Etappen.
- `lib/reisebegleiter/nutzlast.test.ts`: die Ref-Prüfung liest Official-Refs aus der ersten Spalte.
- `erzeugen.ts` unverändert. Der Guard, die Reservierung und der eine Modellauruf bleiben.

## Längen, nur Zählungen

Owner-Frage, 76 Zeichen. Lokaler Prüfstand, wie `begleiterFragen` ihn ohne Provider baut:

| | vorher | nachher |
| --- | ---: | ---: |
| Official | 69 709 | 7 378 |
| Kontext | 72 907 | 10 636 |
| Systemregeln plus Frage | 76 789 | 15 160 |
| Official-Zeilen | 128 | 128 |
| Prüfstandsgruppen | 128 einzelne Objekte | 3 |
| Anforderungstypen | 16, je 8 | 16, je 8 |
| Angebotspaare | 7 | 7 |
| Grenze | 24 000 | 24 000 |

Breite Statusvariante: Systemregeln plus Frage **17 257**, Official **8 537**, 128 Zeilen, 7 Gruppen, Safety 736, Seasonal 715.

## Tests auf diesem Arbeitsstand

- `lib/reisebegleiter/*.test.ts`: 167/167 grün
- `lib/modell/preise.test.ts` und `lib/reisebegleiter/kosten.test.ts`: grün, 3 USD/Tag und die Modellreservierung unverändert
- Typecheck grün, eslint der geänderten Dateien grün, `check:exports` grün, `check:dead` grün
- Build: erster `npm run build` kompilierte, prüfte TypeScript und erzeugte 32 statische Seiten, endete danach mit `SecurityFatalError` von Next.js 16.4.1. Der unmittelbare Retry endete mit Exit 0. Kein Versionswechsel in diesem Slice.
- Kein bezahlter Aufruf, kein Login, kein Vercel-Alias, kein Secret.

## Grenzen

Nicht geändert: Official-Truth-, Einreise-, DB-, Auth- und Paketflächen. Offene fremde PRs #1238, #1240, #1235, #1242, #1241, #1236, #1234, #1228, #1218 sind unberührt. Kein `BLOCKED_TL_SHARED_CONTRACT`: die Kompaktform kommt ohne deren Verträge aus.

## Stopp

`REVIEW_REQUIRED`. Cursor setzt nicht Ready, mergt nicht und startet keinen Folgeslice. Der nächste Schritt ist das unabhängige Exact-Head-Review durch den Technical Lead.
