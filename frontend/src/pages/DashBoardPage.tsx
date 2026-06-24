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

  async function handleRemoveAnalysis(id: string) {
    try {
      await apiFetch(`/history/${id}`, { method: 'DELETE', getToken })
      setHistory((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove analysis')
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
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 cursor-pointer"
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
              <div className="flex flex-col gap-4">
                {savedRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low p-5 transition-all duration-300 hover:border-primary/50 hover:bg-surface-container/60 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {/* Top-right delete button */}
                    <button
                      onClick={() => handleRemoveRepo(repo.id)}
                      aria-label="Remove repository"
                      className="absolute top-3 right-3 rounded-lg p-1.5 text-on-surface-variant transition-all hover:bg-error-container/20 hover:text-error cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="mb-4 pr-6">
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Repository</span>
                      </div>
                      <h3 className="text-base font-semibold text-on-surface truncate" title={`${repo.repo_owner}/${repo.repo_name}`}>
                        {repo.repo_owner}/{repo.repo_name}
                      </h3>
                      <p className="text-xs text-on-surface-variant/80 mt-1 truncate" title={repo.repo_url}>
                        {repo.repo_url}
                      </p>
                    </div>

                    <button
                      onClick={() => openRepo(repo.repo_url)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-surface-container-high py-2 text-sm font-medium text-on-surface transition-all hover:bg-primary hover:text-on-primary cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Analysis
                    </button>
                  </div>
                ))}
              </div>
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
              <div className="flex flex-col gap-4">
                {history.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low p-5 transition-all duration-300 hover:border-primary/50 hover:bg-surface-container/60 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {/* Top-right delete button */}
                    <button
                      onClick={() => handleRemoveAnalysis(analysis.id)}
                      aria-label="Remove analysis"
                      className="absolute top-3 right-3 rounded-lg p-1.5 text-on-surface-variant transition-all hover:bg-error-container/20 hover:text-error cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="mb-4 pr-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-on-surface-variant shrink-0" />
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Analysis History</span>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            analysis.status === 'done'
                              ? 'bg-secondary-container/20 text-secondary border border-secondary/20'
                              : analysis.status === 'failed'
                                ? 'bg-error-container/20 text-error border border-error/20'
                                : 'bg-tertiary-container/20 text-tertiary border border-tertiary/20'
                          }`}
                        >
                          {analysis.status}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-on-surface truncate" title={`${analysis.repo_owner}/${analysis.repo_name}`}>
                        {analysis.repo_owner}/{analysis.repo_name}
                      </h3>
                      <p className="text-xs text-on-surface-variant/80 mt-1">
                        {new Date(analysis.created_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => openRepo(analysis.repo_url)}
                      disabled={analysis.status !== 'done'}
                      className="flex items-center justify-center gap-2 rounded-lg bg-surface-container-high py-2 text-sm font-medium text-on-surface transition-all hover:bg-primary hover:text-on-primary disabled:bg-surface-container-low disabled:text-on-surface-variant/40 disabled:border-transparent disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Clock className="h-4 w-4" />
                      View Results
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}