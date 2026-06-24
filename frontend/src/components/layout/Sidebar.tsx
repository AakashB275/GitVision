import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { useUser } from '@clerk/react'
import {
  GitBranch,
  Search,
  Settings,
  HelpCircle,
  MessageSquare,
  Plug,
  Check,
  PanelsLeftRight,
} from 'lucide-react'

interface SidebarProps {
  activeItem?: 'explorer' | 'dependencies' |'settings'
  children?: ReactNode
  repoName?: string
  branchName?: string
}

const navItems = [
  { id: 'dependencies' as const, label: 'Dependencies', icon: GitBranch, to: '/project' },
  { id: 'explorer' as const, label: 'Explorer', icon: Search },
  { id: 'settings' as const, label: 'Settings', icon: Settings, to: '/settings' },
]

export default function Sidebar({ activeItem = 'dependencies', children, repoName, branchName = 'main' }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { isLoaded, user } = useUser()

  const githubAccount = user?.externalAccounts.find((acc) => acc.provider === 'github')
  const isGithubConnected = Boolean(githubAccount)

  async function handleConnectGithub() {
    if (!isLoaded || !user || isGithubConnected) return

    try {
      const account = await user.createExternalAccount({
        strategy: 'oauth_github',
        redirectUrl: window.location.href,
      })

      const redirectUrl = account.verification?.externalVerificationRedirectURL
      if (redirectUrl) {
        window.location.href = redirectUrl.toString()
      }
    } catch (err) {
      console.error('Failed to start GitHub connection:', err)
    }
  }

  function toggleCollapsed() {
    setCollapsed((prev) => !prev)
  }

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-outline-variant/40 bg-surface-container-lowest transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className={`border-b border-outline-variant/40 py-4 ${collapsed ? 'px-2' : 'px-4'}`}>
        <div className={collapsed ? 'flex flex-col items-center gap-3' : 'flex items-center gap-3'}>
          
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary">{repoName || 'No Repository'}</p>
              <p className="truncate text-xs text-on-surface-variant">{branchName}</p>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className={`relative z-10 inline-flex shrink-0 items-center justify-center rounded-lg border border-outline-variant/50 p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface ${
              collapsed ? '' : 'ml-auto'
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <PanelsLeftRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4">
        {navItems.map(({ id, label, icon: Icon, to }) => (
          <NavLink
            key={id}
            to={to ?? '#'}
            title={collapsed ? label : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              collapsed ? 'justify-center' : ''
            } ${
              activeItem === id
                ? 'bg-surface-container-high text-primary'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {children && !collapsed && (
        <div className="flex-1 overflow-y-auto border-t border-outline-variant/40 px-3 py-3">{children}</div>
      )}

      <div className="border-t border-outline-variant/40 px-3 py-4">
        <button
          onClick={handleConnectGithub}
          disabled={!isLoaded || isGithubConnected}
          title={collapsed ? (isGithubConnected ? 'GitHub Connected' : 'Connect GitHub') : undefined}
          className={`mb-4 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            collapsed ? 'justify-center' : ''
          } ${
            isGithubConnected
              ? 'cursor-default border-outline-variant/30 bg-surface-container text-on-surface-variant opacity-70'
              : 'border-outline-variant/50 bg-surface-container text-on-surface hover:border-primary/50'
          } disabled:cursor-not-allowed`}
        >
          {isGithubConnected ? (
            <Check className="h-4 w-4 shrink-0 text-secondary" />
          ) : (
            <Plug className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && (isGithubConnected ? 'GitHub Connected' : 'Connect GitHub')}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-4 px-2">
            <button className="flex items-center gap-1.5 text-xs text-on-surface-variant transition-colors hover:text-on-surface">
              <HelpCircle className="h-3.5 w-3.5" />
              Help
            </button>
            <button className="flex items-center gap-1.5 text-xs text-on-surface-variant transition-colors hover:text-on-surface">
              <MessageSquare className="h-3.5 w-3.5" />
              Feedback
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}