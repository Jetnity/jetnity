# Jetnity – TW-6 Dependency / Guest-One-Trip Contract Audit – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `audit/tw6-guest-one-trip-dependency`  
Draft-PR: #75  
Baseline zum Audit-Start: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Aktueller `main` nach Sync: `8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`  
Status: **AUDIT KORRIGIERT / Klassifikation nach TL-Review angepasst / STOPP FÜR ERNEUTEN UNABHÄNGIGEN REVIEW**

Verbindlicher Auftrag: `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT_TASK.md`  
Decision Package: `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT.md`

**Kein Ready. Kein Merge. Kein TW-6-Runtime. Kein Folgeslice.**

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

---

## 1. Live

| Fakt | Wert |
| --- | --- |
| `origin/main` | `8ab4e666` – Merge PR #79 QS-2 (enthält PR #78) |
| Merge-Base | `8ab4e666` |
| Vorheriger Audit-Head | `4aeeb586` |
| Ahead / Behind nach Sync, vor diesem Persist | **4 ahead / 0 behind** (inkl. Merge) |
| Draft-PR #75 | OPEN, Draft, MERGEABLE |
| Review-Threads | 0 (TL-Kommentar im PR-Body) |

Parallele offene Drafts: #74 D0-2, #76 Traveller/Account, #77 Provider S4–S8.  
#78 und #79 sind auf `main` integriert (docs-only).

---

## 2. Ergebnis in einem Satz

Der Guest-One-Trip-**Speichervertrag ist bereits implementiert** (ADR-0042, `gastspeicher`, Tests). TW-6 braucht keinen neuen Gastspeicher.

Der fehlende **Create-Entry-Product-Owner-Schnitt** ist ein **TW6-START-GATE / PRODUCT-OWNER-DECISION**, kein aktueller Runtime-P1.

---

## 3. Current Contract (kurz)

Proven:

- Guest: genau eine aktive Reise in `jetnity:reise:v3`; zweite Anlage wirft, überschreibt nicht.
- Account: unbegrenzt über `reise_anlegen`; Create von `/planen` Formular oder Reiseidee.
- Guest→Account auf `/reisen`: additiv, idempotent über `client_ref`, erst nach Server-OK lokal streichen.
- Create erhebt keine Citizenship/keinen Pass.
- Homepage übergibt nur `zielId` (+ optional `idee`). Origin bleibt leer, kein stilles ZRH.
- `reise_anlegen` persistiert leeres Tempo als `balanced` (bestehender Default).

Missing decision (Start-Gate, kein Runtime-P1):

- Dual-Entry vs. ein Einstieg.
- Chips entfernen vs. Tempo weiter implizit persistieren.
- Gast-„Neue Reise“-CTA trotz Ablehnung.
- Progressive Multi-Destination nur im Formular.

---

## 4. Findings nach Re-Klassifikation

- **P0:** keine.
- **P1 aktuelle Runtime:** keine.
- **TW6-START-GATE-01** (früher `P1-TW6-01`): Create-Entry-PO-Schnitt fehlt → **TW6-START-GATE / PRODUCT-OWNER-DECISION**, kein aktueller Runtime-P1.
- **TW6-CONTRACT-GATE-02** (früher `P1-TW6-02`): `balanced`-Persistenz ist bestehender Create-Default → **Contract-Gate / P2 UX-Truth-Risk**, kein aktueller Runtime-P1. Persistenzänderung = eigener Trip-Create-/DB-Contract-Slice, **nicht in TW-6 verstecken**.
- **P2:** Gast-CTA-Doppelweg; Modellkosten dann Persist-Reject; UI-Chips; zwei Create-UIs.
- **P3:** Reisende-Default 2; hartes CHF; ADR-0013-Statuszeile veraltet.

Keine Shared-Contract-Änderung vorgeschlagen. Keine Runtime.

---

## 5. Product-Owner-Optionen

1. **Minimaler TW-6-Runtime** – Agent-Empfehlung, **nicht genehmigt**: Chips weg, progressive Ziele, ehrliche Gast-CTA, SQL-Default belassen und UI nicht als Nutzerwahl verkaufen. Kein Guest-Speicher-/Übernahme-Umbau. Keine `/planen`-Metadata.
2. **Einstieg vereinheitlichen:** Option 1 plus Reiseidee als Primäreinstieg.
3. **TW-6-Runtime zurückstellen:** Speicher-Gate gilt als erfüllt; UX später (TW-9/eigener Slice), solange D0-2 `/planen` berührt.

Details und Start-Gates: `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT.md`.

---

## 6. Non-Scope eingehalten

Nicht geändert:

- `/planen`, Homepage, Guest→Account, Trip Create/Ownership
- DB/Migration/RLS, Auth/MFA/Session
- Traveller-, Route-, Provider-, Payment-Verträge
- D0-2
- TW-6/TW-7/TW-8 Runtime
- `docs/ACTIVE_WORK_STATUS.md`

---

## 7. Adversarial Self-Review

- Speichervertrag bleibt als implementiert festgehalten.
- Fehlender PO-Schnitt nicht mehr als Runtime-P1 verkauft.
- `balanced`-Persistenz nicht mehr als heutiger P1 verkauft; Persistenz-Änderung als eigener Slice markiert.
- Option 1 bleibt Empfehlung, keine Genehmigung.
- Nur Audit-Docs plus Main-Sync; keine Runtime.

---

## 8. STOPP

Erneuter unabhängiger Technical-Lead-Review der Klassifikationskorrektur.

Product Owner wählt Option 1, 2 oder 3, bevor irgendein TW-6-Runtime-Slice startet.
