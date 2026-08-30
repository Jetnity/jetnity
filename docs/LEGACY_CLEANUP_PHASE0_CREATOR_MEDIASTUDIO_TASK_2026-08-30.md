# Jetnity – Legacy Cleanup Phase 0: Creator / MediaStudio

Stand: 30. August 2026  
Status: **TECHNICAL-LEAD AUDIT / NON-DESTRUCTIVE / NO DELETE / NO PRODUCTION WRITE**  
Issue: #252  
Branch: `audit/legacy-cleanup-creator-mediastudio-2026-08-30`  
Baseline: `main @ 5ee8c7017180747bb29112f1c5a2cf3419fd062d`

> Live-Evidence gewinnt. Alter ist ein Legacy-Signal, kein Löschbeweis.

## 1. Anlass

Jetnity V2 ist produktseitig und technisch grundlegend anders als die frühere Jetnity-Version. Der frühere Creator Hub, das Media Studio sowie Session-/Blog-/Render-Strukturen gehören nicht zur heutigen Kernarchitektur. Alte Dateien, Storage-Buckets, Policies, Dokumentation und Cloud-Ressourcen dürfen deshalb nicht unbegrenzt als Altlasten bestehen bleiben.

Der Product Owner hat als praktische Heuristik festgelegt: Inhalte, die älter als vier Monate sind, sind sehr wahrscheinlich Legacy. Für diesen Audit gilt der Stichtag **30. April 2026**. Diese Heuristik erhöht die Prüftiefe, ersetzt aber niemals einen Abhängigkeitsnachweis.

## 2. Ziel

Phase 0 erstellt ein vollständiges, wiederherstellbares Inventar und klassifiziert jeden Fund als:

- `KEEP` – aktueller Jetnity-Bestandteil;
- `HISTORICAL-EVIDENCE` – nicht Runtime-relevant, aber für Architektur, Replay, Audit oder Recovery aufzubewahren;
- `DELETE-SAFE-CANDIDATE` – nach aktuellem Read-only-Nachweis wahrscheinlich entfernbar, aber noch nicht freigegeben;
- `REVIEW` – Herkunft, Abhängigkeit, Datenschutz oder Produktentscheidung nicht vollständig geklärt;
- `BLOCKED-BACKUP` – darf vor gesichertem Daten-/Object-Backup und Restore-Nachweis nicht entfernt werden.

## 3. Prüfbereiche

1. `app/`, `components/`, `lib/`, `types/`, `scripts/`, Config und Assets auf Creator-/MediaStudio-/Session-/Blog-/Render-Verwendung.
2. Aktuelle Routen und API-Endpunkte.
3. Supabase Production: Tabellen, Views, Funktionen, Typen, Policies, Storage-Buckets, Storage-Objects und Storage-Policies.
4. Historische Migrationen: aktuelle Live-Objekte von notwendiger Replay-/Audit-Historie trennen.
5. Dokumentation: Current Truth von historischer Erklärung trennen.
6. Generierte DB-Typen und Security-/Capability-Verträge.
7. Relevante Cloud- und Projekt-Referenzen nur inventarisieren; Decommission ist ein separater Gate.

## 4. Verbindliche Recovery-Regeln

Vor jeder späteren Löschung oder Production-Konfigurationsänderung müssen mindestens vorliegen:

1. exact Main SHA und exact Production Before-Image;
2. Kandidatenliste mit konkretem Abhängigkeitsnachweis;
3. bei nichtleeren Storage-/Datenressourcen: gesicherte Bytes bzw. exportierbarer Restore-Artefakt plus Metadaten/Fingerprints;
4. dokumentierter Wiederherstellungsweg;
5. keine Umschreibung/Löschung historischer Migrationen, wenn Replay oder Auditfähigkeit betroffen wäre;
6. Production-Supabase-Destruktion nur nach separatem Product-Owner-Gate;
7. je Cleanup-Batch ein After-Image plus CI/Vercel und relevante Security-/Replay-Checks;
8. bei jeder unerwarteten Abweichung: STOP, keine Cascade-/Massenlöschung.

## 5. Hard Non-Scope Phase 0

- keine Repository-Datei löschen;
- keine Supabase-Tabelle, Funktion, Policy, Rolle, Bucket oder Object ändern/löschen;
- keine Storage-Öffentlichkeit umschalten;
- keine Migration umschreiben oder löschen;
- kein Production-DDL;
- kein `develop` reset/rebase/merge;
- kein altes Supabase-Projekt pausieren/löschen;
- kein Branch-Massenlöschen;
- kein Provider/Auth/MFA/AAL/Traveller-Folgescope;
- kein Folgeslice ohne Technical-Lead-Entscheid.

## 6. Phase-0-Abschlusskriterien

- vollständiges Creator-/MediaStudio-Inventar versioniert;
- Supabase-Storage-Before-Image versioniert;
- alle nichtleeren Legacy-Ressourcen ausdrücklich blockiert, bis Backup/Restore bewiesen ist;
- historische Migrationen ausdrücklich von Delete-Kandidaten getrennt;
- vorgeschlagene Cleanup-Batches mit Risiko und Reihenfolge dokumentiert;
- keine destruktive Aktion im Audit selbst.
