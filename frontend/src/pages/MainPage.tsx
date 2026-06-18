import { useLocation } from 'react-router'
import { ZoomIn, ZoomOut, Maximize2, MousePointer, ExternalLink } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import FileTree from '../components/FileTree'
import DependencyGraph from '../components/DependencyGraph'
import { fileTree, selectedFileDetails } from '../data/mockProject'

export default function MainPage() {
  const location = useLocation()
  const repoUrl = (location.state as { repoUrl?: string } | null)?.repoUrl

  return (
    <DashboardLayout
      activeSidebarItem="explorer"
      sidebarContent={
        <>
          {repoUrl && (
            <p className="mb-3 truncate px-2 text-xs text-on-surface-variant" title={repoUrl}>
              {repoUrl.replace('https://github.com/', '')}
            </p>
          )}
          <FileTree nodes={fileTree} selectedFile="GraphCanvas.tsx" />
        </>
      }
    >
      <div className="flex h-full">
        <div className="relative min-w-0 flex-1 bg-surface-container-lowest">
          <div className="absolute left-4 top-4 z-10 flex gap-1 rounded-lg border border-outline-variant/40 bg-surface-container-low p-1">
            {[ZoomIn, ZoomOut, Maximize2, MousePointer].map((Icon, i) => (
              <button
                key={i}
                className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <DependencyGraph />
        </div>

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-outline-variant/40 bg-surface-container-lowest p-5">
          <h2 className="mb-1 text-lg font-semibold text-on-surface">{selectedFileDetails.name}</h2>
          <p className="mb-4 font-mono text-xs text-on-surface-variant">{selectedFileDetails.path}</p>

          <div className="mb-4 flex flex-wrap gap-2">
            {selectedFileDetails.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-outline-variant/50 bg-surface-container px-2.5 py-0.5 text-xs text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-xs text-on-surface-variant">Complexity</p>
              <p className="text-sm font-medium text-tertiary">{selectedFileDetails.complexity}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-on-surface-variant">Lines of Code</p>
              <p className="text-sm font-medium text-on-surface">{selectedFileDetails.linesOfCode}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-on-surface">
              Imports ({selectedFileDetails.imports.length})
            </p>
            <ul className="space-y-1">
              {selectedFileDetails.imports.map((file, i) => (
                <li key={file} className="text-sm text-primary">
                  {file}{' '}
                  <span className="text-on-surface-variant">{selectedFileDetails.importPaths[i]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-on-surface">
              Exports To ({selectedFileDetails.exportsTo.length})
            </p>
            <ul className="space-y-1">
              {selectedFileDetails.exportsTo.map((file, i) => (
                <li key={file} className="text-sm text-primary">
                  {file}{' '}
                  <span className="text-on-surface-variant">{selectedFileDetails.exportPaths[i]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-on-surface">Preview</p>
            <pre className="overflow-x-auto rounded-lg border border-outline-variant/40 bg-surface-container p-3 font-mono text-xs leading-relaxed text-on-surface-variant">
              {selectedFileDetails.preview}
            </pre>
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/60 py-2 text-sm text-on-surface transition-colors hover:border-primary/50">
            <ExternalLink className="h-4 w-4" />
            Open in Editor
          </button>
        </aside>
      </div>
    </DashboardLayout>
  )
}
