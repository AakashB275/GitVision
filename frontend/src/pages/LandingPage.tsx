import { useNavigate } from 'react-router'
import { Plug, Check, Network, Route, Users } from 'lucide-react'
import { useAuth, useClerk } from '@clerk/react'
import TopNav from '../components/layout/TopNav'

const features = [
  {
    icon: Network,
    title: 'Dependency Mapping',
    description:
      'Trace module imports across your entire stack. Identify circular dependencies and orphaned code segments instantly in a node view.',
  },
  {
    icon: Route,
    title: 'Flow Analysis',
    description:
      'Track data flow from entry points to database queries. Highlight synchronous blocks and async waterfalls in your architecture.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Share architectural snapshots via URLs. Pin comments to specific functional nodes for async code reviews.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { isLoaded, isSignedIn } = useAuth()
  const { openSignIn } = useClerk()

  function handleAnalyzeRepo() {
    if (!isLoaded) return

    if (!isSignedIn) {
      openSignIn({})
      return
    }

    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopNav variant="landing" />

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
            Visualize Your Codebase Instantly.
          </h1>

          <p className="mb-8 max-w-lg text-lg leading-relaxed text-on-surface-variant">
            Transform complex repository structures into interactive, deeply queryable architectural maps.
            Understand dependencies, pinpoint bottlenecks, and onboard engineers 10x faster.
          </p>

          <div className="mb-6 flex flex-wrap gap-4">
            <button
              onClick={handleAnalyzeRepo}
              disabled={!isLoaded}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plug className="h-4 w-4" />
              Analyze Repository
            </button>
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-secondary" />
              SOC2 Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-secondary" />
              No local storage required
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center gap-2 border-b border-outline-variant/40 px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-error-container" />
                <span className="h-2.5 w-2.5 rounded-full bg-tertiary-container" />
                <span className="h-2.5 w-2.5 rounded-full bg-secondary-container" />
              </div>
              <span className="ml-2 font-mono text-xs text-on-surface-variant">GitVision-core-map.js</span>
            </div>
            <div className="relative flex h-64 items-center justify-center p-8 lg:h-80">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
              <svg viewBox="0 0 300 200" className="h-full w-full opacity-80">
                <line x1="150" y1="100" x2="80" y2="40" stroke="#4cd7f6" strokeWidth="1.5" opacity="0.6" />
                <line x1="150" y1="100" x2="220" y2="40" stroke="#4cd7f6" strokeWidth="1.5" opacity="0.6" />
                <line x1="150" y1="100" x2="60" y2="160" stroke="#4cd7f6" strokeWidth="1.5" opacity="0.6" />
                <line x1="150" y1="100" x2="240" y2="160" stroke="#4cd7f6" strokeWidth="1.5" opacity="0.6" />
                <line x1="80" y1="40" x2="220" y2="40" stroke="#4cd7f6" strokeWidth="1" opacity="0.3" />
                <circle cx="150" cy="100" r="12" fill="#4cd7f6" opacity="0.9" />
                <circle cx="80" cy="40" r="8" fill="#31394d" stroke="#4cd7f6" strokeWidth="1.5" />
                <circle cx="220" cy="40" r="8" fill="#31394d" stroke="#4cd7f6" strokeWidth="1.5" />
                <circle cx="60" cy="160" r="8" fill="#31394d" stroke="#4cd7f6" strokeWidth="1.5" />
                <circle cx="240" cy="160" r="8" fill="#31394d" stroke="#4cd7f6" strokeWidth="1.5" />
              </svg>
              <p className="absolute bottom-6 left-6 font-mono text-sm text-primary">&gt; parsing tree...</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-2 text-2xl font-bold">Core Capabilities</h2>
        <div className="mb-10 h-0.5 w-12 bg-primary" />

        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-6 transition-colors hover:border-primary/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-outline-variant/40 px-6 py-8 text-sm text-on-surface-variant">
        <p>© 2026 GitVision Inc. Terminal-grade visualization.</p>
        <div className="flex gap-6">
          <a href="#privacy" className="transition-colors hover:text-on-surface">Privacy</a>
          <a href="#terms" className="transition-colors hover:text-on-surface">Terms</a>
          <a href="#security" className="transition-colors hover:text-on-surface">Security</a>
          <a href="#status" className="transition-colors hover:text-on-surface">Status</a>
        </div>
      </footer>
    </div>
  )
}