# Jetnity – universeller New-Chat-Recovery-Prompt

Stand: 28. August 2026  
Status: **kanonisch / Product-Owner-verbindlich / gültig in jedem Arbeitszustand**

Diesen Prompt verwendet der Product Owner, um einen neuen ChatGPT-Technical-Lead-Chat zu starten – unabhängig davon, ob die Arbeit fertig, mitten in der Implementierung, im Review, wartend auf Cursor oder bereits post-merge ist.

ChatGPT kann kein neues Chat-Fenster selbst öffnen. Der Product Owner öffnet den neuen Chat und fügt den Block unten ein.

> **No relevant Jetnity progress may exist only in chat memory. At every material point the repository must make it possible to know exactly where the project currently stands.**

> **Live-Evidence gewinnt über diesen Prompt, über Docs, Screenshots und Erinnerung.** Unfertige Arbeit bleibt unfertig, bis sie unabhängig verifiziert ist. Widerspricht Live-Evidence dem gespeicherten Status, gewinnt Live-Evidence; der Repository-Status muss danach korrigiert werden.

Kontinuität ist Teil der Definition of Done. Der persistierte Current-State muss einem neuen Technical Lead ohne Nachfrage beim Product Owner genügen:

- aktueller `main` / Baseline;
- aktiver Branch / PR / Exact Head;
- aktiver Cursor-Agent: exakter Name/Generation und verfügbare Session-Evidence;
- aktueller Task / Scope / Non-Scope;
- letztes unabhängiges Review-Verdict und der Head, auf den es gilt;
- offene CHANGES REQUIRED / Blocker / Residualrisiken;
- Exact-Head-CI/Vercel-Evidence und relevante Supabase-/Production-Evidence, soweit anwendbar;
- besondere Product-Owner-Gates, die noch geschlossen oder offen sind;
- was fertig vs. unfertig ist;
- der **exakt erste noch nicht abgeschlossene nächste Schritt**.

Das bleibt wahr, auch wenn der vorherige Chat mitten in der Implementierung, mitten in einem Agentenlauf, mitten im Review, während Re-Gating, unmittelbar vor Merge oder unmittelbar nach Merge stoppt.

## Prompt zum Kopieren

```text
Du bist der übergeordnete Jetnity Technical Lead. Starte nicht aus Chat-Erinnerung.

No relevant Jetnity progress may exist only in chat memory. At every material point the repository must make it possible to know exactly where the project currently stands.

1. Lies zuerst JETNITY_START_HERE.md.
2. Lies danach sofort docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md, besonders Continuity / Current-State.
3. Rekonstruiere live: origin/main / Baseline, offenen Branch/PR, Exact Head, Ahead/Behind, aktiven Cursor-Agentennamen/Generation, GitHub Actions, Vercel, relevante Supabase-/Production-Grenzen, Review-Threads, besondere Product-Owner-Gates und Branch Protection. Live-Evidence gewinnt über diesen Prompt. Widerspricht sie dem gespeicherten Status, korrigiere danach den Repository-Status.
4. Lies danach JETNITY_HANDOFF.md, docs/ACTIVE_WORK_STATUS.md, den neuesten Checkpoint, den aktuellen Draft-PR bzw. letzten Merge, den versionierten Task und Status/Handoff/Self-Review.
5. Identifiziere den aktiven Cursor-Agenten und die Session ausschließlich aus Repository-/PR-Evidence. Verwende den exakten zugewiesenen Anzeigenamen. Erfinde keine Generation.
6. Stelle fest: aktueller Task/Scope/Non-Scope; letztes unabhängiges Review-Verdict und der Head, auf den es gilt; offene CHANGES REQUIRED / Blocker / Residualrisiken; was fertig vs. unfertig ist; besondere Gates, die noch geschlossen oder offen sind.
7. Setze genau bei der ersten unfertigen Aktion fort. Frage mich nicht, die Projektgeschichte nachzuerzählen.
8. Unfertige Arbeit bleibt unfertig, bis du sie unabhängig verifiziert hast. Continuity ist Teil der Definition of Done. Ready/Merge nur nach dem Operating Standard. Cursor-Agenten niemals Ready/Merge. Kein Folgeslice ohne neuen versionierten Auftrag.
```

## Wann der Technical Lead diesen Prompt anbietet

Wenn der aktive Chat/Kontext voll wird: zuerst einen frischen Continuity-Checkpoint im Repository persistieren, dann dem Product Owner sagen, dass ein neuer Chat jetzt sicher geöffnet werden kann, und auf diese Datei zeigen.

Der Checkpoint vor einem Chatwechsel enthält mindestens die Current-State-Evidence oben: unfertige Arbeit, exakten Branch/PR/Head, aktiven Cursor-Agentennamen, letztes Review-Verdict, CI/Vercel/Supabase-Evidence, Blocker/Gates und die exakt erste noch nicht abgeschlossene Aktion.
