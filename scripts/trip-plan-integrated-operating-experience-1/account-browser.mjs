import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { assertPendingForms, delayedAccountSave } from './pending-form.mjs'
import { chromium } from 'playwright'
import { createServerClient } from '@supabase/ssr'
export async function accountBrowser({url,anon,db,tripId,dayId}) {
  const base=process.env.AUDIT_BASE||'http://127.0.0.1:3497'
  assert(['127.0.0.1','localhost'].includes(new URL(base).hostname))
  const session=(await db.auth.getSession()).data.session
  assert(session)
  const jar=new Map()
  const ssr=createServerClient(url,anon,{cookies:{getAll:()=>[...jar.values()],setAll:values=>values.forEach(v=>jar.set(v.name,v))}})
  assert.ifError((await ssr.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token})).error)
  const browser=await chromium.launch({headless:true,channel:'chrome'})
  let page, step='initial'
  const pending=[]
  try{
    const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'})
    await ctx.addCookies([...jar.values()].map(c=>({name:c.name,value:c.value,url:base,httpOnly:false,sameSite:'Lax'})))
    page=await ctx.newPage();page.setDefaultTimeout(15000)
    const errors=[];page.on('pageerror',e=>errors.push(e.message))
    await ctx.route('**/*',route=>{
      const origin=new URL(route.request().url()).origin
      if(![base,url].includes(origin))return route.abort()
      return route.continue()
    })
    await page.goto(`${base}/reisen/${tripId}?ansicht=plan&tag=${dayId}`)
    await page.locator('[data-plan-hinzufuegen]').waitFor()
    assert.match(await page.locator('main').innerText(),/deinem Konto gespeichert/)
    await page.locator('[data-plan-hinzufuegen]').click()
    let form=page.getByRole('form',{name:'Punkt hinzufügen',exact:true})
    await form.getByLabel('Ort oder Aktivität').fill('Account Browser Termin')
    await form.getByLabel('Anfangsdatum, optional').fill('2026-10-07')
    await form.getByLabel('Anfangszeit, optional').fill('14:00')
    await form.getByLabel('Enddatum, optional').fill('2026-10-07')
    await form.getByLabel('Endzeit, optional').fill('15:00')
    pending.push(await delayedAccountSave(page,form,tripId,'create success / Art and content'))
    await form.waitFor({state:'detached'})
    pending.at(-1).closedAfterSuccess=true
    const read=await db.from('trip_items').select('*').eq('trip_id',tripId).eq('title','Account Browser Termin').single();assert.ifError(read.error)
    step='edit after create';const id=read.data.id;assert.equal(read.data.ends_at,'15:00:00')
    await page.reload();await page.getByRole('button',{name:'Account Browser Termin bearbeiten',exact:true}).click()
    form=page.getByRole('form',{name:'Punkt bearbeiten: Account Browser Termin',exact:true})
    assert.equal(await form.getByLabel('Anfangszeit, optional').inputValue(),'14:00')
    await form.getByLabel('Anfangszeit, optional').fill('14:15')
    pending.push(await delayedAccountSave(page,form,tripId,'edit success / day assignment and content'))
    await form.waitFor({state:'detached'});pending.at(-1).closedAfterSuccess=true
    const after=await db.from('trip_items').select('*').eq('id',id).single();assert.ifError(after.error);assert.equal(after.data.starts_at,'14:15:00');assert.notEqual(after.data.updated_at,read.data.updated_at)
    await page.reload();await page.getByRole('button',{name:'Account Browser Termin bearbeiten',exact:true}).click()
    form=page.getByRole('form',{name:'Punkt bearbeiten: Account Browser Termin',exact:true})
    assert.equal(await form.getByLabel('Anfangszeit, optional').inputValue(),'14:15')
    step='stale draft';
    // True concurrent persisted update makes the open UI draft stale.
    assert.ifError((await db.from('trip_items').update({note:'Concurrent synthetic note'}).eq('id',id)).error)
    await form.getByLabel('Ort oder Aktivität').fill('Stale draft must stay')
    pending.push(await delayedAccountSave(page,form,tripId,'edit failure / real stale version'))
    await form.getByRole('alert').waitFor()
    pending.at(-1).afterError=await form.getByLabel('Ort oder Aktivität').inputValue()
    assert.equal(pending.at(-1).afterError,pending.at(-1).during)
    assert.equal(await form.locator('input,select,textarea').evaluateAll(nodes=>nodes.every(el=>!el.matches(':disabled'))),true)
    assert.equal(await form.getAttribute('aria-busy'),'false')
    assert(!(await page.getByRole('status').allTextContents()).some(s=>s.includes('Planpunkt gespeichert')))
    assert.equal((await db.from('trip_items').select('title,note').eq('id',id).single()).data.title,'Account Browser Termin')
    await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='alert')
    await form.screenshot({path:'docs/evidence/trip-plan-integrated-operating-experience-1/screens/account-stale-draft.png'})
    step='escape after error';await page.keyboard.press('Escape');await form.waitFor({state:'detached'});await page.reload()
    await page.getByRole('button',{name:'Account Browser Termin bearbeiten',exact:true}).click()
    form=page.getByRole('form',{name:'Punkt bearbeiten: Account Browser Termin',exact:true})
    await form.getByLabel('Ort oder Aktivität').fill('Saved after navigation')
    step='late response';let release, captured=false, delayNext=true
    const gate=new Promise(resolve=>{release=resolve})
    await page.route(`**/reisen/${tripId}*`,async route=>{
      if(delayNext&&route.request().method()==='POST'&&route.request().headers()['next-action']){
        delayNext=false;const response=await route.fetch();captured=true;await gate;await route.fulfill({response});return
      }
      return route.continue()
    })
    await form.getByRole('button',{name:'Speichern',exact:true}).click()
    for(let i=0;i<100&&!captured;i++)await new Promise(r=>setTimeout(r,50))
    assert(captured,'Actual server action response was captured after real persistence')
    await page.locator('[data-plan-tag-naechster]').click();await page.locator('[data-plan-leer]').waitFor()
    const selectedDay=new URL(page.url()).searchParams.get('tag');assert.notEqual(selectedDay,dayId)
    await page.locator('[data-plan-hinzufuegen]').click()
    const newerForm=page.getByRole('form',{name:'Punkt hinzufügen',exact:true})
    await newerForm.getByLabel('Ort oder Aktivität').fill('New day draft survives')
    release()
    await page.waitForTimeout(400)
    assert.equal(new URL(page.url()).searchParams.get('tag'),selectedDay)
    assert.equal(await newerForm.getByLabel('Ort oder Aktivität').inputValue(),'New day draft survives')
    assert.equal(await newerForm.count(),1)
    await newerForm.getByRole('button',{name:'Speichern',exact:true}).click();await newerForm.waitFor({state:'detached'})
    const added=await db.from('trip_items').select('day_id').eq('trip_id',tripId).eq('title','New day draft survives').single();assert.ifError(added.error);assert.equal(added.data.day_id,selectedDay)
    await page.reload();await page.getByRole('button',{name:'New day draft survives bearbeiten',exact:true}).waitFor()
    assert.deepEqual(errors,[])
    assertPendingForms(pending)
    await ctx.close()
  } catch(error) { if(page)await page.screenshot({path:'docs/evidence/trip-plan-integrated-operating-experience-1/screens/account-diagnostic.png'});throw new Error(`${step}: ${error.message}; alerts: ${page?await page.locator('[role=alert]').allTextContents():[]}`) } finally {writeFileSync('docs/evidence/trip-plan-integrated-operating-experience-1/r1-account-editor.json',JSON.stringify({boundary:'Real local GoTrue/PostgREST/RLS and production Server Actions; response delivery gate only',pending},null,2)+'\n');await browser.close();await ssr.auth.stopAutoRefresh()}
}
