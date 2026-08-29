# AP-6a Gate 0 – Live-Evidence

Stand: 29. August 2026  
Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 16`**  
Cloud-Run: https://cursor.com/agents/bc-216be067-b75a-4a2f-a186-8e38c67fb822  
Baseline: `main @ 765fc547c2d2ffd8460e05fec4234906103fe73c`

> Live-Evidence dieses Runs. Keine Rechtskonformität. Kein Browser-/Real-Device-Durchklick.

## 1. Git / Production / CI

| Fakt | Wert | Quelle dieses Runs |
| --- | --- | --- |
| Repository | `Jetnity/jetnity` | `gh` |
| Task-Baseline / live `origin/main` | `765fc547c2d2ffd8460e05fec4234906103fe73c` – Merge PR #164 | `git fetch origin main` |
| PR #164 | **MERGED** 2026-08-29T08:02:46Z | `gh pr view 164` |
| Post-Merge GitHub Actions | Run `33242227312` **SUCCESS** auf exakt `765fc547` | `gh run list --branch main` |
| GitHub Production deployment | `6153740318` **success** auf exakt `765fc547` | `gh api .../deployments` + statuses |
| Live HTML `data-dpl-id` | `dpl_3PWuyGopCnjcdh44twcUUpCWXzmi` auf `/`, `/privacy`, `/terms` | `curl` Production-Alias |
| Vercel-Dashboard-READY | **nicht** unabhängig über Vercel-API gelesen; Task nannte READY; live bestätigt ist die Deployment-ID im HTML | dieser Run |
| `main` Branch Protection | `protected=false` | `gh api repos/Jetnity/jetnity/branches/main` |
| Issue #165 | OPEN | `gh issue view 165` |
| Draft-PR | #166 OPEN Draft | `gh pr view 166` |
| Branch | `audit/ap6a-gate0-legal-foundation-2026-08-29` | git |
| Merge-Base | `765fc547` | git |
| Ahead / Behind vor Authoring | **1 / 0** (Task-Commit `668c2f17`) | git |
| DNS `jetnity.com` / `jetnity.ch` | **keine** öffentliche Auflösung | `socket.getaddrinfo` |
| Production-Alias | `https://jetnity-app.vercel.app` **200** auf `/` | `curl -sI` |

## 2. Production-HTTP auf dem Alias

| Pfad | HTTP | Bemerkung |
| --- | --- | --- |
| `/` | **200** | `text/html`; `data-dpl-id=dpl_3PWuyGopCnjcdh44twcUUpCWXzmi` |
| `/register` | **200** | `private, no-store` |
| `/login` | **200** | `private, no-store` |
| `/privacy` | **404** | Next-HTML 404; `lang=de`; gleiche Deployment-ID |
| `/terms` | **404** | Next-HTML 404; gleiche Deployment-ID |
| `/impressum` | **404** | verwandt, nicht AP-6a-Pflichtroute |
| `/datenschutz` | **404** | verwandt, nicht AP-6a-Pflichtroute |
| `/robots.txt` | **200** | `User-Agent: *` / `Disallow: /` |

Canonical-Hosts `https://jetnity.com/privacy` und `https://jetnity.ch/privacy` waren in diesem Run **nicht auflösbar**. Das ist Domain-Cutover-Residual, nicht dieser Slice.

## 3. Code-Inventar auf Baseline `765fc547`

| Fläche | Stand | Evidence |
| --- | --- | --- |
| `app/**/privacy/page.tsx` | **fehlt** | Dateisuche |
| `app/**/terms/page.tsx` | **fehlt** | Dateisuche |
| `app/**/impressum`, `datenschutz` | **fehlt** | Dateisuche |
| `RegisterForm` Checkbox + Links `/terms` `/privacy` | **vorhanden** | `components/auth/RegisterForm.tsx` |
| Register `signUp` persistiert Consent | **nein** | nur `user_metadata.name` |
| Register OAuth prüft Checkbox | **nein** | `handleOAuth` ohne `accept`; Google/Apple `enabled = false` |
| Login- und Register-Copy „DSGVO & CH-DSG konform“ | **vorhanden, unbelegt** | beide Formulare |
| Footer Legal-Links | **fehlen** | `components/layout/Footer.tsx` |
| Footer Kontakt | `mailto:info@jetnity.ch` | dieselbe Datei |
| Footer Copyright | `© {Jahr} Jetnity. Alle Rechte vorbehalten.` | Brand-Copy, keine Rechtsform |
| PublicNavbar Legal-Links | **fehlen** | `PublicNavbar.tsx` |
| `CookieConsent` | **Orphan** | `check:dead`-Ausnahme; V1-Text Views/Likes; Link `/privacy` |
| Consent-Tabelle | **fehlt** | keine `*consent*.sql` |
| Consumer-Export/Löschung | **fehlt** | keine Account-Routen |
| Analytics-SDK | **nicht gefunden** | keine gtag/plausible/posthog/vercel-analytics Call-Site |
| Sitemap-Pfade | `/`, `/planen` | `SITEMAP_OEFFENTLICHE_PFADE` |
| HTML-robots / robots.txt | fail-closed deny | `htmlRobots()`, live deny-all |

## 4. Nicht in diesem Run

- kein Browser-Klick durch Register → 404
- keine Supabase-Abfrage oder -Mutation
- keine Vercel-Projektmutation
- keine Auth-Config
- kein Real-Device
