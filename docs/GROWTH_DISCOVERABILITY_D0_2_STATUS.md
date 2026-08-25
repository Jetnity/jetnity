# Jetnity – D0-2 Canonical / Origin / robots-sitemap Consistency – Status

Stand: 26. August 2026  
Agent: `Jetnity growth discoverability`  
Branch: `feat/d0-2-canonical-origin-consistency`  
Draft-PR: #74  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Status: **IMPLEMENTIERT / STOPP für unabhängigen ChatGPT-/Technical-Lead-Review**

Kein Ready. Kein Merge. Kein D0-3/G0-1/D1/G1+.  
`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Root Cause

Nach D0-1 (integriert) blieben D0-P2-01 und D0-P2-02 offen:

- `NEXT_PUBLIC_APP_URL` und `NEXT_PUBLIC_SITE_URL` ohne Vertrag;
- Metadata, robots, Sitemap und Homepage-JSON-LD-URL konnten verschiedene Origins verwenden;
- keine Canonicals auf `/` und `/planen`;
- deny-all `robots.txt` warb trotzdem Sitemap und Host.

Ein späterer Custom-Domain-Cutover hätte dadurch eine zweite URL-Wahrheit und widersprüchliche Crawl-Signale erzeugt.

## 2. Architekturentscheidung

Kleiner, zentral getesteter Public-Origin-/Indexing-Vertrag in `lib/seo/oeffentlicher-origin.ts`.

- `NEXT_PUBLIC_SITE_URL` gewinnt, wenn gültig (`http`/`https`, kein Userinfo).
- `NEXT_PUBLIC_APP_URL` ist Legacy-Fallback, wenn kein Site-Wert gesetzt ist.
- Origin wird ohne Path, Query, Hash und trailing Slash normalisiert.
- Ungültiges Protokoll, nicht parsebare URL und Path-Drift: keine Index-Freigabe.
- Indexing bleibt fail-closed, wenn der gewählte Host ephemeral ist **oder** ein gesetzter App-Host weiterhin `localhost` / `*.vercel.app` ist. Dadurch aktiviert eine Wunsch-`SITE_URL` bei live `*.vercel.app` kein Allow-Indexing.
- `NEXT_PUBLIC_ALLOW_INDEXING=false` bleibt Kill-Switch.
- Deny-all: `Disallow: /`, keine Sitemap-/Host-Werbung; Sitemap-Output ist leer.
- Synthetischer Allow-Modus (nur Tests/isolierte Konfiguration): Host, Sitemap und Canonicals dieselbe Origin; Sitemap nur `/` und `/planen`; D0-1-Disallows bleiben.

Kein Shared-Contract außerhalb dieses Public-Origin-/Metadata-Vertrags. Auth-Rücksprungziele (`LoginForm`/`RegisterForm`/`admin/login/actions`) wurden nicht geändert.

## 3. Geänderte Dateien

Runtime / Vertrag:

- `lib/seo/oeffentlicher-origin.ts` (neu)
- `lib/seo/oeffentlicher-origin.test.ts` (neu)
- `lib/seo/robots-regeln.ts` – Index-Entscheidung und `robotsDokument()`
- `lib/seo/robots-regeln.test.ts`
- `lib/seo/index-grenze.ts` – Kommentar; `SITEMAP_OEFFENTLICHE_PFADE` bleibt die Allow-Liste
- `lib/seo/index-grenze.test.ts` – D0-1-Regression plus Auth-noindex
- `app/robots.ts`
- `app/sitemap.ts`
- `app/layout.tsx` – `metadataBase` / OG-URL aus dem Vertrag
- `app/(public)/layout.tsx` – dasselbe
- `app/(public)/page.tsx` – Canonical `/`; JSON-LD `url` aus dem Vertrag
- `app/(public)/planen/page.tsx` – Canonical `/planen` ohne Query
- `.env.example` – Kommentare zum Vertrag, keine Aktivierung

Nicht geändert: `docs/ACTIVE_WORK_STATUS.md`, Legal-Seiten, Auth, DB, Tracking, hreflang, neue JSON-LD-Typen.

## 4. Tests und Testannahmen

Gezielte SEO-Tests **31/31** (`index-grenze`, `robots-regeln`, `oeffentlicher-origin`).

Fachliche Semantik, nicht nur Wiring:

1. gültige `SITE_URL` wird auf Origin normalisiert;
2. Site gewinnt vor App;
3. App-Fallback erlaubt synthetisches Allow nur, wenn der App-Host selbst nicht ephemeral ist;
4. ungültige URL / `ftp:` / Path- oder Query-Drift → kein Index;
5. localhost deny-all;
6. `*.vercel.app` deny-all, auch wenn `SITE_URL` eine Apex-Wunschdomain ist;
7. `ALLOW_INDEXING=false` deny-all;
8. deny-all robots: `sitemap=null`, `host=null`;
9. deny-all Sitemap: `[]`;
10. synthetischer Allow: Host/Sitemap/Canonicals `https://jetnity.ch`;
11. Allow-Sitemap = `/` + `/planen`, nicht `/reisen`;
12.–13. Source-Contract: `/` und `/planen` setzen `kanonischeUrl`;
14. `idee` leer / whitespace / Wert → `noindex`; Canonical bleibt `/planen`;
15. `/reisen` und `/reisen/[tripId]` bleiben `NICHT_INDEXIEREN`;
16. Login/Register/Auth-Callback/Update-Password/Admin/Unauthorized bleiben noindex;
17. keine Tracking-/DB-/Auth-Logik in diesem Diff.

`npm test` vollständig: **2025/2025**.

## 5. Lokale Gates auf Runtime `f1827666`

| Command | Ergebnis |
| --- | --- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0, keine Warnings |
| `npm test` | 0, **2025/2025** |
| `npm run check:setup:ci` | 0, 1 bekannte Warning: keine lokale `.env` |
| `npm run check:dead` | 0 |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0; 12/12 |
| `npm run check:schema-bezug` | 0 |
| `npm run build` | 0 |

## 6. Lokale HTML / robots / sitemap Evidence

`next start` nach Production-Build ohne `.env` (`http://127.0.0.1:3011`):

| Surface | robots | canonical |
| --- | --- | --- |
| `/` | `index, follow` | `http://localhost:3000` |
| `/planen` | `index, follow` | `http://localhost:3000/planen` |
| `/planen?idee=` | `noindex, nofollow` | `http://localhost:3000/planen` |
| `/planen?idee=%20` | `noindex, nofollow` | `http://localhost:3000/planen` |
| `/planen?idee=Bali+mit+Pass+CH` | `noindex, nofollow` | `http://localhost:3000/planen` |
| `/reisen` | `noindex, nofollow` | keines |
| `/login` | `noindex, nofollow` | keines |
| `/unauthorized` | `noindex, nofollow` | keines |

`robots.txt`: nur `Disallow: /`. Keine Sitemap- oder Host-Zeile.  
`sitemap.xml`: leeres `urlset`.

Helper-Szenarien: `/opt/cursor/artifacts/d02_local_html/env_szenarien.jsonl`.

## 7. Self-Review

Eingehalten: kein Legal-Text, kein `/privacy`/`/terms`, kein hreflang, kein JSON-LD-Ausbau ausser vorhandener `url`, kein Tracking/Consent/Ads, keine Custom Domain, kein produktives Allow-Indexing, keine DB/Auth/Traveller/Route/Provider/Payment-Änderung, kein TW-6, kein `ACTIVE_WORK_STATUS`.

Risiko bewusst akzeptiert und fail-closed gelöst: `.env.example` enthält weiterhin `NEXT_PUBLIC_SITE_URL=https://jetnity.com`. Wäre nur Site-URL für Allow entscheidend, könnte Production bei gesetzter Wunschdomain plötzlich Allow-robots liefern. Der Vertrag verlangt zusätzlich, dass ein gesetzter App-Host nicht ephemeral ist.

HTML-`index,follow` auf öffentlichen Basisflächen bei deny-all robots bleibt das bisherige D0-1-Verhalten der öffentlichen Basis. D0-2 macht robots/sitemap dazu konsistent (keine Sitemap-Werbung). Ein späterer Launch-Slice darf HTML und robots gemeinsam umschalten.

## 8. Exact-Head

Runtime-Head dieses Status: `f182766668161e829ae6c9fb5f804e5a2e690da9`.  
Dieser Persist-Commit ändert den Branch-Head. Technical Lead prüft den dann aktuellen HEAD live.

Vor Runtime: Branch 2/0 docs-only auf Baseline `ba86279e`. Review-Threads: 0.

## 9. Weiterhin offen

- **D0-P1-03** – `/privacy` und `/terms` 404; keine Texte erfinden
- D0-P2-04 – hreflang / Locale
- D0-P2-05 – JSON-LD Foundation (`Organization`/`WebSite`); nur die bestehende WebApplication-URL ist origin-konsistent
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02
- Custom Domain / Public Launch / produktives Indexing

## 10. Nächster Schritt

**STOPP.**

ChatGPT / Technical Lead prüft PR #74 unabhängig von Anfang an und entscheidet über Korrektur oder Integration.

Kein Ready. Kein Merge. Kein nächster Slice.
