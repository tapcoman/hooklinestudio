import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from 'react-icons/si';
import { Container } from './Container';
import { MiniDemo } from './MiniDemo';
import { Reveal } from './Reveal';
import { useReducedMotionSafe } from '../hooks/useReducedMotionSafe';
import { analytics } from '../lib/analytics';

interface HeroProps { onShowModal: () => void; }

export function Hero({ onShowModal }: HeroProps) {
  const prefersReducedMotion = useReducedMotionSafe();
  const [, setLocation] = useLocation();

  return (
    <main id="main-content" className="relative py-16 lg:py-24 bg-background" role="main" aria-labelledby="hero-heading">
      <Container>
        {/* Main Hero */}
        <Reveal delay={0.08}>
          <div className="text-center mb-12 space-y-6">
            <h1 id="hero-heading" className="text-4xl lg:text-6xl font-heading font-bold text-navy leading-tight">
              <span className="sr-only">Hook Line Studio: </span>
              <span aria-label="Target icon" role="img">🎯</span> Win the first&nbsp;
              <span
                className={`text-brass relative inline-block ${!prefersReducedMotion ? 'animate-brass-accent' : ''}`}
                style={{ '--accent-delay': '800ms' } as React.CSSProperties}
                aria-label="Emphasized text: 2 seconds"
              >
                2 seconds
                {!prefersReducedMotion && (
                  <span
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-brass origin-left animate-underlineGrow"
                    style={{ animationDelay: '800ms', animationFillMode: 'both' } as React.CSSProperties}
                    aria-hidden="true"
                  />
                )}
              </span>
              <br className="lg:hidden" />
              <span className="block lg:inline"> of any video</span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-700 max-w-xl mx-auto" aria-describedby="hero-description">
              <span id="hero-description">
                Generate 10 platform-ready hooks from any idea
                <br />
                <span className="text-brass font-semibold">
                  <span aria-label="Sparkles icon" role="img">✨</span> Framework-backed • 
                  <span aria-label="Rocket icon" role="img">🚀</span> 30-second generation
                </span>
              </span>
            </p>

            {/* Social Proof Line */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 mt-4" aria-label="Social proof statistics">
              <span className="flex items-center gap-1">
                <span className="text-brass" aria-label="Users icon" role="img">👥</span>
                <span aria-label="Number of creators using our platform">1,200+ creators</span>
              </span>
              <span className="text-slate-400" aria-hidden="true">•</span>
              <span className="flex items-center gap-1">
                <span className="text-brass" aria-label="Lightning icon" role="img">⚡</span>
                <span aria-label="Average generation time">~30s generation</span>
              </span>
              <span className="text-slate-400" aria-hidden="true">•</span>
              <span className="flex items-center gap-1">
                <span className="text-brass" aria-label="Mobile phone icon" role="img">📱</span>
                <span aria-label="Number of supported platforms">3 platforms</span>
              </span>
            </div>
          </div>
        </Reveal>

        {/* Interactive Demo */}
        <Reveal delay={0.15}>
          <div className="relative max-w-4xl mx-auto mb-12">
            <div className="relative flex items-center justify-center">
              <div className="relative z-10 w-full max-w-2xl mx-auto">
                <MiniDemo />
              </div>
            </div>
          </div>
        </Reveal>

        {/* Simplified Platform Indicators */}
        <Reveal delay={0.22}>
          <div className="mb-12 text-center">
            <h2 className="sr-only">Supported Platforms</h2>
            <div className="inline-flex items-center justify-center gap-6 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 border border-brass/20 shadow-lg" role="group" aria-label="Supported social media platforms">
              <div className="flex items-center gap-2" role="group" aria-label="TikTok support">
                <SiTiktok className="w-6 h-6" aria-label="TikTok logo" role="img" />
                <span className="text-sm font-medium text-navy hidden sm:inline">TikTok</span>
              </div>
              <div className="flex items-center gap-2" role="group" aria-label="Instagram support">
                <SiInstagram className="w-6 h-6 text-pink-600" aria-label="Instagram logo" role="img" />
                <span className="text-sm font-medium text-navy hidden sm:inline">Instagram</span>
              </div>
              <div className="flex items-center gap-2" role="group" aria-label="YouTube support">
                <SiYoutube className="w-6 h-6 text-red-600" aria-label="YouTube logo" role="img" />
                <span className="text-sm font-medium text-navy hidden sm:inline">YouTube</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Primary CTA */}
        <Reveal delay={0.28}>
          <section className="text-center space-y-4" aria-labelledby="cta-heading">
            <h2 id="cta-heading" className="sr-only">Get Started with Hook Line Studio</h2>
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-brass/20 shadow-xl max-w-md mx-auto">
              <Button
                size="lg"
                className={`text-lg px-12 py-6 bg-navy hover:bg-navy/90 text-white rounded-button shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full focus-visible ${!prefersReducedMotion ? 'hover:animate-sheen' : ''}`}
                onClick={() => {
                  analytics.trackCtaStartedFree('hero_primary');
                  setLocation('/onboarding');
                }}
                onMouseEnter={() => {
                  // Prefetch onboarding page on hover
                  import('../pages/onboarding').catch(() => {});
                }}
                aria-describedby="cta-description"
              >
                Try it free
                <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
              </Button>
              <p id="cta-description" className="text-sm text-slate-600 mt-3" aria-label="Pricing information">No card required • 20 hooks/week</p>
            </div>
          </section>
        </Reveal>
      </Container>
    </main>
  );
}
