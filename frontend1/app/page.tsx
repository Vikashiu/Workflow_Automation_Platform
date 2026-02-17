import { Navbar } from "@/component/Navbars/Navbar";
import { HeroLanding } from "@/component/heroSections/HeroSection";
import { HeroVideo } from "@/component/heroSections/HeroVideo";
import { Footer } from "@/component/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-primary-100 selection:text-primary-900">
      <Navbar />

      <main className="flex-grow">
        <HeroLanding />

        <div className="w-full bg-slate-50 dark:bg-slate-900 py-16 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase mb-8">
              Your complete toolkit for AI automation
            </p>
            {/* Could add logos of companies here */}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <HeroVideo />
        </div>
      </main>

      <Footer />
    </div>
  );
}