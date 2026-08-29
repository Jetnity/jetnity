# Provider HBX Hotels Contract Audit — Agent Self-Review

Stand: 29. August 2026  
Status: **SELF-REVIEW ONLY / REVIEW-FIX FÜR 5464070835 / KEINE FREIGABE / KEIN PASS**  
Cursor-Agent: `Jetnity provider hbx audit 1`  
PR: https://github.com/Jetnity/jetnity/pull/188

Ein Agenten-Self-Review ersetzt keinen unabhängigen Technical-Lead-Review.

---

## 1. Scope-Treue

| Verbot | Eingehalten? |
| --- | --- |
| Keine Runtime-Dateien | ja |
| Keine Shared-Core-Edits | ja; ADR-0199 nur gelesen/referenziert |
| Kein Signup / Key / Secret / Zertifikat / Call | ja |
| Kein Commercial-Provenance-Mint | ja |
| Keine Production-Mutation | ja |
| Nicht Ready / nicht mergen / kein Folgeslice | ja |
| Isolation globaler Current-State-Dateien | ja |
| `origin/main` gemergt, nicht rebased | ja, `085c95b2` |

Task-Datei unverändert.

---

## 2. Adversarial Prüfung

### 2.1 Habe ich Booking.com zum ersten Hotelweg gemacht?

Nein. §21 und Foundation-Deps 2/4: HBX bleibt erstes konkretes Adapter-Ziel. B1 ist späterer-Adapter-Evidence.

### 2.2 Habe ich einen zweiten Transport-Core vorgeschlagen?

Nein. Offline-Foundation gegen `HotelProvider`. HTTP später nur über `lib/server/providers/core/*`.

### 2.3 Kann Availability still non-mTLS nutzen?

Vertraglich nein, sobald mTLS erforderlich ist. Evaluation ohne Auflösung bleibt `unknown` und fail-closed.

### 2.4 Erbt HBX-500 Shared-Core-Retry?

Vertraglich nein: `retry5xx=false` für Booking-API-Ops. Booking selbst bleibt außerhalb der Foundation.

### 2.5 Wird der Display-Preis aus Feldpräsenz gemintet?

Nein. Modell `unknown` bis kommerzielle Evidence. `net` ohne erlaubte Regel kein Consumer-Preis.

### 2.6 Wird Breakfast aus BB/HB/FB/AI geraten?

Nein. Boards-Katalog oder first-party-verifizierte Mapping-Evidence; sonst `null`.

### 2.7 Isolation / Traveller

`HOTEL_PROVIDER_STRATEGY.md` unverändert. `sourceMarket` ≠ Citizenship. Pricing-Modell nicht aus Traveller-Fakten.

---

## 3. Evidenzlücken

- S16 Swagger unlesbar; S17 404.
- U4 Evaluation vs mTLS.
- U13 Pricing-Modell unbelegt.
- Destination-Suche und Request-Währung unbewiesen.

---

## 4. Nicht geprüft

- Exact-Head GitHub Actions / Vercel dieses Heads — nach Push live lesen
- Live-Supabase
- Branch Protection
- ob Product Owner ein HBX-Konto hat

---

## 5. Verdict

Docs-only, isolated, `main` gemergt, `5464070835` in den HBX-Docs adressiert.

**Kein PASS. Kein Ready. Kein Merge.**
