# Cursor-Auftrag – PR #31 Final Ranking Truth Fix

Stand: 22. August 2026
Branch: `feat/rental-car-foundation`
PR: #31
Status: **umgesetzt und lokal nachgewiesen**; CI/Preview grün; Real-Device-iPhone **bestanden**; keine Production-Migration; kein Provider

## Ziel

Die vier ursprünglichen PR31-Truth-Fixes sind korrekt umgesetzt. Vor Real-Device-Test müssen noch vier kleine, aber fachlich wichtige Wahrheitsfehler im zukünftigen Mietwagen-Ranking geschlossen werden. Keine neue Architektur, kein Provider, keine Production-Änderung.

Verbindlich: `docs/LOGIC_STANDARD.md` – unbekannt bleibt unbekannt; keine Empfehlung, Eigenschaft oder Vergleichsaussage ohne belastbaren Nachweis.

## Befund 1 – Best Value braucht echten Vergleich

Aktuell kann `Best Value` entstehen, wenn nur **ein einziger** Kandidat einen bestätigten Gesamtpreis in einer Währung hat. Das ist kein Vergleich.

Anforderung:
- `Best Value` nur, wenn mindestens **zwei** wirklich vergleichbare bestätigte Gesamtpreise in derselben Währung vorliegen.
- Bei nur einem Gesamtpreis: kein `Best Value`.
- Bei gemischten Währungen ohne verifizierte FX-Normalisierung: kein globaler Preisvergleich/kein Cross-Currency-Sieger.
- Gleichstand beim günstigsten Preis darf nur dann `Best Value` markieren, wenn mindestens zwei Vergleichskandidaten existieren; mehrere echte Gleichgewinner sind zulässig, wenn Semantik/Doku das klar trägt.

Regressionstests ergänzen.

## Befund 2 – „Jetnity empfiehlt“ darf nicht durch Tie-Break/fehlende Evidenz entstehen

Aktuell bekommt nach dem Sortieren immer `bewertet[0]` das Label `jetnity`. Wenn alle Scores 0 sind oder mehrere Kandidaten denselben Top-Score haben, entscheidet nur die ID-Sortierung. Das ist keine fachliche Empfehlung.

Anforderung:
- Kein `Jetnity empfiehlt`, wenn keine belastbaren Ranking-Signale vorhanden sind.
- Kein `Jetnity empfiehlt`, wenn der höchste Score nur durch technischen Tie-Break (ID) gewählt würde.
- Eine Empfehlung nur bei fachlich begründbarem, eindeutigem Top-Kandidaten.
- Sortierung darf für stabile Ausgabe weiterhin deterministisch sein, aber technische Reihenfolge darf nicht als Empfehlung dargestellt werden.

Tests für alle Scores 0, Top-Score-Gleichstand und eindeutigen Top-Kandidaten.

## Befund 3 – beliebige Stornoregel ist nicht automatisch „Flexibel“

Aktuell führt jedes nicht-leere `option.storno` zu Label `flexible`. Ein Text wie „nicht stornierbar“ oder „100 % Gebühr“ wäre damit falsch als „Flexibel“ markiert.

Anforderung:
- Ohne strukturierten, belastbaren Flexibilitätsfakt kein Label `flexible`.
- In Foundation B am sichersten: `flexible` nicht aus freiem `storno: string` ableiten.
- `Stornoregel bekannt` darf als neutrale Fakt-Aussage bestehen, sofern nur gesagt wird, dass eine Regel vorhanden ist.
- Falls ein strukturierter Flexibilitätswert eingeführt werden soll, nur minimal/provider-neutral und ohne unnötige Migration; bevorzugt keine neue Persistenz in diesem Fix.

Regressionstest mit `storno='nicht stornierbar'` => niemals `Flexibel`.

## Befund 4 – vorhandene Fahrzeugdaten sind nicht automatisch „passend/gewünscht“

Aktuell erzeugt `gruendeFuer()` bei irgendeiner `vehicleClass` den Grund „Passende Fahrzeugklasse“ und bei irgendeiner `transmission` „Gewünschtes Getriebe“, obwohl kein bestätigter Match zur Nutzeranfrage vorliegen muss.

Anforderung:
- „Passende Fahrzeugklasse“ nur, wenn der entsprechende Match/Context belastbar positiv ist.
- „Gewünschtes Getriebe“ nur, wenn ein Nutzerwunsch existiert und der Match belastbar positiv ist.
- Sonst entweder neutral-faktisch formulieren (z. B. konkrete Klasse/Getriebe, wenn sicher bekannt) oder keinen Grund ausgeben.
- Kein Match aus bloßer Existenz eines Feldes ableiten.

Regressionstests für vorhandene, aber nicht als Match bestätigte Klasse/Getriebe.

## Verifikation

Nach Fix vollständig ausführen:
- `npm test`
- Typecheck
- Lint
- Hygiene (`check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`)
- Production build
- bestehende DB/RLS/Security/Auth-Prüfungen
- Trip Workspace Audit WebKit + Chromium
- Activities Regression
- GitHub CI und Vercel Preview auf exakt aktuellem Head

## Grenzen

- Keine neue Production-Migration.
- `20260821200000_trip_items_rental_car` bleibt Development-only.
- Kein Provider, keine Secrets, keine Fake-Daten.
- PR bleibt Draft.
- Nicht mergen.
- Real-Device-iPhone-Test erst nach erneutem Review dieses Fixes.

## Closeout

Im Abschlussbericht explizit nennen:
- Semantik für `Best Value`
- Semantik für `Jetnity empfiehlt`
- Semantik für `Flexibel`
- Semantik der Reasons für Fahrzeugklasse/Getriebe
- neue Regressionstests und Gesamtzahlen
- CI/Preview-Head
- Bestätigung: Production unverändert
