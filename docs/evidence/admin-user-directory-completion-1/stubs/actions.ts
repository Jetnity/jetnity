import { recordUsersNavAction } from './next-navigation'

export async function setUserRole() {
  recordUsersNavAction('setUserRole')
}

export async function setUserStatus() {
  recordUsersNavAction('setUserStatus')
}
