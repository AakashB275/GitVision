export interface FileNode {
  name: string
  type: 'folder' | 'file'
  children?: FileNode[]
}

export interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  highlighted?: boolean
}

export interface GraphEdge {
  from: string
  to: string
  type: 'depends' | 'exports'
}

export const fileTree: FileNode[] = [
  {
    name: 'src',
    type: 'folder',
    children: [
      {
        name: 'components',
        type: 'folder',
        children: [
          { name: 'Button.tsx', type: 'file' },
          { name: 'GraphCanvas.tsx', type: 'file' },
          { name: 'Sidebar.tsx', type: 'file' },
        ],
      },
      {
        name: 'utils',
        type: 'folder',
        children: [
          { name: 'parser.ts', type: 'file' },
          { name: 'layout.ts', type: 'file' },
        ],
      },
    ],
  },
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
]

export const graphNodes: GraphNode[] = [
  { id: 'parser', label: 'parser.ts', x: 28, y: 18 },
  { id: 'layout', label: 'layout.ts', x: 72, y: 18 },
  { id: 'graphcanvas', label: 'GraphCanvas.tsx', x: 50, y: 48, highlighted: true },
  { id: 'button', label: 'Button.tsx', x: 28, y: 78 },
  { id: 'sidebar', label: 'Sidebar.tsx', x: 72, y: 78 },
]

export const graphEdges: GraphEdge[] = [
  { from: 'graphcanvas', to: 'parser', type: 'depends' },
  { from: 'graphcanvas', to: 'layout', type: 'depends' },
  { from: 'graphcanvas', to: 'button', type: 'exports' },
  { from: 'graphcanvas', to: 'sidebar', type: 'exports' },
]

export const selectedFileDetails = {
  name: 'GraphCanvas.tsx',
  path: 'src/components/GraphCanvas.tsx',
  tags: ['React Component', '2.4 KB'],
  complexity: 'High (42)',
  linesOfCode: 342,
  imports: ['parser.ts', 'layout.ts'],
  importPaths: ['utils/', 'utils/'],
  exportsTo: ['Button.tsx', 'Sidebar.tsx'],
  exportPaths: ['components/', 'components/'],
  preview: `import React, { useRef, useEffect } from 'react';
import { parseCodebase } from '../utils/parser';
import { computeLayout } from '../utils/layout';

export function GraphCanvas({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const nodes = parseCodebase(data);
    const layout = computeLayout(nodes);
    renderGraph(canvasRef.current, layout);
  }, [data]);

  return (
    <div className="graph-canvas">
      <canvas ref={canvasRef} />
    </div>
  );
}`,
}
