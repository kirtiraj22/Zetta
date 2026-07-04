import { Sidebar } from "@/components/shared/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-void">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-aurora-1 blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-aurora-2 blur-3xl opacity-30" />
      </div>
      <Sidebar />
      <main className="md:pl-[220px]">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}
