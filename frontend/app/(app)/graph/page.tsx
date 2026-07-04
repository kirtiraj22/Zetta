"use client";

import { useState } from "react";
import { Topbar } from "@/components/shared/topbar";
import { MemoryGraph } from "@/components/graph/memory-graph";
import { Inspector } from "@/components/graph/inspector";
import type { GraphNodeData } from "@/lib/mock-data";

export default function GraphPage() {
  const [selected, setSelected] = useState<GraphNodeData | null>(null);

  return (
    <div>
      <Topbar title="Memory Graph" description="Explore how your projects, people, and ideas connect." />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="glass h-[560px] overflow-hidden rounded-xl3">
          <MemoryGraph onSelect={setSelected} />
        </div>
        <div className="glass hidden h-[560px] overflow-y-auto rounded-xl3 lg:block">
          <Inspector node={selected} onClose={() => setSelected(null)} />
        </div>
      </div>

      {selected && (
        <div className="glass mt-4 rounded-xl3 lg:hidden">
          <Inspector node={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}
