import { Topbar } from "@/components/shared/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dailyBrief, openCommitments, recentMemories, people } from "@/lib/mock-data";
import { memoryIconMap } from "@/components/shared/memory-icon";
import { CheckCircle2, Circle, ArrowUpRight } from "lucide-react";

export default function BriefPage() {
  return (
    <div>
      <Topbar title="Daily Brief" description={dailyBrief.date} />

      <Card className="mb-6 p-6">
        <h2 className="mb-3 font-display text-xl text-ink">Morning summary</h2>
        <p className="text-[15px] leading-relaxed text-muted">{dailyBrief.summary}</p>

        <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-faint">Highlights</p>
            <ul className="space-y-2 text-sm text-ink">
              {dailyBrief.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-faint">Suggested follow-ups</p>
            <ul className="space-y-2 text-sm text-ink">
              {dailyBrief.followUps.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg text-ink">Today&rsquo;s priorities</h2>
          <div className="space-y-1">
            {openCommitments.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl2 px-2 py-2.5 hover:bg-surface">
                {c.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-300" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-faint" />
                )}
                <span className={`flex-1 text-sm ${c.done ? "text-faint line-through" : "text-ink"}`}>{c.title}</span>
                <Badge variant="default">{c.person}</Badge>
                <span className="w-10 shrink-0 text-right text-xs text-faint">{c.due}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg text-ink">Related knowledge</h2>
          <div className="divide-y divide-line">
            {recentMemories.slice(0, 4).map((m) => {
              const Icon = memoryIconMap[m.type];
              return (
                <a key={m.id} href="/search" className="flex items-center gap-3 py-3 hover:opacity-80">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-faint">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{m.title}</p>
                    <p className="text-xs text-faint">{m.project}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-faint" />
                </a>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 font-display text-lg text-ink">People in focus</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {people.map((p) => (
            <div key={p.id} className="rounded-xl2 glass p-4">
              <p className="text-sm font-medium text-ink">{p.name}</p>
              <p className="text-xs text-faint">{p.role}</p>
              <p className="mt-2 text-xs text-muted">{p.mentions} mentions · {p.lastMentioned}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
