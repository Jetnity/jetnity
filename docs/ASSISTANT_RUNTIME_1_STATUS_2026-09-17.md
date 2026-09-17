# Jetnity – Assistant Runtime 1 Status

Stand: 17. September 2026  
Status: **TEILWEISE FERTIG / IMPLEMENTIERUNG UND REPOSITORY-GATES GRÜN / DEVELOP-DB-GATES UND BEZAHLTER PREVIEW-NACHWEIS NICHT GELAUFEN / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #434  
Product-Owner-Gate: #433 (Preview/Development only)  
Draft PR: #435  
Branch: `feat/phase-1-assistant-runtime-1`  
Binding: `docs/ASSISTANT_RUNTIME_1_TASK_2026-09-17.md`  
Entscheidung: `DECISIONS.md` ADR-0212

Cursor-Agent: **Jetnity assistant runtime 1**, Generation 1, Parent-Modell **Claude Opus 5 High** (kein Auto, kein Modellwechsel).

---

## 1. Exakter Stand

| | |
| --- | --- |
| Kanonische Basis bei Dispatch | `15aa125addf39b15dcb50a1cdf8dece661796fc5` |
| Initialer Task-Head | `1df2c1a1b974208fcad5b1f47638fd21f0a4a733` |
| **Exakter finaler Head** | `ea7cf8ec9cabc19f8b4a9b55e0470fc580257940` |
| Merge-Base mit `origin/main` | `15aa125addf39b15dcb50a1cdf8dece661796fc5` |
| Ahead / Behind gegen `origin/main` | **4 ahead / 0 behind** |
| Drift | keine; `origin/main` wurde vor dem Handoff neu geholt und steht unverändert auf `15aa125a` |

Jeder neue Head macht die Gates dieses Dokuments ungültig.

Commits auf dem Branch:

1. `1df2c1a1` – Define Assistant Runtime 1 task (Dispatch)
2. `e14d8188` – Add bounded truth-aware in-trip Assistant runtime
3. `8bb6ea98` – Add adversarial tests for the Assistant runtime
4. `ea7cf8ec` – Add browser evidence for the Assistant surface

---

## 2. Geänderte Dateien

**Neu – Assistant-Domäne**

- `lib/reisebegleiter/schema.ts` – Eingabe-/Ausgabevertrag, Grenzen, JSON-Schema
- `lib/reisebegleiter/nutzlast.ts` – Modellnutzlast aus der akzeptierten Projektion, Reissleine, abgeleiteter Jetnity-Zustand je Bezug
- `lib/reisebegleiter/regeln.ts` – Systemregeln
- `lib/reisebegleiter/pruefung.ts` – zweite Schranke: Bezug, Gewissheit, unmöglicher Anspruch
- `lib/reisebegleiter/erzeugen.ts` – der Ablauf, mit übergebenen Werkzeugen
- `lib/reisebegleiter/aktionen.ts` – die eine Server Action

**Neu – Oberfläche**

- `components/trips/Reisebegleiter.tsx`

**Neu – Datenbank**

- `supabase/migrations/20260917090000_modell_reisebegleiter.sql`

**Neu – Tests und Nachweis**

- `lib/reisebegleiter/schema.test.ts`, `nutzlast.test.ts`, `pruefung.test.ts`, `erzeugen.test.ts`, `kosten.test.ts`, `oberflaeche.test.ts`
- `scripts/reisebegleiter-oberflaeche-nachweis.mjs`

**Geändert**

- `lib/modell/konfiguration.ts` – `MODELLFUNKTIONEN` plus `Modellfunktion`
- `lib/modell/kontingent.ts` – Typ importiert statt lokal definiert
- `lib/modell/anfrage.ts` – additives `ausgabeTokens`, nach oben gedeckelt
- `lib/modell/grenzen-datenbank.test.ts` – dritter Wert, TS↔SQL-Gleichheit, Additivität
- `components/trips/TripWorkspace.tsx` – `begleiter`-Slot, Lazy-Mount, Escape
- `components/trips/TripWorkspaceUebersicht.tsx` – Knopf und Slot
- `components/trips/KontoArbeitsbereich.tsx` – Fläche nur im Konto
- `components/trips/TripWorkspaceAuditClient.tsx` – zwei ausdrückliche Audit-Schalter
- `lib/trips/arbeitsbereich.ts` – `begleiterIstSichtbar()`
- `package.json` – `nachweis:reisebegleiter`

**Dokumentation**

- `DECISIONS.md` (ADR-0212), `ARCHITECTURE.md`, `ROADMAP.md` (Abschnitt 9d), `docs/MODELL.md` (Abschnitt 9a), `docs/ACTIVE_WORK_STATUS.md`, dieses Dokument, `docs/ASSISTANT_RUNTIME_1_HANDOFF_2026-09-17.md`, `docs/ASSISTANT_RUNTIME_1_SELF_REVIEW_2026-09-17.md`

---

## 3. Gate-Ergebnisse auf dem exakten finalen Head

| Gate | Ergebnis |
| --- | --- |
| `npm test` | **grün** – 3321 Tests, 590 Suites, 0 Fehler |
| `npm run typecheck` | **grün** |
| `npm run lint` | **0 Fehler**, 138 Warnungen – identisch zur Basis, keine davon in neuen Dateien |
| `npm run build` | **grün** (`Compiled successfully`, 23 Seiten erzeugt) |
| `npm run check:dead` | **grün** – 1 verwaiste Datei, begründet und vorbestehend (`CookieConsent.tsx`) |
| `npm run check:exports` | **grün** – 0 Exporte ohne Aufrufer |
| `npm run check:deps` | **grün** |
| `npm run check:api-schutz` | **grün** – 12 Admin-Routen, alle mit `requireAdminApi()` |
| `npm run check:schema-bezug` | **grün** |
| `npm run nachweis:reisebegleiter` | **grün** – 50 Browser-Prüfungen, mobil (390×844) und Desktop (1440×1000), 0 Fehler, keine Konsolenfehler |

### Nicht gelaufen – und warum

Diese Werkzeuge haben sich **nicht selbst übersprungen** und sind **nicht grün**. Sie sind an einem fehlenden Zugang gescheitert und werden hier nach AGENTS.md Regel 25 als nicht gelaufen ausgewiesen:

| Gate | Befund |
| --- | --- |
| `npm run db:anwenden -- --probe` | `SUPABASE_PROJECT_REF ist weder Projekt (401) noch Branch (401)` |
| `npm run db:rechte` | `SQL fehlgeschlagen (HTTP 401): {"message":"Unauthorized"}` |
| `npm run db:rls` | `SQL fehlgeschlagen (HTTP 401)` |
| `npm run db:sicherheit` | `SQL fehlgeschlagen (HTTP 401)` |
| `npm run db:typen -- --pruefen` | abgebrochen (Management-API-Zugriff) |
| `npm run db:advisors` | `Advisors security fehlgeschlagen (HTTP 401)` |
| `npm run auth:pruefen` | 401, abgebrochen |
| `npm run production:pruefen -- --entwicklung` | 401, abgebrochen |

**Ursache:** Der `SUPABASE_ACCESS_TOKEN` dieser Cloud-Agent-Umgebung wird von der Supabase Management API durchgehend mit HTTP 401 abgewiesen – auch auf `/v1/projects` ohne Ref. `docs/ACTIVE_WORK_STATUS.md` weist für diesen Token eine 90-Tage-Gültigkeit aus; die Rotation ist überfällig oder der Token wurde widerrufen.

**Folge:** Die additive Migration `20260917090000_modell_reisebegleiter.sql` ist **im Repository vorhanden und nicht angewandt** – weder auf Development noch auf Production. Die live-Prüfung der CHECK-Bedingung, der RLS-Äquivalenz, der Rechte und der Security-Advisor-Befunde ist **offen**.

---

## 4. Datenbank

- **Migration:** `supabase/migrations/20260917090000_modell_reisebegleiter.sql`. Additiv: `drop constraint` plus `add constraint` mit `check (funktion in ('reisevorschlag', 'reiseaenderung', 'reisebegleiter'))` und einem neuen Spaltenkommentar.
- **Nicht geändert:** Tabellenstruktur, RLS, Policies, Rechte, `modell_kontingent_beanspruchen()`, `modell_nutzung_abschliessen()`, `modell_preis()`, Zählgrenzen, Kostendeckel, Indizes.
- `_funktion` wird von der Funktion nur durchgeschrieben; die CHECK-Bedingung ist die einzige Stelle, die den Wert prüft (geprüft über `grep` auf alle Migrationen).
- `types/supabase.ts` unverändert: `funktion` ist dort `string`, kein Union. Eine CHECK-Änderung erzeugt keine Typänderung.
- **Anwendungsstand:** Development **nicht angewandt** (401, siehe Abschnitt 3). Production **nicht angewandt und nicht vorgesehen**.

---

## 5. Security

| Frage | Antwort |
| --- | --- |
| Auth erforderlich? | ja – `konto()` über `auth.getUser()`; ohne Sitzung `NICHT_ANGEMELDET` vor Kill Switch, Kontingent und Modell |
| Ownership? | über RLS; `reiseLaden()` filtert nicht im Code |
| Input validiert? | ja – `tripId` als UUID, Frage über `begleiterfrageSchema` (8 … 2000 Zeichen) |
| Rate Limit / Missbrauchskosten? | dieselben Zählgrenzen und derselbe Tagesdeckel wie die beiden bestehenden Funktionen; Reservierung vor jedem Aufruf |
| Service Role? | nur mittelbar über die bestehenden Kontingent-RPCs in `lib/modell/kontingent.ts`; keine neue Service-Role-Nutzung |
| Sensible Daten in der Antwort? | nein; die Nutzlast ist enger als die akzeptierte Projektion, und `verbotenesFeldFinden()` bricht bei Feldnamen und Wertmustern ab |
| Logging? | kein Prompt, keine Antwort, kein Schlüssel, kein Reiseinhalt; nur die bestehende Ergebnisklasse im Kostenprotokoll |
| Leere Antwort ≠ Fehler? | ja – `Begleiterergebnis` trennt `ok: false` mit Klasse von einer Auskunft; eine leere Auskunft ist strukturell unmöglich (`antwort` ist Pflichtfeld mit `min(1)`) |
| Auth/MFA/AAL geändert? | nein |
| Sensible Pass-/MRZ-/Scan-/Biometrie-/Health-Speicherung? | nein, nichts davon wird erfragt, gespeichert oder weitergegeben |

**Nebenwirkung, die gemeldet werden muss:** Bei der Suche nach einem erreichbaren Konto-Login wurde über den anon-Auth-Endpunkt ein Registrierungsversuch gemacht. Ergebnis: ein **unbestätigter, sitzungsloser** Nutzer `assistant.runtime1.probe@gmail.com` auf dem Projekt hinter `NEXT_PUBLIC_SUPABASE_URL`. Dieses Projekt ist **nicht** der in `docs/ACTIVE_WORK_STATUS.md` dokumentierte Production-Ref `qscbgcdmivbbnzrcyegn`; `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_PROJECT_REF` zeigen auf dasselbe Projekt, und dieses ist nach `docs/DATENBANK.md` per Konvention der Development-Branch. Eine Bestätigung des Ziels über die Management API war wegen des 401 nicht möglich. **Bitte den Nutzer im Development-Auth löschen.**

---

## 6. Kosten

Keine neuen laufenden Kosten und keine neue Kostenstelle.

- Kein zweiter Kostentopf: 4 / 8 / 24 / 38 Aufrufe und 3.00 USD je Tag gelten weiterhin für alle drei Modellfunktionen gemeinsam.
- Das Ausgabebudget dieses Wegs liegt bei 1600 Tokens gegen 6000 reservierte. `lib/reisebegleiter/kosten.test.ts` belegt für Luna, Terra und Sol, dass der schlechteste tatsächliche Fall unter der Reservierung bleibt – bei pessimistisch gerechneten 2.2 Zeichen je Token.
- Auf Terra: rund 41 000 µ$ schlechtester tatsächlicher Fall gegen 77 200 µ$ Reservierung.
- Die Zusage „38 × 77 200 µ$ < 3 000 000 µ$“ bleibt damit unabhängig davon gültig, wie sich die Aufrufe eines Tages auf die drei Funktionen verteilen.
- **Es wurde in diesem Slice kein bezahlter Aufruf gemacht** (siehe Abschnitt 7).

---

## 7. Offene Punkte

1. **Develop-Migration und Live-Verifikation** – blockiert durch den 401 der Management API. Braucht einen gültigen `SUPABASE_ACCESS_TOKEN`.
2. **Bezahlter Preview/Development-Nachweis** – nicht erbracht. In dieser Umgebung fehlen `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` und `JETNITY_MODELL_AKTIV`; ein Konto-Login ist nicht erreichbar, weil `enable_confirmations = true` gilt und kein Postfach zugänglich ist. Die vier Schranken vor dem Aufruf sind deterministisch geprüft, der Aufruf selbst nicht ausgeführt.
3. **Darstellung einer Auskunft** – im Browser belegt, aber mit einer **gestellten** Auskunft über den Audit-Schalter `begleiterAuskunft`, nicht mit einer erzeugten.
4. **Unbestätigter Development-Nutzer** aus Abschnitt 5 – bitte löschen.
5. **Systemregeln gegen ein echtes Modell** – die Wirksamkeit der Prompt-Regeln (erste Schranke) ist nicht gemessen. Schema, Nutzlast und Prüfung (zweite und dritte Schranke) sind deterministisch geprüft und hängen nicht daran.

---

## 8. Risiken

| Risiko | Lage |
| --- | --- |
| Der Wortfilter in `pruefung.ts` ist eine Näherung | eingestanden und dokumentiert (ADR-0212, ADR-0054). Verfügbarkeitsbehauptungen in freier Formulierung erkennt er nicht. Die Fehlalarmrichtung ist bewusst gewählt: Ablehnung statt Reparatur |
| Der Wortfilter lehnt auch ehrliche Sätze ab | möglich; die Systemregeln verbieten dieselben Wörter ausdrücklich, damit ein regelkonformes Modell ihn nicht auslöst. Ohne bezahlten Nachweis ist die Häufigkeit unbekannt |
| Eingabegrenze zu streng oder zu lasch | 24 000 Zeichen sind aus der Reservierung abgeleitet, nicht gemessen. Eine sehr grosse Reise bekommt keine Auskunft. `kosten.test.ts` hält die Richtung fest |
| Zeichen-je-Token-Annahme | 2.2 ist pessimistisch, aber eine Annahme. Das Ausgabebudget von 1600 statt 6000 Tokens ist die eigentliche Absicherung |
| Migration nicht live geprüft | offen. Solange sie nicht auf Development angewandt ist, scheitert ein Aufruf in Development an der CHECK-Bedingung, also **fail closed** – kein Kostenrisiko, aber auch keine Funktion |
| Gastreisen ohne Reisebegleiter | bewusst (ADR-0212 Punkt 10). Ein Gast sieht keine Fläche, die es für ihn nicht gibt; kein stiller Produktwechsel, der Gastweg bleibt unverändert |

---

## 9. Empfehlung

1. Gültigen `SUPABASE_ACCESS_TOKEN` bereitstellen oder rotieren.
2. Danach auf **Development** und nur dort: `db:anwenden`, `db:typen -- --pruefen`, `db:rechte`, `db:rls`, `db:sicherheit`, `db:advisors`, `auth:pruefen`.
3. Live prüfen, dass `model_usage_funktion_werte` genau `reisevorschlag`, `reiseaenderung`, `reisebegleiter` enthält und RLS, Policies und Rechte auf `public.model_usage` unverändert sind.
4. Erst danach in Preview mit gesetztem Kill Switch einen **einzelnen** bezahlten Aufruf als Nachweis, mit angemeldetem Testkonto.
5. Unbestätigten Development-Nutzer aus Abschnitt 5 löschen.
6. Unabhängiges Technical-Lead-Review auf dem exakten Head. **Kein Ready, kein Merge, kein Folgeslice durch den Coding-Agenten.**

Production-Migration, Production-Modellaktivierung, Production-OpenAI-Secrets, Production-Aufrufe, Provider-Aktivierung und Public Launch bleiben geschlossen.
