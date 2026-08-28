# Jetnity – Next 16 Compatibility Prep S1 Handoff

Stand: 28. August 2026  
Status: **DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD-REVIEW**  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity framework compatibility 1`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/150  
Branch: `feat/next16-s1-request-api-compat-prep-2026-08-28`

Dieser Handoff übergibt Slice 1 (async Request-API-/Auth-Cookie-Kompatibilität auf Next 14). Er startet **kein** S2 und kein Framework-Bump. Agent-Self-Review ist kein PASS. Jeder neue Head invalidiert Prior-Gates.

---

## 1. Was dieser Agent getan hat

1. `cookies()`-basierte Supabase-Server-Factories async gemacht; alle tatsächlichen Caller nachgezogen.
2. Guest-Quota-Cookie-Pfad async-kompatibel gemacht, Vertrag und Fail-closed erhalten.
3. Gate-0-identifizierte Page-`params` / `searchParams` / `generateMetadata` Promise-kompatibel gemacht.
4. Adversariale Regressionstests ergänzt.
5. Alle vom Task geforderten lokalen Gates ausgeführt.
6. Status / Self-Review / kanonische Continuity self-expiring aktualisiert.

Kein Ready. Kein Merge. Kein S2.

---

## 2. Naming

| Feld | Wert |
| --- | --- |
| Logischer Name | `Cursor-Agent: Jetnity framework compatibility 1` |
| Preferred visible title | `Jetnity framework compatibility 1` |
| Observed run title | `Next 16 API compatibility` |
| Evidence | https://cursor.com/agents/bc-29e60ee0-acc7-4a21-ad50-34cf078cdc37 |
| Rename-Fähigkeit | keine |
| Generation | 1. Unmittelbare Review-Fixes bleiben dieselbe Session. |

---

## 3. Git / Live-Evidence

| Fakt | Wert |
| --- | --- |
| Task-Baseline / `origin/main` Re-Fetch | `2fdf8a18ab99d22a3ba75df7bd8451908593714f` |
| Merge-Base | exakt dieselbe SHA – **kein Drift** |
| Ahead / Behind vor Stamp | **3 / 0** |
| Implementation-Heads | `9833a4bf`, `822725a6` |
| Exact / Stamp-Head | Commit dieses Handoffs; live an PR #150 prüfen |
| Draft-PR | #150 OPEN / Draft |
| Branch Protection | unverändert; letzte bekannte Evidence `protected=false` |
| Production-Baseline laut Auftrag | Vercel `dpl_6FBEqSPthrixAsruftjYWw2rVZjY` READY auf `main @ 2fdf8a18` – **TL-Auftragswahrheit, nicht von diesem Agent geholt** |
| GitHub Actions / Vercel Preview dieses Heads | Platform-Evidence; TL verifiziert unabhängig |

### Geänderte Dateien gegen `origin/main` vor diesem Stamp

Runtime / Tests:

- `lib/supabase/server.ts`
- `lib/next/request-api.ts` + Tests
- `lib/modell/kontingent.ts`, `lib/modell/gast-cookie.ts` + Test
- Public/Admin Pages: Login, Register, Planen, Reisen, `[tripId]`, Account, Admin Users, Admin MFA, Unauthorized
- Admin home cards, admin-guard, trips/places/route helpers
- Search/Flights/Admin API Route Handlers
- bestehende SEO-Source-Tests

Nach diesem Stamp zusätzlich Continuity/ADR-Dateien. Vollständige Liste live am PR prüfen.

---

## 4. Ist-Zustand in einem Satz

Jetnity bleibt auf **`next@14.2.32`**, hat aber die Auth-/Request-API-Flächen bereits async-kompatibel vorbereitet. Das Framework-Bump ist S2 und nicht Teil dieses PRs.

---

## 5. Was der Technical Lead zuerst prüfen sollte

1. Keine Promise wird als Supabase-Client verwendet.
2. RSC-Cookie-Adapter bleibt no-op; mutable Pfade bleiben mutierbar.
3. `jetnity_gast` und Fail-closed unverändert.
4. Login/Register/Admin-MFA `next` geht weiter durch die bestehenden Allowlists.
5. `/planen` Robots bleibt Key-Präsenz (`Object.hasOwn`), nicht Truthy.
6. `[tripId]` Guest-vs-Account unverändert.
7. `/unauthorized?grund=lookup-failed` unverändert.
8. Admin Users `q`/`page` unverändert.
9. `package.json` / Lockfile ohne Framework-Drift.
10. PR bleibt Draft.

---

## 6. Exakter nächster Schritt

**Unabhängiger ChatGPT / Technical-Lead Exact-Head-Review von Draft-PR #150.**

Kein Ready. Kein Merge. Kein S2. Bei CHANGES REQUIRED bleibt **dieselbe Session / derselbe logische Agent**.
