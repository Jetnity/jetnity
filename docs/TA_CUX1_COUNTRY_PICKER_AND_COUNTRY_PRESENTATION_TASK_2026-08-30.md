# Jetnity – TA-CUX1 Country Picker + Country Presentation

Stand: 30. August 2026  
Status: **BINDING VERSIONED TASK / IMPLEMENTATION AUTHORIZED**

## 0. Governance

Cursor-Agent: **`Account plattform audit vorbereitung 21`**  
Issue: #233  
Draft-PR: #234  
Baseline: `main @ 7b85e683f39cf42762cac5b6aa7a8eb45b2728db`

Neue logische Einheit -> frischer Agent. Cursor bleibt Draft, markiert nie Ready und mergt nie. Nach Implementation, Self-Review und finaler Exact-Head-Evidence: STOP für unabhängigen Technical-Lead-Review.

Global Continuity ist TL-owned. Der Agent darf **nicht** ändern:

- `JETNITY_START_HERE.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- globale TL-Checkpoints

Review-Fix innerhalb dieses Slices -> derselbe Agent/dieselbe Session.

## 1. Pflichtlektüre vor Änderung

Mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
3. `docs/JETNITY_BINDING_SLICE_PRECHECK_AND_CONTINUITY_GATE_2026-08-29.md`
4. `docs/JETNITY_BINDING_BUILD_ORDER.md`
5. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
6. `docs/CHATGPT_TL_TA_DL1_AND_AP_UX_NAV1_POST_MERGE_CHECKPOINT_2026-08-30.md`
7. `components/account/AccountReisendeKarte.tsx`
8. `components/trips/Reisevorbereitung.tsx`
9. `lib/traveller/account-registry-*`
10. `lib/readiness/dokument-formular.ts`
11. `lib/trips/schema.ts`
12. relevante Traveller-/Account-/Trip-UI-Tests und Audits

Live Evidence gewinnt immer.

## 2. Problem / Product Decision

Heute zwingt Jetnity Nutzer auf realen Traveller-Flächen, technische Country-Codes wie `CH`, `HR`, `DE` bzw. Labels wie `ISO-2` zu kennen und einzutippen. Das ist technisch kanonisch, aber als Endnutzer-UX unnötig verwirrend und fehleranfällig.

Verbindliche Architektur bleibt:

> **Persistenz/Domain = stabiler Country Code. Benutzeroberfläche = verständlicher lokalisierter Ländername.**

Beispiele bei deutscher UI:

- `CH` -> `🇨🇭 Schweiz`
- `HR` -> `🇭🇷 Kroatien`
- `DE` -> `🇩🇪 Deutschland`

Der Nutzer muss den Code nicht kennen. Der intern gespeicherte Country Key bleibt unverändert.

## 3. Ziel dieses bounded Slices

Eine **einzige wiederverwendbare Country-UX-Foundation** schaffen und auf den zwei bereits realen Traveller-Flächen verwenden:

1. Account Registry `/account/travellers`
2. Trip Workspace `Reisendenkontext` / `Reisevorbereitung`

Mindestens folgende Facts müssen dieselbe Country-Control/-Presentation verwenden:

- Wohnsitzland
- Staatsbürgerschaft(en)
- Ausstellungsland eines Dokuments
- sichtbare Citizenship-Zuordnung eines Dokuments

Keine zweite Country-Wahrheit, kein paralleler Picker pro Fläche.

## 4. Shared Country Contract

Implementiere eine kleine pure, testbare Foundation (Pfad/Namen nach bestehender Repo-Konvention sinnvoll wählen), die mindestens kann:

- kanonische auswählbare Länder auf Basis des **offiziellen ISO-3166-1-alpha-2-Sets** bereitstellen;
- Code validieren/normalisieren, ohne beliebige Zwei-Buchstaben-Werte als auswählbares Land zu akzeptieren;
- lokalisierten Ländernamen über eine explizite Locale liefern;
- Flag-Emoji aus gültigem Alpha-2-Code ableiten, ohne Bild-Asset-/Netzwerkabhängigkeit;
- Option-Label erzeugen: Flag + vollständiger lokalisierter Ländername;
- Optionen locale-aware sortieren;
- Suche nach lokalisiertem Ländernamen erlauben; Code-Suche darf als Power-User-Hilfe funktionieren, darf aber nicht die primäre sichtbare UX sein;
- heutige UI darf `de` verwenden, die Foundation muss aber explizit locale-parametrisiert und für `de`, `en`, `fr`, `it`, `es`, `pt`, `pl` verwendbar sein, ohne in diesem Slice das gesamte Jetnity-i18n-System neu zu bauen;
- deterministic fallback bei fehlender `Intl.DisplayNames`-/Locale-Unterstützung; keine Runtime-Crashs.

**Keine neue npm-Abhängigkeit**, wenn Plattform-APIs + kleiner kanonischer Code-Katalog genügen.

### Historische/unerwartete Werte

Bestehende persistierte Werte dürfen nicht still verschwinden oder umgedeutet werden.

- gültiger katalogisierter Code -> normal lokalisieren;
- unerwarteter/legacy Code -> ehrlich als nicht aufgelösten bestehenden Code kennzeichnen, nicht automatisch einem Land zuordnen;
- neu auswählbar sind nur vom Shared Contract akzeptierte Länder;
- kein stiller Datenverlust beim Öffnen/Abbrechen/Speichern anderer Facts.

## 5. Searchable Country Control

Baue eine **wiederverwendbare, mobile-first, zugängliche Country-Control**, nicht zwei separate Implementierungen.

Erwartetes Verhalten:

- leerer Wert bleibt möglich, wenn das jeweilige Fact optional ist;
- kein Defaultland und keine Vorbelegung aus Browser/IP/Locale;
- Nutzer kann nach Ländernamen suchen;
- Treffer zeigen Flag + lokalisierten vollständigen Namen;
- Auswahl liefert nur den kanonischen Code an den aufrufenden Domain-Pfad zurück;
- Clear/Remove muss dort möglich bleiben, wo das Fact optional ist;
- Keyboard: Focus, Eingabe, Arrow-Navigation bzw. äquivalente robuste Bedienung, Enter-Auswahl, Escape-Schließen, Tab ohne Trap;
- Screenreader: verständliches Label/combobox-listbox-Verhalten oder eine gleichwertige semantisch robuste Umsetzung;
- Touch-Ziele >= bestehender 44px-Standard;
- iPhone: normale vertikale Page-Gesten nicht blockieren;
- kein custom Swipe-to-change behavior;
- bei vielen Ländern skalierbar und performant.

Wenn ein komplett custom Combobox-Verhalten nicht zuverlässig/accessibility-sauber im vorhandenen Stack umsetzbar ist, bevorzuge eine weniger spektakuläre, aber robuste zugängliche Lösung und dokumentiere die Entscheidung. Nicht Accessibility gegen Optik eintauschen.

## 6. Account Registry Integration

`components/account/AccountReisendeKarte.tsx` muss nach diesem Slice für normale Endnutzer keine technischen `ISO-2`-Eingabefelder mehr zeigen.

### Wohnsitz

- Edit: Country-Control statt 2-Zeichen-Freitext.
- Summary: `Wohnsitz 🇨🇭 Schweiz` statt `Wohnsitz CH`.
- leer bleibt ehrlich leer.

### Citizenship

- Hinzufügen via Country-Control, nicht Freitext `ISO-2`.
- bestehende Citizenship-Liste zeigt Flag + vollständigen Ländernamen.
- Duplicate-Check bleibt nach internem Code korrekt.
- kein Primary/Default/erstes Land.

### Documents

- Issuing Country via Country-Control.
- Dokument-Summary zeigt `Ausstellungsland 🇨🇭 Schweiz` statt Code.
- Citizenship relation select/options zeigen verständlichen Citizenship-Namen statt nur `CH`.
- Issuing Country != Citizenship bleibt ein unverändertes Domain-Prinzip.
- nullable Document->Citizenship relation bleibt nullable.

## 7. Trip Workspace Integration

`components/trips/Reisevorbereitung.tsx` muss denselben Shared Contract + dieselbe Country-Control nutzen.

### Citizenship

- Mehrere Citizenship-Zeilen bleiben möglich (max 8 gemäß bestehendem Vertrag).
- keine Freitext-ISO-Eingabe mehr.
- Add/Remove-Semantik bleibt verlustfrei.
- keine First-Item-/Default-Semantik.

### Residence

- Country-Control statt `Wohnsitzland ... (ISO-2)`-Freitext.
- optional/null bleibt möglich.

### Documents

- Issuing Country via Country-Control.
- Citizenship relation zeigt Namen/Flag statt Codes.
- bestehende Document Lifecycle Awareness aus TA-DL1 bleibt unverändert.
- mehrere Documents weiterhin unabhängig.

### Read-only presentation

Wo in dieser Traveller-Fläche ein bekannter Country-Code direkt als Endnutzertext erscheint, ersetze ihn scope-treu durch die Shared Country Presentation, sofern dies dieselbe bestehende Country-Wahrheit ist. Keine breite App-weite Country-Refactor-Welle außerhalb dieser beiden Traveller-Flächen.

## 8. Harte Non-Scope-Grenzen

Nicht bauen/ändern:

- keine DB-Migration, kein Schema, kein RLS, keine Grants, keine Ownership-Änderung;
- keine Supabase Production/Development Mutation;
- keine Auth/Session/MFA/AAL-Änderung;
- keine Änderung der gespeicherten Country-Code-Feldsemantik;
- keine neuen Country-Tabellen;
- keine IP-/Geo-/Browser-basierte Auto-Erkennung oder Vorauswahl;
- keine Default-/Primary-/Preferred-Citizenship;
- keine Default-/Primary-/Chosen-/Best-Pass-Logik;
- keine Visa-/Entry-/Transit-/Boarding-Sufficiency-Aussage;
- keine Passportnummern, Scans, MRZ, Biometrie, DOB, Health;
- keine Guest->Registry-Änderung;
- keine Provider-Secrets/API/paid calls;
- kein Homepage-, Collaboration-, TW-8-, Payment- oder Admin-Scope;
- kein vollständiger i18n-Rollout der App;
- keine globalen Continuity-Dateien durch Cursor.

## 9. Security / Truth Acceptance

- Country-Control erzeugt nur bekannte kanonische Werte.
- UI-Namen/Flaggen sind Presentation; Persistenz bleibt Code.
- kein Ländername wird als zweite persistierte Wahrheit gespeichert.
- Issuer und Citizenship bleiben getrennt.
- Auswahl einer Citizenship setzt nicht automatisch Issuer oder Residence (und umgekehrt).
- kein Default aus Locale/IP/browser language.
- bestehende Multi-Citizenship-/Multi-Document-Limits und Beziehungen bleiben erhalten.
- Legacy/unbekannte persistierte Werte werden ehrlich angezeigt und nicht still überschrieben.
- keine sensitive freie Texteingabe entsteht.

## 10. Mindesttests

### Shared Country Foundation

- CH -> deutscher Name Schweiz + CH-Flag-Label;
- HR -> deutscher Name Kroatien + Flag;
- mindestens EN/FR/IT/ES/PT/PL locale parameter smoke coverage;
- sort/search deterministic;
- lowercase input normalization nur am Contract-Rand;
- ungültige/unerwartete Codes nicht als neue gültige Auswahl akzeptiert;
- fallback ohne Crash;
- kein Default bei leerem Wert.

### Country Control

- Auswahl liefert Code, nicht Namen;
- search by localized name;
- optional clear;
- no auto-selection on mount;
- keyboard/accessibility contract;
- mobile/touch behavior, kein `touch-pan-x`-Regressionsmuster.

### Account Registry

- keine sichtbaren `ISO-2`-Freitextfelder für die genannten Facts;
- Residence/Citizenship/Issuer rendern verständliche Country-Namen;
- duplicate Citizenship weiter code-basiert;
- Issuer != Citizenship;
- nullable Citizenship relation;
- legacy unknown value preserved/honestly rendered;
- Aktionen senden weiterhin die kanonischen Codes an bestehende Server Actions.

### Trip Workspace

- multiple Citizenship add/remove bleibt korrekt;
- Residence/Issuer/Citizenship use shared Country control;
- Document relation maps weiterhin über bestehende Citizenship clientRefs;
- no first-item/default/preselect;
- lifecycle helpers bleiben unverändert funktionsfähig;
- submit payload enthält Codes, nicht Labels;
- existing traveller facts do not silently change on render.

### Global gates

- focused tests;
- full `npm test`;
- typecheck;
- lint;
- hygiene checks;
- Production build;
- relevante Account/Trip UI Audits.

## 11. Dangerous-pattern review

Vor Handoff gezielt prüfen:

- sichtbare `ISO-2`-Labels/Freitextfelder in den beiden Scope-Flächen;
- `citizenships[0]`, `documents[0]` als Wahrheit;
- `primary`, `defaultPassport`, `defaultCitizenship`, `preferred`, `chosen`, `bestPassport`;
- automatische Country-Vorauswahl;
- Country Name als persistierter Wert;
- Issuer->Citizenship-Ableitung;
- migrations/schema/RLS/Auth/Supabase scope drift;
- neue npm dependency;
- globale Continuity-Dateien.

## 12. Deliverables

1. Shared pure Country catalog/presentation contract.
2. Shared accessible Country-Control.
3. Account Registry integration.
4. Trip Workspace traveller integration.
5. Focused tests + bestehende Gates.
6. `docs/TA_CUX1_COUNTRY_PICKER_AND_COUNTRY_PRESENTATION_STATUS_2026-08-30.md`
7. `docs/TA_CUX1_COUNTRY_PICKER_AND_COUNTRY_PRESENTATION_SELF_REVIEW_2026-08-30.md`
8. `docs/TA_CUX1_COUNTRY_PICKER_AND_COUNTRY_PRESENTATION_HANDOFF_2026-08-30.md`
9. final exact head, file list, test counts, CI/Vercel evidence, unresolved risks/non-scope.

## 13. STOP

Nach Implementation + Self-Review + finalem Push: **STOP**.

- PR bleibt Draft.
- kein Ready.
- kein Merge.
- keine Production-/Supabase-Mutation.
- kein automatischer Folgeslice.
- unabhängiger Technical-Lead-Review ist zwingend.