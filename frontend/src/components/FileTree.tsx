import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import type { FileNode } from '../data/mockProject'

interface FileTreeProps {
  nodes: FileNode[]
  selectedFile?: string
  onSelect?: (name: string) => void
  depth?: number
}

export default function FileTree({ nodes, selectedFile, onSelect, depth = 0 }: FileTreeProps) {
  return (
    <ul className={depth === 0 ? '' : 'ml-4'}>
      {nodes.map((node) => (
        <FileTreeItem
          key={node.name}
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
  onSelect?: (name: string) => void
  depth: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isFolder = node.type === 'folder'
  const isSelected = !isFolder && node.name === selectedFile

  return (
    <li>
      <button
        onClick={() => {
          if (isFolder) setExpanded(!expanded)
          else onSelect?.(node.name)
        }}
        className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm transition-colors ${
          isSelected
            ? 'bg-primary/15 text-primary'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }`}
      >
        {isFolder ? (
          expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <span className="w-3.5" />
        )}
        {isFolder ? <Folder className="h-3.5 w-3.5" /> : <File className="h-3.5 w-3.5" />}
        {node.name}
      </button>
      {isFolder && expanded && node.children && (
        <FileTree nodes={node.children} selectedFile={selectedFile} onSelect={onSelect} depth={depth + 1} />
      )}
    </li>
  )
}
