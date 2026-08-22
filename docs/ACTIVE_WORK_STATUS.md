# Jetnity – Active Work Status

Stand: 22. August 2026  
Arbeitsblock: **Foundation D – Route & Transit Intelligence / Product-Owner-Closeout**

## 1. Branch / PR / Status

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34** https://github.com/Jetnity/jetnity/pull/34
- Foundation-D-Code-Head: `f55a8dcf1491575d5b0370bafec3934d9b7b884b`
- Closeout-Sync-Head: `6098cf45`
- Finaler verifizierter Closeout-Head: `1c1e7a5d16a52c7df95342742813a5ba5f3164d5`
- finalen Branch-/PR-Head vor jeder weiteren Arbeit über GitHub prüfen
- Status: **Product-Owner-Rundgang abgeschlossen; Branch mit aktuellem `main` synchronisiert; lokal/CI/Preview verifiziert; Merge-Freigabe ausstehend**
- Merge: **nicht freigegeben**, PR bleibt Draft

## 2. Ziel

Eine Route, eine strukturierte Wahrheit. Länder nur aus belastbaren Airport-/Itinerary-Referenzen. Kein Raten aus Ortsnamen und keine Country-Truth aus Client-/Browserdaten – unabhängig vom persistenten Schreibweg.

## 3. Bereits umgesetzt

- `lib/route/` als provider-neutrale Route-Facts-Domäne
- Persistenz in vorhandenem `trip_items.metadata`; Development-RPC atomar (ADR-0113)
- Guest→Account fail-closed; Browser-Länder verworfen (ADR-0114)
- direkter `reise_anlegen`-RPC und jeder `trip_items`-INSERT/UPDATE kanonisieren (ADR-0115, ADR-0116)
- Readiness wird bei Transitänderung stale
- Flug-UI progressiv, Übersicht dezent
- UI-Audit-Fixtures Direktflug / 1 Transit / 2 Transits
- Final Review ohne weiteren Foundation-D-Codeblocker
- Product-Owner-Rundgang abgeschlossen und versioniert
- Branch mit `main` inklusive Safety-/Seasonality-/Homepage-/Audit-/Provider-Readiness-Policies synchronisiert

Route Facts bleiben traveller-neutral.

## 4. Noch offen

- ChatGPT prüft den finalen Closeout-Head unabhängig
- Product Owner entscheidet separat über Merge
- kein Timatic, kein echter Provider, keine Production-Migration
- Foundation E / Workspace-Umbau / Safety / Seasonality / Homepage sind spätere Blöcke

## 5. Sync mit `main`

- Vor Closeout: PR `CONFLICTING`, weil `main` während der Abnahme weitergelaufen war
- Konflikte semantisch gelöst in `ROADMAP.md`, `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`, `JETNITY_HANDOFF.md`
- Kein Foundation-D-Code durch den Sync verändert

## 6. Tests / CI / Preview

Neu ausgeführt nach dem ersten `main`-Sync (`380cdb83`); danach nur Dokumentations-Merges:

- `npm test`: **1295 pass / 0 fail**
- Typecheck, Lint, Hygiene: grün
- Production Build: grün, 38/38 Seiten
- `auth:pruefen`: 55/55
- `db:anwenden --probe`: Development nichts offen
- `db:rechte`: OK
- `db:rls`: grün
- `db:sicherheit`: **200/200** inkl. direkter Route-Metadata-Manipulation
- Trip Workspace Audit: 726 / 0 Fehler, WebKit + Chromium
- GitHub Actions CI success auf `1c1e7a5d`: https://github.com/Jetnity/jetnity/actions/runs/32589213750
- Vercel Preview READY auf `1c1e7a5d`: https://jetnity-5h945i9ri-jetnity-e1b93c82.vercel.app
- Draft-PR #34 mergeable / CLEAN; das ist keine Merge-Freigabe

## 7. Datenbank / RLS / Production

- Development enthält `20260822130000`, `20260822140000`, `20260822150000`
- Development-Trigger `trip_items_route_itinerary_schuetzen` vorhanden
- Production endet bei `20260822020000 trip_travellers`
- Production enthält **keine** Foundation-D-Migration
- **Production nicht migrieren**

## 8. Kosten / Provider / Secrets

- keine neuen Secrets
- keine neuen laufenden Kosten
- kein Provider aktiviert

## 9. Bestätigte spätere Produktblöcke

Gesichert in Acceptance-Closure, Addenda, Handoff, Roadmap und globalen Policies. Neuere Reihenfolge gemäß `docs/PRODUCT_OWNER_PR34_PROVIDER_READINESS_ADDENDUM.md`:

1. Foundation D abschließen
2. Foundation E Traveller Context / Multi-Citizenship
3. Travel Safety & Disruption provider-neutral
4. Travel Timing & Seasonal Intelligence provider-neutral
5. Provider-Readiness-Lücken schließen (`docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`)
6. großer Workspace-/Übersicht-Umbau inkl. Multi-Destination, Guest-UX, Preference-Flow
7. finaler Workspace Intelligence Audit
8. echte Providerphase
9. Provider-backed End-to-End-/Truth-Audit
10. finale Startseiten-Positionierung

## 10. Exakter nächster Schritt

1. ChatGPT prüft diesen Closeout gegen den tatsächlichen Head.
2. **Product Owner entscheidet separat über Merge.**
3. nicht mergen, nicht Mark Ready, keine Production-Migration.

## 11. Pflichtlektüre

- `docs/ACTIVE_WORK_STATUS.md`
- `docs/CURSOR_PR34_PRODUCT_OWNER_CLOSEOUT_TASK.md`
- `docs/PR34_PRODUCT_OWNER_CLOSEOUT_REPORT.md`
- `docs/PRODUCT_OWNER_PR34_ACCEPTANCE_CLOSURE.md`
- `docs/PR34_FINAL_HUMAN_REVIEW.md`
- `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/PRODUCT_OWNER_PR34_PROVIDER_READINESS_ADDENDUM.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
- `JETNITY_HANDOFF.md`, `ROADMAP.md`
