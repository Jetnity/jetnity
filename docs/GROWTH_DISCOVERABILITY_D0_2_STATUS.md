# Jetnity – D0-2 Canonical / Origin / robots-sitemap Consistency – Status

Stand: 26. August 2026  
Agent: `Jetnity growth discoverability`  
Branch: `feat/d0-2-canonical-origin-consistency`  
Draft-PR: #74  
Aktueller `main`: `8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`  
Status: **P1-D0-2-TL-01 KORRIGIERT / STOPP für erneuten unabhängigen Technical-Lead-Review**

Kein Ready. Kein Merge. Kein D0-3/G0-1/D1/G1+.  
`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Root Cause

Nach D0-1 blieben D0-P2-01 und D0-P2-02 offen: zwei Origin-Variablen, fehlende Canonicals, deny-all robots warb Sitemap/Host.

Unabhängiger Technical-Lead-Review von PR #74 fand danach den Merge-Blocker:

**P1-D0-2-TL-01 – Public Indexing war nicht explizit opt-in.**

Die erste D0-2-Formel setzte `freigabe = NEXT_PUBLIC_ALLOW_INDEXING !== 'false'`.  
Unset galt damit bereits als Freigabe. In Kombination mit gültiger `NEXT_PUBLIC_SITE_URL` und fehlender `NEXT_PUBLIC_APP_URL` hätte Production unbeabsichtigt den Allow-Pfad erreichen können.

## 2. Architekturentscheidung

Zentraler Vertrag bleibt `lib/seo/oeffentlicher-origin.ts`.

Origin:

- `NEXT_PUBLIC_SITE_URL` gewinnt, wenn gültig (`http`/`https`, kein Userinfo).
- `NEXT_PUBLIC_APP_URL` ist Legacy-Fallback, wenn kein Site-Wert gesetzt ist.
- Origin ohne Path, Query, Hash und trailing Slash.

Indexing, nach P1-D0-2-TL-01:

- nur der **exakte** Wert `true` darf den weiteren Allow-Check passieren;
- `undefined`, leer, `false`, `TRUE`, `1` und jeder andere Wert bleiben deny;
- zusätzlich weiterhin deny bei nicht-production, localhost, `*.vercel.app`, ungültiger URL, Path/Query/Userinfo-Drift und ephemeral gesetztem App-Host.

Deny-all: `Disallow: /`, keine Sitemap-/Host-Werbung, leere Sitemap.  
Synthetischer Allow nur in Tests/isolierter Konfiguration: Host/Sitemap/Canonicals dieselbe Origin; Sitemap nur `/` und `/planen`; D0-1-Disallows bleiben.

`.env.example` dokumentiert `NEXT_PUBLIC_ALLOW_INDEXING=false` als sicheren Default. `true` ist ein separates Public-Launch-Gate und wird nicht gesetzt.

## 3. Geänderte Dateien dieser Korrektur

- `lib/seo/oeffentlicher-origin.ts` – `indexingIstExplizitFreigegeben()` / `=== 'true'`
- `lib/seo/oeffentlicher-origin.test.ts` – Opt-in-Semantik
- `lib/seo/robots-regeln.test.ts` – Unset + gültige Apex-URL bleibt deny
- `.env.example` – sicherer Default `false`, Launch-Gate dokumentiert
- `docs/GROWTH_DISCOVERABILITY_D0_2_STATUS.md` – dieser Stand

Branch wurde kontrolliert mit `main @ 8ab4e666` synchronisiert (Merge, nur integrierte Audit-Docs aus #78/#79). Keine fremden Runtime-Dateien verändert.

Nicht geändert: `docs/ACTIVE_WORK_STATUS.md`, Legal, Auth, DB, Tracking, hreflang, JSON-LD-Typen, Custom Domain.

## 4. Tests und Testannahmen

Gezielte SEO-Tests **33/33**.

P1-D0-2-TL-01 fachlich:

1. production + gültige SITE_URL + ALLOW unset → deny
2. ALLOW leer → deny
3. ALLOW=false → deny
4. ALLOW=true + synthetisch gültiger Launch-Kontext → allow
5. ALLOW=true + localhost → deny
6. ALLOW=true + `*.vercel.app` → deny
7. ALLOW=true + Drift/invalid → deny
8. D0-1 private noindex-Grenzen bleiben grün
9. deny-all robots: `sitemap=null`, `host=null`
10. deny-all Sitemap: `[]`

Zusätzlich: `TRUE`/`1` sind nicht `true` und bleiben deny.  
`.env.example` enthält `NEXT_PUBLIC_ALLOW_INDEXING=false` und nicht `=true`.

`npm test` vollständig: **2027/2027**.

## 5. Lokale Gates auf Runtime `4653a07d`

| Command | Ergebnis |
| --- | --- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0, keine Warnings |
| `npm test` | 0, **2027/2027** |
| `npm run check:setup:ci` | 0, 1 bekannte Warning: keine lokale `.env` |
| `npm run check:dead` | 0 |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0; 12/12 |
| `npm run check:schema-bezug` | 0 |
| `npm run build` | 0 |

## 6. Lokale HTML / robots / sitemap Evidence

`next start` nach Production-Build ohne `.env` (`http://127.0.0.1:3013`):

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

Helper-Szenarien: `/opt/cursor/artifacts/d02_optin_env_szenarien.jsonl`.  
Production + gültige SITE_URL ohne `true` bleibt deny. Nur synthetisches `ALLOW=true` + gültige nicht-ephemere Origin erlaubt Host/Sitemap.

## 7. Self-Review

Geschlossen: P1-D0-2-TL-01.

Eingehalten: kein Legal-Text, kein `/privacy`/`/terms`, kein hreflang, kein JSON-LD-Ausbau, kein Tracking/Consent/Ads, keine Custom Domain, kein produktives Allow-Indexing, keine DB/Auth/Traveller/Route/Provider/Payment-Änderung, kein TW-6, kein `ACTIVE_WORK_STATUS`.

HTML-`index,follow` auf öffentlichen Basisflächen bei deny-all robots bleibt das bisherige D0-1-Verhalten der öffentlichen Basis.

## 8. Exact-Head

Runtime-Korrektur: `4653a07d`.  
Dieser Persist-Commit ändert den Branch-Head. Technical Lead prüft den dann aktuellen HEAD live.

Merge-Base zum bestätigten `main`: `8ab4e666`.

## 9. Weiterhin offen

- **D0-P1-03** – `/privacy` und `/terms` 404; keine Texte erfinden
- D0-P2-04 – hreflang / Locale
- D0-P2-05 – JSON-LD Foundation (`Organization`/`WebSite`)
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02
- Custom Domain / Public Launch / produktives Indexing

## 10. Nächster Schritt

**STOPP.**

ChatGPT / Technical Lead prüft PR #74 erneut unabhängig von Anfang an und entscheidet über Korrektur oder Integration.

Kein Ready. Kein Merge. Kein nächster Slice.
