# Jetnity – Assistant Truth Context 1

Stand: 2. September 2026  
Status: **BINDING TECHNICAL-LEAD TASK / PHASE 1 / SINGLE_AGENT / NO MODEL CALL / NO DB MIGRATION**

Canonical baseline: `main@efbaaf4f9bc9ea1534aba2dfcf120110d014038b`  
Issue: #425  
Branch: `feat/phase-1-assistant-truth-context-1`  
Cursor-Agent display name: **Jetnity assistant truth context 1**  
Generation: **1**

## 1. Ziel

Baue die kleinste verantwortbare, deterministische und privacy-minimierte **Truth Context Projection** für den späteren Phase-1 In-Trip-Assistant.

Der Slice definiert **was ein späterer Assistent aus bereits vorhandener Jetnity Truth sehen darf**. Er erzeugt keine neue Official-/Provider-/Commercial-Truth und ruft kein Modell auf.

Der aktuelle Modellweg bleibt unverändert: `Modellfunktion = 'reisevorschlag' | 'reiseaenderung'`. Kein dritter Funktionswert und keine Migration in diesem Slice.

## 2. Binding Truth-Regeln

Die Projektion muss vorhandene kanonische Wahrheit erhalten und darf keine neue Wahrheit ableiten.

### Trip / Route

- Stage-Identität und `position` bleiben kanonisch.
- Duplicate-country stages bleiben getrennt.
- Kein Country-Inference aus Name, Koordinaten oder Place ID.
- Destination und Transit dürfen nicht kollabieren.
- Missing Route-/Stage-Evidence bleibt missing.

### Traveller / Credentials

Verbindlich:

> 1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete Optionen.

- mehrere Traveller bleiben getrennt;
- mehrere Citizenship-Optionen bleiben Peers;
- mehrere Document/Credential-Optionen bleiben Peers;
- niemals Default/Primary/Preferred aus Array-Reihenfolge;
- Residence != Citizenship;
- Issuer Country != Citizenship;
- keine Ableitung einer Citizenship aus Dokument oder Wohnsitz;
- stabile opaque refs/labels nur soweit für Option-Identität erforderlich.

### Official / Readiness / Safety / Seasonal

Nur bereits vorhandene/supplied kanonische Evaluation Truth darf projiziert werden.

- Destination Official != Transit Official;
- `unknown != not_required`;
- `unavailable != not_required`;
- `stale != current`;
- `recheck_needed` bleibt explizit;
- currentness/freshness/source authority nicht hochstufen;
- Safety/Seasonal nur mit ihrer bereits kanonisch vorhandenen Relevanz/Stage-Bindung;
- fehlende Evidence nie zu einer positiven Aussage machen.

### Truth classes

> OFFICIAL TRUTH != PROVIDER TRUTH != JETNITY RECOMMENDATION != COMMUNITY OPINION != GENERATED SUGGESTION.

Dieser Slice darf eine spätere `generated_suggestion`-Klasse im Contract vorbereiten, aber **keine Generated Suggestion als Official/Provider Truth speichern oder projizieren**.

## 3. Privacy / Data Minimization

Die Projection darf insbesondere NICHT enthalten oder rekonstruieren:

- Pass-/Dokumentnummer;
- MRZ;
- Dokumentscan/-bild;
- biometrische Daten;
- Health Records / medizinische Akte;
- Auth-/Session-Token oder Session-ID;
- E-Mail-Adresse / Account-ID / Supabase User-ID, sofern für diesen Kontext nicht zwingend erforderlich (aktuell nicht erforderlich);
- Provider Secret/API Key;
- raw provider payload;
- raw internal operational evidence;
- booking URL/deeplink;
- Preis-/Availability-Felder oder Provision/Commercial Ranking Context.

Wenn bestehende Typen solche Felder enthalten, muss die Projektion sie explizit nicht übernehmen. Tests müssen die Abwesenheit beweisen.

## 4. Erwartete Implementierungsform

Bevorzugt eine pure Domain-Projection unter `lib/reisebegleiter/` oder einem gleichwertigen, klar begrenzten Modul.

Beispielhafte Struktur, nicht zwingend wörtlich:

- `lib/reisebegleiter/kontext.ts`
- `lib/reisebegleiter/kontext.test.ts`
- ggf. kleine lokale Typdatei/Helper nur wenn fachlich nötig.

Reuse before add: bestehende kanonische Parser/Truth-Helfer für Official/Safety/Seasonal/Traveller verwenden, statt Semantik zu duplizieren.

Keine UI nötig. Keine Server Action nötig. Keine Runtime-Verbindung nötig.

## 5. Hard Non-Scope

Unzulässig in diesem Slice:

- OpenAI/Responses API Call;
- neue `Modellfunktion`;
- Änderung an Modell-Kill-Switch/Production-Konfiguration;
- Supabase Migration/Schema/RLS/Grant/Function;
- Production Apply;
- Provider Signup/Kontakt/Terms/DPA/Secret;
- live/sandbox/paid provider call;
- Commercial Provenance writer;
- Production S6;
- Trip Mutation oder Auto-Apply;
- neuer Assistant-Chat / Floating Widget / UI Surface;
- World Map oder Destination Essentials Expansion;
- Service Worker / Offline / Push;
- Public Indexing / Domain Cutover;
- Follow-up Slice.

## 6. Pflicht-Fixtures / Tests

Mindestens deterministisch abdecken:

1. **Multi-Traveller / Multi-Citizenship / Multi-Document**
   - zwei Traveller;
   - mindestens ein Traveller mit >=2 Citizenships und >=2 Documents/Credential options;
   - Reihenfolge ändern darf keine Primary/Preferred-Semantik erzeugen.

2. **Official states**
   - `current`;
   - `unknown`;
   - `unavailable`;
   - `stale`;
   - `recheck_needed`;
   - `not_required`;
   - alle bleiben unterscheidbar.

3. **Destination vs Transit**
   - gleicher/überlappender Country Context darf Destination und Transit nicht kollabieren.

4. **Duplicate-country stages**
   - zwei Stages im selben Land bleiben unterschiedliche Stage-Refs.

5. **Privacy omission**
   - Input Fixture enthält bewusst sensitive/commercial Felder;
   - serialisierte Projection enthält keine verbotenen Werte oder Feldnamen.

6. **Commercial/provider leak prevention**
   - Preis, Currency Amount, Provider raw, Booking URL, Provision/Ranking Context nicht in Projection.

7. **Missing evidence**
   - null/fehlende Country-/Credential-/Evaluation-Evidence bleibt missing; keine Erfindung.

## 7. Qualitäts-Gates

Agent muss auf seinem finalen Exact Head ausführen und im Handoff dokumentieren:

- gezielte neue Tests;
- vollständige relevante Tests;
- `npm test`;
- Typecheck;
- Lint;
- bestehende Hygiene Checks;
- Production Build;
- GitHub Exact-Head CI;
- Vercel Preview Exact Head.

Da keine UI gebaut wird, ist kein neuer visueller Product-Screenshot erforderlich. Falls der Agent dennoch UI berührt, ist das ein Scope-Alarm und muss vor Fortsetzung begründet werden.

## 8. Dokumentation / Handoff

Agent erstellt/aktualisiert:

- `docs/ASSISTANT_TRUTH_CONTEXT_1_HANDOFF_2026-09-02.md`;
- `docs/ASSISTANT_TRUTH_CONTEXT_1_SELF_REVIEW_2026-09-02.md`;
- `docs/ACTIVE_WORK_STATUS.md` additiv, ohne bestehende Provider-/Traveller-/Truth-/Gate-Continuity zu löschen.

Handoff muss enthalten:

- exact final head SHA;
- changed files;
- welche bestehenden Truth-Helfer wiederverwendet wurden;
- explizite Bestätigung, dass kein Modellcall/DB/Provider/Production-Gate berührt wurde;
- Test-/CI-/Vercel-Evidence;
- offene Residuals, insbesondere dass ein späterer echter Assistant Model Call wegen neuem `Modellfunktion`-Wert/Usage Contract einen eigenen Gate-Precheck benötigt.

## 9. Governance

- SINGLE_AGENT.
- Agent implementiert; Technical Lead reviewed unabhängig.
- Agent-Self-Review ist kein PASS.
- Agent darf PR nicht Ready setzen.
- Agent darf nicht mergen.
- Jeder neue Head invalidiert ältere Exact-Head-Gates.
- Bei CHANGES REQUIRED arbeitet derselbe logische Agent/dieselbe Session weiter.
- Kein Folgeslice.

**STOP FOR FRESH TECHNICAL-LEAD REVIEW.**
