# Jetnity – QS-2 Independent Quality / Security / Resilience Audit

Stand: 26. August 2026  
Agent: `Jetnity quality security audit`  
Status: **AUDIT AUSGEFÜHRT / STOPP wegen P1**  
Draft-PR: #79  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`

Arbeitsmodus: **AUDIT / EVIDENCE ONLY.** Keine Runtime, keine stillen Fixes, kein D0-2, kein Folgeslice.

Bestehende PASS-Berichte (QS-1, TW-5, D0-1) wurden nicht als Beweis übernommen. Jede Regression und jeder neue Befund wurde auf dieser Baseline unabhängig geprüft.

---

## 1. Live-Rekonstruktion vor Audit

| Prüfung | Live-Stand |
| --- | --- |
| GitHub / `origin/main` | `ba86279e5ee2505bfd13801ae5e05ef50ba87c22` |
| Festgelegte QS-2-Baseline | **identisch** – STOP-Verschiebung nicht ausgelöst |
| Baseline-Commit | `Merge PR #73: rigorous Technical Lead merge autonomy` |
| Audit-Branch | `audit/qs2-quality-security-resilience` |
| Merge-Base | `ba86279e` |
| Ahead / Behind vor diesem Bericht | **2 / 0** (Task + Status); nach diesem Bericht docs-only +1 |
| PR #79 | Draft OPEN, MERGEABLE/CLEAN, Review-Threads **0** |
| PR #74 / D0-2 | Draft OPEN @ `8ea406e5` – **nicht Baseline, nicht verändert** |
| Parallele Audit-Drafts | #75 TW-6, #76 Traveller/Account, #77 Provider S4–S8, #78 Admin D–K |
| Historische offene Drafts | #52, #50, #40, #39, #28 – nicht Audit-Ziel |
| Baseline-CI | Actions `32909707582` SUCCESS |
| Baseline-Vercel Production | SUCCESS, SHA `ba86279e` |
| Audit-Branch-CI vor Bericht | Actions `32910210659` SUCCESS auf `3f2bd5d2` |
| Audit-Branch-Vercel | READY `9Tw8UwXMntJT4eJW6Fkw9bjT19vL` |
| `main` Branch Protection | API 403 / laut Continuity weiterhin **nicht aktiviert** |

D0-2 ändert SEO-Runtime (`app/robots.ts`, `app/sitemap.ts`, `lib/seo/*`, öffentliche Layouts). QS-2 hat diese Dateien nur auf **main** gelesen.

`docs/ACTIVE_WORK_STATUS.md` wurde **nicht** geändert.

---

## 2. Ergebnis in einem Satz

Der integrierte Stand nach TW-5, D0-1 und Merge-Autonomie ist **nicht release-clean**.

**Kein P0.**  
**Zwei neue P1.**  
P1-QS1-01 ist **geschlossen**.  
D0-P1-03 bleibt **offen** (bekannter Legal-P1, nicht neu).

Keine Runtime-Korrektur in diesem Slice. Owner-Entscheidung liegt beim Technical Lead.

---

## 3. Finding-Matrix

### P1-QS2-01 – Admin-Login erzwingt keinen MFA-/AAL2-Step-up

| Feld | Inhalt |
| --- | --- |
| Severity | **P1** |
| Datei / Route / Contract | `app/(public)/admin/login/actions.ts` `signInWithPasswordAction`; `lib/auth/admin-guard.ts` `evaluateAdminAccess` / `requireAdminPage`; Contrast `components/auth/LoginForm.tsx`. Shared Contract: Auth / Session / MFA / AAL |
| Empfohlener Owner | Technical Lead + `Account plattform audit vorbereitung` |
| Shared / PO-Gate | Auth/MFA/AAL ist Shared Contract. Angleichen des Admin-Logins an den bestehenden Consumer-AAL-Check ist **kein** neues Auth-Modell. Eine globale AAL-Policy-Änderung wäre Product-Owner-Gate. |

**Evidence**

Consumer-Login prüft nach `signInWithPassword` `getAAL()` und öffnet TOTP, wenn `nextLevel === 'aal2'`.

Admin-Login ruft nur `signInWithPassword` und `evaluateAdminAccess()` auf, dann `redirect('/admin')`. Weder Login-Action noch Admin-Guard noch RLS prüfen AAL.

Unabhängiger Source-Check in diesem Slice:

```json
{
  "adminLoginHasGetAAL": false,
  "adminGuardHasAal": false,
  "consumerLoginHasGetAAL": true
}
```

`npm run auth:pruefen` auf dem Development-Branch: **55/55**, inklusive Erwartung `mfa_allow_low_aal = false`. Das ersetzt **keine** App-seitige Admin-AAL-Prüfung. Production-Auth wurde hier nicht neu gegen die Management-API gelesen. Supabase-RLS enthält kein `aal`.

**Erwartet vs. tatsächlich**

- Erwartet: Ein Konto mit eingerichtetem zweiten Faktor erreicht privilegierte Admin-Flächen nur nach AAL2.
- Tatsächlich: Derselbe Diebstahl des ersten Faktors, den Consumer-Login mit TOTP stoppt, reicht auf `/admin/login`.

**Impact**

Höherwertige Fläche als `/login`, schwächerer Faktor-Zwang. Kein anonymer Admin-Bypass, kein RLS-Bypass. Kein P0, weil Passwort plus Admin-Rolle weiter nötig sind.

**Warum Tests es nicht verhindern**

Kein Test erwartet `getAAL` im Admin-Login. Admin-Tests prüfen `requireAdminPage` / `requireAdminApi` und Rollen, nicht Assurance Level.

**Minimaler Closure-Scope**

Denselben AAL2-Step-up wie `LoginForm` vor `redirect('/admin')` und fail-closed AAL-Check in `evaluateAdminAccess` für Page/API. Keine neue MFA-Produktentscheidung, keine Production-Auth-Änderung in diesem Fix, sofern nur die bestehende Consumer-Semantik gespiegelt wird.

---

### P1-QS2-02 – Guest→Account hebt unbewiesene Hotel-/Activity-Handelsfelder ins Konto

| Feld | Inhalt |
| --- | --- |
| Severity | **P1** |
| Datei / Route / Contract | `lib/flights/nutzlast.ts` `flugNutzlastOhneUnbewieseneWahrheit`; `lib/trips/abbildung.ts` `alsNutzlast`; `lib/trips/anlegen.ts` `reiseAusNutzlastAnlegen`; Contrast `lib/hotels/aktionen.ts` `hotelInReiseUebernehmen`. Shared Contract: Guest→Account / Commercial Provenance |
| Empfohlener Owner | `Trip workspace audit architecture` + Technical Lead (Guest→Account-Grenze) |
| Shared / PO-Gate | Änderung der persistierten Guest→Account-Felder ist Shared-Contract-relevant. Keine Provideraktivierung. |

**Evidence**

Konto-Hotelübernahme verlangt serverseitigen Nachweis. `planpunktAnlegen` nimmt keine Preis-/Providerfelder entgegen. Guest-Hotelübernahme schreibt LocalStorage ausdrücklich ohne Server-Verifikation.

`flugNutzlastOhneUnbewieseneWahrheit` nullt nur `kind === 'flight'`. Stay/Activity laufen unverändert durch `alsNutzlast` / `reise_anlegen`.

Unabhängige Reproduktion mit manipuliertem Guest-Stay neben einem Flug:

```json
{
  "flightPriceAfterAlsNutzlast": null,
  "flightProviderAfterAlsNutzlast": null,
  "stayPriceAfterAlsNutzlast": 9999,
  "stayProviderAfterAlsNutzlast": "evil-hotel",
  "stayExternalRefAfterAlsNutzlast": "hack-stay",
  "stayBookingUrlAfterAlsNutzlast": "https://evil.example/book"
}
```

Roh-Evidence: `/opt/cursor/artifacts/qs2_repro.json`.

**Erwartet vs. tatsächlich**

- Erwartet: Dieselbe Nachweisgrenze wie Konto-Hotel/Activity und wie Guest-Flug. Unbewiesene Provider-/Preis-/Ref-/Booking-Felder werden nicht zur Account-Wahrheit.
- Tatsächlich: Flug wird gestrippt. Stay/Activity mit erfundenem Preis und Provider werden persistierbar. Auto-Import über `GastreiseBruecke` macht den Weg zum Default.

**Impact**

Zweite Commercial-Wahrheit im Konto-Graphen. Nutzer oder späteres Marketing/Budget können LocalStorage-Preise als belegte Option lesen. Kein Cross-User-Write, kein Secret-Leak.

**Warum Tests es nicht verhindern – und teilweise festschreiben**

- `lib/trips/uebernahme.test.ts` fordert Flug-Strip und **erlaubt** Transfer-/Mietwagen-Nutzerpreise.
- Es gibt **keinen** parallelen Stay-/Activity-Strip-Test.
- `lib/hotels/konto-uebernahme.test.ts` schützt nur den eingeloggten Such-Add, nicht den Import.

**Minimaler Closure-Scope**

Stay/Activity (und ggf. Transfer/Rental, falls sie nicht bewusst User-Intake bleiben sollen) analog zum Flugstrip behandeln: `price_*`, `provider`, `external_ref`, `booking_url` bei Guest→Account nullen. Regressionstest für Stay/Activity. Mobility-User-Intake nicht still mitändern, ohne den S3-Vertrag zu benennen.

---

### P2-QS2-03 – Official-Attention-Flut (QS-1 P2-QS1-02, ungelöst)

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Datei | `lib/trips/attention.ts` `officialPflichtslots` / Slot-Schleife |
| Evidence | Ein Traveller, ein Ziel, keine Official-Evals → viele Punkte mit gleichem Titel (`Offizielle Einreisehinweise sind nicht vollständig geprüft` bzw. unavailable-Variante). Lage bleibt ehrlich. |
| Tests | `attention.test.ts` fordert Präsenz von `official.ungeprueft`, keine Obergrenze. |
| Owner | Trip workspace / TW-9 |
| TW-6-Blocker | Nein |
| Closure | Anzeige aggregieren; Slot-Wahrheit intern behalten. |

---

### P2-QS2-04 – Planpunkt-Delete ohne Bestätigung (QS-1 P2-QS1-03)

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Datei | `components/trips/TripWorkspacePlan.tsx` |
| Evidence | Papierkorb löscht sofort. Ganze Reise hat `window.confirm`. |
| Owner | Trip workspace |
| Closure | Confirm oder Undo für Guest und Account. |

---

### P2-QS2-05 – UI-Audit prüft Coverage-Route-Wahrheit nicht (QS-1 P2-QS1-04)

| Feld | Inhalt |
| --- | --- |
| Severity | **P2** |
| Datei | `scripts/trip-workspace-ui-audit.mjs` |
| Evidence | Harness prüft Overflow/IA/`inert`, nicht Übersicht-Flüge-Kompakttext. P1-QS1-01 wäre ohne Unit-Regression unsichtbar geblieben. |
| Closure | Ein Audit-State: ungeplanter Transitflug, Route genau einmal, kein erfundenes `Reihenfolge unbekannt`. |

---

### P3-QS2-06 – Delete-Actions ohne Row-Count (QS-1 P3-QS1-08, erweitert)

| Feld | Inhalt |
| --- | --- |
| Severity | **P3** |
| Dateien | `planpunktEntfernen`, `reiseLoeschen`, `readinessEntfernen`, `travellerEntfernen` |
| Evidence | `ok: true` ohne Count. RLS verhindert Cross-User-Delete. Contrast: `planpunktBuchungsstatusSetzen` prüft `!data`. |
| Closure | `count === 1` oder Pre-Read; `aktionen.test.ts`. |

---

### P3-QS2-07 – Official-Slot-IDs im DOM (QS-1 P3-QS1-05)

| Feld | Inhalt |
| --- | --- |
| Severity | **P3** |
| Datei | `TripWorkspaceJetztWichtig.tsx` `data-attention-punkt` |
| Impact | Client-Refs und Requirement-Typ im HTML, keine MRZ. |
| Closure | Opake Display-ID. |

---

### P3-QS2-08 – Residual Safety/Seasonal-Karten + fehlendes Memo (QS-1 P3-QS1-06/09)

| Feld | Inhalt |
| --- | --- |
| Severity | **P3** |
| Datei | `TripWorkspace.tsx` |
| Evidence | Produktpfad übergibt keine Evaluations → Karten `sichtbar: false`. Attention orchestriert lokal. Doppelableitung ohne Memo. |
| Closure | Eine Presentation-Owner-Schicht; `useMemo`. |

---

### P3-QS2-09 – Continuity nennt veralteten `main`-SHA

| Feld | Inhalt |
| --- | --- |
| Severity | **P3** |
| Dateien | `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md` nennen `5f9dc4b0`; live `main` ist `ba86279e`. `JETNITY_BINDING_BUILD_ORDER.md` markiert TW-3/TW-5 noch nicht als integriert. |
| Impact | Agenten, die Live-Rekonstruktion überspringen, arbeiten auf falscher Baseline. `JETNITY_START_HERE.md` verlangt Live-Verify; Parallelagenten dürfen `ACTIVE_WORK_STATUS.md` nicht schreiben. |
| Closure | Technical Lead zieht zentrale Continuity nach Parallel-STOPP nach. **Nicht in QS-2.** |

---

## 4. Regression früherer P1s

| ID | Stand auf `ba86279e` | Evidence |
| --- | --- | --- |
| **P1-QS1-01** | **geschlossen** | `ungeplantePunkteLesen`; Produktpfad `ohneTag === reise.ohneTag` → Route `Zürich → Doha → Bangkok` **einmal**, kein `Reihenfolge unbekannt`. Tests in `arbeitsbereich.test.ts` + unabhängige Repro. |
| **D0-P1-01 / D0-P1-02 / D0-P2-03 / P2-D0-1-TL-01** | **geschlossen auf dieser Baseline** | `/reisen` Production-HTML `robots=noindex, nofollow`; Sitemap nur `/` und `/planen`; `planenHatIndexRelevanteParams` per Key-Präsenz; Admin/Unauthorized noindex. |
| **D0-P1-03** | **weiter offen** | Production `https://jetnity-app.vercel.app/privacy` und `/terms` → **HTTP 404**. `RegisterForm` verlangt Zustimmung und verlinkt beide Pfade. Legal-/PO-Slice; keine Rechtstexte erfinden. |

QS-1 P3-QS1-07 (`aria-current="page"` auf In-Page-Nav) ist auf dieser Baseline **nicht mehr vorhanden** (`TripWorkspaceNavigation` ist nur noch Zurück).

---

## 5. Geprüft ohne Finding

| Kategorie | Ergebnis |
| --- | --- |
| P0 Remote-IDOR / RLS-Bypass / Service-Role im Produktpfad | Kein Finding |
| `/reisen/[tripId]` Enumeration | Fremde und fehlende UUID → dieselbe 404 |
| Open Redirect `/auth/callback` | Allowlist; Encoding-/Host-Tricks abgewiesen |
| XSS `dangerouslySetInnerHTML` im Workspace | Nicht vorhanden; Homepage JSON-LD statisch |
| `javascript:` / unsichere Booking-URLs | Schema + Tests lehnen ab |
| Secret-/Token-Leak in Workspace-Client | Kein `SERVICE_ROLE` in `TripWorkspace*` |
| Admin-API ohne `requireAdminApi` | 12/12 geschützt |
| Fake-Visa / Fake-Provider-Health / Fake-Preis im Konto-Such-Add | Hotel/Flight-Nachweis fail-closed |
| Default-Pass / Issuer=Citizenship | `credentialOptionsAus` ohne Documents → `:none` |
| Transit als Etappe | Timeline liest nur `reise.stages` |
| D0-1 Indexvertrag auf **dieser** Baseline | Hält; Production-Sitemap ohne `/reisen` |
| Tests, die D0-1 falsch festschreiben | Nicht gefunden |
| `0 Aktivitäten` als Pflichtlücke | Explizit kein Attention-Signal |
| Empty vs Error | `datenbank-lesen` / `ladezustand` getrennt |
| Guest/Account/Mobile/Desktop Ableitungsparität Workspace | Dieselbe Zustandsmaschine |
| P1-QS1-01 Regression | Keine |
| D0-2 Runtime | Nicht geprüft, nicht verändert |

Bekannte Residuen, **nicht** als neue gleichwertige QS-2-P1 aufgebauscht:

- In-Memory Provider-Rate-Limits (dokumentiertes S1, S6 geplant).
- Auto-Import von Guest-Drafts beim Login (dokumentierter Guest→Account-Vertrag; Shared-Device bleibt Rest-Risiko).

---

## 6. Unabhängig ausgeführte Gates

Alle Commands in `/workspace` auf dem Audit-Branch. Runtime unverändert.

| Command | Ergebnis | Exit |
| --- | --- | --- |
| Gezielte Tests (arbeitsbereich, attention, uebernahme, index-grenze, robots, hotel-konto, naechstes-ziel) | **123/123** | **0** |
| `npm test` | **2013/2013**, 369 Suites | **0** |
| `npm run check:setup:ci` | OK, 1 Warning: keine `.env` | **0** |
| `npx tsc --noEmit` | OK | **0** |
| `npm run lint` | No ESLint warnings or errors | **0** |
| `npm run check:dead` | 704 erreichbar, 1 begründete Ausnahme `CookieConsent.tsx` | **0** |
| `npm run check:exports` | 596 Dateien, 0 tote Exporte | **0** |
| `npm run check:deps` | 0 ungenutzte Pakete | **0** |
| `npm run check:api-schutz` | 12 Admin-Routen, alle `requireAdminApi()` | **0** |
| `npm run check:schema-bezug` | 17 Tabellen/Views, 19 Funktionen | **0** |
| `npm run build` | Production Build OK | **0** |
| `npm run auth:pruefen` | Development-Branch 55/55 | **0** |

`npm run audit:trip-workspace` wurde in diesem Slice **nicht** erneut gefahren: nach bestätigtem P1 gilt STOPP; der Harness deckt die neuen P1s ohnehin nicht ab.

Remote, nicht als Ersatz:

- Baseline `ba86279e`: CI `32909707582` SUCCESS; Production Vercel SUCCESS.
- Audit-Branch `3f2bd5d2`: CI `32910210659` SUCCESS; Preview READY.

Logs: `/opt/cursor/artifacts/qs2_*.log`, `qs2_repro.json`, `qs2_production_http.json`.

---

## 7. Testqualität

**Stark:** P1-QS1-01-Regression; D0-1 Key-Präsenz; Hotel-Konto-Nachweis gegen Browser-Preise; Guest→Account Flug-Strip; Attention-Lagen; Open-Redirect-Allowlist; Empty/Error.

**Lücken / falsche Festschreibung**

1. Kein Admin-AAL-Test → P1-QS2-01 unsichtbar.
2. Flug-Strip-Test ohne Stay/Activity-Gegenstück → P1-QS2-02 wird durch Weglassen akzeptiert.
3. Transfer-/Mietwagen-Preise werden als korrekt persistierend getestet (S3 User-Intake). Das darf Stay nicht implizit decken.
4. Attention-Tests ohne Kardinalitätsgrenze.
5. UI-Audit ohne Coverage-Route-Text.
6. Keine `aktionen.test.ts` für 0-Row-Delete.

---

## 8. Parallelität / Kollision

| PR | Rolle |
| --- | --- |
| #74 D0-2 | SEO-Runtime-Overlap mit D0-1-Dateien. QS-2 hat D0-2 nicht gelesen als Audit-Ziel und nicht geändert. |
| #75–#78 | Audit-only Parallelstreams. Nur Kollisionskontrolle. |
| #79 | Dieser Slice, docs-only. |

---

## 9. Adversarial Self-Review

1. **Ist P1-QS2-01 wirklich P1?** Ja. Privilegierte Fläche, schwächerer Faktor als Consumer-Login. Nicht P0: kein unauthentisierter Admin, kein RLS-Bypass. `mfa_allow_low_aal=false` auf Development widerlegt den App-Gap nicht.
2. **Ist P1-QS2-02 wirklich P1?** Ja. Konto-Hotel verlangt Nachweis; Guest-Import schreibt dieselben Commercial-Spalten ohne Nachweis. Nicht P2 „User darf Notizen schreiben“: `provider`/`price_amount`/`external_ref`/`booking_url` sind Nachweis-Felder. Mobility-User-Intake nicht still auf P1 hochgezogen.
3. **Shared-Device-Auto-Import als P1?** Nein. Dokumentierter Vertrag. Nur Rest-Risiko.
4. **In-Memory-Rate-Limit als neues P1?** Nein. Bekanntes S1-Residual.
5. **Continuity-SHA als P2?** Nein. P3; Live-Verify ist Pflicht; QS-2 darf `ACTIVE_WORK_STATUS.md` nicht schreiben.
6. **Haben 2013 grüne Tests die P1s widerlegt?** Nein. Sie decken Admin-AAL und Stay-Import-Strip nicht.
7. **Runtime-Fix eingeschleppt?** Nein. Nur QS-2-Docs. Scratch-Repro nicht committed.
8. **D0-2 angefasst?** Nein.
9. **Baseline still verschoben?** Nein. `main` blieb `ba86279e`.

---

## 10. Priorisierte Closure-Reihenfolge

1. **P1-QS2-01** Admin-AAL – eigener enger Auth-Slice, Shared-Contract-Review.
2. **P1-QS2-02** Guest→Account Stay/Activity-Strip + Regression.
3. D0-P1-03 Legal-404 – Product-Owner / Legal, unverändert.
4. P2-QS2-05 Harness-Route-Text, dann P2-QS2-03 Official-Aggregation, dann P2-QS2-04 Delete-Confirm.
5. P3 Write-Path / DOM / Memo / Continuity durch Technical Lead.

---

## 11. STOPP

**STOPP für unabhängigen ChatGPT-/Technical-Lead-Review.**

- Kein Ready
- Kein Merge
- Keine Runtime-Korrektur
- Kein D0-2
- Kein Folgeslice
- Kein Eingriff in PR #74–#78
- `docs/ACTIVE_WORK_STATUS.md` unverändert

Der Technical Lead entscheidet Finding-Owner und Reihenfolge.
