import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from 'react-icons/si';
import { Container } from './Container';
import { MiniDemo } from './MiniDemo';
import { Reveal } from './Reveal';
import { useReducedMotionSafe } from '../hooks/useReducedMotionSafe';
import { analytics } from '../lib/analytics';
import { memo, useCallback } from 'react';

interface HeroProps { onShowModal: () => void; }

const HeroComponent = ({ onShowModal }: HeroProps) => {
  const prefersReducedMotion = useReducedMotionSafe();
  const [, setLocation] = useLocation();

  const handleCtaClick = useCallback(() => {
    analytics.trackCtaStartedFree('hero_primary');
    setLocation('/onboarding');
  }, [setLocation]);

  const handlePrefetchOnboarding = useCallback(() => {
    // Prefetch onboarding page on hover
    import('../pages/onboarding').catch(() => {});
  }, []);

  return (
    <main id="main-content" className="relative py-20 lg:py-32 bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden" role="main" aria-labelledby="hero-heading">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-brass/10 to-navy/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-navy/10 to-brass/10 rounded-full blur-3xl"></div>
      </div>
      
      <Container>
        {/* Main Hero */}
        <Reveal delay={0.08}>
          <div className="text-center mb-16 space-y-8 relative z-10">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brass/10 to-navy/10 rounded-full px-6 py-3 border border-brass/20">
              <span aria-label="Target icon" role="img" className="text-xl">🎯</span>
              <span className="text-sm font-semibold text-navy">AI-Powered Hook Generation</span>
            </div>

            <h1 id="hero-heading" className="text-5xl lg:text-7xl xl:text-8xl font-heading font-bold text-navy leading-tight">
              <span className="sr-only">Hook Line Studio: </span>
              Win the first&nbsp;
              <span
                className={`bg-gradient-to-r from-brass to-orange-500 bg-clip-text text-transparent relative inline-block ${!prefersReducedMotion ? 'animate-brass-accent' : ''}`}
                style={{ '--accent-delay': '800ms' } as React.CSSProperties}
                aria-label="Emphasized text: 2 seconds"
              >
                2 seconds
                {!prefersReducedMotion && (
                  <span
                    className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-brass to-orange-500 origin-left animate-underlineGrow rounded-full"
                    style={{ animationDelay: '800ms', animationFillMode: 'both' } as React.CSSProperties}
                    aria-hidden="true"
                  />
                )}
              </span>
              <br />
              <span className="block"> of any video</span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed" aria-describedby="hero-description">
              <span id="hero-description">
                Generate 10 platform-ready hooks from any idea with our revolutionary tri-modal approach
                <br />
                <span className="text-brass font-semibold mt-4 block">
                  <span aria-label="Sparkles icon" role="img">✨</span> Framework-backed • 
                  <span aria-label="Rocket icon" role="img">🚀</span> 30-second generation • 
                  <span aria-label="Check icon" role="img">✅</span> Platform-optimized
                </span>
              </span>
            </p>

            {/* Enhanced Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8" aria-label="Social proof statistics">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-200 shadow-sm">
                <span className="text-brass text-lg" aria-label="Users icon" role="img">👥</span>
                <div className="text-left">
                  <div className="font-bold text-navy">1,200+</div>
                  <div className="text-xs text-slate-600">creators</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-200 shadow-sm">
                <span className="text-brass text-lg" aria-label="Lightning icon" role="img">⚡</span>
                <div className="text-left">
                  <div className="font-bold text-navy">~30s</div>
                  <div className="text-xs text-slate-600">generation</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-200 shadow-sm">
                <span className="text-brass text-lg" aria-label="Mobile phone icon" role="img">📱</span>
                <div className="text-left">
                  <div className="font-bold text-navy">3</div>
                  <div className="text-xs text-slate-600">platforms</div>
                </div>
              </div>
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

        {/* Enhanced Platform Indicators */}
        <Reveal delay={0.22}>
          <div className="mb-16 text-center relative z-10">
            <h2 className="sr-only">Supported Platforms</h2>
            <p className="text-slate-600 mb-6 text-lg">Works perfectly with all major platforms</p>
            <div className="flex items-center justify-center gap-4 max-w-lg mx-auto" role="group" aria-label="Supported social media platforms">
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" role="group" aria-label="TikTok support">
                <SiTiktok className="w-8 h-8" aria-label="TikTok logo" role="img" />
                <div className="text-left">
                  <div className="font-semibold text-navy text-sm">TikTok</div>
                  <div className="text-xs text-slate-600">Short-form</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" role="group" aria-label="Instagram support">
                <SiInstagram className="w-8 h-8 text-pink-600" aria-label="Instagram logo" role="img" />
                <div className="text-left">
                  <div className="font-semibold text-navy text-sm">Instagram</div>
                  <div className="text-xs text-slate-600">Reels</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" role="group" aria-label="YouTube support">
                <SiYoutube className="w-8 h-8 text-red-600" aria-label="YouTube logo" role="img" />
                <div className="text-left">
                  <div className="font-semibold text-navy text-sm">YouTube</div>
                  <div className="text-xs text-slate-600">Shorts</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Enhanced Primary CTA */}
        <Reveal delay={0.28}>
          <section className="text-center space-y-6 relative z-10" aria-labelledby="cta-heading">
            <h2 id="cta-heading" className="sr-only">Get Started with Hook Line Studio</h2>
            <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-2xl max-w-2xl mx-auto relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-brass/20 to-orange-500/20 rounded-full blur-xl"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-navy/20 to-blue-500/20 rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-4 py-2 mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold text-green-800">Free to Start</span>
                </div>
                
                <h3 className="text-2xl lg:text-3xl font-heading font-bold text-navy mb-4">
                  Transform your ideas into viral hooks
                </h3>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                  Join 1,200+ creators who are already winning the first 2 seconds with our AI-powered tri-modal approach.
                </p>
                
                <Button
                  size="lg"
                  className={`text-lg lg:text-xl px-12 py-6 lg:px-16 lg:py-8 bg-gradient-to-r from-navy to-navy/90 hover:from-navy/90 hover:to-navy text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 w-full lg:w-auto focus-visible relative overflow-hidden group ${!prefersReducedMotion ? 'hover:animate-sheen' : ''}`}
                  onClick={handleCtaClick}
                  onMouseEnter={handlePrefetchOnboarding}
                  aria-describedby="cta-description"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Try Hook Line Studio Free
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brass to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" aria-hidden="true"></div>
                </Button>
                
                <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    No credit card required
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    20 hooks per week
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Results in 30 seconds
                  </span>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </Container>
    </main>
  );
};

// Export memoized component for performance
export const Hero = memo(HeroComponent);
