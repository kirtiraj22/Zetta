"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="relative px-6 py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-1 blur-3xl opacity-70" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="font-display text-3xl leading-tight text-ink sm:text-5xl">
          Stop starting from <span className="italic text-gradient">zero.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] text-muted">
          Every question you ask an AI today disappears tomorrow. Give it
          somewhere to keep what it learns.
        </p>
        <div className="mt-9">
          <Button asChild size="lg" variant="gradient">
            <Link href="/dashboard">
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-faint sm:flex-row">
        <span>&copy; 2026 Zetta. Your AI Memory Operating System.</span>
        <div className="flex gap-5">
          <a href="#" className="hover:text-ink">Privacy</a>
          <a href="#" className="hover:text-ink">Terms</a>
          <a href="#" className="hover:text-ink">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
