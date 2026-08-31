# Jetnity – Entry Requirements E2 Official Actions Task

Stand: 31. August 2026
Status: **BINDING BOUNDED IMPLEMENTATION TASK / DRAFT PR ONLY**

Issue: #306
Baseline: `main@a57a15a6c8011ea81af1a228a2fd0c3e6e0853b9`
Branch: `feat/entry-requirements-official-actions-e2-2026-08-31`

## 1. Ziel

Jetnity muss zwischen **Official Evidence Source** und **konkreter offizieller Action** unterscheiden.

Heute kann `OfficialAction` nur `open_official_source` tragen. Dadurch ist fachlich nicht ausdrückbar, ob eine URL lediglich Information liefert oder tatsächlich eine Antrags-, Formular- oder Terminseite ist.

E2 führt dafür einen kleinen provider-neutralen Contract ein. Kein echter Provider wird aktiviert.

## 2. Verbindliche Semantik

### Evidence Source

`sourceUrl` bleibt ausschließlich Evidence-/Informationsquelle. Sie belegt oder erläutert eine Requirement-Evaluation.

Eine `sourceUrl` darf **niemals automatisch** als Antrag, Formular oder Termin interpretiert werden.

### Explicit Official Action

Eine konkrete Action darf nur entstehen, wenn der Provider-Port sie strukturiert liefert und die Engine sie sicher normalisieren kann.

Mindestens folgende Action-Zwecke müssen strukturiert modellierbar sein:

- `application` – offizieller Antrag, z. B. eVisa/eTA;
- `form` – offizielles Einreise-/Arrival-/Health-Formular;
- `appointment` – offizieller Termin-/Botschaftsprozess;
- `information` – offizielle Informationsseite.

Empfohlene provider-neutrale Form:

```ts
export const OFFICIAL_ACTION_PURPOSES = [
  'application',
  'form',
  'appointment',
  'information',
] as const

export type OfficialActionPurpose = (typeof OFFICIAL_ACTION_PURPOSES)[number]

export type OfficialAction = {
  kind: 'open_official_action'
  purpose: OfficialActionPurpose
  href: string
}
```

Die konkrete Form darf der Agent nur ändern, wenn sie nachweislich kleiner/sicherer ist und dieselbe Semantik verlustfrei trägt.

## 3. Provider-Port

`RequirementsProviderZeile` soll explizite Action-Metadaten tragen können, z. B.:

```ts
actionUrl?: string | null
actionPurpose?: OfficialActionPurpose | string | null
```

Keine freien Marketinglabels als Product Truth.

## 4. Mapping-/Fail-Closed-Regeln

1. Explizite Action-URL muss dieselbe HTTPS-Sicherheitsvalidierung wie andere externe Official URLs erfüllen: kein HTTP, keine Credentials, kein localhost/.local, sinnvolle Längenbegrenzung.
2. Ungültiger oder unbekannter `actionPurpose` erzeugt **keine** Antrag-/Formular-/Termin-Action.
3. `application`, `form` und `appointment` dürfen nur aus expliziter Action-Metadaten entstehen – niemals aus `sourceUrl` inferiert werden.
4. Wenn keine explizite Action vorhanden ist, darf eine valide `sourceUrl` höchstens als `information`-Action verwendet werden, falls dies die bestehende Presentation-Kompatibilität sinnvoll erhält. Sie darf nie als Antrag/Formular/Termin erscheinen.
5. Eine ungültige Action darf eine ansonsten vertrauenswürdige Requirement-Evaluation nicht in `not_required` oder andere Hard Truth umdeuten. Action-Metadaten sind Navigation, nicht Requirements-Wahrheit.
6. Wenn Trust/Freshness/Result bereits fail-closed degradiert wird, darf keine riskante Action übrigbleiben. Bestehende Security-/Truth-Regeln gewinnen.
7. Nicht-Visa/eTA-/Entry-Form-Typen dürfen nur die zu ihrem gelieferten Zweck passende Action tragen; keine UI-Heuristik soll aus Requirement-Type eine nicht belegte Antragssituation erfinden.
8. `requirementsProviderAus()` bleibt `null`.

## 5. Traveller-/Credential-Invariant

Unverändert bindend:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Actions müssen an derselben `OfficialEvaluation` / Credential-Option hängen. Eine Action aus Credential A darf niemals bei Credential B erscheinen.

Keine Default-/Primary-/Preferred-/Chosen-Citizenship. Kein Default-Pass. Keine `documents[0]`-/`evaluations[0]`-Truth.

## 6. Tests – mindestens

- explizites `application` + valide HTTPS Action URL → application Action;
- explizites `form` → form Action;
- explizites `appointment` → appointment Action;
- explizites `information` → information Action;
- `sourceUrl` ohne explizite Action wird niemals application/form/appointment;
- ungültiger Purpose → keine riskante Action;
- `http://`, URL mit Credentials, localhost/.local, malformed URL → keine Action;
- ungültige Action-Metadaten verändern nicht `required/not_required/conditional` bei sonst vertrauenswürdiger Evidence;
- stale/unavailable/conflicting Evaluation verliert riskante Action entsprechend bestehenden fail-closed Regeln;
- zwei Credential-Optionen behalten getrennte Actions;
- eTA bleibt `electronic_travel_authorization`, nicht eVisa;
- bestehende E1 `result ↔ visaMode`-Degradierung bleibt intakt;
- vollständige relevante Test-Suite, Typecheck, Lint und Production-Build grün.

## 7. Hard Non-Scope

- kein echter Requirements-/Visa-/Entry-Provider;
- keine Providerwahl;
- kein Vendorvertrag/DPA;
- keine Secrets/API Keys/paid calls;
- keine Supabase-/Migration-/RLS-/Ownership-/Auth-/AAL-Änderung;
- keine Passnummer/MRZ/Scans/Biometrie/Gesundheitsakte;
- keine Notification-/Deadline-/Scheduler-Runtime;
- keine automatische Web-/Browser-/LLM-Recherche als Official Truth;
- keine Visa-Agentur/Drittanbieter als „offizielle“ Stelle;
- keine Gebühren-/Stay-Duration-/Required-Documents-Großerweiterung in E2;
- kein UI-Redesign des gesamten Trip Workspace;
- kein automatischer E3-Slice.

## 8. Agent-Regeln

Agent-Anzeigename: **`Jetnity entry requirements official actions 1`**
Generation: **1**

Der Agent:

- arbeitet nur auf diesem Branch;
- hält PR Draft;
- darf `docs/ACTIVE_WORK_STATUS.md` nicht verändern;
- erstellt eigenen E2 Status/Handoff/adversarial Self-Review;
- führt Tests/Typecheck/Lint/Build aus;
- setzt nicht Ready;
- merged nicht;
- startet keinen Folgeslice;
- STOP nach Delivery für unabhängigen Technical-Lead Exact-Head-Review.

Bei `CHANGES REQUIRED` arbeitet **dieselbe Session** weiter.

## 9. DoD

- Scope-faithful Implementation;
- unabhängiger TL Exact-Head PASS;
- Branch up to date;
- CI `Typecheck, Lint & Build` + Auth success;
- Vercel exact-head success/READY;
- 0 Review-Threads;
- protected merge mit expected head SHA;
- Post-Merge Main-CI success exact merge SHA;
- Vercel Production success/READY exact merge SHA;
- Issue #306 closure mit Evidence;
- kein automatischer E3-Start.
