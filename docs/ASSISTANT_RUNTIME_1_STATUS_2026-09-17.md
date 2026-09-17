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
| Kanonische Basis bei Dispatch | `15aa125addf39b15dcb50a1cdf8dece661796fc5` (historisch; inzwischen durch Rebase und Merge abgelöst) |
| Initialer Task-Head | `1df2c1a1b974208fcad5b1f47638fd21f0a4a733` |
| **Letzter laufzeitändernder Head** | der Review-Fix „Replace free prose with selection from Jetnity-owned catalogues“ (Runde 9) |
| Merge-Base mit `origin/main` | `aa6afaa6057f631ffb332e6feeda32a45c52fa47` – `main` wurde in den Branch **gemergt**, nicht rebased |
| Behind gegen `origin/main` | **0** – geprüft beim letzten Handoff. Die Ahead-Zahl steht hier nicht: Sie ändert sich mit jedem Commit, auch mit dem, der sie festhielte. Verbindlich ist der Live-Vergleich in PR #435 |
| Drift | **keine.** `origin/main` war auf `aa6afaa6` gewandert (Realistic World Cartography 1, Guardian-Governance, V1-Account/Privacy/Ops-Audit, Explicit Visit History 1 – 41 Commits). Integriert durch `git merge --no-ff`, ausdrücklich **ohne** Rebase oder Force-Push, damit die bereits reviewte Exact-Head-Historie erhalten bleibt |

Der **exakte finale Head** ist der Kopf dieses Branches. Er liegt als
Dokumentations-Commit über dem letzten Code-Commit und ändert keine Laufzeit:
Die Commits darüber berühren nur `docs/`, `DECISIONS.md`, `ARCHITECTURE.md`
und `ROADMAP.md`.
Ein Dokument kann seine eigene Commit-Kennung nicht enthalten; die finale
Kennung ist mit `git rev-parse origin/feat/phase-1-assistant-runtime-1` zu lesen
und im Abschlussbericht des Agenten genannt.
Die Gates in Abschnitt 3 wurden auf dem Arbeitsstand des finalen
Dokumentations-Commits erneut vollständig ausgeführt.

Jeder weitere Head macht die Gates dieses Dokuments ungültig.

Commits auf dem Branch:

1. `1df2c1a1` – Define Assistant Runtime 1 task (Dispatch)
2. `e14d8188` – Add bounded truth-aware in-trip Assistant runtime
3. `8bb6ea98` – Add adversarial tests for the Assistant runtime
4. `ea7cf8ec` – Add browser evidence for the Assistant surface
5. Review-Fix 1: Gewissheit an die genannte amtliche Lage gebunden
6. Review-Fix 2: unerwartete Ausgabefelder werden abgelehnt
7. Review-Fix 3: Gewissheit an den passenden Anforderungstyp gebunden
8. Review-Fix 4: harte amtliche Aussagen über die ganze Anforderungstaxonomie
9. Integration von `main@aa6afaa6`
10. Review-Fix 5: Antwortsprache als Vertrag (durch Fix 6 ersetzt)
11. Review-Fix 6: Wortschatz als Erlaubnisliste über allen Modellfeldern (durch Fix 7 ersetzt)
12. Review-Fix 7: getrennte Kanäle – Prosa ohne amtliches Vokabular (durch Fix 8 ersetzt)
13. Review-Fix 8: kein Freitextfeld mehr – Auswahl aus Jetnity-Katalogen statt Formulierung
14. dazwischen und darüber: Dokumentation, ohne Laufzeitänderung

Die Commit-Kennungen der Runden 1–4 haben sich durch den Rebase auf `main@03842a64` geändert; Reihenfolge und Inhalte sind unverändert. Seither wird `main` gemergt und nicht mehr rebased, damit die reviewte Historie erhalten bleibt.

---

## 2. Geänderte Dateien

**Neu – Assistant-Domäne**

- `lib/reisebegleiter/schema.ts` – Eingabe-/Ausgabevertrag, Grenzen, JSON-Schema
- `lib/reisebegleiter/nutzlast.ts` – Modellnutzlast aus der akzeptierten Projektion, Reissleine, abgeleiteter Jetnity-Zustand je Bezug
- `lib/reisebegleiter/regeln.ts` – Systemregeln
- `lib/reisebegleiter/pruefung.ts` – zweite Schranke: Bezug, Gewissheit, unmöglicher Anspruch
- `lib/reisebegleiter/wortschatz.ts` – die Erlaubnisliste: der geführte Register plus der serverseitig abgeleitete Kontext
- `lib/reisebegleiter/erzeugen.ts` – der Ablauf, mit übergebenen Werkzeugen
- `lib/reisebegleiter/aktionen.ts` – die eine Server Action

**Neu – Oberfläche**

- `components/trips/Reisebegleiter.tsx`

**Neu – Datenbank**

- `supabase/migrations/20260917090000_modell_reisebegleiter.sql`

**Neu – Tests und Nachweis**

- `lib/reisebegleiter/schema.test.ts`, `nutzlast.test.ts`, `pruefung.test.ts`, `erzeugen.test.ts`, `kosten.test.ts`, `oberflaeche.test.ts`, `wortschatz.test.ts`
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
| `npm test` | **grün** – 3601 Tests, 621 Suites, 0 Fehler (einschliesslich aller von `main` übernommenen Tests) |
| `npm run typecheck` | **grün** |
| `npm run lint` | **0 Fehler**, 139 Warnungen – exakt die Baseline von `origin/main` (dort gemessen), keine davon in neuen Dateien |
| `npm run build` | **grün** (`Compiled successfully`, 23 Seiten erzeugt) |
| `npm run check:dead` | **grün** – 1 verwaiste Datei, begründet und vorbestehend (`CookieConsent.tsx`) |
| `npm run check:exports` | **grün** – 0 Exporte ohne Aufrufer |
| `npm run check:deps` | **grün** |
| `npm run check:api-schutz` | **grün** – 12 Admin-Routen, alle mit `requireAdminApi()` |
| `npm run check:schema-bezug` | **grün** |
| `npm run nachweis:reisebegleiter` | **grün** – 75 Browser-Prüfungen bei 390×844, 1280×900 und 1440×1000, 0 Fehler, keine Konsolenfehler |
| GitHub Actions auf dem exakten Head | **success** – beide Jobs: `Typecheck, Lint & Build` und `Auth-Konfiguration gegen config.toml` |
| `npm run auth:pruefen` | **grün in der CI** auf jedem exakten Head: „Auth-Konfiguration geprüft: 55 Werte, 243 Schlüssel am Branch", alle vier Prüfungen ✓. Die CI hat einen gültigen `SUPABASE_ACCESS_TOKEN`; in dieser Cloud-Agent-Umgebung schlägt derselbe Aufruf mit 401 fehl |
| Vercel Preview auf dem exakten Head | **READY** |

Exact-Head-Kennungen von CI und Vercel stehen **nicht** in diesem Dokument: Jeder Commit, der sie festhielte, wäre ein neuer Head und machte sie im selben Moment ungültig. Die Kennungen des jeweils aktuellen Kopfes stehen in den Checks von PR #435; der Abschlussbericht des Agenten nennt sie für den Head, auf dem er endet.

### Integration von `main@aa6afaa6`

Verlustfrei in beide Richtungen, geprüft und nicht behauptet:

| Prüfung | Ergebnis |
| --- | --- |
| Konflikte beim Merge | **keine**, auch nicht in `package.json` |
| Skripte aus `origin/main` in `package.json` | alle 45 vorhanden und wortgleich; `dependencies` und `devDependencies` identisch |
| Zusatz des Slices | genau einer: `nachweis:reisebegleiter` |
| `supabase/migrations/20260917120000_account_visits.sql` | byte-identisch mit `origin/main` |
| `types/supabase.ts` | byte-identisch mit `origin/main` |
| `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `JETNITY_START_HERE.md` | byte-identisch mit `origin/main` |
| `lib/account/besuche.ts`, `welt-geometrie.ts`, `world-map-geografie.ts` | byte-identisch mit `origin/main` |
| Diff gegen `origin/main` | enthält ausschliesslich den Assistant-Slice (34 Dateien) |

Guardian-/Grok-Governance wurde gelesen und **nicht verändert**. Sie ändert an der Cursor-Autorität nichts: kein Ready, kein Merge, kein Folgeslice.

### Nicht gelaufen – und warum

Diese Werkzeuge haben sich **nicht selbst übersprungen** und sind **nicht grün**. Sie sind an einem fehlenden Zugang gescheitert und werden hier nach AGENTS.md Regel 25 als nicht gelaufen ausgewiesen:

| Gate | Befund |
| --- | --- |
| `npm run db:anwenden -- --probe` | `SUPABASE_PROJECT_REF ist weder Projekt (401) noch Branch (401)` – **vom Technical Lead unabhängig nachgeholt**, siehe Abschnitt 4 |
| `npm run db:rechte` | `SQL fehlgeschlagen (HTTP 401): {"message":"Unauthorized"}` |
| `npm run db:rls` | `SQL fehlgeschlagen (HTTP 401)` |
| `npm run db:sicherheit` | `SQL fehlgeschlagen (HTTP 401)` |
| `npm run db:typen -- --pruefen` | abgebrochen (Management-API-Zugriff) |
| `npm run db:advisors` | `Advisors security fehlgeschlagen (HTTP 401)` |
| `npm run production:pruefen -- --entwicklung` | 401, abgebrochen |

**Ursache:** Der `SUPABASE_ACCESS_TOKEN` **dieser Cloud-Agent-Umgebung** wird von der Supabase Management API durchgehend mit HTTP 401 abgewiesen – auch auf `/v1/projects` ohne Ref.

**Der Token der CI ist gültig.** `auth:pruefen` läuft im CI-Job auf demselben exakten Head durch und meldet 55 geprüfte Werte gegen `supabase/config.toml`. Der 401 ist damit kein Zustand des Projekts, sondern des Zugangs, der in diese Agent-Umgebung injiziert wird. Wer die DB-Gates nachholt, braucht denselben Token, den die CI benutzt.

**Folge:** Die additive Migration `20260917090000_modell_reisebegleiter.sql` ist **im Repository vorhanden und nicht angewandt** – weder auf Development noch auf Production. Die live-Prüfung der CHECK-Bedingung, der RLS-Äquivalenz, der Rechte und der Security-Advisor-Befunde ist **offen**.

---

## 4. Datenbank

- **Migration:** `supabase/migrations/20260917090000_modell_reisebegleiter.sql`. Additiv: `drop constraint` plus `add constraint` mit `check (funktion in ('reisevorschlag', 'reiseaenderung', 'reisebegleiter'))` und einem neuen Spaltenkommentar.
- **Nicht geändert:** Tabellenstruktur, RLS, Policies, Rechte, `modell_kontingent_beanspruchen()`, `modell_nutzung_abschliessen()`, `modell_preis()`, Zählgrenzen, Kostendeckel, Indizes.
- `_funktion` wird von der Funktion nur durchgeschrieben; die CHECK-Bedingung ist die einzige Stelle, die den Wert prüft (geprüft über `grep` auf alle Migrationen).
- `types/supabase.ts` unverändert: `funktion` ist dort `string`, kein Union. Eine CHECK-Änderung erzeugt keine Typänderung.

### Anwendungsstand – Development angewandt und verifiziert durch den Technical Lead

Der Coding-Agent konnte die Migration nicht anwenden (HTTP 401, Abschnitt 3). **Der Technical Lead hat das Gate im Re-Review auf `3775d980` unabhängig abgeschlossen.** Diese Zeilen geben seine Feststellungen wieder; sie stammen nicht aus einem Lauf des Agenten:

- Supabase **Development**: Migration exakt als Repository-Fassung `20260917090000 modell_reisebegleiter` verzeichnet.
- Live-`model_usage_funktion_werte` auf Development ist exakt `reisevorschlag`, `reiseaenderung`, `reisebegleiter`.
- RLS auf `public.model_usage` bleibt eingeschaltet.
- Policy bleibt `model_usage_lesen` für `authenticated` mit `darf_betrieb_lesen()`.
- Rechte unverändert gegenüber der Live-Baseline vor der Anwendung.
- Security-Advisors erneut gelesen: **kein neuer Assistant-spezifischer Leak-Befund**.
- `model_usage` hat auf Development und Production weiterhin **0 Zeilen**.
- Ein Versionsversatz des Supabase-Management-Werkzeugs wurde **nur in der Development-Migrationshistorie** von der temporären `20260917003925` auf die Repository-Fassung `20260917090000` korrigiert; die Live-Historie entspricht jetzt dem Dateinamen.
- Der unbestätigte Development-Auth-Nutzer `assistant.runtime1.probe@gmail.com` aus Abschnitt 5 wurde geprüft (kein Profil, keine Reisen, keine Account-Traveller) und **gelöscht**; Nachzählung 0.

- **Production:** unverändert, akzeptiert weiterhin nur `reisevorschlag` und `reiseaenderung`. **Keine Production-Migration angewandt.**

Die Migration darf **nicht erneut angewandt** werden.

---

### Supabase-Grenzen nach der Integration von `main@aa6afaa6`

| Umgebung | Assistant-Migration `20260917090000` | Explicit Visit History `20260917120000` |
| --- | --- | --- |
| Development | angewandt (Technical Lead, siehe oben) | angewandt (laut Technical Lead) |
| **Production** | **nicht angewandt, nicht vorgesehen** | angewandt nach ausdrücklicher PO-Freigabe |

In diesem Durchgang wurde **keine** Supabase-Mutation ausgeführt, weder auf Development noch auf Production, und keine Migration erneut angewandt.

**Live-Lesen war nicht möglich.** Der `SUPABASE_ACCESS_TOKEN` dieser Agent-Umgebung wird von der Management API weiterhin mit HTTP 401 abgewiesen – geprüft auf `/v1/projects`, `/v1/projects/{ref}` und `/v1/branches/{ref}`. Damit konnte der Development-Schema-/Migrationsstand hier nicht read-only verifiziert werden; die Feststellungen oben sind die des Technical Lead. Über die Datenebene ist es ebenfalls nicht erreichbar: `public.model_usage` hat für `anon` kein Recht, und `supabase_migrations.schema_migrations` liegt nicht auf PostgREST.

**Production-Assistant-Zustand, belegbar ohne Live-Zugang:**

- Der Branch wendet nichts an. Es gibt keinen Codepfad und kein Skript in diesem Slice, das Production berührt.
- `modellZustand({})` ist `{ aktiv: false, grund: 'abgeschaltet' }`; ein Schlüssel ohne Flag bleibt `abgeschaltet`, ein Flag ohne Schlüssel `kein-schluessel`. Production ohne diese Variablen ist damit per Konfigurationsvertrag zu (`lib/reisebegleiter/erzeugen.test.ts`).
- Ohne den dritten CHECK-Wert würde ein Aufruf in Production ohnehin an `model_usage_funktion_werte` scheitern – fail closed.

**Proaktiver Befund für das künftige Production-Gate.** Production hat jetzt `20260917120000`, aber nicht `20260917090000`; die beiden Migrationen sind zwischen den Umgebungen verschränkt. Zwei Folgen, die der Technical Lead vor einer späteren Production-Freigabe kennen sollte:

1. Der automatisierte Production-Pfad ist **hart gesperrt**. `produktionsPlan()` in `lib/rollout/anwenden-grenze.ts` bricht ab, sobald Production eine Version über der Phase-3.1-Grenze `20260820130000` trägt – das ist mit `20260917120000` der Fall. `npm run db:anwenden -- --produktion` kann die Assistant-Migration also nicht ausliefern; es braucht den ausdrücklichen Rollout-Playbook-Weg. Das ist die sichere Richtung, aber es ist kein Zustand, in den man versehentlich hineinläuft.
2. Eine spätere Anwendung von `20260917090000` auf Production wäre **chronologisch rückwärts** gegenüber der bereits verzeichneten `20260917120000`. Das Apply-Skript wählt nach „noch nicht angewandt" und nicht nach Reihenfolge, würde das also mechanisch tun; die Migrationshistorie stünde danach aber nicht mehr in Versionsordnung. `scripts/db/migration-history-repair.ts` existiert für genau diese Klasse von Problemen. Die Entscheidung darüber gehört zum Production-Gate und nicht in diesen Slice.

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

1. **Develop-Migration und Live-Verifikation – erledigt, aber nicht vom Agenten.** Der Technical Lead hat sie im Re-Review auf `3775d980` durchgeführt und verifiziert (Abschnitt 4). Der 401 der Management API in dieser Agent-Umgebung besteht unverändert; die übrigen DB-Skripte (`db:rechte`, `db:rls`, `db:sicherheit`, `db:typen --pruefen`, `db:advisors`, `production:pruefen`) sind hier weiterhin nicht gelaufen.
2. **Bezahlter Preview/Development-Nachweis – weiterhin offen, erneut geprüft am 17. September 2026.** Der Auftrag erlaubt genau einen gebundenen Aufruf, **falls** die autorisierte Preview-/Development-Umgebung die Zugangsdaten schon hat. Sie hat sie in dieser Agent-Umgebung nicht: `CLOUD_AGENT_ALL_SECRET_NAMES` führt genau vier Namen – `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`. `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` und `JETNITY_MODELL_AKTIV` fehlen; ohne den Service-Role-Key ist auch die Kostenreservierung nicht erreichbar, weil `modell_kontingent_beanspruchen` nur `service_role` ausführen darf. Der Weg über die laufende Vercel-Preview scheitert an der Anmeldung: Der Reisebegleiter begleitet nur Konto-Reisen, `enable_confirmations = true` verlangt eine bestätigte E-Mail, und ein zweites Probe-Konto ist ausdrücklich untersagt. Es wurden keine Secrets erzeugt, rotiert oder erweitert, keine Production-Zugangsdaten benutzt und keine Evidenz erfunden.
3. **Darstellung einer Auskunft** – im Browser belegt, aber mit einer **gestellten** Auskunft über den Audit-Schalter `begleiterAuskunft`, nicht mit einer erzeugten. Die gestellte Auskunft ist auf den Stand von Runde 8 gebracht: Ihre Prosa benennt keine amtliche Anforderung, und der amtliche Satz kommt aus dem geschlossenen Aussagekanal.
4. **Unbestätigter Development-Nutzer** aus Abschnitt 5 – **vom Technical Lead gelöscht**, Nachzählung 0. Erledigt.
5. **Systemregeln gegen ein echtes Modell** – die Wirksamkeit der Prompt-Regeln (erste Schranke) ist nicht gemessen. Schema, Nutzlast und Prüfung (zweite und dritte Schranke) sind deterministisch geprüft und hängen nicht daran.
6. **Umfang der Auskunft – Produktfrage an den Product Owner, nicht gemessen.** Seit Runde 9 formuliert der Reisebegleiter nicht mehr; er wählt aus 33 Jetnity-Aussagen und sieben amtlichen Aussagen aus und ordnet sie. Er kann genau sagen, was in den Katalogen steht, und sonst nichts. Ob das genügend Wert hat, ist nicht gemessen – der einzige Messpunkt ist der offene bezahlte Aufruf. Vorgelegt mit Empfehlung als ADR-0212 Punkt 9.
7. **Mechanik eines Testrunner-Stillstands nicht aufgeklärt.** Nach dem Schemawechsel hing `erzeugen.test.ts` unter `node --test` ohne Ausgabe, weil veraltete Prosa-Fixtures verworfen wurden und eine fehlschlagende `assert.ok`-Zeile den Lauf anhielt. Nach Umstellung der Fixtures läuft die Datei mit 43 Tests grün; die Runner-Mechanik selbst ist nicht weiter untersucht.

---

## 8. Risiken

| Risiko | Lage |
| --- | --- |
| Erfundene amtliche Wahrheit aus Modelltext | **am Typ geschlossen** seit Runde 9: Es gibt kein Freitextfeld. Jeden Satz schreibt Jetnity; das Modell wählt Schlüssel und Bezug. Dasselbe gilt für Preis, Link, Buchungszustand und behauptete Änderung – nicht mehr abgelehnt, sondern nicht darstellbar |
| Falscher Katalogeintrag | die neue Angriffsfläche, und beidseitig geprüft: die Formulierungen des ganzen Katalogs gegen Anforderungssprache, die Auswahl gegen das berechnete Angebot **mit** Bezug, und mit leerem Angebot kommt kein Eintrag durch |
| Katalogbreite als Produktgrenze | der Reisebegleiter sagt genau, was im Katalog steht. Neue Aussagen sind Jetnity-Formulierungen mit nachrechenbarer Bedingung – überprüfbar, aber teurer als ein Prompt (offener Punkt 6) |
| Die Bedingungen des Katalogs sind Code | `angeboteneBefunde()` rechnet aus der Projektion. Eine falsche Bedingung wäre eine falsche, weil von Jetnity formulierte Aussage. Deshalb liegt jede Bedingung in `pruefung.test.ts` unter Test, gegen die Projektion und nicht gegen sich selbst |
| Eingabegrenze zu streng oder zu lasch | 24 000 Zeichen sind aus der Reservierung abgeleitet, nicht gemessen. Eine sehr grosse Reise bekommt keine Auskunft. `kosten.test.ts` hält die Richtung fest |
| Zeichen-je-Token-Annahme | 2.2 ist pessimistisch, aber eine Annahme. Das Ausgabebudget von 1600 statt 6000 Tokens ist die eigentliche Absicherung |
| Migration nicht live geprüft | **geschlossen für Development** (Abschnitt 4). Production bleibt ohne den dritten Wert; ein Aufruf dort scheiterte an der CHECK-Bedingung, also fail closed – und Production ist ohnehin abgeschaltet |
| Gastreisen ohne Reisebegleiter | bewusst (ADR-0212 Punkt 10). Ein Gast sieht keine Fläche, die es für ihn nicht gibt; kein stiller Produktwechsel, der Gastweg bleibt unverändert |

---

## 9. Empfehlung

1. **Erledigt durch den Technical Lead:** Develop-Migration angewandt und live verifiziert, Probe-Nutzer gelöscht (Abschnitt 4).
2. **Offen:** in Preview mit gesetztem Kill Switch ein **einzelner** bezahlter Aufruf als Nachweis, mit angemeldetem Testkonto. Der Agent hat dafür keinen sicheren Weg in dieser Umgebung und erfindet ihn nicht.
3. Unabhängiges Technical-Lead-Re-Review auf dem neuen exakten Head. **Kein Ready, kein Merge, kein Folgeslice durch den Coding-Agenten.**

Production-Migration, Production-Modellaktivierung, Production-OpenAI-Secrets, Production-Aufrufe, Provider-Aktivierung und Public Launch bleiben geschlossen.
