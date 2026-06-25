import { Link } from 'react-router'
import { Search, LayoutDashboard } from 'lucide-react'
import { Show, SignInButton, UserButton, SignUpButton, useAuth } from '@clerk/react'

interface TopNavProps {
  variant?: 'landing' | 'dashboard'
  activeLink?: 'docs' | 'architecture' | 'pricing' | 'dashboard'
  onSearchClick?: () => void
}

export default function TopNav({ variant = 'landing', activeLink, onSearchClick }: TopNavProps) {
  const { isSignedIn } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b border-outline-variant/40 bg-surface-container-lowest px-6">

      <Link
        to={isSignedIn ? '/dashboard' : '/'}
        className="shrink-0 text-lg font-bold tracking-tight"
      >
        <span className="text-on-surface">Git</span>
        <span className="text-primary">Vision</span>
      </Link>

      {variant === 'dashboard' && (
        <button
          type="button"
          onClick={onSearchClick}
          className="relative mx-auto flex w-full max-w-md items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-low py-2 pl-3 pr-4 text-sm text-on-surface-variant/60 transition-colors hover:border-primary/50 hover:text-on-surface-variant cursor-pointer"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Ask about this codebase...</span>
        </button>
      )}

      <nav className="ml-auto flex items-center gap-4">

        {variant === 'dashboard' && (
          <select className="rounded-md border border-outline-variant/50 bg-surface-container px-3 py-1.5 text-sm text-on-surface focus:border-primary/50 focus:outline-none">
            <option>Branch: main</option>
          </select>
        )}

        {variant === 'landing' && (
          isSignedIn ? (
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 text-sm transition-colors hover:text-on-surface ${
                activeLink === 'dashboard'
                  ? 'border-b-2 border-primary pb-0.5 text-on-surface'
                  : 'text-on-surface-variant'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <span
              title="Sign in to access your dashboard"
              className="flex cursor-not-allowed items-center gap-1.5 text-sm text-on-surface-variant/40 select-none"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </span>
          )
        )}

        {variant === 'dashboard' && (
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 text-sm transition-colors hover:text-on-surface ${
              activeLink === 'dashboard'
                ? 'border-b-2 border-primary pb-0.5 text-on-surface'
                : 'text-on-surface-variant'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        )}

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-lg border border-outline-variant/60 px-4 py-1.5 text-sm text-on-surface transition-colors hover:border-primary/50">
              Login
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-90">
              Get Started
            </button>
          </SignUpButton>
        </Show>

        <Show when="signed-in">
          <UserButton />
        </Show>
      </nav>
    </header>
  )
}