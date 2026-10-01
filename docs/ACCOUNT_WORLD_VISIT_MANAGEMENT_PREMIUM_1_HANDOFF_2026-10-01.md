# Account / Deine Welt Visit Management Premium UX 1 — Handoff

Stand: 1. Oktober 2026
Status: **STOP / DRAFT / KEIN READY / KEIN MERGE**

Issue: #692
Draft PR: #693
Branch: `fix/account-world-visit-management-premium-1`
Baseline des Tasks: `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`
Merge-Base gegen `origin/main`: `ccbec9f28df40407818ec97a0f0157bc3679f464`
Technical-Lead R1: `5385238373`
Technical-Lead R2: `5385398142`
Task: `docs/ACCOUNT_WORLD_VISIT_MANAGEMENT_PREMIUM_1_TASK_2026-10-01.md`
Bericht: `docs/ACCOUNT_WORLD_VISIT_MANAGEMENT_PREMIUM_1_REPORT_2026-10-01.md`
Self-Review: `docs/ACCOUNT_WORLD_VISIT_MANAGEMENT_PREMIUM_1_SELF_REVIEW_2026-10-01.md`
Evidenz: `docs/evidence/account-world-visit-management-premium-1/`

Cursor-Session: https://cursor.com/agents/bc-809e6d21-da18-4e7d-992f-31eff656e0c4
`originalModelName`: `grok-4.7-high-fast`
Generation: 1
Logical agent: Jetnity Account world visit management premium UX 1

Betriebsmodus beim Start: `NORMAL`. Diese Arbeit ist ein freigegebenes, begrenztes Produkt-Slice. Sie ist keine Production-, Provider- oder Launch-Freigabe.

## Exakter Kopf

Der Code, den die Gates und der visuelle Audit nach R2 gelaufen sind, ist `583c08e43f3ab73e50911f3f43cb9f9a3c0eb880`.

Die Evidenz und diese Dokumente liegen auf dem Branch-Tip. `git diff 583c08e43f3ab73e50911f3f43cb9f9a3c0eb880 HEAD -- app components lib scripts` muss leer sein.

Der Review-Kopf ist der Branch-Tip. Gegen `origin/main` ist der Branch 0 hinter main. Integriert nur durch Merge von main: #686, #689, #691, #695, #697 und #699. R2 verlangt keine weitere Codeänderung. #699 bleibt unverändert.

## Geänderte Dateien dieser Lane

- `components/account/AccountBesuche.tsx`
- `components/account/AccountBesuchFormular.tsx`
- `components/account/AccountBesuchVerwaltungDichte.tsx`
- `app/(public)/ui-audit/account/page.tsx`
- `lib/account/besuche-copy.ts`
- `lib/account/account-world-visit-management-premium-1.ts`
- `lib/account/account-world-visit-management-premium-1-fixture.ts`
- `lib/account/account-world-visit-management-premium-1.test.ts`
- `components/account/AccountWeltKarte.tsx` nur für die Atlasbreite in R1
- `lib/account/account-world-premium-map-ux-1.test.ts`
- `lib/account/account-home-premium-overview-1.test.ts` nur die gesuchte Breitenklasse
- `scripts/account-world-visit-management-premium-1-audit.mjs`
- `docs/evidence/account-world-visit-management-premium-1/`
- der Task, dieser Handoff, der Bericht, das Self-Review

Nicht angefasst: `AccountUebersicht.tsx`, `AccountAuditClient.tsx`, `AccountNavigation.tsx`, Weltkarten-Wahrheit, Projektion, Marker, Besuchspersistenz, Besuch-Aktionen, Supabase, Auth, Trip Workspace, Design-Tokens, `package.json`, `ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `DECISIONS.md`. Einstellungen und Sicherheit aus #699 sind nur durch den Merge von main da. #686, #689, #691, #695, #697 und #699 kamen nur durch den Merge von main. Die Dichte von 40 Ereignissen ist `?dichte=40` auf der bestehenden Audit-Route, nicht eine Änderung von `AccountAuditClient.tsx`.

## Prüfung

CI `36915104158` auf dem Zwischenkopf `ddc52b6c` ist an **Exporte ohne Aufrufer** rot geworden: `besuchVerwaltungSuchtext` war exportiert und hatte keinen Aufrufer ausserhalb der Datei. Die Funktion ist seit `4bb907e8` privat und wird nur von `besucheLokalFiltern` benutzt. Auth auf demselben alten Lauf war grün. Der Zwischenkopf ist nicht der Review-Kopf.

Am Arbeitsbaum, der `583c08e4` entspricht, nach Merge von `main@ccbec9f2`:

- `git diff --check`: sauber
- `npm test`: 4245 bestanden, 0 fehlgeschlagen
- `npm run typecheck`: bestanden
- `npm run lint`: 0 Fehler, 148 bestehende Warnungen
- `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, `check:schema-bezug`: bestanden. `check:exports` meldet 0 Exporte ohne Aufrufer. `check:schema-bezug` meldet weiter die schon bekannten LOCAL/UNAPPLIED-RPCs anderer Lanes und beendet sich mit Erfolg.
- `npm run build`: bestanden
- visueller Audit: 137 Messungen, 0 Befunde, leere Konsole, kein neuer Request aus Suche oder Formularöffnung. Die Höhen unten sind auf diesem Kopf erneut gemessen und unverändert.

## Gemessene Höhe

40-Ereignis-Fixture, Produktionsserver, Zustand Ruhe. Vorher ist die alte Kartenwand mit demselben Dichte-Harness. Nachher ist dieser Kopf nach dem Merge von #691.

| Breite | Vorher Höhe | Nachher Höhe | Karten vorher | Karten nachher | Formular offen, Abstand Überschrift |
| --- | ---: | ---: | ---: | ---: | ---: |
| 390×844 | 11618 | 5052 | 40 | 12 | 152 px |
| 768×1024 | 7120 | 3656 | 40 | 12 | 128 px |
| 1440×900 | 6840 | 3046 | 40 | 12 | 128 px |
| 1920×1080 | 6830 | 3036 | 40 | 12 | 128 px |

Vorher lag das Formular 8176 px (390) bzw. 4164 px (768/1440/1920) unter „Bestätigte Besuche“. „Besuch hinzufügen“ steht in der ersten Ansicht, Höhe 44 px.

## R1-F1

Die volle Atlasbreite bleibt `min(90rem, Dokumentbreite − 4rem)`, zentriert, nur ab `lg`, nur für `darstellung="atlas"`. Die Breite kommt aus `100cqw`, nicht aus einer Viewport-Einheit. Der Container ist das Dokument, und nur solange der Atlas im Baum steht. Kein `overflow-x: hidden`. Projektion, Marker, Wahrheit, Auswahl und Tastatur sind unverändert.

Auf `583c08e4`, nach #699, 1440×900, CSS-Zoom: 1,25 und 1,5 haben `scrollWidth` 1440 und `clientWidth` 1440. 200 % Text bei 360×800 hat Dokumentüberlauf 0. Die normalen Breiten 320 bis 1920 haben Dokumentüberlauf 0 und weiter 12 Karten. Die Seitenhöhen der Verwaltung sind unverändert. 137 Messungen, 0 Befunde.

## Nächster Schritt

Finales unabhängiges Technical-Lead-Review am exakten Branch-Kopf. Cursor setzt nicht Ready und mergt nicht. Kein Folge-Slice aus diesem Lauf.
