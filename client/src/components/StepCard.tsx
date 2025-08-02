import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StepCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  step: number;
}

export function StepCard({ icon: Icon, title, description, step }: StepCardProps) {
  return (
    <Card className="shadow-editorial border-2 border-line bg-card rounded-card hover:shadow-xl hover:scale-101 transition-all duration-120 group focus-within:ring-2 focus-within:ring-brass/60 focus-within:ring-offset-2" role="article" aria-labelledby={`step-${step}-title`}>
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-brass rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform" aria-hidden="true">
          <Icon className="w-8 h-8 text-navy" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h3 id={`step-${step}-title`} className="text-h3 font-heading font-semibold text-navy mb-4">
          <span className="sr-only">Step </span>{step}. {title}
        </h3>
        <p className="text-slate leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}