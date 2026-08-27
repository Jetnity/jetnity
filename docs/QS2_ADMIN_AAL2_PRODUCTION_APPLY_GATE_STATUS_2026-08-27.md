# Jetnity – Admin AAL2 Production Apply Gate – Status

Stand: 27. August 2026  
Issue: #101  
Finding: `P1-AAL2-PROD-01`  
Cursor-Agent: `Jetnity quality security audit`  
Branch: `cursor/aal2-prod-apply-gate-b13d`  
Status: **AUTHOR / DRAFT / STOPP / KEIN READY / KEIN MERGE / KEIN PRODUCTION APPLY**

Task: `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_TASK_2026-08-27.md`  
Playbook: `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_PLAYBOOK_2026-08-27.md`

---

## 1. Baseline vor Implementierung

| Check | Stand |
| --- | --- |
| `origin/main` | `beaef64a151adceb8f5bc759f58ae9ad13cecc51` |
| Alignment-Datei auf `main` | ja, unverändert gelesen |
| Git-Blob | `4d24d28ff5789a253d0abc6ebd8aa0d6e22a2375` |
| SHA-256 | `ac4faa87bf994a1fcbad2212384cb2308695820b63a57dc41ee9a763515ad934` |
| `PRODUCTION_GRENZE_VERSION` | `20260820130000` unverändert |
| Production-Apply | **nicht ausgeführt** |

Zentrale TW-7-Continuity-Dateien wurden in diesem Branch nicht angefasst.

---

## 2. Umgesetzt

1. `lib/rollout/aal2-prod-apply.ts` – Datei-Pin, Auftrag, Preflight, atomare Transaktion, Verify, Fail-Path
2. `scripts/db/aal2-prod-apply.ts` – CLI; Default Probe
3. `npm run db:aal2-prod-apply`
4. Tests in `lib/rollout/aal2-prod-apply.test.ts` und Erweiterung von `lib/rollout/ci-schutz.test.ts`
5. Production-Pfad von `db:anwenden` lehnt `20260827170000` zusätzlich ab
6. Playbook-Nachtrag für den Einmal-Runner

Nicht umgesetzt und nicht erlaubt:

- Production-Apply
- Änderung der Alignment-SQL
- generisches Öffnen von `db:anwenden`
- TW-7 / AP-4 / AP-7 / TW-8 / Homepage
- Ready / Merge

---

## 3. Nächster Schritt

Unabhängiger ChatGPT/Technical-Lead Exact-Head-Review. Nach PASS darf der
Technical Lead den gegateten Einmal-Apply ausführen, sofern der Live-Preflight
weiterhin exakt passt. Dieser Autorenlauf stoppt vorher.
