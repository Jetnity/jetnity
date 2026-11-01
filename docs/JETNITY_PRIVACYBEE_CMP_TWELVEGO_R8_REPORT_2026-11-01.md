# Jetnity – CMP / 12Go R8 source release — REPORT

**Stand:** 1 November 2026. Not a Technical Lead PASS and not a live-run record.

## Source

`CMP_RELEASE_AUTHORIZED` is the single functional literal and is now `true`. `freigabe.ts` still denies on kill `aus` and on every host other than `jetnity.com` after the existing lowercase check. `JETNITY.COM` therefore remains licensed. `www.jetnity.com` does not.

The shipped 12Go policy is unchanged: `twelvego-general-chf-20261031-r1`, required category `ANALYTICS_STORAGE` only, disclosure `twelvego-general-disclosure-v1`, network `twelvego-general-network-v1`, artifact `3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e`, path `/embed/twelvego`, protocol `1`, sandbox `allow-scripts allow-same-origin allow-forms allow-popups`, host commit `f056b01d63ac7d61650864734a9b44eb6484989e`. DiscoverCars is null. `purposeSeparationVerified` stays false. `TWELVE_GO_WIDGET_FREIGABE` stays `CONSENT_BLOCKED`.

Positive proofs call `productionBootstrapSource(null)` and then the real facade. The API in those proofs sets the two necessary categories and `ANALYTICS_STORAGE` true, and `AD_STORAGE`, `AD_USER_DATA`, `AD_PERSONALIZATION`, and `PERSONALIZATION_STORAGE` false. A missing baked gate, an explicit `release: false` bootstrap, a kill, a foreign host, a missing API, and a DiscoverCars request still return no capability.

## Harness

The parent page evaluates `productionBootstrapSource(null)` for the positive and absent-API modes, and `buildBootstrapSource({ release: false, killDenied: false })` for the closed mode. The ready-API fixture does not write `__jetnityCmp`. `https://app.privacybee.io/cookie-banner.js` is fulfilled with an inert local script. Each existing context records its bootstrap mode, fixture mode, width, root font, initial gate, initial frame count, and the banner count after that context finishes. `grant-beobachter.ts` was not edited.

The shared CMP harness was not rerun for this correction. Its prior output on `b8ddd79b` is below. It is not a 12Go pass.

## Commands and original records

Parent proof, rerun for this correction:

```
node --import tsx scripts/twelve-go-widget-v2/eltern-nachweis.ts
```

Exit 0. stdout ended with `eltern ok`. The launcher tried Chrome first and used Chrome `148.0.7778.96`. The complete `r7-eltern.json` is in the next section.

Focused suites were not rerun. Their last execution, before this evidence-only correction, was:

```
node --import tsx --test --test-reporter=spec lib/privacy/privacybee-cmp/*.test.ts lib/privacy/widget-consent/*.test.ts lib/providers/twelve-go/widget/*.test.ts lib/legal/privacybee-integration.test.ts
```

Exit 0. `tests 91`, `suites 25`, `pass 91`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 2598.002585`. The only later test edit is the `fassade.test.ts` title. Its assertions were not changed.

Shared CMP harness, not rerun, prior stdout `harness ok`, prior `bericht.json`:

```json
{
  "fehler": [],
  "banner": 1,
  "fremd": []
}
```

## Risks

| Level | Item |
| --- | --- |
| P0 | None found in the offline candidate. |
| P1 | Publishing this candidate loads the real CMP banner for licensed `jetnity.com` visitors and can start 12Go only after analytics consent and a fresh request. These offline tests did not do that. Root owns publication and the live run. |
| P2 | The parent launcher tries installed Chrome first and uses bundled Chromium only if that launch fails. This run used Chrome `148.0.7778.96`. |
| P3 | Native CI and Preview for the implementation head are unread until the push check. |
| Open | Cookie, storage, form, search, and withdrawal acceptance on the live host remain Root's later runtime plan. |

## Not claimed

No real CMP initialization, 12Go form, search, referral, storage observation, or withdrawal acceptance occurred.

## Complete parent JSON

Command `node --import tsx scripts/twelve-go-widget-v2/eltern-nachweis.ts`, exit 0.

```json
{
  "befehl": "node --import tsx scripts/twelve-go-widget-v2/eltern-nachweis.ts",
  "browser": {
    "kanal": "chrome",
    "version": "148.0.7778.96"
  },
  "ledger": [],
  "fehler": [],
  "steuerung": [
    {
      "name": "320",
      "einstellungen": "ok",
      "einstellungenOutline": "3px solid rgb(20, 62, 51)",
      "einstellungenShadow": "rgb(255, 255, 255) 0px 0px 0px 2px, rgb(29, 113, 94) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "anfrage": "ok",
      "anfrageOutline": "3px solid rgb(20, 62, 51)",
      "anfrageShadow": "rgba(255, 255, 255, 0.173) 0px 0px 0px 0px, rgba(29, 113, 94, 0.027) 0px 0px 0px 0.693526px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "entfernen": "ok",
      "entfernenOutline": "3px solid rgb(20, 62, 51)",
      "entfernenShadow": "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(29, 113, 94, 0.15) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "ueber": false
    },
    {
      "name": "390",
      "einstellungen": "ok",
      "einstellungenOutline": "3px solid rgb(20, 62, 51)",
      "einstellungenShadow": "rgb(255, 255, 255) 0px 0px 0px 2px, rgb(29, 113, 94) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "anfrage": "ok",
      "anfrageOutline": "3px solid rgb(20, 62, 51)",
      "anfrageShadow": "rgba(255, 255, 255, 0.176) 0px 0px 0px 0px, rgba(29, 113, 94, 0.027) 0px 0px 0px 0.704264px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "entfernen": "ok",
      "entfernenOutline": "3px solid rgb(20, 62, 51)",
      "entfernenShadow": "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(29, 113, 94, 0.15) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "ueber": false
    },
    {
      "name": "768",
      "einstellungen": "ok",
      "einstellungenOutline": "3px solid rgb(20, 62, 51)",
      "einstellungenShadow": "rgb(255, 255, 255) 0px 0px 0px 2px, rgb(29, 113, 94) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "anfrage": "ok",
      "anfrageOutline": "3px solid rgb(20, 62, 51)",
      "anfrageShadow": "rgba(255, 255, 255, 0.03) 0px 0px 0px 0px, rgba(29, 113, 94, 0.004) 0px 0px 0px 0.130014px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "entfernen": "ok",
      "entfernenOutline": "3px solid rgb(20, 62, 51)",
      "entfernenShadow": "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(29, 113, 94, 0.15) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "ueber": false
    },
    {
      "name": "1440",
      "einstellungen": "ok",
      "einstellungenOutline": "3px solid rgb(20, 62, 51)",
      "einstellungenShadow": "rgb(255, 255, 255) 0px 0px 0px 2px, rgb(29, 113, 94) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "anfrage": "ok",
      "anfrageOutline": "3px solid rgb(20, 62, 51)",
      "anfrageShadow": "rgba(255, 255, 255, 0.03) 0px 0px 0px 0px, rgba(29, 113, 94, 0.004) 0px 0px 0px 0.1318px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "entfernen": "ok",
      "entfernenOutline": "3px solid rgb(20, 62, 51)",
      "entfernenShadow": "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(29, 113, 94, 0.15) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "ueber": false
    },
    {
      "name": "390-root-32",
      "einstellungen": "ok",
      "einstellungenOutline": "3px solid rgb(20, 62, 51)",
      "einstellungenShadow": "rgb(255, 255, 255) 0px 0px 0px 2px, rgb(29, 113, 94) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "anfrage": "ok",
      "anfrageOutline": "3px solid rgb(20, 62, 51)",
      "anfrageShadow": "rgba(255, 255, 255, 0.03) 0px 0px 0px 0px, rgba(29, 113, 94, 0.004) 0px 0px 0px 0.1318px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "entfernen": "ok",
      "entfernenOutline": "3px solid rgb(20, 62, 51)",
      "entfernenShadow": "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(29, 113, 94, 0.15) 0px 0px 0px 4px, rgba(0, 0, 0, 0) 0px 0px 0px 0px",
      "ueber": false
    }
  ],
  "arbeit": {
    "einstellungenVorAnfrage": 0,
    "einstellungenNachKlickUndEnter": 2,
    "aktiv": {
      "grants": "1",
      "consume": 1,
      "canaryNachWiderruf": 0,
      "frameNachZustimmung": 0
    },
    "retiredReady": {
      "lieferung": "retired-ready",
      "challenge": "33954a00d4750dad1c30020fca76d49d5c4b551247e660644acea101684f8366",
      "consumeVorWiderruf": 1,
      "consumeNachLieferung": 1,
      "readyVorher": 10,
      "readyNachher": 11,
      "treffer": 1,
      "frame": 0
    },
    "verzoegert": {
      "canaryVorWiderruf": 1,
      "grantsVorWiderruf": 0,
      "canaryNachher": 0,
      "grantsNachher": 0,
      "consumeVorher": 1,
      "consumeNachher": 1
    },
    "einstellungenBeiAblehnung": 2,
    "einstellungenNachAblehnung": 4
  },
  "kontexte": [
    {
      "name": "ohne-api",
      "bootstrap": "produktion",
      "fixture": false,
      "width": 1440,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "geschlossen",
      "bootstrap": "geschlossen",
      "fixture": true,
      "width": 1440,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": false,
        "killDenied": false,
        "booted": 1,
        "scripts": 0
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 0,
      "bannerEnde": 0
    },
    {
      "name": "konto",
      "bootstrap": "keiner",
      "fixture": false,
      "width": 1440,
      "root": "16px",
      "gateAnfang": null,
      "rahmenAnfang": 0,
      "bannerErwartet": 0,
      "bannerEnde": 0
    },
    {
      "name": "gesperrt-320",
      "bootstrap": "produktion",
      "fixture": false,
      "width": 320,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "gesperrt-390",
      "bootstrap": "produktion",
      "fixture": false,
      "width": 390,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "gesperrt-768",
      "bootstrap": "produktion",
      "fixture": false,
      "width": 768,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "gesperrt-1440",
      "bootstrap": "produktion",
      "fixture": false,
      "width": 1440,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "gesperrt-390-root-32",
      "bootstrap": "produktion",
      "fixture": false,
      "width": 390,
      "root": "32px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "positiv-320",
      "bootstrap": "produktion",
      "fixture": true,
      "width": 320,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "positiv-390",
      "bootstrap": "produktion",
      "fixture": true,
      "width": 390,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "positiv-768",
      "bootstrap": "produktion",
      "fixture": true,
      "width": 768,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "positiv-1440",
      "bootstrap": "produktion",
      "fixture": true,
      "width": 1440,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "positiv-390-root-32",
      "bootstrap": "produktion",
      "fixture": true,
      "width": 390,
      "root": "32px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "lebenszyklus",
      "bootstrap": "produktion",
      "fixture": true,
      "width": 1440,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "timeout",
      "bootstrap": "produktion",
      "fixture": true,
      "width": 390,
      "root": "16px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    },
    {
      "name": "390-32",
      "bootstrap": "produktion",
      "fixture": true,
      "width": 390,
      "root": "32px",
      "gateAnfang": {
        "releaseAllowed": true,
        "killDenied": false,
        "booted": 1,
        "scripts": 1
      },
      "rahmenAnfang": 0,
      "bannerErwartet": 1,
      "bannerEnde": 1
    }
  ]
}
```
