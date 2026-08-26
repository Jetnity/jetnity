# Jetnity – P1-QS2-02 Closure: Guest→Account Commercial Truth Boundary

Stand: 26. August 2026  
Agent: `Account plattform audit vorbereitung`  
Branch: `fix/qs2-guest-account-commercial-truth`  
Baseline: `main @ 71230c280b1cd2500d224095fa84f4472101d31f`  
Typ: **enge Runtime-Closure**. Kein AP-4. Kein Traveller-Contract. Kein S5.

## Ziel

Manipulierte oder unbewiesene Stay-/Activity-Handelsfelder dürfen beim Guest→Account-Transfer nicht zu Account-Truth werden.

Lokale Gastdaten sind keine Provider-Evidence.

## Non-Scope

Keine DB-/Migration-/RLS-Änderung. Keine Auth-Änderung. Keine Traveller-Registry. Kein AP-4+. Kein Provider. Kein S5. Kein Payment. Keine TW-6-Runtime. `docs/ACTIVE_WORK_STATUS.md` nicht ändern.

Transfer/`rental_car` nur dann mitstrippen, wenn derselbe untrusted-commercial Vertrag eindeutig bewiesen ist. Sonst dokumentieren und auf diesem Subpunkt STOPP.

## Acceptance

1. Reproduktion gegen aktuellen `main` vor dem Fix.
2. Stay/Activity: `price_amount`, `price_currency`, `provider`, `external_ref`, `booking_url` nach `alsNutzlast` / Transfer null.
3. Titel, Notiz, Datum, Zeit bleiben.
4. Flug-Strip regressiert nicht.
5. Transfer-/Rental-Nutzerpreise bleiben, solange S3 User-Intake.
6. Idempotenz `client_ref`, Retry, LocalStorage erst nach Server-Erfolg.
7. Kein erfundener Provider-/Preisstatus.
8. Adversarial Tests + volle Gates.
9. STOPP. Kein Ready. Kein Merge. Kein P1-TA-02.
