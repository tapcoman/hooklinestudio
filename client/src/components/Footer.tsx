import { Link } from 'wouter';
import { Container } from './Container';

export function Footer() {
  return (
    <footer className="py-16 bg-navy text-white">
      <Container>
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/assets/logo.png" 
                alt="Hook Line Studio Logo" 
                className="w-8 h-8 object-contain opacity-90"
              />
              <h3 className="text-xl font-heading font-bold">
                Hook Line Studio
              </h3>
            </div>
            <p className="text-white/70 text-small">
              AI-powered hook generation for creators who want to open strong, every time.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Product</h4>
            <div className="space-y-2 text-small">
              <Link href="/app" className="block text-white/70 hover:text-white transition-colors">
                Hook Generator
              </Link>
              <Link href="/pricing" className="block text-white/70 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/features" className="block text-white/70 hover:text-white transition-colors">
                Features
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Company</h4>
            <div className="space-y-2 text-small">
              <Link href="/about" className="block text-white/70 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/blog" className="block text-white/70 hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/contact" className="block text-white/70 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Legal</h4>
            <div className="space-y-2 text-small">
              <Link href="/privacy" className="block text-white/70 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-white/70 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="block text-white/70 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="text-white/70 text-small">
            © 2025 Hook Line Studio. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}