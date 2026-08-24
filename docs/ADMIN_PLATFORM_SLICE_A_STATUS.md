# Admin Platform – Slice A Status

Stand: 24. August 2026  
Verantwortlicher Cursor-Agent: `Admin platform audit`  
Branch: `feat/admin-control-center-ia`  
PR: Draft #44  
Auftrag: `docs/ADMIN_SLICE_A_IMPLEMENTATION_TASK.md`

## Status

**Implementiert, Draft, nicht merge-bereit.** Unabhängiger Review folgt. Kein Mark Ready, kein Merge.

Lokal verifizierte Gates auf Head `86c69a55` (plus nachgezogener Doku-Nachtrag, falls vorhanden):

- `npm test`: 1715/1715
- `npm run typecheck`: Exit 0
- `npm run lint`: keine Warnungen/Fehler
- `npm run check:api-schutz`: 10 Admin-Routen, alle `requireAdminApi()`
- Hygiene: `check:dead`, `check:exports`, `check:deps`, `check:schema-bezug` grün
- Production-Build: Exit 0, 38/38 Seiten

Nicht gelaufen / nicht behauptet: `db:sicherheit`, `db:rls`, Preview, Production-Migration. GitHub-CI zum Push folgt separat.

## Ziel

Aus dem vorhandenen gehärteten Admin-Backoffice eine ehrliche Steuerzentrale auf IA-/UI-Ebene machen. Keine neuen Integrationen, keine neue Datenwahrheit, keine neue Autorität.

## Umgesetzt

- Home ist operative Lage statt Setup-Guide/Legacy-Scheinzustände.
- Toter Copilot-Execute-Pfad und Auto-Menü entfernt; sichtbarer Hinweis `Copilot Pro folgt` ohne API-Aufruf.
- Erfundene Notifications/Badges entfernt.
- Sidebar folgt der Ziel-IA: fertige Flächen vs. ausdrücklich `folgt`.
- Capability-aware Navigation nur als UX (`lib/admin/navigation.ts`). Server-Gates bleiben alleinige Autorisierung.
- Payments/Refunds als lokale/operative Sicht gekennzeichnet.
- IP-Blockliste als **nicht enforced** gekennzeichnet.
- Break-Glass-Writes auf Refund/Block/Unblock antworten mit 403 (`lib/auth/admin-write-gate.ts`).
- Stub-Seiten Analytics/Content/Marketing/Settings/Localization sehen nicht wie fertige Module aus.

## Explizit nicht in Slice A

Keine Migration, keine Rollen-/Capability-/RLS-Neudefinition, keine Service-Role-Ausweitung, kein Payment-/Refund-Provider, kein Bexio, keine Ads, kein Infomaniak, kein System-Health-Backend, kein Copilot-Pro-Execute, keine Account-/Trip-/Traveller-/Route-/Readiness-/Safety-/Seasonal-/Homepage-Änderung.

Traveller Context ist für Slice A nicht relevant; es werden keine Reise-Credentials erhoben.

## Nächster Schritt

Unabhängiger ChatGPT/Technical-Lead-Review von Draft PR #44. Slice B (System Health, read-only) erst danach.
