# Jetnity – Startpunkt für neue Chats und Agenten

Stand: 25. August 2026

Wenn du als neuer Chat, Technical Lead oder Coding Agent Jetnity übernimmst, lies **vor jeder Aktion** mindestens:

1. `JETNITY_START_HERE.md`
2. `docs/JETNITY_BINDING_BUILD_ORDER.md`
3. `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
4. `JETNITY_HANDOFF.md`
5. `docs/ACTIVE_WORK_STATUS.md`
6. den aktuellen Slice-Task/Status/Handoff

Danach GitHub/CI/Vercel/Supabase live verifizieren. Historische Handoffs und alte PR-Bodies sind Evidence ihres Zeitpunkts und dürfen aktuellere Wahrheit nicht überschreiben.

## Aktuelle große Build-Reihenfolge

1. Trip Workspace vollständig: `Trip workspace audit architecture` – TW-1 → TW-2 → TW-4 → TW-3 → Details/Gaps → Rest gemäß Plan → finaler Workspace-Audit.
2. Traveller-/Pass-/Multi-Citizenship produktweit vervollständigen auf Foundation E.
3. Account: `Account plattform audit vorbereitung` – AP-4 bis AP-12.
4. Provider: `Jetnity provider readiness audit` – S4 bis S8, danach echte Provider unter besonderen Gates.
5. Admin: `Admin platform audit` – D bis K; Billing-/Refund-P1 vor Finance-/Payment-Live.
6. Homepage nach stabilem Workspace-Kern.
7. Kommerzielle Produktschicht.
8. Production-Härtung / Launch Readiness.

Details und Abhängigkeiten stehen in `docs/JETNITY_BINDING_BUILD_ORDER.md`.

## Neue Autonomie-Regel

Seit 25. August 2026 darf ChatGPT/Technical Lead normale, scope-treue Entwicklungsarbeit weitgehend selbstständig steuern. Nach Self-Review, vollständigen Exact-Head-Gates, CI/Vercel-Evidence und unabhängigem Technical-Lead-Review dürfen normale PRs selbst Ready gesetzt und anschließend selbst gemergt werden.

Product-Owner-Freigabe bleibt zwingend für besondere Gates, insbesondere Production-Migrationen/destructive Datenänderungen, echte Provider/Secrets/Verträge/paid calls, Kosten über USD 100/Monat, große Produkt-/Geschäftsmodelländerungen, besonders sensible Identitätsdaten und öffentliche/produktive Aktivierungen.

Vollständige Regel: `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`.

## Unveränderte Truth-Regeln

- `unknown` bleibt `unknown`.
- Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health oder erfundene Visa-/Safety-/Regulatory-Truth.
- LLM erklärt Hard Truth, erzeugt sie nicht.
- Multi-Citizenship / mehrere Reisedokumente müssen in allen relevanten Funktionen berücksichtigt werden.
- Shared Auth/RLS/Identity/Traveller/Route/Privacy/Billing/Admin-Audit/Provider-Activation bleiben Technical-Lead-gesteuert.

## Aktiver Stand

Zum Zeitpunkt dieser Datei ist TW-1 der aktive Trip-Workspace-Slice auf Draft-PR #56 / Branch `feat/trip-workspace-tw1-shell-device-parity`, Agent `Trip workspace audit architecture`.

Vor Fortsetzung immer live prüfen, ob dieser Stand noch aktuell ist.
