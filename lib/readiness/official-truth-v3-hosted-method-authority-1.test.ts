import test from 'node:test'
import { runHostedMethodAuthorityNative } from '../../scripts/db/official-truth-v3-hosted-method-authority-1/native'

// Mandatory existing test:core discovery. No optional skip and no remote target.
test('HMA1 exact hosted-creator MA1 composition and recovery', { timeout: 240_000 }, runHostedMethodAuthorityNative)
