'use strict';

// Temporary Dev acceptance only; remove this hook and its exact importer permit
// in the protection package before Production. Each matching build runs it again.
// No target override, write, Owner request, method approval or evidence import.
const guards = Object.freeze({
  VERCEL_ENV: 'preview',
  VERCEL_PROJECT_ID: 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
  VERCEL_GIT_REPO_OWNER: 'Jetnity',
  VERCEL_GIT_REPO_SLUG: 'jetnity',
  VERCEL_GIT_COMMIT_REF: 'feat/official-truth-human-method-ui-1-20261112',
});
const out = value => process.stdout.write(JSON.stringify(value) + '\n');
const every = checks => Object.values(checks).every(value => value === true);
const need = value => { if (!value) throw Error('dev_verification_failed'); };
const oid = value => typeof value === 'string' && /^[1-9][0-9]{0,9}$/.test(value);
const birth = value => typeof value === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}:[0-9]{2}(?:[.][0-9]{1,6})?(?:Z|[+]00(?::?00)?)$/.test(value);
let stage = 'dev_scope';

async function main() {
  if (!Object.entries(guards).every(([key, value]) => process.env[key] === value)) {
    out({ check: 'installed_dev', status: 'SKIPPED_OUTSIDE_SELECTED_DEV' });
    return;
  }
  stage = 'imports';
  const { performance } = require('node:perf_hooks');
  const { V3_PG_LOGINS, selectedV3PgTarget, readV3PgPassword } = require('../../lib/readiness/official-truth-product-v3/transport/node-postgres-selection.ts');
  const { openOwnedV3PgPair } = require('../../lib/readiness/official-truth-product-v3/transport/node-postgres-owned-session.ts');
  const { V3_NODE_POSTGRES_EXECUTORS, readV3NodePostgresTerminalState } = require('../../lib/readiness/official-truth-product-v3/transport/node-postgres-executors.ts');
  const { AA_BERN_CH_DE_REVIEWED_PROGRAM: program } = require('../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program.ts');
  const { readAaChDeOwnedSources, inspectAaChDeOwnedOriginal, inspectAaChDeOwnedAttempt } = require('../../lib/readiness/official-truth-product-v3/source/aa-ch-de-owned-read.ts');
  const { AA_BERN_REVIEWED_DOCUMENTS, AA_CH_DE_REVIEWED_IDENTITY_PROFILE, BERN_CH_DE_REVIEWED_IDENTITY_PROFILE } = require('../../lib/readiness/official-truth-product-v3/source/aa-bern-ch-de-current-article.ts');
  const { createV3WorkIdentity } = require('../../lib/readiness/official-truth-product-v3/contract.ts');
  const { hrs1Canonical } = require('../../lib/readiness/official-truth-product-v3/result/contract.ts');
  const kinds = ['method', 'intake', 'jobs', 'writer', 'reader', 'verifier'];
  need(Object.keys(V3_PG_LOGINS).length === kinds.length && kinds.every(kind => Object.hasOwn(V3_PG_LOGINS, kind)));
  const targetSelected = selectedV3PgTarget() !== null;
  const results = [], pairPassed = {};
  let databaseOid = null, blocked = false;
  const record = value => { results.push(value); out(value); };
  const identitySql = `SELECT a.pid::text AS pid,a.backend_start::text AS birth,
    session_user::text AS login,current_user::text AS role,a.datid::text AS db_oid,a.usesysid::text AS login_oid,
    a.application_name::text AS application_name,(s.ssl IS TRUE)::text AS backend_tls,
    (current_setting($1::text)::integer/10000)::text AS server_major,
    (r.rolsuper OR r.rolinherit OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls)::text AS privileged,
    r.rolcanlogin::text AS can_login,r.rolconnlimit::text AS connection_limit,
    (r.rolvaliduntil IS NULL)::text AS unbounded_validity,current_database()::text AS database_name,
    current_setting($2::text)::text AS read_only
    FROM pg_catalog.pg_stat_activity a JOIN pg_catalog.pg_roles r ON r.oid=a.usesysid
    LEFT JOIN pg_catalog.pg_stat_ssl s ON s.pid=a.pid WHERE a.pid=pg_catalog.pg_backend_pid()`;
  const roleSql = `SELECT session_user::text AS login,current_user::text AS role,
    pg_catalog.pg_backend_pid()::text AS pid,current_setting($1::text)::text AS read_only`;

  async function loginPair(kind) {
    const credentialConfigured = readV3PgPassword(kind) !== null;
    if (!targetSelected || !credentialConfigured) return {
      check: 'login_pair', kind, status: 'FAIL', targetSelected, credentialConfigured,
      attempted: false, localJoin: true, blockedRemoteUnknown: false, sessions: [],
    };
    const deadline = performance.now() + 5000, abort = new AbortController();
    let pair = null, acquisitionSettled = false, localJoin = false, idleBeforeClose = true;
    const sessions = [], identities = [];
    const timer = setTimeout(() => {
      abort.abort(); pair?.work.forceLocalClose(); pair?.control.forceLocalClose();
    }, Math.max(0, deadline - performance.now()));
    const query = async (session, sql, values, command, ready) => {
      need(!abort.signal.aborted && performance.now() < deadline);
      const result = await session.query(sql, values);
      need(result.command === command && result.ready === ready);
      need(!abort.signal.aborted && performance.now() < deadline);
      return result;
    };
    try {
      pair = await openOwnedV3PgPair(kind, deadline, deadline + 5000, abort.signal);
      acquisitionSettled = true;
      if (pair) for (const purpose of ['control', 'work']) {
        const session = pair[purpose], checks = { protocol: true, identity: false, role: false, rollback: false, idle: false };
        const metadata = { purpose, pid: null, birth: null, loginOID: null, dbOID: null };
        try {
          await query(session, 'BEGIN READ ONLY', [], 'BEGIN', 'T');
          const result = await query(session, identitySql, ['server_version_num', 'transaction_read_only'], 'SELECT', 'T');
          need(result.rows.length === 1);
          const row = result.rows[0];
          const identityShape = oid(row.pid) && oid(row.db_oid) && oid(row.login_oid) && birth(row.birth);
          if (identityShape) Object.assign(metadata, { pid: row.pid, birth: row.birth, loginOID: row.login_oid, dbOID: row.db_oid });
          identities.push(row);
          const attributes = {
            identityShape, ownLogin: row.login === V3_PG_LOGINS[kind].login && row.role === row.login,
            applicationName: row.application_name === session.applicationName,
            backendTls: row.backend_tls === 'true', pg17: row.server_major === '17',
            unprivileged: row.privileged === 'false', canLogin: row.can_login === 'true',
            limitTwo: row.connection_limit === '2', validityNull: row.unbounded_validity === 'true',
            database: row.database_name === 'postgres', readOnly: row.read_only === 'on',
          };
          Object.assign(checks, attributes); checks.identity = every(attributes);
          checks.role = checks.identity;
          if (purpose === 'work' && V3_PG_LOGINS[kind].setRole !== null && checks.identity) {
            checks.role = false;
            await query(session, V3_PG_LOGINS[kind].setRole, [], 'SET', 'T');
            const role = await query(session, roleSql, ['transaction_read_only'], 'SELECT', 'T');
            checks.role = role.rows.length === 1 && role.rows[0].login === row.login && role.rows[0].pid === row.pid
              && role.rows[0].role === V3_PG_LOGINS[kind].role && role.rows[0].read_only === 'on';
          }
        } catch { checks.protocol = false; }
        finally {
          // Only this settled read-only session is rolled back; no retry/new pair.
          if (session.alive() && !session.idleAcknowledged()) {
            try { await query(session, 'ROLLBACK', [], 'ROLLBACK', 'I'); checks.rollback = true; }
            catch { checks.rollback = false; }
          }
          checks.idle = session.idleAcknowledged();
          sessions.push({ ...metadata, checks });
        }
        if (!session.idleAcknowledged()) break;
      }
    } catch { acquisitionSettled = false; }
    finally {
      if (pair) {
        idleBeforeClose = pair.work.idleAcknowledged() && pair.control.idleAcknowledged();
        try { await pair.closeLocal(); localJoin = !pair.work.alive() && !pair.control.alive(); }
        catch {
          pair.work.forceLocalClose(); pair.control.forceLocalClose();
          const joined = await Promise.allSettled([pair.work.closeLocal(), pair.control.closeLocal()]);
          localJoin = joined.every(value => value.status === 'fulfilled') && !pair.work.alive() && !pair.control.alive();
        }
      } else localJoin = acquisitionSettled; // The existing opener joins its own failed acquisition.
      clearTimeout(timer);
    }
    const distinctBackends = identities.length === 2 && identities[0].pid !== identities[1].pid;
    const sameLoginOid = identities.length === 2 && oid(identities[0].login_oid) && identities[0].login_oid === identities[1].login_oid;
    const sameDatabaseOid = identities.length === 2 && oid(identities[0].db_oid) && identities[0].db_oid === identities[1].db_oid;
    if (sameDatabaseOid && databaseOid === null) databaseOid = identities[0].db_oid;
    const commonDatabase = sameDatabaseOid && identities[0].db_oid === databaseOid;
    const blockedRemoteUnknown = !acquisitionSettled || !idleBeforeClose || !localJoin;
    const verified = sessions.length === 2 && sessions.every(value => every(value.checks))
      && distinctBackends && sameLoginOid && sameDatabaseOid && commonDatabase;
    return { check: 'login_pair', kind, status: verified && !blockedRemoteUnknown ? 'PASS' : 'FAIL',
      targetSelected, credentialConfigured, attempted: true, distinctBackends, sameLoginOid, sameDatabaseOid,
      commonDatabase, idleBeforeClose, localJoin, blockedRemoteUnknown, sessions };
  }

  stage = 'login_pairs';
  for (const kind of kinds) {
    if (blocked) { record({ check: 'login_pair', kind, status: 'SKIPPED_REMOTE_UNKNOWN' }); continue; }
    const result = await loginPair(kind);
    pairPassed[kind] = result.status === 'PASS'; blocked ||= result.blockedRemoteUnknown;
    record(result);
  }

  stage = 'jobs_queue_read_probe';
  if (blocked || !pairPassed.jobs) {
    record({ check: stage, status: blocked ? 'SKIPPED_REMOTE_UNKNOWN' : 'SKIPPED_JOBS_LOGIN_NOT_PROVED' });
  } else {
    const deadline = performance.now() + 5000, abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), Math.max(0, deadline - performance.now()));
    let acknowledged = false, absent = false, returned = false, remoteUnknown = false;
    try {
      const identity = createV3WorkIdentity({ context: program.context, method: program.method,
        factKind: 'requirement_effect', researchReason: { status: 'missing' } });
      need(identity.ok);
      const { methodId, revision, methodDigest, packageDigest } = program.binding;
      const reply = await V3_NODE_POSTGRES_EXECUTORS.jobs.executeFixed({
        operationText: hrs1Canonical({ operation: 'queue_read', body: { jobKey: identity.value.jobKey, continuation: null }, phase: 'probe' }),
        methodId, revision, methodDigest, packageDigest, epoch: null, budget: { deadline },
        notAfter: new Date(Date.now() + Math.max(0, Math.floor(deadline - performance.now()))).toISOString(),
      }, abort.signal);
      returned = true; acknowledged = reply.status === 'acknowledged'; remoteUnknown = reply.status === 'blocked_remote_unknown';
      if (acknowledged && reply.rows.length === 1 && Object.keys(reply.rows[0]).length === 1 && typeof reply.rows[0].result === 'string') {
        const decoded = JSON.parse(reply.rows[0].result);
        absent = decoded !== null && typeof decoded === 'object' && !Array.isArray(decoded)
          && Object.keys(decoded).length === 1 && decoded.status === 'absent';
      }
    } catch { /* Only the fixed booleans below leave this diagnostic. */ }
    finally { clearTimeout(timer); }
    const terminal = readV3NodePostgresTerminalState();
    const terminalIdle = Object.values(terminal).every(phase => phase === 'idle');
    blocked ||= remoteUnknown || !terminalIdle || !returned;
    record({ check: stage, status: acknowledged && absent && terminalIdle ? 'PASS' : 'FAIL',
      acknowledged, absent, terminalIdle, blockedRemoteUnknown: blocked, terminal });
  }

  stage = 'owned_source_checks';
  if (blocked) {
    for (const role of ['primary', 'counter']) record({ check: stage, role, scope: 'SOURCE_CHECK_ONLY', status: 'SKIPPED_REMOTE_UNKNOWN' });
  } else {
    const deadline = performance.now() + 10_000, abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), Math.max(0, deadline - performance.now()));
    let both = null;
    // The existing helper uses allSettled for both owned GETs and joins DNS/TLS/socket cleanup.
    try { both = await readAaChDeOwnedSources(abort.signal, deadline); }
    catch { /* Both rows remain negative; no raw error or source material is printed. */ }
    finally { clearTimeout(timer); }
    const reasons = new Set(['aborted','busy','dns_failed','address_refused','http_failed','http_status',
      'redirect_refused','content_type','encoding','framing','body_limit','invalid_text','deadline','clock']);
    for (const role of ['primary', 'counter']) {
      const spec = AA_BERN_REVIEWED_DOCUMENTS[role], selected = role === 'primary' ? program : program.counter;
      const profile = role === 'primary' ? AA_CH_DE_REVIEWED_IDENTITY_PROFILE : BERN_CH_DE_REVIEWED_IDENTITY_PROFILE;
      let bytes = null, rawSha256 = null, reason = 'check_failed';
      const checks = { ownedOriginal: false, ownedAttempt: false, fixedUrl: false, get200NoRedirect: false,
        boundedHtml: false, identityProfile: false, reviewedMainHash: false };
      try {
        const read = both?.[role];
        if (read?.status === 'unavailable' && reasons.has(read.reason)) reason = read.reason;
        if (read?.status === 'read') {
          const original = inspectAaChDeOwnedOriginal(read.receipt), attempt = inspectAaChDeOwnedAttempt(read.receipt);
          checks.ownedOriginal = original?.role === role;
          checks.ownedAttempt = !!original && attempt?.role === role && attempt.status === 'read' && attempt.reason === null
            && attempt.startedAt === original.startedAt && attempt.completedAt === original.retrievedAt && attempt.requestUrl === spec.url;
          if (original) {
            checks.fixedUrl = original.requestUrl === spec.url && original.finalUrl === spec.url;
            checks.get200NoRedirect = original.method === 'GET' && original.httpStatus === 200 && original.redirectCount === 0;
            checks.boundedHtml = original.contentType === 'text/html' && Number.isSafeInteger(original.bytes)
              && original.bytes > 0 && original.bytes <= 131072 && /^[a-f0-9]{64}$/.test(original.rawDigest);
            if (checks.boundedHtml) { bytes = original.bytes; rawSha256 = original.rawDigest; }
            const graph = program.registry.contentIdentity;
            const item = graph.items.find(value => value.sourceId === selected.source.sourceId && value.contentItemId === selected.source.contentItemId);
            const representation = graph.representations.find(value => value.sourceId === selected.source.sourceId && value.representationId === selected.source.representationId);
            checks.identityProfile = !!item && !!representation && profile.verify({ item, representation,
              responseText: original.bodyText, finalUrl: original.finalUrl, mediaType: original.contentType }).ok === true;
            checks.reviewedMainHash = selected.documentIdentity(original.bodyText) && selected.interpret(original.bodyText).status === 'clear';
          }
          if (every(checks)) reason = null;
        }
      } catch { reason = 'check_failed'; }
      record({ check: stage, role, scope: 'SOURCE_CHECK_ONLY', status: every(checks) ? 'PASS' : 'FAIL',
        url: spec.url, identityProfile: profile.identityProfileId, identityProfileVersion: profile.identityProfileVersion,
        reviewedMainSha256: spec.reviewedMainSha256, bytes, rawSha256, reason, checks });
    }
  }
  const ok = targetSelected && results.length === 9 && results.every(value => value.status === 'PASS');
  out({ check: 'installed_dev', status: ok ? 'PASS' : 'FAIL', checks: results.length,
    databaseWritesRequested: 0, ownerOrImportAttempted: false, blockedRemoteUnknown: blocked });
  if (!ok) process.exitCode = 1;
}

void main().catch(() => { out({ check: stage, status: 'FAIL' }); process.exitCode = 1; });
