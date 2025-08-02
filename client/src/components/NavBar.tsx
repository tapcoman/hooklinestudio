import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { Container } from './Container';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, X, Sparkles } from 'lucide-react';

// Constants
const LOGO_URL = "/assets/logo.png";
const SCROLL_THRESHOLD = 10;
const SCROLL_DEBOUNCE_MS = 10;

interface NavBarProps {
  onShowModal?: () => void;
}

export function NavBar({ onShowModal }: NavBarProps = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  return (
    <>
      {/* Skip Links for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      
      <nav 
        id="navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-slate-200/50 py-3' 
            : 'bg-transparent py-4'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
      <Container>
        <div className="flex items-center justify-between">
          {/* Logo */}
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
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8" role="menubar" aria-label="Main menu">
            <button 
              onClick={() => scrollToSection('how-it-works')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  scrollToSection('how-it-works');
                }
              }}
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

          {/* Desktop CTA Buttons - Only show for non-authenticated users */}
          {!isAuthenticated && (
            <div className="hidden lg:flex items-center gap-4">
              {/* Login Button for existing users */}
              <Button 
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700 hover:border-navy hover:text-navy hover:bg-slate-50 rounded-xl font-medium px-5 py-2.5 transition-all duration-300"
                onClick={() => window.location.href = '/auth'}
                aria-label="Log in to your existing account"
              >
                Log In
              </Button>
              
              {/* Primary CTA Button */}
              <Button 
                size="sm"
                className="bg-gradient-to-r from-navy to-navy/90 hover:from-navy hover:to-navy text-white rounded-xl font-semibold px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                onClick={() => window.location.href = '/onboarding'}
                aria-label="Try Hook Line Studio for free - no credit card required"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Try Free
                  <Sparkles className="w-4 h-4 text-brass" aria-hidden="true" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-brass to-brass/90 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" aria-hidden="true"></div>
              </Button>
            </div>
          )}

          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Mobile CTA - Show for non-authenticated users */}
            {!isAuthenticated && (
              <Button 
                size="sm"
                className="bg-gradient-to-r from-navy to-navy/90 text-white rounded-xl font-semibold px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => window.location.href = '/onboarding'}
                aria-label="Try Hook Line Studio for free - no credit card required"
              >
                Try Free
              </Button>
            )}
            
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:border-navy hover:text-navy hover:bg-slate-50 rounded-xl p-2.5 transition-all duration-300"
                  aria-label="Open navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] bg-white/95 backdrop-blur-xl border-l border-slate-200" id="mobile-menu" aria-label="Mobile navigation menu">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between mb-8 pt-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={LOGO_URL} 
                        alt="Hook Line Studio Logo" 
                        className="w-10 h-10 object-contain"
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
                        className="border-slate-300 text-slate-700 hover:border-navy hover:text-navy rounded-xl p-2.5"
                        aria-label="Close navigation menu"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </SheetClose>
                  </div>

                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col gap-2 mb-8" role="menu" aria-label="Mobile navigation menu">
                    <button 
                      onClick={() => handleMobileNavigation(() => scrollToSection('how-it-works'))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMobileNavigation(() => scrollToSection('how-it-works'));
                        }
                      }}
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
                  
                  {/* Mobile Menu Footer */}
                  <div className="mt-auto mb-6">
                    <div className="bg-gradient-to-r from-navy/5 to-brass/5 rounded-xl p-4">
                      <p className="text-sm text-slate-600 mb-3">
                        Ready to create engaging hooks?
                      </p>
                      <Button 
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = '/onboarding';
                        }}
                        className="w-full bg-gradient-to-r from-navy to-navy/90 text-white rounded-xl font-semibold py-3"
                      >
                        Get Started Free
                      </Button>
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