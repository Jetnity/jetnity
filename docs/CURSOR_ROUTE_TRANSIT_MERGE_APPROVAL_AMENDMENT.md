# Foundation D – verbindlicher Merge-Approval-Nachtrag

Stand: 22. August 2026  
Status: **verbindlich; überschreibt jede ältere Annahme zu automatischem Abschluss/Merge**

Für PR #34 / `feat/route-transit-intelligence` gilt:

1. PR bleibt während Implementierung, Tests, CI, Preview und Human-/Architecture-Review **Draft**.
2. Cursor darf den PR **nicht mergen** und darf einen technischen Abschluss nicht als Product-Owner-Abnahme behandeln.
3. Nach technischem Abschluss prüft ChatGPT unabhängig und erklärt dem Product Owner den realen Nutzer-/UX-/Architekturstand.
4. Der Product Owner erhält ausdrücklich Gelegenheit, Änderungen oder Ergänzungen zu verlangen.
5. Bei Änderungswünschen wird nicht gemergt; Änderungen werden umgesetzt, erneut getestet und reviewt.
6. **Erst eine eindeutige aktuelle Freigabe des Product Owners für PR #34 erlaubt den Merge.**
7. Merge-Freigabe bedeutet nicht automatisch Production-Migration, Provider-Aktivierung, Secrets, Verträge oder neue Kosten.

Globale Source of Truth auf `main`: `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md` und `docs/CHATGPT_CURSOR_WORKFLOW.md`.

Merksatz:

> **Technisch fertig bedeutet review-bereit. Gemergt wird erst nach ausdrücklicher Freigabe des Product Owners.**
