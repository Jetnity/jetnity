import 'server-only'

/** #1206 is UNAPPLIED. The page must not claim a writable hosted CMS before
 * coordinated BG1, generated-type and closed scanner integration. */
export function cmsEditorRuntime(): 'unavailable' {
  return 'unavailable'
}
