# PR #35 – ChatGPT Final Foundation-E Review

Stand: 22. August 2026  
Review-Basis vor diesem Dokument: `30a04baf4168e0ab9ca08b1850d46e582d7bbfbb`  
Status: **REQUEST CHANGES / noch kein Merge / keine Production-Migration**

## Positiv final verifiziert

Die drei Re-Review-Funde wurden fachlich in die richtige Richtung geschlossen:

- Legacy-Backfill erzeugt im aktuellen `20260822160000` keine Document↔Citizenship-Relation mehr nur wegen `issuer == nationality`.
- Development-Nachtrag `20260822180000` hat alte genau so erzeugte Relikte neutralisiert; direkte Live-Abfrage auf Development: **0 Relikte**.
- `RequirementsProviderZeile` transportiert jetzt `optionEligibility` und `optionMandate`; die Engine übernimmt diese Werte nur hinter derselben Trust-/Freshness-Grenze.
- `credentialOptionenVergleichen()` verlangt `status=current` **und** `freshness=current` und bleibt ohne option-level Semantik fail-closed.
- Child-Limits verwenden live auf Development `FOR NO KEY UPDATE`; Parallelitätsnachweis 7/7 laut Branch-Nachweis.
- Development enthält `20260822160000` bis `20260822180000`; Production endet weiterhin bei `20260822150000` und ist Foundation-E-seitig unverändert.
- PR #35 ist weiterhin Draft, offen, nicht gemergt und mergeable.
- CI auf `30a04baf...` ist `completed/success`; Vercel auf demselben Head ist `success`.
- Nachweise: `npm test` 1311/1311, DB Security 208/208, UI-Audit 838/838 WebKit+Chromium/8 Viewports laut Acceptance/PR-Head.

## Merge-Blocker 1 – Kanonisch leer darf Legacy nicht wieder auferstehen lassen

`lib/readiness/reisende.ts` behauptet korrekt: **Child-Tabellen sind Source of Truth.** Der aktuelle Account-Mapper verletzt das aber noch in einem wichtigen Edge Case.

`travellerAusZeile()` setzt derzeit sinngemäß:

- `nationalityCountryCode = legacy nationality`, wenn `citizenships.length === 0`
- Legacy-Document-Felder, wenn `documents.length === 0`

`party_schreiben()` schreibt die neuen Child-Tabellen, lässt die alten Foundation-C-Singularspalten aber bewusst stehen. Damit entsteht folgender reale Ablauf:

1. alter Account-Traveller hatte z. B. `nationality_country_code = CH` und wurde nach Foundation E zu Child `CH` backfilled;
2. Nutzer entfernt bewusst seine letzte Citizenship;
3. `party_schreiben()` löscht den Child-Eintrag, ändert die deprecated Singularspalte aber nicht;
4. beim nächsten `reiseLaden()` sieht der Mapper `citizenships.length === 0` und setzt aus der alten Legacy-Spalte wieder `CH`;
5. eine bewusst gelöschte Nutzerwahrheit erscheint erneut.

Dasselbe gilt für das letzte Dokument.

Das ist ein Source-of-Truth-/Semantikfehler und ein Merge-Blocker.

### Erforderliche Lösung

Account-Daten müssen **„kanonische Relation vorhanden, aber leer“** von **„Foundation-E-Relation auf diesem Schema noch gar nicht verfügbar“** unterscheiden.

Empfohlene Semantik:

- Wenn `trip_traveller_citizenships` als Relation geladen wurde (auch `[]`), ist dieses Array autoritativ. Keine Legacy-Nationality-Fallbacks.
- Wenn `trip_traveller_documents` als Relation geladen wurde (auch `[]`), ist dieses Array autoritativ. Keine Legacy-Document-Fallbacks.
- Legacy-Fallback nur, wenn die kanonischen Relationseigenschaften strukturell **nicht geladen / nicht verfügbar** sind – nicht wenn sie leer sind.
- `travellerLegacyLesen()` darf für echte alte Guest/localStorage-Formen weiter expandieren; Account-Canonical-Empty darf darüber nicht erneut Legacy bekommen.

Pflichttests:

- Account-Zeile: Legacy `CH`, kanonische Citizenship-Relation `[]` → **0 Citizenship**.
- Account-Zeile: Legacy Passport, kanonische Documents-Relation `[]` → **0 Documents**.
- echter Pre-Foundation-E/Legacy-Datensatz ohne geladene Child-Relationen → Legacy-Fallback funktioniert weiter.
- Integration/DB: letzte Citizenship via realem Write-Pfad entfernen → `reiseLaden()` danach bleibt leer.
- entsprechend für letztes Document.

## Merge-Blocker 2 – Production-Deployment muss expand-kompatibel sein

`lib/trips/daten.ts` lädt aktuell direkt:

`trip_travellers(*, trip_traveller_citizenships(*), trip_traveller_documents(*))`

Production besitzt diese beiden Tabellen/Relations derzeit **noch nicht**. Ein Merge nach `main` löst einen Production-Deploy aus; bis zur separat freigegebenen Foundation-E-Production-Migration kann diese Select-Abfrage scheitern und Trip-Reads beschädigen.

Das widerspricht unserer professionellen Expand/Contract- und separaten Production-Gate-Logik.

### Erforderliche Lösung

Der neue Code muss während des kurzen Code-vor-Schema-Fensters **lesend abwärtskompatibel** sein:

- Primär kanonischen Foundation-E-Graph laden.
- Nur wenn eindeutig die Foundation-E-Relation/Schema-Verfügbarkeit fehlt, auf den bisherigen Legacy-Trip-Select zurückfallen.
- Nicht bei beliebigen DB-/Auth-/Netzwerkfehlern still fallbacken.
- Der Mapper muss anhand „Relation fehlt“ vs. „Relation vorhanden und `[]`“ Blocker 1 korrekt unterscheiden.
- Sobald Production migriert ist, muss der kanonische Pfad automatisch die alleinige Account-Wahrheit sein.

Der Write-Pfad darf vor der Production-Migration fail-closed bleiben; er darf **nicht** still Multi-Citizenship-Daten in Singularfelder reduzieren. Für den Release muss nach dem Merge die separat freigegebene Production-Migration unmittelbar nachgezogen werden. Ein kurzer sichtbarer Write-Fehler ist sicherer als stiller Datenverlust; der Read-Pfad darf aber nicht ausfallen.

Pflichttests:

- Foundation-E-Schema vorhanden → kanonischer Select, leere Children bleiben leer.
- Foundation-E-Relation eindeutig nicht vorhanden → Legacy-Lesepfad funktioniert.
- beliebiger anderer DB-Fehler → kein stiller Legacy-Fallback.

## Provider-Readiness-Hardening – Official Fingerprint muss die explizite Credential-Relation tragen

Der Provider-Port sendet `relatedCitizenshipCountryCode`. `fingerprintFuer()` / `officialFingerprint()` serialisiert derzeit aber nur:

- Option-Ref
- gesamte Citizenship-Menge
- Dokumenttyp / Issuer / Ablaufdatum

Die **explizite Document↔Citizenship-Zuordnung** fehlt. Bei zwei vorhandenen Citizenships kann der Nutzer dasselbe Dokument von Citizenship A auf B umhängen; Option-Ref, Citizenship-Menge, Issuer und Ablaufdatum bleiben gleich. Der offizielle Evidence-Fingerprint würde dann unverändert bleiben, obwohl sich ein Provider-relevanter Input geändert hat.

Vor dem echten Adapter sollte die Provider-Readiness vollständig sein. Deshalb jetzt schließen:

- `relatedCitizenshipCountryCode` (oder gleichwertig die explizite Relation) in den option-spezifischen Official-Fingerprint aufnehmen.
- Reihenfolgeunabhängigkeit der Citizenship-Menge behalten.
- Test: gleiche zwei Citizenships + gleiches Document, Relation CH → RS ändert Official-Fingerprint.
- Keine Relation bleibt `null`; niemals Issuer als Citizenship einsetzen.

## Re-Review-Gate nach diesen letzten Fixes

Erneut mindestens:

- relevante Unit-/Domain-Tests einschließlich Canonical-Empty-vs-Legacy und Official-Fingerprint-Relation;
- Account-Reload nach Löschen letzter Citizenship / letztem Document;
- DB Rechte/RLS/Security;
- `db:parallelitaet`;
- Typecheck, Lint, Hygiene, Production Build;
- Trip-Workspace-UI-Audit WebKit + Chromium / 8 Viewports;
- GitHub CI + Vercel auf finalem Head;
- Development enthält Foundation E, Production weiterhin nicht;
- `docs/ACTIVE_WORK_STATUS.md` und `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md` aktualisieren.

PR #35 bleibt bis zum erneuten Abschlussreview Draft. Kein Mark Ready, kein Merge und keine Production-Migration.
