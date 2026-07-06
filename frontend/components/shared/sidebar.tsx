"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Inbox,
  Share2,
  MessageSquare,
  Sunrise,
  Search,
  Settings,
  LogOut,
  Infinity as InfinityIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/lib/supabase/client";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/graph", label: "Graph", icon: Share2 },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/brief", label: "Brief", icon: Sunrise },
  { href: "/search", label: "Search", icon: Search },
];

export interface SidebarUser {
  name: string;
  email: string | null;
  initials: string;
}

export function Sidebar({ user }: { user?: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-line bg-deep/60 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-amber-400 text-void">
          <InfinityIcon className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="font-display text-[17px] tracking-tight">Zetta</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-surface-hover text-ink"
                  : "text-muted hover:bg-surface hover:text-ink"
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-line px-3 py-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm transition-colors",
            pathname === "/settings" ? "bg-surface-hover text-ink" : "text-muted hover:bg-surface hover:text-ink"
          )}
        >
          <Settings className="h-4 w-4" strokeWidth={1.8} />
          Settings
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl2 px-3 py-2.5">
          <Avatar>
            <AvatarFallback>{user?.initials ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{user?.name ?? "Loading..."}</p>
            <p className="truncate text-xs text-faint">{user?.email ?? ""}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="shrink-0 text-faint transition-colors hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
