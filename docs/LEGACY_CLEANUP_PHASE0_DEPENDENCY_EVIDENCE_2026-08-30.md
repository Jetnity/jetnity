# Jetnity – Legacy Cleanup Phase 0: Dependency Evidence

Stand: 30. August 2026  
Status: **READ-ONLY / NO DELETE**  
Issue: #252  
Baseline: `main @ 5ee8c7017180747bb29112f1c5a2cf3419fd062d`

## 1. Repository Dependencies

Current-main code searches produced no runtime references for the old storage and MediaStudio surface names:

- `MediaStudio`
- `creator-media`
- `media-original`
- `media-renders`
- `public-media`
- `storage.from`

Legacy relational names `session_media`, `session_stories`, `session_versions` and `render_jobs` appear only in DB history/documentation, not in runtime application code.

Current `package.json` contains only the active Next/React/Supabase/UI stack. Earlier MediaStudio-era packages such as PDF/Markdown/highlight/render-specific dependencies are not present.

## 2. Current Data References

A read-only count-only scan checked likely URL-/metadata-bearing fields against all eleven legacy bucket names/path markers. No values or PII were returned.

| Field | Treffer |
| --- | ---: |
| `profiles.avatar_url` | 0 |
| `security_events.extra` | 0 |
| `security_events.metadata` | 0 |
| `trips.metadata` | 0 |
| `trip_stages.metadata` | 0 |
| `trip_days.metadata` | 0 |
| `trip_items.metadata` | 0 |
| `trip_items.booking_url` | 0 |
| `trip_items.external_ref` | 0 |

Damit gibt es im aktuellen bekannten URL-/JSON-Datenbestand keinen Beleg, dass eine V2-Entität noch auf einen dieser alten Storage-Buckets zeigt.

## 3. Database Definition References

Read-only Suche in aktuellen nicht-systemischen PostgreSQL-Definitionen auf dieselben Bucket-Namen:

- Funktionen / Prozeduren: 0 Treffer
- Views: 0 Treffer
- nicht-interne Trigger: 0 Treffer

Die Storage-Policies selbst sind hiervon getrennt und im Recovery-Baseline-Dokument versioniert; sie sind erwartete Alt-Referenzen auf die Buckets.

## 4. Interpretation

Für die zehn **leeren** Legacy-Buckets besteht jetzt ein deutlich stärkerer Delete-Safe-Nachweis:

- Object Count = 0;
- keine Current-Code-Referenz;
- keine bekannte aktuelle Datenreferenz;
- keine Function/View/Trigger-Referenz;
- verbleibende Abhängigkeit sind die explizit inventarisierten Storage-Policies bzw. Bucket-Konfigurationen selbst.

Sie bleiben in Phase 0 trotzdem nur `DELETE-SAFE-CANDIDATE`, weil eine Production-Bucket-/Policy-Entfernung ein eigener destruktiver Product-Owner-Gate ist und unmittelbar davor nochmals live gegatet werden muss.

`creator-media` bleibt unabhängig von den fehlenden Referenzen `BLOCKED-BACKUP`, weil drei nutzereigene PNG-Objekte vorhanden sind.

## 5. Nicht abgeleitete Aussagen

Dieser Nachweis behauptet ausdrücklich nicht:

- dass die drei `creator-media`-Objekte wertlos sind;
- dass öffentliche Alt-URLs nie extern geteilt wurden;
- dass historische Migrationen gelöscht werden dürfen;
- dass die Capability `inhalte-moderieren` entfernt werden darf;
- dass andere Legacy-Bereiche außerhalb Creator/MediaStudio bereits vollständig inventarisiert sind.
