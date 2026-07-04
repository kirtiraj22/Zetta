"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/shared/topbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchResults, filterChips, people } from "@/lib/mock-data";
import { memoryIconMap, memoryLabelMap } from "@/components/shared/memory-icon";
import { cn } from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All");

  const filtered = useMemo(() => {
    return searchResults.filter((m) => {
      const matchesQuery =
        query.trim() === "" ||
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.summary.toLowerCase().includes(query.toLowerCase());
      const matchesChip =
        activeChip === "All" ||
        (activeChip === "Documents" && m.type === "document") ||
        (activeChip === "URLs" && m.type === "url") ||
        (activeChip === "Notes" && m.type === "note") ||
        (activeChip === "Meetings" && m.type === "meeting") ||
        (activeChip === "Research" && m.type === "research");
      return matchesQuery && matchesChip;
    });
  }, [query, activeChip]);

  return (
    <div>
      <Topbar title="Memory Explorer" description="Search everything Zetta has ever remembered." />

      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories, people, projects..."
          className="h-12 pl-11 text-[15px]"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filterChips.map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveChip(chip)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
              activeChip === chip
                ? "border-transparent bg-ink text-void"
                : "border-line-strong text-muted hover:text-ink"
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Timeline */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <Card className="p-8 text-center text-sm text-muted">No memories match that search yet.</Card>
          )}
          {filtered.map((m) => {
            const Icon = memoryIconMap[m.type];
            return (
              <Card key={m.id} className="p-5 transition-colors hover:bg-surface-hover">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-faint">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">{m.title}</p>
                      <Badge variant="default">{memoryLabelMap[m.type]}</Badge>
                      {m.project && <Badge variant="violet">{m.project}</Badge>}
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{m.summary}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-faint">
                      <span>{m.source}</span>
                      <span>&middot;</span>
                      <span>{m.addedAt}</span>
                      <span>&middot;</span>
                      <span>{m.connections} connections</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Relationship cards */}
        <div className="hidden lg:block">
          <p className="mb-3 text-xs uppercase tracking-wide text-faint">Related people</p>
          <div className="space-y-3">
            {people.map((p) => (
              <Card key={p.id} className="p-4">
                <p className="text-sm font-medium text-ink">{p.name}</p>
                <p className="text-xs text-faint">{p.role}</p>
                <p className="mt-2 text-xs text-muted">{p.mentions} mentions across your graph</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
