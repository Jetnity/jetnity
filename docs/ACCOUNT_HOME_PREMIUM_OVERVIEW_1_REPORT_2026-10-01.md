# Account Home Premium Overview 1 — Bericht

Stand: 1. Oktober 2026
Status: **UMGESETZT / STOP FÜR TECHNICAL-LEAD CODE-, SICHT- UND INTERAKTIONSREVIEW**

Issue: #690
Draft PR: #691
Branch: `fix/account-home-premium-overview-1`
Baseline: `main@9c494110196a2877f6eba3babe7cf5ae7c00acf1`
Task: `docs/ACCOUNT_HOME_PREMIUM_OVERVIEW_1_TASK_2026-10-01.md`

Cursor-Session: https://cursor.com/agents/bc-f8898578-8665-4958-9a95-4c2d74662fdf
`originalModelName`: `grok-4.7-high-fast`
Generation: 1
Logical agent: Jetnity Account home premium overview 1

Der exakte Branch-Kopf steht im Handoff.

## Entscheidung

`/account` bleibt das persönliche Zuhause. `/account/welt` bleibt der volle Atlas aus #640.

`AccountWeltKarte` hat dafür eine Darstellung:

- `atlas` ist der Default. `AccountBesuche` ruft die Karte weiter ohne Prop auf. Länderchips, geplante Ortsliste, Legende, Marker, Gruppenauswahl, Herkunft und der Ausbruch `min(90rem, 100vw - 4rem)` bleiben.
- `uebersicht` ist nur die Kontoübersicht. Dieselbe Kartenwahrheit, dieselben Farben, Muster, Marker und dieselbe Tastatur. Keine Länderchips, keine volle Ortsliste, kein Seitenausbruch. Ein gefüllter Weg „Deine Welt öffnen“ führt nach `/account/welt`.

Die Übersicht ordnet Begrüssung, nächste Reise und den Buchungseinstieg neu. Ab `lg` stehen Reise und Buchungen nebeneinander. Der Buchungseinstieg ist eine Karte mit der bestehenden Copy, ohne Zahl, ohne Preis und ohne Partnerwahrheit. Auf dem Telefon bleibt es eine Spalte; Aktionen sind mindestens 44 px hoch und stehen nicht gequetscht neben dem Text.

Projektion, Besuchswahrheit und Reisewahrheit sind unverändert. Besucht und geplant bleiben getrennt. Ein Lesefehler bleibt von leer unterscheidbar.

## Gemessen

Produktionsserver, Chromium, Harness `/ui-audit/account`. Keine fremde Herkunft. Kein Konsolenfehler. Fokus per Tastatur erreicht einen Marker, kleinste gemessene Kante 44 px. Gewählter Marker setzt `data-world-map-kontext="ort"`.

Seitenhöhe der Übersicht gegen den vollen Atlas, Zustand `welt`, `scrollHeight`:

| Breite | Übersicht | Atlas | kürzer |
| --- | ---: | ---: | --- |
| 320×568 | 3197 | 6976 | ja |
| 360×800 | 3081 | 6808 | ja |
| 390×844 | 2989 | 6289 | ja |
| 412×915 | 2950 | 6298 | ja |
| 430×932 | 2937 | 6265 | ja |
| 768×1024 | 2846 | 4730 | ja |
| 820×1180 | 2867 | 4714 | ja |
| 1024×768 | 2173 | 4294 | ja |
| 1280×800 | 2208 | 4061 | ja |
| 1440×900 | 2208 | 4124 | ja |
| 1728×1117 | 2208 | 4150 | ja |
| 1920×1080 | 2208 | 4150 | ja |
| 844×390 | 2876 | 4704 | ja |

Auf der Übersicht ist `data-world-map-darstellung="uebersicht"`, die Länderliste fehlt, die Ortsliste fehlt. Auf dem Atlas ist die Darstellung `atlas`, die Länderliste hat im Fixture 7 Einträge, die Ortsliste ist da.

Zusätzlich grün: Zoom 125 % und 150 % bei 1440×900, Überlauf 0, kleinste Fläche 55 px bzw. 66 px. 200 % Text bei 360×800, Übersicht und Atlas: `documentElement.scrollWidth - innerWidth` ist 0, `inhaltOverflow` 0, keine Zeichenspalte, kleinste Fläche 88 px. Auf der Übersicht ist der CTA vorhanden. Normale Schrift 320–430 px: Dokumentüberlauf 0.

## Zustände

| Zustand | Pfad |
| --- | --- |
| nächste Reise, besucht und geplant | `zustand=welt` |
| leeres Konto | `zustand=leer` |
| Reisen nicht lesbar | `zustand=fehler` |
| Besuche nicht lesbar | `zustand=besuch-fehler` |
| voller Atlas | `zustand=welt&ansicht=besuche` |
| Marker und Gruppe | Klick im Zustand `welt` |

## R1 — Dokumentüberlauf

Technical-Lead R1 `5384586025` verlangte Dokumentüberlauf 0 bei 360×800 und 200 % Text, plus Integration von `origin/main`.

Gemessen am alten Kopf: die Konto-Leiste bleibt 360 px breit (`scrollWidth` 360). Ihre Einträge ragen nur innerhalb des eigenen Scrollers. `documentElement.scrollWidth` ist 366, weil das Wort „Sonderverwaltungsregion“ in der Kartenherkunft bei 32 px Schrift nicht umbricht. Dieselbe Zeile steht auf dem Atlas. Die Leiste auszublenden lässt die 6 px stehen.

Der Fix sitzt deshalb in `AccountWeltKarte`: Herkunft und der Besuchssatz nutzen `break-words`. Der Buchungshinweis auf der Übersicht ebenfalls, damit „Partnerbestätigung“ die Karte nicht aufweitet. `AccountNavigation.tsx` bleibt unverändert: einzeilige Leiste, alle fünf Beschriftungen, aktives Ziel, Auto-Scroll, mindestens 44 px, Safe Area. Kein `overflow-x: hidden` auf der Seite.

Nach dem Fix: Übersicht und Atlas bei 360×800 / 200 % Text haben Dokumentüberlauf 0.

`origin/main` `98c9099bee1715f741e4aec87c2c386e9e5344ad` ist integriert. Der Branch ist 0 hinter main. #687 und #689 bleiben erhalten.

Beobachtung ausserhalb dieses R1: bei 320×568 und 200 % Text weitet der gemeinsame Footer das Dokument noch um etwa 40 px. Die geforderte Kombination 360×800 / 200 % und die normalen Breiten 320–430 sind 0. Der Footer ist nicht in der Schreibliste.

## Grenzen der Prüfung

- Kein Real-Device-Test.
- 200 % ist `html { font-size: 200% }` in Chromium, nicht die Systemschrift eines Telefons.
- Zoom ist `documentElement.style.zoom` in Chromium.
- Fixtures nur im Audit-Harness, kein Schreibweg gegen eine Datenbank.
