import { Card, CardContent } from '@/components/ui/card';

interface TestimonialProps {
  quote: string;
  author: string;
  initial: string;
  gradientFrom: string;
  gradientTo: string;
}

export function Testimonial({ quote, author, initial, gradientFrom, gradientTo }: TestimonialProps) {
  return (
    <Card className="shadow-editorial border-2 border-line bg-card rounded-card hover:shadow-xl hover:scale-101 transition-all duration-120 focus-within:ring-2 focus-within:ring-brass/60 focus-within:ring-offset-2" role="article" aria-label={`Testimonial from ${author}`}>
      <CardContent className="p-8">
        <div className="flex items-start space-x-4">
          <div 
            className={`w-12 h-12 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full flex items-center justify-center text-white font-semibold`}
            aria-label={`Avatar for ${author}`}
            role="img"
          >
            {initial}
          </div>
          <div>
            <blockquote className="text-navy mb-4 leading-relaxed" cite={author}>
              "{quote}"
            </blockquote>
            <cite className="text-small text-slate font-medium not-italic">
              {author}
            </cite>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}