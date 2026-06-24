import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

interface GraphNode {
  id: string
  label: string
  isCycleNode: boolean
  isExternal: boolean
}

interface GraphEdge {
  source: string
  target: string
  isCircular: boolean
}

export type GraphInteractionMode = 'pan' | 'select'

export interface DependencyGraphHandle {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  interactionMode: GraphInteractionMode
  selectedNodeId?: string | null
  onNodeSelect?: (nodeId: string | null) => void
}

type Position = { x: number; y: number }

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.15
const CLICK_THRESHOLD_PX = 4

function canvasSize(nodeCount: number) {
  return Math.max(2400, Math.min(6400, 1200 + nodeCount * 90))
}

function edgeKey(source: string, target: string) {
  return `${source}→${target}`
}

function resolveOverlaps(simNodes: { x: number; y: number }[], minDistance: number, size: number) {
  const n = simNodes.length
  const margin = 100

  for (let pass = 0; pass < 80; pass++) {
    let adjusted = false

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = simNodes[i].x - simNodes[j].x
        let dy = simNodes[i].y - simNodes[j].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01

        if (dist < minDistance) {
          const push = (minDistance - dist) / 2
          dx /= dist
          dy /= dist
          simNodes[i].x += dx * push
          simNodes[i].y += dy * push
          simNodes[j].x -= dx * push
          simNodes[j].y -= dy * push
          adjusted = true
        }
      }
    }

    for (const node of simNodes) {
      node.x = Math.max(margin, Math.min(size - margin, node.x))
      node.y = Math.max(margin, Math.min(size - margin, node.y))
    }

    if (!adjusted) break
  }
}

function computeForceLayout(nodes: GraphNode[], edges: GraphEdge[], size: number) {
  const n = nodes.length
  if (n === 0) return {}

  const center = size / 2
  const minNodeDistance = 110
  const positions: Record<string, Position> = {}

  const simNodes = nodes.map((node, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const radius = 220 + (i % 4) * 40
    return {
      id: node.id,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    }
  })

  const indexById = Object.fromEntries(simNodes.map((node, i) => [node.id, i]))
  const links = edges.filter(
    (e) => indexById[e.source] !== undefined && indexById[e.target] !== undefined,
  )

  for (let iter = 0; iter < 220; iter++) {
    const cooling = 1 - iter / 220

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = simNodes[i].x - simNodes[j].x
        let dy = simNodes[i].y - simNodes[j].y
        const distSq = dx * dx + dy * dy || 0.01
        const repulsion = (18000 * cooling) / distSq
        const dist = Math.sqrt(distSq)
        dx = (dx / dist) * repulsion
        dy = (dy / dist) * repulsion
        simNodes[i].vx += dx
        simNodes[i].vy += dy
        simNodes[j].vx -= dx
        simNodes[j].vy -= dy
      }
    }

    for (const link of links) {
      const i = indexById[link.source]
      const j = indexById[link.target]
      let dx = simNodes[j].x - simNodes[i].x
      let dy = simNodes[j].y - simNodes[i].y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
      const attraction = (dist - 180) * 0.045 * cooling
      dx = (dx / dist) * attraction
      dy = (dy / dist) * attraction
      simNodes[i].vx += dx
      simNodes[i].vy += dy
      simNodes[j].vx -= dx
      simNodes[j].vy -= dy
    }

    for (const node of simNodes) {
      node.vx += (center - node.x) * 0.004
      node.vy += (center - node.y) * 0.004
      node.vx *= 0.8
      node.vy *= 0.8
      node.x += node.vx
      node.y += node.vy
    }
  }

  resolveOverlaps(simNodes, minNodeDistance, size)

  for (const node of simNodes) positions[node.id] = { x: node.x, y: node.y }
  return positions
}

const DependencyGraph = forwardRef<DependencyGraphHandle, Props>(function DependencyGraph(
  { nodes, edges, interactionMode, selectedNodeId: selectedNodeIdProp, onNodeSelect },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<string | null>(null)
  const selectedNodeId = selectedNodeIdProp !== undefined ? selectedNodeIdProp : internalSelectedNodeId
  const [nodePositions, setNodePositions] = useState<Record<string, Position>>({})
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)

  const canvasDragging = useRef(false)
  const canvasLastPointer = useRef({ x: 0, y: 0 })

  const nodeDrag = useRef<{
    nodeId: string
    lastX: number
    lastY: number
    totalMove: number
  } | null>(null)

  const clampZoom = useCallback(
    (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)),
    [],
  )

  const internalNodes = useMemo(() => nodes.filter((n) => !n.isExternal), [nodes])
  const nodeIds = useMemo(() => new Set(internalNodes.map((n) => n.id)), [internalNodes])
  const visibleEdges = useMemo(
    () => edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)),
    [edges, nodeIds],
  )

  const graphSize = useMemo(() => canvasSize(internalNodes.length), [internalNodes.length])

  const layoutKey = useMemo(
    () => `${internalNodes.map((n) => n.id).join('|')}::${visibleEdges.length}::${graphSize}`,
    [internalNodes, visibleEdges.length, graphSize],
  )

  const initialLayout = useMemo(
    () => computeForceLayout(internalNodes, visibleEdges, graphSize),
    [internalNodes, visibleEdges, graphSize],
  )

  useEffect(() => {
    setNodePositions(initialLayout)
    if (selectedNodeIdProp === undefined) setInternalSelectedNodeId(null)
    else onNodeSelect?.(null)
    setTranslate({ x: 0, y: 0 })
    setScale(1)
  }, [layoutKey, initialLayout])

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => setScale((s) => clampZoom(s * (1 + ZOOM_STEP))),
      zoomOut: () => setScale((s) => clampZoom(s / (1 + ZOOM_STEP))),
      resetView: () => {
        setScale(1)
        setTranslate({ x: 0, y: 0 })
        if (selectedNodeIdProp === undefined) setInternalSelectedNodeId(null)
        else onNodeSelect?.(null)
      },
    }),
    [clampZoom, onNodeSelect, selectedNodeIdProp],
  )

  const positions = nodePositions

  const highlight = useMemo(() => {
    if (!selectedNodeId) {
      return { nodes: null as Set<string> | null, edges: null as Set<string> | null }
    }

    const connectedNodes = new Set<string>([selectedNodeId])
    const connectedEdges = new Set<string>()

    for (const edge of visibleEdges) {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        connectedEdges.add(edgeKey(edge.source, edge.target))
        connectedNodes.add(edge.source)
        connectedNodes.add(edge.target)
      }
    }

    return { nodes: connectedNodes, edges: connectedEdges }
  }, [selectedNodeId, visibleEdges])

  const setSelectedNodeId = (nodeId: string | null | ((current: string | null) => string | null)) => {
    const next = typeof nodeId === 'function' ? nodeId(selectedNodeId) : nodeId
    if (selectedNodeIdProp === undefined) setInternalSelectedNodeId(next)
    else onNodeSelect?.(next)
  }

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId((current) => (current === nodeId ? null : nodeId))
  }

  const handleBackgroundClick = () => {
    setSelectedNodeId(null)
  }

  const moveNodeByPointerDelta = useCallback((nodeId: string, dx: number, dy: number) => {
    const deltaX = dx / scale
    const deltaY = dy / scale

    setNodePositions((prev) => {
      const current = prev[nodeId]
      if (!current) return prev
      return {
        ...prev,
        [nodeId]: {
          x: current.x + deltaX,
          y: current.y + deltaY,
        },
      }
    })
  }, [scale])

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (interactionMode !== 'pan' || e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-graph-node]')) return

    canvasDragging.current = true
    canvasLastPointer.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (nodeDrag.current) return
    if (!canvasDragging.current) return

    const dx = e.clientX - canvasLastPointer.current.x
    const dy = e.clientY - canvasLastPointer.current.y
    canvasLastPointer.current = { x: e.clientX, y: e.clientY }
    setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }))
  }

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasDragging.current) return
    canvasDragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleNodePointerDown = (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (e.button !== 0) return
    e.stopPropagation()

    nodeDrag.current = {
      nodeId,
      lastX: e.clientX,
      lastY: e.clientY,
      totalMove: 0,
    }
    setDraggingNodeId(nodeId)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleNodePointerMove = (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (nodeDrag.current?.nodeId !== nodeId) return

    const dx = e.clientX - nodeDrag.current.lastX
    const dy = e.clientY - nodeDrag.current.lastY
    nodeDrag.current.lastX = e.clientX
    nodeDrag.current.lastY = e.clientY
    nodeDrag.current.totalMove += Math.abs(dx) + Math.abs(dy)

    moveNodeByPointerDelta(nodeId, dx, dy)
  }

  const handleNodePointerUp = (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (nodeDrag.current?.nodeId !== nodeId) return

    const wasClick = nodeDrag.current.totalMove < CLICK_THRESHOLD_PX
    nodeDrag.current = null
    setDraggingNodeId(null)
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)

    if (wasClick) handleNodeSelect(nodeId)
  }

  const handleNodePointerCancel = (_e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (nodeDrag.current?.nodeId !== nodeId) return
    nodeDrag.current = null
    setDraggingNodeId(null)
  }

  const isPanMode = interactionMode === 'pan'
  const hasSelection = selectedNodeId !== null

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full touch-none select-none overflow-hidden ${
        isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onPointerLeave={handleCanvasPointerUp}
    >
      <div
        className="absolute left-1/2 top-1/2 will-change-transform"
        style={{
          width: graphSize,
          height: graphSize,
          transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          width={graphSize}
          height={graphSize}
          className="absolute inset-0"
          onClick={handleBackgroundClick}
        >
          <defs>
            <marker
              id="arrow-default"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L0,8 L8,4 z" fill="#869397" />
            </marker>
            <marker
              id="arrow-highlight"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L0,8 L8,4 z" fill="#4cd7f6" />
            </marker>
            <marker
              id="arrow-cycle"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L0,8 L8,4 z" fill="#ffb873" />
            </marker>
            <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {visibleEdges.map((edge) => {
            const from = positions[edge.source]
            const to = positions[edge.target]
            if (!from || !to) return null

            const key = edgeKey(edge.source, edge.target)
            const isHighlighted = !hasSelection || highlight.edges!.has(key)
            const isConnected = hasSelection && highlight.edges!.has(key)

            let stroke = edge.isCircular ? '#ffb873' : '#869397'
            let strokeWidth = edge.isCircular ? 2 : 1.4
            let opacity = hasSelection ? (isHighlighted ? 1 : 0.08) : 0.85
            let markerEnd = edge.isCircular ? 'url(#arrow-cycle)' : 'url(#arrow-default)'

            if (isConnected) {
              stroke = edge.isCircular ? '#ffb873' : '#4cd7f6'
              strokeWidth = edge.isCircular ? 2.5 : 2.2
              opacity = 1
              markerEnd = isConnected && !edge.isCircular ? 'url(#arrow-highlight)' : markerEnd
            }

            return (
              <line
                key={key}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={opacity}
                markerEnd={markerEnd}
                filter={isConnected ? 'url(#edge-glow)' : undefined}
                style={{ transition: 'opacity 150ms, stroke-width 150ms' }}
              />
            )
          })}
        </svg>

        {internalNodes.map((node) => {
          const pos = positions[node.id]
          if (!pos) return null

          const isSelected = selectedNodeId === node.id
          const isHighlighted = !hasSelection || highlight.nodes!.has(node.id)
          const isConnected = hasSelection && highlight.nodes!.has(node.id)
          const isDragging = draggingNodeId === node.id

          return (
            <div
              key={node.id}
              data-graph-node
              onPointerDown={(e) => handleNodePointerDown(e, node.id)}
              onPointerMove={(e) => handleNodePointerMove(e, node.id)}
              onPointerUp={(e) => handleNodePointerUp(e, node.id)}
              onPointerCancel={(e) => handleNodePointerCancel(e, node.id)}
              className={`absolute max-w-[140px] -translate-x-1/2 -translate-y-1/2 truncate rounded border px-2.5 py-1 text-xs ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              } ${
                isSelected
                  ? 'z-20 border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(76,215,246,0.45)]'
                  : isConnected
                    ? 'z-10 border-primary/70 bg-surface-container-high text-on-surface shadow-[0_0_8px_rgba(76,215,246,0.25)]'
                    : node.isCycleNode
                      ? 'border-tertiary bg-surface-container-high text-tertiary'
                      : 'border-outline-variant/50 bg-surface-container text-on-surface'
              } ${!isHighlighted ? 'opacity-20' : 'hover:z-10'} ${
                isDragging ? '' : 'transition-[opacity,box-shadow,border-color] duration-150'
              }`}
              style={{ left: pos.x, top: pos.y }}
              title={node.id}
            >
              {node.label}
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default DependencyGraph
