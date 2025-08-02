import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from 'wouter';
import { Container } from './Container';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  Sparkles, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle, 
  Star,
  TrendingUp,
  Zap
} from 'lucide-react';
import { SiTiktok, SiInstagram, SiYoutube } from 'react-icons/si';

// Constants
const LOGO_URL = "/assets/logo.png";
const SCROLL_THRESHOLD = 10;
const SCROLL_DEBOUNCE_MS = 10;

interface ConversionNavBarProps {
  onShowModal?: () => void;
}

export function ConversionNavBar({ onShowModal }: ConversionNavBarProps = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUrgencyBanner, setShowUrgencyBanner] = useState(true);
  const [location] = useLocation();
  const { user } = useFirebaseAuth();
  const isAuthenticated = !!user;

  // Debounced scroll handler for better performance
  const handleScroll = useCallback(() => {
    const scrolled = window.scrollY > SCROLL_THRESHOLD;
    setIsScrolled(prev => prev !== scrolled ? scrolled : prev);
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, SCROLL_DEBOUNCE_MS);
    };

    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  const handleMobileNavigation = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    if (location === '/') {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  // Context-aware CTA text based on page and scroll position
  const getContextualCTA = useMemo(() => {
    if (isAuthenticated) return null;
    
    const ctaVariations = {
      '/': isScrolled ? 'Start Free Trial' : 'Try Free',
      '/pricing': 'Start Free Trial',
      '/how-it-works': 'Get Started Free',
      default: 'Try Hook Line Studio'
    };

    return ctaVariations[location as keyof typeof ctaVariations] || ctaVariations.default;
  }, [location, isScrolled, isAuthenticated]);

  // Trust signals that rotate based on scroll position
  const getTrustSignal = useMemo(() => {
    const signals = [
      { icon: Users, text: "1,200+ creators", color: "text-blue-600" },
      { icon: Star, text: "4.8/5 rating", color: "text-yellow-600" },
      { icon: Shield, text: "SSL secured", color: "text-green-600" },
      { icon: Clock, text: "30s generation", color: "text-purple-600" }
    ];
    
    return signals[Math.floor(Date.now() / 3000) % signals.length];
  }, [isScrolled]);

  return (
    <>
      {/* Skip Links for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>

      {/* Urgency Banner */}
      {showUrgencyBanner && !isAuthenticated && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 text-center relative">
          <div className="flex items-center justify-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">Limited Beta Access:</span>
            <span>247 creators joined this week</span>
            <Badge className="bg-white/20 text-white border-white/30 ml-2">
              Free Trial
            </Badge>
          </div>
          <button
            onClick={() => setShowUrgencyBanner(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white"
            aria-label="Close banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <nav 
        id="navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          showUrgencyBanner ? 'top-10' : 'top-0'
        } ${
          isScrolled 
            ? 'bg-white/98 backdrop-blur-xl shadow-lg border-b border-slate-200/80 py-2' 
            : 'bg-white/95 backdrop-blur-md py-3'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
      <Container>
        <div className="flex items-center justify-between">
          {/* Logo with Enhanced Branding */}
          <Link 
            href="/" 
            className="group flex items-center gap-3 focus-visible touch-target"
            aria-label="Hook Line Studio - Go to homepage"
          >
            <div className="relative">
              <img 
                src={LOGO_URL} 
                alt="Hook Line Studio" 
                className="w-10 h-10 lg:w-12 lg:h-12 object-contain transition-all duration-300 group-hover:scale-105"
                role="img"
                loading="eager"
                decoding="async"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-brass/20 to-navy/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-bold text-xl text-navy group-hover:text-brass transition-colors duration-300">
                Hook Line Studio
              </span>
              {isScrolled && (
                <div className="text-xs text-slate-500">AI Hook Generator</div>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links with Progressive Disclosure */}
          <div className="hidden lg:flex items-center gap-6" role="menubar" aria-label="Main menu">
            
            {/* Trust Signal (rotating) */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5 border border-slate-200">
              <getTrustSignal.icon className={`w-4 h-4 ${getTrustSignal.color}`} />
              <span className="text-sm font-medium text-slate-700">{getTrustSignal.text}</span>
            </div>

            <button 
              onClick={() => scrollToSection('how-it-works')}
              className={`relative text-base font-medium text-slate-700 hover:text-navy transition-all duration-300 px-3 py-2 rounded-lg hover:bg-slate-50 group ${
                location === '/' ? 'text-navy' : ''
              }`}
              aria-label="Learn how Hook Line Studio works"
              role="menuitem"
            >
              How it works
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-brass to-navy transition-all duration-300 group-hover:w-full group-hover:left-0" aria-hidden="true"></span>
            </button>

            <Link 
              href="/pricing"
              className={`relative text-base font-medium text-slate-700 hover:text-navy transition-all duration-300 px-3 py-2 rounded-lg hover:bg-slate-50 group ${
                location === '/pricing' ? 'text-navy bg-slate-50' : ''
              }`}
              aria-label="View pricing plans"
              role="menuitem"
            >
              Pricing
              <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-brass to-navy transition-all duration-300 group-hover:w-full group-hover:left-0" aria-hidden="true"></span>
              {location === '/pricing' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-brass to-navy" aria-hidden="true"></span>
              )}
            </Link>

            {/* Platform Indicators */}
            <div className="flex items-center gap-1 bg-slate-50 rounded-full px-3 py-1.5 border border-slate-200">
              <SiTiktok className="w-3 h-3 text-slate-600" />
              <SiInstagram className="w-3 h-3 text-slate-600" />
              <SiYoutube className="w-3 h-3 text-slate-600" />
              <span className="text-xs text-slate-600 ml-1">Supported</span>
            </div>

            {isAuthenticated && (
              <Link 
                href="/app"
                className={`relative text-base font-medium text-slate-700 hover:text-navy transition-all duration-300 px-3 py-2 rounded-lg hover:bg-slate-50 group ${
                  location === '/app' ? 'text-navy bg-slate-50' : ''
                }`}
                aria-label="Go to hook creation app"
                role="menuitem"
              >
                Create Hooks
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-brass to-navy transition-all duration-300 group-hover:w-full group-hover:left-0" aria-hidden="true"></span>
                {location === '/app' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-brass to-navy" aria-hidden="true"></span>
                )}
              </Link>
            )}
          </div>

          {/* Desktop CTA Buttons with Context Awareness */}
          {!isAuthenticated && (
            <div className="hidden lg:flex items-center gap-3">
              
              {/* Secondary Actions */}
              <div className="flex items-center gap-2">
                {/* Security Badge */}
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Shield className="w-3 h-3 text-green-600" />
                  <span>Secure</span>
                </div>

                {/* Login Button */}
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:border-navy hover:text-navy hover:bg-slate-50 rounded-xl font-medium px-4 py-2 transition-all duration-300"
                  onClick={() => window.location.href = '/auth'}
                  aria-label="Log in to your existing account"
                >
                  Log In
                </Button>
              </div>
              
              {/* Primary CTA with Context Awareness */}
              <div className="relative">
                {/* Urgency indicator */}
                {isScrolled && (
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
                
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-navy to-navy/90 hover:from-navy hover:to-navy text-white rounded-xl font-semibold px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                  onClick={() => window.location.href = '/onboarding'}
                  aria-label="Try Hook Line Studio for free - no credit card required"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {getContextualCTA}
                    <Sparkles className="w-4 h-4 text-brass" aria-hidden="true" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brass to-brass/90 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" aria-hidden="true"></div>
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Navigation with Enhanced Features */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Mobile Trust Signal */}
            {!isAuthenticated && (
              <div className="flex items-center gap-1 bg-slate-50 rounded-full px-2 py-1 border border-slate-200">
                <Star className="w-3 h-3 text-yellow-600" />
                <span className="text-xs text-slate-600">4.8★</span>
              </div>
            )}

            {/* Mobile CTA */}
            {!isAuthenticated && (
              <Button 
                size="sm"
                className="bg-gradient-to-r from-navy to-navy/90 text-white rounded-xl font-semibold px-3 py-2 shadow-md hover:shadow-lg transition-all duration-300 relative"
                onClick={() => window.location.href = '/onboarding'}
                aria-label="Try Hook Line Studio for free"
              >
                <span className="flex items-center gap-1">
                  Try Free
                  <Zap className="w-3 h-3" />
                </span>
              </Button>
            )}
            
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:border-navy hover:text-navy hover:bg-slate-50 rounded-xl p-2 transition-all duration-300"
                  aria-label="Open navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              
              <SheetContent 
                side="right" 
                className="w-[340px] bg-white/98 backdrop-blur-xl border-l border-slate-200" 
                id="mobile-menu" 
                aria-label="Mobile navigation menu"
              >
                <div className="flex flex-col h-full">
                  
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between mb-6 pt-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={LOGO_URL} 
                        alt="Hook Line Studio Logo" 
                        className="w-8 h-8 object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="font-heading font-bold text-lg text-navy">
                        Hook Line Studio
                      </span>
                    </div>
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-700 hover:border-navy hover:text-navy rounded-xl p-2"
                        aria-label="Close navigation menu"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </SheetClose>
                  </div>

                  {/* Trust Signals */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-sm font-semibold text-navy">1,200+</div>
                      <div className="text-xs text-slate-600">Creators</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <Star className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                      <div className="text-sm font-semibold text-navy">4.8★</div>
                      <div className="text-xs text-slate-600">Rating</div>
                    </div>
                  </div>

                  {/* Platform Support */}
                  <div className="mb-6">
                    <div className="text-sm font-medium text-slate-700 mb-3">Supported Platforms</div>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1">
                        <SiTiktok className="w-4 h-4" />
                        <span className="text-sm text-slate-700">TikTok</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1">
                        <SiInstagram className="w-4 h-4 text-pink-600" />
                        <span className="text-sm text-slate-700">IG</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1">
                        <SiYoutube className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-slate-700">YT</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col gap-2 mb-6" role="menu" aria-label="Mobile navigation menu">
                    <button 
                      onClick={() => handleMobileNavigation(() => scrollToSection('how-it-works'))}
                      className="text-left text-lg font-medium text-slate-700 hover:text-navy hover:bg-slate-50 transition-all duration-300 rounded-xl px-4 py-3"
                      aria-label="Learn how Hook Line Studio works"
                      role="menuitem"
                    >
                      How it works
                    </button>
                    <Link 
                      href="/pricing"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-slate-700 hover:text-navy hover:bg-slate-50 transition-all duration-300 rounded-xl px-4 py-3 block"
                      aria-label="View pricing plans"
                      role="menuitem"
                    >
                      Pricing
                    </Link>
                    {isAuthenticated && (
                      <Link 
                        href="/app"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-lg font-medium text-slate-700 hover:text-navy hover:bg-slate-50 transition-all duration-300 rounded-xl px-4 py-3 block"
                        aria-label="Go to hook creation app"
                        role="menuitem"
                      >
                        Create Hooks
                      </Link>
                    )}
                    {!isAuthenticated && (
                      <Link 
                        href="/auth"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-lg font-medium text-slate-700 hover:text-navy hover:bg-slate-50 transition-all duration-300 rounded-xl px-4 py-3 block"
                        aria-label="Log in to your existing account"
                        role="menuitem"
                      >
                        Log In
                      </Link>
                    )}
                  </nav>
                  
                  {/* Mobile Menu Footer with Enhanced CTA */}
                  <div className="mt-auto mb-6">
                    <div className="bg-gradient-to-r from-navy/5 to-brass/5 rounded-xl p-4 space-y-4">
                      
                      {/* Security & Trust */}
                      <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-green-600" />
                          <span>SSL Secured</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-600" />
                          <span>No Credit Card</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-slate-600 mb-3">
                          Ready to create engaging hooks?
                        </p>
                        <Button 
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            window.location.href = '/onboarding';
                          }}
                          className="w-full bg-gradient-to-r from-navy to-navy/90 text-white rounded-xl font-semibold py-3 relative overflow-hidden group"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            Get Started Free
                            <ArrowRight className="w-4 h-4" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-brass to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" aria-hidden="true"></div>
                        </Button>
                        
                        <p className="text-xs text-slate-500 mt-2">
                          Join 247 creators who signed up this week
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </nav>
    </>
  );
}