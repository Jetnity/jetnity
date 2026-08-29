# Provider Viator Activities Contract Audit — Agent Self-Review

Stand: 29. August 2026  
Status: **SELF-REVIEW ONLY / KEINE FREIGABE / KEIN PASS**  
Cursor-Agent: `Jetnity provider viator audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/189

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead-Review. Gates auf `39d083ba` gelten nicht für den neuen Head.

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

### 2.3 Habe ich Viator als gewählten Provider eingesetzt?

Nein. ADR-0078 / `ACTIVITIES.md` nicht umgeschrieben. Status und Contract sagen „Kandidat / nicht freigegeben“.

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

- neue Docs unter `docs/PROVIDER_VIATOR_*`
- `docs/ACTIVE_WORK_STATUS.md` aktueller Block
- knapper ROADMAP-Hinweis

Nicht erwartet: TypeScript, Migrationen, Provider-Runtime, `next-env.d.ts`.

---

## 4. Nicht geprüft

- Exact-Head CI/Vercel dieses Stamps — müssen neu gaten
- Live-Supabase
- Branch Protection (403-Risiko; nicht als verifiziert behauptet)
- Inhalt hinter Login im Viator Partner Dashboard
- reale Sandbox-Responses

---

## 5. Verdict

Der Slice erfüllt den versionierten Audit-Auftrag nach Author-Lesart. Das ist **kein PASS**.

**Kein Ready. Kein Merge. Kein Folgeslice.**

Unabhängiger Technical-Lead Exact-Head-Review ist erforderlich.
