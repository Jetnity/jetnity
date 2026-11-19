# Jetnity Reisebegleiter Kontextbudget 1 — Versionierter Cursor-Fixauftrag

**Stand:** 18.11.2026, Zürich · **Typ:** P1, eng begrenzter KI-Laufzeitfehler (Dev, kein Production-Auftrag)  
**Owner-Bestätigung:** „ok“ zur Weiterarbeit am Reisebegleiter nach echtem Testfehler  
**Issue:** [#1243](https://github.com/Jetnity/jetnity/issues/1243) · **Vorarbeit:** [#1237](https://github.com/Jetnity/jetnity/issues/1237), Diagnose [#1238](https://github.com/Jetnity/jetnity/pull/1238)  
**Ausgangspunkt:** `main@f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5` (CI [44333651972](https://github.com/Jetnity/jetnity/actions/runs/44333651972) SUCCESS, historischer Baseline-Beleg)  
**Branch:** `fix/reisebegleiter-kontextbudget-1-20261118`, **Draft-PR** an `main`  
**Cursor-Agent (exakter logischer Anzeigename):** `Jetnity Reisebegleiter Kontextbudget 1`; **Generation 1** (neuer, unabhängiger Slice)  
**Reale Cursor-Session, Modell und UI-Name:** erst nach Start belegen; nicht erfinden  
**Modus:** `.jetnity/operating-mode.json` war bei Auftragsvorbereitung `NORMAL`; vor Arbeit live erneut lesen.

## 1. Beobachteter Defekt und Produktziel

Der Product Owner hat am **18.11.2026 um 22:16 Zürich** auf einer **isolierten KI-Dev-Vorschau** den Reisebegleiter gefragt: „Was ist bei meiner Reise bereits geplant, und welche Punkte sind noch offen?“ Die normale **7-Tage-Reise mit 2 Etappen** zeigte:

> Diese Reise ist für den Reisebegleiter dieser Ausbaustufe zu umfangreich. Er wurde deshalb nicht ausgeführt.

Das ist eine echte sichtbare Produktblockade, aber **kein nachgewiesener OpenAI-, Login- oder Quota-Ausfall**. Aus Source `lib/reisebegleiter/erzeugen.ts` geht hervor, dass bei `begleiterregeln(...).length + frage.length > 24_000` vor `werkzeuge.beanspruchen()` und `werkzeuge.aufrufen()` fail-closed abgelehnt wird. Der Owner-Test einer erfolgreichen Reiseerstellung und einer **noch nicht übernommenen** KI-Reiseänderung war ein anderer Pfad; er wird nicht neu implementiert. Keine echten User-Reisedaten kopieren oder im PR nennen.

**Ziel:** Ein üblicher 7-Tage-/2-Etappen-Reisegraph mit realistischem, datensparsam simuliertem Traveller-/Dokument-/Official-/Safety-/Seasonal-Kontext soll trotz vollständiger zulässiger Jetnity-Wahrheit und weiterhin begrenzter Kosten vom Reisebegleiter sinnvoll beantwortet werden können. Das bedeutet eine **kompaktere, wahrheitsgleiche Modelleingabe**, nicht eine höhere Kostengrenze oder eine neue Auskunftsautorität.

**Akzeptanz ist nicht automatisch die Behauptung, dass jede beliebig grosse Reise passt.** Wenn die Frage/relevante Reise zu umfangreich bleibt, weiter ehrlich ohne Kosten ablehnen.

## 2. Vor Arbeit: live lesen, Scope sichern

1. `JETNITY_START_HERE.md`, `AGENTS.md`, `.jetnity/operating-mode.json`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, dieses Dokument, Issue #1243 sowie aktuellen `main`-SHA und offene PRs/Branches, insbesondere #1238 (KI Diagnose), #1240 (Passkeys), #1235 (Roadmap) und alle Official-Truth-/Einreise-/DB-PRs.
2. `docs/MODELL.md` §9a, `DECISIONS.md` ADR-0211/0212 **nur lesen**; `lib/reisebegleiter/{kontext,nutzlast,regeln,erzeugen,schema,pruefung,befunde,aussagen,kosten.test}.ts` und dazugehörige Testdateien untersuchen.
3. Dev-Vorschau `feat/ki-dev-isolated-20261118` basiert auf `main` und besitzt branchbezogene, separat freigegebene Modellschlüssel. Dieser neue Fix-Branch darf **deren Env, Aliase oder Secrets nicht übernehmen, umstellen oder auslesen**. Kein Hosted-Login oder Modellsubmit in diesem Slice.
4. Bestehende andere Autorenschaft ist strikt geschützt: Official Truth, 206×50-Pässe, DB/Migrationen/Readiness/Travel-Safety-Contracts gehören einem anderen Technical Lead. **Auch deren Tests/Workflows nicht ändern.**

## 3. Diagnose mit synthetischen Daten, vor jedem Fix

- Baue eine deterministische **synthetische Testreise** (7 Tage, 2 Etappen, 1–2 Reisende, mehr als eine Staatsbürgerschaft/Dokumentoption, realistische Referenzgruppen). Keine echte Reise-ID/Person/Passnummer/MRZ/E-Mail/Account-/Sessiondetails.
- Miss **nur Längen und Zählungen**, getrennt nach `begleiterregeln`, `nutzlast.kontext`, `angebot`, `etappen`, `reisende`, `official`, `safety`, `seasonal`, nicht Promptinhalte oder personenbezogene Daten loggen. Zeige, welcher Teil den Grenzwert verursacht.
- Vergleiche komprimierte Eingabe und alte Eingabe semantisch: Unverändert bleiben die serverseitig berechneten `angebot`-Paare (Schlüssel + ref), `bezuege`-Referenzen und ihre Wahrheit, aktuelle/unbekannte/stale Statusverteilungen, alle für die Frage relevanten Etappen und gleichrangigen Pass-/Dokumentoptionen.
- Berücksichtige, dass die Modellnutzlast eine **engere Projektion** von `assistantTruthContextProjizieren()` ist, niemals eine neue Quelle von Official Truth. Der bestehende Server-Prüfer `auskunftPruefen()` und die unveränderliche Jetnity-Formulierung aus den Katalogen bleiben autoritativ.

## 4. Enger erlaubter Fix

**Nur diese Schreibdateien, falls erforderlich:**
- `lib/reisebegleiter/nutzlast.ts`
- `lib/reisebegleiter/regeln.ts`
- `lib/reisebegleiter/erzeugen.ts`
- Direkt betroffene Tests unter `lib/reisebegleiter/`, bevorzugt `nutzlast.test.ts`, `erzeugen.test.ts`, eigene synthetische Testfixtures und eigene isolierte Testdatei dort.
- Eigene datierte `docs/JETNITY_REISEBEGLEITER_KONTEXTBUDGET_1_{STATUS,SELF_REVIEW,HANDOFF}_2026-11-18.md`.

**Nicht ohne neue Owner/TL-Freigabe:**
- `lib/reisebegleiter/schema.ts` inklusive `BEGLEITER_GRENZEN.eingabeZeichen=24_000` und `ausgabeTokens=1600` ändern;
- `lib/modell/**` (Konfiguration, Preisliste, Reservierung, API), `lib/reisebegleiter/kontext.ts`, `befunde.ts`, `aussagen.ts`, `pruefung.ts`, `aktionen.ts` ändern;
- `lib/readiness/**`, `components/readiness/**`, `lib/safety/**`, `lib/seasonal/**`, `supabase/**`, `scripts/db/**`, RLS/Identity/Auth/DB-Tests/Migrationen, Official-Truth-/Einreise-/Quellenmodule, CI-Workflows oder Packages/Lockfiles ändern;
- globale `ROADMAP.md`, `docs/ACTIVE_WORK_STATUS.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `JETNITY_START_HERE.md`, Standarddokumente, andere PRs/Branches oder `main` anfassen;
- API-/Modell-/Provideraufrufe mit Kosten, Vercel-ENV, Preview-Aliase, neue Keys, Production, Owner-AAL2, Login, öffentliche Veröffentlichung oder Merges.

**Mechanik:** Redundanzen im Modellkontext kontrolliert reduzieren, **ohne** die datensatzgebundene Gleichwertigkeit von `angebot`/`bezuege`, Ref-Zuordnung und überprüfbaren Wahrheitsklassen zu beschädigen. Kein blindes `.slice`, kein willkürliches `array.slice(0,n)`, keine zweite/andere Truth-Quelle, keine erfundene LLM-Aussage. Falls eine sichere Lösung ohne geschützten Shared-Contract-Eingriff unmöglich ist: `BLOCKED_TL_SHARED_CONTRACT` sauber begründen und STOP statt unsicherem Workaround.

## 5. Akzeptanzkriterien & Sicherheitsregressionen

A1. Mit einer **glaubhaften, breit gefüllten synthetischen 7-Tage-/2-Etappen-Reise** und der Owner-Frage unterschreitet `systemregeln.length + frage.length` **24’000 Zeichen**; der Offline-Flow erreicht *nach* der Kostenreservierung einen rein gefakten Modellaufruf und akzeptiert eine zulässige Katalog-Auswahl – **kein echter OpenAI-Aufruf**.

A2. Gleiche Kontrollfälle mit mehreren Reisenden, mehreren gleichrangigen Staatsbürgerschaften/Dokumentoptionen, verschiedenen Aufenthalten und mehreren Official-/Safety-/Seasonal-Lagen verlieren **keinen** für die angebotene Antwort relevanten `ref`, kein `angebot`-Paar und keine aktuelle/ungeprüfte/unbekannte Unterscheidung. `assistantTruthContextProjizieren()` und `auskunftPruefen()` bleiben unverändert. Eine echte amtliche Regel wird nicht vom Modell formuliert.

A3. Sicherheitsreissleine gegen Dokumentnummer, MRZ, Kontodaten, E-Mail, URL, Secrets, Preise, Biometrie und andere verbotene Werte wirkt in der neu kompakten Darstellung weiterhin **vor** jedem Paid-Call; keine Prompt-Injection über Reisetitel/Freifelder.

A4. Die bereits existierende **riesige synthetische Reise** `kontext(4000)` wird weiterhin **vor** jeder Kostenreservierung / API-Anfrage abgewiesen; unveränderte 24k-/1600-Grenzen und Kostenvergleich für **jedes** erlaubte Modell (`lib/reisebegleiter/kosten.test.ts`).

A5. Eigener Testsatz: neue Fehlreproduktion RED→GREEN, breiter Truth-/Privacy-/Ref-Matrix-Check, bestehende `lib/reisebegleiter/*.test.ts`, `lib/modell/preise.test.ts` und passende Kostenvertrags-Nachweise, Typecheck/Lint/Build, `npm run check:exports`, vollständige GitHub-CI auf **letztem** Review-Head. Keine Test-Skips und keine Änderungen an anderen Produktbereichen zur Erreichung von Grün.

A6. Klare Diagnose in `STATUS`, `SELF_REVIEW`, `HANDOFF`: Vorher/Nachher **nur Längen und Anzahlen**, geänderte Dateien, Test-/CI-/Preview-Gates, reale Cursor-Session mit Modell, Risiken, `REVIEW_REQUIRED` oder `BLOCKED_TL_SHARED_CONTRACT`. Kein behauptetes Hosted-PASS oder „auf jetnity.com live“.

## 6. STOPP und Zuständigkeit

- Andere Product-Owner-/Technical-Lead-Lanes bleiben exklusiv und unangetastet. Kein zweiter Editor auf #1238, #1240, #1235 oder #1243 außer separat zugeordneter Issue-Evidence.
- Nach letzter Codeänderung erst vollständigen Diff, Tests und Handoff im **eigenen** Draft-PR belegen, **kein Ready, kein Merge, kein neuer Folgeslice, kein anderer Agent und keine Production-Aktion**.
- Bei nötigem Shared-Truth-/DB-/Kostenvertrags-Eingriff: genau diesen Schritt stoppen und unabhängig prüfbaren Owner-/TL-Blocker dokumentieren.
- **STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW.** 
