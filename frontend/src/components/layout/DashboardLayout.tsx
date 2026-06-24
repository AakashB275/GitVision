import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import TopNav from './TopNav'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  activeSidebarItem?: 'explorer' | 'dependencies' | 'search' | 'settings' | 'account'
  // activeNavLink?: 'docs' | 'architecture' | 'pricing'
  sidebarContent?: ReactNode
  repoName?: string
  branchName?: string
  onSearchClick?: () => void
}
const SIDEBAR_ROUTES = ['/project','/home','/settings']

export default function DashboardLayout({
  children,
  activeSidebarItem = 'explorer',
  // activeNavLink = 'architecture',
  sidebarContent,
  repoName,
  branchName,
  onSearchClick,
}: DashboardLayoutProps) {
  const location = useLocation()
  const showSidebar = SIDEBAR_ROUTES.includes(location.pathname)

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav variant="dashboard" onSearchClick={onSearchClick} />
      <div className="flex min-h-0 flex-1">
        {showSidebar && <Sidebar activeItem={activeSidebarItem} repoName={repoName} branchName={branchName}>{sidebarContent}</Sidebar>}
        <main className="relative min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}