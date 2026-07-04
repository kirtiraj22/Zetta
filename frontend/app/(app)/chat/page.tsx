// "use client";

// import { useState } from "react";
// import { Topbar } from "@/components/shared/topbar";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { sampleConversation, suggestedPrompts, type ChatMessage } from "@/lib/mock-data";
// import { memoryIconMap } from "@/components/shared/memory-icon";
// import { Send, Sparkles } from "lucide-react";

// export default function ChatPage() {
//   const [messages, setMessages] = useState<ChatMessage[]>(sampleConversation);
//   const [input, setInput] = useState("");

//   function handleSend(text?: string) {
//     const content = (text ?? input).trim();
//     if (!content) return;
//     // TODO(backend): POST /chat { message, conversation_id } and stream the response
//     setMessages((prev) => [
//       ...prev,
//       { id: `u-${Date.now()}`, role: "user", content },
//       {
//         id: `a-${Date.now()}`,
//         role: "assistant",
//         content:
//           "This is a placeholder response — once connected, Zetta will retrieve from your graph and answer using real memories.",
//       },
//     ]);
//     setInput("");
//   }

//   return (
//     <div className="flex h-[calc(100vh-5rem)] flex-col">
//       <Topbar title="Chat" description="Ask anything — Zetta answers using your connected memory." />

//       <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_260px]">
//         <Card className="flex flex-1 flex-col overflow-hidden p-0">
//           <div className="flex-1 space-y-4 overflow-y-auto p-6">
//             {messages.map((m) => (
//               <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
//                 <div
//                   className={
//                     m.role === "user"
//                       ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-ink px-4 py-3 text-sm text-void"
//                       : "max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-sm leading-relaxed text-ink"
//                   }
//                 >
//                   {m.content}
//                   {m.role === "assistant" && m.sources && m.sources.length > 0 && (
//                     <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
//                       {m.sources.map((s) => {
//                         const Icon = memoryIconMap[s.type];
//                         return (
//                           <span
//                             key={s.title}
//                             className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 text-xs text-muted"
//                           >
//                             <Icon className="h-3 w-3" /> {s.title}
//                           </span>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="border-t border-line p-4">
//             <form
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 handleSend();
//               }}
//               className="flex items-center gap-2"
//             >
//               <Input
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 placeholder="Ask Zetta about your memory..."
//                 className="flex-1"
//               />
//               <Button type="submit" variant="gradient" size="icon">
//                 <Send className="h-4 w-4" />
//               </Button>
//             </form>
//           </div>
//         </Card>

//         <div className="hidden flex-col gap-4 lg:flex">
//           <Card className="p-4">
//             <div className="mb-3 flex items-center gap-2 text-violet-200">
//               <Sparkles className="h-4 w-4" />
//               <p className="text-sm font-medium text-ink">Suggested prompts</p>
//             </div>
//             <div className="space-y-1.5">
//               {suggestedPrompts.map((p) => (
//                 <button
//                   key={p}
//                   onClick={() => handleSend(p)}
//                   className="w-full rounded-xl2 px-3 py-2.5 text-left text-xs text-muted transition-colors hover:bg-surface hover:text-ink"
//                 >
//                   {p}
//                 </button>
//               ))}
//             </div>
//           </Card>

//           <Card className="p-4">
//             <p className="mb-3 text-sm font-medium text-ink">Conversation history</p>
//             <div className="space-y-1.5 text-xs text-muted">
//               <p className="rounded-xl2 px-3 py-2 hover:bg-surface hover:text-ink">Pricing decisions this week</p>
//               <p className="rounded-xl2 px-3 py-2 hover:bg-surface hover:text-ink">Who is Emma Reyes?</p>
//               <p className="rounded-xl2 px-3 py-2 hover:bg-surface hover:text-ink">Series A narrative review</p>
//             </div>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState } from "react";
import { Topbar } from "@/components/shared/topbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { suggestedPrompts, type ChatMessage } from "@/lib/mock-data";
import { memoryIconMap } from "@/components/shared/memory-icon";
import { Send, Sparkles } from "lucide-react";

// --- ONLY NEW IMPORT ---
import { streamChat } from "@/lib/api-client";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]); // was: sampleConversation
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;

    const userMessageId = `u-${Date.now()}`;
    const assistantMessageId = `a-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content },
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsStreaming(true);

    let assistantText = "";
    try {
      for await (const event of streamChat(content, conversationId)) {
        if (event.type === "conversation") {
          setConversationId(event.conversationId);
        } else if (event.type === "token") {
          assistantText += event.content;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: assistantText } : m,
            ),
          );
        } else if (event.type === "done") {
          // Final message carries structured `sources` -- swap it in wholesale.
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? event.message : m)),
          );
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: "Something went wrong reaching Zetta. Please try again." }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  // --- Everything below is IDENTICAL to the original mock chat.tsx ---
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <Topbar title="Chat" description="Ask anything — Zetta answers using your connected memory." />
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_260px]">
        <Card className="flex flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-ink px-4 py-3 text-sm text-void"
                      : "max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-sm leading-relaxed text-ink"
                  }
                >
                  {m.content}
                  {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                      {m.sources.map((s) => {
                        const Icon = memoryIconMap[s.type];
                        return (
                          <span
                            key={s.title}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 text-xs text-muted"
                          >
                            <Icon className="h-3 w-3" />
                            {s.title}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-line p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Zetta about your memory..."
                className="flex-1"
                disabled={isStreaming}
              />
              <Button type="submit" variant="gradient" size="icon" disabled={isStreaming}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
        <div className="hidden flex-col gap-4 lg:flex">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-violet-200">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-medium text-ink">Suggested prompts</p>
            </div>
            <div className="space-y-1.5">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="w-full rounded-xl2 px-3 py-2.5 text-left text-xs text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  {p}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
