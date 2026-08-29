# Provider 12Go Mobility Contract Audit – Agent Self-Review

Stand: 29. August 2026  
Status: **SELF-REVIEW ONLY / REVIEW-FIX `5463645369` + `5463718113` / KEIN PASS / KEIN READY / KEIN MERGE**  
Cursor-Agent: `Jetnity provider 12go audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/190  
Task: `docs/PROVIDER_12GO_MOBILITY_CONTRACT_AUDIT_TASK_2026-08-29.md`

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

---

## 1. Scope-Treue

| Constraint | Einhaltung |
| --- | --- |
| Docs/Evidence/Contracts only | ja; keine `lib/` / `app/` / `supabase/`-Edits |
| Kein Shared-Core-Edit | ja |
| Kein Signup / API-Antrag / Key / realer Call | ja; nur öffentliche HTTP GET |
| Kein Commercial-Provenance-Mint | ja |
| Keine Production-Mutation | ja |
| Kein UI | ja |
| Rental nicht in Adapter | ja; About-„Car rent“ explizit excluded |
| Nicht Ready / nicht mergen / kein Folgeslice | ja; Implementation nur als **Proposal** |
| UNKNOWN nicht erfunden | ja; Auth/Endpoints/Quotas/Parameternamen/Schema = UNKNOWN |

`next-env.d.ts` war lokal dirty und wurde **nicht** committed.

---

## 2. Acceptance gegen Task

| Forderung | Wo |
| --- | --- |
| Offizielle 12Go/Affiliate-Docs als Primärquelle | Evidence-Log + Status §3 |
| Enrollment / API-Prereqs / Approval | Status §3.2–3.3; Affiliate Terms 16 July 2025 |
| Modi train/bus/ferry/van/taxi + andere | Status §3.4; Vertrag §3.1 |
| Search/timetable/route | Vertrag §3.2 |
| Operator/service/trip IDs | Vertrag §3.3; API-IDs UNKNOWN |
| Location taxonomy | Vertrag §3.4; öffentliche Slug-URLs |
| Schedule/timezone | Vertrag §3.5; Encoding UNKNOWN |
| Pricing/currency/fees | Vertrag §3.6 |
| Availability | Vertrag §3.7 |
| Deeplink/affiliate/sub-ID | Vertrag §3.8 |
| Booking vs reseller | Vertrag §3.9 |
| Auth/env/quota/error sofern öffentlich | Vertrag §3.10; nicht öffentlich → UNKNOWN |
| Localization | Vertrag §3.11 |
| Cancel/refund/terms | Vertrag §3.12 |
| Mapping-Grenzen, Shared vs 12Go | Vertrag §1–2 |
| Offline fixtures ohne erfundene API-Felder | Vertrag §4 |
| Fixture ≠ live_api/persisted_snapshot | Vertrag §4.2, §5 |
| Future server transport/auth/parser/mapping/deeplink/obs/errors/gates | Vertrag §5, §7 |
| Status / Contract / Handoff / Self-Review | diese Dateien |
| Source URLs/titles/dates | Evidence-Log |
| Future implementation task | Proposal, nicht gestartet |
| `origin/main` re-fetch | Handoff §2; 0 behind vs `69ef27b1` |

---

## 3. Adversarial Prüfung

### 3.1 Habe ich ein API-Schema erfunden?

Nein. Keine Endpunkte, Header oder JSON-Felder als 12Go-Wahrheit. Die Normalized-Form ist ausdrücklich `jetnity.twelve-go.mobility.normalized.v1`, nicht 12Gos API.

### 3.2 Habe ich Parse.bot oder GitHub-SDKs als Vertrag benutzt?

Nein. Evidence §3 listet sie als ausgeschlossen.

### 3.3 Habe ich Rental oder Flights eingefaltet?

Nein. About-„Car rent“ und Flights sind dokumentiert und aus dem Adapter ausgeschlossen.

### 3.4 Könnte ein Fixture `live_api` minten?

Der Vertrag verbietet `sourceKind`/`persistenz` auf Fixtures und einen Live-Constructor. Es gibt keine Runtime, die das gegenteilige Verhalten hätte.

### 3.5 Habe ich einen Folgeslice gestartet?

Nein. Die Implementation-Datei ist `PROPOSAL ONLY / NICHT AUTHORISIERT`.

### 3.6 Traveller Context

Passport/Gender aus 12Go-FAQ/Privacy sind als PO-gated dokumentiert. Keine Visa-Wahrheit. Route Truth traveller-neutral.

### 3.7 Habe ich ADR-0199 als angenommen verkauft?

Nein. Status `PROPOSED / NOT ACCEPTED`.

---

## 4. Proaktive Funde (nicht Scope-Expansion)

1. **Kein legaler In-Workspace-Search ohne API-Approval.** iframe verboten, Scraping verboten, White Label verlässt den Graph. Das ist der zentrale Produktbefund.
2. **Affiliate-FAQ und Affiliate-Terms weichen bei Payout-Schwellen leicht ab.** Beide zitiert, nicht geglättet.
3. **12Go verkauft mehr als Jetnity-Mobility.** Ohne harte Mapping-Grenze entsteht ein stilles Universal-Transport-Angebot.
4. **API-Definition enthält Booking.** Ein späterer Transport-Slice darf das nicht still zu Jetnity-Payments machen.

---

## 5. Nicht geprüft / nicht behauptet

- GitHub Actions / Vercel Preview **dieses** Review-Fix-Heads (lokal PASS auf `17cf1ff5`; remote live prüfen)
- Production-Build remote/Vercel dieses Heads
- Live-Supabase
- Branch-Protection-API
- Partner-Dashboard, White-Label-Admin, Operator-Portal
- Konkrete Tracking-URLs
- Echte Ticketpreise/Fahrpläne

---

## 6. Review-Fix `5463645369`

P1: S5-B Production-Apply war fälschlich als zukünftiges Gate geführt. Korrigiert **nur** in den dedizierten 12Go-Dateien (Status, Vertrag, Handoff, ADR-Datei, Implementation-Proposal). Globale Current-State-Dateien wurden nach `5463718113` nicht mehr dafür benutzt.

Aktueller Vertrag:

- S5-B-Persistenzgrundlage ist bereits auf Production (`20260829140000`, verifiziert).
- Kein reales Provider-Snapshot.
- Runtime-Write-Pfad/Principal-Allocation bleibt geschlossen und extra-gated.
- Nur ein genehmigter 12Go-Live-Server-Pfad darf später `live_api` minten und die vertrauenswürdige S5-B-Write-Authority aufrufen.
- TW-8 bleibt geschlossen, bis echte Commercial Provenance existiert.
- 12Go bleibt das erste Mobility-Spezialziel; Enrollment/API-Antrag/Credentials/paid calls/Production-Aktivierung bleiben PO-Gates.

Nicht erfunden: Auth, Endpunkte, Sandbox, Quotas, Rate Limits, Error-Bodies, Tracking-Parameternamen, Payload-Felder.

## 7. Isolation `5463718113`

P1 Parallel-Workstream: #190 darf nicht um globale Current-State-Ownership konkurrieren.

- `JETNITY_HANDOFF.md` und `docs/ACTIVE_WORK_STATUS.md` auf Merge-Base zurückgesetzt.
- `ARCHITECTURE.md` und `ROADMAP.md` zurückgesetzt (kein S5-B-Reword, kein Ersatz des globalen Next-Step).
- `DECISIONS.md` zurückgesetzt. 12Go-ADR bleibt die dedizierte Datei; kein shared ADR-0199-Eintrag (Draft-PR #187 nutzt ADR-0199 parallel).
- S5-B Production-Truth, 12Go-first und UNKNOWN-API bleiben in den dedizierten 12Go-Docs.

## 8. Verdict

Der Task ist als Audit/Contract-Prep erfüllt. Review-Fixes korrigieren S5-B-Current-State und Parallel-Isolation. Scope blieb docs-only. Unbekannte API-Teile bleiben UNKNOWN.

**Kein PASS. Kein Ready. Kein Merge.**

Unabhängiger Technical-Lead Exact-Head-**Re-Review** ist erforderlich.
