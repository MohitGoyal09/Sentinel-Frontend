"use client"

import { useState } from "react"
import { LandingNavbar } from "@/components/landing-page/navbar"
import { LandingFooter } from "@/components/landing-page/footer"
import { Preloader } from "@/components/landing-page/preloader"
import { CustomCursor } from "@/components/landing-page/cursor"
import { NoiseOverlay } from "@/components/landing-page/noise"
import { InteractiveGridBackground } from "@/components/landing-page/interactive-grid-background"
import { TagNavigation } from "@/components/landing-page/tag-navigation"
import { useSmoothScroll } from "@/hooks/use-smooth-scroll"

import { LandingHeroV4 } from "@/components/landing-page/hero-v4"
import { SignalTimeline } from "@/components/landing-page/signal-timeline"
import { VaultPrivacy } from "@/components/landing-page/vault-privacy"
import ThreeEngines from "@/components/landing-page/three-engines"
import { NetworkConstellationSection } from "@/components/landing-page/network-constellation"
import { SocialProof } from "@/components/landing-page/social-proof"
import { Methodology } from "@/components/landing-page/methodology"
import { FAQ } from "@/components/landing-page/faq"
import { FinalCTA } from "@/components/landing-page/final-cta"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  useSmoothScroll()

  const handlePreloaderComplete = () => {
    setIsLoading(false)
    setTimeout(() => setIsLoaded(true), 100)
  }

  return (
    <>
      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}

      <NoiseOverlay />
      <CustomCursor />
      <InteractiveGridBackground />
      <TagNavigation />

      <div
        className={`min-h-screen flex flex-col transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundColor: "#050505" }}
      >
        <LandingNavbar />

        <main className="flex-1 w-full">
          <div id="overview">
            <LandingHeroV4 isLoaded={isLoaded} />
          </div>
          
          <div id="timeline">
            <SignalTimeline />
          </div>
          
          <div id="privacy">
            <VaultPrivacy />
          </div>
          
          <div id="engines">
            <ThreeEngines />
          </div>
          
          <div id="network">
            <NetworkConstellationSection />
          </div>
          
          <div id="proof">
            <SocialProof />
          </div>
          
          <div id="methodology">
            <Methodology />
          </div>
          
          <div id="faq">
            <FAQ />
          </div>
          
          <FinalCTA />
        </main>

        <LandingFooter />
      </div>
    </>
  )
}