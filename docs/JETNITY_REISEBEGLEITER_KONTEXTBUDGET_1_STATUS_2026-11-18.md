# Reisebegleiter Kontextbudget 1 — Status

**Stand:** 18.11.2026 · **Agent:** Jetnity Reisebegleiter Kontextbudget 1 · **Generation 1**  
**Issue:** #1243 · **Draft-PR:** #1244 · **Branch:** `fix/reisebegleiter-kontextbudget-1-20261118`  
**Base:** `main@f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5`  
**Modus:** `.jetnity/operating-mode.json` live gelesen, `NORMAL`  
**Urteil:** `REVIEW_REQUIRED`  
**Session:** https://cursor.com/agents/bc-f7678c37-fe48-4c1d-bc93-5c7bf6190145  
**bcId:** `bc-f7678c37-fe48-4c1d-bc93-5c7bf6190145`  
**Modell:** `originalModelName=grok-4.7-high-fast`  
**UI-Titel:** auf `Jetnity Reisebegleiter Kontextbudget 1` gesetzt; die Umbenennung hat genau diesen Titel zurückgegeben.

Kein Ready, kein Merge, kein Folgeslice, kein bezahlter Modellauruf, keine Production-Aktion.

## Ursache

Der Satz „Diese Reise ist für den Reisebegleiter dieser Ausbaustufe zu umfangreich“ kommt aus `begleiterauskunftErzeugen`, wenn `begleiterregeln(...).length + frage.length > 24_000` ist. Das passiert vor `beanspruchen()` und vor dem Modellauruf.

Gemessen an einer synthetischen Reise, die denselben lokalen Weg benutzt wie `begleiterFragen`: `requirementsLokalFuerReise`, `safetyLokalFuerReise`, `seasonalLokalFuerReise`, dann `assistantTruthContextProjizieren`. Die Reise hat 7 Tage, 2 Etappen, 2 Reisende, je 2 Staatsangehörigkeiten und je 2 Dokumentoptionen. Keine echten Personen, keine Dokumentnummern.

| Teil | Zeichen vorher | Zeichen nachher | Anzahl |
| --- | ---: | ---: | --- |
| Official-Kontext | 69 709 | 7 378 | 128 Zeilen, 16 Anforderungstypen je 8, vorher ungruppiert, nachher 3 Prüfstandsgruppen |
| Angebot | 1 031 | 1 031 | 7 Paare |
| Etappen | 230 | 230 | 2 |
| Reisende | 1 034 | 1 094 | 2 Reisende, 4 Optionen `K1`–`K4` |
| Safety | 257 | 257 | 1 |
| Seasonal | 256 | 256 | 1 |
| Kontext gesamt | 72 907 | 10 636 | |
| Systemregeln ohne Kontext | 3 806 | 4 448 | die Differenz ist die Spaltenlegende |
| Systemregeln plus Owner-Frage (76 Zeichen) | 76 789 | 15 160 | Grenze bleibt 24 000 |

Die 128 Official-Zeilen haben den Grenzwert verursacht. Etappen, Angebot und Safety/Seasonal waren klein. `BEGLEITER_GRENZEN.eingabeZeichen` bleibt 24 000, `ausgabeTokens` bleibt 1 600.

## Was die Kompaktform behält

Gleicher Prüfstand steht einmal in `official.gruppen[].stand`. Jede Lage bleibt eine eigene Zeile mit `ref`, Anforderungstyp, Reisendem, Optionskennung, Ziel, Transit und Etappen. Fehlende optionale Standfelder sind `null` beziehungsweise keine fehlenden Angaben. Gesetzte Werte, einschliesslich `unknown`, bleiben wörtlich.

Eine breitere synthetische Verteilung (required und not_required auf verschiedenen Optionen, conditional/stale, recheck, source_temporarily_unavailable, Temporal Rule, drei Safety- und drei Seasonal-Frischen) bleibt vollständig und kommt auf **17 257** Zeichen Systemregeln plus Frage, bei 128 Zeilen in 7 Gruppen.

## Verifikation lokal

- `lib/reisebegleiter/*.test.ts`: 167 bestanden, 0 fehlgeschlagen, 0 übersprungen
- zusätzlich `lib/modell/preise.test.ts` und `lib/reisebegleiter/kosten.test.ts`: bestanden, Luna/Terra/Sol bleiben unter der Reservierung
- `npx tsc -p tsconfig.json --noEmit`: grün, nach einem vorherigen Typfehler in der Testannotation
- `eslint` auf den geänderten Reisebegleiter-Dateien: grün
- `npm run check:exports`: 0 Exporte ohne Aufrufer
- `npm run check:dead`: 0 verwaiste Module
- Production-Build: der erste `npm run build` kompilierte in 15 s, beendete TypeScript und erzeugte 32 statische Seiten, stoppte danach mit `SecurityFatalError` (Next.js 16.4.1, bekannte Sicherheitswarnung, Retry vom Werkzeug verlangt). Der unmittelbare Retry endete mit Exit 0 und derselben Routentabelle. Kein Next-Upgrade in diesem Slice: Packages und Lockfiles sind gesperrt.
- Kein OpenAI-Aufruf. Der Erfolgsfall benutzt einen gefakten Modelltext und akzeptiert eine Katalogauswahl erst nach `beanspruchen`.
- `kontext(4000)` und die neue 4000-Etappen-Reise werden weiter vor der Reservierung abgelehnt.

## Nicht angefasst

`schema.ts`, `kontext.ts`, `pruefung.ts`, `befunde.ts`, `aussagen.ts`, `erzeugen.ts` (der Guard bleibt), `lib/modell/**`, Readiness/Safety/Seasonal-Quellen, `supabase/**`, Auth, Secrets, Packages, Workflows, #1238, #1240, #1235 und die offenen Official-Truth-PRs #1242, #1241, #1236, #1234, #1228, #1218.

## Nächster Schritt

Unabhängiges Technical-Lead-Exact-Head-Review von Draft-PR #1244. Cursor setzt nicht Ready und mergt nicht.
