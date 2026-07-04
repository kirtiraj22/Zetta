import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { ProductPreview } from "@/components/landing/product-preview";
import { Lifecycle } from "@/components/landing/lifecycle";
import { GraphPreview } from "@/components/landing/graph-preview";
import { BriefChatPreview } from "@/components/landing/brief-chat-preview";
import { FinalCta, Footer } from "@/components/landing/final-cta";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-void">
      <LandingNav />
      <Hero />
      <ProductPreview />
      <Lifecycle />
      <GraphPreview />
      <BriefChatPreview />
      <FinalCta />
      <Footer />
    </main>
  );
}
