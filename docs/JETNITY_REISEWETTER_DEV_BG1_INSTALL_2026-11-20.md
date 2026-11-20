# Reisewetter – tatsächliche Dev-BG1-Installation und gesicherte Nachweise

**Stand:** 20.11.2026, ausschliesslich Supabase Dev `yfvbxvijcorffwxbxahl`.
**Ergebnis:** `DEV_DATABASE_INSTALLED / GUARDS_VERIFIED`. **Nicht** gleichzusetzen mit einem echten Anbieter-/Browser-E2E; Production bleibt vollkommen unverändert.

## Was ausgeführt wurde

Die ausdrücklich als **nicht einzeln ausführbar** markierte Wetterkandidatendatei `scripts/db/reisewetter-global-1/quota-candidate.sql` blieb inhaltlich unverändert. Ihr SQL wurde in `scripts/db/reisewetter-global-1/dev-bg1-guarded-composition-20261120.sql` in eine einzelne additive, überprüfte **nur-Dev-BG1-Komposition** eingebettet. Der Text verlangt zusätzlich vor und nach Ausführung den aktuellen bestehenden `official_v3_guard_private.require_open_v1()`-Beleg. Ein anderes Projekt ohne die beiden ausdrücklich Dev-spezifischen Migrationsfingerprints verweigert diesen Lauf; keine BG1-Funktion, Baseline oder Rolle wird ersetzt.

Nach erfolgreichem read-only Source- und Dev-Vertrag-Preflight wurde ausschliesslich mit Supabase Dev eine einzelne Migration `jetnity_reisewetter_dev_bg1_guarded_composition_20261120` ausgeführt. Es wurde **keine** Migration nach Production übertragen und **kein** Website-Deployment damit verbunden.

## Unabhängig nach Installation rückgelesen

| Kontrolle | Dev-Ist |
| --- | --- |
| Wetter-RPC `public.reisewetter_reservieren_v1()` | Genau installiert, als SECURITY DEFINER, PL/pgSQL |
| Bestehender BG1-Fünfminuten-/Vollprüfungs-Guard | Im Wetter-RPC referenziert und vor/nach Installation `current` |
| Privates Ledger `jetnity_weather_private.reservations_v1` | Vorhanden, RLS **ENABLED + FORCE**, anfangs 0 Zeilen |
| `authenticated` | Nur `EXECUTE` am RPC, **kein** direkter Schema-Zugriff |
| `anon` und `service_role` | **Kein** `EXECUTE` am Wetter-RPC und keine private Ledger-Berechtigung |
| Registrierte Dev-Migration | Exakt ein Eintrag |
| Negativprobe ohne verifizierte Kundensitzung | SQLSTATE `42501`, keine Reservierung, Ledger weiter 0 |
| Globale Grenzen laut Source | 45/Minute, 1000/Tag; je Konto 10/Minute, 120/Tag; serialisierte Datenbanksperre |
| Kosten-/Provideraufruf bei Installation | **Keiner** |

Die Funktion bleibt bei fehlender/abgelaufener Sitzung, fehlender Einwilligung, veraltetem BG1-Beleg oder ausgeschöpfter Quote **fail closed**. Kein service-role-, in-memory-, unsigned-header- oder kostenausweitender Fallback.

## Betrieb, Test und Rollback

Der Dev-API-Weg `/api/reisewetter` akzeptiert auf dem isolierten Incident-Preview nun nur den exakten Branch-Origin, verlangt weiter Zustimmung und eine tatsächlich signierte, nicht anonyme Sitzung. Für eine reale OpenWeather-Prognose sind weiterhin ein zulässiger **Dev**-Provider-Key und ein erfolgreicher signierter Browseraufruf erforderlich. Beides wurde **nicht** durch die Schemainstallation vorgetäuscht. Die zuvor gezielt getestete 403-Antwort ohne Zustimmung ist der erwartete Negativpfad, kein Vorhersage-PASS.

**Rollback nur bei tatsächlichem Dev-Problem:** Keine unbedingte `DROP`-Automatik. Erst Kontrollabfrage, dass keine Ledger-Zeilen vorhanden sind und die Umgebung Dev ist. Dann in einer autorisierten Dev-Transaktion ausschliesslich den neu hinzugefügten Wetter-RPC und die private Wetter-Schemaeinheit entfernen, Eintrag in Supabase-Migrationen kontrolliert zurücksetzen. Originale Official-Truth-/BG1-Objekte niemals anfassen. Die additive Production-Migration für den KI-Reisebegleiter ist ein **anderer** bereits installierter Sachverhalt und darf nicht mit diesem Dev-Wetter-Gate vermischt werden.

**Release-Sperre:** Keine neue Website-Promotion oder BG1-Production-Installation. Später ein einziger Incident-PR nach frei werdendem Slot, vollständige Exact-Head-CI und ein echter signierter, einwilligungsgebundener Dev-Endtest.
