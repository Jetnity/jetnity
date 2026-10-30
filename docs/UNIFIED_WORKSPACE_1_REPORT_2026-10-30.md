# Unified Workspace 1 – Implementierung und lokaler Prüfbericht

**Stand: 30.10.2026, Europe/Zurich. Ergebnis: IMPLEMENTIERT, lokale Browserprüfung PASS; technische Gesamtfreigabe OFFEN.**

**Fortsetzung:** Der [Review-Nachtrag](UNIFIED_WORKSPACE_1_REVIEW_2026-10-30.md)
dokumentiert die unabhängigen Befunde auf `690c9183`, die anschliessenden
Korrekturen und den neuen lokalen Lauf um 01:56 CET (24/24 Browserprüfungen).
Die folgenden ersten Prüfergebnisse bleiben als historischer Nachweis erhalten.

Die öffentliche Startseite behält ihre Navigation und Darstellung. Planen,
Reiseauswahl, Reise und Konto verwenden einen gemeinsamen Rahmen. Es gibt keine
Live-Veröffentlichung und keine vollständige Produkt-/Merge-Freigabe.

## Geprüfter Stand

- Basis: `8e667661b490758b25bdd5be720421cea33fda9c` (main, remote erneut geprüft).
- Branch: `codex/unified-workspace-navigation`; die Commit-ID steht im PR.
- Tatsächliche Browser-URL: `http://127.0.0.1:3472`.
- Reise: `/reisen/trip-unified-workspace-audit` mit den bestehenden
  `ansicht`-/Tag-/Bereichsparametern; weitere Wege `/`, `/planen`,
  `/account/settings` und dessen bestehende Login-Weiterleitung.
- Browserlauf beendet: **30.10.2026, 00:58:37 CET**
  (`2026-10-29T23:58:37.496Z`). Lokaler Production-Build, kein Vercel-Preview.
- Frischer isolierter Chromium-Kontext über den lokal installierten
  Chrome-Browser; keine persönlichen Cookies, Profile oder Sitzungen importiert.
- Ausschliesslich künstliche Gastdaten. Drei Etappen Bangkok → Ko Chang → Phuket,
  22 Tage, keine Buchungen. Echte Gast-Speicherung im Browser; keine Ersatz-UI.
- Lokale Dummy-Konfiguration verweist auf `127.0.0.1:54999`. Keine Verbindung zu
  Supabase, keine echte Kontoanmeldung, keine Anbieter-/KI-Aufrufe.

## Ergebnis der Umsetzung

- Grüne, leicht transparente Seitenleiste mit Desktop-Klappfunktion; Namen bei
  Maus-Hover und Tastaturfokus, sichtbarer aktiver Bereich.
- Reiseplanung: Übersicht, Reiseplan, Organisieren, Vorbereitung. Mein Bereich:
  Meine Reisen, Deine Welt, Reisende, Einstellungen. Entdecken bleibt erreichbar.
- Kompakter Header mit Reisetitel und den vorhandenen Reiseaktionen. Der
  Reisebegleiter erscheint weiterhin nur dort, wo die bestehende Seite ihn
  bereitstellt. Für Gäste wird keine neue KI-Funktion vorgetäuscht.
- Die bestehende Gastschutz-CTA bleibt intakt: Eine vorhandene Gastreise zeigt
  „Reise fortsetzen“, statt sie mit „Reise planen“ still zu ersetzen.
- Kontomenü führt zu Konto, Einstellungen, Buchungen, Pro, Kontakt, Datenschutz,
  AGB, Impressum und den vorhandenen sitzungsabhängigen An-/Abmeldeaktionen.
  GeoNames-Attribution bleibt sichtbar.
- Mobile: beschriftete vierteilige Reisenavigation, separates zugängliches
  Seitenmenü. Bei stark vergrössertem Text oder kleiner nutzbarer Höhe wechselt
  die Leiste in den normalen Seitenfluss, damit sie keine Inhalte verdeckt.

Die Fachseiten werden weiterverwendet. Präsentationsportale verschieben die
originalen Navigations- und Aktionskomponenten; sie erstellen keinen zweiten
Reisezustand. Der Diff verändert weder API-Routen, Datenmodell, Auth-Handler,
Readiness-Regeln, KI-/Anbieterlogik noch Speicherverträge.

## Erhalt und tatsächliche Prüfung

| Funktion | Ergebnis / Beleg |
|---|---|
| Startseite | PASS: ursprüngliche Hauptnavigation und Footer, kein Workspace-Rahmen |
| Beide Planungswege | PASS für Darstellung/Erreichbarkeit der vollständigen Formulare und ihrer Schaltflächen. KI-Generierung und Backend-Speicherung NICHT ausgeführt |
| Jetzt wichtig | PASS: ursprüngliche Hinweise, weitere Hinweisgruppen und „Reise prüfen“ bedienbar |
| Vier Reisebereiche | PASS: Navigation, aktiver Zustand, Browser-Zurück, Deep Links und Wiederladen |
| Bestehende Gastreise | PASS: neuer Planpunkt gespeichert und nach Reload vorhanden; 3 Etappen und 22 Tage erhalten |
| Reise ändern | PASS: beide Eingabewege erreichbar; manuelle Titeländerung erst als Vorschau, Speicherung erst nach ausdrücklicher Übernahme; Daten nach Reload erhalten; Fokus kehrt zurück |
| Schutz vor Überschreiben | PASS: Header-CTA setzt Gastreise fort; Öffnen von `/planen` verändert die gespeicherte Reise nicht |
| Symbolleiste | PASS: Maus, Tastatur, Tooltip-Hover, Escape und Aktivierung |
| Mobilnavigation | PASS bei 320/390/768 px; alle vier Bereiche, kein seitlicher Seitenüberlauf |
| Desktop | PASS bei 1440 px, volle und eingeklappte Leiste |
| 200 % Text | PASS bei 320/390/1440 px mit `html { font-size: 32px }`; Icons innerhalb der Schaltflächen. Dies ist Textvergrösserung, kein nativer Browserzoom |
| Mobiles Menü | PASS: Fokus bleibt im geöffneten Menü; Escape schliesst, Fokus zurück zum Auslöser; Auswahl schliesst Menü |
| Kontomenü / Recht | PASS im Gastzustand, ursprüngliche Links und Login-Zugang erreichbar |
| Konto-Zugriffsschutz | PASS: nicht angemeldeter Zugriff auf `/account/settings` geht zur bestehenden Anmeldung mit Rücksprungziel |
| Echte Kontoreisen, Kontoschreibpfade, Logout | NICHT GEPRÜFT im Browser; Handler und Zielseiten unverändert, unabhängige authentifizierte Abnahme bleibt erforderlich |
| Anbieter, KI und Buchung | Kein Aufruf, keine Aktivierung; keine Provisions-/Verfügbarkeits-/Buchungsbehauptung |

**19/19 Browserprüfungen PASS**, keine Laufzeit-Ausnahmen und keine beobachteten
Anbieter-/KI-Requests im geprüften Lauf. Das Skript verhindert fremde Requests
zusätzlich; dies ersetzt keine allgemeine Datenschutz-/Providerabnahme.

## Technische Prüfungen und Grenzen

| Prüfung | Ergebnis |
|---|---|
| Production-Build | PASS |
| Typecheck | PASS |
| Gesamtlint | PASS, 0 Fehler, 178 vorhandene Warnungen |
| Lint geänderter Komponenten | 0 Fehler, 3 vorhandene Warnungen im bestehenden TripWorkspace |
| 7 gezielte Testdateien | 124/124 PASS: Accessibility, Security-Image-Inventar, Gast-CTA/-Speicher, Workspace-Modi/-Präferenzen/-Bedienung |
| Bestehende Route-/Detail-Browsertests, einzeln | 17/17 PASS |
| Dead-Code / Exports / Dependencies | PASS |
| API-Schutz / Schema-Bezug | PASS; keine geänderten API- oder Schema-Dateien |
| Operating-Mode-Guard | PASS gegen den exakten Basis-Commit und Implementierungs-Commit `7f6a8bd0` |
| Gesamt-Testlauf | **NICHT GRÜN:** 7’553 Tests, 7’535 PASS, 13 FAIL, 5 SKIP; siehe Einordnung unten |

Die 13 Fehlschläge dürfen nicht als erfolgreicher Gesamt-Testlauf berichtet werden:

1. **11 Datenbanktests** benötigen lokales PostgreSQL 16. Die verlangten Programme
   fehlen (`initdb ENOENT` / `local_postgresql_not_available`). Kein Hosted-Fallback
   verwendet, keine Datenbank installiert oder verändert.
2. **1 bestehender Geometrietest** (`ux-u1a2-geometry-1.test.ts`, Safe-Area-Wartebedingung
   an Zeile 494) läuft in ein Timeout. Derselbe Test wurde auf einer separaten,
   unveränderten Arbeitskopie des exakten Basis-Commits geprüft: ebenfalls
   7 PASS / 1 FAIL. Dieser Befund ist damit auf dieser Testumgebung auch ohne den
   neuen Rahmen reproduzierbar. Seine Ursache wird hier nicht als behoben erklärt.
3. **1 Browser-Testprozess** (`ux-u1b-route-detail-1/browser.test.ts`) blieb im
   Gesamtlauf mehrere Minuten ohne Abschluss und wurde gezielt beendet (SIGTERM).
   Der anschliessende isolierte Einzelaufruf schloss mit **17/17 PASS** ab.

Die Testumgebung beweist weder VoiceOver noch physische Mobilgeräte, nativen
Browserzoom oder das angemeldete Konto mit einer echten Testdatenbank. Keine
Production-Kontodaten wurden geöffnet oder verändert.

## Nachweise und Wiederholung

- [Maschinenlesbare Browserergebnisse](evidence/unified-workspace-1/results.json)
- [Desktop](evidence/unified-workspace-1/desktop-uebersicht.png)
- [Eingeklappte Leiste](evidence/unified-workspace-1/desktop-symbolleiste.png)
- [390 px](evidence/unified-workspace-1/390-uebersicht.png)
- [Mobiles Menü](evidence/unified-workspace-1/390-navigation.png)
- [320 px / 200 % Text](evidence/unified-workspace-1/320-text200.png)
- [Beide Planungswege](evidence/unified-workspace-1/desktop-planen.png)
- [Bereinigte Testzusammenfassung](evidence/unified-workspace-1/checks.txt)

Das Browser-Skript ist `scripts/unified-workspace-1/audit.mjs`, die künstlichen
Daten stehen daneben in `fixture.mjs`. Es akzeptiert ausschliesslich localhost
oder 127.0.0.1. Für Wiederholung einen lokalen Build/Server mit unproduktiver
Konfiguration starten, dann:

```sh
AUDIT_CHANNEL=chrome AUDIT_OUTPUT=/tmp/jetnity-unified-workspace-audit node scripts/unified-workspace-1/audit.mjs
```

Kein persönliches Profil und keine Zugangsdaten erforderlich. Der Lauf setzt
ausschliesslich den Gastentwurf im frischen Browserkontext.

## Übergabe / keine Freigabe

PR #1082 überschneidet sich bei der Reise-Darstellung. Der Technical Lead muss
den vorliegenden Diff-Abgleich bei jeder neuen Version aktualisieren: Beim
Review von `690c9183` und `f2ff4928` ist nur `TripWorkspace.tsx` gemeinsam betroffen;
die Implementierungshunks sind getrennt. Geteilte Navigationsgeometrie muss nach
Integration gemeinsam geprüft werden. Der [Nachtrag](UNIFIED_WORKSPACE_1_REVIEW_2026-10-30.md)
enthält Befunde und Reihenfolge.
Dieser Branch übernimmt oder verwirft keine fremden Änderungen. Die Holds der
Anbieter- und Truth-Arbeiten bleiben unberührt.

Vor Ready/Merge: unabhängige Codeprüfung, CI auf dem aktuellen Commit, geschützte
Testvorschau mit zulässiger Testkonfiguration, authentifizierte Konto-/Reisewege
und native Zoom-/Geräteprüfung. Die bisherige Vercel-/DB-Zugangsgrenze wird nicht
umgangen. Entscheidung über Merge und Livegang bleibt beim Technical Lead.
