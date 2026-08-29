# Provider Viator Activities Contract Audit — Agent Self-Review

Stand: 29. August 2026  
Status: **SELF-REVIEW ONLY / REVIEW-FIX 5463714237 / KEINE FREIGABE / KEIN PASS**  
Cursor-Agent: `Jetnity provider viator audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/189  
TL-Fix: Comment `5463714237` auf Head `dbfe76ce` (Continuity Isolation)

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead-Review. Gates auf `39d083ba`, `51eac518` und `dbfe76ce` gelten nicht für den neuen Head.

---

## 1. Scope-Treue

| Verbot aus dem Task | Eingehalten? |
| --- | --- |
| nur docs/evidence/contracts | ja |
| keine Runtime | ja — kein `lib/`, `app/`, `components/`-Edit |
| keine Shared-Core-Edits | ja |
| kein Signup / Key / realer Call / paid call | ja |
| keine Production-Mutation | ja |
| kein Commercial-Provenance-Mint | ja |
| kein UI | ja |
| nicht Ready / nicht mergen | ja |
| kein Implementation-Follow-up | ja — Foundation nur als Proposal-Datei |

Task-Datei inhaltlich unangetastet (Authority bleibt der versionierte Auftrag).

---

## 2. Adversarial Prüfung

### 2.1 Habe ich v1 und v2 vermischt?

Nein. Audit §2 trennt Partner API v2 (Current) von Affiliate 1.0 (historisch). `webURL` vs `productUrl` bleibt getrennt. Taxonomy-Pfad-Widerspruch ist `VIA-UNK-06`, nicht still gelöst.

### 2.2 Habe ich Full+Booking als Affiliate-style verkauft?

Nein. Contract-Zielklasse ist Full-access Affiliate. Full+Booking und Merchant sind explizit ausgeschlossen. Booking-Endpoints stehen auf der Nicht-Implementieren-Liste.

### 2.3 Habe ich die gesetzte grobe Zielwahl erneut geöffnet?

Nein. Viator bleibt das akzeptierte erste Activities-Target; GetYourGuide später. ADR-0078 / `ACTIVITIES.md` nicht umgeschrieben — sie bleiben Domain-Architektur (`ActivityProvider`, Search ≠ Booking, kein Vendor-Lock), kein zweites PO-Wahl-Gate. Getrennte PO-Gates bleiben Signup/Zugang/Vertrag, Credentials/paid calls, Production-Aktivierung und Full+Booking/Merchant.

### 2.3b Habe ich S5-B Persistence Apply als noch ausstehend geführt?

Nein. Im Adapter-Vertrag/Audit: Production-Migration `20260829140000_trip_item_commercial_provenance` ist angewendet und verifiziert. Offenes Commercial-Gate = Runtime-Write-Path/Principal + echte Provider-Antwort + trusted Write. `production_write_path_allocated` bleibt `false`. TW-8 bleibt geschlossen. Diese Slice-Wahrheit steht in den Viator-Docs, nicht als globaler `ACTIVE_WORK`/`ROADMAP`-Current-Rewrite.

### 2.3c Habe ich globale Current-State-Pointer an mich genommen?

Nein. `docs/ACTIVE_WORK_STATUS.md` ist auf Task-Baseline `69ef27b1` zurückgesetzt — kein Viator-„aktueller Arbeitsblock“. ROADMAP hat keinen `#189`-Nächster-Schritt und keine zweite S5-B-Apply-Zeile neben der Baseline-Zeile. Nur ein nicht-autoritativer Parallel-Hinweis. Checkpoint V2 auf `origin/main` bleibt Authority und ist in diesem PR nicht vorhanden/nicht umgeschrieben.

### 2.4 Könnte ein späterer Agent Fixture als `live_api` lesen?

Contract §3 und Foundation-Proposal verbieten Mint. Es gibt in diesem Slice keinen Code, der minten könnte. Residual: ein nachlässiger Folgeslice. Deshalb STOP ohne autorisierte Foundation.

### 2.5 Habe ich Commission, Limits oder destId-Maps erfunden?

Nein. Als Unknowns `VIA-UNK-05`, `VIA-UNK-09`, `VIA-UNK-11`, `VIA-UNK-12` persistiert.

### 2.6 Traveller-Context

Affiliate-Suche braucht keine Citizenship/Dokumente. Age-Band ist Missing-Facts, kein Default-Adult. Passport-Booking-Questions bleiben außerhalb.

### 2.7 Dokumentwidersprüche verschwiegen?

Nein: P2 vs P9 Test-Host; P2 vs P8 Sprachen; Cookie-Wortlaut vs 30 Tage.

### 2.8 Beispiel-Keys als Secrets behandelt?

Nein. Nur Header-Name dokumentiert. P9-Beispiel-`pid`-Werte nicht als Jetnity-Attribution übernommen.

---

## 3. Diff-Grenze

Erwarteter Diff dieses Stamps:

- `docs/PROVIDER_VIATOR_*` Status/Handoff/Self-Review
- `docs/ACTIVE_WORK_STATUS.md` **zurück** auf `69ef27b1` (kein #189-Current-Owner)
- ROADMAP: ein nicht-autoritativer Parallel-Hinweis; keine S5-B-Widerspruchszeile; kein `#189`-Nächster-Schritt

Nicht erwartet: TypeScript, Migrationen, Provider-Runtime, `next-env.d.ts`, Checkpoint-V2-Rewrite.

---

## 4. Nicht geprüft

- Exact-Head CI/Vercel dieses Continuity-Isolation-Stamps — müssen neu gaten; Prior-Gates auf `dbfe76ce` gelten nicht
- Live-Supabase (S5-B Apply-Evidence kommt aus dem verifizierten Verification-Doc, nicht aus einem neuen Live-Check dieses Slice)
- Branch Protection (403-Risiko; nicht als verifiziert behauptet)
- Inhalt hinter Login im Viator Partner Dashboard
- reale Sandbox-Responses

---

## 5. Verdict

Der Review-Fix adressiert `5463714237` nach Author-Lesart: Viator-first/S5-B-Contract bleibt; globale Current-Pointer nicht von #189 gehalten. Das ist **kein PASS**.

**Kein Ready. Kein Merge. Kein Folgeslice.**

Unabhängiger Technical-Lead Exact-Head-**Re-Review** ist erforderlich.
