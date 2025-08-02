import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface HookCardProps {
  hook: string;
  framework: string;
  rationale: string;
  score?: number;
  isDemo?: boolean;
}

export function HookCard({ hook, framework, rationale, score, isDemo = false }: HookCardProps) {
  return (
    <article className="p-4 bg-white rounded-button border border-line hover:shadow-editorial hover:scale-101 transition-all duration-120 focus-within:ring-2 focus-within:ring-brass/60 focus-within:ring-offset-2" role="article" aria-label={`Hook: ${hook}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="font-medium text-navy leading-relaxed flex-1" role="heading" aria-level={4}>
          "{hook}"
        </p>
        {score && (
          <div className="flex items-center space-x-1 ml-4" role="group" aria-label={`Score: ${score} out of 5 stars`}>
            <Star className="w-4 h-4 text-brass fill-current" aria-hidden="true" />
            <span className="text-small font-medium text-navy">{score}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-small">
          <Badge variant="secondary" className="bg-brass/20 text-navy border-0" role="note" aria-label={`Framework: ${framework}`}>
            {framework}
          </Badge>
          <span className="text-slate" aria-label={`Rationale: ${rationale}`}>{rationale}</span>
        </div>
        
        {!isDemo && (
          <div className="flex space-x-2" role="group" aria-label="Hook actions">
            <Button 
              size="sm" 
              className="bg-navy text-white hover:bg-navy/90 rounded-button focus-visible"
              aria-label={`Save hook: ${hook}`}
            >
              Save
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-navy text-navy hover:bg-navy hover:text-white rounded-button focus-visible"
              aria-label={`Export hook: ${hook}`}
            >
              Export
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}