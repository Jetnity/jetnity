# Jetnity – Homepage Product-Page Direction

Stand: 24. August 2026  
Status: **Produktidee gespeichert – noch keine Implementierungsfreigabe**

## Ziel

Die öffentliche Jetnity-Startseite soll Jetnity hochprofessionell präsentieren, sodass ein neuer Besucher innerhalb weniger Sekunden versteht:

- was Jetnity ist,
- welchen konkreten Nutzen Jetnity bietet,
- warum Jetnity die Reise einfacher und übersichtlicher macht,
- warum Jetnity als zentrale Reiseplattform relevant ist.

Die Startseite ist in diesem Workstream primär eine **hochwertige Produkt-/Marketingseite** und kein zusätzliches Funktionsportal.

## Visuelle Richtung

Die neue Richtung soll eher wie die Produktseite eines modernen Tech-Unternehmens wirken als wie ein klassisches überladenes Reiseportal.

Verbindliche Gestaltungsprinzipien:

- große, hochwertige Reisebilder,
- viel Weißraum,
- moderne, hochwertige Typografie,
- präzise und kurze Texte,
- klare visuelle Hierarchie,
- ruhige, hochwertige Animationen und Übergänge,
- Premium-/Tech-Produktwirkung mit emotionalem Reisebezug,
- keine unnötige Informationsdichte,
- Jetnity soll als zusammenhängendes Produkt erklärt werden, nicht als Sammlung isolierter Features.

## Bestehende Inhalte

Die aktuelle Startseite enthält bereits starke Texte und Aussagen. Diese sollen **nicht pauschal verworfen** werden. Gute bestehende Copy darf übernommen, gekürzt, geschärft oder in einer hochwertigeren visuellen Dramaturgie neu angeordnet werden.

Beispiele für die gewünschte inhaltliche Richtung:

- „Deine ganze Reise. Einfach an einem Ort.“
- „Eine Reise. Ein intelligenter Begleiter.“
- „Nicht mehr Apps. Weniger Reisestress.“
- die Idee eines zentralen Reise-Cockpits,
- Entdecken → Planen → Reisen als verständliche Produktgeschichte,
- Jetnity begleitet die gesamte Reise und nicht nur einen einzelnen Buchungs- oder Planungsschritt.

Die finalen Texte werden erst im späteren Design-/Copy-Review festgelegt.

## Funktions-Scope

Für diese Homepage-Idee werden **keine neuen Produktfunktionen** gebaut.

Insbesondere gilt:

- Header-Funktionalität bleibt unverändert.
- Footer-Funktionalität bleibt unverändert.
- Navigation, Auth, Account, Admin, Trip-/Route-Truth, Seasonal, Datenbank, APIs und gemeinsame Contracts werden nicht verändert.
- Header und Footer dürfen später visuell behutsam an die neue Präsentation angepasst werden, ihre Funktion und Verträge bleiben in diesem Workstream unangetastet.
- Neue Homepage-Sektionen sollen nach Möglichkeit lokal gekapselt sein und keine breit wirkenden globalen Style-Änderungen erzwingen.

## Vorgehen vor einer echten Umstellung

Die bestehende Startseite wird **nicht sofort ersetzt**.

Verbindlicher Ablauf:

1. Eine neue visuelle Homepage-Idee wird isoliert als Preview/Variante erstellt.
2. Product Owner sieht und beurteilt die neue Idee zuerst visuell.
3. Bestehende starke Texte und neue Varianten werden gemeinsam verglichen.
4. Erst nach ausdrücklicher Product-Owner-Freigabe darf die neue Richtung die bestehende Homepage ersetzen.

## Multi-Agent / Konfliktgrenzen

Dieser Workstream eignet sich grundsätzlich als eigener paralleler Agenten-Workstream, weil er bei sauberem Scope konfliktarm ist.

Ein zukünftiger Homepage-Agent darf:

- Homepage-Layout und visuelle Sections entwickeln,
- Präsentationskomponenten erstellen,
- Bilder, Typografie, Weißraum und Animationen gestalten,
- Copy-Varianten für die Produktpräsentation vorbereiten,
- eine isolierte Vercel-Preview bzw. Preview-Route/Variante erstellen, sofern dies ohne Shared-Contract-Änderungen möglich ist.

Er darf nicht:

- Account- oder Admin-Code verändern,
- PR #38 / Seasonal-Truth verändern,
- Auth/RLS/Supabase-Verträge verändern,
- DB-Migrationen erstellen,
- Header-/Footer-Logik oder Navigationsverträge verändern,
- Backend- oder Provider-Logik ergänzen,
- globale Designsystem-Änderungen vornehmen, die andere aktive Workstreams unbeabsichtigt beeinflussen.

## Governance

- Diese Datei speichert nur die Produkt-/Designrichtung.
- Aktuell besteht **keine Implementierungsfreigabe** für den Homepage-Agenten.
- Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.
- Eine spätere Umsetzung wird vor Beginn nochmals gegen die dann aktiven PRs/Branches auf Konfliktpotenzial geprüft.
