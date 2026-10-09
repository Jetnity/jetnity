// UI adaptation for the unchanged #905 persistence assertions: reveal a field's group
// through real buttons before manipulating it. Reads still inspect retained hidden drafts.
export function editLabel(page, name, options) {
  const locator=page.getByLabel(name,options)
  return new Proxy(locator,{get(target,key){
    if(['fill','check','uncheck','selectOption','focus','press'].includes(key))return async(...args)=>{
      const group=await target.evaluate(el=>el.closest('[id^="edit-group-"]')?.id)
      const names={'edit-group-grunddaten':'1. Grunddaten','edit-group-zeitraum':'2. Zeitraum','edit-group-etappen':'3. Etappen'}
      if(names[group])await page.getByRole('button',{name:names[group],exact:true}).click()
      const collapsed=await target.evaluate(el=>!!el.closest('details:not([open])'))
      if(collapsed)await page.getByText('Interessen und Reisewunsch',{exact:true}).click()
      return target[key](...args)
    }
    return typeof target[key]==='function'?target[key].bind(target):target[key]
  }})
}
