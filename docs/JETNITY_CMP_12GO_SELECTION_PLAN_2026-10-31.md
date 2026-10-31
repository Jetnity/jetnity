# Jetnity – CMP 12Go selection — PLAN

**Stand:** 31 October 2026. Accepted pre-code plan, implemented in this branch. Not a PASS.

The writable target is `feat/privacybee-cmp-twelvego-selection-1` / draft #1098. `CMP_RELEASE_AUTHORIZED` stays false. DiscoverCars stays null. The controller and the four public capability calls stay as they are.

## Selected record

`PRODUCTION_POLICY_TABLE.twelvego` is the frozen record from the immutable task: policy `twelvego-general-chf-20261031-r1`, required category only `ANALYTICS_STORAGE`, the existing 12Go artifact and embed path, protocol revision 1, and host-selection commit `f056b01d63ac7d61650864734a9b44eb6484989e`. The sandbox is `allow-scripts allow-same-origin allow-forms allow-popups`.

## Disclosure and preferences

`TWELVEGO_PRODUCTION_DISCLOSURE` in `lib/privacy/privacybee-cmp/offenlegung.ts` is the source-owned notice for the separate 12Go author. It is not mounted in trips or `WidgetConsentChoice`.

`PrivacyBeeCmpPreferences` reads the existing baked gate, `browserHostIstLizenziert`, and the subscribed store phase. The only prop is `appearance`. The official class is `privacybee-display-preferences`. `components/layout/Footer.tsx` mounts `appearance="footer"` and nothing else.

## Evidence

The real production bootstrap still denies `requestProductionExecution('twelvego')`. A test-only allowing bootstrap can consume that same shipped row once. The mounted harness uses the delivered preferences component for the licensed fixture and for the unlicensed production bootstrap.
