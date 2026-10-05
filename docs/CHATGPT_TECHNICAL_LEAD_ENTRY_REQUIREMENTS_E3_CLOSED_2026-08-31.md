# Jetnity – Technical Lead Entry Requirements E3 Closed

Stand: 31. August 2026  
Status: **CURRENT CLOSURE CHECKPOINT / ENTRY REQUIREMENTS E3 CLOSED / NO ACTIVE CURSOR RUNTIME SLICE / LIVE-EVIDENCE GEWINNT**

## 1. Verifizierter Abschluss

Entry Requirements E3 – Visitor Checklist Presentation ist vollständig abgeschlossen.

- Issue **#311 CLOSED / completed**.
- ursprünglicher Draft-PR **#312 CLOSED / NOT MERGED / MECHANICALLY SUPERSEDED** ausschließlich wegen des bekannten GitHub-Connectorfehlers beim Draft→Ready-Schritt (`Repository.fullDatabaseId`).
- unabhängig geprüfter finaler Implementierungs-Head: `f6d477a7294fd53b48a3bea4d738c10291c5974c`.
- Technical-Lead Exact-Head PASS wurde auf #312 dokumentiert.
- non-draft Recovery-PR **#313 MERGED** nach eigener vollständiger Re-Gate-Evidence.
- Merge-SHA auf `main`: **`5be6863a7eec7fb6b02a9ab292897a8e34c55638`**.
- Recovery-CI **#1455 / Run `33375229743`: SUCCESS** auf exakt `f6d477a7...`.
- Post-Merge Main-CI **#1456 / Run `33375592234`: SUCCESS** auf exakt `5be6863a...`, inklusive Auth-Konfiguration, Typecheck, Lint, 2896 Tests, Admin-API-Schutz, Schema-Bezug, Dead-Code-/Export-/Dependency-Hygiene und Production Build.
- Vercel Production **`dpl_4ubMhAhTWVKvYJvt57bk8RPKafb3`: READY** exakt auf `5be6863a...`.
- GitHub Review Threads vor Merge: **0**.
- Vercel Toolbar unresolved Threads vor Merge: **0**.

## 2. Was E3 jetzt liefert

Die vorhandene E1/E2 Official Requirements Truth wird in der Reisevorbereitung als konkrete Besucher-Checkliste dargestellt.

Eine sichtbare Official-Zeile bleibt fachlich exakt:

> **Traveller × Credential-Option × Destination/Transit × Requirement Type**

Verbindlich umgesetzt:

- keine credential-übergreifende Zusammenlegung;
- kein Default-/Primary-/Preferred-/Chosen-Pass und keine Default-Citizenship;
- kein `documents[0]` / `evaluations[0]` als Product Truth;
- Issuer Country wird nicht als Citizenship behandelt;
- Visa-Modi bleiben strukturierte Visa-Subtypen;
- eTA bleibt `electronic_travel_authorization`;
- `blank_passport_pages` und `financial_means` bleiben First-Class-Requirement-Typen;
- priorisierte Presentation-Gruppen: `Vor Abreise erledigen`, `Dokument prüfen`, `Bei Einreise / vor Ort`, `Bei Einreise / Reise nachweisen`, `Route / Transit`, Residual-Bereich;
- harte Ergebnis-Copy nur bei `status === 'current'` und `freshness === 'current'`;
- stale / recheck / unavailable / insufficient context / missing facts bleiben fail-closed;
- Credential-Labels nur aus exakt auflösbaren strukturierten Trip-/Traveller-Daten;
- Authority, Jetnity-`checkedAt`, Freshness, Source und Official Action werden nur aus vorhandener strukturierter Semantik dargestellt;
- Actions verwenden purpose-spezifische Labels (`application`, `form`, `appointment`, `information`) und keine URL-Heuristik;
- gleiche Action-/Source-URL wird nicht doppelt dargestellt.

## 3. E1 / E2 / E3 zusammen

Der aktuelle provider-neutrale Entry-Requirements-Unterbau enthält jetzt:

### E1 – Detail Contract

- First-Class `blank_passport_pages`;
- First-Class `financial_means`;
- strukturierter `visaMode`: `visa_exempt`, `visa_on_arrival`, `electronic_visa`, `visa_before_travel`, `unknown`;
- eTA bleibt eigener Requirement-Typ;
- widersprüchliche `result ↔ visaMode`-Paare werden fail-closed degradiert.

### E2 – Official Actions

- `sourceUrl` ist Evidence-/Informationsquelle und keine automatisch angenommene Antragseite;
- explizite Official Action hat validierten Zweck `application | form | appointment | information` plus validierte HTTPS-URL;
- ungültige/fehlende Action-Metadaten erfinden keine Action und verändern keine Hard Truth;
- eine `actionUrl` ohne gültigen Purpose wird nicht als Information umetikettiert;
- nur valide `sourceUrl` darf Information-Fallback sein.

### E3 – Visitor Checklist

- die E1/E2-Wahrheit ist lossless und credential-spezifisch sichtbar;
- fail-closed Result-/Freshness-Presentation;
- verständliche strukturierte Labels/Gruppen;
- purpose-spezifische sichere Actions.

## 4. Weiterhin ausdrücklich nicht aktiv

E1/E2/E3 aktivieren **keinen** realen Requirements-/Visa-/Entry-Provider.

Weiterhin bindend:

- `requirementsProviderAus()` bleibt `null`;
- kein Vendor ausgewählt/aktiviert;
- keine Provider-Secrets/API Keys;
- keine echten oder paid Provider-Calls;
- kein Vendorvertrag/DPA durch diese Slices;
- keine Supabase-/Migration-/RLS-/Ownership-/Auth-/MFA-/AAL-Änderung;
- keine Passnummer/MRZ/Scans/Biometrie/Gesundheitsakte;
- kein Credential-Ranking / keine automatische „beste Pass“-Auswahl;
- keine neuen Hard-Truth-Felder für Gebühren, erlaubte Aufenthaltsdauer, konkrete freie Seitenzahl, Proof-of-Funds-Betrag oder Deadline-Regeln;
- keine Travel-Companion-/Reminder-/Notification-Runtime.

## 5. Traveller-Invariant

Unverändert kanonisch:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Account Registry = wiederverwendbare aktuelle Traveller-Fakten.  
Trip Snapshot = einzige Current Truth für die konkrete Reise.

## 6. Persistenter Zielanker

Issue **#294 – Entry Requirements Detail Architecture** bleibt offen als persistenter Product-Target-Tracker.

Kanonische Zielarchitektur:

`docs/ENTRY_REQUIREMENTS_TARGET_ARCHITECTURE_2026-08-31.md`

E1–E3 erfüllen wichtige Contract-/Action-/Presentation-Bausteine, aber nicht die gesamte Zielarchitektur. Insbesondere Travel-Companion-/Deadline-Runtime und reale Provider-Truth bleiben separate, später frisch zu precheckende Slices.

## 7. GitHub Governance

Ruleset `Jetnity main protection` / ID `21875372` bleibt unverändert bindend. Der Draft→Ready-Connectorfehler rechtfertigt keine Lockerung.

Solange der Fehler besteht:

1. Cursor liefert im Draft-PR;
2. TL reviewt den exakten finalen Head;
3. bei PASS wird ein non-draft Recovery-PR auf exakt demselben Commit eröffnet;
4. Recovery-PR erhält eigene CI/Vercel/Mergeability/Thread-Gates;
5. erst dann geschützter Merge.

## 8. Agent

Letzter E3-Agent:

**`Jetnity entry requirements checklist 1`**  
Generation: **1**  
Session: `bc-101a3978-c843-4ac5-8678-112eef039283`  
Status: **STOPPED / DELIVERY COMPLETE / TL PASS / E3 MERGED**.

Es läuft durch diesen Closure-Checkpoint **kein neuer Cursor-Runtime-Slice**.

## 9. FIRST NEXT ACTION

**Kein E4, Provider- oder Deadline-Slice ist automatisch gestartet oder freigegeben.**

Vor der nächsten Implementierung muss der Technical Lead erneut:

1. `main`, offene PRs/Issues, CI/Vercel und Agentenstatus live prüfen;
2. Issue #294 + Zielarchitektur gegen den aktuellen Ist-Code lesen;
3. Abhängigkeiten/Truth-Grenzen und Product-Owner-Gates prüfen;
4. nur den kleinsten verantwortbaren bounded Slice definieren;
5. Supabase nur dann live prüfen/reconciliieren, wenn der neue Scope DB-/RLS-/Storage-/Security-/Migrationen berührt.

**Live-Evidence gewinnt immer.**
