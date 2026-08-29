# Traveller / Account / Multi-Citizenship – priorisierter Implementierungs-Backlog

Stand: 29. August 2026  
Status: **VORGESCHLAGENER BACKLOG AUF CLOSED-AS-DUPLICATE-BRANCH / NICHT KANONISCH / KEIN STARTAUFTRAG / KEIN FOLGESLICE**  
Branch: `audit/traveller-account-multicitizenship-gap-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/192  
Vertrag: `docs/TRAVELLER_ACCOUNT_MULTICITIZENSHIP_ENTITY_OWNERSHIP_CONTRACT_2026-08-29.md`  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity traveller account audit 1`**

> Dieser Backlog ist eine Empfehlung an den Technical Lead. Kein Eintrag startet, weil dieses Dokument existiert. Jeder Slice braucht einen eigenen versionierten Task, Draft-PR, frische nummerierte Generation und unabhängigen Exact-Head-Review.

---

## 1. Bindende Reihenfolge (nicht neu erfinden)

Aus `docs/JETNITY_BINDING_BUILD_ORDER.md` und `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` §7–§8:

1. Trip Workspace fertigbauen; **TW-8 bleibt hinter Provider S5-B + realer Commercial Provenance**.
2. Traveller/Pass/Multi-Citizenship **produktweit vervollständigen**, ohne Foundation E neu zu bauen.
3. Account AP-5–AP-12 gemäß Plan; **AP-7 serial**, nicht vor AP-5/AP-6a, nicht automatisch nach AP-6b.
4. Provider Readiness / echte Provider erst nach ihren Gates.
5. Collaboration, Native-Runtime, Payments, Public Launch bleiben extra gegatet.

Dieser Audit ändert die Binding Build Order nicht.

---

## 2. Slice-Klassen

| Klasse | Bedeutung |
| --- | --- |
| **Exclusive shared contract** | Nur ein Schreiber. Frischer Agent. Eigener Task. Keine Parallelität mit anderen Identity-/Consent-/Traveller-Persistenz-Slices. |
| **Parallel-safe** | Darf neben einem anderen Programm laufen, wenn Dateien/Contracts nicht kollidieren. |
| **Blocked** | Abhängigkeit oder Product-Owner-Gate nicht erfüllt. |
| **Do not start from this PR** | Explizites Non-Scope dieses Audits. |

---

## 3. Priorisierte Slots

### Slot 0 — Dieser Audit (jetzt)

| Feld | Wert |
| --- | --- |
| Arbeit | Repository-first Gap-Audit + Vertrag + Backlog |
| Status | **in diesem Draft-PR** |
| Klasse | Docs-only / parallel-safe zu Runtime-fremden Audits |
| Gate | Technical-Lead Exact-Head-Review; kein Ready/Merge durch den Autor |
| Non-Scope | Runtime, Schema, Supabase, Provider, Account-Platform-Implementation |

### Slot A — AP-6a Legal Runtime (Account-Plan, nicht Traveller)

| Feld | Wert |
| --- | --- |
| Abhängigkeit | PO/Legal-Content-Matrix; Gate 0 integriert (ADR-0195) |
| Traveller-Bezug | keiner direkt; Plan stellt AP-7 hinter AP-5/AP-6a |
| Klasse | **Blocked** auf Legal-Content; nicht aus diesem Audit starten |
| Slice-Grenze | `/privacy` `/terms` Runtime; keine Traveller-Tabellen |

### Slot B — AP-6b Privacy/Consent Persistenz

| Feld | Wert |
| --- | --- |
| Abhängigkeit | nach AP-6a; serial mit AP-7/AP-8 |
| Traveller-Bezug | Consent-Naht, bevor eine Registry persistiert wird |
| Klasse | **Exclusive shared contract**; Product-Owner Production-Migration |
| Slice-Grenze | Consent/Export/Delete. Keine Traveller-Registry. Keine Dokumentpayloads. |

### Slot C — AP-7-S2 Account-Registry Persistenz (größter Traveller-Gap)

| Feld | Wert |
| --- | --- |
| Produktziel | Wiederverwendbare Traveller-/Citizenship-/Document-Fakten unter Dual-Authority |
| Abhängigkeit | ausdrückliche Product-Owner-Entscheidung + Persistence-ADR als Nachfolger zu ADR-0102/0117 + Identity/RLS/Production-Gate. Nicht automatisch nach S1 oder nach diesem Audit. |
| Voraussetzung im Code | `lib/traveller/account-registry.ts` + Tests (S1 integriert) |
| Klasse | **Exclusive shared contract**. Frischer Agent, **nicht** Generation 1 dieses Audits. |
| Sichere Slice-Grenze | Schema + RLS + Grants + Mapping aus dem bestehenden Domain-Contract. **Keine UI.** Kein Guest→Registry-Import. Kein Live-Link. Keine Nummern/MRZ. Kein C2. Kein AP-8. |
| Tests | Cross-User-Leak, Cross-Trip-Leak, Limit 8/12, fail-closed sensible Schlüssel, Snapshot-Disjointness bei späterer Projektion |
| Parallel verboten mit | AP-6b, AP-8, C2, Collaboration-RLS, jeder Änderung an `party_schreiben` |

### Slot D — AP-7-S3 Registry UI / CRUD

| Feld | Wert |
| --- | --- |
| Abhängigkeit | nach S2 Persistenz + Tests |
| Klasse | Exclusive zum Traveller-Account-Surface; nicht parallel zu S2 |
| Slice-Grenze | Account-UI für mehrere Citizenships/Dokumente. Kein Default-Pass. Kein stilles Projizieren in bestehende Reisen. Progressive Disclosure gemäß Citizenship-Requirement-Policy. |
| Native | dieselben Contracts konsumieren; keine Native-only Felder |

### Slot E — AP-7-S4 Guest→Registry Opt-in Import

| Feld | Wert |
| --- | --- |
| Abhängigkeit | nach S2, besser nach S3 |
| Klasse | Exclusive Guest→Account-Naht |
| Slice-Grenze | Explizites Opt-in **getrennt** vom heutigen automatischen Trip-Copy. Kein Auto-Dedup auf Label/Residence/Citizenship-Set. Bei Unsicherheit zwei Registry-Einträge statt stiller Merge. |
| Non-Scope | Änderung der heutigen `GastreiseBruecke`-Trip-Übernahme-Semantik, außer dokumentiertem Add-on |

### Slot F — TW Dokument-Vergleichs-UX (ohne Winner-Persistenz)

| Feld | Wert |
| --- | --- |
| Abhängigkeit | Library existiert (`lib/readiness/vergleich.ts`). **Ohne Requirements-Provider bleibt der Winner immer fail-closed.** |
| Klasse | **Parallel-safe** zu AP-7, **solange** nur trip-scoped `party` + bestehende Evaluations gelesen werden und kein Wahlfeld persistiert wird |
| Empfehlung | **Nicht vor einem echten Requirements-Provider starten.** Sonst wäre die UX ehrlich nur „Noch nicht zuverlässig vergleichbar.“ — das steht bereits in `Reisevorbereitung.tsx`. Ein Slice nur um dieselbe Copy schöner zu setzen, verzögert den Kern. |
| Slice-Grenze später | Read-only Anzeige von `credentialOptionenVergleichen`. Pflicht vs. Empfehlung trennen. Kein `chosenCredentialOptionRef` auf Traveller oder Trip. |

### Slot G — Requirements-Provider (Visa/Entry Evidence)

| Feld | Wert |
| --- | --- |
| Abhängigkeit | Provider-Vertrag, Secrets, paid calls, Legal/Lizenz = besondere Product-Owner-Gates |
| Klasse | **Blocked** / Provider-Programm; nicht aus Account starten |
| Slice-Grenze | Adapter hinter `requirementsProviderAus()`. Pro Traveller × Credential-Option × Destination/Transit. Keine Visa-Matrix im Repo. Keine LLM-Truth. Keine Dokumentnummern im Request. |
| Nutzen für Traveller-Programm | erst danach wird Multi-Document-Empfehlung produktwertig |

### Slot H — TW Attention: Document-Expiry / Missing Facts (trip-scoped)

| Feld | Wert |
| --- | --- |
| Abhängigkeit | `expiresOn` und `travellerFehlendeKernfakten` existieren |
| Klasse | **Parallel-safe**, wenn nur Attention-Karten aus vorhandenen Fakten gebaut werden |
| Slice-Grenze | „Ablaufdatum fehlt / liegt vor Reiseende“ als Missing/Warning, **ohne** Eligibility zu erfinden. Kein „dieser Pass ist ungültig für Land X“ ohne Provider. |
| Priorität | nützlich, aber nicht der Blocker für Binding Order §2 Registry |

### Slot I — Requirements-API an Konto-Workspace verdrahten

| Feld | Wert |
| --- | --- |
| Ist | `app/api/readiness/requirements/route.ts` existiert; `KontoArbeitsbereich` übergibt keine `officialEvaluations`; Client fällt auf `requirementsLokalFuerReise` zurück |
| Klasse | Shared Readiness-Contract; nicht beiläufig |
| Risiko | zweite Evaluations-Authority (Server vs. Client) wenn nicht sauber fail-closed |
| Empfehlung | eigener Task, erst wenn ein Provider oder ein klarer Server-Cache-Nutzen existiert. Heute ist der lokale Fallback ehrlich, weil Provider `null` ist. |

### Slot J — C2 Traveller-Write Privilege Hardening

| Feld | Wert |
| --- | --- |
| Ist | C1 integriert (`20260828015304`, ADR-0181). Direktes authenticated DML bleibt Residual. |
| Klasse | **Product-Owner-Gate** (REVOKE / optional DEFINER) |
| Slice-Grenze | nur Privilege-Härtung. Keine Registry. Keine UI. |
| Parallel | nicht parallel zu AP-7-S2 Schema/RLS |

### Slot K — Legacy-Singular-Spalten entfernen

| Feld | Wert |
| --- | --- |
| Ist | `nationality_country_code`, `document_*` DEPRECATED compatibility-only |
| Klasse | Expand/Contract später; nicht kernblockierend |
| Slice-Grenze | Read-Path ohne Legacy-Expand, dann DROP nach Evidence dass keine Rows mehr abhängen |
| Risiko | Guest-Altbestand / Foundation-E-Select-Fallback |

### Slot L — Collaboration / Co-Traveller Ownership

| Feld | Wert |
| --- | --- |
| Ist | PR #28 `KEEP-FUTURE`; RLS nur `user_id = auth.uid()` |
| Klasse | **Blocked** / extra gegatet |
| Harte Grenze aus dem Vertrag | Collaborator sieht Snapshots, nie fremde Registry |
| Non-Scope dieses Programms | nicht aus AP-7-S2 mitschleifen |

### Slot M — Kommerzielle Provider-Felder (APIS / Passenger identity)

| Feld | Wert |
| --- | --- |
| Ist | Flug/Hotel/Mobility nutzen `reise.travellers` Kopfzahl; Seasonal-Port testet explizit gegen Citizenship/Document-Lecks |
| Klasse | erst wenn ein echter Provider das Feld verlangt |
| Harte Grenze | keine Citizenship/Dokumente „auf Vorrat“ in Search-Requests |
| Parallel-Warnung | offene Adapter-Audits #187–#190 dürfen diesen Vertrag nicht still aufweichen |

### Slot N — Native/Mobile Consumption

| Feld | Wert |
| --- | --- |
| Klasse | kein Native-Implementation-Slice aus diesem Audit |
| Grenze | dieselben Domain-Typen; keine zweite Identity |
| Zeitpunkt | nach Registry-API (S2+) oder weiterhin trip-scoped `Trip.party` |

---

## 4. Was Binding Order §2 wirklich blockiert

Produktweite Vervollständigung „Account-Traveller-Registry, Dokument-Lifecycle/UX, Nutzung in Reise-/Einreise-/Transitfunktionen“ zerfällt in **drei verschiedene Blocker**:

| Blocker | Slot | Warum er zählt |
| --- | --- | --- |
| Keine accountweite Wiederverwendung | **C → D → E** | Jede Reise muss Traveller neu erfassen |
| Keine ehrliche Pass-Empfehlung | **G, dann F** | Vergleichslibrary ohne Provider darf nicht „gewinnen“ |
| Keine Collaboration | **L** | RLS ist Single-Owner; nicht Teil von AP-7-S2 |

Foundation E (trip-scoped 1:n) ist **kein** Blocker und darf nicht neu gebaut werden.

---

## 5. Empfohlene nächste *Entscheidung* (nicht nächste Implementation)

Nach unabhängigem Technical-Lead-Review dieses Draft-PRs:

1. Audit als Architecture-Evidence mergen oder CHANGES REQUIRED geben.
2. Binding-Build-Order-Auswahl **live** neu treffen. Dieser Backlog startet keinen Slot.
3. Wenn Traveller-Wiederverwendung als nächstes Produktziel gewählt wird: eigener AP-7-S2-Task + Persistence-ADR + PO Identity/RLS/Migration-Gate + frische Generation.
4. Wenn Legal-Runtime zuerst: AP-6a, nicht Traveller.
5. Wenn Provider-Evidence zuerst: Slot G im Provider-Programm, nicht im Account-Agenten.

**Nicht** als Nächstes tun:

- Recommendation-UI ohne Provider
- Default-Pass / primary citizenship
- Guest still in die Registry kippen
- Collaboration in den ersten Persistenz-Slice mischen
- Passportnummern „schon mal“ vorsehen
- TW-8 aus diesem Programm öffnen
- Ready/Merge durch den Audit-Autor
