import type { ReactNode } from 'react'
import TopNav from './TopNav'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  activeSidebarItem?: 'explorer' | 'dependencies' | 'search' | 'settings' | 'account'
  // activeNavLink?: 'docs' | 'architecture' | 'pricing'
  sidebarContent?: ReactNode
}

export default function DashboardLayout({
  children,
  activeSidebarItem = 'explorer',
  // activeNavLink = 'architecture',
  sidebarContent,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav variant="dashboard" />
      <div className="flex min-h-0 flex-1">
        <Sidebar activeItem={activeSidebarItem}>{sidebarContent}</Sidebar>
        <main className="relative min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
