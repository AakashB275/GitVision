import { useLocation } from 'react-router'
import { ZoomIn, ZoomOut, Maximize2, MousePointer, ExternalLink, Bookmark, BookmarkCheck, MessageSquareText, Send, X } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import DependencyGraph, {
  type DependencyGraphHandle,
  type GraphInteractionMode,
} from '../components/DependencyGraph'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/react'
import { apiFetch, API_BASE_URL } from '../lib/apiFetch'
import FileTree from '../components/FileTree'
import { buildFileTree } from '../lib/buildFileTree'

export interface GraphNode {
  id: string
  label: string
  language: string
  isExternal: boolean
  isCycleNode: boolean
}

export interface GraphEdge {
  source: string
  target: string
  isCircular: boolean
}

export interface GraphData {
  meta: { parsedAt: string; fileCount: number }
  nodes: GraphNode[]
  edges: GraphEdge[]
  cycles: string[][]
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'streaming'; stage: string; progress: number; message: string }
  | { status: 'error'; message: string }
  | { status: 'done'; data: GraphData }

export default function MainPage() {
  const location = useLocation()
  const repoUrl = (location.state as { repoUrl?: string } | null)?.repoUrl
  const { getToken } = useAuth()

  // Stabilize getToken so effects don't re-fire on every render
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  const repoName = useMemo(() => {
    if (!repoUrl) return undefined
    return repoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '')
  }, [repoUrl])

  // Initialize directly to 'loading' when repoUrl exists — this avoids
  // any synchronous setState call inside the effect body (React 19 lint rule)
  const [state, setState] = useState<FetchState>(
    repoUrl ? { status: 'loading' } : { status: 'idle' }
  )

  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!repoUrl) return

    let cancelled = false
    let eventSource: EventSource | null = null

    async function runAnalysis() {
      try {
        // Step 1: POST to create analysis — returns immediately with { id }
        const { id: analysisId } = await apiFetch<{ id: string; status: string }>(
          '/analyses',
          {
            method: 'POST',
            getToken: () => getTokenRef.current(),
            body: JSON.stringify({ repositoryUrl: repoUrl }),
          },
        )

        if (cancelled) return

        // Step 2: Open SSE stream for real-time progress
        const token = await getTokenRef.current()
        const sseUrl = `${API_BASE_URL}/api/analyses/${analysisId}/stream${
          token ? `?token=${encodeURIComponent(token)}` : ''
        }`
        eventSource = new EventSource(sseUrl)

        setState({
          status: 'streaming',
          stage: 'queued',
          progress: 0,
          message: 'Waiting in queue…',
        })

        eventSource.onmessage = async (event) => {
          if (cancelled) return

          try {
            const update = JSON.parse(event.data) as {
              type: 'connected' | 'progress' | 'completed' | 'error'
              stage?: string
              progress?: number
              message?: string
              error?: string
            }

            switch (update.type) {
              case 'progress':
                setState({
                  status: 'streaming',
                  stage: update.stage || 'processing',
                  progress: update.progress || 0,
                  message: update.message || 'Processing…',
                })
                break

              case 'completed':
                eventSource?.close()
                eventSource = null

                // Step 3: Fetch the cached result
                try {
                  const graphData = await apiFetch<GraphData>(
                    `/analyses/${analysisId}`,
                    { getToken: () => getTokenRef.current() },
                  )
                  if (!cancelled) {
                    setState({ status: 'done', data: graphData })
                  }
                } catch (fetchErr) {
                  if (!cancelled) {
                    setState({
                      status: 'error',
                      message:
                        fetchErr instanceof Error
                          ? fetchErr.message
                          : 'Failed to fetch analysis results',
                    })
                  }
                }
                break

              case 'error':
                eventSource?.close()
                eventSource = null
                if (!cancelled) {
                  setState({
                    status: 'error',
                    message: update.error || 'Analysis failed',
                  })
                }
                break

              case 'connected':
                // Acknowledge connection — no state change needed
                break
            }
          } catch (parseErr) {
            console.error('Error parsing SSE message:', parseErr)
          }
        }

        eventSource.onerror = () => {
          if (cancelled) return
          eventSource?.close()
          eventSource = null
          setState({
            status: 'error',
            message: 'Connection to analysis stream lost. Please try again.',
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message:
              err instanceof Error ? err.message : 'Something went wrong',
          })
        }
      }
    }

    runAnalysis()

    return () => {
      cancelled = true
      eventSource?.close()
    }
  }, [repoUrl])

  useEffect(() => {
    if (!repoUrl) return

    let cancelled = false

    interface SavedRepo {
      id: string
      repo_url: string
    }

    apiFetch<SavedRepo[]>('/save-repos', { getToken: () => getTokenRef.current() })
      .then((repos) => {
        if (!cancelled && repos.some((r) => r.repo_url === repoUrl)) {
          setIsSaved(true)
        }
      })
      .catch((err) => {
        console.error('Failed to check if repo is saved:', err)
      })

    return () => {
      cancelled = true
    }
  }, [repoUrl])

  async function handleSaveRepo() {
    if (!repoUrl || saving || isSaved) return
    setSaving(true)
    try {
      await apiFetch('/save-repos', {
        method: 'POST',
        getToken: () => getTokenRef.current(),
        body: JSON.stringify({ url: repoUrl }),
      })
      setIsSaved(true)
    } catch (err) {
      console.error('Failed to save repository:', err)
    } finally {
      setSaving(false)
    }
  }

  const graph = state.status === 'done' ? state.data : null
  const graphRef = useRef<DependencyGraphHandle>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [interactionMode, setInteractionMode] = useState<GraphInteractionMode>('pan')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Chatbot floating input state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const chatInputRef = useRef<HTMLInputElement>(null)

  const toggleFullscreen = useCallback(() => {
    const el = canvasRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void el.requestFullscreen()
    }
  }, [])

  const fileTree = useMemo(() => {
    if (!graph) return []
    const paths = graph.nodes.filter((n) => !n.isExternal).map((n) => n.id)
    return buildFileTree(paths)
  }, [graph])

  const languages = useMemo(
  () =>
    [...new Set((graph?.nodes ?? []).map((n) => n.language))]
      .filter((lang): lang is string => !!lang && lang.toLowerCase() !== 'unknown'),
  [graph]
)

  // Focus the chat input whenever it opens
  useEffect(() => {
    if (chatOpen && chatInputRef.current) {
      chatInputRef.current.focus()
    }
  }, [chatOpen])

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!chatMessage.trim()) return
    // TODO: integrate with chatbot backend
    console.log('Chat message:', chatMessage)
    setChatMessage('')
  }

  return (
    <DashboardLayout
      activeSidebarItem="explorer"
      repoName={repoName}
      branchName="main"
      onSearchClick={() => setChatOpen(true)}
      sidebarContent={
        <div className="flex h-full min-h-0 flex-col">
          {repoUrl && (
            <p className="mb-3 truncate px-1 text-xs text-on-surface-variant" title={repoUrl}>
              {repoUrl.replace('https://github.com/', '')}
            </p>
          )}

          {state.status === 'loading' && (
            <p className="px-1 text-xs text-on-surface-variant animate-pulse">Queuing analysis…</p>
          )}

          {state.status === 'streaming' && (
            <div className="px-1">
              <p className="mb-1 text-xs font-medium text-primary capitalize">{state.stage}</p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-on-surface-variant">{state.progress}%</p>
            </div>
          )}

          {state.status === 'error' && (
            <p className="px-1 text-xs text-error">Analysis failed</p>
          )}

          {state.status === 'done' && fileTree.length > 0 && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <FileTree
                nodes={fileTree}
                selectedFile={selectedFile ?? undefined}
                onSelect={(path) => setSelectedFile((current) => (current === path ? null : path))}
              />
            </div>
          )}

          {state.status === 'done' && fileTree.length === 0 && (
            <p className="px-1 text-xs text-on-surface-variant">No files found.</p>
          )}
        </div>
      }
    >
      <div className="flex h-full">

        <div ref={canvasRef} className="relative min-w-0 flex-1 bg-surface-container-lowest">

          <div className="absolute left-4 top-4 z-10 flex gap-1 rounded-lg border border-outline-variant/40 bg-surface-container-low p-1">
            <button
              type="button"
              title="Zoom in"
              onClick={() => graphRef.current?.zoomIn()}
              className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Zoom out"
              onClick={() => graphRef.current?.zoomOut()}
              className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Full screen"
              onClick={toggleFullscreen}
              className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={interactionMode === 'pan' ? 'Switch to pointer mode' : 'Switch to pan mode'}
              onClick={() =>
                setInteractionMode((mode) => (mode === 'pan' ? 'select' : 'pan'))
              }
              className={`rounded p-1.5 transition-colors hover:bg-surface-container-high ${
                interactionMode === 'select'
                  ? 'bg-surface-container-high text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <MousePointer className="h-4 w-4" />
            </button>
          </div>

          {/* States */}
          {state.status === 'idle' && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-on-surface-variant">No repository selected.</p>
            </div>
          )}

          {state.status === 'loading' && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="animate-pulse text-sm text-on-surface-variant">
                Queuing analysis…
              </p>
            </div>
          )}

          {state.status === 'streaming' && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <div className="w-full max-w-xs">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium capitalize text-on-surface">{state.stage}</span>
                  <span className="font-mono text-primary">{state.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-on-surface-variant">
                  {state.message}
                </p>
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
              <p className="text-sm font-medium text-error">{state.message}</p>
              <p className="text-xs text-on-surface-variant">
                Check the URL is a public GitHub repo and try again.
              </p>
            </div>
          )}

          {state.status === 'done' && (
            <DependencyGraph
              ref={graphRef}
              nodes={state.data.nodes}
              edges={state.data.edges}
              interactionMode={interactionMode}
              selectedNodeId={selectedFile}
              onNodeSelect={setSelectedFile}
            />
          )}
        </div>

        {state.status === 'done' && (
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-outline-variant/40 bg-surface-container-lowest p-5">
            <h2 className="mb-1 text-lg font-semibold text-on-surface">Analysis</h2>
            <p className="mb-4 font-mono text-xs text-on-surface-variant">
              {new Date(state.data.meta.parsedAt).toLocaleString()}
            </p>

            <div className="mb-6 grid grid-cols-2 gap-3">
              {[
                { label: 'Files',    value: state.data.meta.fileCount,   color: 'text-primary' },
                { label: 'Modules',  value: state.data.nodes.length,     color: 'text-primary' },
                { label: 'Edges',    value: state.data.edges.length,     color: 'text-primary' },
                {
                  label: 'Cycles',
                  value: state.data.cycles.length,
                  color: state.data.cycles.length > 0 ? 'text-tertiary' : 'text-secondary',
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-lg border border-outline-variant/40 bg-surface-container p-3"
                >
                  <p className="text-xs text-on-surface-variant">{label}</p>
                  <p className={`text-lg font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {state.data.cycles.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-sm font-medium text-on-surface">Circular Dependencies</p>
                <ul className="space-y-2">
                  {state.data.cycles.slice(0, 5).map((cycle, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-tertiary/30 bg-surface-container p-2 font-mono text-xs text-tertiary break-all"
                    >
                      {cycle.join(' → ')}
                    </li>
                  ))}
                  {state.data.cycles.length > 5 && (
                    <p className="text-xs text-on-surface-variant">
                      +{state.data.cycles.length - 5} more
                    </p>
                  )}
                </ul>
              </div>
            )}

            {languages.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-sm font-medium text-on-surface">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full border border-outline-variant/50 bg-surface-container px-2.5 py-0.5 text-xs text-on-surface-variant"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/60 py-2 text-sm text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                Open in GitHub
              </a>
            )}
            <button
              onClick={handleSaveRepo}
              disabled={saving || isSaved || !repoUrl}
              className="flex items-center justify-center gap-2 mt-5 w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition-all duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 fill-current" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
            </button>
          </aside>
        )}
        
      </div>

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
          aria-label="Open chat"
        >
          <MessageSquareText className="h-5 w-5" />
        </button>
      )}

      {chatOpen && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 animate-slide-up">
          <form
            onSubmit={handleChatSubmit}
            className="flex items-center gap-2 rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 shadow-2xl backdrop-blur-sm"
          >
            <MessageSquareText className="h-5 w-5 shrink-0 text-primary" />
            <input
              ref={chatInputRef}
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask about this codebase..."
              className="min-w-0 flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatMessage.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition-all duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  )
}