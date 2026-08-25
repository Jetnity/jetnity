# Jetnity – TW-6 Dependency / Guest-One-Trip Contract Audit

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Typ: **AUDIT / EVIDENCE / DECISION-PACKAGE ONLY**  
Branch: `audit/tw6-guest-one-trip-dependency`  
Draft-PR: #75  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Audit-Head: nach Status-Persist (docs-only)

Keine Runtime geändert. Kein Shared-Contract-Change vorgeschlagen, der in diesem Slice umgesetzt würde. Wenn ein solcher Change nötig wäre: nur dokumentiert, **STOPP**.

---

## 1. Live-Rekonstruktion

| Fakt | Wert | Klasse |
| --- | --- | --- |
| `origin/main` | `ba86279e` – Merge PR #73 Merge-Autonomie | proven |
| Merge-Base | `ba86279e` | proven |
| Branch-Head vor Persist | `27b84b2a` (Task + leerer Status) | proven |
| Ahead / Behind vor Persist | **2 ahead / 0 behind** | proven |
| Draft-PR #75 | OPEN, Draft, MERGEABLE | proven |
| Review-Line-Threads | 0 | proven |
| Init-CI `27b84b2a` | SUCCESS – run `32910164551` | proven |
| Init-Vercel | READY – `GyJ3BdKJumyMtip3tuyRMTMBVJyj` | proven |

Parallele Draft-PRs (alle `main`, Draft, MERGEABLE):

| PR | Slice | Aktueller Datei-Overlap mit diesem Audit |
| --- | --- | --- |
| #74 D0-2 | Canonical/Origin/robots-sitemap | derzeit nur D0-2 Task/Status-Docs; **geplante** Runtime-Kollision auf `/planen`-Metadata/robots/sitemap |
| #76 Traveller/Account | audit-only docs | keine Runtime-Overlap |
| #77 Provider S4–S8 | audit-only docs | keine Runtime-Overlap |
| #78 Admin D–K | audit-only docs | keine Runtime-Overlap |
| #79 QS-2 | audit-only docs | keine Runtime-Overlap |

`docs/ACTIVE_WORK_STATUS.md` wurde **nicht** geändert.

---

## 2. Current-State-Diagramm

```
Homepage / Navbar / Footer / Account / /reisen-CTAs
        │  handoff: nur zielId, optional idee
        ▼
   GET /planen  (force-dynamic; angemeldet = auth.getUser())
        │
        ├── Reiseidee          ── vorschlagErzeugen (kein Save)
        │         │                └── Übernehmen
        │         ├─ Guest:   gastreiseAblegen(localStorage)
        │         └─ Account: vorschlagUebernehmen → reise_anlegen()
        │
        └── TripPlanner        ── Formular
                  ├─ Guest:   gastreiseAnlegen(localStorage)
                  └─ Account: reiseAnlegen → reise_anlegen()
                              │
                              ▼
                         /reisen/{id}

Guest-Browser:
  jetnity:reise:v3                 genau 1 aktive Reise
  jetnity:reisen-warteschlange:v3  nur Legacy-v2, nicht neu befüllbar
  zweite Anlage → GastreiseBestehtFehler (kein Überschreiben)

Login/Register/OAuth/MFA/Passwort-Reset
        │  Default next = /reisen
        ▼
   GastreiseBruecke
        │  gastreisenUebernehmen
        ├─ Graph  → reise_anlegen (idempotent user_id+client_ref)
        ├─ Party  → partyUebernehmen (nur wenn vorhanden)
        └─ Readiness → readinessUebernehmen (nur wenn vorhanden)
        danach erst lokalen Entwurf streichen
```

---

## 3. Create-Entry-Pfade

### 3.1 Persistierende Pfade (erzeugen eine Reise)

| # | Oberfläche | Guest | Account | Senke | Evidence |
| --- | --- | --- | --- | --- | --- |
| A | `/planen` Formular | `gastreiseAnlegen` | `reiseAnlegen` | `localStorage` bzw. `public.reise_anlegen()` | `components/trips/TripPlanner.tsx` |
| B | `/planen` Reiseidee, erst nach „Übernehmen“ | `gastreiseAblegen` | `vorschlagUebernehmen` | dieselbe | `components/trips/Reiseidee.tsx` |
| C | `/reisen` nach Login | — | `gastreisenUebernehmen` | `reise_anlegen` + optional Party/Readiness | `components/trips/GastreiseBruecke.tsx`, `lib/trips/uebernahme.ts` |

`vorschlagErzeugen` speichert **nicht** (proven: `lib/reisevorschlag/aktionen.ts`).

Account-Schreiben konvergieren in `lib/trips/anlegen.ts` → `supabase.rpc('reise_anlegen')`. Guest hat **keine** Server-Identität und **kein** EXECUTE auf `reise_anlegen` (ADR-0042).

### 3.2 Nur UI-Handoff (keine Reise)

| Quelle | Was übergeben wird | Evidence |
| --- | --- | --- |
| Homepage-Hero | nur bestätigtes `zielId` | `StartzielForm` → `zielHref` |
| Homepage-Inspiration | `zielId` + optional `idee` | `app/(public)/page.tsx` |
| Homepage-/Navbar-/Footer-CTA | nacktes `/planen` | Layout-Komponenten |
| `/reisen` Konto „Neue Reise“ / leer | `/planen` | `app/(public)/reisen/page.tsx` |
| `/reisen` Gast leer | `/planen` | `GastReisen` + `gastReisenPrimaerCta` |
| `/reisen` Gast mit aktiver Reise | sekundär „Neue Reise“ → `/planen` | `GastReisen.tsx` – Persistenz lehnt ab |
| Account-Übersicht leer | `/planen` | `AccountUebersicht.tsx` |
| Gast-Workspace ohne Reise | `/planen` | `GastArbeitsbereich.tsx` |
| 404 | `/planen` | `NotFoundView.tsx` |

`TripWorkspace` selbst legt **keine** neue Reise an (kein Create-Button).

### 3.3 Pflicht vs. optional beim Formular

| Feld | UI-Default | Pflicht zum Submit | Herkunft |
| --- | --- | --- | --- |
| Ziel | URL `zielId`/`ziel` wenn bestätigt | ja, bestätigte `geonames:`-ID | proven |
| Abreiseort | `''` | ja, `geonames:` oder `airport:XXX` | proven |
| Daten | `''` | ja | proven |
| Reisende | **2** | ja, 1…Grenze | proven |
| Budget | leer → `null` | nein | proven |
| Währung | hart `'CHF'` im Parse | Schema-Default `CHF` | proven |
| Tempo | **`balanced` vorausgewählt** | Schema verlangt gültiges Tempo | proven |
| Interessen | `[]` | nein | proven |
| Reisewunsch | URL `idee` | nein | proven |
| Staatsbürgerschaft / Dokument | nicht erhoben | — | proven |
| Weitere Ziele | nicht im Create | eine Stage aus dem Ziel | proven |

URL liest nur `idee`, `ziel`, `zielId`. Kein Origin, kein Datum, keine Reisenden, keine Citizenship (`app/(public)/planen/page.tsx`).

Homepage übergibt **kein** Origin und **kein** stilles ZRH. Origin bleibt leer, bis der Nutzer einen bestätigten Ort wählt.

### 3.4 Doppelwege, die TW-6 sonst erzeugen würde

1. **Zwei Create-UIs auf einer Seite** (Reiseidee oben, Formular unten). Beide konkurrieren um denselben Guest-Slot.
2. **Viele Links nach `/planen`**, inkl. Gast-„Neue Reise“ trotz bestehendem Entwurf.
3. **Homepage-Handoff vs. nacktes `/planen`**: unterschiedlich vorausgefülltes Ziel, gleiche Persistenz.
4. Ein **zweiter Workspace-Create** darf nicht entstehen. TW-6 soll Einstieg angleichen, nicht einen dritten Weg bauen.

---

## 4. Guest-One-Trip Current Contract

### 4.1 Proven (Code + Tests + ADR-0042)

| Aussage | Evidence |
| --- | --- |
| Genau **eine** aktive Gastreise | `SCHLUESSEL_AKTIV = jetnity:reise:v3`; `gastreiseAnlegen` wirft `GastreiseBestehtFehler` |
| Zweite Anlage überschreibt **nicht** | Meldung nennt Konto; `bestehendeId` bleibt |
| Vorschlag-Retry mit derselben `clientRef` ist idempotent | `gastreiseAblegen` gibt bestehende Reise zurück |
| Andere `clientRef` bei bestehender Reise → Fehler | `gastreiseAblegen` |
| IDs: Guest-`id` = Formular-`clientRef` | trägt später `unique (user_id, client_ref)` |
| Revision 1 beim Anlegen; Mutationen erhöhen Revision | `gastspeicher.ts` |
| Legacy v2: zuletzt geändert → aktiv, Rest → Warteschlange ≤ 20 | nicht neu befüllbar im laufenden Betrieb |
| Schreibfehler sind Fehler, kein Fake-Erfolg | `SpeicherFehler` + Read-back |
| Keine Server-Gast-Identität | kein `auth.users`, kein EXECUTE für `anon` |
| Übernahme nur auf `/reisen` nach Session | fünf Auth-Wege enden dort |
| Reihenfolge senden → bestätigen → streichen | `uebernahme.ts` |
| Fehler lässt Browser-Entwurf liegen | Tests |
| Account mit vorhandenen Reisen: Gast-Trip wird **addiert**, nicht ersetzt | idempotent je `client_ref` |
| Party/Readiness nur, wenn im Graph vorhanden | Create setzt sie nicht |
| Logout löscht LocalStorage **nicht** | `signOutAction` rührt Gastspeicher nicht |
| Gerätwechsel / Speicherverlust: Gast-Reise weg; UI sagt das | `GastArbeitsbereich` |
| Account-Reisen kommen aus DB/RLS | `/reisen/[tripId]` |

Tests: `lib/trips/gastspeicher.test.ts`, `lib/trips/uebernahme.test.ts`, `lib/trips/gast-reisen-cta.test.ts`.

### 4.2 Inferred (Verhalten folgt aus Code, keine eigene PO-Zeile)

| Aussage | Warum inferred |
| --- | --- |
| Logout auf geteiltem Gerät lässt den Gastentwurf im Browser | Session weg, Speicher bleibt – Absicht der Flüchtigkeitskommunikation, nicht extra entschieden |
| Gast-URL `/reisen/trip-…` bleibt Gast-Workspace auch mit Session | kein stiller Swap; Konto-Übernahme nur über `/reisen` |
| `travellers: 2` ist UX-Default, keine Party | nur Anzahl, keine Personen |

### 4.3 Missing decision (für TW-6 Start, nicht für den Speichervertrag)

Der **Speichervertrag „eine aktive Gastreise“ ist bereits umgesetzt.** Der offene Schnitt ist **nicht** „dürfen Gäste mehrere Reisen halten?“.

Offen ist der **Create-Entry-Produkt-Schnitt**:

1. Welche `/planen`-IA gilt (zwei Einstiege vs. einer; Chips; progressive Ziele)?
2. Darf die Oberfläche „Neue Reise“ anbieten, obwohl Persistenz ablehnt?
3. Bedeutet „kein implizites `balanced`“ nur UI oder auch SQL/`reise_anlegen`?

ADR-0013-Kopfzeile sagt noch „noch nicht umgesetzt“; ADR-0042 und der Code sind umgesetzt. Das ist Dokumentationsdrift, kein Runtime-Defekt.

---

## 5. Traveller / Multi-Citizenship

Create erhebt **keine** Staatsbürgerschaft und **keinen** Pass.

- Formular: nur Anzahl `travellers`.
- `gastreiseAnlegen` setzt kein `party`.
- Readiness erzeugt später Slots mit `missingFacts: ['nationality']`, keinen Default-Pass.

**Proven:** TW-6 Create darf diesen Vertrag nicht neu definieren. Citizenship-Pflicht erst, wenn Official sie braucht.

---

## 6. D0-2 Parallelität

PR #74 ist derzeit docs-only. Der D0-2-Auftrag darf später Metadata/Origin/robots/sitemap und **Metadata von `/planen`** berühren.

Dieser Audit ändert **keine** dieser Dateien:

- `app/(public)/planen/page.tsx`
- `app/robots.ts`, `app/sitemap.ts`
- `lib/seo/index-grenze.ts`, `lib/seo/robots-regeln.ts`
- Public/root layouts, Homepage-Metadata
- Env `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL`

Späterer TW-6-Runtime muss `generateMetadata` / Robots von `/planen` **nicht** mitbesitzen, sonst Kollision mit D0-2.

---

## 7. Findings

### P0

Keine. Kein nachgewiesener Datenverlust im aktuellen Guest→Account-Pfad, kein stilles Überschreiben der aktiven Gastreise.

### P1

| ID | Finding | Warum P1 |
| --- | --- | --- |
| P1-TW6-01 | Der für TW-6 geforderte **Product-Owner-Schnitt** (Create-IA + Bedeutung von „kein implizites balanced“) ist nicht entschieden. | TW-6 Runtime ohne diese Entscheidung würde entweder den Plan verfehlen oder SQL/`reise_anlegen` still mitziehen. |
| P1-TW6-02 | `public.reise_anlegen()` schreibt `coalesce(nullif(pace, ''), 'balanced')`; Spalte `trips.pace` ist `NOT NULL DEFAULT 'balanced'`. | Wenn TW-6 „kein implizites balanced“ als Persistenz-Wahrheit behauptet, ohne RPC/Default zu ändern, entsteht eine zweite Tempo-Wahrheit. **RPC/Default in TW-6 nicht ändern** – das wäre Trip-Create-/DB-Vertrag. |

Kein P1-Security-/Ownership-Loch in der bestehenden Übernahme gefunden.

### P2

| ID | Finding |
| --- | --- |
| P2-TW6-01 | Gast-`/reisen` zeigt „Neue Reise“, Persistenz lehnt ab. Doppelweg. |
| P2-TW6-02 | Reiseidee kann ein kostenpflichtiges Modell rufen und danach am Guest-Slot scheitern. |
| P2-TW6-03 | Tempo-Chips + vorausgewähltes `balanced` widersprechen dem TW-6-Zielbild (UI). |
| P2-TW6-04 | Zwei Create-UIs auf `/planen` ohne gemeinsame Progressive-Destination-IA. |

### P3

| ID | Finding |
| --- | --- |
| P3-TW6-01 | Reisende-Default `2`; Währung hart `CHF`. |
| P3-TW6-02 | URL-`ziel` ohne bestätigte ID ist nur Text-Fallback. |
| P3-TW6-03 | ADR-0013-Statuszeile veraltet gegenüber ADR-0042. |

QS-1-P2/P3 und D0-P2 nicht übernommen.

---

## 8. Was Produktentscheidung ist vs. technische Tatsache

| Thema | Klasse |
| --- | --- |
| Eine aktive Gastreise, keine Server-Gast-Identität, Übernahme additiv + idempotent | **technische Tatsache** + freigegebene ADRs 0009/0013/0042 |
| LocalStorage flüchtig; Gerätwechsel verliert Gast | Tatsache; UI muss ehrlich bleiben |
| Create ohne Citizenship | Tatsache; bleibt Pflicht |
| Dual-Entry, Chips, implicit balanced, Gast-„Neue Reise“, progressive Ziele | **Produktentscheidung** = der fehlende TW-6-Schnitt |
| SQL-Default `balanced` ändern | Produkt **und** DB/`reise_anlegen`-Vertrag → nicht in TW-6, STOPP wenn gefordert |

---

## 9. Product-Owner-Optionen (maximal 3)

### Option 1 – Minimaler TW-6-Runtime (Empfehlung)

Nach Gate-Entscheidung, **nicht jetzt**:

- Guest-One-Trip-Speicher und Guest→Account **unberührt**.
- `/planen`-Formular: Tempo-/Interessen-Chips entfernen; keine Citizenship; vorhandene `trip_stages` für **progressive weitere Ziele**.
- Tempo: UI behauptet keine Nutzerwahl. Persistenz darf den bestehenden SQL-Default `balanced` behalten, bis ein späterer DB-Slice das ändert. Die Oberfläche darf `balanced` nicht als „gewählt“ verkaufen.
- Gast-CTA: „Neue Reise“ nur, wenn kein aktiver Entwurf; sonst Fortsetzen oder Konto.
- Homepage: nur bestehende `zielId`/`idee`-Handoffs nutzen. Kein Hero/Marketing.
- `/planen`-Metadata/robots nicht anfassen (D0-2).
- Reiseidee bleibt zweiter bestehender Weg; kein dritter Create.

**Wirkung:** erfüllt das dokumentierte TW-6-Ziel ohne Shared-Contract- oder DB-Änderung.  
**Risiko:** Tempo bleibt intern `balanced`, bis ein eigener Slice die Spalte/RPC ändert. Das muss im UI ehrlich bleiben.

### Option 2 – Einstieg vereinheitlichen

Option 1 plus: Reiseidee wird der primäre einfache Einstieg; das Formular wird reiner Fallback ohne Chips.

**Wirkung:** näher am V2-Satz „eine Idee wird zur Reise“.  
**Risiko:** höhere `/planen`-Umbaufläche, mehr D0-2-Koordination, Modellkosten bleiben am oberen Einstieg.

### Option 3 – TW-6-Runtime zurückstellen

Create-Entry-UX (Chips, Progressive Destinations, CTA-Ehrlichkeit) auf TW-9 oder einen späteren Slice verschieben. Guest-One-Trip gilt als Gate **erfüllt** (implementiert). `/planen` bleibt, solange D0-2 Metadata anfasst.

**Wirkung:** null Runtime-Kollision.  
**Risiko:** das im Plan stehende TW-6-Produktziel bleibt offen.

**Keine Option** in diesem Audit: Guest-Speicher auf mehrere aktive Reisen öffnen, Übernahme ersetzen/mergen, anonymes Auth, Citizenship beim Start, Homepage-Relaunch, SQL-Default ohne eigenen DB-Slice.

---

## 10. Technical-Lead-Empfehlung (keine Entscheidung)

Empfohlen: **Option 1**, Start erst nach ausdrücklicher Product-Owner-Wahl und nach Klärung der D0-2-Datei-Grenze.

Nicht empfohlen: TW-6 so zu lesen, als fehle der Guest-One-Trip-**Speichervertrag**. Der fehlt nicht. Es fehlt der **Create-Entry-Schnitt**.

Wenn Product Owner „kein implizites balanced“ als **Persistenz** meint: das ist ein DB/`reise_anlegen`-Change. Dokumentieren und **STOPP** – nicht in TW-6 Runtime.

---

## 11. Exakte TW-6 Start-Gates

TW-6 Runtime darf erst starten, wenn **alle** gelten:

1. Product Owner wählt Option 1, 2 oder 3 (oder eine schriftliche Variante derselben Schärfe).
2. Guest-One-Trip bleibt ADR-0042: eine aktive Reise, kein stilles Überschreiben, additive idempotente Übernahme.
3. Keine Änderung an Auth/MFA/Session, RLS/Ownership, Guest→Account-Modulen, Traveller-Shared-Contract, Route, Provider, Payment.
4. Keine Migration, solange Tempo-Default in SQL bleibt.
5. Keine Citizenship-/Pass-Erhebung im Create.
6. Keine Homepage-Positionierung/Hero/Marketing-Copy.
7. Keine D0-2-Dateien (`generateMetadata`/`robots`/`sitemap`/Origin-Env). Bei Strukturänderung von `planen/page.tsx`: Technical-Lead-Koordination mit #74.
8. Kein dritter Create-Pfad im Workspace.
9. Exact-Head-Gates + die Tests aus Abschnitt 13.

---

## 12. Minimaler späterer TW-6-Runtime-Scope (nur nach Gate)

Nur wenn Option 1 oder 2 gewählt wird, grob:

| Darf | Darf nicht |
| --- | --- |
| `TripPlanner` Chips/Defaults/CTA-Copy | `gastspeicher.ts` / `uebernahme.ts` / RPC |
| Progressive Ziele über vorhandene Stages | Homepage-Marketing |
| Gast-CTA-Ehrlichkeit (`GastReisen`, ggf. `gast-reisen-cta`) | Metadata/robots von `/planen` |
| Tests für Create-IA + One-Trip-Regression | Traveller-Create-Felder |
| | D0-2, TW-7/TW-8 |

Option 3: **kein** Runtime-Scope.

---

## 13. Pflicht-Tests / Evidence für einen späteren Runtime-Slice

Bestehende Regressionen müssen grün bleiben:

- `lib/trips/gastspeicher.test.ts` – zweite Anlage, kein Overwrite, Speicherfehler, Legacy
- `lib/trips/uebernahme.test.ts` – Reihenfolge, Retry, Parallel, Party/Readiness, Signup
- `lib/trips/gast-reisen-cta.test.ts`
- `lib/trips/schema.test.ts` – `/planen`-Formular
- `lib/places/auswahl.test.ts` – `zielHref`
- `lib/seo/index-grenze.test.ts` – `/planen` noindex-Params (nicht neu erfinden)

Zusätzlich, sobald Runtime existiert:

- Guest mit aktiver Reise: Create-CTA erzeugt keinen zweiten Slot und keinen Modell-Aufruf ohne Warnung.
- Guest und Account: dieselbe Formular-Validierung, keine zweite Presentation-Wahrheit.
- Keine Citizenship/Pass-Felder und kein Default-Land im Create.
- Tempo: UI behauptet keine Nutzerwahl, wenn keine Wahl stattfand (auch wenn SQL `balanced` speichert).
- Homepage-`zielId` füllt nur ein bestätigtes Ziel.
- Progressive zweite Destination erzeugt eine zusätzliche Stage, keinen zweiten Trip.
- D0-2-Robots-Vertrag von `/planen` unverändert, sofern D0-2 schon integriert ist.

---

## 14. Datei- / Shared-Contract-Kollisionsmatrix

| Fläche | Dieser Audit | Späteres TW-6 (Opt. 1/2) | D0-2 #74 | #76–#79 | Shared? |
| --- | --- | --- | --- | --- | --- |
| `docs/TRIP_WORKSPACE_TW6_*` | ja | ja | nein | nein | nein |
| `docs/ACTIVE_WORK_STATUS.md` | **nein** | nein (TL) | nein | nein | Continuity |
| `app/(public)/planen/page.tsx` Metadata | nein | **nein** | wahrscheinlich | nein | SEO |
| `TripPlanner` / `Reiseidee` | nein | ja | nein | nein | nein |
| `gastspeicher` / `uebernahme` / `reise_anlegen` | nein | **nein** | nein | nein | Guest→Account / Trip-Create |
| Traveller-Registry / AP-4 | nein | nein | nein | #76 audit | Traveller |
| Homepage Hero Copy | nein | nein | evtl. Metadata | nein | Marketing |
| robots/sitemap/origin | nein | nein | ja | nein | D0 |

---

## 15. Adversarial Self-Review

- Jede Create-Senke ist an Code gebunden; „viele Reisen ohne Konto“ ist **nicht** der Current Contract.
- Der Gate-Satz „Guest-One-Trip-Vertrag fehlt“ wäre falsch, wenn er den Speicher meint. Er meint den **Create-Schnitt**.
- SQL-`balanced` zu verschweigen und gleichzeitig „kein implizites Tempo“ zu liefern wäre ein Truth-Defekt (P1-TW6-02).
- Guest-CTA „Neue Reise“ ist kein zweiter Speicher-Slot, aber ein UX-Doppelweg (P2).
- Traveller-Create ist sauber leer; kein Default-Pass.
- Kein Vorschlag, Guest→Account still zu ändern.
- Keine P2/P3 aus QS-1 oder D0 übernommen.
- ADR-0167-Kopf kann historisch „Runtime noch nicht implementiert“ sagen, während TW-5 auf `main` ist – Continuity-Drift, nicht TW-6-Scope.

---

## 16. STOPP

Kein Ready. Kein Merge. Kein TW-6-Runtime. Kein Folgeslice.

Nächster Schritt: unabhängiger Technical-Lead-Review dieses Decision Packages; Product Owner wählt Option 1, 2 oder 3.
