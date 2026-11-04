import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient as createRawClient, runCheck as runRawCheck } from '../scripts/kayak-sandbox-check.mjs';

// Documentation-only address, used with mocked fetch; never sent over the network.
const clientIp = '192.0.2.10';
const createClient = (key, fetchImpl) => createRawClient(key, fetchImpl, clientIp);
const runCheck = options => runRawCheck({ clientIp, ...options });

const key = '00000000-0000-0000-0000-000000000000';
const now = new Date('2026-11-03T12:00:00Z');
const json = (data, headers = {}) => new Response(JSON.stringify(data), { headers });
const hotel = { isComplete: true, results: [{ images: [{}], rates: [{ bookUri: `https://example.invalid/?apiKey=${key}` }] }] };
const flight = { status: 'complete', results: [{ bookingOptions: [{ bookingUrl: `https://example.invalid/?apiKey=${key}`, displayPrice: { price: 123 } }] }] };

test('two searches use fixed sandbox, synthetic dates and summarize without URLs or credentials', async () => {
  const calls = [];
  const report = await runCheck({ key, now, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    assert.equal(url.origin, 'https://sandbox-en-us.kayakaffiliates.com');
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers['x-original-client-ip'], clientIp);
    assert.equal(url.searchParams.get('apiKey'), key);
    return json(options.method === 'GET' ? hotel : flight);
  } });
  assert.equal(report.requests, 2);
  assert.equal(report.hotels.state, 'complete');
  assert.equal(report.flights.withPrices, 1);
  assert.equal(report.hotels.withBookingLinks, 1);
  assert.equal(calls[0].url.searchParams.get('checkin'), '2026-12-03');
  assert.equal(calls[0].url.searchParams.get('responseOptions'), 'toprates,images');
  assert.equal(calls[0].url.searchParams.get('userTrackId'), calls[1].url.searchParams.get('userTrackId'));
  assert.equal(JSON.parse(calls[1].options.body).searchStartParameters.legs[0].date, '2026-12-03');
  assert.ok(!JSON.stringify(report).includes(key));
  assert.ok(!JSON.stringify(report).includes(clientIp));
  assert.ok(!JSON.stringify(report).includes('https://'));
});

test('polling keeps session cookies and flight cluster while retaining the request bound', async () => {
  let hotelCalls = 0;
  let flightCalls = 0;
  const report = await runCheck({ key, now, pause: async () => {}, fetchImpl: async (url, options) => {
    if (options.method === 'GET') {
      hotelCalls++;
      if (hotelCalls > 1) assert.equal(options.headers.cookie, 'session=opaque');
      return json({ isComplete: hotelCalls === 2, ...(hotelCalls === 2 ? { results: [] } : {}) }, { 'set-cookie': 'session=opaque; Secure; HttpOnly' });
    }
    flightCalls++;
    if (flightCalls > 1) {
      assert.equal(url.searchParams.get('cluster'), '4');
      assert.deepEqual(JSON.parse(options.body), { searchId: 'search_example' });
    }
    return json({ status: 'second-phase', searchId: 'search_example', cluster: '4', results: [] });
  } });
  assert.equal(report.requests, 5);
  assert.equal(report.hotels.state, 'empty');
  assert.equal(report.flights.state, 'partial');
});

test('redirect and authorization failures are not followed or retried', async () => {
  const report = await runCheck({ key, now, fetchImpl: async (_url, options) => options.method === 'GET'
    ? new Response('', { status: 302, headers: { location: `https://other.invalid/${key}` } })
    : new Response(key, { status: 401 }) });
  assert.equal(report.requests, 2);
  assert.equal(report.hotels.reason, 'redirect_blocked');
  assert.equal(report.flights.httpStatus, 401);
  assert.ok(!JSON.stringify(report).includes(key));
});

test('malformed or missing results are failures, not empty inventories', async () => {
  const report = await runCheck({ key, now, fetchImpl: async (_url, options) => options.method === 'GET'
    ? json({ isComplete: true, error: key }) : new Response(`not JSON ${key}`) });
  assert.equal(report.hotels.reason, 'invalid_results');
  assert.equal(report.flights.reason, 'invalid_json');
  assert.ok(!JSON.stringify(report).includes(key));
});

test('network errors never expose the request URL', async () => {
  const report = await runCheck({ key, now, fetchImpl: async url => { throw new Error(`failed: ${url}`); } });
  assert.equal(report.hotels.reason, 'transport_failure');
  assert.equal(report.requests, 2);
  assert.ok(!JSON.stringify(report).includes(key));
});

test('oversized bodies rejected both by declared length and streamed size', async () => {
  const report = await runCheck({ key, now, fetchImpl: async (_url, options) => options.method === 'GET'
    ? json(hotel, { 'content-length': String(9 * 1024 * 1024) })
    : new Response(new Uint8Array(8 * 1024 * 1024 + 1)) });
  assert.equal(report.hotels.reason, 'response_too_large');
  assert.equal(report.flights.reason, 'response_too_large');
});

test('missing key and unrecognized operation do not make requests', async () => {
  const fetchImpl = async () => { assert.fail('must not call fetch'); };
  const report = await runCheck({ now, fetchImpl });
  assert.equal(report.requests, 0);
  assert.equal(report.hotels.reason, 'missing_or_invalid_key');
  await assert.rejects(createClient(key, fetchImpl).request('https://other.invalid'), /invalid_operation/);
  assert.throws(() => createRawClient(key, fetchImpl, 'unknown'), /missing_or_invalid_client_ip/);
});

test('poll limit prevents unbounded requests and unknown status fails closed', async () => {
  const client = createClient(key, async () => json(hotel));
  for (let i = 0; i < 6; i++) await client.request('hotels');
  await assert.rejects(client.request('hotels'), /request_limit/);
  const report = await runCheck({ key, now, fetchImpl: async () => json({ status: 'unexpected', results: [] }) });
  assert.equal(report.flights.reason, 'invalid_search_status');
});
