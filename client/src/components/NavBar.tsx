import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { Container } from './Container';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
// Logo from public directory
const logoUrl = "/assets/logo.png";

interface NavBarProps {
  onShowModal?: () => void;
}

export function NavBar({ onShowModal }: NavBarProps = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useFirebaseAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-background/95 backdrop-blur-md shadow-editorial h-14 border-b border-line/50' 
            : 'bg-transparent h-16'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
      <Container>
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link 
            href="/" 
            className="group flex-shrink-0 focus-visible touch-target"
            aria-label="Hook Line Studio - Go to homepage"
          >
            <img 
              src={logoUrl} 
              alt="Hook Line Studio - Your AI-powered hook generator" 
              className="w-12 h-12 lg:w-16 lg:h-16 object-contain group-hover:opacity-80 transition-opacity"
              role="img"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8" role="menubar" aria-label="Main menu">
            <button 
              onClick={() => scrollToSection('how-it-works')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  scrollToSection('how-it-works');
                }
              }}
              className={`text-sm xl:text-base text-navy hover:text-brass transition-colors relative group focus-visible rounded-sm px-2 py-1 touch-target ${
                location === '/' ? 'font-medium' : ''
              }`}
              aria-label="Learn how Hook Line Studio works"
              role="menuitem"
            >
              How it works
              {location === '/' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-brass" aria-hidden="true"></span>
              )}
              <span className="sr-only">{location === '/' ? ' - current page' : ''}</span>
            </button>
            <Link 
              href="/pricing"
              className={`text-sm xl:text-base text-navy hover:text-brass transition-colors relative group focus-visible rounded-sm px-2 py-1 touch-target ${
                location === '/pricing' ? 'font-medium' : ''
              }`}
              aria-label="View pricing plans"
              role="menuitem"
            >
              Pricing
              {location === '/pricing' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-brass" aria-hidden="true"></span>
              )}
              <span className="sr-only">{location === '/pricing' ? ' - current page' : ''}</span>
            </Link>
            {isAuthenticated && (
              <Link 
                href="/app"
                className={`text-sm xl:text-base text-navy hover:text-brass transition-colors relative group focus-visible rounded-sm px-2 py-1 touch-target ${
                  location === '/app' ? 'font-medium' : ''
                }`}
                aria-label="Go to hook creation app"
                role="menuitem"
              >
                Create Hooks
                {location === '/app' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-brass" aria-hidden="true"></span>
                )}
                <span className="sr-only">{location === '/app' ? ' - current page' : ''}</span>
              </Link>
            )}
          </div>

          {/* Desktop CTA Buttons - Only show for non-authenticated users */}
          {!isAuthenticated && (
            <div className="hidden lg:flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {/* Login Button for existing users */}
              <Button 
                variant="outline"
                size="sm"
                className="border-navy text-navy hover:bg-navy/5 rounded-button focus-visible px-3 py-1.5 touch-target"
                onClick={() => window.location.href = '/auth'}
                aria-label="Log in to your existing account"
              >
                <span className="text-sm font-medium">Log In</span>
              </Button>
              
              {/* Primary CTA Button */}
              <Button 
                size="sm"
                className="bg-navy hover:bg-navy/90 text-white rounded-button focus-visible relative overflow-hidden group px-3 py-1.5 lg:px-4 lg:py-2 touch-target"
                onClick={() => window.location.href = '/onboarding'}
                aria-label="Try Hook Line Studio for free - no credit card required"
              >
                <span className="relative z-10 flex items-center text-sm font-medium whitespace-nowrap">
                  Try Free
                  <div className="ml-1 lg:ml-2 w-2 h-2 bg-brass rounded-full animate-pulse" aria-hidden="true"></div>
                </span>
                <div className="absolute inset-0 bg-brass transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" aria-hidden="true"></div>
              </Button>
            </div>
          )}

          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile CTA - Show for non-authenticated users */}
            {!isAuthenticated && (
              <Button 
                size="sm"
                className="bg-navy hover:bg-navy/90 text-white rounded-button focus-visible px-3 py-1.5 touch-target"
                onClick={() => window.location.href = '/onboarding'}
                aria-label="Try Hook Line Studio for free - no credit card required"
              >
                <span className="text-sm font-medium">Try Free</span>
              </Button>
            )}
            
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-navy text-navy hover:bg-navy/5 focus-visible p-2 touch-target"
                  aria-label="Open navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[300px]" id="mobile-menu" aria-label="Mobile navigation menu">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between mb-6">
                    <img 
                      src={logoUrl} 
                      alt="Hook Line Studio Logo" 
                      className="w-10 h-10 object-contain"
                    />
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-2 touch-target focus-visible"
                        aria-label="Close navigation menu"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </SheetClose>
                  </div>

                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col space-y-4 mb-8" role="menu" aria-label="Mobile navigation menu">
                    <button 
                      onClick={() => handleMobileNavigation(() => scrollToSection('how-it-works'))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMobileNavigation(() => scrollToSection('how-it-works'));
                        }
                      }}
                      className="text-left text-lg text-navy hover:text-brass transition-colors focus-visible rounded-sm p-2 touch-target"
                      aria-label="Learn how Hook Line Studio works"
                      role="menuitem"
                    >
                      How it works
                    </button>
                    <Link 
                      href="/pricing"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg text-navy hover:text-brass transition-colors focus-visible rounded-sm p-2 touch-target block"
                      aria-label="View pricing plans"
                      role="menuitem"
                    >
                      Pricing
                    </Link>
                    {isAuthenticated && (
                      <Link 
                        href="/app"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-lg text-navy hover:text-brass transition-colors focus-visible rounded-sm p-2 touch-target block"
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
                        className="text-lg text-navy hover:text-brass transition-colors focus-visible rounded-sm p-2 touch-target block"
                        aria-label="Log in to your existing account"
                        role="menuitem"
                      >
                        Log In
                      </Link>
                    )}
                  </nav>
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