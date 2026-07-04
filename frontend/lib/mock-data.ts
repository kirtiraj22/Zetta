// TODO(backend): replace all exports in this file with data fetched from the
// FastAPI service (GET /dashboard, GET /graph, POST /chat, etc). Shapes here
// are designed to mirror the eventual API responses so swapping is mechanical.

export type MemoryType = "document" | "url" | "note" | "meeting" | "research";

export interface MemoryItem {
  id: string;
  title: string;
  type: MemoryType;
  summary: string;
  source: string;
  addedAt: string;
  connections: number;
  project?: string;
}

export const recentMemories: MemoryItem[] = [
  {
    id: "m1",
    title: "Q3 pricing strategy notes",
    type: "meeting",
    summary: "Team leaned toward usage-based tiers over flat SaaS pricing; Priya to model churn impact.",
    source: "Meeting · Pricing Sync",
    addedAt: "2h ago",
    connections: 6,
    project: "Pricing Overhaul",
  },
  {
    id: "m2",
    title: "Cognee: memory graph architecture",
    type: "url",
    source: "docs.cognee.ai",
    summary: "Reference architecture for merging vector search with a typed knowledge graph layer.",
    addedAt: "5h ago",
    connections: 11,
    project: "Zetta Core",
  },
  {
    id: "m3",
    title: "Competitive teardown — Mem, Rewind, Reflect",
    type: "document",
    source: "competitive-teardown.pdf",
    summary: "Rewind wins on capture, Mem wins on retrieval UX; neither models entities or relationships well.",
    addedAt: "Yesterday",
    connections: 9,
    project: "Zetta Core",
  },
  {
    id: "m4",
    title: "Quick thought — onboarding friction",
    type: "note",
    source: "Quick note",
    summary: "First-run empty state should ask for one real document, not a demo file. Demo data kills trust.",
    addedAt: "Yesterday",
    connections: 3,
    project: "Onboarding",
  },
  {
    id: "m5",
    title: "Interview: Head of Ops at a 40-person agency",
    type: "research",
    source: "User research",
    summary: "Wants daily brief pushed to Slack, not another tab to check. Context-switching is the enemy.",
    addedAt: "2 days ago",
    connections: 7,
    project: "Discovery",
  },
  {
    id: "m6",
    title: "Series A deck — narrative arc v3",
    type: "document",
    source: "zetta-seriesA-v3.pdf",
    summary: "Opens on the forgetting problem, not the RAG problem — investors already know RAG.",
    addedAt: "3 days ago",
    connections: 5,
    project: "Fundraising",
  },
];

export const memoryStats = {
  totalMemories: 1842,
  newThisWeek: 63,
  connections: 5194,
  projects: 12,
  people: 34,
  storageUsedLabel: "1.2 GB of memory graph",
};

export const dashboardActivity = [
  { id: "a1", label: "Linked \u201cPricing Sync\u201d to Pricing Overhaul", time: "10:42 AM" },
  { id: "a2", label: "Added 4 new nodes from competitive-teardown.pdf", time: "9:15 AM" },
  { id: "a3", label: "Resolved conflicting note on churn definition", time: "Yesterday" },
  { id: "a4", label: "Emma Reyes mentioned in 3 new memories", time: "Yesterday" },
  { id: "a5", label: "Weekly brief generated", time: "Monday" },
];

export const quickActions = [
  { id: "qa1", label: "Upload a document", href: "/inbox?tab=file" },
  { id: "qa2", label: "Paste a URL", href: "/inbox?tab=url" },
  { id: "qa3", label: "Write a quick note", href: "/inbox?tab=note" },
  { id: "qa4", label: "Ask Zetta anything", href: "/chat" },
];

export interface Commitment {
  id: string;
  title: string;
  due: string;
  person: string;
  project: string;
  done: boolean;
}

export const openCommitments: Commitment[] = [
  { id: "c1", title: "Send updated pricing model to Priya", due: "Today", person: "You", project: "Pricing Overhaul", done: false },
  { id: "c2", title: "Review teardown doc with design", due: "Today", person: "Liam", project: "Zetta Core", done: false },
  { id: "c3", title: "Draft Series A one-pager", due: "Tomorrow", person: "You", project: "Fundraising", done: false },
  { id: "c4", title: "Schedule follow-up with Ops interviewee", due: "Fri", person: "Noor", project: "Discovery", done: false },
  { id: "c5", title: "Ship onboarding empty-state copy", due: "Mon", person: "You", project: "Onboarding", done: true },
];

export const dailyBrief = {
  date: "Saturday, July 4",
  summary:
    "Three threads moved forward this week: pricing converged on usage-based tiers, the competitive teardown surfaced a clear retrieval-UX gap, and onboarding research pointed at first-run friction. Nothing is blocked, but the pricing model needs Priya's churn numbers before Monday's review.",
  highlights: [
    "Pricing Overhaul is now the most-connected project this week (+14 links).",
    "Emma Reyes appears across 3 unrelated threads — worth a direct sync.",
    "No new memories added to Fundraising since Tuesday.",
  ],
  followUps: [
    "Nudge Priya about churn modeling before the Monday pricing review.",
    "Turn the Ops interview into a written summary before it goes stale.",
    "Reconcile the two conflicting definitions of \u201cactive user.\u201d",
  ],
};

export interface Person {
  id: string;
  name: string;
  role: string;
  mentions: number;
  lastMentioned: string;
  initials: string;
}

export const people: Person[] = [
  { id: "p1", name: "Priya Nandan", role: "Growth Lead", mentions: 22, lastMentioned: "2h ago", initials: "PN" },
  { id: "p2", name: "Emma Reyes", role: "Design", mentions: 18, lastMentioned: "Yesterday", initials: "ER" },
  { id: "p3", name: "Liam Ostrander", role: "Engineering", mentions: 15, lastMentioned: "Yesterday", initials: "LO" },
  { id: "p4", name: "Noor Al-Sayed", role: "Research", mentions: 9, lastMentioned: "2 days ago", initials: "NA" },
];

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; type: MemoryType }[];
}

export const sampleConversation: ChatMessage[] = [
  {
    id: "c-1",
    role: "user",
    content: "What did we decide about pricing this week, and who still owes me something?",
  },
  {
    id: "c-2",
    role: "assistant",
    content:
      "You leaned toward usage-based tiers over a flat SaaS price during Tuesday's pricing sync, with the main open question being churn sensitivity at the top tier. Priya still owes you the churn model — it's the one thing blocking Monday's review. Separately, the competitive teardown suggests your retrieval UX is already ahead of Mem and Rewind, which could support a slightly higher anchor price.",
    sources: [
      { title: "Q3 pricing strategy notes", type: "meeting" },
      { title: "Competitive teardown — Mem, Rewind, Reflect", type: "document" },
    ],
  },
];

export const suggestedPrompts = [
  "What's changed in Pricing Overhaul since last week?",
  "Summarize everything I know about Emma Reyes",
  "What haven't I followed up on?",
  "Draft a recap of the Ops interview",
];

export interface GraphNodeData {
  id: string;
  label: string;
  kind: "project" | "person" | "meeting" | "idea" | "task" | "document";
  x: number;
  y: number;
}

export const graphNodes: GraphNodeData[] = [
  { id: "n1", label: "Zetta Core", kind: "project", x: 420, y: 80 },
  { id: "n2", label: "Pricing Overhaul", kind: "project", x: 120, y: 220 },
  { id: "n3", label: "Priya Nandan", kind: "person", x: 60, y: 380 },
  { id: "n4", label: "Pricing Sync", kind: "meeting", x: 260, y: 380 },
  { id: "n5", label: "Competitive teardown", kind: "document", x: 560, y: 220 },
  { id: "n6", label: "Emma Reyes", kind: "person", x: 700, y: 340 },
  { id: "n7", label: "Retrieval UX gap", kind: "idea", x: 560, y: 380 },
  { id: "n8", label: "Send churn model", kind: "task", x: 60, y: 500 },
  { id: "n9", label: "Onboarding", kind: "project", x: 380, y: 500 },
  { id: "n10", label: "First-run friction", kind: "idea", x: 380, y: 620 },
];

export const graphEdges: { id: string; source: string; target: string }[] = [
  { id: "e1", source: "n1", target: "n2" },
  { id: "e1b", source: "n1", target: "n5" },
  { id: "e2", source: "n2", target: "n3" },
  { id: "e3", source: "n2", target: "n4" },
  { id: "e4", source: "n4", target: "n3" },
  { id: "e5", source: "n5", target: "n7" },
  { id: "e6", source: "n5", target: "n6" },
  { id: "e7", source: "n3", target: "n8" },
  { id: "e8", source: "n1", target: "n9" },
  { id: "e9", source: "n9", target: "n10" },
];

export const searchResults: MemoryItem[] = recentMemories;

export const filterChips = ["All", "Documents", "URLs", "Notes", "Meetings", "Research", "People", "Projects"];
