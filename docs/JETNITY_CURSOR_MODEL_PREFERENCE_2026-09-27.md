# Jetnity Cursor Model Preference — 2026-09-27

Product-Owner directive:

- **New Cursor agents/sessions:** use **Grok 4.7 High Fast**.
- **Do not use Auto.**
- Existing sessions already bound to a versioned task/model remain on that model for same-session CHANGES REQUIRED / re-review work.
- If Grok 4.7 High Fast is unavailable for a new slice, STOP and report rather than silently substituting another model.

This supersedes Grok 4.6 High Fast as the default for newly created Cursor sessions only. Historical evidence remains historical and must not be relabelled.
