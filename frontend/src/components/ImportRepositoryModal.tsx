import { useState } from 'react'
import { useNavigate } from 'react-router'
import { X, Link2, Info, Network } from 'lucide-react'

interface ImportRepositoryModalProps {
  open?: boolean
  onClose?: () => void
}

export default function ImportRepositoryModal({
  open: controlledOpen,
  onClose,
}: ImportRepositoryModalProps) {
  const [internalOpen, setInternalOpen] = useState(true)
  const [repoUrl, setRepoUrl] = useState('')
  const navigate = useNavigate()

  const isOpen = controlledOpen ?? internalOpen

  function handleClose() {
    setInternalOpen(false)
    onClose?.()
  }

  function handleVisualize() {
    if (!repoUrl.trim()) return
    navigate('/project', { state: { repoUrl: repoUrl.trim() } })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-outline-variant/50 bg-surface-container-low p-6 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 pr-8">
          <h2 className="text-xl font-semibold text-on-surface">Import Repository</h2>
        </div>

        <p className="mb-6 text-sm text-on-surface-variant">
          Enter the full URL of the GitHub repository you wish to visualize.
        </p>

        <label className="mb-2 block text-sm font-medium text-on-surface">Repository URL</label>
        <div className="relative mb-4">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/org/repo"
            className="w-full rounded-lg border border-outline-variant/50 bg-surface-container py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/50 focus:outline-none"
          />
        </div>

        <div className="mb-6 flex gap-3 rounded-lg border border-outline-variant/40 bg-surface-container p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-on-surface-variant">
            Public repositories only. For private repos, please connect your GitHub account via settings.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-outline-variant/60 px-5 py-2 text-sm text-on-surface transition-colors hover:border-primary/50"
          >
            Cancel
          </button>
          <button
            onClick={handleVisualize}
            disabled={!repoUrl.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Network className="h-4 w-4" />
            Visualize
          </button>
        </div>
      </div>
    </div>
  )
}
