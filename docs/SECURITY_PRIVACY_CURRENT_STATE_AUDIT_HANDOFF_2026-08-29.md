# Jetnity – Security & Privacy Residual Inventory – Handoff

Stand: 29. August 2026  
Cursor-Agent: **`Jetnity security privacy audit 1`**  
PR: https://github.com/Jetnity/jetnity/pull/191 — **CLOSED / NON-CANONICAL**  
Baseline: `origin/main @ 69ef27b169780e41ba506a69acb15caafa645517`

## Zuerst lesen

1. Den Close-Text von PR #191 (duplicate / do not continue as canonical)
2. `docs/SECURITY_PRIVACY_CURRENT_STATE_AUDIT_TASK_2026-08-29.md`
3. `docs/SECURITY_PRIVACY_CURRENT_STATE_AUDIT_2026-08-29.md`
4. `docs/SECURITY_PRIVACY_CURRENT_STATE_AUDIT_STATUS_2026-08-29.md`
5. `docs/SECURITY_PRIVACY_CURRENT_STATE_AUDIT_SELF_REVIEW_2026-08-29.md`
6. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
7. `docs/AP6A_GATE0_LEGAL_FOUNDATION_STATUS_2026-08-29.md` und Legal-Input-Vertrag — für den einzigen verbleibenden P1
8. `docs/CHATGPT_SEARCH_PRIVACY_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-29.md` — operativer New-Chat-Checkpoint auf älterer `main`-SHA; live `main` ist weiter

## Was ein neuer Chat wissen muss

Der Technical Lead hat den breiten Current-State-Audit-PR nach Launch geschlossen, weil der Scope bereits gemergte Security-Arbeit (QS-2, Admin-AAL2, Guest→Account-Strip, AP-5, Framework-Security, AP-6a-Vertrag) wiederholt.

Dieser Agent hat den Task trotzdem residual-only ausgeführt: **keine Runtime**, Mapping **CLOSED vs. noch offen**, ein priorisierter Backlog. Das Ergebnis darf **nicht** `JETNITY_START_HERE.md` / `JETNITY_HANDOFF.md` als neue kanonische Security-Wahrheit überschreiben.

Harte Wahrheiten:

1. **Kein neues P0. Kein neues P1.**
2. **D0-P1-03** ist der einzige erneut belegte Trust-P1: Register verlangt `/privacy` und `/terms`; beide sind auf dem Production-Alias 404; unbelegte DSGVO/CH-DSG-Zeile bleibt.
3. Geschlossene QS-2/AP-5-P1s nicht erneut öffnen.
4. Production-AAL2-Datenbene: App-Guard ist Code-Wahrheit; Live-Katalog **UNKNOWN**; AUTH.md §3 ist stale.
5. Skyscanner auf `69ef27b1` ist Fixture, kein Live-Provider.
6. S5-B PR #182 ist live CLOSED / unmerged.
7. PR #191 nicht reopenen.

## Was bewusst nicht gebaut wurde

Keine Fixes, keine Header-PR, keine Legal-Pages, keine Consent-Tabelle, keine Rate-Limit-Runtime, kein OAuth-on, kein Branch-Protection-Change, kein Commercial-Provenance-Mint.

## Residuals (kurz)

- P1 D0-P1-03 Legal-404 + unbelegte Konformitätszeile
- P2 Header/Clickjacking/`ACAO *` auf prerender `/admin/login`
- P2 `main` `protected=false`
- P2 skippable Consumer-Login-MFA
- P2 OAuth-Consent/MFA vor Enablement
- P2 Export/Löschung, Consent-Persistenz, CookieConsent-Orphan
- P2 In-Memory-Provider-Limits / unlimitierte Public-Search

## Nächster Schritt

Unabhängiger Technical-Lead-Entscheid:

- Branch als non-canonical belassen / ignorieren, **oder**
- Residual-Inventory als Input für den nächsten **eng** geschnittenen Slice verwenden (wahrscheinlich AP-6a-Runtime nach Legal-Content, nicht ein zweites Cross-Cutting-Audit).

Kein Ready. Kein Merge. Kein Implementierungs-Folgeslice aus Generation 1.
