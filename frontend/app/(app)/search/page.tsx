"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/shared/topbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { memoryIconMap, memoryLabelMap } from "@/components/shared/memory-icon";
import { cn } from "@/lib/utils";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import type { MemoryItem, Person } from "@/lib/mock-data";
import { search, getBrief } from "@/lib/api-client";

const DEBOUNCE_MS = 350;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  const [results, setResults] = useState<MemoryItem[]>([]);
  const [filterChips, setFilterChips] = useState<string[]>(["All"]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Load "related people" once (from the daily brief's people-mentioned list).
  useEffect(() => {
    getBrief()
      .then((res) => setPeople(res.people))
      .catch(() => setPeople([]));
  }, []);

  // Debounced semantic search -- re-runs whenever the query changes.
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await search(query);
        setResults(res.results);
        setFilterChips(res.filterChips);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const filtered = results.filter((m) => {
    if (activeChip === "All") return true;
    if (activeChip === "Documents") return m.type === "document";
    if (activeChip === "URLs") return m.type === "url";
    if (activeChip === "Notes") return m.type === "note";
    if (activeChip === "Meetings") return m.type === "meeting";
    if (activeChip === "Research") return m.type === "research";
    return true;
  });

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
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-faint" />
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filterChips
          .filter((c) => c === "All" || c === "Documents" || c === "URLs" || c === "Notes" || c === "Meetings" || c === "Research")
          .map((chip) => (
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
          {!loading && filtered.length === 0 && (
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
            {people.length === 0 && (
              <p className="text-xs text-muted">No people identified yet.</p>
            )}
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
