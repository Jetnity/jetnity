# KI Runtime Recovery 1 — Status

**Stand:** 18.11.2026, Europe/Zurich  
**Verdikt:** `BLOCKED_OWNER_GATE`  
**Nicht:** `READY`. Kein Merge. Keine Production-Freigabe. Kein Folgeslice.

## Identität

| Feld | Wert |
| --- | --- |
| Logischer Agent | Jetnity KI Runtime Recovery 1 |
| Generation | 1, neuer Slice |
| Session | https://cursor.com/agents/bc-48618cba-471f-4cf3-8f00-0e7d39ae34a4 |
| Modell | `originalModelName=grok-4.7-high-fast` (nicht Auto) |
| UI-Titel | auf `Jetnity KI Runtime Recovery 1` gesetzt |
| Auftrag | `docs/JETNITY_KI_RUNTIME_RECOVERY_1_TASK_2026-11-18.md` |
| Issue | [#1237](https://github.com/Jetnity/jetnity/issues/1237) |
| PR | Draft [#1238](https://github.com/Jetnity/jetnity/pull/1238) |
| Branch | `fix/ki-runtime-recovery-1-20261118` |
| Branch-Head vor dieser Diagnose | `d351113afdcff03058d7831a6b1c601102f3b927` |
| Review-Head | der PR-Head, der diese drei Dateien einführt. Ein Commit kann seine eigene SHA nicht enthalten; die SHA steht im PR-Kommentar nach dem Push. `d351113afdcff03058d7831a6b1c601102f3b927` ist nicht der Review-Head. |
| Baseline | `main@f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5` |
| Modus | `.jetnity/operating-mode.json` = `NORMAL` |

`main` war bei der Live-Lesung weiterhin `f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5`. Kein Rebase. Main-CI [44333651972](https://github.com/Jetnity/jetnity/actions/runs/44333651972) ist SUCCESS auf dieser SHA. Das ist die Main-Baseline, nicht das Gate dieses PR-Heads.

## Ursachenmatrix

| Pfad | Sichtbarer Zustand | Reproduzierbar | Ort | Beweis | Nächster sicherer Schritt |
| --- | --- | --- | --- | --- | --- |
| `reisevorschlag` | Ohne `JETNITY_MODELL_AKTIV=true\|1` Klasse `gesperrt`, Satz „noch nicht freigegeben“, Formular bleibt. Kein Kontingent, kein `fetch`. | ja, lokal | `lib/modell/konfiguration.ts`, `lib/reisevorschlag/erzeugen.ts`, `lib/reisevorschlag/aktionen.ts`, `components/trips/Reiseidee.tsx` | 211 gezielte Tests, 0 Fehler | Owner-Gate, kein Code-Bypass |
| `reiseaenderung` | Dieselbe Abschaltung, Satz endet mit „Die Reise bleibt unverändert.“ | ja, lokal | `lib/reiseaenderung/erzeugen.ts`, `lib/reiseaenderung/aktionen.ts`, `components/trips/ReiseAenderung.tsx` | dieselben Tests | Owner-Gate |
| `reisebegleiter` | Dieselbe Abschaltung, eigener Satz. Zusätzlich historisch: Production-CHECK ohne `reisebegleiter`. | Abschaltung ja, lokal. Sichtbarer Nutzerpfad auf `jetnity.com` nicht ausgeführt. | `lib/reisebegleiter/erzeugen.ts`, `lib/reisebegleiter/aktionen.ts` | Tests plus ADR-0212 / `docs/MODELL.md` §9a als historische Grenze | Owner-Gate; Migration nicht aus diesem Slice |
| Live `jetnity.com` | Alias zeigt `dpl_4bei1CfkMWKRJpgvEvcq9R5K6Etf` | ja, öffentliches HTML | Vercel-Alias, nicht der Code | HTTP 200, `data-dpl-id` | Alias-Nachzug ist eine Production-Entscheidung und schaltet die KI nicht ein |
| Sol-Preis | Code $5.00 / $0.50 / $30.00; öffentliche Short-Context-Liste $4.00 / $0.40 / $20.00 | ja, Vergleich | `lib/modell/preise.ts` gegen https://developers.openai.com/api/docs/pricing | gelesen 18.11.2026 | `STOP FOR PO/TL COST GATE`. Datei nicht anfassen |
| Production-ENV | Nicht in dieser Sitzung gelesen | nein | Vercel Production | kein Token; eindeutige Deployment-URLs SSO 302 | Owner/TL liest Existenz von `JETNITY_MODELL_AKTIV`, `OPENAI_API_KEY`, `JETNITY_MODELL_NAME`, `JETNITY_MODELL_AUFWAND`, `SUPABASE_SERVICE_ROLE_KEY` ohne Werte zu kopieren |

Kein API-Fehler wurde beobachtet. Ein abgeschalteter Kill Switch wird nicht als Anbieterfehler bezeichnet.

## Was diese Sitzung wirklich gesehen hat

Öffentliche GET-Requests, ohne Formular, ohne Server Action, ohne Modellaufruf:

- `https://jetnity.com/` und `https://jetnity-app.vercel.app/` antworten HTTP 200 mit `data-dpl-id="dpl_4bei1CfkMWKRJpgvEvcq9R5K6Etf"`. `www.jetnity.com` leitet auf `https://jetnity.com/` um und liefert dieselbe ID. Meta-Robots: `noindex, nofollow`.
- Diese Deployment-ID ist das Vercel-Statusziel von `e85ff69e5ebab77b019212843d92e5726eddd224` (`feat(flights): country-aware airport search and destination cards`, 18.11.2026 14:09 +0100). GitHub-Deployment Production `7884642240`, 18.11.2026 13:28:48Z.
- Aktuelles `main` `f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5` hat ein neueres Vercel-Ziel `dpl_8fitMFHnsYX2RPYBGtPXJGkJFwaA` (Status 18.11.2026 15:16:50Z, GitHub-Deployment `7887437828`). Die öffentliche Domain zeigt dieses Deployment nicht.
- `git diff e85ff69e5ebab77b019212843d92e5726eddd224 f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5` über `lib/modell`, `lib/reisevorschlag`, `lib/reiseaenderung`, `lib/reisebegleiter` und die drei UI-Dateien ist leer. Der Alias-Rückstand erklärt die Meldung des Owners nicht.
- Die eindeutige Deployment-URL von `f0f376fa` (`https://jetnity-ka4xaygbp-jetnity-e1b93c82.vercel.app/`) antwortet 302 auf Vercel-SSO. Kein Login.

`/planen` liefert serverseitig den Gast-Wartezustand „Der Browserspeicher wird geprüft.“ Das ist die vorgesehene Sicht vor der Beobachtung des lokalen Speichers, kein KI-Ergebnis.

## Was nicht behauptet wird

- Nicht behauptet: die Production-Variable `JETNITY_MODELL_AKTIV` sei in dieser Sitzung neu gelesen worden. Diese Agentenumgebung enthält genau die Namen `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`. `JETNITY_MODELL_AKTIV`, `OPENAI_API_KEY`, `JETNITY_MODELL_NAME` und `SUPABASE_SERVICE_ROLE_KEY` sind hier nicht gesetzt. Das ist nicht die Vercel-Production.
- Nicht behauptet: der Owner habe auf `jetnity.com` denselben Satz gesehen. Sein Klick wurde nicht wiederholt, weil ein Submit bei eingeschaltetem Switch Kontingent und einen bezahlten Aufruf auslösen kann.
- Nicht behauptet: der Reisebegleiter sei auf der Website fehlgeschlagen. Er nutzt denselben Schalter, ist nur für Kontoreisen erreichbar und wurde nicht bedient.
- Nicht behauptet: Production-Migration `20260917090000_modell_reisebegleiter` sei heute erneut geprüft. Historische Quelle: `docs/ACTIVE_WORK_STATUS.md` Abschnitt Assistant Runtime und `docs/MODELL.md` §9a. Keine Production-Datenbankabfrage in dieser Sitzung.
- Nicht behauptet: Terra/Luna-Preise oder der Responses-Körper seien gegen einen bezahlten Aufruf neu gemessen. Terra und Luna Short-Context stimmen mit `lib/modell/preise.ts` überein. Der Request-Körper wurde nicht ausgeführt.

## Codebefund

`modellZustand()` lässt einen Aufruf nur zu, wenn der Kill Switch genau `true` oder `1` ist, `OPENAI_API_KEY` nicht leer ist und Name sowie Denkaufwand in der bekannten Liste liegen. Sonst `abgeschaltet`, `kein-schluessel` oder `unbekanntes-modell`. Alle drei Erzeuger prüfen das vor der Reservierung. Die Oberfläche setzt `ergebnis.meldung`. Ein Wurf der Action wird in `Reiseidee.tsx` als Transportfehler gezeigt, nicht als leere Reise.

`lib/trips/create-entry.ts` blockiert einen zweiten Gastentwurf, bevor das Modell läuft. Angemeldete Konten lässt das Gate durch. Eine bestehende Reise zu ändern läuft nicht über dieses Create-Gate. Es erklärt nicht, dass Erstellung und Änderung gemeinsam ausfallen.

Ein isolierter Codefehler in der Allowlist wurde nicht reproduziert. Deshalb keine Änderung an `lib/modell`, `lib/reisevorschlag`, `lib/reiseaenderung`, `lib/reisebegleiter` oder den drei Komponenten.

`lib/modell/preise.ts` bleibt unverändert. Sol ist öffentlich günstiger als die Reservierung. Die Reservierung liegt über dem Listenpreis und unter dem Tagesdeckel eines einzelnen Aufrufs (schlechtester Fall im Code etwa USD 0.193 bei 2600/6000 Tokens). Sie ist nicht die Ursache eines stillen Totalausfalls. Eine Preiskorrektur wäre ein Kostenvertrag und ist in diesem Auftrag gesperrt.

## Tests dieser Sitzung

```text
node --experimental-test-module-mocks --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/modell/konfiguration.test.ts lib/modell/antwort.test.ts lib/modell/preise.test.ts \
  lib/modell/grenzen-datenbank.test.ts lib/reisevorschlag/erzeugen.test.ts \
  lib/reisevorschlag/routing.test.ts lib/reiseaenderung/erzeugen.test.ts \
  lib/reiseaenderung/routing.test.ts lib/reisebegleiter/erzeugen.test.ts \
  lib/reisebegleiter/oberflaeche.test.ts
```

Ergebnis: 211 Tests, 211 bestanden, 0 fehlgeschlagen, 1344 ms. Kein Netzwerk, kein Schlüssel, kein Modellaufruf.

Nicht ausgeführt: `npm test` (Official-Truth-Gesamtsuiten), Production-Build, Lint, Typecheck des gesamten Repos, `db:kontingent`, `modell:probe`. GitHub-CI dieses PR-Heads startet mit dem Push und ist bis zum Abschluss kein PASS. Preview dieses Heads wird nicht mit einem KI-Submit geprüft ([#968](https://github.com/Jetnity/jetnity/issues/968), SSO, mögliche Kosten).

## Offene PRs, nicht angefasst

#1238 dieser Draft. #1236, #1228, #1234, #1218 Official Truth / Einreise. #1235 und #1233 Dokumentation. Keine Datei dieser PRs geändert.

[#751](https://github.com/Jetnity/jetnity/issues/751) zuletzt aktualisiert 16.11.2026, Kommentar `6916920063`, Official-Truth-BG1. Kein Auftrag für diese KI-Lane.

## Owner-Schritt

Production-KI einzuschalten ist ein besonderes Product-Owner-Gate: Secret, bezahlte Aufrufe, Kosten. Diese Sitzung schaltet nichts ein.

1. Existenz und Zielumgebung von `JETNITY_MODELL_AKTIV`, `OPENAI_API_KEY`, `JETNITY_MODELL_NAME`, `JETNITY_MODELL_AUFWAND` und `SUPABASE_SERVICE_ROLE_KEY` in Vercel Production lesen. Werte nicht in Git, PR oder Chat schreiben.
2. Soll die Funktion auf `jetnity.com` laufen, Kill Switch und Schlüssel dort setzen. Leer oder etwas anderes als `true`/`1` bleibt aus. Unbekannter Modellname bleibt aus.
3. Vor einer Sol-Nutzung den Preisvertrag in `lib/modell/preise.ts` gegen die öffentliche Liste vom 18.11.2026 entscheiden. Diese Datei ist hier nicht freigegeben.
4. Für den Reisebegleiter zusätzlich die historische Production-Migration `20260917090000_modell_reisebegleiter` prüfen und nur in einem eigenen DB-Gate anwenden. Vorschlag und Änderung hängen nicht an diesem dritten CHECK-Wert.
5. Den Alias-Rückstand `e85ff69e` gegenüber `f0f376fa` getrennt entscheiden. Er ändert die KI-Quellen nicht.

## Stop

STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW. Cursor setzt nicht Ready, mergt nicht, startet keinen Folgeslice und keinen weiteren Agenten.
