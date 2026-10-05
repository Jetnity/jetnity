import { recordUsersNavAction } from './next-navigation'

export async function setUserRole() {
  recordUsersNavAction('setUserRole')
  throw new Error('synthetic stub: role mutation is out of scope')
}

export async function setUserStatus() {
  recordUsersNavAction('setUserStatus')
  throw new Error('synthetic stub: status mutation is out of scope')
}
