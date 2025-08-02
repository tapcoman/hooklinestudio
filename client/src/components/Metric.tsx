import { LucideIcon } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';

interface MetricProps {
  icon: LucideIcon;
  value: string;
  label: string;
  numericValue?: number;
}

export function Metric({ icon: Icon, value, label, numericValue }: MetricProps) {
  const { count, ref } = useCountUp({ 
    end: numericValue || 0, 
    duration: 1000 
  });

  const displayValue = numericValue ? `${count}${value.replace(/\d+/g, '')}` : value;

  return (
    <div className="text-center group">
      <div className="w-16 h-16 bg-brass/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-8 h-8 text-brass" strokeWidth={1.75} />
      </div>
      <h3 
        ref={ref}
        className="text-h2 font-heading font-bold text-navy mb-2"
      >
        {displayValue}
      </h3>
      <p className="text-slate">
        {label}
      </p>
    </div>
  );
}