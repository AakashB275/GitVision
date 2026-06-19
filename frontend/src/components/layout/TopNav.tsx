import { Link } from 'react-router'
import { Search } from 'lucide-react'
import { Show, SignInButton, UserButton, SignUpButton } from '@clerk/react'

interface TopNavProps {
  variant?: 'landing' | 'dashboard'
  activeLink?: 'docs' | 'architecture' | 'pricing'
}

export default function TopNav({ variant = 'landing', activeLink }: TopNavProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b border-outline-variant/40 bg-surface-container-lowest px-6">
      <Link to="/" className="shrink-0 text-lg font-bold tracking-tight">
        <span className="text-on-surface">Git</span>
        <span className="text-primary">Vision</span>
      </Link>

      {variant === 'dashboard' && (
        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            placeholder="Search codebase..."
            className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-low py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/50 focus:outline-none"
          />
        </div>
      )}

      <nav className="ml-auto flex items-center gap-6">
        {variant === 'landing' && (
          <>
            {/* 
            <a href="#architecture" className="text-sm text-on-surface-variant transition-colors hover:text-on-surface">
              Architecture
             */}
          </>
        )}

        {variant === 'dashboard' && (
          <>
            <select className="rounded-md border border-outline-variant/50 bg-surface-container px-3 py-1.5 text-sm text-on-surface focus:border-primary/50 focus:outline-none">
              <option>Branch: main</option>
            </select>
            <a
              href="#architecture"
              className={`text-sm transition-colors hover:text-on-surface ${activeLink === 'architecture' ? 'border-b-2 border-primary pb-0.5 text-on-surface' : 'text-on-surface-variant'}`}
            >
              Architecture
            </a>
          </>
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
            