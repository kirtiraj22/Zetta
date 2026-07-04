"use client";

import type { GraphNodeData } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export function Inspector({
  node,
  onClose,
}: {
  node: GraphNodeData | null;
  onClose: () => void;
}) {
  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-faint">
        Select a node to inspect its connections and details.
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Badge variant="violet" className="mb-2 capitalize">
            {node.kind}
          </Badge>
          <h3 className="font-display text-lg text-ink">{node.label}</h3>
        </div>
        <button onClick={onClose} className="text-faint hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        {/* TODO(backend): GET /graph?node_id= should return real summary, timestamps, and linked memory ids */}
        This node has accumulated context over multiple memories. Zetta keeps
        it up to date automatically as related documents, notes, and
        conversations come in.
      </p>

      <div className="mt-5 space-y-2 border-t border-line pt-4">
        <p className="text-xs uppercase tracking-wide text-faint">Directly connected</p>
        <div className="flex flex-wrap gap-1.5">
          {["Pricing Sync", "Priya Nandan", "Q3 planning"].map((c) => (
            <span key={c} className="rounded-full border border-line-strong px-2.5 py-1 text-xs text-muted">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
