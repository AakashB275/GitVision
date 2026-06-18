import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import {
  FolderOpen,
  GitBranch,
  Search,
  Settings,
  User,
  HelpCircle,
  MessageSquare,
  Plug,
} from 'lucide-react'

interface SidebarProps {
  activeItem?: 'explorer' | 'dependencies' | 'search' | 'settings' | 'account'
  children?: ReactNode
}

const navItems = [
  { id: 'explorer' as const, label: 'Explorer', icon: FolderOpen, to: '/project' },
  { id: 'dependencies' as const, label: 'Dependencies', icon: GitBranch, to: '/project' },
  { id: 'search' as const, label: 'Search', icon: Search, to: '/project' },
  { id: 'settings' as const, label: 'Settings', icon: Settings, to: '/settings' },
  { id: 'account' as const, label: 'Account', icon: User, to: '/settings' },
]

export default function Sidebar({ activeItem = 'explorer', children }: SidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-outline-variant/40 bg-surface-container-lowest">
      <div className="border-b border-outline-variant/40 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-xs font-semibold text-primary">
            PA
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Project Alpha</p>
            <p className="text-xs text-on-surface-variant">main branch</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4">
        {navItems.map(({ id, label, icon: Icon, to }) => (
          <NavLink
            key={id}
            to={to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeItem === id
                ? 'bg-surface-container-high text-primary'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {children && <div className="flex-1 overflow-y-auto border-t border-outline-variant/40 px-3 py-3">{children}</div>}

      <div className="border-t border-outline-variant/40 px-3 py-4">
        <button className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-sm text-on-surface transition-colors hover:border-primary/50">
          <Plug className="h-4 w-4" />
          Connect GitHub
        </button>
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
      </div>
    </aside>
  )
}
