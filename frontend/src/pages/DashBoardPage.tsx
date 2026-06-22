import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth, useUser } from '@clerk/react'
import { GitBranch, Clock, ExternalLink, Trash2, Plus, RefreshCw } from 'lucide-react'
import { apiFetch } from '../lib/apiFetch';

interface SavedRepo {
  id: string
  repo_url: string
  repo_owner: string
  repo_name: string
  created_at: string
}

interface Analysis {
  id: string
  repo_url: string
  repo_owner: string
  repo_name: string
  status: 'pending' | 'done' | 'failed'
  created_at: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  const [savedRepos, setSavedRepos] = useState<SavedRepo[]>([])
  const [history, setHistory] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      navigate('/')
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [repos, analyses] = await Promise.all([
  apiFetch<SavedRepo[]>('/save-repos', { getToken }),
  apiFetch<Analysis[]>('/history', { getToken }),
])
        if (!cancelled) {
          setSavedRepos(repos)
          setHistory(analyses)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // After landing here straight from sign-up/sign-in, resume any
    // repo analysis the user kicked off from the landing page.
    const pendingRepoUrl = sessionStorage.getItem('pendingRepoUrl')
    if (pendingRepoUrl) {
      sessionStorage.removeItem('pendingRepoUrl')
      navigate('/project', { state: { repoUrl: pendingRepoUrl } })
    }

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken, navigate])

  async function handleRemoveRepo(id: string) {
    try {
      await apiFetch(`/save-repos/${id}`, { method: 'DELETE', getToken })
      setSavedRepos((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove repo')
    }
  }

  function openRepo(repoUrl: string) {
    navigate('/project', { state: { repoUrl } })
  }

  return (
      <div className="h-full overflow-y-auto bg-background p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-on-surface">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="text-on-surface-variant">Your saved repositories and analysis history.</p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Analysis
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-error/40 bg-error-container/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading your dashboard...
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Saved repos */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Saved Repositories</h2>
              {savedRepos.length === 0 ? (
                <p className="rounded-lg border border-dashed border-outline-variant/50 p-6 text-center text-sm text-on-surface-variant">
                  You haven't saved any repositories yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {savedRepos.map((repo) => (
                    <li
                      key={repo.id}
                      className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-3"
                    >
                      <button
                        onClick={() => openRepo(repo.repo_url)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <GitBranch className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-on-surface">
                            {repo.repo_owner}/{repo.repo_name}
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">{repo.repo_url}</p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => openRepo(repo.repo_url)}
                          aria-label="Open repository"
                          className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveRepo(repo.id)}
                          aria-label="Remove repository"
                          className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Past analyses */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-on-surface">Recent Analyses</h2>
              {history.length === 0 ? (
                <p className="rounded-lg border border-dashed border-outline-variant/50 p-6 text-center text-sm text-on-surface-variant">
                  No analyses yet. Run your first one to see it here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {history.map((analysis) => (
                    <li
                      key={analysis.id}
                      className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-3"
                    >
                      <button
                        onClick={() => openRepo(analysis.repo_url)}
                        disabled={analysis.status !== 'done'}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
                      >
                        <Clock className="h-4 w-4 shrink-0 text-on-surface-variant" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-on-surface">
                            {analysis.repo_owner}/{analysis.repo_name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {new Date(analysis.created_at).toLocaleString()}
                          </p>
                        </div>
                      </button>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          analysis.status === 'done'
                            ? 'bg-secondary-container/20 text-secondary'
                            : analysis.status === 'failed'
                              ? 'bg-error-container/20 text-error'
                              : 'bg-tertiary-container/20 text-tertiary'
                        }`}
                      >
                        {analysis.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
  )
}