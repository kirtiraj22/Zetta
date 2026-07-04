import { FileText, Link2, StickyNote, Users2, FlaskConical } from "lucide-react";
import type { MemoryType } from "@/lib/mock-data";

export const memoryIconMap: Record<MemoryType, typeof FileText> = {
  document: FileText,
  url: Link2,
  note: StickyNote,
  meeting: Users2,
  research: FlaskConical,
};

export const memoryLabelMap: Record<MemoryType, string> = {
  document: "Document",
  url: "URL",
  note: "Note",
  meeting: "Meeting",
  research: "Research",
};
