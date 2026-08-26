# Jetnity – D0-2 Canonical / Origin / robots-sitemap Consistency – Status

Stand: 26. August 2026  
Agent: `Jetnity growth discoverability`  
Branch: `feat/d0-2-canonical-origin-consistency`  
Draft-PR: #74  
Aktueller `main`: `8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`  
Status: **INTEGRATED on `main` via PR #74. HISTORICAL REVIEW-EVIDENCE darunter. D0-P2-01 und D0-P2-02 sind geschlossen.**

> Aktueller operativer Stand: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`. Kein D1/G1-Start.

Kein Ready. Kein Merge. Kein D0-3/G0-1/D1/G1+.  
`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## 1. Root Cause

D0-2 schloss zuerst Origin-/Canonical-/robots-Sitemap-Konsistenz und danach **P1-D0-2-TL-01** (explizites Opt-in).

Unabhängiger Re-Review fand **P1-D0-2-TL-02**:

Der Allow-Pfad akzeptierte jeden gültigen nicht-ephemeren Host. Synthetische Tests bewiesen `darfIndexieren=true` für `https://jetnity.ch`. Das widerspricht der verbindlichen Product-Owner-/Technical-Lead-Entscheidung vom 26.08.2026:

- `jetnity.com` = einzige kanonische und indexierte Hauptdomain
- `jetnity.ch` = nur Schweizer Entry-/Redirect-Domain, keine zweite indexierte Plattform

## 2. Architekturentscheidung

Zentraler Vertrag bleibt `lib/seo/oeffentlicher-origin.ts`.

- `KANONISCHE_PUBLIC_ORIGIN = 'https://jetnity.com'`
- Public Indexing nur wenn alle gelten:
  - Production
  - `NEXT_PUBLIC_ALLOW_INDEXING` exakt `true`
  - gewählte Origin exakt `https://jetnity.com`
  - keine Drift / kein Userinfo / kein ungültiges Protokoll
  - kein ephemeral Host
  - kein ephemeral gesetzter App-Host
  - keine widersprüchliche gültige SITE_URL/APP_URL
- `https://jetnity.ch`, `http://jetnity.com`, `https://www.jetnity.com`, fremde Real-Hosts bleiben deny, auch mit Opt-in.
- SITE=`https://jetnity.com` + APP=`https://jetnity.ch` oder eine andere Real-Origin → deny. Kein stiller `.com`/`.ch`-Split.

Kein Redirect, kein DNS-, Domain- oder Indexing-Cutover in diesem Slice.

`.env.example` bleibt:

- `NEXT_PUBLIC_SITE_URL=https://jetnity.com`
- `NEXT_PUBLIC_ALLOW_INDEXING=false`

## 3. Geänderte Dateien dieser Korrektur

- `lib/seo/oeffentlicher-origin.ts` – kanonische Allow-Origin + Origin-Widerspruch
- `lib/seo/oeffentlicher-origin.test.ts` – Allow-Tests auf `.com`, negative `.ch`/http/www/fremd/Konflikt-Tests
- `lib/seo/robots-regeln.test.ts` – Allow-Liste und Deny-Fälle
- `.env.example` – Kommentar, Werte unverändert
- `docs/GROWTH_DISCOVERABILITY_D0_2_STATUS.md` – dieser Stand

Nicht geändert: `docs/ACTIVE_WORK_STATUS.md`, Legal, Auth, DB, Tracking, hreflang, Redirect, Custom Domain.

## 4. Tests und Testannahmen

Gezielte SEO-Tests **34/34**.

P1-D0-2-TL-02:

1. Allow-Pfad nur für `https://jetnity.com`
2. `https://jetnity.ch` + ALLOW=true → deny
3. fremder Real-Host + ALLOW=true → deny
4. `http://jetnity.com` + ALLOW=true → deny
5. `https://www.jetnity.com` + ALLOW=true → deny
6. SITE=`.com` + APP=`.ch` → deny
7. SITE=`.com` + APP=fremde Domain → deny
8. synthetischer Allow: Host/Sitemap/Canonicals `https://jetnity.com`
9. D0-1 private noindex-Grenzen bleiben grün
10. deny-all robots ohne Host/Sitemap; leere Sitemap

P1-D0-2-TL-01 bleibt geschlossen: unset/leer/false/andere Werte deny.

`npm test` vollständig: **2028/2028**.

## 5. Lokale Gates auf Runtime `f41fd57f`

| Command | Ergebnis |
| --- | --- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0, keine Warnings |
| `npm test` | 0, **2028/2028** |
| `npm run check:setup:ci` | 0, 1 bekannte Warning: keine lokale `.env` |
| `npm run check:dead` | 0 |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0; 12/12 |
| `npm run check:schema-bezug` | 0 |
| `npm run build` | 0 |

## 6. Lokale Evidence

Lokaler Production-Start ohne `.env`: `robots.txt` nur `Disallow: /`, Sitemap leer.

Helper-Szenarien: `/opt/cursor/artifacts/d02_tl02_env_szenarien.jsonl`.

- synthetisches `ALLOW=true` + `https://jetnity.com` → allow, Host/Sitemap/Canonicals dieselbe Origin
- `.ch` / `http` / `www` / fremder Host / widersprüchliche APP_URL → deny

## 7. Self-Review

Geschlossen: P1-D0-2-TL-01 und P1-D0-2-TL-02.

Eingehalten: kein Redirect, kein Domain-Cutover, kein produktives Indexing, kein Legal, kein hreflang, kein Tracking, keine DB/Auth/Traveller/Provider/Payment-Änderung, kein `ACTIVE_WORK_STATUS`.

HTML-`index,follow` auf öffentlichen Basisflächen bei deny-all robots bleibt das bisherige D0-1-Verhalten.

## 8. Exact-Head

Runtime-Korrektur: `f41fd57f3e3137a40e859d18fce42377092b499e`.  
Dieser Persist-Commit ändert den Branch-Head. Technical Lead prüft den dann aktuellen HEAD live.

Merge-Base zum bestätigten `main`: `8ab4e666`.

## 9. Weiterhin offen

- **D0-P1-03** – `/privacy` und `/terms` 404; keine Texte erfinden
- D0-P2-04 – hreflang / Locale
- D0-P2-05 – JSON-LD Foundation
- G0-P2-01 / G0-P2-02 / G0-P3-01 / G0-P3-02
- Custom Domain / `jetnity.ch` Redirect / Public Launch / produktives Indexing

## 10. Nächster Schritt

**STOPP.**

ChatGPT / Technical Lead prüft PR #74 erneut unabhängig von Anfang an und entscheidet über Korrektur oder Integration.

Kein Ready. Kein Merge. Kein nächster Slice.
