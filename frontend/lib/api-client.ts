// lib/api-client.ts
//
// Drop-in replacement for `lib/mock-data.ts`'s data. Every function returns
// data shaped EXACTLY like the corresponding mock export/type, so swapping
// `import { recentMemories } from "@/lib/mock-data"` for
// `const recentMemories = await getRecentMemories()` requires no other
// frontend changes.
//
// All requests attach the current Supabase session's access_token; the
// backend verifies it and resolves the caller's user.

import { getAccessToken } from "./supabase-client";
import type {
  MemoryItem,
  MemoryStats,
  Commitment,
  Person,
  ChatMessage,
  GraphNodeData,
} from "./mock-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token ?? ""}`);
  if (!(init.body instanceof FormData) && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}/api${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(body || res.statusText, res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// --- Auth ------------------------------------------------------------------

export interface MeResponse {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
}

export const getMe = () => request<MeResponse>("/me");

// --- Dashboard ---------------------------------------------------------

export interface ActivityItem {
  id: string;
  label: string;
  time: string;
}

export interface DailyBriefSummary {
  date: string;
  summary: string;
  highlights: string[];
  followUps: string[];
}

export interface DashboardResponse {
  stats: MemoryStats;
  recentMemories: MemoryItem[];
  dashboardActivity: ActivityItem[];
  dailyBrief: DailyBriefSummary;
}

export const getDashboard = () => request<DashboardResponse>("/dashboard");

// --- Memory / Knowledge Inbox --------------------------------------------

export async function uploadMemoryFile(file: File, project?: string): Promise<MemoryItem> {
  const form = new FormData();
  form.append("file", file);
  const qs = project ? `?project=${encodeURIComponent(project)}` : "";
  return request<MemoryItem>(`/memory/upload${qs}`, { method: "POST", body: form });
}

export function addUrlMemory(url: string, title?: string, project?: string): Promise<MemoryItem> {
  return request<MemoryItem>("/memory/url", {
    method: "POST",
    body: JSON.stringify({ url, title, project }),
  });
}

export function addNoteMemory(content: string, title?: string, project?: string): Promise<MemoryItem> {
  return request<MemoryItem>("/memory/note", {
    method: "POST",
    body: JSON.stringify({ content, title, project }),
  });
}

export function getRecentMemories(limit = 20): Promise<MemoryItem[]> {
  return request<MemoryItem[]>(`/memory/recent?limit=${limit}`);
}

export function deleteMemory(id: string): Promise<void> {
  return request<void>(`/memory/${id}`, { method: "DELETE" });
}

// --- Search --------------------------------------------------------------

export interface SearchResponse {
  results: MemoryItem[];
  filterChips: string[];
}

export function search(query: string, limit = 20): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return request<SearchResponse>(`/search?${params.toString()}`);
}

// --- Graph -----------------------------------------------------------------

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphResponse {
  nodes: GraphNodeData[];
  edges: GraphEdge[];
}

export const getGraph = () => request<GraphResponse>("/graph");

// --- Daily brief -------------------------------------------------------

export interface BriefResponse {
  dailyBrief: DailyBriefSummary;
  openCommitments: Commitment[];
  people: Person[];
}

export const getBrief = (refresh = false) =>
  request<BriefResponse>(`/brief${refresh ? "?refresh=true" : ""}`);

// --- Chat (streaming) --------------------------------------------------

export type ChatStreamEvent =
  | { type: "conversation"; conversationId: string }
  | { type: "token"; content: string }
  | { type: "done"; message: ChatMessage };

/**
 * Streams a chat reply token-by-token via SSE. Usage in chat.tsx:
 *
 *   let assistantText = "";
 *   for await (const event of streamChat(input, conversationId)) {
 *     if (event.type === "conversation") setConversationId(event.conversationId);
 *     if (event.type === "token") { assistantText += event.content; updateLastBubble(assistantText); }
 *     if (event.type === "done") { finalizeLastBubble(event.message); }
 *   }
 */
export async function* streamChat(
  message: string,
  conversationId?: string,
): AsyncGenerator<ChatStreamEvent> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
    },
    body: JSON.stringify({ message, conversationId }),
  });

  if (!res.ok || !res.body) {
    throw new ApiError(await res.text().catch(() => res.statusText), res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const lines = frame.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const data = dataLine.slice("data:".length).trim();

      if (eventLine?.includes("conversation")) {
        yield { type: "conversation", conversationId: data };
        continue;
      }

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "token") {
          yield { type: "token", content: parsed.content };
        } else if (parsed.type === "done") {
          yield { type: "done", message: parsed.message as ChatMessage };
        }
      } catch {
        // Ignore malformed frames rather than crashing the stream.
      }
    }
  }
}

export function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  return request<ChatMessage[]>(`/chat/${conversationId}/history`);
}
