# Jetnity – V1 Account Erasure 1 HANDOFF

Stand: 27. September 2026  
Status: **STOP FOR TECHNICAL-LEAD RE-REVIEW / KEIN PASS / KEIN READY / KEIN MERGE**

Binding task: `docs/V1_ACCOUNT_ERASURE_1_TASK_2026-09-27.md`  
Status: `docs/V1_ACCOUNT_ERASURE_1_STATUS_2026-09-27.md`  
Self-review: `docs/V1_ACCOUNT_ERASURE_1_SELF_REVIEW_2026-09-27.md`  
TL CHANGES REQUIRED: Kommentar `5859179668`  
Abgelehnter Head: `76e6bf9c153f94f3478cd11bcdbd26fd1794c2f0`

---

## 1. Wo die Arbeit liegt

| | |
| --- | --- |
| Issue | #588 |
| Draft PR | #590 |
| Branch | `feat/v1-account-erasure-1` |
| Base | `main@95e9da45ceeacbc8b461541f810a7c8011d2151a`, behind 0 |
| Parent vor dieser Korrektur | `efbdc7acab51fe87a630a0dd867b25ade70fde6a` |
| Review-Head | der Commit dieser Korrektur |
| Agent | Jetnity V1 account erasure 1, Generation 1 |
| Modell | Grok 4.7 High Fast (`originalModelName=grok-4.7-high-fast`) |
| Session | `bc-83c9d71e-a18d-49d5-8057-dfa34cfcaf9d` |
| Development-Projekt | Konstante `ENTWICKLUNGS_PROJEKT_REF` |
| Production-Projekt | Konstante `PRODUKTIONS_PROJEKT_REF`, in der Function geschlossen |

## 2. Was der Review zuerst prüfen sollte

1. R1 ist offen. Deploy endete mit HTTP 401. Die Function-URL antwortet 404. Der Disposable-Nachweis ist nicht gelaufen. Nichts wurde angelegt, also gibt es nichts zu säubern. Kein PASS.
2. R2: `app/account/settings/page.tsx` rendert `<KontoLoeschen />` nur, wenn `loeschUmgebungErlaubt(process.env.NEXT_PUBLIC_SUPABASE_URL)` wahr ist. Kein `headers()`, kein Anfrage-Host. Production-URL ergibt `null` als Funktions-URL. Die Function lehnt Production weiter vor jedem privilegierten Aufruf ab.
3. R3: Copy nennt nur Jetnity-Konto, Reisen, Reisende und Besuche. `teilweise_entfernt` ist die ehrliche Klasse nach einem begonnenen Remove oder nach einem Fehlschlag, der auf erfolgreiches Storage folgt. Der Auth-Nutzer wird dann nicht gelöscht.
4. Keine Migration, kein Production-Schreiben, keine globalen Kontinuitätsdateien.
5. Production-Aktivierung bleibt ein eigenes Product-Owner-Gate.

## 3. Nächster Schritt

Unabhängiges Technical-Lead-Re-Review dieses Heads. Nicht Ready. Nicht mergen.

Ein autorisierter Development-Management-Token kann danach dieselbe Function nur auf das Development-Projekt deployen (`verify_jwt` bleibt true) und `scripts/account/kontoloeschung-nachweis.ts` ausführen. Das ist kein Auftrag dieses Agenten und kein Folgeslice.
