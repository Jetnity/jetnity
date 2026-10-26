export type MutationCall = {
  name: 'setUserRole' | 'setUserStatus'
  userId: string
  value: string
}

type Mode = 'resolve' | 'reject' | 'transport' | 'hang'

type Hang = {
  resolve: () => void
  reject: (error: Error) => void
}

type Store = {
  calls: MutationCall[]
  hangs: Hang[]
  mode: Mode
  message: string
}

function store(): Store {
  const win = globalThis as { __mutationActionStore?: Store }
  if (!win.__mutationActionStore) {
    win.__mutationActionStore = { calls: [], hangs: [], mode: 'resolve', message: 'Abgelehnt.' }
  }
  return win.__mutationActionStore
}

async function settle(): Promise<void> {
  const current = store()
  if (current.mode === 'reject') throw new Error(current.message)
  if (current.mode === 'transport') throw new TypeError('Failed to fetch')
  if (current.mode === 'hang') {
    await new Promise<void>((resolve, reject) => {
      current.hangs.push({ resolve, reject })
    })
  }
}

export async function setUserRole(userId: string, role: string): Promise<void> {
  store().calls.push({ name: 'setUserRole', userId, value: role })
  await settle()
}

export async function setUserStatus(userId: string, status: string): Promise<void> {
  store().calls.push({ name: 'setUserStatus', userId, value: status })
  await settle()
}

export function mutationCalls(): MutationCall[] {
  return store().calls.map((call) => ({ ...call }))
}

export function setMutationMode(mode: Mode, message?: string) {
  store().mode = mode
  if (message) store().message = message
}

export function resolveOldestHang() {
  store().hangs.shift()?.resolve()
}

export function rejectOldestHang(message: string) {
  store().hangs.shift()?.reject(new Error(message))
}
