"use client";

import { Bell, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Topbar({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="grid h-10 w-10 place-items-center rounded-full glass text-faint transition-colors hover:text-ink">
          <Bell className="h-4 w-4" />
        </button>
        <Button asChild variant="gradient" size="sm">
          <Link href="/inbox">
            <Plus className="h-4 w-4" /> Add memory
          </Link>
        </Button>
      </div>
    </div>
  );
}
