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
| Kanonische Basis | `main@15aa125addf39b15dcb50a1cdf8dece661796fc5` |
| **Letzter laufzeitändernder Head** | `ea7cf8ec9cabc19f8b4a9b55e0470fc580257940` |
| **Exakter finaler Head** | Kopf dieses Branches: Dokumentations-Commit über `ea7cf8ec`, ohne Laufzeitänderung. Kennung über `git rev-parse origin/feat/phase-1-assistant-runtime-1`; im Abschlussbericht des Agenten genannt |
| Merge-Base | `15aa125addf39b15dcb50a1cdf8dece661796fc5` |
| Behind | 0 gegen `origin/main` |
| Drift | keine |
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

---

## 4. Gates auf dem exakten Head

**Grün:** `npm test` (3321/3321), `typecheck`, `lint` (0 Fehler), `build`, `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`, `nachweis:reisebegleiter` (50 Browser-Prüfungen, mobil und Desktop).

**Grün auf dem exakten Head in GitHub/Vercel:** CI-Run `35165950349` – **success**, beide Jobs. Darin `auth:pruefen` mit „55 Werte, 243 Schlüssel am Branch". Vercel Preview `6kbzcUP3CDzhXkkkj3owzz4bQB3v` – **READY**.

**Nicht gelaufen** – nicht übersprungen, sondern an einem fehlenden Zugang gescheitert:

`db:anwenden`, `db:rechte`, `db:rls`, `db:sicherheit`, `db:typen --pruefen`, `db:advisors`, `production:pruefen`.

Ursache: Der `SUPABASE_ACCESS_TOKEN` **dieser Agent-Umgebung** wird von der Supabase Management API mit **HTTP 401** abgewiesen, auch auf `/v1/projects` ohne Ref. Der **Token der CI ist gültig** – `auth:pruefen` läuft dort auf demselben Head durch. Wer die DB-Gates nachholt, braucht denselben Token.

**Kein bezahlter Aufruf gemacht.** In dieser Umgebung fehlen `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` und `JETNITY_MODELL_AKTIV`; ein Konto-Login ist nicht erreichbar (`enable_confirmations = true`, kein Postfach).

---

## 5. Der exakte nächste Schritt

**Unabhängiges Technical-Lead-Review auf dem exakten finalen Head dieses Branches.** Die Laufzeit steht auf `ea7cf8ec9cabc19f8b4a9b55e0470fc580257940`; darüber liegt ausschliesslich Dokumentation.

Danach, in dieser Reihenfolge:

1. Gültigen `SUPABASE_ACCESS_TOKEN` bereitstellen – derselbe, den die CI benutzt.
2. `npm run db:anwenden` – **nur Development**. Production bleibt geschlossen.
3. `npm run db:typen -- --pruefen`, `db:rechte`, `db:rls`, `db:sicherheit`, `db:advisors`, `auth:pruefen`.
4. Live prüfen: `model_usage_funktion_werte` enthält genau `reisevorschlag`, `reiseaenderung`, `reisebegleiter`; RLS, Policies und Rechte auf `public.model_usage` unverändert.
5. Erst dann in Preview ein **einzelner** bezahlter Aufruf mit angemeldetem Testkonto als Nachweis.
6. Unbestätigten Development-Nutzer `assistant.runtime1.probe@gmail.com` löschen (siehe unten).

---

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

## 7. Meldepflichtige Nebenwirkung

Bei der Suche nach einem erreichbaren Konto-Login entstand über den anon-Auth-Endpunkt ein **unbestätigter, sitzungsloser** Nutzer:

`assistant.runtime1.probe@gmail.com`

Das Zielprojekt ist **nicht** der in `docs/ACTIVE_WORK_STATUS.md` dokumentierte Production-Ref `qscbgcdmivbbnzrcyegn`. `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_PROJECT_REF` zeigen auf dasselbe Projekt, und dieses ist nach `docs/DATENBANK.md` per Konvention der Development-Branch. Eine Bestätigung über die Management API war wegen des 401 nicht möglich. **Bitte löschen.**

---

## 8. Governance

- Agent-Self-Review ist **kein** Technical-Lead-PASS.
- Der PR bleibt Draft. Nur ChatGPT / Technical Lead darf Ready setzen oder mergen.
- Eine Merge-Entscheidung ist keine Freigabe für Production-Migration, Provider-Aktivierung, Secrets oder neue Kosten.
- Kein Folgeslice ist gestartet und keiner darf aus diesem Stand automatisch abgeleitet werden.
