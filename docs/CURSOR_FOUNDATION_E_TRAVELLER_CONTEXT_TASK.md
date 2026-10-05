# Cursor-Auftrag – Foundation E: Traveller Context / Multi-Citizenship / Multi-Document

Stand: 22. August 2026  
Status: **verbindlicher neuer Kernblock / nach Foundation D**

## Rolle

Du arbeitest als Senior Staff Engineer / Product Architecture / Security / QA Agent für Jetnity.

Der Product Owner hat Foundation D vollständig freigegeben; PR #34 ist gemergt und die drei Foundation-D-Migrationen sind auf Production verifiziert. Foundation D wird nicht erneut gebaut.

Lies vor Beginn vollständig:

- `AGENTS.md`
- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/EXPERT_PROACTIVITY_POLICY.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`
- `docs/TRAVEL_READINESS.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
- `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md`
- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- aktuelle Trip-/Readiness-/Route-Dokumentation und relevante ADRs.

## Ausgangslage

Foundation C besitzt `public.trip_travellers` mit transitionalen singulären Feldern:

- `nationality_country_code`
- `residence_country_code`
- `document_type`
- `document_issuing_country_code`
- `document_expires_on`

Diese Singularität ist ausdrücklich **kein langfristiges Architekturmandat**.

Foundation D liefert jetzt provider- und traveller-neutrale Route Truth inklusive Transit. Diese Route Truth ist wiederzuverwenden und darf nicht dupliziert werden.

Kein echter Travel-Requirements-Provider ist aktiv. Timatic bleibt nur Kandidat. Kein LLM ist regulatorische Truth-Quelle.

## Ziel von Foundation E

Jetnity modelliert Reisende so, dass ein Traveller mehrere rechtlich relevante Optionen besitzen kann:

> **Ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängige zulässige Optionen.**

Das Fundament muss später dieselbe konkrete Route je Traveller und je geeigneter Credential-Option getrennt gegen echte Provider-/Official-Evidence auswerten können.

Foundation E baut die **provider-neutrale Traveller Truth und Evaluationsnaht**. Es baut noch keinen Timatic- oder anderen echten Requirements-Adapter.

## Nicht verhandelbare Produktregeln

1. Keine Funktion darf still nur die erste Staatsbürgerschaft oder das erste Dokument als universelle Wahrheit benutzen, wenn mehrere Optionen relevant sein können.
2. Gesetzliche/regulatorische Pflicht kommt vor Convenience.
3. Route/Transit-Kompatibilität muss über dieselbe Foundation-D-Route Truth erfolgen.
4. Kein unkontrolliertes Passport-Hopping empfehlen.
5. `unknown` bleibt `unknown`.
6. Kein LLM erzeugt Visa-/Transit-/Dokument-/Health-/Carrier-Truth.
7. Keine Pass-/Ausweisnummern, Scans, biometrischen Daten, MRZ, Dokumentbilder oder Dokumentvault in diesem Scope.
8. Nur wirklich notwendige Traveller-Fakten speichern.
9. Gruppenreisen werden pro Traveller ausgewertet; ein Gruppenstatus darf Unterschiede nicht verdecken.
10. Änderungen an Traveller/Citizenship/Document/Residence/Route/Daten müssen nur die tatsächlich abhängigen Ergebnisse stale/recheck machen.
11. Keine automatische Reiseänderung.
12. Guest und Account müssen dieselbe fachliche Traveller-Struktur unterstützen.

## Arbeitsbranch / PR

Erstelle von **frischem `origin/main`** einen neuen Branch:

`feat/traveller-context-intelligence`

Öffne früh einen **Draft PR** mit Verweis auf diesen Task.

Harte Governance:

- NICHT mergen.
- NICHT eigenmächtig Mark Ready.
- KEINE Production-Migration.
- KEIN echter Requirements-Provider.
- KEINE Secrets oder laufenden Kosten.
- Product-Owner-Merge-Gate bleibt separat.

## Phase 1 – Ist-Architektur vollständig auditieren

Vor Schemaänderungen echte aktuelle Implementierung lesen und dokumentieren:

- `public.trip_travellers`
- `public.trip_readiness_items`
- Readiness Types/Schemas/Provider-Port/Engine/Fingerprint/Party/Guest-Bridge
- `reise_anlegen` / Guest→Account / Trip-Mapping
- Workspace/`Reisevorbereitung`
- Foundation-D Route Context
- RLS/FKs/DB-Security-Skripte

Explizit festhalten:

- alle aktuellen Leser/Schreiber der fünf singulären Traveller-Felder,
- alle Stellen, die implizit `one traveller = one nationality = one document` annehmen,
- Guest-/Local-Storage-Form,
- Readiness-Fingerprint-Abhängigkeiten,
- API-/RPC-Grenzen,
- mögliche Migrations-/Rollout-Risiken.

Keine Annahmen aus alten Docs übernehmen, wenn Code/DB anders sind.

## Phase 2 – Kanonisches Traveller-Datenmodell

Bevorzugte Architektur, sofern der Ist-Audit keinen besseren begründeten Weg zeigt:

### 2.1 Stabiler Parent

`trip_travellers` bleibt der stabile Traveller innerhalb einer Reise mit:

- `id`
- `trip_id`
- `user_id`
- `client_ref`
- optionalem menschenlesbarem `label`
- `residence_country_code` nur als aktueller datensparsamer Wohnsitzkontext, solange kein fachlicher Grund für ein komplexeres Residence-Modell besteht.

Keine Passnummern o. ä.

### 2.2 1:n Staatsbürgerschaften

Neue kanonische Child-Struktur, sinngemäß:

`trip_traveller_citizenships`

Mindestens:

- eigene UUID
- `traveller_id`
- `trip_id`
- `user_id`
- stabiler `client_ref`
- ISO-2 `country_code`
- timestamps

Invarianten:

- eindeutige Staatsbürgerschaft je Traveller
- max. vernünftige Anzahl (z. B. 8) zur Abuse-/Payload-Grenze
- Owner-/Trip-/Traveller-Konsistenz server-/DB-seitig erzwungen
- kein freies Länderlabel als Truth.

### 2.3 1:n Dokumente / Credentials

Neue kanonische Child-Struktur, sinngemäß:

`trip_traveller_documents`

Mindestens:

- eigene UUID
- `traveller_id`
- `trip_id`
- `user_id`
- stabiler `client_ref`
- `document_type`
- `issuing_country_code`
- optionale Zuordnung zu einer Citizenship, wenn fachlich passend
- `expires_on` nur wenn erforderlich/bekannt
- timestamps

Dokumenttypen nur als kontrollierte fachliche Werte. Keine Dokumentnummer, MRZ, Scan, Bild, Geburtsdatum oder biometrische Daten.

Setze vernünftige Abuse-/Payload-Grenzen (z. B. max. 12 Dokumente je Traveller) und begründe sie.

### 2.4 Besitzer-/FK-Wahrheit

Child-Zeilen dürfen niemals nur über browserseitig gelieferte IDs zusammenpassen.

Nutze belastbare Composite-FKs/Unique-Indizes bzw. gleichwertige DB-Invarianten, sodass:

- Citizenship/Document wirklich zum Traveller gehört,
- Traveller wirklich zur Reise gehört,
- alles demselben `user_id` gehört,
- Cross-User- oder Cross-Trip-Referenzen unmöglich sind.

RLS allein ersetzt diese Invarianten nicht.

## Phase 3 – Professionelle Expand/Contract-Migration

Die vorhandenen singulären Foundation-C-Felder enthalten mögliche echte Nutzerdaten. **Kein Datenverlust.**

Implementiere einen sicheren, reviewbaren Übergang:

1. neue Child-Strukturen hinzufügen,
2. vorhandene `nationality_country_code`-Werte deterministisch als Citizenship backfillen,
3. vorhandenes Dokumentprofil deterministisch als Document backfillen,
4. bestehende `residence_country_code`-Information erhalten,
5. alle neuen Jetnity-Leser/Schreiber auf die kanonische neue Struktur umstellen,
6. Legacy-Felder klar als deprecated/compatibility-only behandeln und keine neuen Fachentscheidungen mehr daraus ableiten.

Bevor Legacy-Spalten entfernt werden, muss der Rollout sicher sein. Ein Drop ist **nicht** allein aus Sauberkeitsgründen im selben Schritt erforderlich. Falls sie vorerst bleiben:

- keine konkurrierende Source of Truth erzeugen,
- neue App schreibt nicht parallel widersprüchliche Werte,
- Migrations-/Kompatibilitätsstrategie dokumentieren,
- späteren Contract-Cleanup explizit festhalten.

Keine stille Semantikänderung alter Daten.

## Phase 4 – Types, Schemas und Guest-Parität

Ersetze die singuläre Traveller-Form in der kanonischen App-Domäne durch eine klare Struktur, sinngemäß:

- Traveller
  - `citizenships[]`
  - `documents[]`
  - optionaler Residence-Kontext

Anforderungen:

- Zod-validierter untrusted Input
- deterministische Deduplizierung
- stabile Client-Refs
- ISO-Codes kanonisch
- Payload-/Count-/String-Limits
- keine sensiblen freien Textfelder
- Guest Local Storage verwendet dieselbe fachliche Struktur
- Guest→Account übernimmt Traveller + Citizenship + Documents **verlustfrei und atomar/fail-closed**
- bestehende alte Guest-Daten werden professionell gelesen/migriert, nicht still verworfen.

Wenn Account-Übernahme mehrere DB-Schritte erfordert, atomare serverseitige/RPC-Grenze oder gleichwertige sichere Transaktion verwenden.

## Phase 5 – Readiness wird traveller-fähig

Foundation C ist heute überwiegend trip-level. Foundation E muss traveller-spezifische Readiness ermöglichen, ohne jede Readiness-Karte unnötig zu vervielfachen.

Prüfe und implementiere mindestens:

- optionale belastbare `traveller_id`-Zuordnung für traveller-spezifische Readiness-Items, wo fachlich erforderlich,
- korrekte Composite-FK/Owner-Invarianten,
- trip-level Items bleiben möglich, wenn Traveller-Kontext irrelevant ist,
- Gruppenstatus fasst nur zusammen, wenn individuelle Unterschiede nicht verloren gehen.

Beispiele traveller-spezifisch:

- Visa-/Entry-/Travel-Document-Kontext
- später providerbelegte Transit-/Health-Anforderungen, wenn travellerabhängig.

Nicht traveller-spezifische Vorbereitung darf trip-level bleiben.

## Phase 6 – Traveller Context Fingerprint / Freshness

Der Context-Fingerprint muss deterministisch auf Mengen reagieren und darf nicht von Array-Reihenfolge abhängen.

Mindestens berücksichtigen, soweit für die jeweilige Evaluation relevant:

- Traveller identity/client ref
- sortierte Citizenship-Menge
- sortierte Document-Menge mit Typ/Aussteller/Expiry/Relation
- Residence-Kontext
- Route/Transit aus Foundation D
- Destinationen
- relevante Reisedaten

Tests zwingend für:

- Citizenship hinzufügen/entfernen
- Dokument hinzufügen/entfernen
- Dokumenttyp/Aussteller/Expiry ändern
- nur Reihenfolge im Array ändern → **kein** fachlicher Fingerprint-Wechsel
- Route-/Transitänderung
- Änderung bei Traveller A darf nicht fälschlich Traveller B als identischen Kontext behandeln.

Stale/Recheck gezielt, keine unnötige globale Invalidierung.

## Phase 7 – Provider-neutrale Credential-Evaluationsnaht

Erweitere die interne Readiness-/Requirements-Grenze so, dass ein späterer echter Provider mehrere Credential-Optionen getrennt bewerten kann.

Konzeptionell:

`Traveller + Credential Option + Route/Transit + Reisedaten -> Provider/Official Evaluation`

Eine Credential Option darf nur aus vorhandenen zulässigen Traveller-Fakten gebaut werden; keine erfundenen Passprofile.

Interner Vertrag muss später mindestens unterscheiden können:

- required / allowed / not-applicable / unknown bzw. vorhandene Jetnity-Semantik
- Evidence/Source/Freshness
- konkrete Traveller- und Credential-Referenz
- Route-/Transit-Kontext
- Pflicht vs. Empfehlung
- fehlende Facts / insufficient context.

**Noch kein echter Provider.** Provider-Factory bleibt fail-closed/null, wenn keine freigegebene Quelle existiert.

Ohne Provider darf Jetnity nicht behaupten:

- welcher Pass visumfrei ist,
- welches Dokument besser ist,
- wie lange Aufenthalt erlaubt ist,
- ob Transitvisa nötig sind,
- welche Impfung vorgeschrieben ist.

## Phase 8 – Vergleichslogik ohne erfundene Wahrheit

Baue nur die provider-neutrale Vergleichs-/Priorisierungslogik, die auf echten späteren Evaluationen arbeiten kann.

Reihenfolge verbindlich:

1. regulatorische Pflicht,
2. vollständige Route-/Transit-Zulässigkeit,
3. belastbare Provider-/Carrier-Pflicht,
4. geringere belegte regulatorische Reibung,
5. weitere belegte Faktoren.

Keine Convenience-Punktzahl darf `required`/`not allowed` überstimmen.

Bei fehlender Evidence:

`Noch nicht zuverlässig vergleichbar.`

## Phase 9 – UX: einfach trotz komplexer Wahrheit

Foundation E darf den geplanten großen Workspace-Umbau **nicht vorwegnehmen**. Nur die nötige Traveller-/Readiness-Oberfläche professionell aktualisieren.

UX-Ziel:

- Traveller klar erkennbar
- mehrere Staatsbürgerschaften einfach hinzufügen/entfernen
- mehrere Dokumente einfach hinzufügen/entfernen
- Beziehung Dokument ↔ Citizenship nur zeigen/fragen, wenn nötig
- keine Passnummer-/Scan-Felder
- Residence nur fragen, wenn relevant oder bewusst im Traveller-Detail gepflegt
- fehlende notwendige Facts progressiv und begründet abfragen
- Nutzer versteht, warum eine Angabe gebraucht wird
- bei mehreren Travellern Unterschiede klar, aber nicht mit Tabellenüberlastung
- mobile-first und vollständige Smartphone/Tablet/Desktop-Parität.

Solange kein echter Requirements-Provider existiert, darf die UI z. B. sagen:

- `Angaben erfasst`
- `Offizielle Prüfung noch nicht verfügbar`
- `Für eine zuverlässige Prüfung fehlen Angaben`

aber nicht `Schweizer Pass ist besser`, wenn keine Evidence existiert.

## Phase 10 – APIs / Security / Privacy

Alle neuen Schreib-/Lesewege prüfen auf:

- auth.uid / Owner-Isolation
- RLS
- Composite-FKs
- direkte DB-Manipulation
- Cross-Trip/Cross-Traveller/Cross-User IDs
- Mass Assignment
- übergroße Payloads
- Duplicate Client Refs
- fremde Citizenship-ID in Document
- browserseitig erfundene Evidence/Provider-Truth
- HTML/URL/PII-Injection in freien Feldern
- Logs/Analytics ohne sensible Traveller-Fakten.

DB-Funktionen bevorzugt `SECURITY INVOKER` mit festem `search_path`, sofern kein streng begründeter Ausnahmefall besteht.

Service Role niemals in den Browser.

## Phase 11 – Tests / Acceptance-Matrix

Mindestens automatisiert abdecken:

### Datenmodell

- 1 Traveller / 1 Citizenship / 1 Document
- 1 Traveller / 2+ Citizenships / 2+ Documents
- Document mit/ohne Citizenship-Relation
- Duplicate Citizenship abgewiesen/deterministisch verhindert
- Limits
- Backfill alter Foundation-C-Daten
- kein Datenverlust

### Gruppenreise

- 2+ Traveller mit unterschiedlichen Citizenships/Documents
- Änderung nur eines Travellers
- gruppenweite Zusammenfassung ohne falsche Gleichsetzung.

### Guest/Account

- Gast mit mehreren Citizenships/Documents
- Reload
- Guest→Account
- keine Duplikate bei Retry/Idempotenz
- Legacy-Guest-Daten
- Account Reload.

### Truth/Freshness

- Reihenfolge von Arrays irrelevant
- Add/Remove/Change relevant
- Route/Transit aus Foundation D ändert abhängige Fingerprints
- ohne Provider kein erfundener Vorteil
- unknown bleibt unknown.

### Security

- fremde Trip-ID
- fremde Traveller-ID
- fremde Citizenship-ID
- direkte INSERT/UPDATE-Manipulation
- RLS
- DB-Rechte
- maximale/ungültige Payloads.

### UX

Erweitere den bestehenden Trip-Workspace-Audit um realistische Varianten:

- 1 Traveller / 1 Citizenship
- 1 Traveller / 2 Citizenships
- 2 Traveller mit unterschiedlichen Daten
- Dokument fehlt
- Citizenship fehlt
- Provider unavailable/unknown
- lange Labels innerhalb erlaubter Grenze
- Smartphone / Tablet / Desktop, WebKit + Chromium mindestens analog bestehendem Standard.

## Phase 12 – Bestehende Funktionen gegen heutigen Standard prüfen

Kein Bestandsschutz.

Wenn Foundation-E-Arbeit zeigt, dass bestehende Foundation-C-/Readiness-/Guest-Funktionen die aktuelle Jetnity-Qualität, Truth, Security oder Interoperabilität nicht erfüllen, dürfen sie innerhalb des relevanten Scopes refaktoriert werden.

Aber:

- keine breite Workspace-Neugestaltung,
- keine Safety/Seasonality-Implementierung,
- keine Provider-Aktivierung,
- keine unnötigen Nebenmodule.

## Phase 13 – Development-Migration und Production-Gate

Neue DB-Migrationen zuerst nur auf dem bestehenden Supabase-Development-Branch anwenden.

Nach Anwendung zwingend:

- Migration history
- RLS
- Rechte
- DB-Security
- Backfill-Nachweis
- FK-/Owner-Invarianten
- direkte Manipulationstests
- App/Build/Tests/UI-Audit.

**Production bleibt unverändert**, bis:

1. Draft PR vollständig reviewed,
2. Product Owner ausdrücklich Merge freigibt,
3. Merge erfolgt,
4. Production-Migration separat ausdrücklich freigegeben wird.

## Phase 14 – Dokumentation / Persistenz

Während des Blocks `docs/ACTIVE_WORK_STATUS.md` fortlaufend aktualisieren.

Neu/aktualisiert mindestens:

- Foundation-E-Fachdokument, z. B. `docs/TRAVELLER_CONTEXT.md`
- Acceptance-Dokument
- `ARCHITECTURE.md`
- `DECISIONS.md` mit ADRs für Schema/Migration/Truth-Grenzen
- `ROADMAP.md`
- `JETNITY_HANDOFF.md`
- relevante Readiness-Dokumentation
- Provider-Readiness-Status.

Dokumentiere insbesondere:

- kanonische Source of Truth
- Legacy-/Expand-Contract-Strategie
- Guest/Account-Parität
- Fingerprint-/Stale-Logik
- welche Daten bewusst **nicht** gespeichert werden
- Provider-Gate
- genaue Dev/Prod-Migrationsgrenze
- Testzahlen nur aus tatsächlich ausgeführten Runs.

## Proaktiver Senior-Expert-Pass

Vor Abschluss explizit prüfen:

- Würde ein Senior-Team das Traveller-Modell heute anders aufbauen?
- Gibt es versteckte 1:1-Annahmen in anderen Domänen?
- Gibt es doppelte Traveller Sources of Truth?
- Erzwingt irgendeine API später unnötig einen bestimmten Provider?
- Fehlt eine Abstraktion, damit Safety/Seasonality/Flug/Mobilität später Traveller-Kontext nur bei echter Relevanz nutzen können?
- Werden zu viele Daten gesammelt?
- Gibt es einen einfacheren UX-Weg mit derselben fachlichen Korrektheit?

Wichtige Funde außerhalb Foundation E dokumentieren und vorschlagen, nicht eigenmächtig groß einbauen.

## Definition of Done

Foundation E ist erst review-bereit, wenn:

- stabiles 1:n Traveller/Citizenship/Document-Modell existiert,
- alte singuläre Daten ohne Verlust migriert/kompatibel sind,
- eine klare kanonische Truth existiert,
- Guest und Account fachlich gleich funktionieren,
- Guest→Account verlustfrei/idempotent ist,
- Traveller-spezifische Readiness möglich ist,
- Fingerprints Multi-Credential korrekt behandeln,
- Provider-Port mehrere Credential-Optionen getrennt evaluieren kann,
- ohne Provider keine regulatorische Wahrheit erfunden wird,
- Gruppenreisen korrekt sind,
- Security/RLS/FKs/Manipulationstests grün sind,
- Typecheck/Lint/Hygiene/Tests/Build grün sind,
- Workspace-Audit auf relevanter Device-Matrix grün ist,
- Development-Migration verifiziert ist,
- Production unverändert geblieben ist,
- Dokumentation/Handoff den echten Zustand spiegeln,
- kein bekannter hoher Truth-/Security-/Logic-/UX-Blocker offen ist,
- und der PR weiterhin auf die separate Product-Owner-Entscheidung wartet.

## Danach

Nach Foundation E folgt gemäß aktueller verbindlicher Reihenfolge:

1. Travel Safety & Disruption Intelligence – provider-neutrale Foundation
2. Travel Timing & Seasonal Intelligence – provider-neutrale Foundation
3. kompletter Provider-Readiness-Pass
4. großer End-to-End Trip-Workspace-/Übersicht-Umbau inklusive Weg dorthin
5. finaler Workspace Intelligence Audit
6. echte Providerphase
7. Provider-backed End-to-End-/Truth-Audit
8. finale Startseiten-Positionierung.
