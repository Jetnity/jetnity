import { transportState } from './effective-target-recorder.mjs'

export async function cookies() {
  transportState().cookies += 1
  return {
    get() {
      return undefined
    },
    getAll() {
      return []
    },
    set() {},
    delete() {},
  }
}
