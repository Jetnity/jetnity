# Jetnity – P2-TA-06 Author Self-Review

Stand: 27. August 2026  
Agent: `Account plattform audit vorbereitung 4`  
Typ: **adversarial Self-Review, kein unabhängiger Technical-Lead-PASS**

## 1. Auftrag gegen Diff

Issue #112 verlangt das Entfernen des First-Document-Fallbacks in `travellerNormalisieren`. Der Diff ändert genau diese Normalisierung plus Tests und Continuity. Keine Account-UI, keine Search, keine Homepage, keine Registry.

## 2. Adversarial Fragen

1. Habe ich einen Default-Pass eingeführt? Nein. N Dokumente → N Optionen.
2. Bleiben explizite Options autoritativ? Ja. Nicht-leere `credentialOptions` werden unverändert durchgereicht.
3. Wird Issuer als Citizenship behandelt? Nein. `relatedCitizenshipCountryCode` kommt nur aus `document.citizenshipCountryCode`.
4. Wird `:none` erfunden, obwohl ein Legacy-Dokument existiert? Nein. Legacy-Singular bleibt eine Kompatibilitätsoption.
5. Wird ein zweites Dokument bei gleicher `clientRef` verworfen? Nein. Deterministischer `#n`-Suffix.
6. Wird Official-Truth erfunden? Nein. Ohne Provider bleibt `unknown`.
7. Habe ich AP-7 / AP-5 / #109 / #110 mitgezogen? Nein.
8. Shared-Contract-Konflikt? Nein. Der Port hatte `credentialOptions[]` bereits.

## 3. Residuals, bewusst nicht in diesem Slice

- P2-TA-01 progressive Official-UI pro Option
- P2-TA-02 Fixture-Hygiene
- P2-TA-03 Implementation-Plan nur historisch in PR #39
- P2-TA-04 direkte Child-Writes
- P2-TA-05 Safety nur citizenship-set-scharf
- AP-7 bleibt gated
- `officialFingerprint` kann bei fehlendem `documents[]` weiterhin Singularfelder für den Fingerprint lesen; das ist kein Product-Truth-Default-Pass und nicht Teil von Issue #112

## 4. STOPP

Kein Ready. Kein Merge. Unabhängiger Technical Lead reviewt Exact Head.
