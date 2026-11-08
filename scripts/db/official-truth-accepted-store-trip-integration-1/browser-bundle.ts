/** A test-only bounded CommonJS bundle of actual source and pinned installed
 * packages, using the already direct TypeScript dependency. No package install,
 * transpiled product replacement, fixture provider, esbuild or workflow change. */
import assert from 'node:assert/strict'
import { readFileSync,existsSync,statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname,resolve,relative } from 'node:path'
import { createHash } from 'node:crypto'
import ts from 'typescript'

export function nativeBrowserBundle(){
  const root=process.cwd(),entries=new Map<string,{id:number;code:string;imports:Record<string,number>}>()
  const pick=(path:string)=>{
    if(existsSync(path)&&statSync(path).isFile())return path
    for(const suffix of ['.ts','.tsx','.js','.cjs','.mjs','/index.ts','/index.tsx','/index.js'])if(existsSync(path+suffix))return path+suffix
    throw Error(`browser_source_missing:${relative(root,path)}`)
  }
  function visit(file:string):number {
    file=pick(file);const old=entries.get(file);if(old)return old.id
    assert(entries.size<512,'bounded client module graph')
    const entry={id:entries.size,code:'',imports:{} as Record<string,number>};entries.set(file,entry)
    const source=readFileSync(file,'utf8')
    entry.code=file.endsWith('.json')?`module.exports=${JSON.stringify(JSON.parse(source))};`:ts.transpileModule(source,{fileName:file,
      compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,allowJs:true}}).outputText
    const require=createRequire(file)
    for(const match of entry.code.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const name=match[1]!
      assert(!name.startsWith('node:')&&!['fs','path','crypto','http','https','stream','server-only','next/headers'].includes(name),`server module in mounted client graph: ${name}`)
      const target=name.startsWith('@/')?pick(resolve(root,name.slice(2))):name.startsWith('.')?pick(resolve(dirname(file),name)):require.resolve(name)
      assert(target.startsWith(root+'/')||target.includes('/node_modules/'),`non-client dependency ${name}`)
      entry.imports[name]=visit(target)
    }
    return entry.id
  }
  const main=visit(resolve('scripts/db/official-truth-accepted-store-trip-integration-1/browser-entry.tsx'))
  const definitions=[...entries.values()].map(value=>`${value.id}:[function(require,module,exports){\n${value.code}\n},${JSON.stringify(value.imports)}]`).join(',\n')
  const code=`(()=>{const process={env:{NODE_ENV:'production'}};const definitions={${definitions}};const cache={};function load(id){if(cache[id])return cache[id].exports;const value={exports:{}};cache[id]=value;const entry=definitions[id];entry[0](name=>{if(!(name in entry[1]))throw Error('unbound browser import');return load(entry[1][name])},value,value.exports);return value.exports}load(${main});})();`
  assert(Buffer.byteLength(code)<16_777_216,'bounded actual client bundle')
  return {code,files:[...entries.keys()].filter(path=>!path.includes('/node_modules/')).map(path=>({path:relative(root,path),sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})),
    sha256:createHash('sha256').update(code).digest('hex'),modules:entries.size}
}
