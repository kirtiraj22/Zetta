"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { graphNodes, graphEdges, type GraphNodeData } from "@/lib/mock-data";
import {
  FolderKanban,
  User,
  Users2,
  Lightbulb,
  CheckSquare,
  FileText,
} from "lucide-react";

const kindMeta: Record<GraphNodeData["kind"], { icon: typeof FolderKanban; color: string; ring: string }> = {
  project: { icon: FolderKanban, color: "#8C7CFF", ring: "rgba(140,124,255,0.5)" },
  person: { icon: User, color: "#FFB870", ring: "rgba(255,184,112,0.5)" },
  meeting: { icon: Users2, color: "#C7BEFF", ring: "rgba(199,190,255,0.5)" },
  idea: { icon: Lightbulb, color: "#FFD9A8", ring: "rgba(255,217,168,0.5)" },
  task: { icon: CheckSquare, color: "#9B96B3", ring: "rgba(155,150,179,0.5)" },
  document: { icon: FileText, color: "#8C7CFF", ring: "rgba(140,124,255,0.5)" },
};

function MemoryNode({ data }: NodeProps<{ label: string; kind: GraphNodeData["kind"] }>) {
  const meta = kindMeta[data.kind];
  const Icon = meta.icon;
  return (
    <div
      className="glass flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-ink"
      style={{ boxShadow: `0 0 0 1px ${meta.ring}` }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <span className="grid h-5 w-5 place-items-center rounded-full" style={{ backgroundColor: `${meta.color}26` }}>
        <Icon className="h-3 w-3" style={{ color: meta.color }} />
      </span>
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

const nodeTypes = { memory: MemoryNode };

export function MemoryGraph({ onSelect }: { onSelect: (n: GraphNodeData | null) => void }) {
  const initialNodes: Node[] = useMemo(
    () =>
      graphNodes.map((n) => ({
        id: n.id,
        type: "memory",
        position: { x: n.x, y: n.y },
        data: { label: n.label, kind: n.kind },
      })),
    []
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      graphEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "rgba(140,124,255,0.35)", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(140,124,255,0.5)", width: 14, height: 14 },
      })),
    []
  );

  const [nodes] = useState(initialNodes);
  const [edges] = useState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const found = graphNodes.find((n) => n.id === node.id) ?? null;
      onSelect(found);
    },
    [onSelect]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      onPaneClick={() => onSelect(null)}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.4}
    >
      <Background color="rgba(244,242,251,0.08)" gap={24} />
      <Controls className="!glass !rounded-xl2 !border-none [&_button]:!bg-transparent [&_button]:!border-line [&_button]:!text-ink" />
      <MiniMap
        pannable
        zoomable
        maskColor="rgba(11,10,18,0.7)"
        style={{ background: "rgba(19,17,32,0.9)" }}
        nodeColor={(n) => kindMeta[(n.data as { kind: GraphNodeData["kind"] }).kind]?.color ?? "#8C7CFF"}
      />
    </ReactFlow>
  );
}
