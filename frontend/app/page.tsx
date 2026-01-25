import { Hero, ValueProposition, HowItWorks, Features, Stats, EstimateCalculator, CTA } from '@/components/landing'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Gradient background that stays fixed */}
      <div className="gradient-bg" />

      <Navbar />

      <main className="flex-1 pt-16 lg:pt-20">
        <Hero />
        <ValueProposition />
        <Stats />
        <HowItWorks />
        <Features />
        <EstimateCalculator />
        <CTA />
      </main>

      <Footer />
    </div>
  )
}
