# ChatGPT Technical Lead – TA-DL1 + AP-UX-NAV1 Post-Merge Checkpoint

Stand: 30. August 2026  
Status: **POST-MERGE VERIFIED / CONTINUITY CHECKPOINT / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter Runtime-Baseline-Stand

Aktueller Runtime-`main` vor diesem docs-only Continuity-Closure:

`ebaead3263c57298f5102df6cffeff49e6bd6ea6`

Evidence:

- GitHub Actions Post-Merge CI #1311 / Run `33282649222`: **SUCCESS**
- Vercel Production auf exact SHA: **SUCCESS / READY**
- Vercel Deployment: `6aViQ9poQF2p4WWoxiQ8o3aDWkcz`
- `main protected=false`

Dieser Checkpoint dokumentiert zwei unabhängig geprüfte und integrierte Slices. Er autorisiert **keinen automatischen Folgeslice**.

## 2. TA-DL1 – Document Lifecycle / Trip-Date Awareness

### Transport

- Issue #226: CLOSED / completed
- Agent: `Account plattform audit vorbereitung 19`
- Background Agent ID: `bc-23223c5d-1f12-447a-b02b-26054bfc666e`
- Source Draft PR #227
- final independently reviewed Source Head: `d9c16415b56a624812aa57b2d6110346f24ca633`
- Recovery PR #230
- Merge/Main danach: `20c203f5bee950b43db611f220c7cc5b88699dcb`

### Gates

- Source CI #1302 / Run `33281760672`: SUCCESS
- Source Vercel: SUCCESS
- Recovery CI #1305 / Run `33282195722`: SUCCESS
- Recovery Vercel: READY
- Post-Merge CI #1306: SUCCESS
- 0 blocking review threads vor Integration

### Gelieferte Wahrheit

TA-DL1 nutzt ausschließlich vorhandene `expiresOn`-Metadaten und erzeugt keinen zweiten Traveller-Wahrheitsraum.

- Parser akzeptiert echte ISO-Kalendertage `YYYY-MM-DD` und interpretiert ungültige Daten nicht um.
- Missing/invalid bleibt unknown/fail closed.
- Account Registry vergleicht ein Dokument nur gegen einen belegten Geräte-Kalendertag.
- Trip Workspace vergleicht jedes Dokument unabhängig gegen `startDate`/`endDate`.
- Boundary-Semantik ist getestet, einschließlich exakt Reisebeginn/-ende.
- Mehrere Dokumente werden unabhängig ausgewertet; kein `documents[0]` als Wahrheit.
- Issuer/Citizenship-Beziehung wird nicht umgedeutet.
- Keine positive Aussage, dass ein Dokument für Einreise, Visum, Transit, Boarding oder Destination Requirements genügt.
- Kein Best-Pass-Ranking, kein Default/Primary/Preferred/Chosen Credential.
- Kein persistierter Lifecycle-Status.
- Keine Migration, Schema-, RLS-, Grant-, Auth-, MFA-/AAL- oder Supabase-Mutation.

### Review-Fund und Korrektur

Agent 19 änderte zunächst entgegen dem Task die TL-owned globale Datei `docs/ACTIVE_WORK_STATUS.md` und ersetzte wesentliche Current-Truth-/Risk-Inhalte durch einen Feature-Branch-Handoff.

Technical-Lead-Entscheidung: **CHANGES REQUIRED**.

Der gleiche Agent/die gleiche Session stellte `docs/ACTIVE_WORK_STATUS.md` vollständig auf Baseline zurück und entfernte die Datei aus dem Feature-Diff. Runtime blieb unverändert. Erst auf dem neuen exact Head `d9c16415…` wurde PASS erteilt.

Verbindliche Lehre:

> Global Continuity (`JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` und TL-Checkpoints) bleibt Technical-Lead-owned. Ein Agent darf sie nur nach ausdrücklichem Task-Auftrag ändern.

## 3. AP-UX-NAV1 – Mobile Account Navigation Rail + `/reisen` consistency

### Transport

- Issue #228: CLOSED / completed
- Agent: `Account plattform audit vorbereitung 20`
- Background Agent ID: `bc-c734aa63-1027-4fe3-b458-d0c24661b281`
- Source Draft PR #229
- independently reviewed/integrated Runtime Head: `23e3885f89d0f1f71cd99cf9aef454a78f41ca66`
- Recovery PR #231
- Current Runtime `main`: `ebaead3263c57298f5102df6cffeff49e6bd6ea6`

### Gates

- Source CI #1308 / Run `33282430023`: SUCCESS
- Source Vercel Preview: SUCCESS (`8CaAk3ExeNPiEgbrjjbLo5YXGTNm`)
- Recovery CI #1310 / Run `33282563776`: SUCCESS
- Recovery Vercel: READY (`AMzS9Y4RxGmKWRkqPw9oLMkss4Dr`)
- 0 blocking review threads
- Post-Merge CI #1311 / Run `33282649222`: SUCCESS
- Production Vercel: SUCCESS / READY (`6aViQ9poQF2p4WWoxiQ8o3aDWkcz`)

### Geliefertes Produktverhalten

- Die bisherige mobile 2×2 Account-Navigation wurde durch eine einzeilige native horizontal scrollbare Tab-Rail ersetzt.
- Wischen scrollt nur die Rail; kein eigenes Swipe-to-Navigate-Gesture.
- Tabs bleiben semantische Links.
- Reihenfolge: Übersicht → Reisen → Reisende → Einstellungen.
- Aktiver Tab nutzt weiterhin `aria-current="page"`.
- Falls der aktive Tab außerhalb der sichtbaren horizontalen Fläche liegt, wird nur horizontal verschoben; kein vertikales `scrollIntoView`-Springen.
- Eingeloggte Nutzer sehen die gemeinsame Account Navigation auch auf `/reisen`.
- Gäste auf `/reisen` sehen keine Account Navigation.
- `/reisen` nutzt seine bereits bestehende serverseitige `auth.getUser()`-Aussage; keine zweite Auth-Wahrheit.
- Route `/reisen` bleibt unverändert.
- Sticky wurde bewusst nicht erzwungen, weil eine dauerhaft fixierte zweite Mobile-Leiste auf kleinen iPhones Bildschirmhöhe kostet und Header/Safe-Area-Konflikte erzeugen kann.

### Review-Fund und Korrektur

Erste Implementation verwendete `touch-pan-x` auf der Rail. Technical Lead bewertete dies als mobilen UX-Blocker, weil vertikales Page-Scrolling auf Touch-Geräten blockiert werden kann, wenn die Geste auf der Rail beginnt.

Technical-Lead-Entscheidung: **CHANGES REQUIRED** an denselben Agenten.

Agent 20 entfernte die restriktive Touch-Action, aktualisierte Tests/Audit und reconciled den Branch gegen den nach TA-DL1 neuen `main`. Danach vollständiges Exact-Head-Re-Gating und PASS.

### Später Source-Doku-Stamp

Nach dem bereits SHA-gelockten Runtime-Head `23e3885f…` erschien auf Source PR #229 noch Commit:

`08a626c466631cc2e0d1d434d58d28241c625faa`

Dieser Commit:

- Parent = `23e3885f…`;
- änderte nur drei AP-UX slice-lokale Status/Self-Review/Handoff-Dokumente;
- enthielt **keine Runtime-Änderung**;
- stampte nur Source CI/Vercel-Evidence.

Der Runtime-Merge wurde bewusst nicht nachträglich erweitert. Recovery PR #231 integrierte exakt den independently reviewed Runtime Head `23e3885f…`. Diese TL-Continuity übernimmt/superseded die späte Evidence. Source PR #229 ist geschlossen.

## 4. Kumulative Traveller-/Account-Wahrheit nach beiden Slices

Verbindliches Modell:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig zulässige Optionen.**

Verbindliche Authority:

> **Account Registry = wiederverwendbare aktuelle Traveller-Fakten. Trip Snapshot = einzige Current Truth für eine konkrete Reise.**

Integriert sind nun mindestens:

- Foundation E Trip Traveller 1:n Citizenships / 1:n Documents;
- Issuer Country ≠ Citizenship;
- explizite Document↔Citizenship-Relation;
- Guest→Account Trip-Copy mit Arrays/Relation;
- AP-7 Gate 0 + Dual-Authority;
- AP-7-S1 Shared Domain Contract;
- AP-7-S2 Registry Persistence / owner-only RLS auf Production;
- AP-7-S3 Registry CRUD/UI;
- AP-7-S4 Registry → unabhängige Trip Snapshot Materialisierung;
- TA-DL1 Calendar-Date Document Lifecycle;
- AP-UX-NAV1 skalierbare Mobile Account Navigation.

Weiterhin verbindlich verboten/ungeklärt:

- kein globaler/default/primary/preferred/chosen Passport;
- keine first-item Wahrheit;
- keine automatische Best-Pass-Entscheidung;
- keine Visa-/Entry-Sufficiency ohne echte Evidence;
- keine Passnummern/Scans/MRZ/Biometrie/DOB/Health im Core.

## 5. Product-Owner Country-UX-Richtung – noch nicht implementiert

Der Product Owner hat die derzeit sichtbaren ISO-2-Eingaben/Labels (`CH`, `HR`, `ISO-2`) als verwirrend bewertet.

Technical-Lead-Produktentscheidung:

- ISO-2 bleibt intern kanonischer, sprachunabhängiger Country Key.
- Der Nutzer soll Codes nicht kennen/eintippen müssen.
- Eine künftige Country-Control soll suchbare lokalisierte vollständige Ländernamen zeigen, sinnvollerweise inklusive offizieller Flagge, z. B. `🇨🇭 Schweiz` und `🇭🇷 Kroatien`.
- Persistiert bleibt der interne ISO-2-Code.
- Diese Control soll wiederverwendbar sein für Wohnsitzland, Citizenship und Document Issuing Country.
- Issuer Country und Citizenship bleiben getrennte Facts.
- Keine automatische Ableitung, Primary-/Default-/Vorauswahl-Semantik.
- Mehrsprachigkeit muss berücksichtigt werden.

Status: **PRODUCT DIRECTION / NOT BUILT / NOT AUTOMATICALLY AUTHORIZED**.

Vor Umsetzung muss ein frischer Binding Slice Precheck bestehende Country-/i18n-Utilities, Validierungsgrenzen, Datenmodelle und betroffene UI-Flächen prüfen. Ziel ist eine einzige wiederverwendbare Country-Wahrheit, kein paralleler Country-Katalog.

## 6. Infrastruktur / Provider / bekannte Gates

### P1 Supabase Replay Debt

Unverändert:

Production Migration History Version `20260829140000_trip_item_commercial_provenance` speichert eine nicht replaybare Prosa-Statement-Body, obwohl Production S5-B Catalogobjekte existieren. Development besitzt weder Version noch S5-B Objekte/Rollen.

Keine Reparatur ausgeführt.

Vor Rebase/Reset/Replay-/migrationsnaher Arbeit: separater PO-gated Repair mit Backup/PITR/Before-Image/Fingerprint/Replay-Proof.

### P2 Governance

`main protected=false`.

### Provider

Keine realen Provider Secrets/API-Keys/paid calls/live runtime principals aktiviert. TW-8 bleibt hinter Provider S5 + realer Commercial Provenance geschlossen.

## 7. Agentenstatus

STOPPED / completed:

- `Account plattform audit vorbereitung 20` – AP-UX-NAV1
- `Account plattform audit vorbereitung 19` – TA-DL1
- `Account plattform audit vorbereitung 18` – AP-7-S4
- `Account plattform audit vorbereitung 17` – AP-7-S3
- `Jetnity infrastructure migration audit 1` – Supabase Replay Gate-0 Audit

Aktiver Cursor-Agent: **keiner**.

## 8. Nächster Chat / nächster Slice

Es ist **kein Folgeslice automatisch autorisiert**.

Nächster Technical Lead muss:

1. `JETNITY_START_HERE.md` lesen;
2. Operating Standard + Binding Slice Precheck lesen;
3. `main`, PRs/issues/branches, CI/Vercel und relevante Supabase-Evidence live verifizieren;
4. Binding Build Order + Account Platform Plan gegen AP-7-S1–S4 + TA-DL1 + AP-UX-NAV1 reconciliieren;
5. verbleibende Traveller-/Multi-Citizenship-/Country-UX-Lücken priorisieren;
6. Country Picker als möglichen migrationsfreien Kandidaten prüfen, ohne ihn automatisch zu starten;
7. migrationsnahe Kandidaten wegen P1 Replay Debt separat behandeln;
8. erst danach bounded Slice(s), Agentenanzahl und Kollisionsmatrix festlegen.

Neue logische Einheit → frischer Cursor-Agent. Review-Fix → derselbe gespeicherte Agent/dieselbe Session.
