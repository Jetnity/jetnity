// The string the root layout emits. Kill denial is baked from the server env.
// It is a boolean, not the raw environment value.

import { killSwitchDeniesCmp } from '@/lib/privacy/privacybee-cmp/freigabe'
import {
  CMP_BANNER_SRC,
  CMP_LICENSE_HOST,
  CMP_RELEASE_AUTHORIZED,
  CMP_WEBSITE_ID,
} from '@/lib/privacy/privacybee-cmp/vertrag'

export type BootstrapInput = {
  release: boolean
  killDenied: boolean
}

export function buildBootstrapSource(input: BootstrapInput): string {
  const releaseLiteral = input.release === true ? 'true' : 'false'
  const killLiteral = input.killDenied === true ? 'true' : 'false'
  return `(function(){
var root=window.__jetnityCmp||(window.__jetnityCmp={});
if(root.booted)return;
root.booted=1;
root.phase="denied";
root.order="deny-before-optional";
document.addEventListener("privacybee:ready",function(){root.ready=1});
document.addEventListener("privacybee:consent-changed",function(){root.changed=1});
if(${releaseLiteral}!==true)return;
if(${killLiteral}===true)return;
var host=String(location.hostname||"").toLowerCase();
if(host!==${JSON.stringify(CMP_LICENSE_HOST)})return;
var url=${JSON.stringify(CMP_BANNER_SRC)};
if(document.querySelector('script[data-jetnity-cmp="banner"]'))return;
var script=document.createElement("script");
script.src=url;
script.async=false;
script.setAttribute("website-id",${JSON.stringify(CMP_WEBSITE_ID)});
script.setAttribute("data-jetnity-cmp","banner");
(document.head||document.documentElement).appendChild(script);
root.scripts=(root.scripts||0)+1;
})();`
}

export function productionBootstrapSource(
  killSwitch: string | null | undefined = process.env.PRIVACYBEE_KILL_SWITCH,
): string {
  return buildBootstrapSource({
    release: CMP_RELEASE_AUTHORIZED,
    killDenied: killSwitchDeniesCmp(killSwitch),
  })
}
