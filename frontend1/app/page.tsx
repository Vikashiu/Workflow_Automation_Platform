import Image from "next/image";
import { Navbar } from "@/component/Navbars/Navbar";
import { HeroLanding } from "@/component/heroSections/HeroSection";
import { HeroVideo } from "@/component/heroSections/HeroVideo";
import { Footer } from "@/component/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern relative flex flex-col font-sans">
      {/* Subtle fade overlay for grid */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-x border-border/40 bg-background/50 backdrop-blur-sm">
          <div className="py-12 md:py-20 lg:py-24">
            <HeroLanding />

            <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="h-px w-full max-w-sm bg-gradient-to-r from-transparent via-border to-transparent"></div>
              <span className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase text-center bg-muted/50 px-4 py-1 rounded-full">
                Your Complete Toolkit for AI Automation
              </span>
              <div className="h-px w-full max-w-sm bg-gradient-to-r from-transparent via-border to-transparent"></div>
            </div>

            <HeroVideo />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}