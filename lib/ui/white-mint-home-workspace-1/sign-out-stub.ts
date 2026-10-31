/** Replaces the server sign-out action inside the local fixture. It never calls Auth. */
export async function signOutAction(): Promise<{ ok: false }> {
  return { ok: false }
}
