export function cookies() {
  return {
    get: () => undefined,
    getAll: () => [],
    set: () => undefined,
    delete: () => undefined,
  }
}

export function headers() {
  return new Headers()
}

export function draftMode() {
  return { isEnabled: false, enable: () => undefined, disable: () => undefined }
}
