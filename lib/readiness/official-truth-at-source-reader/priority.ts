// The real 50-pass priority is user data, never inferred from country names.
const PREFIX = Object.freeze(['IN','TR','CN','DE','PL','IT','US','UA','RO','FR'])
const PRIORITY_MAX_BYTES = 262144

/** Strict RFC-4180-like CSV framing. No external file or network access. */
function rowsFromCsv(raw: string): string[][] | null {
  if (typeof raw !== 'string' || Buffer.byteLength(raw,'utf8') > PRIORITY_MAX_BYTES || raw.includes('\0')) return null
  const text = raw.replace(/^\uFEFF/,'')
  const rows: string[][] = []
  let row: string[]=[],field='',quoted=false,closed=false
  for(let i=0;i<text.length;i++){
    const c=text[i]
    if(quoted){
      if(c==='"' && text[i+1]==='"'){field+='"';i++}
      else if(c==='"'){quoted=false;closed=true}
      else field+=c
      continue
    }
    if(c===','||c==='\n'||c==='\r'){
      row.push(field);field='';closed=false
      if(c!==','){
        if(c==='\r' && text[i+1]==='\n')i++
        rows.push(row);row=[]
      }
      continue
    }
    if(c==='"'){
      if(field || closed)return null
      quoted=true
    }else{
      if(closed)return null
      field+=c
    }
  }
  if(quoted)return null
  if(field.length || row.length){row.push(field);rows.push(row)}
  return rows
}

/** Parsed 50 ranked passports or a fail-closed rejection; never a visa result. */
export function readAtPassportPriority(raw: string):
 Readonly<{ok:true;codes:readonly string[]}>|Readonly<{ok:false;reason:'invalid_priority_file'}> {
  const fail=()=>Object.freeze({ok:false as const,reason:'invalid_priority_file' as const})
  const rows=rowsFromCsv(raw)
  if(!rows || rows.length!==51)return fail()
  const header=rows.shift()!
  if(header.length!==6 || new Set(header).size!==6 || !header.includes('rank') || !header.includes('nationality_iso2'))return fail()
  const ri=header.indexOf('rank'),ci=header.indexOf('nationality_iso2')
  if(rows.some(row=>row.length!==header.length))return fail()
  const ranks=rows.map(row=>Number(row[ri]))
  if(ranks.some((rank,i)=>!Number.isInteger(rank)||rank!==i+1))return fail()
  const codes=rows.map(row=>row[ci])
  if(codes.some(code=>!code|| !/^[A-Z]{2}$/.test(code))
    || new Set(codes).size!==50
    || !codes.includes('CH')
    || PREFIX.some((code,i)=>codes[i]!==code))return fail()
  return Object.freeze({ok:true as const,codes:Object.freeze(codes)})
}
