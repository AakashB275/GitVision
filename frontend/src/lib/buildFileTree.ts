export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return nodes
    .map((node) =>
      node.type === 'folder' && node.children
        ? { ...node, children: sortNodes(node.children) }
        : node,
    )
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export function buildFileTree(paths: string[]): FileNode[] {
  const root: FileNode[] = []

  for (const filePath of [...paths].sort((a, b) => a.localeCompare(b))) {
    const normalized = filePath.replace(/\\/g, '/')
    const segments = normalized.split('/').filter(Boolean)
    if (segments.length === 0) continue

    let currentLevel = root
    let currentPath = ''

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      currentPath = currentPath ? `${currentPath}/${segment}` : segment
      const isFile = i === segments.length - 1

      if (isFile) {
        currentLevel.push({ name: segment, path: normalized, type: 'file' })
        continue
      }

      let folder = currentLevel.find((n) => n.type === 'folder' && n.name === segment)
      if (!folder) {
        folder = { name: segment, path: currentPath, type: 'folder', children: [] }
        currentLevel.push(folder)
      }

      currentLevel = folder.children!
    }
  }

  return sortNodes(root)
}
