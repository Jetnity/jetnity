# PR #35 – ChatGPT Final Depth Review

Stand: 23. August 2026  
Review-Basis vor diesem Dokument: `eecb6c922a00513f99a95eef84296a272b2d09e9`  
Aktuelles `main` bei Review: `c8dbe904faac49745bd149e3d2e85ca30ebd384c`  
Status: **REQUEST CHANGES / Draft bleibt Draft / kein Merge / keine Production-Migration**

Dieser Review folgt dem verbindlichen `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und `docs/PRODUCT_OWNER_REVIEW_DEPTH_MANDATE.md`. Grüne lokale Tests und ein grünes Vercel Preview ersetzen keinen unabhängigen Truth-/Integration-/Release-Review.

## Positiv verifiziert

Die drei Funde aus `docs/PR35_CHATGPT_FINAL_REVIEW.md` wurden in die richtige Richtung geschlossen:

- Geladene Account-Child-Relationen inklusive `[]` sind in `partyAusZeilen()` autoritativ; alte Singularspalten dürfen dort kanonisch leere Children nicht wieder befüllen.
- `reiseLaden()` versucht den Foundation-E-Graph und fällt nur bei einem als fehlende Foundation-E-Relation erkannten Schemafehler auf den Legacy-Select zurück; allgemeine DB-/Auth-/Timeout-Fehler werden nicht still kaschiert.
- Der Official-Fingerprint enthält `relatedCitizenshipCountryCode`; eine geänderte Document↔Citizenship-Relation ändert den Fingerprint.
- Development enthält `20260822160000`–`20260822180000`; Production endet weiterhin bei `20260822150000`.
- Live Development: künstliche Legacy-Backfill-Relationen = 0; Child-Limit-Funktion verwendet `FOR NO KEY UPDATE`.
- Kein echter Requirements-Provider, keine neuen Secrets, keine neuen laufenden Kosten.

Diese Punkte bleiben gültig, lösen aber die folgenden tieferen Findings nicht.

---

## Merge-Blocker 1 – Traveller-Formular löscht explizite Document↔Citizenship-Wahrheit und instabilisiert Dokumentidentität

`components/trips/Reisevorbereitung.tsx` lädt bei bestehenden Dokumenten nur:

- `documentType`
- `issuingCountryCode`
- `expiresOn`

Die vorhandenen Felder `clientRef` und `citizenshipClientRef` werden nicht in den Formularzustand übernommen. Beim Speichern wird anschließend für jedes Dokument:

- `clientRef` aus `documentType + issuingCountryCode` neu konstruiert,
- `citizenshipClientRef` immer auf `null` gesetzt.

Damit kann ein bereits kanonisch gespeicherter Document↔Citizenship-Bezug durch einen normalen Edit/Save verloren gehen. Gleichzeitig ist `clientRef` keine stabile Identität mehr, sondern hängt von veränderlichen Dokumentfakten ab. Zwei Dokumente desselben Typs und Ausstellerlands kollidieren zudem auf demselben konstruierten Ref.

Das ist ein Source-of-Truth-/Identity-Fehler und widerspricht der Foundation-E-Provider-Readiness.

### Erforderliche Lösung

- Formularzustand muss für bestehende Dokumente mindestens `clientRef` **und** `citizenshipClientRef` erhalten.
- Bestehende stabile `clientRef` bei Änderungen von Typ/Aussteller/Expiry nicht unnötig ersetzen.
- Neue Dokumente brauchen eine stabile, kollisionsfreie client-seitige Ref, die nicht aus veränderlichen fachlichen Feldern als Identität abgeleitet wird.
- Wenn mehrere Citizenships vorhanden sind, muss das Dokument ruhig/progressiv einer vorhandenen Citizenship zugeordnet werden können oder bewusst `Noch nicht zugeordnet` bleiben.
- Niemals Issuer als Citizenship ableiten.
- Entfernt der Nutzer eine Citizenship, muss eine bestehende Document-Relation dazu kontrolliert auf `null`/neu gewählt werden; keine dangling/ref-erfundene Relation.
- Der UI-Audit-Helfer darf bei Legacy-Fixtures ebenfalls nicht `nationality -> document.citizenshipClientRef` erfinden.

### Pflichttests

- bestehende Relation RS bleibt nach Edit/Save erhalten;
- Relation kann bewusst CH → RS geändert werden und Fingerprints werden stale/neuberechnet;
- Relation kann bewusst auf `null` gesetzt werden;
- Entfernen einer Citizenship hinterlässt keine ungültige Document-Ref;
- zwei Dokumente desselben Typs/Ausstellerlands können mit unterschiedlichen stabilen `clientRef` koexistieren;
- Reload erhält Identitäten und Relation.

---

## Merge-Blocker 2 – Traveller-spezifische Readiness darf nicht still zu Trip-Level degradiert werden

`lib/readiness/aktionen.ts` löst `travellerClientRef` gegen `rahmen.reise.party` auf. Wird die Ref nicht gefunden, entsteht aktuell `traveller_id = null`.

Das ist fachlich falsch, wenn der Input ausdrücklich einen Traveller nennt. `null` bedeutet trip-level; ein fehlender/ungültiger Traveller darf nicht still dieselbe Semantik bekommen wie „dieser Check gehört bewusst der ganzen Reise“.

Betroffen sind mindestens:

- `readinessSetzen()`
- `readinessUebernehmen()` bei Guest→Account

Folgen eines stillen Downgrades:

- Traveller-Zuordnung geht nach Reload verloren;
- Traveller-Delete-CASCADE greift nicht;
- Stale-/Fingerprint-/UI-Semantik kann als trip-level weiterleben;
- ein Teilfehler der Guest→Account-Kette kann als scheinbarer Erfolg erscheinen.

### Erforderliche Lösung

- `travellerClientRef === null` darf `traveller_id = null` ergeben.
- `travellerClientRef !== null` muss exakt einen Traveller derselben Reise auflösen.
- keine Auflösung → fail closed / verständlicher Fehler; **kein** Write mit `traveller_id = null`.
- UUID-/FK-Validierung darf nicht durch „regex fails -> null“ zur trip-level Degradation führen.
- Guest→Account Readiness mit nicht übernommener/nicht auflösbarer Traveller-Ref muss abbrechen und den Browserentwurf erhalten.

### Pflichttests

- gültige Traveller-Ref persistiert die echte UUID;
- unbekannte Traveller-Ref wird abgewiesen;
- Ref eines anderen Travellers/Trips kann nicht verwendet werden;
- trip-level Check ohne Traveller bleibt legal `null`;
- Guest→Account mismatch fail-closed, kein stilles trip-level Item;
- Reload erhält `travellerClientRef`.

---

## Merge-Blocker 3 – Provider-Vergleich muss bei unvollständiger oder widersprüchlicher option-level Evidence vollständig fail-closed bleiben

`credentialOptionenVergleichen()` gruppiert nach Traveller/Ziel/Transit/Requirement und baut danach nur aus `status=current && freshness=current` neue Gruppen.

Der aktuelle Ablauf überspringt Gruppen mit weniger als zwei aktuellen Evaluations (`continue`). Dadurch kann eine vollständige VISA-Gruppe einen Winner erzeugen, obwohl z. B. eine relevante TRANSIT-Gruppe für dieselben Credential-Optionen nur teilweise aktuell ist. Ein allgemeiner Credential-Winner wäre dann nicht vollständig belegt.

Zusätzlich wird die Kombination `optionEligibility=not_allowed` **und** `optionMandate=mandatory` für dieselbe Option nicht als semantischer Evidence-Konflikt erkannt. Beide Werte sind einzeln syntaktisch gültig, zusammen aber widersprüchlich.

In `requirementsAusZeilen()` werden doppelte Provider-Evaluations mit demselben fachlichen Schlüssel über `gesehen` still auf den ersten Treffer reduziert. Wenn ein Provider für denselben Option/Traveller/Ziel/Typ/Transit-Key widersprüchliche aktuelle Zeilen liefert, darf die Reihenfolge nicht entscheiden.

### Erforderliche Lösung

Entweder:

1. Comparator explizit auf **genau eine vollständig definierte Requirement-Gruppe** beschränken und dies im API/Typ/Caller erzwingen; oder
2. bei gruppenübergreifendem Vergleich verlangen, dass alle für die Entscheidung relevanten Gruppen vollständig und widerspruchsfrei für dieselbe Option-Menge vorliegen und zu einem kompatiblen Ergebnis führen.

In beiden Varianten:

- unvollständige/stale relevante Gruppe → `Noch nicht zuverlässig vergleichbar.`
- `mandatory + not_allowed` derselben Option → konfliktär / nicht vergleichbar;
- doppelte widersprüchliche current Provider-Zeilen für denselben fachlichen Key → nicht `first wins`, sondern fail-closed/Conflict;
- keine Entscheidung aus Teil-Evidence.

### Pflichttests

- VISA vollständig, TRANSIT für eine Option stale/unavailable → kein globaler Winner;
- `mandatory + not_allowed` auf derselben Option → kein Winner;
- zwei widersprüchliche current Provider-Zeilen gleicher Option/Requirement → kein Winner, Reihenfolge egal;
- vollständig konsistente Evidence bleibt vergleichbar;
- stale/conflicting/unknown bleibt weiterhin fail-closed.

---

## Merge-Blocker 4 – Kanonisch leere Arrays und ungültige Traveller dürfen auch an Input-/Provider-Grenzen nicht still verschwinden

`travellerLegacyLesen()` unterscheidet intern aktuell nicht zwischen:

- Property `citizenships`/`documents` **fehlt strukturell** (echtes Legacy), und
- Property ist bewusst als kanonisches `[]` vorhanden.

Wenn das Array leer ist, expandiert die Funktion vorhandene Legacy-Singularfelder wieder. Der Account-Mapper neutralisiert die Legacy-Felder inzwischen vor dem Aufruf, aber die gemeinsame Parserfunktion selbst behält diese gefährliche Semantik für andere Pfade.

Zusätzlich transformiert `readinessAnforderungAnfrageSchema.party` `z.unknown()` über `travellerLegacyLesen()` und filtert `null`-Ergebnisse still heraus. An einer später provider-backed regulatorischen API darf ein ungültiger Traveller nicht einfach aus der Party verschwinden, während für die restlichen Reisenden eine scheinbar vollständige Prüfung läuft.

### Erforderliche Lösung

- `travellerLegacyLesen()` soll Legacy nur expandieren, wenn die kanonische Property strukturell nicht vorhanden/nicht als kanonische Relation geliefert wurde; ein explizites `citizenships: []` / `documents: []` bleibt leer.
- Alte echte Guest-/Foundation-C-Objekte **ohne** diese Properties bleiben kompatibel.
- Die Requirements-API muss ungültige Party-Einträge fail-closed ablehnen oder als explizit `insufficient_context` erhalten; niemals still aus der Reisendengruppe entfernen.
- Gleiches Prinzip bei anderen sicherheits-/regulatorisch relevanten Parsern: keine Person verschwindet durch `.filter(null)`.

### Pflichttests

- `{ citizenships: [], nationalityCountryCode: 'CH' }` bleibt kanonisch leer;
- `{ documents: [], documentType: 'passport' }` bleibt kanonisch leer;
- echtes Legacy-Objekt ohne Array-Properties expandiert weiter;
- Requirements-API mit einem gültigen + einem ungültigen Traveller liefert nicht einfach nur Ergebnisse für den gültigen Traveller;
- malformed/PII/invalid country payload bleibt fail-closed.

---

## Release-/Governance-Blocker – Branch ist nicht auf aktuellem `main`, und exact-head Actions-CI fehlt

Unabhängig vom Code ist PR #35 auf Review-Basis noch nicht final mergefähig:

- `main`: `c8dbe904faac49745bd149e3d2e85ca30ebd384c`
- Review-Head: `eecb6c922a00513f99a95eef84296a272b2d09e9`
- GitHub-Vergleich: Branch **diverged**, 30 Commits ahead / 2 Commits behind; Merge-Base `ae64e4ff...`.
- PR ist `mergeable=false`.
- Auf exakt `eecb6c92...` existiert kein GitHub-Actions-Run des `.github/workflows/ci.yml`; die sichtbaren zwei grünen Statusmeldungen sind Vercel/Vercel-Preview-Checks. Der letzte erfolgreiche Actions-Run lag auf einem früheren Branch-Head.

Die zwei neueren `main`-Commits enthalten u. a. den verbindlichen globalen Review-Tiefenstandard. Diese Wahrheit muss semantisch in den Branch übernommen werden.

### Erforderliche Abschlussreihenfolge

1. Zuerst die vier Code-/Truth-Blocker oben beheben.
2. Danach frisches `origin/main` holen und Branch **semantisch** synchronisieren/rebasen/mergen; keine blinden `ours/theirs`-Konfliktlösungen.
3. Neuere globale `main`-Policies behalten; Foundation-E-Fachwahrheit und Product-Owner-Nachträge ebenfalls behalten.
4. Auf dem finalen synchronisierten Head komplettes Gate neu laufen lassen:
   - `npm test`
   - Typecheck / Lint / Hygiene
   - Production Build
   - DB Rechte / RLS / Security / Parallelität
   - Foundation-E Domain-/Integrationstests
   - Trip-Workspace UI Audit WebKit + Chromium / 8 Viewports
   - Development-vs.-Production-Migrationsgrenze
   - GitHub Actions **auf exakt finalem Head**
   - Vercel Preview **auf exakt finalem Head**
5. Handoff/Acceptance/Active Work/ROADMAP und widersprüchliche ältere Aussagen korrigieren, insbesondere:
   - Legacy-Fallback nur bei strukturell fehlender kanonischer Relation, nicht „wenn Children leer“;
   - Development-Migrationen vollständig `160000`–`180000`;
   - finaler Head/CI/Preview tatsächlich aktuell.
6. PR bleibt Draft. Kein Mark Ready, kein Merge, keine Production-Migration.
7. Erst danach erneuter unabhängiger ChatGPT-Abschlussreview und separate Product-Owner-Merge-Entscheidung.

---

## Definition of Done für diesen letzten Fix-Pass

Foundation E ist erst technisch merge-empfehlbar, wenn:

- kein Edit/Save bestehende Credential-Relation oder stabile Identität still zerstört;
- traveller-spezifische Readiness nie zu trip-level degradiert wird;
- Provider-/Comparator-Logik bei unvollständiger/widersprüchlicher Evidence fail-closed bleibt;
- kanonisch leere Arrays in allen relevanten Pfaden leer bleiben und kein Traveller still aus einer regulatorischen Anfrage verschwindet;
- Branch mit aktuellem `main` synchron ist;
- PR `mergeable=true` bzw. keine Konflikte besitzt;
- Actions-CI und Vercel auf exakt finalem Head grün sind;
- Development Foundation E enthält und Production weiterhin nicht;
- Dokumentation den tatsächlichen finalen Zustand abbildet.

Kein Mark Ready, kein Merge, keine Production-Migration ohne die bestehenden separaten Product-Owner-Gates.
