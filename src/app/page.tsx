import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { SplashScreen } from "@/components/brand/SplashScreen";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { LogoCloud } from "@/components/sections/LogoCloud";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { SmartBuckets } from "@/components/sections/SmartBuckets";
import { Features } from "@/components/sections/Features";
import { AIInsights } from "@/components/sections/AIInsights";
import { OwnerSalary } from "@/components/sections/OwnerSalary";
import { Stats } from "@/components/sections/Stats";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { CTASection } from "@/components/sections/CTASection";

export default function HomePage() {
  return (
    <LocaleProvider>
      <SplashScreen />
      <Header />
      <main className="flex-1">
        <Hero />
        <LogoCloud />
        <ProblemSection />
        <HowItWorks />
        <SmartBuckets />
        <Features />
        <AIInsights />
        <OwnerSalary />
        <Stats />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </LocaleProvider>
  );
}
