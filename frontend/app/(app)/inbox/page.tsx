"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Topbar } from "@/components/shared/topbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UploadCloud, Link2, StickyNote, FileText, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import type { MemoryItem } from "@/lib/mock-data";
import { memoryIconMap, memoryLabelMap } from "@/components/shared/memory-icon";
import {
  uploadMemoryFile,
  addUrlMemory,
  addNoteMemory,
  getRecentMemories,
  ApiError,
} from "@/lib/api-client";

export default function InboxPage() {
  const [recent, setRecent] = useState<MemoryItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const refreshRecent = useCallback(async () => {
    try {
      const items = await getRecentMemories(4);
      setRecent(items);
    } catch {
      // Non-fatal -- the inbox forms below still work even if this list fails to load.
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

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
            <FileTab onIngested={refreshRecent} />
          </TabsContent>

          <TabsContent value="text">
            <TextTab onIngested={refreshRecent} />
          </TabsContent>

          <TabsContent value="url">
            <UrlTab onIngested={refreshRecent} />
          </TabsContent>

          <TabsContent value="note">
            <NoteTab onIngested={refreshRecent} />
          </TabsContent>
        </Tabs>
      </Card>

      <div className="mt-8 flex items-center gap-2 text-xs text-faint">
        <Sparkles className="h-3.5 w-3.5" />
        Zetta re-reads new memories against your graph and links related people, projects, and decisions automatically.
      </div>

      <h2 className="mb-3 mt-8 font-display text-lg text-ink">Recently added</h2>
      <Card className="divide-y divide-line p-0">
        {loadingRecent && <p className="px-5 py-4 text-sm text-muted">Loading...</p>}
        {!loadingRecent && recent.length === 0 && (
          <p className="px-5 py-4 text-sm text-muted">Nothing added yet.</p>
        )}
        {recent.map((m) => {
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

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message || "Something went wrong.";
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

function FileTab({ onIngested }: { onIngested: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setStatus("uploading");
    setError(null);
    try {
      await uploadMemoryFile(file);
      setStatus("done");
      onIngested();
    } catch (err) {
      setStatus("error");
      setError(errorMessage(err));
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  return (
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
        {status === "uploading" ? (
          <Loader2 className="h-6 w-6 animate-spin text-violet-200" />
        ) : status === "done" ? (
          <CheckCircle2 className="h-6 w-6 text-violet-200" />
        ) : (
          <UploadCloud className="h-6 w-6 text-violet-200" />
        )}
      </div>
      <p className="font-display text-lg text-ink">
        {fileName ? fileName : "Drag a file here, or click to browse"}
      </p>
      <p className="text-sm text-muted">
        {status === "uploading"
          ? "Reading and remembering..."
          : status === "done"
            ? "Added to memory."
            : "PDF, Markdown, and plain text"}
      </p>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.md,.markdown,.txt,.text"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        variant="glass"
        size="sm"
        type="button"
        disabled={status === "uploading"}
        onClick={() => fileInputRef.current?.click()}
      >
        Browse files
      </Button>
    </div>
  );
}

function TextTab({ onIngested }: { onIngested: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await addNoteMemory(content, title || undefined);
      setTitle("");
      setContent("");
      onIngested();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Give it a title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="Paste any text — a transcript, a Slack thread, your own notes..."
        className="min-h-[220px]"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSubmit} disabled={loading || !content.trim()}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Add to memory
        </Button>
      </div>
    </div>
  );
}

function UrlTab({ onIngested }: { onIngested: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await addUrlMemory(url.trim());
      setUrl("");
      onIngested();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <Input
          placeholder="https://"
          className="pl-11"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted">Zetta will fetch and read the page, then extract entities and relationships.</p>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSubmit} disabled={loading || !url.trim()}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Fetch and remember
        </Button>
      </div>
    </div>
  );
}

function NoteTab({ onIngested }: { onIngested: () => void }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await addNoteMemory(content);
      setContent("");
      onIngested();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="A quick thought, before it slips away..."
        className="min-h-[140px]"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSubmit} disabled={loading || !content.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <StickyNote className="h-4 w-4" />}
          Save note
        </Button>
      </div>
    </div>
  );
}
