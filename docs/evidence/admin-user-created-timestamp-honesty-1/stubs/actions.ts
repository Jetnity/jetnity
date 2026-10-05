const calls: string[] = []

export function createdHonestyActionCalls() {
  return calls.slice()
}

export async function setUserRole() {
  calls.push('setUserRole')
  throw new Error('synthetic stub: role mutation is out of scope')
}

export async function setUserStatus() {
  calls.push('setUserStatus')
  throw new Error('synthetic stub: status mutation is out of scope')
}
