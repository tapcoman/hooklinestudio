import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { useReducedMotionSafe } from '../hooks/useReducedMotionSafe';

interface CTABandProps {
  onShowModal: () => void;
}

export function CTABand({ onShowModal }: CTABandProps) {
  const prefersReducedMotion = useReducedMotionSafe();

  return (
    <section className="py-20 bg-background relative overflow-hidden" aria-labelledby="final-cta-heading">
      
      
      <Container>
        <Reveal>
          <div className="text-center space-y-8 relative">
            <div className="relative inline-block">
              <h2 id="final-cta-heading" className="text-h1 lg:text-5xl font-heading font-bold text-navy">
                Ready to win the first 2 seconds?
              </h2>
            </div>
            
            <p className="text-xl text-slate max-w-2xl mx-auto leading-relaxed">
              Join 1,200+ creators already using framework-backed hooks to capture attention from the first second.
            </p>
            
            <div className="relative inline-block">
              <Button 
                size="lg" 
                className={`text-lg px-12 py-6 bg-navy hover:bg-navy/90 text-white rounded-button transition-all duration-120 hover:scale-102 focus-visible:outline-2 focus-visible:ring-2 focus-visible:ring-brass/60 relative overflow-hidden ${!prefersReducedMotion ? 'hover:animate-sheen' : ''}`}
                onClick={onShowModal}
                aria-label="Try Hook Line Studio for free - no credit card required"
                aria-describedby="cta-benefits"
                style={{
                  background: !prefersReducedMotion 
                    ? 'linear-gradient(45deg, var(--navy) 30%, var(--brass) 50%, var(--navy) 70%)'
                    : undefined,
                  backgroundSize: !prefersReducedMotion ? '200% 100%' : undefined,
                  backgroundPosition: !prefersReducedMotion ? '-100%' : undefined,
                }}
              >
                Try Free
                <ArrowRight className="ml-3 w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
            
            <p id="cta-benefits" className="text-small text-slate">
              Free forever plan • No credit card • Join 1,200+ creators
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}