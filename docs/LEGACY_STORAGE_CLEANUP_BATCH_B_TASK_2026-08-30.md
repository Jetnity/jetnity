# Jetnity – Legacy Storage Cleanup Batch B

Stand: 30. August 2026  
Issue: #255  
Status: **PRODUCT-OWNER APPROVED / PRODUCTION WRITE ALLOWED ONLY WITH FAIL-CLOSED PRECHECK**

## 1. Baseline

- Repository: `Jetnity/jetnity`
- Main vor Batch: `25de0a9f374e1bf8470333281a7bc77c7aa8f905`
- Production Supabase: `qscbgcdmivbbnzrcyegn`
- Phase-0 Evidence ist auf `main` integriert.

## 2. Product-Owner-Freigabe

Der Product Owner hat Cleanup Batch B am 30.08.2026 ausdrücklich freigegeben.

## 3. Exakter Scope

Nur diese zehn Production-Storage-Buckets dürfen entfernt werden:

- `masks`
- `media-original`
- `media-proxy`
- `media-renders`
- `media-thumbs`
- `media-versions`
- `public-media`
- `renders`
- `session-versions`
- `subtitles`

Zusätzlich dürfen nur die exakt auf diese Buckets bezogenen Legacy-Policies auf `storage.objects` entfernt werden.

## 4. Hard Non-Scope

- **`creator-media` niemals verändern oder löschen.**
- keine Objekte aus `creator-media` downloaden, verschieben oder mutieren;
- keine anderen Buckets oder Policies;
- keine Auth-/Traveller-/Provider-/Payment-/Commercial-Truth-Änderungen;
- keine historische Cleanup-Migration löschen/umschreiben;
- kein direktes `DELETE FROM storage.buckets` und kein Umgehen von `storage.protect_delete()`;
- keine Development-Branch-Mutation;
- kein dauerhafter öffentlicher Ops-Endpunkt.

## 5. Fail-Closed Preflight

Unmittelbar vor dem ersten Write müssen alle zehn Kandidaten:

- existieren;
- `object_count = 0` haben;
- `bytes = 0` haben;
- dieselben Bucket-Konfigurationen wie in Phase 0 tragen;
- keine neue Code-/Data-/Function-/View-/Trigger-Referenz besitzen.

`creator-media` muss gleichzeitig unverändert bei 3 Objekten / 9,092,490 Bytes liegen. Jede materielle Abweichung => STOP.

## 6. Unterstützter Storage-Pfad

Production besitzt `storage.protect_delete()`, das direkte Bucket-Deletes mit `42501` blockiert und ausdrücklich auf die Storage API verweist. Deshalb:

- Bucket-Entfernung ausschließlich über Supabase Storage API / `storage.deleteBucket()`;
- kein `SET storage.allow_delete_query = true` als Umgehung;
- keine SQL-Manipulation von `storage.buckets`.

Wenn ein kurzlebiger serverseitiger Executor nötig ist, muss er:

1. nur die zehn hard-coded Bucket-IDs kennen;
2. den von Supabase automatisch bereitgestellten serverseitigen Secret-/Service-Role-Zugang verwenden;
3. vor Ausführung die Kandidatenliste prüfen;
4. keinerlei Request-Daten zum Scope hinzufügen können;
5. unmittelbar nach der Ausführung deaktiviert/inert gemacht werden;
6. keine Secret-Werte ausgeben oder loggen.

## 7. Policy-DDL

Policy-Entfernung muss replay-fähig in der Repository-Migrationskette gespiegelt werden. Keine unversionierte Dauerabweichung zwischen Production-History und Repository.

## 8. After-Image

PASS nur wenn:

- alle zehn Kandidaten-Buckets fehlen;
- keine Objekte dieser Bucket-IDs existieren;
- alle exakt zugehörigen Legacy-Policies fehlen;
- `creator-media` weiterhin existiert, public-Konfiguration unverändert, 3 Objekte / 9,092,490 Bytes;
- `creator-media` Policies unverändert;
- keine andere Storage-Policy/Bucket-Konfiguration verändert wurde;
- Production CI/Runtime gesund bleibt.

## 9. Rollback / Recovery

- Leere Buckets können aus dem Phase-0 Recovery-Manifest mit exakter Konfiguration neu erstellt werden.
- Policies können aus dem versionierten Before-Image bzw. Git-Revert rekonstruiert werden.
- Da die zehn Buckets leer sind, existieren keine Objektbytes, die restauriert werden müssten.
- `creator-media` ist außerhalb dieses Rollback-Vertrags, weil es nicht verändert werden darf.
