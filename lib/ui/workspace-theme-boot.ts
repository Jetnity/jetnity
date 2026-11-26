// Pre-hydration workspace theme. The stored preference is browser-local.
// "green" was the old dark display and becomes neutral dark. No account,
// cookie, auth or network. The same key is read again after hydration.

export const WORKSPACE_THEME_KEY = 'jetnity:workspace-theme:v1'

export const WORKSPACE_THEME_BOOT =
  '(function(){try{var k=' +
  JSON.stringify(WORKSPACE_THEME_KEY) +
  ';var r=localStorage.getItem(k);if(r==="green"){try{localStorage.setItem(k,"dark")}catch(e){}r="dark"}' +
  'if(r==="dark")document.documentElement.setAttribute("data-workspace-theme","dark")' +
  '}catch(e){}})();'
