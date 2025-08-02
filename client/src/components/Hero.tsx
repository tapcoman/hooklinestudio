import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Shield, Star, TrendingUp, Clock, Users, Play, Zap, Target, Award, X } from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from 'react-icons/si';
import { Container } from './Container';
import { MiniDemo } from './MiniDemo';
import { Reveal } from './Reveal';
import { TrustSignalGroup, LiveActivityIndicator, RealtimeSignupCounter, MoneyBackGuarantee } from './TrustSignals';
import { RecentlyJoined, HighDemandIndicator } from './UrgencyIndicators';
import { useReducedMotionSafe } from '../hooks/useReducedMotionSafe';
import { useCountUp } from '../hooks/useCountUp';
import { analytics } from '../lib/analytics';
import { memo, useCallback, useState, useMemo } from 'react';

interface HeroProps { onShowModal: () => void; }

const HeroComponent = ({ onShowModal }: HeroProps) => {
  const prefersReducedMotion = useReducedMotionSafe();
  const [, setLocation] = useLocation();
  const [showDemo, setShowDemo] = useState(false);
  const [viewersCount, setViewersCount] = useState(12);

  // Animated counters for social proof
  const { count: creatorsCount, ref: creatorsRef } = useCountUp({ end: 1200, duration: 2000 });
  const { count: hooksCount, ref: hooksRef } = useCountUp({ end: 50000, duration: 2500 });
  const { count: ratingCount, ref: ratingRef } = useCountUp({ end: 4.8, duration: 1500, decimals: 1 });

  const handleCtaClick = useCallback(() => {
    analytics.trackCtaStartedFree('hero_primary');
    setLocation('/onboarding');
  }, [setLocation]);

  const handleDemoClick = useCallback(() => {
    setShowDemo(true);
    analytics.track('hero_demo_viewed', { source: 'hero_secondary_cta' });
  }, []);

  const handlePrefetchOnboarding = useCallback(() => {
    // Prefetch onboarding page on hover
    import('../pages/onboarding').catch(() => {});
  }, []);

  // Simulate live viewers count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewersCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(8, Math.min(20, prev + change));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main id="main-content" className="relative py-12 lg:py-20 bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden" role="main" aria-labelledby="hero-heading">
      {/* Enhanced Background Pattern with Conversion Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-brass/15 to-navy/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-navy/15 to-brass/15 rounded-full blur-3xl"></div>
        {/* Trust Signal Background Elements */}
        <div className="absolute top-32 right-20 w-32 h-32 bg-green-500/5 rounded-full blur-2xl"></div>
      </div>
      
      <Container>
        {/* F-Pattern Layout - Top Horizontal Bar */}
        <Reveal delay={0.05}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 relative z-10">
            {/* Trust Signals - Left Side (F-Pattern Start) */}
            <div className="flex items-center gap-6 mb-4 lg:mb-0">
              <div className="flex items-center gap-2 bg-green-50 rounded-full px-4 py-2 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-800">Live System</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{viewersCount}</span> viewing now
              </div>
            </div>
            
            {/* Social Proof - Right Side */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-slate-600 ml-2" ref={ratingRef}>{ratingCount}/5 rating</span>
              </div>
              <Badge className="bg-brass/10 text-brass border-brass/30">
                Featured on Product Hunt
              </Badge>
            </div>
          </div>
        </Reveal>

        {/* F-Pattern Main Content Area */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Column - Value Proposition (F-Pattern Left Vertical) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Attention-Grabbing Headline */}
            <Reveal delay={0.1}>
              <div className="space-y-6">
                {/* Urgency Badge */}
                <div className="inline-flex items-center gap-2 bg-red-50 rounded-full px-4 py-2 border border-red-200">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-800">Limited Beta Access</span>
                </div>
                
                <h1 id="hero-heading" className="text-4xl lg:text-6xl xl:text-7xl font-heading font-bold text-navy leading-tight">
                  <span className="sr-only">Hook Line Studio: </span>
                  Win the first&nbsp;
                  <span
                    className={`bg-gradient-to-r from-brass to-orange-500 bg-clip-text text-transparent relative inline-block ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
                    aria-label="Emphasized text: 2 seconds"
                  >
                    2 seconds
                  </span>
                  <br />
                  <span className="block text-3xl lg:text-5xl xl:text-6xl mt-2">of every video</span>
                </h1>

                {/* Clear Value Proposition */}
                <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed max-w-2xl">
                  Generate <strong className="text-navy">10 platform-ready hooks</strong> from any idea with our 
                  revolutionary tri-modal AI approach
                </p>

                {/* Benefit Pills */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200 shadow-sm">
                    <Zap className="w-4 h-4 text-brass" />
                    <span className="text-sm font-semibold text-navy">30-second generation</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-navy">Framework-backed</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200 shadow-sm">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-navy">Platform-optimized</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Primary CTA Section - Above the Fold */}
            <Reveal delay={0.15}>
              <div className="space-y-6">
                {/* Main CTA with Social Proof */}
                <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-xl relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-brass/20 to-orange-500/20 rounded-full blur-xl"></div>
                  
                  <div className="relative z-10 space-y-4">
                    {/* Risk Reversal */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">No Credit Card Required</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-sm font-semibold text-green-800">Cancel Anytime</span>
                    </div>
                    
                    {/* Dual CTA Strategy */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        size="lg"
                        className="text-lg px-8 py-4 bg-gradient-to-r from-navy to-navy/90 hover:from-navy/90 hover:to-navy text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 focus-visible relative overflow-hidden group"
                        onClick={handleCtaClick}
                        onMouseEnter={handlePrefetchOnboarding}
                        aria-describedby="primary-cta-description"
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          Start Free Trial
                          <ArrowRight className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-brass to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" aria-hidden="true"></div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="lg"
                        className="text-lg px-8 py-4 border-2 border-navy text-navy hover:bg-navy hover:text-white rounded-2xl transition-all duration-300"
                        onClick={handleDemoClick}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Watch Demo (45s)
                      </Button>
                    </div>
                    
                    {/* Conversion Elements */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>20 hooks per week free</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>Setup in 30 seconds</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span ref={creatorsRef}>Join {creatorsCount}+ creators</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Urgency Element */}
                <div className="text-center">
                  <RealtimeSignupCounter />
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column - Interactive Demo (F-Pattern Right Side) */}
          <div className="lg:col-span-5">
            <Reveal delay={0.2}>
              <div className="relative">
                {/* Platform Indicators with Hover Effects */}
                <div className="mb-6 text-center">
                  <p className="text-slate-600 mb-4 text-lg font-medium">Works perfectly with</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="group flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                      <SiTiktok className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold text-navy text-sm">TikTok</span>
                    </div>
                    <div className="group flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                      <SiInstagram className="w-6 h-6 text-pink-600 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold text-navy text-sm">Instagram</span>
                    </div>
                    <div className="group flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                      <SiYoutube className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold text-navy text-sm">YouTube</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Demo Component */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brass to-navy rounded-3xl blur opacity-20"></div>
                  <div className="relative">
                    <MiniDemo />
                  </div>
                </div>

                {/* Trust Signals */}
                <div className="mt-6 space-y-4">
                  <TrustSignalGroup variant="minimal" className="justify-center" />
                  
                  {/* Money-Back Guarantee */}
                  <div className="text-center">
                    <MoneyBackGuarantee />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Below-the-Fold Social Proof with Animated Counters */}
        <Reveal delay={0.25}>
          <div className="mt-16 text-center relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="space-y-2" ref={creatorsRef}>
                <div className="text-3xl font-bold text-navy">{creatorsCount}+</div>
                <div className="text-sm text-slate-600">Active Creators</div>
              </div>
              <div className="space-y-2" ref={hooksRef}>
                <div className="text-3xl font-bold text-navy">{hooksCount > 1000 ? `${Math.floor(hooksCount/1000)}K` : hooksCount}+</div>
                <div className="text-sm text-slate-600">Hooks Generated</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-navy">30s</div>
                <div className="text-sm text-slate-600">Avg. Generation</div>
              </div>
              <div className="space-y-2" ref={ratingRef}>
                <div className="text-3xl font-bold text-navy">{ratingCount}★</div>
                <div className="text-sm text-slate-600">User Rating</div>
              </div>
            </div>
            
            {/* Live Activity Indicator */}
            <div className="mt-8 flex justify-center">
              <LiveActivityIndicator />
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative">
            <button
              onClick={() => setShowDemo(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors duration-200"
              aria-label="Close demo"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-navy">See Hook Line Studio in Action</h3>
              <p className="text-slate-600">Watch how easy it is to generate viral hooks in seconds</p>
              <div className="bg-slate-100 rounded-2xl aspect-video flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brass/10 to-navy/10"></div>
                <div className="relative z-10 text-slate-500 text-center space-y-2">
                  <Play className="w-16 h-16 mx-auto text-navy/60" />
                  <div>45-second demo video</div>
                  <div className="text-sm">Coming soon</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => {
                    setShowDemo(false);
                    handleCtaClick();
                  }}
                  className="flex-1 bg-navy hover:bg-navy/90 text-white"
                  size="lg"
                >
                  Start Your Free Trial
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDemo(false)}
                  className="flex-1"
                  size="lg"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

// Export memoized component for performance
export const Hero = memo(HeroComponent);
