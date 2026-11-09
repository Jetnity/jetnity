import { accessSync, constants, statSync } from 'node:fs'

const SYSTEM_BROWSERS = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']

/** Select before launch. A launch failure never tries a second executable. */
export function selectU1SystemBrowser(candidates = SYSTEM_BROWSERS) {
  for (const candidate of candidates) {
    try {
      if (!statSync(candidate).isFile()) continue
      accessSync(candidate, constants.X_OK)
      return candidate
    } catch { /* A missing/non-executable candidate was not launched. */ }
  }
  throw new Error('No executable system browser is available. U1 UI proof fails; it is not skipped.')
}
