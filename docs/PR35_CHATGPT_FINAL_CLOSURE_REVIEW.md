# PR #35 – ChatGPT Final Closure Review

Stand: 23. August 2026  
Review-Basis vor diesem Dokument: `39d02971ee767d9dfff3a2e9d75475622891d38e`  
`main` bei Review: `c8dbe904faac49745bd149e3d2e85ca30ebd384c`  
Status: **REQUEST CHANGES / Draft bleibt Draft / kein Merge / keine Production-Migration**

Dieser Review folgt `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und `docs/PRODUCT_OWNER_REVIEW_DEPTH_MANDATE.md`. Er prüft insbesondere die Umsetzung von `docs/PR35_CHATGPT_FINAL_DEPTH_REREVIEW.md` gegen den tatsächlichen finalen Branch-, CI-, Vercel- und Live-DB-Stand.

## Positiv unabhängig verifiziert

Die beiden Blocker aus `PR35_CHATGPT_FINAL_DEPTH_REREVIEW.md` sind in ihren Kernfällen fachlich richtig geschlossen:

- Konfliktierte Provider-Optionen verschwinden nicht mehr: `requirementsAusZeilen()` hält für den betroffenen fachlichen Key eine `unknown` / `recheck_needed`-Evaluation mit derselben `credentialOptionRef` fest. Damit kann bei A/B/C nicht nur deshalb B oder C gewinnen, weil A aus der Evaluation-Menge verschwunden ist.
- Die untrusted Requirements-API verwendet nun `travellerAnfrageStriktLesen()` statt des toleranten Guest-/Storage-Readers. Canonical Children werden als Arrays verlangt, malformed Children, Limits, Duplikate und erkennbare sensible Zusatzfelder werden fail-closed behandelt.
- PR #35 ist offen, Draft, `mergeable=true`, nicht gemergt.
- Branch ist gegen aktuelles `main` 43 Commits voraus und **0 hinter**; Merge-Base ist aktuelles `main` `c8dbe904...`.
- GitHub Actions CI auf `39d02971...`: `completed/success`.
- Vercel Preview auf exakt `39d02971...`: `READY` (`jetnity-b1iuzyiz2-...`).
- Live Development enthält `20260822160000`–`20260822180000`, Foundation-E-Child-Tabellen und `FOR NO KEY UPDATE`; Backfill-Relikte = 0.
- Live Production endet weiterhin bei `20260822150000`; Foundation-E-Child-Tabellen fehlen dort. Keine Production-Migration.
- Kein echter Requirements-Provider, keine neuen Secrets oder laufenden Kosten.

Diese Punkte bleiben gültig. Zwei eng begrenzte Truth-/Fail-Closed-Lücken sind noch offen.

---

## Merge-Blocker 1 – Der „strikte“ API-Legacy-Fallback validiert die alten Singularfelder noch nicht strikt

`travellerAnfrageStriktLesen()` ist bei vorhandenen `citizenships[]` / `documents[]` jetzt streng. Wenn die Canonical-Properties aber **strukturell fehlen**, wird für echte Legacy-Kompatibilität am Ende `travellerLegacyLesen(eintrag)` verwendet.

Vor diesem Aufruf validiert der strikte Parser die Legacy-Singularfelder jedoch nicht vollständig:

- `nationalityCountryCode`
- `residenceCountryCode`
- `documentType`
- `documentIssuingCountryCode`
- `documentExpiresOn`

Der tolerante Legacy-Reader darf für Storage-Recovery normalisieren; an der regulatorischen Requirements-API darf malformed Legacy-Input aber nicht still zu „fehlend“ werden oder als ungültiges Credential weiterleben.

Besonders konkret: `documentAusLegacy()` übernimmt `documentType` zur Laufzeit ohne Enum-Check als `TravellerDocumentType` und übernimmt `documentExpiresOn` ohne Datumsvalidierung. TypeScript schützt hier nicht gegen untrusted Runtime-Input. Ein Payload wie `documentType: 'foobar'` bzw. ein malformed Ablaufdatum kann damit die strikte API-Grenze passieren oder tolerant umgedeutet werden.

### Erforderliche Lösung

Wenn Canonical Children fehlen und die kontrollierte Legacy-Alternative verwendet wird, müssen **alle vorhandenen Legacy-Singularfelder vor `travellerLegacyLesen()` strikt validiert werden**:

- vorhandene Nationalität / Residence / Ausstellerland: gültiger zulässiger Länder-Code gemäß bestehender Jetnity-Semantik; malformed Wert → Request fail-closed, nicht zu `null` normalisieren;
- vorhandener `documentType`: ausschließlich kontrollierter `TRAVELLER_DOCUMENT_TYPES`-Wert;
- vorhandenes `documentExpiresOn`: ausschließlich gültige unterstützte Datumsform; malformed → fail-closed;
- Property vorhanden, aber falscher Runtime-Typ → fail-closed;
- echte valide Legacy-Form bleibt kompatibel.

Der tolerante `travellerLegacyLesen()` selbst darf für Guest-/Storage-Recovery tolerant bleiben. Die Strenge gehört an die untrusted Requirements-API-Grenze.

### Pflichttests

- Legacy `documentType: 'foobar'` → `null` / Schema fail-closed;
- Legacy `documentExpiresOn: 'kaputt'` → fail-closed;
- Legacy `documentIssuingCountryCode` / `nationalityCountryCode` / `residenceCountryCode` malformed bzw. falscher Typ → fail-closed;
- valide Foundation-C-Legacy-Form bleibt kompatibel;
- kein malformed Legacy-Credential erreicht den `RequirementsProvider`.

---

## Merge-Blocker 2 – Widersprüchliche doppelte Provider-Zeilen können über `officialClass` noch reihenfolgeabhängig entscheiden

`requirementsAusZeilen()` erkennt doppelte Zeilen desselben fachlichen Keys inzwischen als Konflikt, wenn sich mindestens eines dieser Felder unterscheidet:

- `result`
- `status`
- `freshness`
- `optionEligibility`
- `optionMandate`

`officialClass` wird in dieser Konfliktsignatur **nicht** verglichen.

Gleichzeitig benutzt `credentialOptionenVergleichen()` / `gruppeEntscheiden()` `officialClass === 'requirement'`, um belegte regulatorische Reibung (`required` vs. `not_required` / `conditional`) überhaupt als vergleichbar zu behandeln.

Damit ist folgender Fall noch reihenfolgeabhängig:

1. Option A erhält zwei trusted/current Provider-Zeilen mit demselben fachlichen Key, demselben `result`, Eligibility und Mandate, aber einmal `officialClass='requirement'` und einmal einer anderen Klasse, die normalisiert als `unknown` endet.
2. Option B besitzt eine konsistente `requirement`-Zeile.
3. Je nachdem, welche A-Zeile zuerst in `gesehen` landet, kann A als friction-vergleichbar behandelt werden oder nicht.
4. Die zweite Zeile wird mangels `officialClass`-Vergleich nicht als Konflikt markiert.

Eine Provider-Reihenfolge darf niemals die regulatorische Entscheidung verändern.

### Erforderliche Lösung

Die Konflikterkennung muss **alle entscheidungsrelevanten normalisierten Semantikfelder** berücksichtigen. Mindestens `officialClass` muss in dieselbe Konfliktsignatur aufgenommen werden.

Bevorzugt eine kleine zentrale `decisionSignature`/Semantikvergleich-Hilfe verwenden, damit Comparator-relevante Felder nicht künftig auseinanderlaufen.

Nicht jede abweichende Evidence-URL muss automatisch semantischer Konflikt sein; entscheidend sind Felder, die Ergebnis/Zulässigkeit/Pflicht/Ranking verändern.

### Pflichttests

- doppelte current Zeilen desselben Keys, gleicher Result/Eligibility/Mandate, aber `officialClass requirement` vs. `unknown/recommendation/advisory` → konfliktierte `unknown/recheck_needed`-Evaluation, kein Winner;
- Reihenfolge der beiden Zeilen ändert das Ergebnis nicht;
- mit zweiter konsistenter Credential-Option entsteht trotzdem kein Winner aus der konfliktbehafteten Restlage;
- vollständig identische doppelte Zeilen bleiben deduplizierbar;
- vollständig konsistente unterschiedliche Optionen bleiben normal vergleichbar.

---

## Abschluss-Gate nach diesen zwei Fixes

1. Nur diese zwei Punkte schließen; kein breiter Foundation-E-Neubau.
2. Gezielte Unit-/Engine-/API-Tests ergänzen.
3. `npm test`, Typecheck, Lint, Hygiene, Production Build erneut grün.
4. DB Rechte / RLS / Security / Parallelität unverändert grün.
5. Trip-Workspace UI-Audit WebKit + Chromium / 8 Viewports erneut grün (oder auf exakt identischer UI-Codebasis belastbar nachweisen; bevorzugt erneut laufen lassen).
6. Development-vs.-Production-Migrationsgrenze erneut prüfen.
7. Vor Abschluss aktuelles `origin/main` prüfen; Branch muss 0 hinter sein.
8. GitHub Actions und Vercel auf exakt finalem Head grün.
9. Acceptance / Active Work / Handoff mit tatsächlichem Stand aktualisieren.
10. PR bleibt Draft; kein Mark Ready, kein Merge, keine Production-Migration.
11. Danach ein letzter unabhängiger ChatGPT-Closure-Check. Erst wenn kein weiterer **hochwirksamer** Truth-/Security-/Release-Blocker bekannt ist, folgt die separate Product-Owner-Merge-Entscheidung.

## Stop-Kriterium für den nächsten Closure-Check

Der nächste Review soll nicht wegen theoretischer Perfektion weiter verlängert werden. Merge-blockierend sind danach nur noch konkrete, reproduzierbare oder direkt aus dem Code ableitbare Fehler mit relevanter Auswirkung auf:

- Traveller-/Credential-Wahrheit,
- regulatorische Evidence / fail-closed Verhalten,
- Datenverlust / falsche Source of Truth,
- Security / RLS / Cross-User- oder Cross-Trip-Grenzen,
- Production-Rollout / Migration,
- oder zentrale Foundation-E-Funktionalität.

Reine Stilfragen, hypothetische Mikro-Härtungen ohne realistische Produktwirkung oder Themen, die ausdrücklich erst beim konkreten Provider-Adapter verifizierbar sind, blockieren Foundation E danach nicht.
