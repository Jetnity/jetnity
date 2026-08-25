# Jetnity – Growth / Discoverability D0-G0 Status

Stand: 25. August 2026  
Status: **AUDIT AUSGEFÜHRT / STOPP für unabhängigen ChatGPT-/Technical-Lead-Review**

Agent: `Jetnity growth discoverability`  
Branch: `audit/growth-discoverability-d0-g0-foundation`  
Draft-PR: #69  
Bericht: `docs/GROWTH_DISCOVERABILITY_D0_G0_AUDIT.md`

## Baseline

Start-Baseline, live unverändert:

`main @ b2a9e69495d7e11cbc0f0c8fb1a6750e933094ea`

Dieser `main` enthält:

- TW-5 / PR #66 integriert;
- post-TW-5 Continuity / PR #68 integriert;
- keine D0/G0-Runtime durch diesen Audit-Branch.

Merge-Base = Baseline. Ahead/Behind vor dem Auditbericht: 2/0 (Control-Docs). Dieser Status- und Audit-Commit bleibt docs-only.

## Ergebnis

Unabhängiger adversarial Audit ist ausgeführt. Kein Ready. Kein Merge. Keine D0/G0-Runtime, keine Homepage-Copy, keine D1/G1+.

Kurz:

- Production-`robots.txt` ist `Disallow: /` wegen `*.vercel.app` – wirksamer Kill-Switch, kein Index-Boundary-Contract.
- **3 P1**, 8 P2, 4 P3, **0 P0**.
- Kein nachgewiesener anonymer SSR-Leak von Account-Trip-, Dokument-, Admin- oder Payment-Inhalten.
- Kein Live-Tracking, kein Fingerprinting, keine versteckte Anonymous→Account-Auflösung.
- G0-Event-/Attribution-/Consent-Contracts fehlen im Code.

P1:

- D0-P1-01 – `/reisen` und `/reisen/[tripId]` erben `index,follow`; Sitemap enthält `/reisen`.
- D0-P1-02 – `/planen?idee=` spiegelt Nutzertext in indexierbares SSR-HTML.
- D0-P1-03 – `/privacy` und `/terms` sind 404 bei Pflicht-Zustimmung.

## Gates (Exact Head vor diesem Persist-Commit)

Ausgeführt auf `9f1a91603ef5a9296c891164ec88710ec595b920`:

| Command | Exit |
| --- | --- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm test` | 0 (1994/1994) |
| `npm run check:setup:ci` | 0 (1 Warning: keine lokale `.env`) |
| `npm run check:dead` | 0 (1 begründete Ausnahme `CookieConsent`) |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 |
| `npm run check:api-schutz` | 0 (12/12) |
| `npm run check:schema-bezug` | 0 |
| `npm run build` | 0 |

Logs: `/opt/cursor/artifacts/d0g0_gates/`. HTTP-Probe: `/opt/cursor/artifacts/d0g0_http_probe/`.

## Harte Grenzen – eingehalten

- Audit/Evidence/Architecture only;
- keine Homepage-Copy;
- keine neuen öffentlichen Claims;
- keine produktive Tracking-/Ads-/CRM-Aktivierung;
- keine Secrets/paid calls;
- keine DB/Migration/RLS/Auth/Traveller/Route-Änderung;
- keine D1+/G1+ Runtime;
- Trip-Workspace-Runtime unangetastet.

## Nächster Schritt

**STOPP.**

ChatGPT / Technical Lead führt den unabhängigen Review. Empfohlene erste Runtime danach, nicht in #69: **D0-1 Index Boundary Contract**, bevor ein nicht-ephemeral Production-Host indexierbar wird.

Kein weiterer Agent aus diesem Slice. Kein Ready. Kein Merge.
