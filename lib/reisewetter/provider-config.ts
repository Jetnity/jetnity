/**
 * Deliberately invalid values in the isolated incident Preview may NOT count
 * as an active provider. The presence check remains conservative, while the
 * provider response and BG1 admission are still required for real data.
 */
export function weatherProviderConfigured(value: string | undefined): boolean {
  const key = value?.trim()
  return Boolean(key && !key.startsWith('intentionally-invalid'))
}
