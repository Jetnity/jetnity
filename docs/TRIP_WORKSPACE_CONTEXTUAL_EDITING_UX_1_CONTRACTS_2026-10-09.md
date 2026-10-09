# Contextual Editing UX 1 — preserved contracts

The binding #905 contracts, including A09 v1.1 and prospective temporal-conflict wording, remain unchanged. The UI uses the exact existing `manuellerEntwurf`, `manuellVorschau`, `manuelleAenderungVorschau`, `gastManuellSpeichern` and `manuelleAenderungUebernehmen` functions. No new field, operation, serialization or mutation identity is introduced.

The shell holds only dialog/focus/scroll presentation state. The editor holds its existing draft/base revision/generation; progressive groups do not clear inputs. Unsaved title/dates never replace stored summary facts. Preview/back/cancel never write. Confirmation stays explicit; success is based on the independently read graph returned by the existing boundary. The Account wrapper installs that graph before router refresh.

Pending/uncertain state prevents close, Escape, editing and mode switch. Native modality prevents background focus/actions. Closing an ordinary session discards it, as #905 already does. Back from preview invalidates acceptance and retains input. Retrying an uncertain outcome reuses the existing request and mutation identity; read-only verification stays distinct from retry. Stale input stays visible and cannot save.

Ground truth remains the current Trip and all existing booking/locked dates, routes/places, Preparation references, Guest identity and Account/RLS contracts. Direct editing never activates a model, quota, place catalog or provider. Free-text remains explicit and proposal-only.
