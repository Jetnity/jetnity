export async function signOutToAdminLoginAction() {
  return { ok: true as const, ziel: '/admin/login' as const }
}

export async function signOutAction() {
  return { ok: true as const, ziel: '/' as const }
}
