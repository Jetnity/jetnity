# Provider HBX Hotels Contract Audit — Agent Self-Review

Stand: 29. August 2026  
Status: **SELF-REVIEW ONLY / KEINE FREIGABE / KEIN PASS**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/188

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

---

## 1. Scope-Treue

| Verbot | Eingehalten? |
| --- | --- |
| Keine Runtime-Dateien | ja |
| Keine Shared-Core-Edits | ja |
| Kein Signup / Key / Secret / Call | ja |
| Kein Commercial-Provenance-Mint | ja |
| Keine Production-Mutation | ja |
| Nicht Ready / nicht mergen / kein Folgeslice | ja |
| First-party Docs als Primärquelle | ja |
| Unknowns ehrlich | ja |
| `origin/main` vor Handoff neu | ja, `69ef27b1`, behind 0 |

Task-Datei unverändert.

---

## 2. Adversarial Prüfung

### 2.1 Habe ich Destination/Geo-Suche erfunden?

Nein. Nur Hotel-Code-Availability ist first-party belegt. U1 bleibt `unknown`.

### 2.2 Habe ich `api.hotelbeds.com` als hotels-kanonisch behauptet?

Nein. Live-Host ohne mTLS ist aus Transfers-Overview zitiert und als Sibling markiert. Hotels-Getting-Started nennt nur `api.test.hotelbeds.com`.

### 2.3 Habe ich Activities-Errors als Hotels-Errors verkauft?

Nein. S14 ist als APITUDE-shared markiert. Hotels-Error-Seite 404 ist inventarisiert.

### 2.4 Habe ich Booking in den ersten Adapter geschmuggelt?

Nein. Contract und Foundation-Proposal schließen CheckRate/Booking/Voucher aus. CheckRate ist nur Nachweis-Grenze.

### 2.5 Kann eine Fixture `live_api` minten?

Vertraglich nein: kein `sourceKind`, kein Live-Constructor. Mechanische Tests existieren erst im späteren Foundation-Slice.

### 2.6 Habe ich Booking.com still ersetzt?

Nein. Strategie-Reihenfolge unverändert. HBX bleibt Backup. Booking-Produkt-Pivot explizit PO-gegatet.

### 2.7 Traveller Context

`sourceMarket` ≠ Citizenship. Kinderalter nur wenn Kinder > 0. Keine Pass-/MRZ-Sammlung für Search.

---

## 3. Evidenzlücken, die der TL sehen muss

- S16 Swagger/API-Reference nicht lesbar.
- S17 Hotels-Errors 404.
- Request-Währung und Destination-Suche unbewiesen.
- Portfolio-Zahlen widersprechen sich.
- mTLS-Pflicht vs. Evaluation-Host nicht aufgelöst.

Das ist unvollständig gegenüber einem vollständigen Vendor-SDK-Dump. Es ist vollständig gegenüber öffentlich lesbarer first-party Evidence **ohne** Signup.

---

## 4. Nicht geprüft

- Exact-Head CI/Vercel dieses Stamp-Commits
- Live-Supabase
- Branch Protection
- ob Product Owner bereits ein HBX-Konto hat
- Booking.com-Zugangsstatus

---

## 5. Verdict

Scope-treu, docs-only, Unknowns markiert, Commercial-Truth-Sperre geschrieben.

**Kein PASS. Kein Ready. Kein Merge.**
