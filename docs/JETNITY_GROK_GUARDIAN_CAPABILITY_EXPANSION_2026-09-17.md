# Jetnity – Grok / Guardian Capability Expansion

Stand: 17. September 2026  
Status: **PRODUCT-OWNER-APPROVED / DOCS-GOVERNANCE ONLY / NO RUNTIME OR PRODUCTION EFFECT**

## 1. Product-Owner-Entscheidung

Der Product Owner hat verbindlich entschieden, dass der Jetnity Guardian / Grok Bot künftig nicht nur als Release-/QA-/Continuity-Evidence-Layer eingesetzt wird, sondern systematisch als unabhängige Gegeninstanz mit maximalem Nutzen für Jetnity.

Der kanonische Vertrag ist:

`docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`

Die dort definierte Rolle gilt chatübergreifend und muss vom Product Owner in neuen Chats nicht erneut erklärt werden.

## 2. Verbindlich erweiterte Einsatzgebiete

Der Guardian soll – abhängig vom Scope und den verfügbaren read-only Systemen – eingesetzt werden als:

- Adversarial QA;
- Architecture Challenger;
- Product Challenger;
- Release Guardian;
- Regression Hunter;
- Continuity Auditor;
- Security & Privacy Red Team;
- Performance / Accessibility / UX Watch;
- Cost Guardian;
- Product Opportunity Radar;
- Whole-Jetnity Audit Layer nach größeren Meilensteinen oder auf Auftrag.

Der Guardian darf ausdrücklich nicht nur Cursor-Arbeit challengen, sondern auch Annahmen des Technical Lead hinterfragen.

## 3. Gewaltenteilung

Die verbindliche Rollenformel lautet:

> **Cursor baut. Grok/Guardian challengt und verifiziert. ChatGPT / Technical Lead entscheidet und integriert. Product Owner entscheidet besondere Produkt-/Business-/Production-Gates.**

Guardian-Findings sind Evidence, Risks, Opportunities und Recommendations. Sie sind kein Technical-Lead-PASS und keine autonome Produktentscheidung.

## 4. Harte Grenzen bleiben bestehen

Diese Erweiterung gibt Grok/Guardian **keine** autonome Autorität für:

- Ready;
- Merge;
- Production Deploy;
- Production-Supabase-Mutation;
- Secrets;
- Provider-Aktivierung;
- paid calls;
- Käufe oder Budgeterhöhung;
- Payments;
- Verträge/Terms/DPA;
- Public Launch / Indexing / Domain Cutover;
- autonome Branches/PRs/Agenten/Folgeslices;
- autonome Code- oder Produktänderungen.

Observer-first und least privilege bleiben bindend. Read-only Zugriff auf zusätzliche Systeme ist nur scope-bezogen und nach Technical-Lead-/Product-Owner-Aktivierung zulässig.

## 5. Continuity für alle zukünftigen Chats

`JETNITY_START_HERE.md` führt `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md` bereits als Pflichtlektüre für jeden neuen Technical Lead und Guardian-Lauf.

Dadurch gilt nach Integration dieser Erweiterung automatisch für jeden neuen Chat:

1. Guardian-Standard vollständig lesen;
2. erweiterte Rolle ohne erneute Product-Owner-Erinnerung übernehmen;
3. bei materiellen Handoffs und risikoreichen Gates sinnvollen Guardian-Einsatz prüfen;
4. bei großen Meilensteinen Whole-Jetnity-Audit erwägen;
5. proaktive Risiken und Chancen zulassen, aber nie autonome Folgearbeit;
6. Guardian-Evidence unabhängig durch den Technical Lead prüfen.

## 6. Scope dieses Governance-Slices

Dieser Slice ändert ausschließlich Dokumentation/Governance.

Er ändert nicht:

- Runtime-Code;
- DB/RLS/Auth;
- Supabase;
- Vercel;
- Provider;
- Secrets;
- Kosten;
- Production;
- den aktiven Assistant Runtime 1 PR #435.

Branch: `docs/grok-guardian-capability-expansion-2026-09-17`

Baseline bei Erstellung: `main@aa6afaa6057f631ffb332e6feeda32a45c52fa47`

Kein Merge ohne die für Jetnity geltende Product-Owner-Freigabe.
