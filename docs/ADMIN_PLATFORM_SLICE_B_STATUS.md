# Admin Platform – Slice B Status

Stand: 24. August 2026  
Verantwortlicher Cursor-Agent: `Admin platform audit`  
Branch: `feat/admin-system-health`  
PR: Draft #46, gestapelt auf Slice A / Draft PR #44  
Auftrag: `docs/ADMIN_SLICE_B_SYSTEM_HEALTH_TASK.md`

## Status

**Implementierung vorhanden, Gates noch nicht auf Exact Head geschlossen.** Draft, nicht gemergt. Kein Mark Ready, kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.

## Ziel

Erster professioneller, rein lesender System-Health-Bereich. Ein Dienst erscheint nur dann gesund, wenn eine reale, benannte und hinreichend frische Quelle genau diese Aussage trägt.

## Systeme

| System | Quelle jetzt | Statusmodell | Beweist | Beweist nicht | Freshness/TTL | Fehler | Später nötig |
| --- | --- | --- | --- | --- | --- | --- | --- |
| App / Deployment | Prozess antwortet; optionale `VERCEL_*`-Runtimefelder als Metadaten | `healthy`, wenn der Check läuft | Dieser Next.js-Prozess hat den Check ausgeführt | Vercel-Plattform, DB, CI, Infomaniak | 60s | Prozess tot = Seite/API fällt aus; das ist ehrlich | nichts |
| Vercel | keine Management-API | `not_configured` | Nur, dass kein Plattform-Token angebunden ist | Projekt-/Plattform-Health, Build-Queue | 120s | n/a | freigegebenes read-only Vercel-Token + Product-Owner-Gate |
| Supabase | user-scoped `public.airports` `select iata limit 1`, 8s Timeout | `healthy` bei Antwort; `unavailable` bei Timeout/Fehler; `not_configured` ohne URL/Anon-Key | App erreicht ihre Datenquelle | Management, Billing, Auth insgesamt, andere Regionen | 60s | Timeout/Fehler → `unavailable`, übrige Karten bleiben | Management-Health braucht separates Token/Gate |
| GitHub / CI | keine Actions-API | `not_configured` | Nur, dass kein CI-Status gelesen wurde | Letzter Workflow, Repo-Erreichbarkeit | 300s | n/a | freigegebenes read-only `actions:read` + Gate |
| Infomaniak | keine Domain-/Mail-/DNS-Quelle | `not_configured` | Nur, dass keine Integration aktiv ist | Domain, Mail, Hosting | 300s | n/a | freigegebenes read-only Infomaniak-Token + Gate |

Server-Cache 30s. Manueller Refresh über `GET /api/admin/system-health`. Kein Sekunden-Polling. Sichtbares Grün nur bei `healthy` und `fresh`.

## Explizit nicht in Slice B

Keine Migration, keine RLS-/Capability-Neudefinition, keine Service-Role, keine neuen Secrets/Tokens/Verträge/Kosten, keine Writes, kein Copilot-Execute, keine Account-/Trip-/Traveller-/Route-/Readiness-/Safety-/Seasonal-/Homepage-Änderung.

Traveller Context ist für System Health nicht relevant; es werden keine Reise-Credentials erhoben.

## Nächster Schritt

Lokale Pflicht-Gates, danach GitHub Actions CI und Vercel Preview auf demselben Exact Head. Anschließend unabhängiger Technical-Lead-Review. Kein Slice C.
