# Jetnity – Account / Traveller Next Slice Reconciliation

Stand: 27. August 2026  
Issue: #105  
Cursor-Anzeigename: **Account plattform audit vorbereitung 2**  
Typ: **AUDIT / EVIDENCE ONLY**  
Status: **TW7-A-PARALLELITÄTSGATE ERFÜLLT / AUDIT-EMPFEHLUNG AP-4 IS NEXT ACCOUNT RUNTIME CANDIDATE / KEINE RUNTIME-FREIGABE / STOPP**  
Branch: `cursor/account-traveller-reconciliation-3efc`  
Historische Audit-Startbaseline: `963186f4ec75501efd253a287131f464a5fd0fdb` (PR #102) — **keine dauerhafte Live-Wahrheit**  
Aktueller Sync-`main`: `1c88b7e49453bb60cf9962d1dfa5bb3b652058ca` (Merge PR #106)  
Reviews: `5044318302` BLOCKED (historisch, Dual-Draft); `5044426064` weiterer Continuity-Fix nach #106-Landung

Keine Runtime. Kein Shared-Contract-Change. Kein AP-4-Start in diesem PR. Kein AP-7. Kein Archiv-Write. Kein Ready. Kein Merge.

Zentrale Continuity-Dateien werden in diesem Slice **nicht** eigenständig umgeschrieben. Der Branch übernimmt den `main`-Stand von PR #106 unverändert.

---

## 1. Live-Rekonstruktion

Verifiziert in diesem Lauf, nicht aus einem alten Cursor-Chat.

| Prüfung | Stand |
| --- | --- |
| Historische Audit-Startbaseline | `963186f4ec75501efd253a287131f464a5fd0fdb` – *Merge PR #102*. **Keine zukünftige Live-Wahrheit.** |
| Aktueller `origin/main` | `1c88b7e49453bb60cf9962d1dfa5bb3b652058ca` – *Merge PR #106: TW7-A Hub card identity* |
| Audit-Branch | `cursor/account-traveller-reconciliation-3efc`, mit `1c88b7e4` synchronisiert |
| Merge-Base gegen aktuellen `main` | `1c88b7e4` nach Sync |
| Historische Audit-Branches | `audit/account-platform` (PR #39, Draft) und `audit/traveller-account-next-phase` (PR #76, **MERGED**) sind Evidence, **nicht** Basis |
| Production-AAL2 | angewendet und verifiziert laut `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_STATUS_2026-08-27.md`; **kein zweiter Apply** |
| AAL2 vs Traveller-RLS | Apply-Status: `profiles-*`-/Trip-/Traveller-RLS unverändert |
| Dieses Run: Supabase selbst abgefragt? | **nein** |
| Dieses Run: Browser-/Real-Device? | **nein** |

### 1.1 Historische Evidence zum Audit-Zeitpunkt (27. August 2026, vor TL-Review)

Zum ersten Audit-Lauf waren beide TW7-A-Drafts offen:

| PR | Branch | Klasse zum Audit-Zeitpunkt |
| --- | --- | --- |
| **#104** | `cursor/tw7a-hub-card-identity-b13d` | TW7-A Runtime, Draft; Issue #105 nannte nur diesen |
| **#106** | `cursor/tw7-a-hub-card-identity-a4c4` | zweiter TW7-A Runtime, Draft, Issue #103 |

Das ist **ausdrücklich historische Evidence**. Es ist keine aktuelle Parallelitäts-Wahrheit.

### 1.2 Zwischenstand nach erstem TL-Review (historisch, 27. August 2026 18:19–18:34 UTC)

#104 wurde CLOSED / superseded / nicht gemergt. #106 blieb vorübergehend die einzige offene TW7-A-Linie. Aussagen `NO ACCOUNT RUNTIME while #106 is not integrated` gehören zu **dieser** historischen Phase.

### 1.3 Aktuelle Live-Parallelität (nach PR-#106-Landung, 27. August 2026 18:34 UTC)

Verifiziert in diesem Sync-Lauf:

| PR / Issue | Live-Stand |
| --- | --- |
| **#104** | **CLOSED / superseded / nicht gemergt** |
| **#106** | **MERGED** auf `main` `1c88b7e4` |
| **Issue #103** | **CLOSED** / completed |
| Post-Merge CI | Run `33104140169` SUCCESS auf `1c88b7e4` |
| Vercel Production | `dpl_8jCQsqtBiDq99b2Qtyg2BznwtbWd` READY auf `1c88b7e4` |
| #88 / #52 / #50 / #40 / #39 / #28 | historische bzw. fremde Drafts; nicht angefasst |

Das frühere TW7-A-Parallelitätsgate ist **erfüllt**. Es blockiert AP-4 nicht mehr. AP-4 ist trotzdem **nicht** durch diesen PR freigegeben.

---

## 2. Was seit dem historischen Next-Phase-Audit wahr ist

Historische Evidence: `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT.md` (PR #76) und `docs/P1_TA02_OFFICIAL_EVALUATION_OPTION_SCOPE_STATUS.md` (PR #84).

| Aussage des alten Audits | Stand auf der historischen Audit-Baseline `963186f4` |
| --- | --- |
| P1-TA-02 Official-Collapse offen | **geschlossen** durch PR #84 / Merge `2468160e`; ADR-0167 auf `main` |
| P2-TA-06 `documents[0]` latent | **weiterhin latent**; Code unverändert in `lib/readiness/engine.ts` `travellerNormalisieren` |
| AP-1 / AP-2 / AP-3 auf `main` | bestätigt; kein AP-4-Write im Runtime-Pfad |
| AP-7 fehlt, Shared-Contract-Gate | bestätigt; kein Account-Traveller-Registry-Contract auf `main` |
| Current Truth trip-scoped | bestätigt; `types/trips.ts`: `party` = individueller Reisendenkontext, **keine accountweiten Profile** |
| Foundation E nicht neu bauen | bestätigt; Child-Tabellen-Vertrag unverändert |
| `ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` fehlt auf `main` | bestätigt (P2-TA-03); Datei nur auf PR #39 |
| Nächster Slice: zuerst P1-TA-02, dann P2-TA-06 | P1-TA-02 erledigt; P2-TA-06 bleibt Residual |
| Continuity-Dateien können hinter `main` liegen | **heute bestätigt und stärker:** zentrale Statusdateien beschreiben noch `beaef64a` / offenen AAL2-Apply |

Widerspruch in historischer Statusdatei: `docs/TRAVELLER_ACCOUNT_NEXT_PHASE_AUDIT_STATUS.md` Abschnitt 1 sagt P1-TA-02 geschlossen, Abschnitt 2 fordert noch einen Closure-Slice. **Abschnitt 2 ist historische Evidence.** Dieser Bericht führt P1-TA-02 nicht als offenen Finding.

---

## 3. Account / AP-3 – aktuelles Verhalten

### 3.1 `/account`

`app/account/page.tsx` lädt ausschliesslich `reisenLaden()` und rendert `AccountUebersichtLive`. Empty und Error bleiben getrennt. Aktiv/kommend klassifiziert der Client am Geräte-Kalendertag (`lib/account/naechste-reise.ts`, ADR-0153).

Archivierte Reisen (`trips.status === 'archived'`) sind **kein Fortsetzen**. Ohne Kalendertag keine Aktiv/Kommend-Behauptung.

### 3.2 `/reisen`

Dieselbe Adresse für Gast und Konto. Server entscheidet über `auth.getUser()`.

| Zustand | Verhalten |
| --- | --- |
| Gast | `GastReisen` (Local Storage); keine AP-3-Gruppen |
| Konto + Fehler | `role=alert`; Text „Deine Reisen konnten nicht geladen werden.“ |
| Konto + 0 Reisen | Empty-Text „Noch keine Reise in deinem Konto.“ – kein Alert |
| Konto + Reisen | `KontoReisenGruppen`: Aktiv / Kommend / Vergangen / Ohne Datum |

Ableitung nur aus `startDate`/`endDate` gegen Geräte-Kalendertag (`lib/account/reise-lage.ts`, ADR-0160). Undatierte Reise niemals Vergangen. Empty-Gruppe ist Text, kein `role=alert`.

200er-Grenze: `reisenLaden()` lädt `limit(REISEN_LISTE_GRENZE)` zuletzt geänderte Reisen. Der Hinweis behauptet nicht, dass weitere existieren (`lib/account/reise-gruppen-grenzen.test.ts`).

### 3.3 `trips.status` vs abgeleitete Lage vs Workspace

| Vertrag | Wahrheit | Schreibend? |
| --- | --- | --- |
| AP-3 Gruppen | date-only Lage | nein |
| Account-Übersicht Fortsetzen | filtert `archived` lesend | nein |
| `trips.status` | `draft \| planned \| booked \| archived` | **kein Account-Write auf `main`** |
| TW7-A Hub-Kartenidentität | `TripSummary.stages` + `reiseOrte()` | **auf `main` via PR #106**; kein Archiv-Write |
| AP-7 Registry | fehlt | gated |

`reisenLaden()` selektiert `status`, filtert aber nicht. AP-3 zeigt gespeichertes `archived` weiter in der Datumsgruppe. Das ist der echte Account-Lifecycle-Gap für AP-4, kein Traveller-Gap.

Keine Runtime-Stelle schreibt `status = 'archived'`. Belegt durch Source-Suche und `reise-gruppen-grenzen.test.ts`.

---

## 4. Traveller Truth

Verbindlich und unverändert:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Kein Default-Pass. Issuer ist nicht Citizenship. `unknown` / `insufficient_context` bleiben ehrlich.

### 4.1 Current Truth bleibt trip-scoped

| Ebene | Existiert auf `main` | Scope |
| --- | --- | --- |
| `public.trip_travellers` | ja | Reise + Owner |
| `public.trip_traveller_citizenships` | ja, 1:n, max 8 | Reise + Traveller + Owner |
| `public.trip_traveller_documents` | ja, 1:n, max 12 | Reise + Traveller + Owner |
| `Trip.party` | ja | trip-scoped; ausdrücklich keine accountweiten Profile |
| `trips.travellers` | ja | **Kopfzahl 1–20**, keine Identität |
| Account-Traveller-Registry | **fehlt** | AP-7, kein Contract |
| Default-Pass / primäre Staatsbürgerschaft | **nicht modelliert** | verboten |

`credentialOptionsAus` (`lib/readiness/traveller-kontext.ts`): eine Option je Dokument; ohne Dokument `:none`. Issuer und Citizenship bleiben getrennt.

### 4.2 P1-TA-02 – geschlossen, nicht erneut öffnen

PR #84 / ADR-0167 auf `main`:

- `officialAusEvaluations` aggregiert fail-closed; `result` immer `unknown`
- heterogene Scopes liefern keine Authority/URL/`checkedAt`/`validityUntil`
- `officialFuerItem` ohne Fallback auf fremde Evaluations
- `lib/readiness/status.ts` ruft `officialFuerItem`, nicht den alten All-Evaluations-Fallback
- Adversarial-Tests: `lib/readiness/official-option-scope.test.ts`

Kein erfundener Visa-/Entry-Winner. Kein neuer Traveller-Shared-Contract.

### 4.3 P2-TA-06 – live lokalisiert, weiterhin latent

**Datei:** `lib/readiness/engine.ts` → `travellerNormalisieren`

Wenn `credentialOptions` fehlt oder `length === 0`, wird **eine** Option aus `documents[0]` oder Legacy-Singularfeldern gebaut.

Aktuelle Caller von `requirementsAuswerten`:

| Caller | Setzt `credentialOptions`? | Trifft `documents[0]`? |
| --- | --- | --- |
| `anforderungen.ts` `anfrageAus` → `requirementsEvaluationsPruefen` | ja, über `credentialOptionsAus` | nein |
| `travellerAusSlot` / `requirementsFuerReise` | ja, über `credentialOptionsAus` | nein |
| `app/` direkter `requirementsAuswerten`-Aufruf | **keiner** | nein |
| `engine.test.ts` | meist mit Options oder 1 Dokument | Test-Pfad |

`credentialOptionsAus` liefert nie ein leeres Array. Der kanonische App-Pfad trifft den Fallback nicht.

**Klassifikation heute:** weiter **latent**. Kein aktueller Runtime-P1. Hardening wäre Contract-Hygiene am Legacy-/Direct-API-Pfad, kein sichtbarer Nutzerdefekt.

Dieser Audit entscheidet **nicht**, ob der Fallback fail-closed werden oder auf die bestehende 1:n-`credentialOptionsAus`-Semantik gezogen werden soll. Beides wäre eine Requirements-API-Härte und braucht eine eigene Slice-Spec durch den Technical Lead. Hier keinen Hardening-Contract erfinden.

### 4.4 Weitere Residuals (nicht nächster Slice)

| ID | Lage |
| --- | --- |
| P2-TA-01 | UI zeigt Official nicht progressiv pro Option |
| P2-TA-02 | Test-Fixtures oft eine CH-Citizenship / `documents[0]` |
| P2-TA-03 | Implementation-Plan nur auf PR #39 |
| P2-TA-04 | `authenticated` darf Child-Tabellen direkt schreiben |
| P2-TA-05 | Safety citizenship-set-scharf, nicht dokumentabhängig |
| P3-TA-01 | Legacy-Singularspalten Expand/Contract |

---

## 5. AP-4 Archiv-UX

AP-4 bleibt der echte nächste **Account-Lifecycle-Gap**: gespeichertes `archived` ist in `/reisen`-Gruppen sichtbar, in der Übersicht aber kein Fortsetzen. Kein Write-Pfad existiert.

Historischer Plan (PR #39, **nicht auf `main`**): ausdrückliche Aktion Archivieren/Wiederherstellen; ein Schreibweg; RLS unverändert; kein Service Role; Gast braucht kein Archiv in Local Storage. **Shared: ja (`trips.status`)**.

Dateien, die ein späterer AP-4-Slice voraussichtlich berühren würde:

| Fläche | Datei | Risiko |
| --- | --- | --- |
| Status-Write | neuer, einziger Schreibweg auf `trips.status` | Shared Trip-Status |
| `/reisen` Gruppen | `KontoReisenGruppen.tsx`, `reise-lage.ts` | Filter vs Lage trennen |
| Übersicht | `naechste-reise.ts` (liest `archived` bereits) | eher klein |
| Karte | `Reisekarte.tsx` | TW7-A bereits auf `main`; AP-4 darf Kartenidentität nicht zurückbauen |
| Liste | `lib/trips/daten.ts`, `types/trips.ts` | `TripSummary.stages` existiert; AP-4 muss ihn mitführen, nicht neu erfinden |
| Gast | `GastReisen.tsx` | Archiv nicht nötig; Guest-`itemCount`/`stages` von TW7-A belassen |
| Tests | `reise-lage.test.ts`, `naechste-reise.test.ts`, `reise-gruppen-grenzen.test.ts` | Fixtures tragen bereits `stages: []` |

Nach Sync von `1c88b7e4` kein neuer Account-/Traveller-Blocker:

- AP-3 schreibt/filtert weiter kein `archived`
- Übersicht filtert `archived` nur lesend
- TW7-A-Status sagt ausdrücklich: kein AP-3-/AP-4-/AP-7-Umbau
- P2-TA-06 unverändert latent
- keine Account-Traveller-Registry

TW7-A-Spec bleibt: Archiv weder schreiben noch aus dem Hub filtern. AP-4 darf Hub-Kartenidentität nicht als Archiv-Filter umdeuten.

Der historische Plan auf PR #39 fehlt weiter auf `main` (P2-TA-03). **Das ist kein dauerhafter Blocker.** Der Technical Lead darf einen neuen, aktuellen, scope-treuen AP-4-Task versionieren.

**Audit-Empfehlung: `AP-4 IS NEXT ACCOUNT RUNTIME CANDIDATE`. Keine Runtime-Freigabe durch diesen PR.**

---

## 6. AP-7 Account-Traveller-Registry – Gate

Kein Registry-Contract auf `main`. ADR-0117 hat ein globales Nutzerprofil bewusst abgelehnt. Ein späterer Schnitt braucht einen ADR-Nachfolger plus Product-Owner-Entscheidung.

Was eine Registry **neu** zur Wahrheit machen würde (nur identifiziert, nicht entschieden):

- account-scoped Traveller-/Citizenship-/Document-Persistenz über Reisen hinweg
- Ownership/RLS jenseits von `trip_id + user_id`
- Delete/Detach/Archive einer Identität unabhängig vom Trip
- Guest-Opt-in in ein Account-Profil
- Readiness-Stale bei Profiländerung
- ob `party[]` Kopie oder Live-Referenz wird

Das verschiebt Current Truth. **Dieser Audit erfindet keinen dieser Verträge.**

Gate bleibt:

- Shared-Contract-Entscheidung durch Technical Lead
- ausdrückliche Product-Owner-Freigabe
- besondere Gates für sensible Dokumentdaten / grosse Identity-/RLS-Änderungen

AP-7 ist **nicht** der nächste Slice.

---

## 7. AAL2-Abschluss – Account-Relevanz

PR #102 liegt auf `main`. Production-AAL2-Version `20260827170000_admin_aal2_data_plane_alignment` ist angewendet und verifiziert. `public.aktuelles_admin_aal2()` ist live. Admin-Capabilities verlangen Rolle **und** AAL2.

Für Account/Traveller:

- kein zweiter Apply
- Trip-/Traveller-RLS laut Apply-Status unverändert
- kein Anlass, Account-Runtime an AAL2 zu koppeln
- zentrale Continuity-Dateien, die den Apply noch als offen beschreiben, sind **stale**; dieser Audit überschreibt sie nicht

---

## 8. Prioritätsmatrix

| Priorität | Thema | Begründung |
| --- | --- | --- |
| **Must** | Kein neuer Shared Contract in diesem Workstream | AP-7, Archiv-UX, Guest→Account, `party_schreiben`, Requirements-Härte nicht still entscheiden |
| **Must** | P1-TA-02 geschlossen lassen | nicht erneut als offen führen |
| **Must** | TW7-A-Runtime von #106 nicht zurückdrehen | auf `main`; dieser Audit ändert sie nicht |
| **Must** | Kein zweiter AAL2-Apply | geschlossen |
| **Must** | Keine AP-4-Runtime in diesem PR | eigener neuer TL-Task/Spec + frischer Account-Agent |
| **Should** | AP-4 als nächsten Account-Lifecycle-Slice versionieren | Parallelitätsgate erfüllt; Shared `trips.status`; frischer enger Task |
| **Later** | P2-TA-06 härten | latent; nicht automatisch vor AP-4 |
| **Later** | P2-TA-01 / P2-TA-02 / P2-TA-05 | Presentation, Fixture-Hygiene, Safety-Schärfe |
| **Later** | P2-TA-03 Plan auf `main` fördern | optional; kein stiller AP-7-Import; kein dauerhafter AP-4-Blocker |
| **Later** | AP-5 / AP-6a | eigene Auth-/Legal-Gates; D0-P1-03 für Legal-404 |
| **Gated** | AP-7 Registry | ADR-0117-Nachfolger + PO + sensible Identity-/RLS-Gates |
| **Gated** | AP-6b / AP-8 / AP-12 | Privacy-DB, Profil, Billing |
| **Gated** | Passscan / MRZ / Biometrie / Nummern | besonderes PO-Gate |

Keine P0. Kein aktueller Account-/Traveller-Runtime-P1 auf `main`.

---

## 9. Konfliktmatrix

| Arbeit | Shared Dateien / Verträge | Regel für diesen Audit | Regel für einen späteren Account-Runtime-Slice |
| --- | --- | --- | --- |
| TW7-A #104 | historisch dieselben Hub-/Listen-Dateien | nicht anfassen | **CLOSED / superseded / nicht gemergt** |
| TW7-A #106 | `TripSummary.stages`, `daten.ts`, `Reisekarte`, `GastReisen`, `reise-orte.ts` | nicht zurückdrehen | **auf `main` integriert**; Parallelitätsgate erfüllt |
| AP-4 Archiv | `trips.status`, ggf. Hub-Filter | nicht starten | eigener Task; kein Hub-Filter in TW7-A |
| AP-7 Registry | Traveller, RLS, Guest→Account, Readiness | Gate dokumentieren | kein Start ohne ADR+PO |
| Auth / RLS / AAL | Session, MFA, Admin-AAL2, Trip-RLS | nicht ändern | kein Account-Slice als Vehikel |
| Guest→Account | `GastreiseBruecke`, `party_schreiben` | nicht ändern | bleibt trip-scoped Copy |
| Provider / Admin / Growth | Commercial, Control Center, D1/G1 | nicht ändern | keine Identity-Daten ins Targeting |
| Historische Audits #39 / #76 | Plan / Next-Phase-Bericht | nur lesen | kein Rebase auf diese Branches |

---

## 10. Empfehlung

**Audit-Empfehlung:** `AP-4 IS NEXT ACCOUNT RUNTIME CANDIDATE`

**Keine Runtime-Freigabe durch diesen PR.** AP-4 startet erst über einen eigenen neuen Technical-Lead-Task/Spec und einen frischen nummerierten Account-Agenten.

| Thema | Lage |
| --- | --- |
| TW7-A-Parallelitätsgate | **erfüllt** (#106 auf `main`) |
| AP-4 | nächster Account-Lifecycle-Kandidat; `trips.status` Archivieren/Wiederherstellen |
| P2-TA-06 | latent; nicht automatisch vor AP-4 |
| AP-7 | gated: ADR-Nachfolger + Product-Owner + Identity/RLS/Sensitive-Data |
| PR-#39-Plan | fehlt auf `main`; **kein dauerhafter Blocker** |

Die frühere Formel `NO ACCOUNT RUNTIME while #106 is not integrated` ist erfüllt/überholt. `NO RUNTIME` gilt hier **nicht** mehr wegen #106. Ein neuer `NO RUNTIME` bräuchte konkrete neue Live-Evidence. Nach Sync von `1c88b7e4` gibt es keinen solchen Blocker.

### Warum AP-4 der Kandidat ist

Gespeichertes `archived` bleibt in `/reisen`-Gruppen sichtbar, ist in der Übersicht kein Fortsetzen, und es existiert kein Write-Pfad. TW7-A hat das bewusst nicht gebaut.

### Warum dieser PR AP-4 nicht startet

Shared `trips.status`. Braucht einen aktuellen, engen Vertrag (nicht still den historischen PR-#39-Plan). Hub-Kartenidentität von TW7-A darf nicht zurückgebaut oder als Archiv-Filter umgedeutet werden.

### Warum nicht P2-TA-06 vor AP-4

**Heute nur latent.** Kein Nutzerdefekt, kein P1. Isoliert, aber nicht der Account-Lifecycle-Gap.

### Warum nicht AP-7

Shared-Contract-/Product-Gate. Current Truth würde sich von trip-scoped auf account-scoped verschieben.

---

## 11. Datei-/Contract-/Test-Matrix für den empfohlenen Stand

Empfohlener nächster Runtime-Slice: **AP-4**, aber **nicht in diesem PR**.

| Element | Inhalt |
| --- | --- |
| Runtime-Dateien | keine |
| Shared Contracts | unverändert |
| Tests dieses Slices | nur Verifikation bestehender Contracts, keine neuen Produktregeln |
| DB / RLS / Auth / AAL | keine |
| TW7-A-Dateien | keine |

Kandidaten-Matrix, **nur falls** der Technical Lead später einen Slice ausdrücklich beauftragt – nicht Teil dieses PRs:

### Kandidat A – AP-4 (nach verifizierter TW7-A-Landung, wahrscheinlicher Lifecycle-Kandidat)

| Art | Pfad |
| --- | --- |
| Wahrscheinlich | neuer Status-Schreibweg; `KontoReisenGruppen`; `reise-lage`; Tests |
| Erst nach TW7-A auf `main` | `Reisekarte`, `daten.ts`, `TripSummary`, `GastReisen` |
| Vertrag | `trips.status` only; Archiv ≠ Traveller; frischer TL-Task, nicht still der PR-#39-Plan |
| Nicht | Hub-Filter statt Status-Write; Guest-Archiv; Service Role; RLS-Umbau; Start ohne neuen TL-Task |

### Kandidat B – P2-TA-06 (latent; nicht über AP-4 ohne eigene TL-Spec)

| Art | Pfad |
| --- | --- |
| Code | `lib/readiness/engine.ts` `travellerNormalisieren` |
| Bestehender Vertrag | ADR-0120, `credentialOptionsAus` |
| Nicht anfassen | `party_schreiben`, Guest→Account, AP-7, TW7-A-Dateien |
| Tests | `lib/readiness/engine.test.ts`; neuer Adversarial-Test: mehrere `documents` ohne `credentialOptions` darf nicht `documents[0]` wählen |
| Gates | Readiness-Tests, Typecheck, Lint; kein DB-/Auth-Gate |

---

## 12. Was dieser Audit nicht behauptet

- keine selbst durchgeführte Supabase-Query
- kein Browser-/Real-Device-Beweis
- keine Runtime-Freigabe für AP-4, AP-7 oder P2-TA-06 durch diesen PR
- keine aktuelle Endentscheidung `NO ACCOUNT RUNTIME because #106`
- kein erfundener Registry- oder Archiv-Contract
- kein Default-Pass im aktuellen App-Pfad
- zentrale Continuity-Dateien sind stale; das ist dokumentiert, nicht still korrigiert
- Exact-Head-Gates des Evidence-Heads `c9ef984a`: Actions `33102128084` SUCCESS; Vercel `CWsHGMfomgwJQezm1QGXbAYRu5YX` READY

---

## 13. STOPP

Branch mit `main` `1c88b7e4` synchronisiert. Empfehlung: **`AP-4 IS NEXT ACCOUNT RUNTIME CANDIDATE`**. Keine Runtime-Freigabe.

Kein Ready. Kein Merge. Kein AP-4-Start aus diesem PR. Unabhängiger Technical-Lead-Re-Review.
