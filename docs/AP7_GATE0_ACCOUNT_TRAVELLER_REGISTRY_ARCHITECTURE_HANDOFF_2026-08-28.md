# Jetnity – AP-7 Gate 0 Account-Traveller-Registry Architecture Handoff

Stand: 28. August 2026  
Status: **DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**  
Logical Cursor-Agent: **`Cursor-Agent: Account plattform audit vorbereitung 11`**  
Draft-PR: https://github.com/Jetnity/jetnity/pull/144  
Branch: `audit/ap7-account-traveller-registry-gate0-2026-08-28`

Dieser Handoff übergibt Gate-0-Architecture. Er startet keinen Folgeslice. Agent-Self-Review ist kein PASS.

---

## 1. Was dieser Agent getan hat

Read-only Rekonstruktion + Architekturvergleich für eine mögliche accountweite Traveller Registry.

Geliefert:

1. Status `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_STATUS_2026-08-28.md`
2. dieses Handoff
3. Self-Review
4. ADR-0186 – **nur** Gate-0-Empfehlungsstatus
5. minimale Continuity (`docs/ACTIVE_WORK_STATUS.md`, Zeiger in Handoff / Roadmap / Plan / Architecture)

Empfehlung: **Dual-Authority** – Account-Registry für Wiederverwendung, trip-owned Snapshot als einzige Trip-Current-Truth. Live-Referenzen und „Current Truth nach Account verschieben“ sind abgelehnt. Templates-only ist sicherer, aber kein ausreichender Endzustand für Binding Build Order §2.

Kein Runtime. Keine Migration. Keine Supabase-Mutation. Kein RLS/GRANT/REVOKE/SECURITY DEFINER. Kein Auth/AAL. Kein Ready. Kein Merge.

---

## 2. Naming

| Feld | Wert |
| --- | --- |
| Logischer Name | `Cursor-Agent: Account plattform audit vorbereitung 11` |
| Sichtbarer Cursor-Titel | `Account traveller registry architecture` |
| Evidence | https://cursor.com/agents/bc-400e9cce-e82f-48f1-860a-fb6a3a6f90e3 |
| Regel | PO-Supersession: sichtbarer Titel ist Best Effort, kein Blocker |
| Generation | 11. Keine Generation 12. |

UI wurde nicht umbenannt. Keine Rename-Fähigkeit vorhanden.

---

## 3. Git / Live-Evidence

Vor der finalen Übergabe erneut `origin/main` geholt.

| Fakt | Wert |
| --- | --- |
| Task-Baseline `origin/main` | `1947285cc4d7d6fb98c77ec60a04c96f96f3f483` |
| `origin/main` bei Handoff | nach Re-Fetch im Authoring; SHA nach Stamp im Exact-Head-Abschnitt |
| Branch | `audit/ap7-account-traveller-registry-gate0-2026-08-28` |
| Draft-PR | #144 OPEN Draft |
| Merge-Base | `1947285c` |
| Ahead / Behind vor Authoring | 3 / 0 |
| Exact Head | der Commit dieses Docs-Stamps; nach Push live am PR prüfen |
| Branch Protection | unverändert; letzte Evidence `protected=false` |
| Supabase | nicht live abgefragt, nicht mutiert |

Post-PR-#143 Task-Evidence (nicht in diesem Run neu verifiziert): Actions `33188008696` SUCCESS; Vercel Production `dpl_3mhanrnvtDgaQeApjhsx4R6BzPQE` READY.

Jeder neue Push invalidiert Prior-Gates.

---

## 4. Ist-Zustand in einem Satz

Current Traveller Truth ist trip-scoped Foundation E. Eine Account-Registry fehlt. Gate 0 empfiehlt Dual-Authority, genehmigt sie nicht.

---

## 5. Options and recommendation

- **A** Templates-only – sicher, aber keine erstklassige Personenidentität
- **B-live** Account als einzige Truth – abgelehnt (historische Reisen würden mitmutieren)
- **B/C Dual-Authority** – empfohlen
- **D** keine Registry – nur nach ausdrücklichem PO-Nein

Product Owner muss vor Runtime wählen. Technische Leads dürfen diese Empfehlung reviewen, nicht als Freigabe behandeln.

---

## 6. Unresolved risks

Siehe Status §9. Die entscheidenden: PO-Entscheidung offen; Guest-Auto-Transfer ≠ Registry-Opt-in; C2 nicht mischen; Collaboration ungeplant; Dedup kann Personen falsch mergen; AP-6b fehlt; Production-Schema nicht in diesem Run live geprüft.

---

## 7. Finished vs unfinished

Fertig: Gate-0-Rekonstruktion, Vergleich, Empfehlung, ADR-0186, Continuity-Zeiger.

Unfertig: unabhängiger TL-Review, PO-Entscheidung, jede Implementation.

---

## 8. Exact first unfinished next step

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #144.

Nicht Ready. Nicht mergen. Keinen AP-7-Implementierungsslice starten.

---

## 9. Zuerst lesen

1. `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_TASK_2026-08-28.md`
2. `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_STATUS_2026-08-28.md`
3. ADR-0186 in `DECISIONS.md`
4. `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
5. ADR-0102, ADR-0117, ADR-0120, ADR-0167, ADR-0178, ADR-0180, ADR-0181
6. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` §AP-7
7. `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md`

---

## 10. STOPP

Draft PR #144 bleibt Draft.  
Kein Mark Ready.  
Kein Merge.  
Kein Folge-Slice.

Unabhängiger Technical-Lead-Review auf dem Exact Head ist der einzige nächste Schritt.
