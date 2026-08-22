# PR #35 – ChatGPT Independent Review

Stand: 22. August 2026  
Review-Basis vor diesem Dokument: `6f6ee2c5289a3e5f1d1f3ddff1e9b68db88aee09`  
Status: **REQUEST CHANGES / kein Merge / keine Production-Migration**

## Positiv verifiziert

- PR #35 ist Draft und mergeable.
- GitHub CI auf `6f6ee2c5...`: success.
- Vercel Preview auf demselben Head: success.
- Trip-Workspace-UI-Audit: 838/838, WebKit + Chromium, 8 Viewports.
- Development enthält `20260822160000_traveller_context_intelligence`; Production nicht.
- Grundarchitektur 1 Traveller → n Citizenships → n Documents ist richtig.
- Foundation-D-Route-Truth bleibt separat.
- Kein echter Requirements-Provider, keine Secrets, keine neuen laufenden Kosten.

## Blocker 1 – Composite `ON DELETE SET NULL` ist technisch und semantisch falsch

Die Migration definiert aktuell u. a.:

- `trip_readiness_items_traveller_fk` als `(traveller_id, trip_id, user_id) ... ON DELETE SET NULL`
- `trip_traveller_documents_citizenship_fk` als `(citizenship_id, traveller_id, trip_id, user_id) ... ON DELETE SET NULL`

Auf Development ist direkt verifiziert, dass `trip_id` und `user_id` in `trip_readiness_items` NOT NULL sind und `traveller_id`, `trip_id`, `user_id` in `trip_traveller_documents` NOT NULL sind. Ein unqualifiziertes `ON DELETE SET NULL` auf einem Composite-FK setzt alle referenzierenden Spalten auf NULL und kollidiert damit mit diesen NOT-NULL-Invarianten.

Konkrete Folge: `travellerEntfernen()` kann bei traveller-spezifischer Readiness blockieren; das Entfernen einer Citizenship kann bei verknüpftem Document blockieren.

Erforderlicher Fix:

- Dokument ↔ Citizenship: nur `citizenship_id` darf bei Citizenship-Löschung null werden (`ON DELETE SET NULL (citizenship_id)` oder gleichwertig sichere Semantik).
- Readiness ↔ Traveller: Semantik bewusst festlegen. Empfehlung: traveller-spezifische Readiness beim Traveller-Löschen `ON DELETE CASCADE`, damit sie nicht still zu trip-level Truth degradiert. Falls fachlich bewusst erhalten werden soll, nur `traveller_id` nullen und UX/Freshness-Semantik explizit beweisen.
- Direkte DB-Tests ergänzen: Traveller mit Readiness löschen; Citizenship mit verknüpftem Document löschen; Owner-/Cross-Trip-Invarianten bleiben grün.

## Blocker 2 – Issuing Country darf niemals still als Citizenship interpretiert werden

Aktuell wird an mehreren Stellen bei fehlender expliziter Citizenship-Relation sinngemäß verwendet:

`related citizenship = explicit citizenship relation ?? document.issuingCountryCode`

Betroffen sind mindestens:

- `lib/readiness/traveller-kontext.ts` (`credentialOptionsAus`)
- `lib/readiness/anforderungen.ts`
- `lib/readiness/engine.ts`

Das ist eine falsche Truth-Annahme. Das Ausstellerland eines Dokuments ist nicht automatisch die Staatsbürgerschaft des Travellers. Foundation E soll gerade keine Credential-Identität erfinden.

Erforderlicher Fix:

- `relatedCitizenshipCountryCode` / `citizenshipCountryCode` bleibt `null`, wenn keine explizite Relation zu einer vorhandenen Citizenship gespeichert ist.
- `issuingCountryCode` bleibt ein separates Fact.
- Die gesamte Citizenship-Menge des Travellers bleibt separat verfügbar.
- Tests: Dokument mit Issuer X ohne Citizenship-Relation; mehrere Citizenships; Relation zu Citizenship Y; keine still erfundene Zuordnung.

## Blocker 3 – Credential-Vergleich verwechselt „Requirement required“ mit „dieses Credential ist zwingend“

`lib/readiness/vergleich.ts` behandelt aktuell eine Evaluation mit `officialClass='requirement'` und `result='required'` als höchste Credential-Priorität. Der Test `Pflicht überstimmt Convenience` erwartet sogar, dass bei `requirementType='visa'` die Option mit `visa = required` gegen eine Option mit `visa = not_required` gewinnt.

Das ist semantisch falsch: Bei einer Visa-Evaluation bedeutet `required`, dass für diese Credential-Option ein Visum erforderlich ist – nicht, dass genau dieses Credential rechtlich verwendet werden muss. Nach der bindenden Traveller-Context-Policy ist bei gleicher rechtlicher Zulässigkeit geringere belegte regulatorische Reibung (z. B. visumfrei statt Visum) vorzuziehen.

Erforderlicher Fix:

- Requirement-Ergebnis und Option-Eligibility/Mandate strikt trennen.
- Ein Credential darf nur als gesetzlich zwingend/unerlaubt behandelt werden, wenn der Provider-Vertrag dafür eine explizite, belastbare option-level Semantik/Evidence liefert.
- Wenn diese Semantik in Foundation E noch nicht sauber modelliert werden soll, darf die Vergleichslogik keinen Winner aus `visa/transit/passport/... required` ableiten; dann fail-closed `Noch nicht zuverlässig vergleichbar.`
- Erst wenn Legal/Route-Eligibility geklärt ist, dürfen belegte Friction-Unterschiede wie `not_required` vs `required` priorisiert werden.
- Tests mindestens: visa required vs visa not_required; explizit mandatory document; explicit not-allowed/route-incompatible option; zwei gleichwertige Optionen; unknown/stale/conflicting evidence.

## Zusätzlicher Hardening-Fund – nicht zwingend eigener Merge-Blocker, aber jetzt sinnvoll

Die Child-Count-Limits (8 Citizenships / 12 Documents) werden zusätzlich über `AFTER INSERT` + `count(*)` geprüft. Bei absichtlich parallelen Direkt-DB-Writes kann eine klassische MVCC-Race beide Transaktionen unter dem Limit sehen lassen. Da authenticated direkte Tabellenrechte besitzt, sollte Cursor prüfen, ob die DB-Grenze mit Parent-Row-Lock/advisory lock oder einem anderen robusten Mechanismus gegen Parallel-Bypass gehärtet werden sollte. Mindestens dokumentieren und testen.

## Re-Review-Gate

Nach Fixes zwingend erneut:

- Migration auf Development professionell vorwärts korrigieren; keine Production-Migration.
- DB Rechte/RLS/Security inkl. neuer Delete-/FK-Fälle.
- Unit-/Domain-Tests für alle drei Truth-/Semantik-Fixes.
- Typecheck, Lint, Hygiene, Production Build.
- `npm run audit:trip-workspace` auf WebKit + Chromium / 8 Viewports.
- GitHub CI + Vercel auf dem finalen Head.
- `docs/ACTIVE_WORK_STATUS.md` und `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md` aktualisieren.
- PR bleibt Draft; kein Mark Ready, kein Merge, keine Production-Migration.

Erst danach erneuter unabhängiger ChatGPT-Review und danach separate Product-Owner-Merge-Entscheidung.
