# Jetnity – Remote Branch Disposition Matrix

Stand: 28. August 2026  
Cursor-Agent: `Jetnity quality security audit 3`  
Issue: [#134](https://github.com/Jetnity/jetnity/issues/134)  
Vergleichsbasis: `origin/main` @ `eaa03ad71509d281990e0d34ca359e0750eb9591`  
Remote-Heads zum Inventurzeitpunkt: **135** inkl. `main`

> In diesem Slice wird **kein** Branch gelöscht. Löschkandidaten sind nur dann sicher, wenn Unique Commits, Unique Docs, ADRs und zukünftige Produktarbeit bereits dauerhaft erreichbar sind.

---

## 1. Klassenübersicht

| Klasse | Anzahl | Löschen in einem späteren Slice? |
| --- | --- | --- |
| ACTIVE | 2 vor diesem Branch | nein |
| MERGED-HEAD-LEFTOVER | 112 | ja, nach TL-Liste; History/PRs bleiben |
| HISTORICAL-EVIDENCE | 6 | **nein**, bis Unique Content gesichert ist |
| STALE / SUPERSEDED | 13 | ja, nach TL-Liste; meist Duplikate |
| FUTURE-WORK | 1 | **nein** |
| UNKNOWN / NEEDS REVIEW | 1 | **nein** |
| **Summe** | **135** | |

Nach Push dieses Closure-Branches: +1 ACTIVE (`cursor/project-sanitation-closure-2966`).

Beweisregeln:

- `MERGED-HEAD-LEFTOVER` = Tip ist Ancestor von `main` **oder** zugehöriger PR ist `MERGED` und Unique Files gegen `main` = 0 (typischer Squash-Rest).
- Unique File = Datei, die der Branch gegenüber seiner Merge-Base hinzufügt und die auf heutigem `main` nicht existiert.
- Alter allein ist kein Löschbeweis.

---

## 2. ACTIVE – behalten

| Branch | SHA | Ahead/Behind | Begründung |
| --- | --- | --- | --- |
| `main` | `eaa03ad71509` | 0 / 0 | Integrationsbranch |
| `cursor/ap5-s1-security-ui-8b13` | live Head von PR #133 | 7 / 0 | parallele AP-5-S1-Arbeit; nicht anfassen |

Dieser Closure-Branch kommt nach dem ersten Push hinzu.

---

## 3. FUTURE-WORK – nicht löschen

| Branch | SHA | Ahead/Behind | Unique Files | Begründung |
| --- | --- | --- | --- | --- |
| `feat/trip-collaboration-foundation` | `e0132cb576e8` | 1 / 621 | `docs/CURSOR_TRIP_COLLABORATION_FOUNDATION.md` | einzige Collaboration-Spec; Issue #20 offen |

---

## 4. HISTORICAL-EVIDENCE – nicht löschen

| Branch | SHA | PR | Ahead/Behind | Unique Files | Begründung |
| --- | --- | --- | --- | --- | --- |
| `audit/project-sanitation-inventory-2026-08-26` | `a5fbaa6d` | #88 OPEN | 2 / 197 | 2 Sanitation-Docs | Unique Inventur-Dateien; Branch/PR behalten, bis bewusst archiviert |
| `audit/account-platform` | `65b08f47` | #39 OPEN | 11 / 555 | 10 Account-Audit-Docs | Unique Evidence; Plan auf `main` ist eine andere Dateifassung |
| `audit/admin-platform` | `a3160157` | #40 OPEN | 15 / 555 | 19 Admin-Audit-Docs | Unique Plan/Matrix/Infomaniak |
| `docs/chatgpt-technical-lead-handoff-2026-08-24` | `f1e13db3` | #52 OPEN | 67 / 546 | 7 Continuity-Snapshots | Unique Aug-24-Evidence |
| `cursor/s1-merged-status-f23f` | `f5a25c94` | #50 OPEN | 3 / 549 | 0 | Branch darf nach PR-Close weg; Unique Files = 0. Als PR-Zeiger bis Close behalten |
| `docs/post-pr98-continuity-2026-08-27` | `fb6aae99` | #99 CLOSED | 2 / 111 | `docs/CHATGPT_PR98_POST_MERGE_CHECKPOINT_2026-08-27.md` | Unique Checkpoint nicht auf `main` |

`cursor/s1-merged-status-f23f` ist inhaltlich CLOSE-SAFE. Er steht hier nur, solange PR #50 offen ist.

---

## 5. UNKNOWN / NEEDS REVIEW – nicht löschen

| Branch | SHA | Ahead/Behind | Unique Files | Risiko |
| --- | --- | --- | --- | --- |
| `chore/account-admin-team-prep` | `67074279` | 23 / 555 | 9 Docs | enthält `docs/HOMEPAGE_PRODUCT_PAGE_DIRECTION.md`, `docs/ACCOUNT_ADMIN_SHARED_CONTRACT_DECISIONS.md`, `docs/NEW_CHAT_CHECKPOINT_2026-08-24.md` plus mit #39/#40 überlappende Modelle. Kein PR. Löschen würde Homepage-Richtungs- und Shared-Contract-Entwürfe verlieren. |

TL-Option später: Unique Files nach `docs/history/` kopieren, dann Branch löschen. Nicht in diesem Slice.

---

## 6. STALE / SUPERSEDED – spätere Delete-Kandidaten

Beweis: Duplikat-SHA, Closed-PR ohne Unique Files, oder Unique Files sind echte Teilmenge eines HISTORICAL-EVIDENCE-Branches.

| Branch | SHA | Proof | Unique-Verlust bei Delete? |
| --- | --- | --- | --- |
| `audit/admin-platform-sync-temp` | `e6b3e62c` | identisch mit `…-temp2`; Unique Files ⊂ PR #39/#40 | nein, sofern #40/#39 bleiben |
| `audit/admin-platform-sync-temp2` | `e6b3e62c` | Duplikat | nein |
| `docs/chatgpt-technical-lead-handoff-2026-08-24-shadow` | `216b44d9` | identisch mit beiden domain-policy-Branches; Unique ⊂ PR #52 | nein, sofern #52 bleibt |
| `docs/domain-program-completion-policy` | `216b44d9` | Duplikat | nein |
| `docs/domain-program-completion-policy-2` | `216b44d9` | Duplikat | nein |
| `do-not-use` | `9cc9b052` | identisch mit `tmp-noop`; Unique Files = 0 | nein |
| `tmp-noop` | `9cc9b052` | Duplikat; AP-1-Zwischenstand über PR #43 integriert | nein |
| `cursor/align-handoff-after-pr38-010d` | `e30fb07f` | PR #42 CLOSED; Unique Files = 0 | nein |
| `cursor/foundation-c-merged-status-f35b` | `cbd59645` | PR #33 CLOSED; Unique Files = 0 | nein |
| `cursor/record-foundation-e-merge-be45` | `05ebbb9d` | PR #36 CLOSED; Unique Files = 0 | nein |
| `cursor/seasonal-merged-status-010d` | `fddd0f44` | PR #41 CLOSED; Unique Files = 0 | nein |
| `cursor/tw7a-hub-card-identity-b13d` | `1ce6e02b` | PR #104 CLOSED; Unique Files = 0; Runtime über #106 | nein |
| `cursor/phase-1-4-datenbank-baseline-0c7c` | `79679c35` | PR #12 MERGED; Unique File `scripts/db/anwenden.mjs` ist durch `scripts/db/anwenden.ts` auf `main` superseded | nein |

`docs/post-pr97-canonical-continuity-2026-08-27` hat Unique Files = 0 und keinen offenen PR. Er ist **MERGED-HEAD-LEFTOVER / Squash-Rest**, nicht STALE mit Unique Content.

---

## 7. MERGED-HEAD-LEFTOVER – spätere Delete-Kandidaten

### 7.1 Tip ist Ancestor von `main` (80)

Unique Commits: keine. Unique Docs: keine. Evidence bleibt über `main` und den gemergten PR.

`audit/admin-d-k-growth-control` (#78), `audit/growth-discoverability-d0-g0-foundation` (#69), `audit/provider-s4-s8-provenance` (#77), `audit/qs2-quality-security-resilience` (#79), `audit/quality-security-trip-workspace-checkpoint` (#67), `audit/traveller-account-next-phase` (#76), `audit/trip-workspace` (#55), `audit/tw6-guest-one-trip-dependency` (#75), `chore/admin-reorg`, `codex/jetnity-v2-foundation`, `cursor/aal2-prod-apply-gate-b13d` (#102), `cursor/account-traveller-reconciliation-3efc` (#107), `cursor/ap4-account-archive-lifecycle-67d4` (#108), `cursor/ap4-post-merge-continuity-67d4` (#111), `cursor/ap5-gate0-auth-session-mfa-79f9` (#129), `cursor/audit-abschluss-production-cbcd` (#8), `cursor/jetnity-v2-basis-cbcd` (#1), `cursor/mobile-auth-formulare-cbcd` (#5), `cursor/mobile-responsive-pass-cbcd` (#4), `cursor/p2-ta-04-c1-integrity-hardening-6fc0` (#126), `cursor/p2-ta-06-credential-normalization-3317` (#113), `cursor/phase-0-deploy-verifikation-cbcd` (#2), `cursor/phase-1-1-alt-endpunkte-cbcd` (#3), `cursor/phase-1-1b-alt-oberflaechen-cbcd` (#6), `cursor/phase-1-2-tokens-aufraeumen-cbcd` (#9), `cursor/pr94-continuity-b13d` (#96), `cursor/tw6-gate-0b-zero-stage-provenance-b13d` (#91), `cursor/tw6-gate-b-prep-a4c4` (#89), `cursor/tw7-a-hub-card-identity-a4c4` (#106), `cursor/tw7-hub-gap-slice-b13d` (#100), `cursor/ui-responsive-audit-cbcd` (#7), `cursor/visitor-search-ux-b13d` (#94), `docs/agent-workstream-governance` (#61), `docs/ap5-gate0-canonical-pointer-closure-2026-08-28` (#131), `docs/chatgpt-pr94-post-merge-checkpoint-2026-08-27` (#95), `docs/final-chat-handoff-continuity-2026-08-28` (#115), `docs/final-continuity-handoff-2026-08-26` (#85), `docs/gate-a-production-continuity-2026-08-27` (#90), `docs/marketing-growth-standard` (#59), `docs/merge-governance-repair-2026-08-25` (#71), `docs/native-agent-technical-lead-standard` (#63), `docs/p2-ta-03-account-plan-reconciliation` (#117), `docs/p2-ta-04-traveller-write-path-gate0` (#120), `docs/post-d0-1-continuity-2026-08-25` (#72), `docs/post-tw3-continuity-2026-08-25` (#65), `docs/post-tw5-continuity-2026-08-25` (#68), `docs/pr113-post-merge-continuity-2026-08-27` (#114), `docs/pr117-post-merge-continuity-2026-08-28` (#118), `docs/pr120-post-merge-continuity-2026-08-28` (#121), `docs/pr126-post-merge-continuity-2026-08-28` (#127), `docs/pr129-post-merge-continuity-2026-08-28` (#130), `docs/pr87-postmerge-search-ux-20260827` (#93), `docs/pr91-post-merge-continuity-2026-08-27` (#92), `docs/six-agent-governance` (#62), `docs/technical-lead-autonomy-2026-08-25` (#57), `docs/tl-live-reconstruction-2026-08-27` (#97), `docs/tl-merge-autonomy-2026-08-26` (#73), `docs/ux-information-architecture-standard`, `feat/account-ap3` (#53), `feat/admin-provider-cost-board` (#49), `feat/d0-2-canonical-origin-consistency` (#74), `feat/impact-score-panel`, `feat/provider-mobility-rental-evidence-s3` (#54), `feat/provider-s5-commercial-provenance-contract` (#83), `feat/trip-workspace-tw1-shell-device-parity` (#56), `feat/trip-workspace-tw2-overview` (#58), `feat/trip-workspace-tw3-timeline` (#64), `feat/trip-workspace-tw3-timeline-prep`, `feat/trip-workspace-tw4-attention` (#60), `feat/trip-workspace-tw5-item-gap-details` (#66), `feat/tw6-create-entry-alignment` (#82), `feat/tw6-rest-progressive-stages` (#87), `fix/admin-aal2-production-alignment-2026-08-27` (#98), `fix/d0-1-index-boundary-contract` (#70), `fix/d0-1-index-boundary-contract-sync-temp`, `fix/d0-live-index-metadata-boundary-2026-08-26` (#86), `fix/p1-ta02-official-evaluation-option-scope` (#84), `fix/qs2-admin-aal2-guard` (#80), `fix/qs2-guest-account-commercial-truth` (#81), `phase-3-flights-foundation`.

### 7.2 Squash-/Rebase-Reste, Unique Files = 0, PR MERGED (32)

Tip ist nicht Ancestor, aber der Inhalt ist über den gemergten PR auf `main`. Unique Files = 0.

`audit/provider-readiness` (#45), `cursor/legacy-datenbank-entfernen-f38c` (#13), `cursor/phase-1-3-auth-rollen-cbcd` (#10), `cursor/phase-1-4c-auth-konfiguration-8050` (#14), `cursor/phase-1-5-reiseschema-c9d2` (#15), `cursor/phase-2-1-natuerliche-sprache-zu-reise-e985` (#16), `cursor/phase-22-reise-aendern-e90a` (#18), `cursor/phase-3-flights-foundation-c8a6` (#19), `cursor/supabase-mcp-dev-1f02` (#11), `docs-continuity-standard` (#25), `docs-phase-3-3-status-sync` (#26), `docs/jetnity-handoff-after-phase-2-1` (#17), `docs/phase-3-1-final-handoff` (#21), `docs/post-pr97-canonical-continuity-2026-08-27`, `docs/product-quality-standard` (#23), `feat/account-ap1` (#43), `feat/account-ap2` (#48), `feat/admin-control-center-ia` (#44), `feat/admin-system-health` (#46), `feat/mobility-transfers-foundation` (#30), `feat/provider-flight-evidence-s2` (#51), `feat/provider-ops-s1` (#47), `feat/rental-car-foundation` (#31), `feat/route-transit-intelligence` (#34), `feat/travel-readiness-foundation` (#32), `feat/travel-safety-disruption-intelligence` (#37), `feat/travel-timing-seasonal-intelligence` (#38), `feat/traveller-context-intelligence` (#35), `feat/trip-coverage-booking-status` (#29), `phase-3-2-hotel-foundation` (#22), `phase-3-3-activities-foundation` (#24), `ux-trip-workspace-mobile-iteration-1` (#27).

GitHub-PRs und Commit-SHAs bleiben nach Branch-Delete erreichbar. Remote-Reflog ist **kein** Rollback-Versprechen; Evidence hängt an PR-Refs und `main`.

---

## 8. Tags – nicht löschen

| Tag | Zweck |
| --- | --- |
| `archive/jetnity-v1-main` | bewusster V1-Archivpunkt |
| `archive/pre-1-1b-alt-ui` | Archiv vor Alt-UI-Schnitt |
| `archive/pre-1-4b-legacy-datenbank` | Archiv vor Legacy-DB-Schnitt |

Keine weiteren Tags. Kein Tag-Delete-Kandidat.

---

## 9. Sichere spätere Delete-Mengen

### Menge A – Temp-/Duplikate (13)

Alle STALE / SUPERSEDED aus Abschnitt 6.

Voraussetzung: HISTORICAL-EVIDENCE-PRs #39/#40/#52 bleiben offen oder ihre Unique Files sind archiviert.

### Menge B – Ancestor-Leftovers (80)

Abschnitt 7.1. Proof: `git merge-base --is-ancestor <tip> origin/main`.

### Menge C – Squash-Leftovers ohne Unique Files (32)

Abschnitt 7.2. Proof: zugehöriger PR `MERGED` und Unique Files = 0.

### Nicht in A/B/C

ACTIVE, FUTURE-WORK, HISTORICAL-EVIDENCE, UNKNOWN / NEEDS REVIEW, alle Tags.

---

## 10. Was Branch-Delete **nicht** darf abschneiden

- Unique Audit-Pläne auf #39/#40
- Unique Continuity-Snapshots auf #52
- Unique Collaboration-Spec auf #28
- Unique Homepage-/Shared-Contract-Entwürfe auf `chore/account-admin-team-prep`
- Unique PR-#98-Checkpoint auf `docs/post-pr98-continuity-2026-08-27`
- Archive-Tags
- aktive AP-5-S1-Arbeit

---

## 11. STOPP

Kein Branch und kein Tag wurde gelöscht.  
Technical Lead gibt eine spätere Delete-Liste erst nach Exact-Head-Review dieses PRs frei.
