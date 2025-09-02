'use client'

import * as React from 'react'
import Sidebar, {
  SidebarHeader, SidebarBrand, SidebarSearch,
  SidebarFromConfig, SidebarSeparator, SidebarFooter,
  SidebarUserCard, NotificationsButton, CommandPalette,
  type CommandAction, type NavNode,
} from '@/components/ui/Sidebar'
import {
  LayoutDashboard, FileText, Images, PlayCircle,
  BarChart3, Wallet, Settings, HelpCircle, Users
} from 'lucide-react'

export default function CreatorSidebar() {
  const [q, setQ] = React.useState('')

  const nav: NavNode[] = [
    { type: 'section', id: 'main', title: 'Creator', children: [
      { type: 'item', id: 'dash', label: 'Dashboard', href: '/creator/creator-dashboard', icon: LayoutDashboard, exact: true },
      { type: 'item', id: 'studio', label: 'Media-Studio', href: '/creator/media', icon: PlayCircle },
      { type: 'item', id: 'assets', label: 'Medien', href: '/creator/assets', icon: Images },
    ]},
    { type: 'group', id: 'content', label: 'Inhalte', icon: FileText, defaultOpen: true, children: [
      { type: 'item', id: 'stories', label: 'Stories', href: '/creator/stories' },
      { type: 'item', id: 'guides',  label: 'Guides',  href: '/creator/guides' },
      { type: 'item', id: 'reviews', label: 'Reviews', href: '/creator/reviews' },
    ]},
    { type: 'group', id: 'insights', label: 'Insights', icon: BarChart3, children: [
      { type: 'item', id: 'analytics', label: 'Analytics', href: '/creator/analytics' },
      { type: 'item', id: 'audience',  label: 'Audience',  href: '/creator/audience', icon: Users },
      { type: 'item', id: 'earnings',  label: 'Earnings',  href: '/creator/earnings', icon: Wallet },
    ]},
    { type: 'separator', id: 'sep' },
    { type: 'item', id: 'settings', label: 'Einstellungen', href: '/creator/settings', icon: Settings },
    { type: 'item', id: 'help',      label: 'Hilfe',         href: '/help/creator',   icon: HelpCircle },
  ]

  const actions: CommandAction[] = [
    { id: 'new-upload', label: 'Neuen Upload starten', onRun: () => (window.location.href = '/creator/media/new') },
    { id: 'open-settings', label: 'Einstellungen öffnen', onRun: () => (window.location.href = '/creator/settings') },
  ]

  return (
    <>
      <Sidebar ariaLabel="Creator Navigation">
        <SidebarHeader>
          <SidebarBrand title="Jetnity Creator" />
          <NotificationsButton />
        </SidebarHeader>

        <SidebarSearch value={q} onChange={setQ} placeholder="Suchen…" />

        <SidebarFromConfig nodes={nav} />
        <SidebarSeparator />

        <SidebarFooter>
          <SidebarUserCard name="Sasa" email="you@example.com" />
        </SidebarFooter>
      </Sidebar>

      {/* ⌘/Ctrl+K */}
      <CommandPalette actions={actions} />
    </>
  )
}
