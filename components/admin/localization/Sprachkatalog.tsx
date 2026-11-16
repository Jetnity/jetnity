'use client'

import { useState } from 'react'
import Link from 'next/link'
import { einstellungenText } from '@/lib/localization/einstellungen-texte'
import { ADMIN_SPRACHKATALOG } from '@/lib/localization/admin-sprachkatalog'
import type { UiSprache } from '@/lib/localization/ui-sprache'

export default function Sprachkatalog({ sprache }: { sprache: UiSprache }) {
  const [suche, setSuche] = useState('')
  const nadel = suche.trim().toLocaleLowerCase('de')
  const zeilen = ADMIN_SPRACHKATALOG.filter((row) => [row.key, row.de, row.en].some((text) => text.toLocaleLowerCase('de').includes(nadel)))
  return (
    <section lang={sprache} aria-labelledby="sprachkatalog-title" className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-4 [overflow-wrap:anywhere] sm:p-6">
      <header className="min-w-0 max-w-3xl">
        <h1 id="sprachkatalog-title" className="text-2xl font-semibold">{einstellungenText(sprache, 'catalog.title')}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{einstellungenText(sprache, 'catalog.intro')}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{einstellungenText(sprache, 'catalog.scope')}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{einstellungenText(sprache, 'catalog.workflow')}</p>
        <Link href="/admin/settings" className="mt-3 inline-flex min-h-11 min-w-0 max-w-full items-center whitespace-normal rounded-xl text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20">{einstellungenText(sprache, 'catalog.settingsLink')}</Link>
      </header>
      <dl className="flex flex-wrap gap-6"><div className="min-w-0 max-w-full"><dt className="text-sm text-muted-foreground">{einstellungenText(sprache, 'catalog.count')}</dt><dd className="text-2xl font-semibold">{ADMIN_SPRACHKATALOG.length}</dd></div><div className="min-w-0 max-w-full"><dt className="text-sm text-muted-foreground">{einstellungenText(sprache, 'catalog.languages')}</dt><dd className="mt-1 font-medium"><span lang="de">Deutsch</span> · <span lang="en">English</span></dd></div></dl>
      <div><label htmlFor="sprachkatalog-suche" className="block text-sm font-medium">{einstellungenText(sprache, 'catalog.search')}</label><input id="sprachkatalog-suche" type="search" value={suche} onChange={(event) => setSuche(event.target.value)} className="mt-2 min-h-11 w-full max-w-xl rounded-xl border border-border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20" /></div>
      {zeilen.length === 0 ? <p role="status" className="text-sm text-muted-foreground">{einstellungenText(sprache, 'catalog.empty')}</p> : <div className="min-w-0 overflow-x-auto rounded-xl border border-border"><table className="w-full table-fixed text-left text-sm"><caption className="sr-only">{einstellungenText(sprache, 'catalog.title')}</caption><thead className="bg-muted/50"><tr>{(['catalog.key', 'catalog.german', 'catalog.english'] as const).map((key) => <th key={key} scope="col" className="w-1/3 break-words p-3 align-top">{einstellungenText(sprache, key)}</th>)}</tr></thead><tbody>{zeilen.map((row) => <tr key={row.key} className="border-t border-border"><th scope="row" className="break-all p-3 align-top font-mono font-normal">{row.key}</th><td lang="de" className="break-words p-3 align-top">{row.de}</td><td lang="en" className="break-words p-3 align-top">{row.en}</td></tr>)}</tbody></table></div>}
    </section>
  )
}
