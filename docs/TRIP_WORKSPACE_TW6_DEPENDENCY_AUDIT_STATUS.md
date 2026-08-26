# Jetnity – TW-6 Dependency / Guest-One-Trip Contract Audit – Status

Stand: 26. August 2026  
Agent: `Trip workspace audit architecture`  
Branch: `audit/tw6-guest-one-trip-dependency`  
Draft-PR: #75  
Baseline zum Audit-Start: `main @ ba86279e5ee2505bfd13801ae5e05ef50ba87c22`  
Aktueller `main` nach Sync: `8ab4e666d4963ac98b32de4b0371dfbd6eefc30f`  
Status: **AUDIT-KLASSIFIKATION KORRIGIERT / PRODUCT-OWNER-OPTION 1 GENEHMIGT / STOPP FÜR FINALEN TECHNICAL-LEAD-REVIEW**

Verbindlicher Auftrag: `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT_TASK.md`  
Decision Package: `docs/TRIP_WORKSPACE_TW6_DEPENDENCY_AUDIT.md`

**Kein Ready. Kein Merge. Kein TW-6-Runtime in diesem Audit. Kein Folgeslice.**

`docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

---

## 1. Live

| Fakt | Wert |
| --- | --- |
| `origin/main` | `8ab4e666` – enthält PR #78 und #79 |
| Merge-Base vor dieser PO-Reconciliation | `8ab4e666` |
| Re-Klassifikations-Head | `7b58a3118c4b86a49d865d33fb96aaaffed1d4fb` |
| Re-Klassifikations-CI | SUCCESS – run `32916485661` |
| Re-Klassifikations-Vercel | READY – `7i21er7BhkJVgWcJyVDx7Kh4owV6` |
| Draft-PR #75 | OPEN, Draft, MERGEABLE |
| GitHub-PR-Diff vor dieser Reconciliation | genau 3 slice-eigene Audit-Dokumente |

---

## 2. Technical-Lead-Re-Review

Die Severity-/Gate-Korrektur des Agents ist fachlich akzeptiert:

- **P0:** keine.
- **P1 aktuelle Runtime:** keine.
- `P1-TW6-01` war überklassifiziert und ist korrekt ein `TW6-START-GATE / PRODUCT-OWNER-DECISION`.
- `P1-TW6-02` war überklassifiziert und ist korrekt ein `TW6-CONTRACT-GATE / P2 UX-Truth-Risk`.
- Der Guest-One-Trip-Speichervertrag ist bereits implementiert; TW-6 braucht keinen neuen Gastspeicher.
- Eine Persistenzänderung am bestehenden `balanced`-Default wäre ein eigener Trip-Create-/DB-Contract-Slice und wird nicht in TW-6 versteckt.

---

## 3. Product-Owner-Entscheidung – verbindlich

Der Product Owner hat nach Technical-Lead-Empfehlung **Option 1 ausdrücklich genehmigt**.

Damit ist `TW6-START-GATE-01` auf Product-Decision-Ebene erfüllt.

Verbindlicher späterer TW-6-Scope:

- minimaler, eindeutiger Create-Entry;
- Guest-One-Trip-Speicher und Guest→Account bleiben unberührt;
- keine neue Gast-Speicherarchitektur;
- keine Citizenship-/Pass-Erhebung im Create;
- Gast-CTA muss ehrlich sein und bei bestehender Gastreise keinen zweiten Create suggerieren;
- Tempo-/Interessen-Chips dürfen im UI entfernt bzw. vereinfacht werden;
- der bestehende SQL-/`reise_anlegen`-Default `balanced` bleibt in TW-6 unangetastet und darf im UI nicht als ausdrückliche Nutzerwahl dargestellt werden;
- progressive weitere Ziele dürfen nur über die bestehende Trip-/Stage-Wahrheit aufgebaut werden;
- keine `/planen`-Metadata-/robots-/sitemap-/Origin-Arbeit in TW-6;
- kein dritter Create-Pfad.

**Wichtig:** Aussagen im älteren Decision-Package, wonach Option 1 „nicht genehmigt“ sei oder der Product Owner Option 1/2/3 noch wählen müsse, sind durch diese spätere ausdrückliche Product-Owner-Entscheidung **superseded** und dürfen nicht mehr als aktueller Stand gelesen werden.

---

## 4. Current Contract

Proven:

- Guest: genau eine aktive Reise in `jetnity:reise:v3`; zweite Anlage wirft und überschreibt nicht.
- Account: Reisen über `reise_anlegen`.
- Guest→Account auf `/reisen`: additiv und idempotent über `client_ref`; lokaler Entwurf erst nach Server-OK entfernen.
- Create erhebt keine Citizenship/keinen Pass.
- Homepage übergibt nur bestätigtes `zielId` plus optional `idee`; kein stilles ZRH.
- `reise_anlegen` persistiert leeres Tempo heute als `balanced`.

---

## 5. Restliche Findings

- **P2:** Gast-CTA-Doppelweg; möglicher Modellaufruf vor Guest-Slot-Reject; UI-Chips; zwei Create-UIs.
- **P3:** Reisende-Default 2; hartes CHF; ADR-0013-Statuszeile veraltet.

Keine Runtime in diesem Audit. Keine DB/Migration/RLS. Kein Auth/MFA. Keine Traveller-/Route-/Provider-/Payment-Änderung.

---

## 6. Nächster Schritt

Technical Lead führt den finalen unabhängigen Review des Audit-Pakets gegen den aktuellen Repository-Stand durch.

Vor einem späteren TW-6-Runtime-Slice gilt zusätzlich die Integrationsreihenfolge: D0-2-/`/planen`-SEO-Kollisionen zuerst sauber abschließen oder eindeutig abgrenzen.

Bis dahin:

**STOPP. Kein Ready. Kein Merge. Kein TW-6-Runtime. Kein Folgeslice durch diesen Audit-Agenten.**
