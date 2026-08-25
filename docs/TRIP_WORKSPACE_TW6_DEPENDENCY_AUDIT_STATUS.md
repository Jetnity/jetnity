# Jetnity – TW-6 Dependency / Guest-One-Trip Contract Audit – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `audit/tw6-guest-one-trip-dependency`  
Draft-PR: #75  
Baseline: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Status: **AUDIT AUSGEFÜHRT / DECISION PACKAGE LIEGT VOR / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD-REVIEW**

Verbindlicher Auftrag: `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT_TASK.md`  
Decision Package: `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT.md`

**Kein Ready. Kein Merge. Kein TW-6-Runtime. Kein Folgeslice.**

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

---

## 1. Live

| Fakt | Wert |
| --- | --- |
| `origin/main` | `ba86279e` |
| Merge-Base | `ba86279e` |
| Ahead / Behind vor diesem Persist | **2 ahead / 0 behind** |
| Draft-PR #75 | OPEN, Draft, MERGEABLE |
| Review-Threads | 0 |
| Init-Head `27b84b2a` CI | SUCCESS `32910164551` |
| Init-Head Vercel | READY |

Parallele Drafts #74, #76–#79: kein Runtime-Overlap mit diesem docs-only Audit. D0-2 (#74) bleibt die geplante Metadata-Kollision für ein **späteres** TW-6.

---

## 2. Ergebnis in einem Satz

Der Guest-One-Trip-**Speichervertrag ist bereits implementiert** (ADR-0042, `gastspeicher`, Tests). Was für TW-6 fehlt, ist der **Product-Owner-Schnitt für den Create-Entry** (IA, Chips/`balanced`, progressive Ziele, ehrliche Gast-CTA) – nicht ein neuer Guest-Speicher.

---

## 3. Current Contract (kurz)

Proven:

- Guest: genau eine aktive Reise in `jetnity:reise:v3`; zweite Anlage wirft, überschreibt nicht.
- Account: unbegrenzt über `reise_anlegen`; Create von `/planen` Formular oder Reiseidee.
- Guest→Account auf `/reisen`: additiv, idempotent über `client_ref`, erst nach Server-OK lokal streichen.
- Create erhebt keine Citizenship/keinen Pass.
- Homepage übergibt nur `zielId` (+ optional `idee`). Origin bleibt leer, kein stilles ZRH.

Missing decision:

- Dual-Entry vs. ein Einstieg.
- Chips entfernen vs. Tempo weiter implizit persistieren (`reise_anlegen` default `balanced`).
- Gast-„Neue Reise“-CTA trotz Ablehnung.
- Progressive Multi-Destination nur im Formular.

---

## 4. Findings

- **P0:** keine.
- **P1-TW6-01:** Create-Entry-PO-Schnitt fehlt.
- **P1-TW6-02:** SQL/RPC schreibt weiterhin `balanced`, wenn Pace leer ist. Persistenz in TW-6 nicht still ändern.
- **P2:** Gast-CTA-Doppelweg; Modellkosten dann Persist-Reject; UI-Chips; zwei Create-UIs.
- **P3:** Reisende-Default 2; hartes CHF; ADR-0013-Statuszeile veraltet.

Keine Shared-Contract-Änderung vorgeschlagen. Falls Persistenz von `balanced` entfallen soll: eigener DB/`reise_anlegen`-Slice, **STOPP**.

---

## 5. Product-Owner-Optionen

1. **Minimaler TW-6-Runtime** (Agent-Empfehlung): Chips weg, progressive Ziele, ehrliche Gast-CTA, SQL-Default belassen und UI nicht als Nutzerwahl verkaufen. Kein Guest-Speicher-/Übernahme-Umbau. Keine `/planen`-Metadata.
2. **Einstieg vereinheitlichen:** Option 1 plus Reiseidee als Primäreinstieg.
3. **TW-6-Runtime zurückstellen:** Vertrag gilt als Gate erfüllt; UX später (TW-9/eigener Slice), solange D0-2 `/planen` berührt.

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

- Speichervertrag nicht als „fehlend“ verkauft.
- SQL-`balanced` nicht verschwiegen.
- Traveller-Create geprüft: kein Default-Pass.
- Parallele PRs live, Datei-Overlap geprüft.
- Jede Kernaussage ist proven, inferred oder missing decision.

---

## 8. STOPP

ChatGPT / Technical Lead reviewt das Decision Package unabhängig.

Product Owner wählt Option 1, 2 oder 3, bevor irgendein TW-6-Runtime-Slice startet.
