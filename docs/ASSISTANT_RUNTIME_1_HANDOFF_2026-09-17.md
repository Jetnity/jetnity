# Jetnity – Assistant Runtime 1 Handoff

Stand: 17. September 2026  
Status: **STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Dieses Dokument reicht, um ohne den Chat weiterzuarbeiten. Ausführlicher Stand: `docs/ASSISTANT_RUNTIME_1_STATUS_2026-09-17.md`.

---

## 1. Wo der Stand liegt

| | |
| --- | --- |
| Issue | #434 |
| Product-Owner-Gate | #433 – **Preview/Development only** |
| Draft PR | #435 |
| Branch | `feat/phase-1-assistant-runtime-1` |
| Kanonische Basis bei Dispatch | `main@15aa125addf39b15dcb50a1cdf8dece661796fc5` |
| Aktuelle Basis | `main@aa6afaa6057f631ffb332e6feeda32a45c52fa47` – durch Merge integriert |
| **Letzter laufzeitändernder Head** | der Review-Fix „Replace the language denylist with a vocabulary allowlist“ |
| **Exakter finaler Head** | Kopf dieses Branches: Dokumentations-Commit über dem letzten Code-Commit, ohne Laufzeitänderung. Kennung über `git rev-parse origin/feat/phase-1-assistant-runtime-1`; im Abschlussbericht des Agenten genannt |
| Merge-Base | `aa6afaa6057f631ffb332e6feeda32a45c52fa47` |
| Behind | **0** gegen `origin/main` beim Handoff. Ahead steht hier nicht: Die Zahl ändert sich mit jedem Commit. Verbindlich ist der Live-Vergleich in PR #435 |
| Drift | keine. `main@aa6afaa6` ist per `git merge --no-ff` integriert – ohne Rebase und ohne Force-Push, damit die reviewte Exact-Head-Historie erhalten bleibt. Konfliktfrei, beide Seiten verlustfrei geprüft |
| Binding | `docs/ASSISTANT_RUNTIME_1_TASK_2026-09-17.md` |
| Entscheidung | `DECISIONS.md` ADR-0212 |

`origin/main` wurde vor dem Handoff erneut geholt. Jeder weitere Head macht alle Exact-Head-Gates ungültig.

---

## 2. Was ein neuer Agent zuerst lesen muss

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/ASSISTANT_RUNTIME_1_TASK_2026-09-17.md` – die verbindliche Aufgabe
4. `DECISIONS.md` ADR-0211 (akzeptierte Projektion) und ADR-0212 (dieser Slice)
5. `docs/MODELL.md` Abschnitt 9a – die dritte Modellfunktion
6. `docs/ASSISTANT_RUNTIME_1_STATUS_2026-09-17.md` – Gates, offene Punkte, Risiken
7. `docs/ASSISTANT_RUNTIME_1_SELF_REVIEW_2026-09-17.md` – adversariales Selbstreview
8. `ROADMAP.md` Abschnitt 9d
9. `docs/ACTIVE_WORK_STATUS.md`

---

## 3. Was gebaut ist

Ein bounded, truth-aware In-Trip-Assistant, der **generierte Vorschläge** erzeugt und keine Wahrheit.

```
Frage (Konto-Reise)
  → begleiterfrageSchema            8 … 2000 Zeichen
    → modellZustand()               Kill Switch, Schlüssel, Modell
      → begleiternutzlastAus()      nur aus der akzeptierten Projektion, nur enger
        → verbotenesFeldFinden()    Reissleine über Feldnamen und Wertmuster
          → Eingabegrösse           ≤ 24 000 Zeichen, sonst keine Auskunft
            → kontingentBeanspruchen('reisebegleiter', …)
              → modellAufrufen()    max_output_tokens 1600
                → nutzungAbschliessen()
                  → JSON, Schema, auskunftPruefen()
                    → Anzeige mit „Jetnity-Stand dazu"
```

Der entscheidende Punkt: **Das Modell liefert Zeiger, nicht Zustände.** Was unter „Jetnity-Stand dazu" steht – „Noch nicht verlässlich bestimmbar", „nicht geprüft" – leitet `lib/reisebegleiter/nutzlast.ts` aus derselben Projektion ab. Ein Modell, das den Zustand nicht formulieren darf, kann ihn nicht verfälschen.

Der zweite Punkt, aus sechs Review-Runden gewachsen: **Eine harte amtliche Aussage braucht eine passende geprüfte Grundlage – und der Text, in dem sie steht, muss aus Wörtern bestehen, die Jetnity führt.** Der Wortschatz ist eine **Erlaubnisliste** (`lib/reisebegleiter/wortschatz.ts`): der geführte Register, jedes Wort aus dem serverseitig abgeleiteten Kontext, Zahlen – alles andere verwirft die Auskunft, in jedem Modellfeld. Darüber liegt die inhaltliche Prüfung: Modalität × Bereich × Vorbehalt über der ganzen `OFFICIAL_REQUIREMENT_TYPES`-Taxonomie, für Behauptung wie Verneinung. Ohne aktiven Provider ist kein Official-Bezug `belegt` – die Prüfung ist damit eine vollständige Sperre gegen amtliche Aussagen, und das ist der vorgesehene Zustand.

---

## 4. Gates auf dem exakten Head

**Grün:** `npm test` (3601/3601), `typecheck`, `lint` (0 Fehler), `build`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `nachweis:reisebegleiter` (75 Browser-Prüfungen bei 390, 1280 und 1440 px).

**Grün auf dem exakten Head in GitHub/Vercel:** CI **success** in beiden Jobs, darin `auth:pruefen` mit „55 Werte, 243 Schlüssel am Branch"; Vercel Preview **READY**. Exact-Head-Kennungen von CI und Vercel stehen **nicht** in diesem Dokument: Jeder Commit, der sie festhielte, wäre ein neuer Head und machte sie im selben Moment ungültig. Die Kennungen des jeweils aktuellen Kopfes stehen in den Checks von PR #435; der Abschlussbericht des Agenten nennt sie für den Head, auf dem er endet.

**Nicht gelaufen** – nicht übersprungen, sondern an einem fehlenden Zugang gescheitert:

`db:anwenden`, `db:rechte`, `db:rls`, `db:sicherheit`, `db:typen --pruefen`, `db:advisors`, `production:pruefen`.

Ursache: Der `SUPABASE_ACCESS_TOKEN` **dieser Agent-Umgebung** wird von der Supabase Management API mit **HTTP 401** abgewiesen, auch auf `/v1/projects` ohne Ref. Der **Token der CI ist gültig** – `auth:pruefen` läuft dort auf demselben Head durch.

**Das Develop-DB-Gate ist inzwischen geschlossen, aber nicht vom Agenten:** Der Technical Lead hat Migration, Live-CHECK, RLS, Policy, Rechte und Advisors im Re-Review auf `3775d980` selbst geprüft (Abschnitt 5 und `docs/ASSISTANT_RUNTIME_1_STATUS_2026-09-17.md` Abschnitt 4).

**Kein bezahlter Aufruf gemacht.** In dieser Umgebung fehlen `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` und `JETNITY_MODELL_AKTIV`; ein Konto-Login ist nicht erreichbar (`enable_confirmations = true`, kein Postfach). Der Punkt bleibt offen und wird nicht erfunden.

---

## 5. Der exakte nächste Schritt

**Unabhängiges Technical-Lead-Re-Review auf dem exakten finalen Head dieses Branches.**

Erledigt und **nicht zu wiederholen** – der Technical Lead hat das Develop-DB-Gate im Re-Review auf `3775d980` unabhängig abgeschlossen: Migration `20260917090000` auf Development angewandt, Live-CHECK exakt `reisevorschlag` / `reiseaenderung` / `reisebegleiter`, RLS eingeschaltet, Policy `model_usage_lesen` unverändert, Rechte unverändert, Advisors ohne neuen Befund, `model_usage` 0 Zeilen auf beiden Umgebungen, Migrationshistorie auf die Repository-Fassung korrigiert, Probe-Nutzer gelöscht. Production unverändert. **Migration nicht erneut anwenden, Production nicht anfassen.**

Offen bleibt genau eines:

1. **Ein einzelner gebundener bezahlter Aufruf in Preview/Development.** In dieser Agent-Umgebung nicht erreichbar: Es gibt genau vier Secrets (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`); `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` und `JETNITY_MODELL_AKTIV` fehlen. Ohne Service-Role-Key ist selbst die Kostenreservierung unerreichbar (`modell_kontingent_beanspruchen` ist `service_role`-only). Der Weg über die laufende Vercel-Preview scheitert an der Anmeldung: nur Konto-Reisen, `enable_confirmations = true`, kein Postfach, und ein zweites Probe-Konto ist untersagt. Nichts davon wurde umgangen, erweitert oder erfunden.

Wer diesen Nachweis holt, braucht eine bestätigte Testanmeldung in der Preview und die dort bereits gesetzte Modellkonfiguration – beides liegt beim Technical Lead, nicht beim Agenten.

## 6. Was bewusst nicht gebaut wurde

- kein Gast-Reisebegleiter (ADR-0212 Punkt 10) – Gastreisen bleiben unverändert planbar und änderbar, sehen aber keine Fläche
- kein Gesprächsverlauf, kein Speichern einer Auskunft
- kein Auto-Apply eines Vorschlags
- kein zweiter Kostentopf
- kein eigener Modellrouter, kein Fallback, keine Wiederholung
- kein schwebender Chat, kein neuer Hauptbereich – `ARBEITSBEREICHE` ist unverändert
- kein Provider-Abruf: Official/Safety/Seasonal kommen aus den provider-freien lokalen Auswertungen
- keine Änderung an Auth, MFA, AAL, Sitzungen, Traveller-/Dokument-Persistenz
- keine Production-Migration, keine Production-Aktivierung, keine Production-Secrets

---

## 7. Meldepflichtige Nebenwirkung – erledigt

Bei der Suche nach einem erreichbaren Konto-Login entstand über den anon-Auth-Endpunkt ein unbestätigter, sitzungsloser Nutzer `assistant.runtime1.probe@gmail.com` auf dem Development-Projekt.

Der Technical Lead hat ihn geprüft – kein Profil, keine Reisen, keine Account-Traveller – und **gelöscht**; Nachzählung 0. Kein weiteres Probe-Konto wurde angelegt.

---

## 8. Governance

- Agent-Self-Review ist **kein** Technical-Lead-PASS.
- Der PR bleibt Draft. Nur ChatGPT / Technical Lead darf Ready setzen oder mergen.
- Eine Merge-Entscheidung ist keine Freigabe für Production-Migration, Provider-Aktivierung, Secrets oder neue Kosten.
- Kein Folgeslice ist gestartet und keiner darf aus diesem Stand automatisch abgeleitet werden.
