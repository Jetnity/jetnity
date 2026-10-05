# Provider S5-B Gate 0 – Commercial Provenance Persistence Readiness

Stand: 28. August 2026  
Status: **AUTHORIZED – READ-ONLY ARCHITECTURE / READINESS ONLY**  
Agent: `Cursor-Agent: Jetnity provider readiness audit 2`  
Start-Baseline: `main @ b4c295e43021c22d863abb12702ef1ec3d18eb98`  
Branch: `audit/provider-s5b-gate0-readiness-2026-08-28`

## 0. Authority und harte Grenze

Dieser Auftrag ist ein enger **S5-B Gate-0-/Readiness-Slice**. Er ist nach Live-Rekonstruktion und Abgleich mit `docs/JETNITY_BINDING_BUILD_ORDER.md` freigegeben, weil TW-8 weiterhin hinter Provider S5 und realer Commercial Provenance blockiert ist und der Provider-Block S5-B als noch offenen Folgeschritt nennt.

**Gate 0 entsperrt TW-8 NICHT.**

Gate 0 darf ausschließlich Architektur, Ist-Zustand, Trust Boundaries, Persistenzpfade, Schema-/RLS-/Ownership-Auswirkungen, Privacy/Retention, Testbarkeit, Migrationsbedarf und mögliche Folgeslices untersuchen und dokumentieren.

### Absolut verboten in diesem Auftrag

- keine Runtime-Implementierung
- keine neue Produktfunktion
- keine Änderung an `lib/commercial-provenance` außer falls für reine Dokumentationsreferenzen notwendig; bevorzugt gar keine Runtime-Datei anfassen
- keine Schemaänderung
- keine Migration anlegen
- keine Migration anwenden
- kein `supabase db push`
- keine Production-Mutation
- keine Development-Supabase-Mutation
- keine RLS-/Ownership-/Grant-/REVOKE-Änderung
- keine `SECURITY DEFINER`-Änderung
- keine Auth-/Session-/MFA-/AAL-Änderung
- keine Service-Role-Architektur einführen
- keine Secrets anlegen/ändern
- keine Provider aktivieren
- keine echten Provider-Calls
- keine paid calls
- keine Provider-Verträge
- keine Währungsumrechnung erfinden
- keine Preise, Verfügbarkeit, Provider Health oder Affiliate-Evidence erfinden
- kein TW-8 Runtime
- kein TW-9
- kein Provider S6/S7/S8 Runtime
- kein P2-TA-04 C2
- kein AP-5-S3–S5
- kein AP-7
- kein Branch-/Cloud-/Supabase-/Vercel-Cleanup
- Branch Protection nicht verändern

Git-Änderungen dieses Gate 0 sind **Docs/Evidence only**.

## 1. Verbindliche Product Truth

S5-A ist integriert. Kanonisch gelten insbesondere:

- Commercial Provenance ist ein eigener provider-neutraler Vertrag, kein `UniversalOffer`.
- Flight / Hotel / Activity / Mobility / Rental bleiben domain-spezifisch.
- Snapshot ist niemals automatisch live.
- fehlende Freshness = `unknown`.
- keine stille Currency Conversion.
- Current Quote braucht belegte `quotedCurrency`.
- `requestedCurrency != quotedCurrency` bleibt ohne Conversion-Evidence ein Mismatch.
- User-/Manual-/LLM-Wahrheit darf Provider-Hard-Truth nicht erzeugen oder überschreiben.
- Actor ↔ Source ist fail-closed.
- User darf keine Provider-Live-/Provider-Snapshot-Herkunft behaupten.
- `externalRef` ist provider-scoped.
- Provider-Refresh verlangt belegte identische Domain + `providerId` + `externalRef`.
- `providerOfferId` ist in S5-A kein gleichwertiger Refresh-Schlüssel.
- fehlende Affiliate-Evidence bleibt `unknown`.
- widersprüchliche `amount`-/`amountStatus`-Paare werden abgewiesen.
- S5-A hat ausdrücklich **keine Persistenz und keine `trip_items`-Felder** eingeführt.

Kanonische Quellen mindestens vollständig lesen:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_BINDING_BUILD_ORDER.md`
3. `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
4. `docs/JETNITY_ENGINEERING_EXCELLENCE_STANDARD.md`
5. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
6. `docs/ADR_0168_COMMERCIAL_PROVENANCE_DOMAIN_CONTRACT.md`
7. `docs/PROVIDER_READINESS_S5A_COMMERCIAL_PROVENANCE_STATUS.md`
8. `docs/PROVIDER_READINESS_IMPLEMENTATION_SLICES.md`
9. relevante S4–S8 Audit-/Gap-Dokumente
10. `docs/TRIP_WORKSPACE_TW7_A_STATUS.md`
11. `docs/ACTIVE_WORK_STATUS.md`
12. `JETNITY_HANDOFF.md`
13. relevante `DECISIONS.md`-ADRs
14. aktuelle Traveller-/Guest→Account-/Trip-Write-Contracts, soweit sie Commercial-Persistenz berühren

Historische Dokumente sind Evidence ihres Zeitpunkts. Aktueller Code und neuere kanonische Dokumentation gewinnen.

## 2. Gate-0-Fragen – vollständig beantworten

### A. Persistenzinventar

Rekonstruiere alle heutigen Stellen, an denen kommerziell relevante Reiseinformationen persistiert, transformiert, verworfen oder aus Persistenz gelesen werden können.

Mindestens untersuchen:

- `trip_items` Schema und relevante Spalten
- `metadata` / JSON-Persistenz
- `reise_anlegen(jsonb)` und andere RPCs
- direkte `authenticated` INSERT-/UPDATE-Wege
- Server Actions / Route Handler
- Flight-Persistenz und `FlugNachweis`
- Hotel-Persistenz / Nachweis
- Activity-Persistenz / Nachweis
- Mobility-Persistenz / Nachweis
- Rental-Car-Persistenz / Nachweis
- Guest Local Storage / Guest Trip
- Guest → Account Promotion
- Account Trip Reads
- Trip Workspace Reads / Anzeige von Preisen oder kommerziellen Feldern
- Booking-/Affiliate-Felder, soweit vorhanden
- bestehende Trigger / Constraints / Grants / Policies, die Commercial Fields beeinflussen

Für jeden Pfad dokumentieren:

- Trust Source
- Actor
- Eingabefelder
- serverseitige Evidence
- Persistenzziel
- Freshness-/Zeitpunkt-Information
- Currency-Information
- Provider-/External-Ref-Identität
- Affiliate-/Booking-Evidence
- Update-/Overwrite-Semantik
- RLS/Ownership Boundary
- ob Browser-/User-Input Hard Truth behaupten kann
- ob fehlende Evidence aktuell korrekt `unknown` bleibt

### B. Schema-Fit ohne Änderung

Prüfe, ob der bestehende Production-Schema-Vertrag Commercial Provenance vollständig, eindeutig und querybar repräsentieren **könnte**, ohne ihn jetzt zu ändern.

Beantworte getrennt:

1. Welche S5-A-Fakten können heute bereits verlustfrei persistiert werden?
2. Welche nur unsauber/mehrdeutig in `metadata`?
3. Welche überhaupt nicht?
4. Welche heutigen Spalten (`price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url`, etc.) tragen weniger Trust-Semantik als ihre Namen vermuten lassen?
5. Wo droht ein zweiter oder widersprüchlicher Commercial-Truth-Store?
6. Wo fehlen Zeitpunkt/Freshness/Source/Actor/Status/Quote-Currency/Affiliate-Evidence?

**Keine Schema-Lösung implementieren.**

### C. Zieloptionen – mindestens drei Architekturvarianten

Dokumentiere mindestens drei realistische S5-B-Architekturoptionen, z. B.:

- minimale additive Felder auf bestehender Persistenz
- strukturierte Commercial-Provenance innerhalb klar begrenzter Metadata
- separate provider-neutrale Snapshot-/Provenance-Relation

Die Beispiele sind keine Vorentscheidung. Falls eine bessere vierte Variante existiert, aufnehmen.

Für jede Variante bewerten:

- Truth Integrity
- Domain Isolation
- Queryability
- RLS / Ownership
- Guest → Account
- Update-/Refresh-Semantik
- Retention / Privacy
- Migration Complexity
- Rollback
- Backfill / Legacy Unknown
- Indexing / Performance
- Native/API-Readiness
- Admin/Observability-Anschluss
- Provider Neutrality
- Gefahr eines `UniversalOffer`
- Testbarkeit
- zukünftige Multi-Provider-Konflikte
- Kosten-/Betriebsfolgen

Gib eine **begründete Empfehlung**, aber treffe keine Production-Entscheidung und implementiere sie nicht.

### D. Trust-/Write-Contract

Definiere als Vorschlag die minimale Write-Authority-Matrix für spätere S5-B-Arbeit.

Mindestens Actors/Sources unterscheiden:

- user intake
- manual booking/user-entered
- trusted provider live
- trusted provider snapshot/cache, falls später erlaubt
- internal system derivation
- assistant/LLM
- guest
- authenticated user
- privileged server path, nur als Architekturkonzept, nicht implementieren

Beantworte insbesondere:

- Wer darf Amount/Currency/Provider/ExternalRef/Freshness schreiben?
- Wer darf vorhandene Provider-Evidence ersetzen?
- Wann ist ein Refresh derselben Offer-Identität zulässig?
- Wie wird Legacy ohne Provenance behandelt?
- Wie verhindert man Browser-/RPC-/Direct-DML-Bypässe analog früheren Flight-Trust-Findings?

### E. Freshness / Statusmodell

Prüfe den minimal notwendigen persistenten Statusvertrag für Commercial Truth.

Mindestens sauber trennen:

- `current`
- `stale`
- `unknown`
- `unavailable`
- `error`
- `partial`
- ggf. `insufficient_context`, falls fachlich notwendig

Keine `available: boolean`-Abkürzung einführen.

Prüfe, welche Zeitfelder tatsächlich semantisch nötig wären, z. B. `observedAt`, `retrievedAt`, `freshUntil`, ohne sie jetzt ins Schema einzubauen.

### F. Currency Contract

Prüfe Persistenzanforderungen für:

- quoted amount
- quoted currency
- requested currency
- keine stille Conversion
- spätere Conversion nur mit eigener belegter Conversion-Evidence

Kein FX-Provider, keine Conversion, keine externen Calls in Gate 0.

### G. Affiliate / Booking / Revenue Truth

Inventarisiere bestehende Felder und Grenzen für:

- booking URL
- affiliate link / affiliate identity
- attribution evidence
- booking status
- revenue / commission, falls vorhanden

Trenne strikt:

- Commercial Search Snapshot
- Booking Intent / Redirect
- belegte Buchung
- Revenue/Commission

Keine dieser Wahrheiten darf aus einer anderen erfunden werden.

### H. Privacy / Retention / Sensitive Data

Bewerte, welche Commercial-Provenance-Daten personenbezogen werden können, wenn sie an Trip/Traveller/User gekoppelt sind.

Mindestens:

- Datenminimierung
- Retention
- Löschung/Account Archive
- Export
- Guest → Account
- Analytics/Marketing-Abgrenzung
- keine Verwendung sensitiver Traveller-/Passdaten als Commercial-Targeting

Keine Legal Claims erfinden.

### I. Production-/Migration-Gate

Falls eine spätere S5-B-Lösung Schema/Migration/RLS/REVOKE/privilegierte Writes benötigt, dokumentiere exakt:

- welcher Product-Owner-Sondergate greift
- welche Vorbedingungen erfüllt sein müssen
- welche Production-Evidence vor Apply nötig wäre
- Rollback-/Failure-Plan
- welche vorhandenen Migrationen niemals erneut angewendet werden dürfen

**Gate 0 selbst legt keine Migration an und wendet nichts an.**

### J. TW-8-Gate

Dokumentiere ausdrücklich:

- warum Gate 0 TW-8 nicht entsperrt
- welche späteren S5-B-Implementierungs-/Production-/Truth-Gates mindestens erfüllt sein müssten
- welche Real-Commercial-Provenance-Evidence TW-8 zusätzlich benötigt

Keine TW-8-Datei als Runtime ändern.

## 3. Live-/Code-Evidence

Agent muss den aktuellen Branch gegen den bei Arbeitsbeginn aktuellen `origin/main` prüfen.

Mindestens dokumentieren:

- Start-`main`
- aktueller `main` beim Abschluss
- Merge-Base
- Ahead/Behind
- relevante Parallelbranches / PRs
- mögliche Kollisionen
- alle untersuchten Commercial-Write-/Read-Pfade
- relevante Schema-/Migration-/RLS-Dateien im Repository

Externe Systeme dürfen nur **read-only** geprüft werden, falls im Agent-Environment sicher verfügbar. Keine Mutationen. Wenn Live-Zugriff nicht vorhanden ist, ausdrücklich `not independently live-verified by agent` dokumentieren und nicht raten.

## 4. Erforderliche Deliverables

Der Agent soll auf seinem Branch mindestens erzeugen:

1. `docs/PROVIDER_S5B_GATE0_READINESS_STATUS_2026-08-28.md`
2. `docs/PROVIDER_S5B_GATE0_ARCHITECTURE_OPTIONS_2026-08-28.md`
3. `docs/PROVIDER_S5B_GATE0_HANDOFF_2026-08-28.md`
4. `docs/PROVIDER_S5B_GATE0_SELF_REVIEW_2026-08-28.md`

Optional nur wenn wirklich nötig:

- ein neuer ADR-**Vorschlag**, klar als `PROPOSED / NOT ACCEPTED / NOT IMPLEMENTED` markiert.

Keine bestehende kanonische ADR stillschweigend fundamental umdeuten.

`docs/ACTIVE_WORK_STATUS.md` nur dann ändern, wenn die Änderung eindeutig den aktuellen Draft-/Gate-0-Stand beschreibt und keine parallele Current Truth überschreibt. Im Zweifel nicht ändern und stattdessen im Handoff dokumentieren.

## 5. Tests / Checks für Gate 0

Da Gate 0 Docs-only ist, mindestens:

- tatsächlicher Git-Diff nur Docs/Evidence
- keine Runtime-Datei geändert
- keine Migration erzeugt/geändert
- keine Supabase-Mutation
- keine Vercel-Mutation
- keine Provideraktivierung
- Markdown-/Repo-Hygiene soweit vorhanden
- Links/Pfade zu kanonischen Dokumenten prüfen
- Aussagen gegen aktuellen Code belegen

Wenn der Agent zur Verifikation Typecheck/Lint/Tests laufen lässt, ist das erlaubt, aber Gate 0 darf nicht durch Testfixes in Runtime-Dateien erweitert werden.

## 6. Severity

Aktuell fehlt S5-B als **Pre-TW8-/Commercial-Truth-Gate**, nicht als künstlich aufgeblasener Production-P0-Incident.

Der Agent muss Findings sauber trennen in:

- aktuelle Production P0/P1/P2/P3 Findings
- Pre-TW8 Gate/Blocker
- Pre-Provider-Activation Gate
- Architekturentscheidung / PO-Gate
- Hygiene / Future Hardening

Keine fehlende Zukunftsfähigkeit automatisch als heutiger P0 klassifizieren.

## 7. STOPP / Übergabe an Technical Lead

Nach Fertigstellung:

- Draft bleibt Draft
- kein Mark Ready
- kein Merge
- kein Folge-Slice
- kein S5-B Runtime
- kein TW-8

Der Agent muss stoppen und die Arbeit für einen **unabhängigen Technical-Lead-Review** übergeben.

Der Technical Lead prüft anschließend selbstständig Exact Head, Base Head, Merge-Base, Diff, alle Dateien, fachliche Logik, Security/Privacy/Truth Contracts, Tests, CI, Vercel und Parallelität.

Ein Agenten-Self-Review ist keine Freigabe.