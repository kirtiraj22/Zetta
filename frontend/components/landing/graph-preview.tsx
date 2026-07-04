"use client";

import { motion } from "framer-motion";
import { graphNodes, graphEdges } from "@/lib/mock-data";

const kindColor: Record<string, string> = {
  project: "#8C7CFF",
  person: "#FFB870",
  meeting: "#C7BEFF",
  idea: "#FFD9A8",
  task: "#9B96B3",
  document: "#8C7CFF",
};

export function GraphPreview() {
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-faint">Your knowledge graph</p>
          <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            Watch your work{" "}
            <span className="italic text-gradient">connect itself.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Projects, people, meetings, ideas, tasks, and documents aren&rsquo;t
            siloed folders — they&rsquo;re nodes in one graph that gets denser
            and more useful the longer you use it.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong relative rounded-xl3 p-4"
        >
          <svg viewBox="0 0 760 640" className="h-[420px] w-full">
            {graphEdges.map((e) => {
              const s = graphNodes.find((n) => n.id === e.source)!;
              const t = graphNodes.find((n) => n.id === e.target)!;
              return (
                <line
                  key={e.id}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="rgba(244,242,251,0.14)"
                  strokeWidth="1.5"
                />
              );
            })}
            {graphNodes.map((n) => (
              <g key={n.id}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={16}
                  fill={kindColor[n.kind]}
                  fillOpacity={0.14}
                  stroke={kindColor[n.kind]}
                  strokeOpacity={0.5}
                  className="animate-pulse-node"
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                />
                <circle cx={n.x} cy={n.y} r={4} fill={kindColor[n.kind]} />
                <text
                  x={n.x}
                  y={n.y + 32}
                  textAnchor="middle"
                  className="fill-[#C9C5DC] font-sans"
                  fontSize="12"
                >
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
