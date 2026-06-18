import { graphNodes, graphEdges } from '../data/mockProject'

export default function DependencyGraph() {
  const nodeMap = Object.fromEntries(graphNodes.map((n) => [n.id, n]))

  return (
    <div className="relative h-full w-full">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {graphEdges.map((edge) => {
          const from = nodeMap[edge.from]
          const to = nodeMap[edge.to]
          if (!from || !to) return null

          const isExport = edge.type === 'exports'
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke={isExport ? '#4cd7f6' : '#869397'}
              strokeWidth={isExport ? 0.4 : 0.15}
              opacity={isExport ? 0.9 : 0.5}
            />
          )
        })}
      </svg>

      {graphNodes.map((node) => (
        <div
          key={node.id}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border px-3 py-2 text-xs font-medium transition-shadow ${
            node.highlighted
              ? 'border-primary bg-surface-container-high text-primary shadow-[0_0_20px_rgba(76,215,246,0.3)]'
              : 'border-outline-variant/50 bg-surface-container text-on-surface'
          }`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          {node.label}
        </div>
      ))}

      <div className="absolute bottom-4 left-4 rounded-lg border border-outline-variant/40 bg-surface-container-low/90 px-4 py-3 text-xs backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2 text-on-surface-variant">
          <span className="h-2.5 w-2.5 rounded-full border border-outline-variant bg-surface-container-high" />
          Module
        </div>
        <div className="mb-1 flex items-center gap-2 text-on-surface-variant">
          <span className="h-0.5 w-6 bg-outline" />
          Depends On
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="h-1 w-6 rounded bg-primary" />
          Exported To
        </div>
      </div>
    </div>
  )
}
