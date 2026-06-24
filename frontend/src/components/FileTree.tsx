import { useEffect, useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import type { FileNode } from '../lib/buildFileTree'

interface FileTreeProps {
  nodes: FileNode[]
  selectedFile?: string
  onSelect?: (path: string) => void
  depth?: number
}

export default function FileTree({ nodes, selectedFile, onSelect, depth = 0 }: FileTreeProps) {
  return (
    <ul className={depth === 0 ? 'space-y-0.5' : 'ml-3 border-l border-outline-variant/30 pl-1'}>
      {nodes.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          selectedFile={selectedFile}
          onSelect={onSelect}
          depth={depth}
        />
      ))}
    </ul>
  )
}

function FileTreeItem({
  node,
  selectedFile,
  onSelect,
  depth,
}: {
  node: FileNode
  selectedFile?: string
  onSelect?: (path: string) => void
  depth: number
}) {
  const isFolder = node.type === 'folder'
  const isSelected = !isFolder && node.path === selectedFile
  const containsSelected = isFolder && selectedFile?.startsWith(`${node.path}/`)

  const [expanded, setExpanded] = useState(depth < 2 || Boolean(containsSelected))

  useEffect(() => {
    if (containsSelected) setExpanded(true)
  }, [containsSelected])

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          if (isFolder) setExpanded((open) => !open)
          else onSelect?.(node.path)
        }}
        title={node.path}
        className={`flex w-full min-w-0 items-center gap-1 rounded px-1.5 py-1 text-left text-xs transition-colors ${
          isSelected
            ? 'bg-primary/15 text-primary'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }`}
      >
        {isFolder ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isFolder ? (
          <Folder className="h-3.5 w-3.5 shrink-0 text-primary/80" />
        ) : (
          <File className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && expanded && node.children && (
        <FileTree
          nodes={node.children}
          selectedFile={selectedFile}
          onSelect={onSelect}
          depth={depth + 1}
        />
      )}
    </li>
  )
}
