// import Link from "next/link";
// import { Topbar } from "@/components/shared/topbar";
// import { Card } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { memoryIconMap, memoryLabelMap } from "@/components/shared/memory-icon";
// import {
//   recentMemories,
//   memoryStats,
//   dashboardActivity,
//   quickActions,
//   dailyBrief,
// } from "@/lib/mock-data";
// import { ArrowUpRight, Upload, Link2, StickyNote, MessageSquare, Sunrise } from "lucide-react";

// const statList = [
//   { label: "Total memories", value: memoryStats.totalMemories.toLocaleString() },
//   { label: "New this week", value: `+${memoryStats.newThisWeek}` },
//   { label: "Connections", value: memoryStats.connections.toLocaleString() },
//   { label: "Projects", value: memoryStats.projects.toString() },
// ];

// const quickActionIcons = { qa1: Upload, qa2: Link2, qa3: StickyNote, qa4: MessageSquare };

// export default function DashboardPage() {
//   return (
//     <div>
//       <Topbar title="Good morning, Aiden" description="Here's what your memory surfaced today." />

//       {/* Stat row */}
//       <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
//         {statList.map((s) => (
//           <Card key={s.label} className="p-5">
//             <p className="text-xs uppercase tracking-wide text-faint">{s.label}</p>
//             <p className="mt-2 font-display text-2xl text-ink">{s.value}</p>
//           </Card>
//         ))}
//       </div>

//       <div className="grid gap-6 lg:grid-cols-3">
//         {/* Recent memories */}
//         <Card className="lg:col-span-2">
//           <div className="flex items-center justify-between p-5 pb-0">
//             <h2 className="font-display text-lg text-ink">Recent memories</h2>
//             <Link href="/search" className="text-xs text-muted hover:text-ink">
//               View all
//             </Link>
//           </div>
//           <div className="mt-3 divide-y divide-line">
//             {recentMemories.map((m) => {
//               const Icon = memoryIconMap[m.type];
//               return (
//                 <div key={m.id} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface">
//                   <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-faint">
//                     <Icon className="h-3.5 w-3.5" />
//                   </div>
//                   <div className="min-w-0 flex-1">
//                     <div className="flex items-center gap-2">
//                       <p className="truncate text-sm font-medium text-ink">{m.title}</p>
//                       <Badge variant="default">{memoryLabelMap[m.type]}</Badge>
//                     </div>
//                     <p className="mt-1 line-clamp-1 text-xs text-muted">{m.summary}</p>
//                   </div>
//                   <div className="shrink-0 text-right text-xs text-faint">
//                     <p>{m.addedAt}</p>
//                     <p className="mt-1">{m.connections} links</p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </Card>

//         {/* Right column */}
//         <div className="space-y-6">
//           <Card className="p-5">
//             <div className="mb-3 flex items-center gap-2 text-amber-200">
//               <Sunrise className="h-4 w-4" />
//               <h2 className="font-display text-base text-ink">Today&rsquo;s brief</h2>
//             </div>
//             <p className="line-clamp-4 text-[13px] leading-relaxed text-muted">{dailyBrief.summary}</p>
//             <Link
//               href="/brief"
//               className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-200 hover:text-violet-100"
//             >
//               Read full brief <ArrowUpRight className="h-3 w-3" />
//             </Link>
//           </Card>

//           <Card className="p-5">
//             <h2 className="mb-3 font-display text-base text-ink">Quick actions</h2>
//             <div className="space-y-1.5">
//               {quickActions.map((qa) => {
//                 const Icon = quickActionIcons[qa.id as keyof typeof quickActionIcons];
//                 return (
//                   <Link
//                     key={qa.id}
//                     href={qa.href}
//                     className="flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
//                   >
//                     <Icon className="h-4 w-4" />
//                     {qa.label}
//                   </Link>
//                 );
//               })}
//             </div>
//           </Card>
//         </div>
//       </div>

//       {/* Activity */}
//       <Card className="mt-6 p-5">
//         <h2 className="mb-3 font-display text-base text-ink">Recent activity</h2>
//         <div className="space-y-3">
//           {dashboardActivity.map((a) => (
//             <div key={a.id} className="flex items-center gap-3 text-sm">
//               <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
//               <span className="flex-1 text-muted">{a.label}</span>
//               <span className="shrink-0 text-xs text-faint">{a.time}</span>
//             </div>
//           ))}
//         </div>
//       </Card>
//     </div>
//   );
// }


import Link from "next/link";
import { Topbar } from "@/components/shared/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { memoryIconMap, memoryLabelMap } from "@/components/shared/memory-icon";
import { quickActions } from "@/lib/mock-data"; // still static nav links
import { ArrowUpRight, Upload, Link2, StickyNote, MessageSquare, Sunrise } from "lucide-react";

// --- ONLY NEW IMPORT ---
import { getDashboard } from "@/lib/api-client";

const quickActionIcons = { qa1: Upload, qa2: Link2, qa3: StickyNote, qa4: MessageSquare };

// Server Component: fetch happens on the server, same as before with static mocks.
export default async function DashboardPage() {
  const { stats, recentMemories, dashboardActivity, dailyBrief } = await getDashboard();

  const statList = [
    { label: "Total memories", value: stats.totalMemories.toLocaleString() },
    { label: "New this week", value: `+${stats.newThisWeek}` },
    { label: "Connections", value: stats.connections.toLocaleString() },
    { label: "Projects", value: stats.projects.toString() },
  ];

  return (
    <div>
      <Topbar title="Good morning" description="Here's what your memory surfaced today." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statList.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs uppercase tracking-wide text-faint">{s.label}</p>
            <p className="mt-2 font-display text-2xl text-ink">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="font-display text-lg text-ink">Recent memories</h2>
            <Link href="/search" className="text-xs text-muted hover:text-ink">
              View all
            </Link>
          </div>
          <div className="mt-3 divide-y divide-line">
            {recentMemories.map((m) => {
              const Icon = memoryIconMap[m.type];
              return (
                <div key={m.id} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-faint">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">{m.title}</p>
                      <Badge variant="default">{memoryLabelMap[m.type]}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted">{m.summary}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-faint">
                    <p>{m.addedAt}</p>
                    <p className="mt-1">{m.connections} links</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 text-amber-200">
              <Sunrise className="h-4 w-4" />
              <h2 className="font-display text-base text-ink">Today&rsquo;s brief</h2>
            </div>
            <p className="line-clamp-4 text-[13px] leading-relaxed text-muted">{dailyBrief.summary}</p>
            <Link
              href="/brief"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-200 hover:text-violet-100"
            >
              Read full brief <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-display text-base text-ink">Quick actions</h2>
            <div className="space-y-1.5">
              {quickActions.map((qa) => {
                const Icon = quickActionIcons[qa.id as keyof typeof quickActionIcons];
                return (
                  <Link
                    key={qa.id}
                    href={qa.href}
                    className="flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
                  >
                    <Icon className="h-4 w-4" />
                    {qa.label}
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 font-display text-base text-ink">Recent activity</h2>
        <div className="space-y-3">
          {dashboardActivity.map((a) => (
            <div key={a.id} className="flex items-center gap-3 text-sm">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
              <span className="flex-1 text-muted">{a.label}</span>
              <span className="shrink-0 text-xs text-faint">{a.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}