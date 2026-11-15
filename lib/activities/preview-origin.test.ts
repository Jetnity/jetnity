import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activityPreviewOrigin } from './preview-origin'

test('preview shell accepts only the dedicated owned HTTPS origin', () => {
  const expected = 'https://jetnity-flight-widget-abc123-jetnity-e1b93c82.vercel.app'
  assert.equal(activityPreviewOrigin(expected), expected)
  for (const value of ['', 'https://evil.example', 'https://jetnity.com', expected + '/path', expected + '?token=secret', expected + '.evil.example', expected.replace('https:', 'http:'), expected.replace('https://', 'https://name:secret@')]) assert.equal(activityPreviewOrigin(value), '', value)
})
