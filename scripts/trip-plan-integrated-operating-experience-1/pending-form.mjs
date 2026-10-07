import assert from 'node:assert/strict'

// Observe before asserting, so the RED run also proves what the late response discards.
export async function probePendingForm(page,form,name) {
  assert.equal(await form.getAttribute('aria-busy'),'true')
  const fields=await form.locator('input,select,textarea').evaluateAll(nodes=>nodes.map(el=>({label:el.closest('label')?.textContent.split('\n')[0],disabled:el.matches(':disabled'),value:el.value})))
  const title=form.getByLabel('Ort oder Aktivität'),before=await title.inputValue()
  // Actual keyboard attempt, not a forced DOM value mutation. Disabled controls cannot take focus.
  await title.focus();await page.keyboard.press('End');await page.keyboard.type(' B')
  const during=await title.inputValue()
  const status=await form.getByRole('status').allTextContents()
  return {name,fields,before,during,status,locked:fields.length>=7&&fields.every(f=>f.disabled)&&during===before&&status.some(s=>s.includes('gespeichert'))}
}
export function assertPendingForms(observations) {
  assert(observations.length>=3)
  assert(observations.every(o=>o.locked),`R1/F2: pending fields must be disabled; ${JSON.stringify(observations)}`)
}
export async function delayedAccountSave(page,form,tripId,name) {
  let release,capture,failCapture,finished
  const held=new Promise((resolve,reject)=>{capture=resolve;failCapture=reject})
  const gate=new Promise(resolve=>{release=resolve})
  const done=new Promise(resolve=>{finished=resolve})
  let armed=true
  const pattern=`**/reisen/${tripId}*`
  const handler=async route=>{
    if(!armed||route.request().method()!=='POST'||!route.request().headers()['next-action'])return route.continue()
    armed=false
    try { const response=await route.fetch();capture();await gate;await route.fulfill({response}) }
    catch(error){failCapture(error);await route.abort()}
    finally {finished()}
  }
  await page.route(pattern,handler)
  try {
    await form.getByRole('button',{name:'Speichern',exact:true}).click()
    await held
    return await probePendingForm(page,form,name)
  } finally {release();await done;await page.unroute(pattern,handler)}
}
