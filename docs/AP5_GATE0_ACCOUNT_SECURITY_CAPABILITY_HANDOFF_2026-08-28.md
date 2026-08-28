# Jetnity – AP-5 Gate 0 – Handoff

Stand: 28. August 2026  
Status: **AUTHOR COMPLETE / DRAFT / STOPP / KEINE AP-5-RUNTIME**  
Cursor-Agent: **`Account plattform audit vorbereitung 8`**  
Issue: [#128](https://github.com/Jetnity/jetnity/issues/128)  
PR: https://github.com/Jetnity/jetnity/pull/129

## Zuerst lesen

1. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_TASK_2026-08-28.md`
2. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`
3. `docs/AP5_GATE0_LOCAL_TEST_EVIDENCE_2026-08-28.md`
4. ADR-0182 in `DECISIONS.md`
4. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md` Abschnitt AP-5
5. `docs/AUTH.md`
6. `docs/CHATGPT_PR126_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md` – C1 ist integriert, nicht neu bauen

## Was ein neuer Chat wissen muss

AP-5 Gate 0 rekonstruiert den **bestehenden** Vertrag. Es startet keine Runtime.

Drei harte Wahrheiten:

1. Passwortänderung = Reauthentication + `updateUser({ password })`. Kein Current-Password-Submit.
2. Heutiges „Abmelden“ ist bereits `signOut()`-Default **`global`**.
3. Eine Session-/Geräteliste ist mit dem installierten User-Client **unsupported**.

C1 / PR #126 / Issue #122 ist abgeschlossen. C2 ist nicht gestartet.

## Was gebaut wurde

Nur Docs, ADR-0182, Continuity-Zeiger und ein statischer Inventory-Test. Keine Auth-Config, keine Migration, kein Runtime.

## Was bewusst nicht gebaut wurde

In-Account-Passwort-UI, Sessionliste, Logout-others-Buttons, MFA-Step-up-Runtime, Consumer-AAL2, Passkey/OAuth live, C2, AP-6/AP-7.

## Shared Contract

Kein neuer Auth-Vertrag. ADR-0182 stellt nur fest, welcher Vertrag schon gilt und welche Folgeslices ihn nicht verlassen dürfen.

## Residuals

- D0-P1-03 Legal-404
- C2 PO-gated
- Production-Redirect-Origin offen
- Login-MFA abbrechbar (AAL1-Sitzung bleibt)
- `main` Branch Protection `protected=false`
- Exact-Head vor Stamp: `5fff38bf`; Actions `33136978825` SUCCESS; Vercel `DUGxaYrrx1NDjVLt5r1DahTEyacE` SUCCESS. Ein Stamp danach braucht erneute Gates.

## Nächster Schritt

Unabhängiger Technical-Lead-Finalreview. Nicht Ready. Nicht mergen. Kein automatischer AP-5-S1-Start.
