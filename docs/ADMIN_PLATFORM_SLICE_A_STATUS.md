# Admin Platform – Slice A Status

Stand: 24. August 2026  
Verantwortlicher Cursor-Agent: `Admin platform audit`  
Branch: `feat/admin-control-center-ia`  
PR: Draft #44  
Auftrag: `docs/ADMIN_SLICE_A_MAIN_SYNC_TASK.md`

## Status

**Main-Sync mit `main` `084f7c87` in Arbeit.** Draft, nicht gemergt. Kein Mark Ready, kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.

Bisheriger Technical Closure / PASS gilt nur für den alten Exact Head `5632a3cac1301d2d649fcb1d2b9552d3763c8b9f`.  
Closure-Nachweis: `docs/ADMIN_PLATFORM_SLICE_A_TECHNICAL_CLOSURE.md`.  
Dieser alte Head ersetzt das neue Integrationsgate nicht.

Admin-Entscheidung nach ADR-Kollision mit Account AP-1: **ADR-0155**.

## Belegte Gates auf Exact Head `5632a3ca` (vor Main-Sync)

- GitHub Actions `CI` **SUCCESS**: `32683942810`
- Vercel Preview **READY**: `dpl_czE3XJXw3qx3sXMrh7LTgMV94zBL`
- gegen damaligen `main` `e4f4cca7`: 7 ahead / 0 behind

Neues Exact-Head-Gate nach Merge mit `084f7c87`: **noch nicht belegt.**

Nicht behauptet: neuer CI-/Preview-Stand, `db:sicherheit`, Production-Migration, eingeloggte Admin-Browserprüfung, Product-Owner-Merge-Freigabe.

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

Merge mit `main` `084f7c87` abschließen, lokale Gates und Exact-Head CI/Preview belegen, dann unabhängigen Technical-Lead-Integrationsreview abwarten. Slice B / PR #46 bleibt unangetastet.
