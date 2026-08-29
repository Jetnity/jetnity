# ADR-0201 – Account Traveller Registry Persistence / Identity / RLS

**Datum:** 29. August 2026  
**Status:** Product-Owner-freigegeben / AP-7-S2 Implementierung

## Entscheidung

Jetnity persistiert die bereits freigegebene Dual-Authority Account Traveller Registry in drei additiven, account-owned Tabellen:

- `account_travellers`
- `account_traveller_citizenships`
- `account_traveller_documents`

Die Registry ist wiederverwendbare aktuelle Account-Identität/Fakten. Trip-Snapshots bleiben die einzige Current Truth einer konkreten Reise und erhalten weiterhin eigene Identitäten. AP-7-S2 erzeugt keinen Live-Link zwischen beiden Wahrheiten.

## Ownership / RLS

- Parent gehört direkt `auth.users(id)` und wird bei Account-Löschung kaskadiert entfernt.
- Children tragen `user_id` und sind über Composite-FKs an denselben Parent-Owner gebunden.
- Document→Citizenship darf nur dieselbe Registry-Person und denselben Owner referenzieren.
- RLS ist auf allen Tabellen owner-only (`user_id = auth.uid()`).
- `authenticated` erhält CRUD ausschließlich unter RLS; `anon` erhält keine Tabellenprivilegien.
- Kein Admin-/Support-Bypass, kein `SECURITY DEFINER`, kein neuer Service-Role-Produktpfad.

## Datenmodell

- UUID für DB-Identity und `client_ref`.
- Maximal 8 Citizenships und 12 Documents je Registry-Traveller; concurrency-safe Parent-Lock und INSERT/UPDATE/Reparenting-Trigger.
- Kein unbegründetes accountweites 20-Personen-Limit; 20 bleibt eine trip-spezifische Party-Grenze.
- Dokumente speichern nur Typ, Issuer, Ablaufdatum und optionale explizite Citizenship-Relation.
- Keine Nummern, Scans, MRZ, Biometrie, DOB oder Health-Daten.
- Issuer ist niemals implizit Citizenship.

## Alternativen

- Trip-scoped-only/Templates: verworfen als Endzustand, weil accountweite Wiederverwendung fehlt.
- Live-Registry als einzige Wahrheit: verworfen, weil historische Trips nachträglich mutieren würden.
- Admin-/service-role-zentrierter Write-Pfad: für S2 verworfen; unnötige Privilegien und größere Angriffsfläche.

## Konsequenzen

- AP-7-S2 liefert nur sichere Persistenzgrundlage; noch keine Nutzer-UI und keinen Registry→Trip-Write.
- Guest→Account bleibt trip-scoped; Registry-Import bleibt expliziter späterer Opt-in-Slice.
- Spätere Clients nutzen dieselbe Registry-/Snapshot-Semantik; keine Native-Sonderwahrheit.
- Jede spätere Ausweitung auf sensitive Dokumentpayloads oder andere Ownership-/RLS-Semantik benötigt ein eigenes besonderes Gate.
