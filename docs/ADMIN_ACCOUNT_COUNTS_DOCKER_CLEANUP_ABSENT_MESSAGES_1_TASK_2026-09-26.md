# Admin Account Counts Docker Cleanup Absent Messages 1

Date: 2026-09-26
Status: ACTIVE / BOUNDED CLEANUP CLASSIFIER REPAIR / DO NOT READY / DO NOT MERGE
Base: `26b763016322fb1c929e131b4ff5bf467533e809`
Branch: `fix/admin-account-counts-docker-cleanup-absent-messages-1`

## Trigger

Authorized Apple-Silicon Mac full run:
`aaclr1-20260926T182151Z`

The run reached the final cleanup stage. Cleanup receipt proves:
- app process reaped;
- observer closed;
- stack CLI child reaped with exitCode 0;
- discoveryState=PRESENT;
- inventoryComplete=true;
- foreignContainers=[], foreignVolumes=[], conflicts=[];
- containersRemoved=true and containerState=ABSENT;
- yet cleanup reports UNKNOWN / Docker services unverified because Docker Desktop "already absent" messages are not fully recognized.

Observed real Docker Desktop forms include:
- container: `No such container: <id>`
- volume: `get <volume>: no such volume`
- network: `network <name> not found`

Current classifier accepts narrower forms such as:
- `No such volume: <name>`
- `No such network: <name>`

This creates false UNKNOWN after resources were already removed.

## Goal

Recognize exact Docker Desktop "resource already absent" error forms for the exact requested resource only, without broadening unrelated daemon/error failures into ABSENT.

## Required correction

Modify only cleanup/resource error classification in the local E2E harness.

For an operation with known `kind` and exact `name`, classify ABSENT for narrowly anchored, case-insensitive forms that identify the same exact resource:

### Container
Accept:
- `No such container: <exact-name-or-id>`
- `No such object: <exact-name-or-id>`

Preserve existing behavior.

### Volume
Accept:
- `No such volume: <exact-name>`
- Docker Desktop form `get <exact-name>: no such volume`

### Network
Accept:
- `No such network: <exact-name>`
- Docker Desktop form `network <exact-name> not found`

Requirements:
- escape the resource name literally;
- anchor resource identity so a different name cannot PASS;
- surrounding command-prefix/stderr text may exist;
- remote/daemon/permission/timeout/JSON parse failures remain UNKNOWN;
- no generic `not found` match;
- no global prune;
- no ownership weakening;
- foreign/unresolved/conflict handling unchanged.

## Important separation

Do NOT modify browser artifact expectations or consumer screenshot/export behavior in this slice.

The same run also reported missing desktop/mobile browser screenshots. That is a separate browser/evidence matter and must remain independently visible after this cleanup classifier repair.

## Required tests

Add focused controlled regressions for:
1. exact Docker Desktop container no-such-container => ABSENT;
2. same text with different container id => UNKNOWN;
3. exact `get <volume>: no such volume` => ABSENT;
4. different volume => UNKNOWN;
5. exact `network <name> not found` => ABSENT;
6. different network => UNKNOWN;
7. daemon/permission/timeout remains UNKNOWN even if text also contains resource name;
8. existing historical absent forms remain PASS;
9. stop/remove cleanup with already-absent container/volume/network can reach stopped=true when all other ownership gates are good;
10. foreign/unresolved resources still block cleanup;
11. full helper suite remains green.

## Scope

Allowed:
- `scripts/e2e/admin-account-counts-local-runtime-1/stack.mjs`
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
- own STATUS/HANDOFF/SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`

Forbidden:
- browser/evidence artifact logic
- Docker global settings
- CLI pins/archive
- npm/cache path
- SQL/Auth/product/root dependencies/CI
- Production

## Agent

Logical name: **Jetnity admin account counts docker cleanup absent messages 1**
Generation: **1**
Required model: **cursor-grok-4.6-high-fast**

## STOP

Do not Ready.
Do not merge.
Do not start follow-up.
STOP for independent Technical-Lead exact-head review.
