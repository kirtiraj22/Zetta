"use client";

import { useMemo } from "react";

interface Node {
  x: number;
  y: number;
  r: number;
  delay: number;
  color: "violet" | "amber";
}

const NODES: Node[] = [
  { x: 120, y: 90, r: 3, delay: 0, color: "violet" },
  { x: 260, y: 40, r: 2, delay: 0.4, color: "amber" },
  { x: 340, y: 140, r: 4, delay: 0.8, color: "violet" },
  { x: 480, y: 60, r: 2.5, delay: 1.2, color: "violet" },
  { x: 560, y: 160, r: 3, delay: 0.2, color: "amber" },
  { x: 680, y: 80, r: 2, delay: 1.6, color: "violet" },
  { x: 780, y: 170, r: 3.5, delay: 0.6, color: "violet" },
  { x: 200, y: 220, r: 2, delay: 1.0, color: "amber" },
  { x: 620, y: 240, r: 2.5, delay: 1.4, color: "violet" },
  { x: 420, y: 210, r: 3, delay: 0.3, color: "violet" },
];

const EDGES: [number, number][] = [
  [0, 2],
  [2, 3],
  [3, 4],
  [4, 6],
  [1, 2],
  [2, 9],
  [9, 4],
  [4, 8],
  [7, 0],
  [7, 9],
  [3, 5],
];

export function Constellation({ className }: { className?: string }) {
  const paths = useMemo(
    () =>
      EDGES.map(([a, b], i) => {
        const n1 = NODES[a];
        const n2 = NODES[b];
        return { key: `${a}-${b}-${i}`, n1, n2, delay: 0.15 * i };
      }),
    []
  );

  return (
    <svg
      viewBox="0 0 900 300"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="edge-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8C7CFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFB870" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {paths.map(({ key, n1, n2, delay }) => {
        const len = Math.hypot(n2.x - n1.x, n2.y - n1.y);
        return (
          <line
            key={key}
            x1={n1.x}
            y1={n1.y}
            x2={n2.x}
            y2={n2.y}
            stroke="url(#edge-grad)"
            strokeWidth="1"
            strokeDasharray={len}
            strokeDashoffset={len}
            className="animate-dash"
            style={{ animationDelay: `${delay}s` }}
          />
        );
      })}

      {NODES.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={n.r}
          fill={n.color === "violet" ? "#C7BEFF" : "#FFD9A8"}
          className="animate-pulse-node origin-center"
          style={{ animationDelay: `${n.delay}s`, transformOrigin: `${n.x}px ${n.y}px` }}
        />
      ))}
    </svg>
  );
}
