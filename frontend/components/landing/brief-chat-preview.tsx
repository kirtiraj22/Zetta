"use client";

import { motion } from "framer-motion";
import { Sunrise, CheckCircle2, ArrowUpRight, Sparkles } from "lucide-react";
import { dailyBrief, openCommitments, sampleConversation } from "@/lib/mock-data";

export function BriefChatPreview() {
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        {/* Daily brief card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="glass rounded-xl3 p-6"
        >
          <div className="mb-4 flex items-center gap-2 text-amber-200">
            <Sunrise className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Daily brief · {dailyBrief.date}</span>
          </div>
          <p className="text-[13.5px] leading-relaxed text-muted">{dailyBrief.summary}</p>

          <div className="mt-5 space-y-2">
            {openCommitments.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2">
                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${c.done ? "text-violet-300" : "text-faint"}`} />
                <span className="flex-1 truncate text-[12.5px] text-ink">{c.title}</span>
                <span className="shrink-0 text-[11px] text-faint">{c.due}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Chat preview card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass rounded-xl3 p-6"
        >
          <div className="mb-4 flex items-center gap-2 text-violet-200">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Contextual chat</span>
          </div>

          <div className="space-y-3">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-3.5 py-2.5 text-[12.5px] text-void">
              {sampleConversation[0].content}
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-surface px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink">
              {sampleConversation[1].content.slice(0, 148)}&hellip;
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sampleConversation[1].sources?.map((s) => (
                  <span
                    key={s.title}
                    className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2 py-0.5 text-[10.5px] text-faint"
                  >
                    <ArrowUpRight className="h-2.5 w-2.5" /> {s.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
