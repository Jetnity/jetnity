// lib/infomaniak.ts
/*  Infomaniak DNS Helper (Domains & E-Mail)
    – listZoneRecords / upsert / evaluateDns / buildEmailFixPlan / applyDnsFixes
    – nutzt Infomaniak REST API (v2). Body-Keys: source (=NAME), target (=VALUE)
    – Doku-Hinweise: POST/PUT records mit source/target; check endpoint vorhanden.
*/

type DnsType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT';
type ApiRecord = {
  id: number;
  type: DnsType;
  source: string;        // Host/Name (z. B. "@", "www", "_dmarc")
  target: string;        // Wert (z. B. IP, Hostname, TXT-Inhalt)
  ttl?: number;
  priority?: number | null; // MX
};

export type DnsCheckSummary = {
  domain: string;
  apexA: { ok: boolean; found?: ApiRecord[]; wanted?: string | null };
  wwwCname: { ok: boolean; found?: ApiRecord[]; wanted?: string | null };
  mx: { ok: boolean; found?: ApiRecord[]; wantedHost?: string; wantedPrio?: number };
  spf: { ok: boolean; found?: ApiRecord[]; wantedInclude?: string };
  dkim: { ok: boolean; found?: ApiRecord[]; info: string };
  dmarc: { ok: boolean; found?: ApiRecord[]; wantedPolicy?: string; rua?: string };
};

const API_BASE = 'https://api.infomaniak.com/2';

function domainToken() {
  const token = process.env.INFOMANIAK_API_TOKEN_DOMAIN;
  if (!token) throw new Error('Missing ENV INFOMANIAK_API_TOKEN_DOMAIN');
  return token;
}

async function iapi<T>(
  path: string,
  init?: RequestInit,
  token: string = domainToken(),
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Jetnity-Admin/1.0 (+dns-tools)',
      ...(init?.headers || {}),
    },
    // Infomaniak API-Limit: 60 req/min (global) – genügt hier locker. (Quelle: API Intro)
    // https://www.infomaniak.com/en/support/faq/2581/decouvrir-lapi-infomaniak
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Infomaniak API ${path} failed: ${res.status} ${res.statusText} ${msg}`);
  }
  return res.json() as Promise<T>;
}

export async function listZoneRecords(domain: string): Promise<ApiRecord[]> {
  // GET /2/zones/{zone}/records  (List)
  // In der Dev-UI als "List dns records" verlinkt.
  const data = await iapi<{ data: ApiRecord[] }>(`/zones/${encodeURIComponent(domain)}/records`, {
    method: 'GET',
  });
  return (data as any).data ?? data; // fallback, falls API nacktes Array liefert
}

export async function storeRecord(domain: string, rec: Partial<ApiRecord> & { type: DnsType; source: string; target: string }) {
  // POST /2/zones/{zone}/records  (Body u.a. source/target/type)
  return iapi(`/zones/${encodeURIComponent(domain)}/records`, {
    method: 'POST',
    body: JSON.stringify({
      type: rec.type,
      source: rec.source,
      target: rec.target,
      ttl: rec.ttl ?? 3600,
      priority: rec.priority ?? null,
    }),
  });
}

export async function updateRecord(domain: string, id: number, rec: Partial<ApiRecord>) {
  // PUT /2/zones/{zone}/records/{record}  (Body u.a. target/ttl/priority)
  return iapi(`/zones/${encodeURIComponent(domain)}/records/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      target: rec.target,
      ttl: rec.ttl ?? 3600,
      priority: rec.priority ?? null,
    }),
  });
}

function findRecords(records: ApiRecord[], type: DnsType, source: string | RegExp) {
  return records.filter(r => r.type === type && (
    typeof source === 'string' ? r.source === source : source.test(r.source)
  ));
}

function normalizeTxt(val: string) {
  return val.replace(/^"+|"+$/g, '').trim();
}

export async function evaluateDns(domain: string): Promise<DnsCheckSummary> {
  const records = await listZoneRecords(domain);

  const apexTarget = process.env.DNS_TARGET_APEX_A ?? null;
  const wwwTarget = process.env.DNS_TARGET_WWW_CNAME ?? null;

  const apex = findRecords(records, 'A', '@');
  const www = findRecords(records, 'CNAME', 'www');
  const mx = records.filter(r => r.type === 'MX');
  const txt = records.filter(r => r.type === 'TXT');

  // SPF: TXT @ mit v=spf1 und include:spf.infomaniak.ch
  const spfRe = /\bv=spf1\b/i;
  const spfInc = /include:spf\.infomaniak\.ch/i; // Quelle s.u.
  const spf = txt.filter(r => r.source === '@' && spfRe.test(normalizeTxt(r.target)));

  // DMARC: TXT _dmarc mit v=DMARC1
  const dmarc = txt.filter(r => r.source === '_dmarc' && /v\s*=\s*DMARC1/i.test(normalizeTxt(r.target)));

  // DKIM: TXT {selector}._domainkey mit v=DKIM1
  const dkim = txt.filter(r => /\._domainkey$/.test(r.source) && /v\s*=\s*DKIM1/i.test(normalizeTxt(r.target)));

  const wantedMxHost = (process.env.DNS_INFOMANIAK_MX || 'mta-gw.infomaniak.ch').trim().replace(/\.$/, '');
  const wantedMxPrio = Number(process.env.DNS_INFOMANIAK_MX_PRIORITY || 5);

  const hasWantedMx = mx.some(r =>
    (r.target.replace(/\.$/, '') === wantedMxHost) &&
    (Number(r.priority ?? 0) === wantedMxPrio)
  );

  const hasSpf = spf.some(r => spfInc.test(normalizeTxt(r.target)));
  const wantedPolicy = (process.env.DNS_DMARC_POLICY || 'quarantine').toLowerCase();
  const rua = process.env.DNS_DMARC_RUA || `mailto:postmaster@${domain}`;

  return {
    domain,
    apexA: { ok: apex.length > 0 && (!apexTarget || apex.some(a => a.target === apexTarget)), found: apex, wanted: apexTarget },
    wwwCname: { ok: www.length > 0 && (!wwwTarget || www.some(c => c.target === wwwTarget)), found: www, wanted: wwwTarget },
    mx: { ok: hasWantedMx, found: mx, wantedHost: wantedMxHost, wantedPrio: wantedMxPrio },
    spf: { ok: hasSpf, found: spf, wantedInclude: 'include:spf.infomaniak.ch' },
    dkim: { ok: dkim.length > 0, found: dkim, info: 'Für Infomaniak im Manager erzeugen (Selector + TXT). API-Read via kSuite derzeit nicht dokumentiert.' },
    dmarc: { ok: dmarc.length > 0, found: dmarc, wantedPolicy, rua },
  };
}

export type FixApplyFlags = {
  spf?: boolean;
  dmarc?: boolean;
  mx?: boolean;
  apexA?: boolean;
  wwwCname?: boolean;
};

export async function ensureSpf(domain: string, records?: ApiRecord[]) {
  const recs = records || await listZoneRecords(domain);
  const now = findRecords(recs, 'TXT', '@').filter(r => /v=spf1/i.test(normalizeTxt(r.target)));
  const wantedInclude = 'include:spf.infomaniak.ch';
  const hasInclude = (s: string) => new RegExp(`\\b${wantedInclude}\\b`, 'i').test(normalizeTxt(s));

  if (now.length === 0) {
    const value = `v=spf1 ${wantedInclude} -all`;
    return storeRecord(domain, { type: 'TXT', source: '@', target: value });
  }
  // Update erstes SPF falls include fehlt
  const first = now[0];
  if (!hasInclude(first.target)) {
    let merged = normalizeTxt(first.target);
    // vor "-all" einfügen
    if (/\s-all\b/.test(merged)) merged = merged.replace(/\s-all\b/i, ` ${wantedInclude} -all`);
    else merged = `${merged} ${wantedInclude}`.trim();
    return updateRecord(domain, first.id, { target: merged });
  }
  return { ok: true, msg: 'SPF already ok' };
}

export async function ensureDmarc(domain: string, records?: ApiRecord[]) {
  const recs = records || await listZoneRecords(domain);
  const dmarc = findRecords(recs, 'TXT', '_dmarc').find(r => /v\s*=\s*DMARC1/i.test(normalizeTxt(r.target)));
  const policy = (process.env.DNS_DMARC_POLICY || 'quarantine').toLowerCase();
  const rua = process.env.DNS_DMARC_RUA || `mailto:postmaster@${domain}`;
  const value = `v=DMARC1; p=${policy}; rua=${rua}; adkim=s; aspf=s; pct=100`;

  if (!dmarc) {
    return storeRecord(domain, { type: 'TXT', source: '_dmarc', target: value, ttl: 3600 });
  }
  // Nur updaten, wenn p-Policy fehlt/abweicht
  const norm = normalizeTxt(dmarc.target);
  if (!/\bp\s*=\s*(none|quarantine|reject)\b/i.test(norm) || !new RegExp(`\\bp\\s*=\\s*${policy}\\b`, 'i').test(norm)) {
    return updateRecord(domain, dmarc.id, { target: value });
  }
  return { ok: true, msg: 'DMARC already ok' };
}

export async function ensureMx(domain: string, records?: ApiRecord[]) {
  const recs = records || await listZoneRecords(domain);
  const mx = recs.filter(r => r.type === 'MX');
  const host = (process.env.DNS_INFOMANIAK_MX || 'mta-gw.infomaniak.ch').trim().replace(/\.$/, '');
  const prio = Number(process.env.DNS_INFOMANIAK_MX_PRIORITY || 5);
  const exists = mx.find(r => r.target.replace(/\.$/, '') === host && Number(r.priority ?? 0) === prio);

  if (!exists) {
    // ggf. vorhandene MX belassen – hier fügen wir standard MX hinzu.
    return storeRecord(domain, { type: 'MX', source: '@', target: host, priority: prio, ttl: 3600 });
  }
  return { ok: true, msg: 'MX already ok' };
}

export async function ensureApexA(domain: string, records?: ApiRecord[]) {
  const target = process.env.DNS_TARGET_APEX_A;
  if (!target) return { ok: false, skipped: true, reason: 'DNS_TARGET_APEX_A not set' };
  const recs = records || await listZoneRecords(domain);
  const apex = findRecords(recs, 'A', '@');
  if (apex.length === 0) {
    return storeRecord(domain, { type: 'A', source: '@', target, ttl: 600 });
  }
  const first = apex[0];
  if (first.target !== target) {
    return updateRecord(domain, first.id, { target });
  }
  return { ok: true, msg: 'Apex A already ok' };
}

export async function ensureWwwCname(domain: string, records?: ApiRecord[]) {
  const target = process.env.DNS_TARGET_WWW_CNAME;
  if (!target) return { ok: false, skipped: true, reason: 'DNS_TARGET_WWW_CNAME not set' };
  const recs = records || await listZoneRecords(domain);
  const www = findRecords(recs, 'CNAME', 'www');
  if (www.length === 0) {
    return storeRecord(domain, { type: 'CNAME', source: 'www', target, ttl: 600 });
  }
  const first = www[0];
  if (first.target !== target) {
    return updateRecord(domain, first.id, { target });
  }
  return { ok: true, msg: 'www CNAME already ok' };
}

export function buildEmailFixPlan(summary: DnsCheckSummary, flags: FixApplyFlags) {
  const tasks: Array<'spf'|'dmarc'|'mx'|'apexA'|'wwwCname'> = [];
  if (flags.spf && !summary.spf.ok) tasks.push('spf');
  if (flags.dmarc && !summary.dmarc.ok) tasks.push('dmarc');
  if (flags.mx && !summary.mx.ok) tasks.push('mx');
  if (flags.apexA && !summary.apexA.ok) tasks.push('apexA');
  if (flags.wwwCname && !summary.wwwCname.ok) tasks.push('wwwCname');
  return tasks;
}

export async function applyDnsFixes(domain: string, flags: FixApplyFlags) {
  const recs = await listZoneRecords(domain);
  const results: Record<string, any> = {};
  if (flags.spf)   results.spf   = await ensureSpf(domain, recs).catch(e => ({ error: String(e) }));
  if (flags.dmarc) results.dmarc = await ensureDmarc(domain, recs).catch(e => ({ error: String(e) }));
  if (flags.mx)    results.mx    = await ensureMx(domain, recs).catch(e => ({ error: String(e) }));
  if (flags.apexA) results.apexA = await ensureApexA(domain, recs).catch(e => ({ error: String(e) }));
  if (flags.wwwCname) results.wwwCname = await ensureWwwCname(domain, recs).catch(e => ({ error: String(e) }));
  return results;
}

// ... bestehende Importe/Typen/Funktionen bleiben unverändert

export async function maintainDomain(domain: string, flags: FixApplyFlags) {
  const before = await evaluateDns(domain)
  const tasks = buildEmailFixPlan(before, flags)
  let results: any = null
  if (tasks.length > 0) {
    results = await applyDnsFixes(domain, flags)
  } else {
    results = { ok: true, msg: 'Nothing to fix' }
  }
  const after = await evaluateDns(domain)
  return { before, tasks, results, after }
}
