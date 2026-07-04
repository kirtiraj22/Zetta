"use client";

import { useState, useCallback, useRef } from "react";
import { Topbar } from "@/components/shared/topbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UploadCloud, Link2, StickyNote, FileText, Sparkles } from "lucide-react";
import { recentMemories } from "@/lib/mock-data";
import { memoryIconMap, memoryLabelMap } from "@/components/shared/memory-icon";

export default function InboxPage() {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setFileName(file.name);
    // TODO(backend): POST /memory/upload with the file as multipart form data
  }, []);

  return (
    <div>
      <Topbar title="Knowledge Inbox" description="Everything you feed Zetta becomes part of your graph." />

      <Card className="p-6">
        <Tabs defaultValue="file">
          <TabsList>
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="url">Paste URL</TabsTrigger>
            <TabsTrigger value="note">Quick Note</TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl3 border-2 border-dashed px-6 py-16 text-center transition-colors ${
                dragging ? "border-violet-400 bg-violet-400/5" : "border-line-strong"
              }`}
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-400/20 to-amber-400/15">
                <UploadCloud className="h-6 w-6 text-violet-200" />
              </div>
              <p className="font-display text-lg text-ink">
                {fileName ? fileName : "Drag a file here, or click to browse"}
              </p>
              <p className="text-sm text-muted">PDF, Markdown, plain text, and audio transcripts</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
              <Button variant="glass" size="sm" type="button" onClick={() => fileInputRef.current?.click()}>
                Browse files
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="text">
            <div className="space-y-3">
              <Input placeholder="Give it a title (optional)" />
              <Textarea placeholder="Paste any text — a transcript, a Slack thread, your own notes..." className="min-h-[220px]" />
              <div className="flex justify-end">
                <Button variant="gradient">Add to memory</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url">
            <div className="space-y-3">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <Input placeholder="https://" className="pl-11" />
              </div>
              <p className="text-xs text-muted">Zetta will fetch and read the page, then extract entities and relationships.</p>
              <div className="flex justify-end">
                <Button variant="gradient">Fetch and remember</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="note">
            <div className="space-y-3">
              <Textarea placeholder="A quick thought, before it slips away..." className="min-h-[140px]" />
              <div className="flex justify-end">
                <Button variant="gradient">
                  <StickyNote className="h-4 w-4" /> Save note
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="mt-8 flex items-center gap-2 text-xs text-faint">
        <Sparkles className="h-3.5 w-3.5" />
        Zetta re-reads new memories against your graph and links related people, projects, and decisions automatically.
      </div>

      <h2 className="mb-3 mt-8 font-display text-lg text-ink">Recently added</h2>
      <Card className="divide-y divide-line p-0">
        {recentMemories.slice(0, 4).map((m) => {
          const Icon = memoryIconMap[m.type];
          return (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-faint">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{m.title}</p>
                <p className="text-xs text-faint">{memoryLabelMap[m.type]} · {m.addedAt}</p>
              </div>
              <FileText className="h-4 w-4 shrink-0 text-faint" />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
