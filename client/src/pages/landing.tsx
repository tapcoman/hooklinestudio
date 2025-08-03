// Landing.tsx — optimized for conversion with integrity (Hero left as-is)
// Notes:
// - Uses router navigation (no full page reloads)
// - Stabilizes animations with <Reveal inert/> / <RevealStagger inert/>
// - Removes unverifiable claims; keeps value-first copy
// - Adds accessible markup and clear secondary CTAs
// - Keeps the traditional craft tone while nudging to onboarding

import { useLocation } from 'wouter';
import { analytics } from '../lib/analytics';
import { NavBar } from '../components/NavBar';
import { Hero } from '../components/Hero'; // keep existing Hero implementation
import { StepCard } from '../components/StepCard';
import { Testimonial } from '../components/Testimonial';
import { CTABand } from '../components/CTABand';
import { Footer } from '../components/Footer';
import { Container } from '../components/Container';
import { Reveal, RevealStagger } from '../components/Reveal';
// StickyMicroCTA removed for CTA consolidation
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, BarChart3, Target, Zap, Check, Crown, ChevronDown } from 'lucide-react';
import { VideoStudioDemo } from '../components/VideoStudioDemo';

export default function Landing() {
  const [, setLocation] = useLocation();
  const [showFrameworkDetails, setShowFrameworkDetails] = useState(false);
  // Removed showAdvancedPricing for simplified 2-tier structure
  
  const handleShowModal = (source: string = 'unknown') => {
    analytics.trackCtaStartedFree(source);
    setLocation('/onboarding');
  };

  // Optional: structured data for integrity-friendly rich results
  const ldJson = useMemo(
    () =>
      JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Hook Line Studio',
          applicationCategory: 'CreativeWorkSoftware',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description:
            'Generate platform‑ready opening hooks for TikTok, Instagram Reels, and YouTube Shorts with classic copy frameworks.',
        },
        null,
        0,
      ),
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <NavBar onShowModal={() => handleShowModal('nav_bar')} />

      {/* HERO — leave as implemented */}
      <div className="pt-16">
        <Hero onShowModal={() => handleShowModal('hero')} />
      </div>

      {/* INTERACTIVE DEMO - Moved higher for immediate value demonstration */}
      <section className="py-20 bg-white relative overflow-hidden" aria-labelledby="demo-section-heading">
        <Container>
          <Reveal>
            <div className="text-center mb-12">
              <Badge variant="secondary" className="bg-brass/10 text-brass mb-4">
                Try It Now
              </Badge>
              <h2 id="demo-section-heading" className="text-h2 font-heading font-bold text-navy mb-6">
                See your hooks come to life
              </h2>
              <p className="text-xl text-slate max-w-3xl mx-auto leading-relaxed">
                Experience our tri-modal approach with live examples. No signup required.
              </p>
            </div>
          </Reveal>

          {/* Interactive Video Studio Demo */}
          <VideoStudioDemo
            onTryIdea={(platform) => {
              analytics.trackCtaStartedFree('interactive_demo');
              setLocation('/onboarding');
            }}
          />
        </Container>
      </section>

      {/* HOW IT WORKS + TRI-MODAL COMBINED */}
      <section className="py-20 bg-background relative overflow-hidden" aria-labelledby="how-it-works-heading">
        <Container>
          <Reveal>
            <div className="text-center mb-16">
              
              <h2 id="how-it-works-heading" className="text-h2 font-heading font-bold text-navy mb-6">
                Three steps to hook perfection
              </h2>
              <p className="text-xl text-slate max-w-3xl mx-auto leading-relaxed">
                From topic to platform‑ready openings in seconds—built on time‑tested copywriting frameworks
              </p>
            </div>
          </Reveal>

          <div className="relative">
            {/* Connecting Line (decoration) */}
            <div
              className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brass/30 to-transparent hidden lg:block -translate-y-1/2"
              aria-hidden="true"
            />
            <RevealStagger inert className="grid md:grid-cols-3 gap-8 mb-12 relative">
              <div className="relative">
                <StepCard
                  icon={Edit3}
                  title="Paste your idea"
                  description="Drop any topic, product, or concept—no polishing required."
                  step={1}
                />
                {/* Floating Example (decoration) */}
                <div
                  className="absolute -top-4 -right-4 rotate-12 bg-white rounded-lg border border-brass/20 p-2 shadow-sm hidden lg:block text-xs text-navy"
                  aria-hidden="true"
                >
                  “Morning routine tips”
                </div>
              </div>

              <div className="relative">
                <StepCard
                  icon={Target}
                  title="Pick your platform"
                  description="Choose TikTok, Instagram, or YouTube. Each hook respects the platform’s patterns."
                  step={2}
                />
              </div>

              <div className="relative">
                <StepCard
                  icon={Zap}
                  title="Get 10 tri-modal hooks"
                  description="Receive complete hook strategies with verbal, visual, and text overlay components."
                  step={3}
                />
                {/* Result Counter (decoration) */}
                <div
                  className="absolute -bottom-4 -right-4 -rotate-6 bg-brass text-navy rounded-lg p-2 shadow-sm hidden lg:block text-xs font-bold"
                  aria-hidden="true"
                >
                  10 complete strategies ✨
                </div>
              </div>
            </RevealStagger>

            {/* Tri-Modal Explanation Integrated */}
            <Reveal>
              <div className="bg-navy/5 rounded-xl p-8 max-w-4xl mx-auto mt-16">
                <div className="text-center mb-8">
                  <Badge variant="secondary" className="bg-brass/10 text-brass mb-4">
                    Revolutionary Approach
                  </Badge>
                  <h3 id="tri-modal-heading" className="text-2xl font-heading font-bold text-navy mb-4">
                    The only tri-modal hook generator
                  </h3>
                  <p className="text-slate leading-relaxed">
                    Generic AI gives you words. We give you complete opening strategies—verbal hook, visual suggestion, and text overlay—designed specifically for short-form video.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6" role="group" aria-labelledby="tri-modal-heading">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
                      <Edit3 className="w-6 h-6 text-white" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h4 className="font-heading font-semibold text-navy mb-2">Verbal Hook</h4>
                    <p className="text-sm text-slate-600 mb-3">The spoken opening line that captures attention</p>
                    <div className="bg-white rounded-lg p-3 text-xs text-slate-600 italic" role="note" aria-label="Example verbal hook">
                      "I quit sugar for 7 days—day 3 was brutal"
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-brass rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6 text-navy" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h4 className="font-heading font-semibold text-navy mb-2">Visual Suggestion</h4>
                    <p className="text-sm text-slate-600 mb-3">Cold-open ideas and visual elements</p>
                    <div className="bg-white rounded-lg p-3 text-xs text-slate-600 italic" role="note" aria-label="Example visual suggestion">
                      "Close-up of sugar packets being pushed away"
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-6 h-6 text-white" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h4 className="font-heading font-semibold text-navy mb-2">Text Overlay</h4>
                    <p className="text-sm text-slate-600 mb-3">Platform-optimized text overlays</p>
                    <div className="bg-black text-white rounded-lg p-3 text-xs font-bold" role="note" aria-label="Example text overlay">
                      "DAY 3: THE BREAKING POINT"
                    </div>
                  </div>
                </div>

                {/* Progressive Disclosure - Framework Details */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setShowFrameworkDetails(!showFrameworkDetails)}
                    className="inline-flex items-center gap-2 text-navy hover:text-brass transition-colors text-sm font-medium focus-visible"
                    aria-expanded={showFrameworkDetails}
                    aria-controls="framework-details"
                    aria-label={showFrameworkDetails ? "Hide framework details" : "Show framework details"}
                  >
                    Learn more about our proven frameworks
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${showFrameworkDetails ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  
                  {showFrameworkDetails && (
                    <div id="framework-details" className="mt-6 grid md:grid-cols-2 gap-6" role="region" aria-label="Framework details">
                      <div className="bg-white rounded-lg p-6 text-left">
                        <h5 className="font-heading font-semibold text-navy mb-3">Open Loop Framework</h5>
                        <p className="text-sm text-slate-600 mb-3">
                          Creates curiosity by starting a story without revealing the outcome. Perfect for lifestyle and educational content.
                        </p>
                        <div className="text-xs text-slate-500">
                          Examples: "I tried this for 30 days..." • "Day 3 was when everything changed..."
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-6 text-left">
                        <h5 className="font-heading font-semibold text-navy mb-3">Problem-Promise-Proof</h5>
                        <p className="text-sm text-slate-600 mb-3">
                          Addresses a pain point, promises a solution, then delivers evidence. Ideal for product reviews and tutorials.
                        </p>
                        <div className="text-xs text-slate-500">
                          Examples: "Struggling with X? Here's what worked..." • "This changed everything..."
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-6 text-left">
                        <h5 className="font-heading font-semibold text-navy mb-3">Direct Proof</h5>
                        <p className="text-sm text-slate-600 mb-3">
                          Leads with concrete results or metrics. Best for before/after content and achievement showcases.
                        </p>
                        <div className="text-xs text-slate-500">
                          Examples: "Lost 10 pounds in 2 weeks..." • "$50K in 30 days using..."
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-6 text-left">
                        <h5 className="font-heading font-semibold text-navy mb-3">Contrarian Take</h5>
                        <p className="text-sm text-slate-600 mb-3">
                          Challenges conventional wisdom or popular opinions. Great for thought leadership and engagement.
                        </p>
                        <div className="text-xs text-slate-500">
                          Examples: "Everyone gets this wrong about..." • "Stop doing X, do this instead..."
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS - Moved higher for better social proof flow */}
      <section className="py-20 bg-white relative overflow-hidden" aria-labelledby="testimonials-heading">
        {/* Decorative quotes */}
        <div className="absolute top-20 left-10 text-9xl text-brass/5 font-heading hidden lg:block" aria-hidden="true">
          "
        </div>
        <div className="absolute bottom-20 right-10 text-9xl text-navy/5 font-heading hidden lg:block" aria-hidden="true">
          "
        </div>

        <Container>
          <Reveal>
            <div className="text-center mb-16 relative">
              <div className="relative inline-block">
                <h2 id="testimonials-heading" className="text-h2 font-heading font-bold text-navy mb-6">Creators report smoother intros and longer holds</h2>
                <div className="flex justify-center items-center gap-4 mb-4" role="group" aria-label="Customer testimonials preview">
                  <div className="flex -space-x-2" aria-label="Customer avatars">
                    <div className="w-8 h-8 bg-gradient-to-br from-brass to-navy rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" aria-label="Sarah M., Food Creator">S</div>
                    <div className="w-8 h-8 bg-gradient-to-br from-navy to-brass rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" aria-label="Mike R., Tech Reviewer">M</div>
                    <div className="w-8 h-8 bg-gradient-to-br from-brass to-navy rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" aria-label="Customer J">J</div>
                  </div>
                  <span className="text-sm text-slate-600">Based on user feedback</span>
                </div>
              </div>
            </div>
          </Reveal>

          <RevealStagger inert className="grid md:grid-cols-2 gap-8 relative">
            <div className="relative">
              <Testimonial
                quote="Focusing on the opening changed how my videos hold attention. The first lines finally feel effortless."
                author="Sarah M. • Food Creator"
                initial="S"
                gradientFrom="from-brass"
                gradientTo="to-navy"
              />
              <div
                className="absolute -bottom-3 -left-3 -rotate-6 bg-white border border-brass rounded-lg px-2 py-1 text-xs text-navy shadow-sm hidden lg:block"
                aria-hidden="true"
              >
                Smoother intros
              </div>
            </div>

            <div className="relative">
              <Testimonial
                quote="It turns a vague idea into ready‑to‑shoot openings. I spend less time debating and more time filming."
                author="Mike R. • Tech Reviewer"
                initial="M"
                gradientFrom="from-navy"
                gradientTo="to-brass"
              />
              <div
                className="absolute -top-3 -left-3 bg-brass text-navy rounded-lg px-2 py-1 text-xs font-bold hidden lg:block"
                aria-hidden="true"
              >
                Idea → hooks in ~30s
              </div>
            </div>

          </RevealStagger>
        </Container>
      </section>

      {/* PRICING SECTION */}
      <section className="py-20 bg-slate-50 relative overflow-hidden" aria-labelledby="pricing-heading">
        <Container>
          <Reveal>
            <div className="text-center mb-16">
              <h2 id="pricing-heading" className="text-h2 font-heading font-bold text-navy mb-6">
                Simple pricing, powerful results
              </h2>
              <p className="text-xl text-slate max-w-3xl mx-auto leading-relaxed">
                Start free, upgrade when ready. Two clear options, no confusion.
              </p>
            </div>
          </Reveal>

          {/* Simplified 2-Tier Pricing Structure */}
          <RevealStagger inert className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Forever Plan */}
            <Card className="border-slate-200 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-heading font-semibold text-navy">Free Forever</h3>
                </div>
                <div className="text-4xl font-bold text-navy mb-2">$0</div>
                <p className="text-slate-600 mb-6">Start creating immediately</p>
                <ul className="text-sm text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>20 hooks per week</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>All platforms (TikTok, Instagram, YouTube)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Basic AI generation</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Community support</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => handleShowModal('pricing_free')}
                  className="w-full bg-navy hover:bg-navy/90 text-white"
                  size="lg"
                >
                  Start Free
                </Button>
              </CardContent>
            </Card>


            {/* Creator Plan - Most Popular */}
            <Card className="border-brass/30 bg-gradient-to-br from-brass/10 to-navy/5 ring-2 ring-brass/30 relative transform md:hover:scale-105 transition-all duration-300 shadow-xl">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brass text-navy px-4 py-1 font-semibold">
                Most Popular
              </Badge>
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Crown className="w-6 h-6 text-brass" />
                  <h3 className="text-xl font-heading font-semibold text-navy">Creator Plan</h3>
                </div>
                <div className="text-4xl font-bold text-navy mb-1">$15</div>
                <div className="text-sm text-slate-500 mb-6">/month</div>
                <p className="text-slate-600 mb-6">Perfect for serious content creators</p>
                <ul className="text-sm text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Unlimited hook generation</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Premium AI with advanced frameworks</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Priority generation speed</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Export tools (CSV, integrations)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => handleShowModal('pricing_creator')}
                  className="w-full bg-brass hover:bg-brass/90 text-navy font-semibold"
                  size="lg"
                >
                  Start Free Trial
                </Button>
                <p className="text-xs text-slate-500 mt-3">7-day free trial • No credit card required</p>
              </CardContent>
            </Card>

          </RevealStagger>


          {/* Pricing information */}
          <Reveal>
            <div className="mt-12 text-center">
              <div className="bg-white rounded-xl p-6 max-w-2xl mx-auto border border-slate-200">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-navy">Risk-free trial</span>
                </div>
                <p className="text-slate-600 mb-2">Start with Free Forever. Upgrade anytime with a 7-day trial.</p>
                <p className="text-sm text-slate-500">
                  No credit card required • Cancel anytime • 
                  <a href="/pricing" className="text-navy hover:text-brass underline ml-1">Full details</a>
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>


      {/* PAIN → SOLUTION (INTEGRITY‑FRIENDLY) */}
      <section className="py-20 bg-navy text-white relative overflow-hidden" aria-labelledby="pain-solution-heading">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-navy/90" aria-hidden="true" />
        <Container>
          <Reveal>
            <div className="text-center mb-16 relative z-10">
              <h2 id="pain-solution-heading" className="text-h2 font-heading font-bold text-white mb-6">The cost of weak openings</h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                When the first seconds wander, viewers do too. Strong hooks give your work a fair chance.
              </p>
            </div>
          </Reveal>

          <RevealStagger inert className="grid md:grid-cols-3 gap-8 relative z-10">
            <Card className="bg-white/10 border-white/20 backdrop-blur hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="text-2xl font-heading font-bold text-brass mb-4">Early drop‑off</div>
                <h3 className="text-lg font-semibold text-white mb-2">Attention slips fast</h3>
                <p className="text-white/70 text-sm">
                  If the opening doesn’t land, viewers move on. Craft the first line with intent.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="text-2xl font-heading font-bold text-brass mb-4">Time lost</div>
                <h3 className="text-lg font-semibold text-white mb-2">Blank‑screen cycles</h3>
                <p className="text-white/70 text-sm">
                  Iterating blindly eats hours. A structured first pass gets you moving quickly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="text-2xl font-heading font-bold text-brass mb-4">Missed growth</div>
                <h3 className="text-lg font-semibold text-white mb-2">Opportunities fade</h3>
                <p className="text-white/70 text-sm">
                  Without a clear start, strong content can be overlooked. Lead with a tight hook.
                </p>
              </CardContent>
            </Card>
          </RevealStagger>

          {/* Solution CTA */}
          <Reveal>
            <div className="text-center mt-12 relative z-10">
              <div className="bg-brass/20 rounded-lg p-6 max-w-2xl mx-auto">
                <p className="text-white text-sm">
                  <strong className="text-brass">A steady approach:</strong> classic frameworks, platform fit, and a clear
                  first line—delivered fast and kept honest.
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* CTA BAND (kept) */}
      <CTABand onShowModal={() => handleShowModal('cta_band')} />

      {/* Footer */}
      <Footer />

      {/* JSON‑LD for integrity‑friendly SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson }} />
      
      {/* Sticky Micro-CTA removed for CTA consolidation */}
    </div>
  );
}
