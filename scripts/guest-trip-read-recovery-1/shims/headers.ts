function store() {
  return {
    get() {
      return undefined
    },
    getAll() {
      return []
    },
    set() {},
    delete() {},
    has() {
      return false
    },
  }
}

export async function cookies() {
  return store()
}

export async function headers() {
  return new Headers()
}

export async function draftMode() {
  return { isEnabled: false, enable() {}, disable() {} }
}
