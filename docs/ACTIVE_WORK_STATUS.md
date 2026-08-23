# Jetnity – Active Work Status

Stand: 23. August 2026
Arbeitsblock: **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**

## 1. Arbeitsblock / Ziel

Eigene provider-neutrale Seasonal-Domäne. R2-Blocker 5 und 6 sind geschlossen. Nächster Schritt ist der unabhängige R3-Re-Review.

Verbindlicher Auftrag: `docs/CURSOR_TRAVEL_TIMING_SEASONAL_FOUNDATION_TASK.md`  
Review: `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`  
Fixes: `docs/PR38_CURSOR_REVIEW_FIXES.md`

## 2. Branch / PR / aktueller Head

- Branch: `feat/travel-timing-seasonal-intelligence`
- Draft PR: https://github.com/Jetnity/jetnity/pull/38
- Basis: `origin/main` @ `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- Runtime-Head R2-Fixes: `aa6cafa2f4997c22081dff35fe950a18190e7886`
- Docs-Head ist der Commit dieses Nachzugs
- Ahead/behind zum Runtime-Lock: **13 ahead, 0 behind** `origin/main`

## 3. Status

**R2-Fixes implementiert, Full Gate auf `aa6cafa2` grün.** PR bleibt Draft. Kein Mark Ready, kein Merge. ChatGPT R3-Re-Review steht aus.

## 4. Bereits umgesetzt

- Foundation-Runtime
- Erst-Review-Blocker 1–4 auf `89290eff`
- R2-Blocker 5–6 auf `aa6cafa2`
- `seasonalProviderAus()` bleibt `null`
- keine DB-Migration, keine Secrets, keine neuen Kosten

## 5. Gerade offen / noch nicht umgesetzt

- unabhängiger ChatGPT-Re-Review R3
- keine Merge-Freigabe
- kein echter Seasonal-Provider

## 6. Letzte relevanten Runtime-Änderungen

`aa6cafa2`: explizite `evidenceClass`, fail-closed API-Graph-Integrität.

## 7. Tests / CI / Preview

Auf Runtime `aa6cafa2`:

- `npm test` **1553/1553**
- Typecheck / Lint / Hygiene grün
- Production-Build Exit 0
- UI-Audit **1014/1014**, 0 Fehler
- DB: Rechte 51 OK, RLS Exit 0, Sicherheit **210/210**, Parallelität **7/7**
- GitHub Actions SUCCESS: https://github.com/Jetnity/jetnity/actions/runs/32640978237
- Vercel Preview READY: https://vercel.com/jetnity-e1b93c82/jetnity-app/vuUyJdg9F5qRiFWL5h7xb5MLfpua

## 8. DB / RLS / Production-Grenze

Unverändert: keine Seasonal-Tabelle, keine Migration.

## 9. Kosten / Provider / Secrets

Unverändert `null`.

## 10. Bekannte Risiken / Review-Funde

R1- und R2-Blocker geschlossen. Spätere Nähte: In-process Rate-Limit, keine persistierte Nutzerentscheidung, Account-Serverload, title-only Geo.

## 11. Offene Nutzerentscheidungen / Freigaben

Keine Merge-Freigabe.

## 12. Exakter nächster Schritt

Unabhängiger ChatGPT-Re-Review R3 von Draft-PR #38, beschränkt auf die zwei geschlossenen R2-Blocker und das Stop-Kriterium.

## 13. Welche Dateien zuerst gelesen werden müssen

1. `docs/PR38_CHATGPT_INDEPENDENT_REVIEW.md`
2. `docs/PR38_CURSOR_REVIEW_FIXES.md`
3. `lib/seasonal/normalisieren.ts`
4. `lib/seasonal/schema.ts`
5. `lib/seasonal/auswerten.ts`
