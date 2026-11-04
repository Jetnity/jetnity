/** Local-only KAYAK access check. Never import into the application. */
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';

const ORIGIN = 'https://sandbox-en-us.kayakaffiliates.com';
const PATHS = {
  hotels: '/api/3.0/hotels',
  flights: '/i/api/affiliate/search/flight/v1/poll',
};
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REQUESTS = 6;

class SafeFailure extends Error {
  constructor(code, httpStatus) {
    super(code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// Errors from fetch and upstream bodies can contain the credential in a URL.
function failure(error) {
  return {
    state: 'failed',
    reason: error instanceof SafeFailure ? error.code : 'transport_failure',
    ...(error instanceof SafeFailure && error.httpStatus ? { httpStatus: error.httpStatus } : {}),
  };
}

export function createClient(key, fetchImpl = fetch, clientIp) {
  if (!/^[A-Fa-f0-9-]{36}$/.test(key ?? '')) throw new SafeFailure('missing_or_invalid_key');
  if (!isIP(clientIp ?? '')) throw new SafeFailure('missing_or_invalid_client_ip');
  const userTrackId = randomUUID();
  const cookies = new Map();
  let requests = 0;
  return {
    get requests() { return requests; },
    async request(kind, query = {}, body) {
      if (!Object.hasOwn(PATHS, kind)) throw new SafeFailure('invalid_operation');
      if (requests >= MAX_REQUESTS) throw new SafeFailure('request_limit');
      const url = new URL(PATHS[kind], ORIGIN);
      for (const [name, value] of Object.entries(query)) url.searchParams.set(name, String(value));
      url.searchParams.set('apiKey', key);
      url.searchParams.set('userTrackId', userTrackId);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      let reader;
      try {
        requests++;
        const response = await fetchImpl(url, {
          method: kind === 'flights' ? 'POST' : 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            accept: 'application/json',
            'user-agent': `Jetnity-KAYAK-Sandbox/1.0 (Node.js ${process.version}; ${process.platform})`,
            'x-original-client-ip': clientIp,
            ...(body ? { 'content-type': 'application/json' } : {}),
            ...(cookies.size ? { cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; ') } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (response.status >= 300 && response.status < 400) throw new SafeFailure('redirect_blocked', response.status);
        if (!response.ok) throw new SafeFailure('http_failure', response.status);
        if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new SafeFailure('response_too_large');
        for (const cookie of response.headers.getSetCookie()) {
          const pair = cookie.split(';', 1)[0];
          const split = pair.indexOf('=');
          if (split > 0 && pair.length < 8192 && cookies.size < 30) {
            cookies.set(pair.slice(0, split), pair.slice(split + 1));
          }
        }
        if (!response.body) throw new SafeFailure('invalid_response');
        reader = response.body.getReader();
        const chunks = [];
        let bytes = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > MAX_BYTES) throw new SafeFailure('response_too_large');
          chunks.push(value);
        }
        let data;
        try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch { throw new SafeFailure('invalid_json'); }
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new SafeFailure('invalid_response');
        return data;
      } finally {
        controller.abort();
        if (reader) await reader.cancel().catch(() => {});
        clearTimeout(timeout);
      }
    },
  };
}

function summarize(kind, data) {
  const complete = kind === 'hotels' ? data.isComplete === true : data.status === 'complete';
  if (kind === 'hotels' ? typeof data.isComplete !== 'boolean' : !['complete', 'first-phase', 'second-phase'].includes(data.status)) {
    throw new SafeFailure('invalid_search_status');
  }
  // An initial asynchronous hotel response can omit results entirely.
  // This is pending, never evidence of a completed empty inventory.
  if (!complete && data.results === undefined) data = { ...data, results: [] };
  if (!Array.isArray(data.results) || data.results.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
    throw new SafeFailure('invalid_results');
  }
  const count = data.results.length;
  // Only counts are emitted; names, search IDs, cookies and URLs stay in memory.
  const report = { state: complete ? (count ? 'complete' : 'empty') : 'partial', returnedResults: count };
  if (kind === 'hotels') {
    report.withImages = data.results.filter(row => Array.isArray(row.images) && row.images.length > 0).length;
    report.withRates = data.results.filter(row => Array.isArray(row.rates) && row.rates.length > 0).length;
    report.withBookingLinks = data.results.filter(row => Array.isArray(row.rates) && row.rates.some(rate => typeof rate?.bookUri === 'string' && rate.bookUri.length > 0)).length;
  } else {
    report.withBookingOptions = data.results.filter(row => Array.isArray(row.bookingOptions) && row.bookingOptions.length > 0).length;
    report.withBookingLinks = data.results.filter(row => Array.isArray(row.bookingOptions) && row.bookingOptions.some(option => typeof option?.bookingUrl === 'string' && option.bookingUrl.length > 0)).length;
    report.withPrices = data.results.filter(row => Array.isArray(row.bookingOptions) && row.bookingOptions.some(option => Number.isFinite(option?.displayPrice?.price))).length;
  }
  return report;
}

export async function runCheck({ key, clientIp, fetchImpl = fetch, now = new Date(), pause = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  const report = { checkedAt: now.toISOString(), environment: 'sandbox', publicEnabled: false, hotels: null, flights: null, requests: 0 };
  let client;
  try { client = createClient(key, fetchImpl, clientIp); }
  catch (error) { report.hotels = report.flights = failure(error); return report; }
  const day = offset => new Date(now.getTime() + offset * 86400000).toISOString().slice(0, 10);
  const hotelQuery = { destination: 'kplace:58075', checkin: day(30), checkout: day(33), rooms: '2', languageCode: 'EN', currencyCode: 'USD', searchTimeout: 5000, pageSize: 3, pageIndex: 0, responseOptions: 'toprates,images', includeTaxesInTotal: true, includeLocalTaxesInTotal: true };
  const startFlight = { searchStartParameters: { cabin: 'economy', passengers: ['ADT'], legs: [{ origin: { locationType: 'airports', airports: ['LAX'] }, destination: { locationType: 'airports', airports: ['BOS'] }, date: day(30), flex: 'exact' }] } };
  for (const kind of ['hotels', 'flights']) {
    let query = kind === 'hotels' ? hotelQuery : {};
    let body = kind === 'flights' ? startFlight : undefined;
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const data = await client.request(kind, query, body);
        report[kind] = summarize(kind, data);
        if (report[kind].state !== 'partial' || attempt === 2) break;
        if (kind === 'flights') {
          if (!/^[a-zA-Z0-9_-]{1,128}$/.test(data.searchId ?? '') || !/^\d{1,8}$/.test(String(data.cluster ?? ''))) {
            throw new SafeFailure('invalid_polling_context');
          }
          body = { searchId: data.searchId };
          query = { cluster: data.cluster };
        }
        await pause(5000);
      }
    } catch (error) { report[kind] = failure(error); }
  }
  report.requests = client.requests;
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    // Local diagnostic only: discover this machine's real outbound IP, never
    // substitute a made-up end-user IP. No KAYAK credential is sent to ipify.
    const ipResponse = await fetch('https://api.ipify.org?format=json', { redirect: 'error', signal: AbortSignal.timeout(10_000) });
    if (!ipResponse.ok) throw new SafeFailure('client_ip_lookup_failed');
    const { ip: clientIp } = await ipResponse.json();
    const report = await runCheck({ key: process.env.KAYAK_SANDBOX_API_KEY, clientIp });
    console.log(JSON.stringify(report, null, 2));
    if ([report.hotels, report.flights].some(result => !['complete', 'empty'].includes(result.state))) process.exitCode = 1;
  } catch {
    console.error('KAYAK sandbox check failed; no credentials or response details logged.');
    process.exitCode = 1;
  }
}
