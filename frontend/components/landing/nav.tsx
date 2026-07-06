"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Infinity as InfinityIcon } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
];

export function LandingNav() {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4">
      <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-full glass-strong px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 pl-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-amber-400 text-void">
            <InfinityIcon className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-[17px] tracking-tight">Zetta</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:text-ink hover:bg-surface"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://github.com"
            className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:text-ink hover:bg-surface"
          >
            GitHub
          </a>
        </div>

        <Button asChild size="sm" variant="primary">
          <Link href="/login">Get started</Link>
        </Button>
      </nav>
    </div>
  );
}
