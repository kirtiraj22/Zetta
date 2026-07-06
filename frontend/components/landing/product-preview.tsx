"use client";

import { motion } from "framer-motion";
import { Search, Bell, Plus, FileText, Link2, StickyNote, Users } from "lucide-react";

export function ProductPreview() {
  return (
    <section id="product" className="relative px-6 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl"
      >
        <div className="pointer-events-none absolute -inset-x-10 -top-20 h-72 bg-aurora-1 blur-3xl opacity-60" />

        <div className="glass-strong relative rounded-xl3 p-2 shadow-[0_60px_140px_-40px_rgba(0,0,0,0.9)]">
          {/* browser chrome */}
          <div className="flex items-center gap-3 rounded-t-xl2 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#FF5F57]/70" />
              <span className="h-3 w-3 rounded-full bg-[#FEBC2E]/70" />
              <span className="h-3 w-3 rounded-full bg-[#28C840]/70" />
            </div>
            <div className="mx-auto flex w-full max-w-sm items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs text-faint">
              <Search className="h-3 w-3" />
              app.zetta.ai/dashboard
            </div>
          </div>

          {/* mock app body */}
          <div className="grid grid-cols-[200px_1fr] overflow-hidden rounded-b-xl2 rounded-t-none border-t border-line bg-deep/60">
            {/* sidebar */}
            <div className="hidden flex-col gap-1 border-r border-line p-4 sm:flex">
              <div className="mb-4 flex items-center gap-2 px-1">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                <span className="text-xs font-medium text-ink">Zetta</span>
              </div>
              {["Dashboard", "Inbox", "Graph", "Chat", "Brief", "Search"].map((item, i) => (
                <div
                  key={item}
                  className={`rounded-lg px-3 py-2 text-xs ${
                    i === 0 ? "bg-surface-hover text-ink" : "text-faint"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* main */}
            <div className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-display text-sm text-ink">Good morning, Aiden</p>
                  <p className="text-[11px] text-faint">Here&rsquo;s what your memory surfaced today</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-surface">
                    <Bell className="h-3.5 w-3.5 text-faint" />
                  </div>
                  <div className="flex h-7 items-center gap-1 rounded-full bg-ink px-3 text-[11px] font-medium text-void">
                    <Plus className="h-3 w-3" /> Add memory
                  </div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Memories", value: "1,842" },
                  { label: "Connections", value: "5,194" },
                  { label: "Projects", value: "12" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg glass p-3">
                    <p className="text-[10px] uppercase tracking-wide text-faint">{s.label}</p>
                    <p className="font-display text-lg text-ink">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3 rounded-lg glass p-3">
                  <p className="mb-2 text-[11px] font-medium text-ink">Recent memories</p>
                  {[
                    { icon: FileText, t: "Competitive teardown", c: "amber" },
                    { icon: Link2, t: "Cognee: memory graph architecture", c: "violet" },
                    { icon: StickyNote, t: "Onboarding friction — quick note", c: "violet" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-2 border-t border-line py-2 first:border-t-0">
                      <r.icon className="h-3 w-3 shrink-0 text-faint" />
                      <p className="truncate text-[11px] text-muted">{r.t}</p>
                    </div>
                  ))}
                </div>
                <div className="col-span-2 rounded-lg bg-gradient-to-br from-violet-400/15 to-amber-400/10 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-ink">
                    <Users className="h-3 w-3" /> Today&rsquo;s brief
                  </p>
                  <p className="text-[10.5px] leading-relaxed text-muted">
                    Pricing converged on usage-based tiers. Priya still owes
                    you churn numbers before Monday.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
